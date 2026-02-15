package provisioning

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"math"
	"net/http"
	"strings"
	"time"

	"github.com/adiecho/echobilling/internal/app"
	"github.com/google/uuid"
	"github.com/hibiken/asynq"
	"github.com/jackc/pgx/v5/pgxpool"
)

type TaskHandler struct {
	pool             *pgxpool.Pool
	store            *app.SettingsStore
	notifyHTTPClient *http.Client
}

func NewTaskHandler(pool *pgxpool.Pool, cfg *app.Config, store *app.SettingsStore) *TaskHandler {
	timeout := cfg.NotificationTimeout
	if timeout <= 0 {
		timeout = 5 * time.Second
	}

	return &TaskHandler{
		pool:             pool,
		store:            store,
		notifyHTTPClient: &http.Client{Timeout: timeout},
	}
}

// HandleProvisionVPS 处理 VPS 开通任务
func (h *TaskHandler) HandleProvisionVPS(ctx context.Context, t *asynq.Task) error {
	var payload ProvisionVPSPayload
	if err := json.Unmarshal(t.Payload(), &payload); err != nil {
		return fmt.Errorf("failed to unmarshal payload: %w", err)
	}

	log.Printf("开始开通 VPS: service_id=%s, order_id=%s", payload.ServiceID, payload.OrderID)

	_, err := h.pool.Exec(ctx, `
		UPDATE provisioning_jobs
		SET status = 'running',
		    started_at = NOW(),
		    attempts = attempts + 1,
		    updated_at = NOW()
		WHERE id = (
			SELECT id
			FROM provisioning_jobs
			WHERE service_id = $1
			ORDER BY created_at DESC
			LIMIT 1
		)
	`, payload.ServiceID)
	if err != nil {
		return fmt.Errorf("failed to update provisioning job status: %w", err)
	}

	log.Printf("正在配置 VPS 资源...")
	time.Sleep(1 * time.Second)
	log.Printf("正在分配 IP 地址...")
	time.Sleep(500 * time.Millisecond)
	log.Printf("正在安装操作系统...")
	time.Sleep(500 * time.Millisecond)

	hostname := fmt.Sprintf("vps-%s.example.com", payload.ServiceID[:8])
	ipAddress := fmt.Sprintf("192.168.%d.%d",
		(time.Now().Unix()%254)+1,
		(time.Now().Unix()%254)+1)

	_, err = h.pool.Exec(ctx, `
		UPDATE services
		SET status = 'active',
		    hostname = $1,
		    ip_address = $2,
		    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
		        'activated_at', NOW(),
		        'provisioning_source', 'worker'
		    ),
		    updated_at = NOW()
		WHERE id = $3
	`, hostname, ipAddress, payload.ServiceID)
	if err != nil {
		_, _ = h.pool.Exec(ctx, `
			UPDATE provisioning_jobs
			SET status = 'failed',
			    last_error = $2,
			    completed_at = NOW(),
			    updated_at = NOW()
			WHERE id = (
				SELECT id
				FROM provisioning_jobs
				WHERE service_id = $1
				ORDER BY created_at DESC
				LIMIT 1
			)
		`, payload.ServiceID, err.Error())
		return fmt.Errorf("failed to update service status: %w", err)
	}

	_, err = h.pool.Exec(ctx, `
		UPDATE provisioning_jobs
		SET status = 'completed',
		    completed_at = NOW(),
		    updated_at = NOW()
		WHERE id = (
			SELECT id
			FROM provisioning_jobs
			WHERE service_id = $1
			ORDER BY created_at DESC
			LIMIT 1
		)
	`, payload.ServiceID)
	if err != nil {
		return fmt.Errorf("failed to update provisioning job: %w", err)
	}

	_, err = h.pool.Exec(ctx, `
		UPDATE orders
		SET status = 'active',
		    updated_at = NOW()
		WHERE id = $1
	`, payload.OrderID)
	if err != nil {
		return fmt.Errorf("failed to update order status: %w", err)
	}

	log.Printf("VPS 开通完成: hostname=%s, ip=%s", hostname, ipAddress)
	return nil
}

