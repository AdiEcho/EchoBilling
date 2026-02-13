package provisioning

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/hibiken/asynq"
	"github.com/jackc/pgx/v5/pgxpool"
)

type TaskHandler struct {
	pool *pgxpool.Pool
}

func NewTaskHandler(pool *pgxpool.Pool) *TaskHandler {
	return &TaskHandler{pool: pool}
}

// HandleProvisionVPS 处理 VPS 开通任务
func (h *TaskHandler) HandleProvisionVPS(ctx context.Context, t *asynq.Task) error {
	var payload ProvisionVPSPayload
	if err := json.Unmarshal(t.Payload(), &payload); err != nil {
		return fmt.Errorf("failed to unmarshal payload: %w", err)
	}

	log.Printf("开始开通 VPS: service_id=%s, order_id=%s", payload.ServiceID, payload.OrderID)

	// 更新 provisioning_jobs 状态为 running
	_, err := h.pool.Exec(ctx, `
		UPDATE provisioning_jobs
		SET status = 'running', started_at = NOW()
		WHERE service_id = $1
	`, payload.ServiceID)
	if err != nil {
		return fmt.Errorf("failed to update provisioning job status: %w", err)
	}

	// 模拟 VPS 开通过程
	log.Printf("正在配置 VPS 资源...")
	time.Sleep(1 * time.Second)

	log.Printf("正在分配 IP 地址...")
	time.Sleep(500 * time.Millisecond)

	log.Printf("正在安装操作系统...")
	time.Sleep(500 * time.Millisecond)

	// 生成模拟的主机名和 IP
	hostname := fmt.Sprintf("vps-%s.example.com", payload.ServiceID[:8])
	ipAddress := fmt.Sprintf("192.168.%d.%d",
		(time.Now().Unix()%254)+1,
		(time.Now().Unix()%254)+1)

	// 更新服务状态为 active，设置主机名和 IP
	_, err = h.pool.Exec(ctx, `
		UPDATE services
		SET status = 'active',
		    hostname = $1,
		    ip_address = $2,
		    activated_at = NOW()
		WHERE id = $3
	`, hostname, ipAddress, payload.ServiceID)
	if err != nil {
		// 更新 provisioning_jobs 为 failed
		_, _ = h.pool.Exec(ctx, `
			UPDATE provisioning_jobs
			SET status = 'failed',
			    error_message = $1,
			    completed_at = NOW()
			WHERE service_id = $2
		`, err.Error(), payload.ServiceID)
		return fmt.Errorf("failed to update service status: %w", err)
	}

	// 更新 provisioning_jobs 为 completed
	_, err = h.pool.Exec(ctx, `
		UPDATE provisioning_jobs
		SET status = 'completed', completed_at = NOW()
		WHERE service_id = $1
	`, payload.ServiceID)
	if err != nil {
		return fmt.Errorf("failed to update provisioning job: %w", err)
	}

	// 更新订单状态为 active
	_, err = h.pool.Exec(ctx, `
		UPDATE orders
		SET status = 'active'
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

	// 更新服务状态为 suspended
	_, err := h.pool.Exec(ctx, `
		UPDATE services
		SET status = 'suspended',
		    suspended_at = NOW()
		WHERE id = $1
	`, payload.ServiceID)
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

	// 更新服务状态为 terminated
	_, err := h.pool.Exec(ctx, `
		UPDATE services
		SET status = 'terminated',
		    terminated_at = NOW()
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
	if err := json.Unmarshal(t.Payload(), &payload); err != nil {
		return fmt.Errorf("failed to unmarshal payload: %w", err)
	}

	log.Printf("发送续费提醒: service_id=%s, user_id=%s, days_left=%d",
		payload.ServiceID, payload.UserID, payload.DaysLeft)

	// TODO: 实际发送邮件通知
	// 这里只是记录日志作为占位符
	log.Printf("续费提醒已发送给用户 %s，服务将在 %d 天后到期", payload.UserID, payload.DaysLeft)

	return nil
}

// HandleGenerateInvoice 处理生成发票任务
func (h *TaskHandler) HandleGenerateInvoice(ctx context.Context, t *asynq.Task) error {
	var payload GenerateInvoicePayload
	if err := json.Unmarshal(t.Payload(), &payload); err != nil {
		return fmt.Errorf("failed to unmarshal payload: %w", err)
	}

	log.Printf("生成续费发票: service_id=%s, user_id=%s", payload.ServiceID, payload.UserID)

	// 获取服务信息
	var amount float64
	var billingCycle string
	err := h.pool.QueryRow(ctx, `
		SELECT s.price, s.billing_cycle
		FROM services s
		WHERE s.id = $1
	`, payload.ServiceID).Scan(&amount, &billingCycle)
	if err != nil {
		return fmt.Errorf("failed to get service info: %w", err)
	}

	// 创建续费发票
	invoiceID := uuid.New().String()
	_, err = h.pool.Exec(ctx, `
		INSERT INTO invoices (id, user_id, order_id, amount, status, due_date, created_at)
		VALUES ($1, $2, $3, $4, 'pending', NOW() + INTERVAL '7 days', NOW())
	`, invoiceID, payload.UserID, payload.OrderID, amount)
	if err != nil {
		return fmt.Errorf("failed to create invoice: %w", err)
	}

	log.Printf("续费发票已生成: invoice_id=%s, amount=%.2f", invoiceID, amount)
	return nil
}

// HandleExpireService 处理服务过期检查任务
func (h *TaskHandler) HandleExpireService(ctx context.Context, t *asynq.Task) error {
	var payload ExpireServicePayload
	if err := json.Unmarshal(t.Payload(), &payload); err != nil {
		return fmt.Errorf("failed to unmarshal payload: %w", err)
	}

	log.Printf("检查服务过期状态: service_id=%s", payload.ServiceID)

	// 检查服务是否已过期
	var expiresAt time.Time
	var status string
	err := h.pool.QueryRow(ctx, `
		SELECT expires_at, status
		FROM services
		WHERE id = $1
	`, payload.ServiceID).Scan(&expiresAt, &status)
	if err != nil {
		return fmt.Errorf("failed to get service info: %w", err)
	}

	// 如果服务已过期且状态为 active，则暂停服务
	if time.Now().After(expiresAt) && status == "active" {
		log.Printf("服务已过期，执行暂停: service_id=%s", payload.ServiceID)

		_, err = h.pool.Exec(ctx, `
			UPDATE services
			SET status = 'suspended',
			    suspended_at = NOW()
			WHERE id = $1
		`, payload.ServiceID)
		if err != nil {
			return fmt.Errorf("failed to suspend expired service: %w", err)
		}

		log.Printf("过期服务已暂停: service_id=%s", payload.ServiceID)
	} else {
		log.Printf("服务未过期或已处于非活动状态: service_id=%s, status=%s", payload.ServiceID, status)
	}

	return nil
}