// HandleSuspendVPS 处理 VPS 暂停任务
func (h *TaskHandler) HandleSuspendVPS(ctx context.Context, t *asynq.Task) error {
	var payload SuspendVPSPayload
	if err := json.Unmarshal(t.Payload(), &payload); err != nil {
		return fmt.Errorf("failed to unmarshal payload: %w", err)
	}

	log.Printf("暂停 VPS: service_id=%s, reason=%s", payload.ServiceID, payload.Reason)

	_, err := h.pool.Exec(ctx, `
		UPDATE services
		SET status = 'suspended',
		    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
		        'suspended_at', NOW(),
		        'suspend_reason', $2
		    ),
		    updated_at = NOW()
		WHERE id = $1
	`, payload.ServiceID, payload.Reason)
	if err != nil {
		return fmt.Errorf("failed to suspend service: %w", err)
	}

	log.Printf("VPS 已暂停: service_id=%s", payload.ServiceID)
	return nil
}

// HandleTerminateVPS 处理 VPS 终止任务
func (h *TaskHandler) HandleTerminateVPS(ctx context.Context, t *asynq.Task) error {
	var payload TerminateVPSPayload
	if err := json.Unmarshal(t.Payload(), &payload); err != nil {
		return fmt.Errorf("failed to unmarshal payload: %w", err)
	}

	log.Printf("终止 VPS: service_id=%s", payload.ServiceID)

	_, err := h.pool.Exec(ctx, `
		UPDATE services
		SET status = 'terminated',
		    cancelled_at = COALESCE(cancelled_at, NOW()),
		    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('terminated_at', NOW()),
		    updated_at = NOW()
		WHERE id = $1
	`, payload.ServiceID)
	if err != nil {
		return fmt.Errorf("failed to terminate service: %w", err)
	}

	log.Printf("VPS 已终止: service_id=%s", payload.ServiceID)
	return nil
}

// HandleRenewalReminder 处理续费提醒任务
func (h *TaskHandler) HandleRenewalReminder(ctx context.Context, t *asynq.Task) error {
	var payload RenewalReminderPayload
	if len(t.Payload()) > 0 {
		if err := json.Unmarshal(t.Payload(), &payload); err != nil {
			return fmt.Errorf("failed to unmarshal payload: %w", err)
		}
	}

	if payload.ServiceID == "" || payload.UserID == "" {
		return h.sendBatchRenewalReminders(ctx)
	}

	if payload.DaysLeft <= 0 {
		payload.DaysLeft = 1
	}

	return h.sendSingleRenewalReminder(ctx, payload)
}

func (h *TaskHandler) sendBatchRenewalReminders(ctx context.Context) error {
	rows, err := h.pool.Query(ctx, `
		SELECT id, user_id::text, expires_at
		FROM services
		WHERE status = 'active'
		  AND expires_at IS NOT NULL
		  AND expires_at > NOW()
		  AND expires_at <= NOW() + INTERVAL '8 days'
	`)
	if err != nil {
		return fmt.Errorf("failed to query expiring services: %w", err)
	}
	defer rows.Close()

	now := time.Now()
	errs := make([]string, 0)
	for rows.Next() {
		var (
			serviceID string
			userID    string
			expiresAt time.Time
		)
		if err := rows.Scan(&serviceID, &userID, &expiresAt); err != nil {
			return fmt.Errorf("failed to read expiring service: %w", err)
		}

		daysLeft := daysUntil(expiresAt, now)
		if !isReminderDay(daysLeft) {
			continue
		}

		sentToday, err := h.reminderAlreadySentToday(ctx, serviceID, daysLeft)
		if err != nil {
			errs = append(errs, err.Error())
			continue
		}
		if sentToday {
			continue
		}

		if err := h.sendSingleRenewalReminder(ctx, RenewalReminderPayload{
			ServiceID: serviceID,
			UserID:    userID,
			DaysLeft:  daysLeft,
		}); err != nil {
			errs = append(errs, err.Error())
		}
	}
	if err := rows.Err(); err != nil {
		return fmt.Errorf("failed to iterate expiring services: %w", err)
	}

	if len(errs) > 0 {
		return errors.New(strings.Join(errs, "; "))
	}

	return nil
}

func (h *TaskHandler) sendSingleRenewalReminder(ctx context.Context, payload RenewalReminderPayload) error {
	log.Printf("发送续费提醒: service_id=%s, user_id=%s, days_left=%d",
		payload.ServiceID, payload.UserID, payload.DaysLeft)

	sent, channel, notifyErr := h.sendRenewalWebhook(ctx, payload)

	action := "renewal_reminder_sent"
	if notifyErr != nil {
		action = "renewal_reminder_failed"
	}

	detailsMap := map[string]interface{}{
		"service_id": payload.ServiceID,
		"days_left":  payload.DaysLeft,
		"channel":    channel,
		"sent":       sent,
	}
	if notifyErr != nil {
		detailsMap["error"] = notifyErr.Error()
	}
	details, _ := json.Marshal(detailsMap)

	var userID interface{}
	if payload.UserID != "" {
		userID = payload.UserID
	}
	var entityID interface{}
	if payload.ServiceID != "" {
		entityID = payload.ServiceID
	}

	_, err := h.pool.Exec(ctx, `
		INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values, ip_address, user_agent, created_at)
		VALUES ($1, $2, 'service', $3, $4, 'worker', 'asynq-worker', NOW())
	`, userID, action, entityID, details)
	if err != nil {
		return fmt.Errorf("failed to persist renewal reminder event: %w", err)
	}

	if notifyErr != nil {
		return fmt.Errorf("failed to send external renewal notification: %w", notifyErr)
	}

	log.Printf("续费提醒已发送: service_id=%s", payload.ServiceID)
	return nil
}

func (h *TaskHandler) sendRenewalWebhook(ctx context.Context, payload RenewalReminderPayload) (bool, string, error) {
	webhookURL := h.store.Get("renewal_webhook_url")
	if webhookURL == "" {
		return false, "audit_log_only", nil
	}

	body, err := json.Marshal(map[string]interface{}{
		"event":      "renewal_reminder",
		"service_id": payload.ServiceID,
		"user_id":    payload.UserID,
		"days_left":  payload.DaysLeft,
		"sent_at":    time.Now().UTC().Format(time.RFC3339),
	})
	if err != nil {
		return false, "external_webhook", err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, webhookURL, bytes.NewReader(body))
	if err != nil {
		return false, "external_webhook", err
	}
	req.Header.Set("Content-Type", "application/json")
	webhookToken := h.store.Get("renewal_webhook_token")
	if webhookToken != "" {
		req.Header.Set("Authorization", "Bearer "+webhookToken)
	}

	// Apply dynamic timeout from settings.
	timeout := h.store.GetDuration("notification_timeout_secs", 5*time.Second)
	h.notifyHTTPClient.Timeout = timeout

	resp, err := h.notifyHTTPClient.Do(req)
	if err != nil {
		return false, "external_webhook", err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return false, "external_webhook", fmt.Errorf("webhook returned status %d", resp.StatusCode)
	}

	return true, "external_webhook", nil
}

func (h *TaskHandler) reminderAlreadySentToday(ctx context.Context, serviceID string, daysLeft int) (bool, error) {
	var exists bool
	err := h.pool.QueryRow(ctx, `
		SELECT EXISTS(
			SELECT 1
			FROM audit_logs
			WHERE action = 'renewal_reminder_sent'
			  AND entity_type = 'service'
			  AND entity_id = $1
			  AND created_at::date = CURRENT_DATE
			  AND COALESCE((new_values->>'days_left')::int, 0) = $2
		)
	`, serviceID, daysLeft).Scan(&exists)
	if err != nil {
		return false, err
	}
	return exists, nil
}

func isReminderDay(daysLeft int) bool {
	return daysLeft == 7 || daysLeft == 3 || daysLeft == 1
}

func daysUntil(future time.Time, now time.Time) int {
	hours := future.Sub(now).Hours()
	if hours <= 0 {
		return 0
	}
	return int(math.Ceil(hours / 24))
}

// HandleGenerateInvoice 处理生成发票任务
func (h *TaskHandler) HandleGenerateInvoice(ctx context.Context, t *asynq.Task) error {
	var payload GenerateInvoicePayload
	if err := json.Unmarshal(t.Payload(), &payload); err != nil {
		return fmt.Errorf("failed to unmarshal payload: %w", err)
	}

	log.Printf("生成续费发票: service_id=%s, user_id=%s", payload.ServiceID, payload.UserID)

	var (
		unitPrice    string
		billingCycle string
		orderID      string
		currency     string
	)
	err := h.pool.QueryRow(ctx, `
		SELECT oi.unit_price::text,
		       oi.billing_cycle::text,
		       oi.order_id::text,
		       o.currency
		FROM services s
		JOIN order_items oi ON oi.id = s.order_item_id
		JOIN orders o ON o.id = oi.order_id
		WHERE s.id = $1
	`, payload.ServiceID).Scan(&unitPrice, &billingCycle, &orderID, &currency)
	if err != nil {
		return fmt.Errorf("failed to get service pricing info: %w", err)
	}

	now := time.Now()
	dueDate := now.AddDate(0, 0, 7)
	switch billingCycle {
	case "monthly":
		dueDate = now.AddDate(0, 1, 0)
	case "quarterly":
		dueDate = now.AddDate(0, 3, 0)
	case "annually":
		dueDate = now.AddDate(1, 0, 0)
	}

	invoiceID := uuid.New().String()
	invoiceNumber := fmt.Sprintf("INV-%s-%s", now.Format("20060102"), uuid.NewString()[:8])

	tx, err := h.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	_, err = tx.Exec(ctx, `
		INSERT INTO invoices (
			id, user_id, order_id, invoice_number, status, subtotal, tax, total, currency, due_date, created_at, updated_at
		)
		VALUES ($1, $2, $3, $4, 'pending', $5, 0, $5, $6, $7, $8, $8)
	`, invoiceID, payload.UserID, orderID, invoiceNumber, unitPrice, currency, dueDate, now)
	if err != nil {
		return fmt.Errorf("failed to create invoice: %w", err)
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price, amount, created_at)
		VALUES ($1, $2, $3, 1, $4, $4, $5)
	`, uuid.New().String(), invoiceID, fmt.Sprintf("Service renewal (%s)", billingCycle), unitPrice, now)
	if err != nil {
		return fmt.Errorf("failed to create invoice item: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("failed to commit invoice tx: %w", err)
	}

	log.Printf("续费发票已生成: invoice_id=%s, amount=%s", invoiceID, unitPrice)
	return nil
}

// HandleExpireService 处理服务过期检查任务
func (h *TaskHandler) HandleExpireService(ctx context.Context, t *asynq.Task) error {
	var payload ExpireServicePayload
	if len(t.Payload()) > 0 {
		if err := json.Unmarshal(t.Payload(), &payload); err != nil {
			return fmt.Errorf("failed to unmarshal payload: %w", err)
		}
	}

	if payload.ServiceID != "" {
		return h.expireSingleService(ctx, payload.ServiceID)
	}

	return h.expireAllServices(ctx)
}

func (h *TaskHandler) expireSingleService(ctx context.Context, serviceID string) error {
	log.Printf("检查单个服务过期状态: service_id=%s", serviceID)

	var (
		expiresAt *time.Time
		status    string
	)
	err := h.pool.QueryRow(ctx, `
		SELECT expires_at, status
		FROM services
		WHERE id = $1
	`, serviceID).Scan(&expiresAt, &status)
	if err != nil {
		return fmt.Errorf("failed to get service info: %w", err)
	}

	if expiresAt == nil {
		return nil
	}

	if time.Now().After(*expiresAt) && status == "active" {
		_, err = h.pool.Exec(ctx, `
			UPDATE services
			SET status = 'suspended',
			    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('expired_at', NOW()),
			    updated_at = NOW()
			WHERE id = $1
		`, serviceID)
		if err != nil {
			return fmt.Errorf("failed to suspend expired service: %w", err)
		}
		log.Printf("过期服务已暂停: service_id=%s", serviceID)
	}

	return nil
}

func (h *TaskHandler) expireAllServices(ctx context.Context) error {
	log.Printf("开始批量检查过期服务")

	rows, err := h.pool.Query(ctx, `
		SELECT id
		FROM services
		WHERE status = 'active'
		  AND expires_at IS NOT NULL
		  AND expires_at <= NOW()
	`)
	if err != nil {
		return fmt.Errorf("failed to query expiring services: %w", err)
	}
	defer rows.Close()

	expiredIDs := make([]string, 0)
	for rows.Next() {
		var serviceID string
		if err := rows.Scan(&serviceID); err != nil {
			return fmt.Errorf("failed to scan expiring service: %w", err)
		}
		expiredIDs = append(expiredIDs, serviceID)
	}
	if err := rows.Err(); err != nil {
		return fmt.Errorf("failed to iterate expiring services: %w", err)
	}

	for _, serviceID := range expiredIDs {
		if err := h.expireSingleService(ctx, serviceID); err != nil {
			log.Printf("暂停过期服务失败: service_id=%s, err=%v", serviceID, err)
		}
	}

	log.Printf("批量过期检查完成: count=%d", len(expiredIDs))
	return nil
}
