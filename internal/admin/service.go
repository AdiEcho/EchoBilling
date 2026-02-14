package admin

import (
	"context"
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/adiecho/echobilling/internal/provisioning"
	"github.com/google/uuid"
	"github.com/hibiken/asynq"
	"github.com/jackc/pgx/v5"
	"github.com/redis/go-redis/v9"
	"github.com/stripe/stripe-go/v82"
	"github.com/stripe/stripe-go/v82/refund"
)

func (h *Handler) getDashboardStats(ctx context.Context) (*DashboardStats, error) {
	var stats DashboardStats

	if err := h.pool.QueryRow(ctx, `SELECT COUNT(*) FROM users WHERE role = 'customer'`).Scan(&stats.TotalCustomers); err != nil {
		return nil, err
	}
	if err := h.pool.QueryRow(ctx, `SELECT COUNT(*) FROM orders`).Scan(&stats.TotalOrders); err != nil {
		return nil, err
	}
	if err := h.pool.QueryRow(ctx, `SELECT COALESCE(SUM(amount), 0)::text FROM payments WHERE status = 'succeeded'`).Scan(&stats.TotalRevenue); err != nil {
		return nil, err
	}
	stats.Revenue, _ = strconv.ParseFloat(stats.TotalRevenue, 64)
	if err := h.pool.QueryRow(ctx, `SELECT COUNT(*) FROM services WHERE status = 'active'`).Scan(&stats.ActiveServices); err != nil {
		return nil, err
	}

	return &stats, nil
}

func (h *Handler) getSystemInfo(ctx context.Context) *SystemInfo {
	resp := &SystemInfo{
		APIVersion:     "v1",
		DatabaseStatus: "down",
		RedisStatus:    "down",
		WorkerStatus:   "down",
	}

	var ping int
	if err := h.pool.QueryRow(ctx, "SELECT 1").Scan(&ping); err == nil && ping == 1 {
		resp.DatabaseStatus = "healthy"
	}

	rdb := redis.NewClient(&redis.Options{Addr: h.redisAddr})
	defer rdb.Close()
	if err := rdb.Ping(ctx).Err(); err == nil {
		resp.RedisStatus = "healthy"
	}

	if resp.RedisStatus == "healthy" {
		inspector := asynq.NewInspector(asynq.RedisClientOpt{Addr: h.redisAddr})
		defer inspector.Close()

		if _, err := inspector.Queues(); err == nil {
			resp.WorkerStatus = "healthy"
		} else {
			resp.WorkerStatus = "degraded"
		}
	}

	return resp
}

func (h *Handler) listCustomers(ctx context.Context, page, limit int) ([]Customer, int64, error) {
	offset := (page - 1) * limit

	var total int64
	if err := h.pool.QueryRow(ctx, `SELECT COUNT(*) FROM users`).Scan(&total); err != nil {
		return nil, 0, err
	}

	rows, err := h.pool.Query(ctx,
		`SELECT id, email, name, role, created_at
		 FROM users
		 ORDER BY created_at DESC
		 LIMIT $1 OFFSET $2`,
		limit, offset,
	)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	customers := make([]Customer, 0)
	for rows.Next() {
		var customer Customer
		if err := rows.Scan(&customer.ID, &customer.Email, &customer.Name, &customer.Role, &customer.CreatedAt); err != nil {
			return nil, 0, err
		}
		customers = append(customers, customer)
	}

	if err := rows.Err(); err != nil {
		return nil, 0, err
	}

	return customers, total, nil
}

func (h *Handler) listPayments(ctx context.Context, page, limit int) ([]Payment, int64, error) {
	offset := (page - 1) * limit

	var total int64
	if err := h.pool.QueryRow(ctx, `SELECT COUNT(*) FROM payments`).Scan(&total); err != nil {
		return nil, 0, err
	}

	rows, err := h.pool.Query(ctx,
		`SELECT p.id,
		        COALESCE(i.order_id::text, '') AS order_id,
		        COALESCE(p.stripe_payment_intent_id, ''),
		        p.amount::text,
		        p.currency,
		        p.status,
		        COALESCE(p.method, ''),
		        p.created_at
		 FROM payments p
		 LEFT JOIN invoices i ON i.id = p.invoice_id
		 ORDER BY p.created_at DESC
		 LIMIT $1 OFFSET $2`,
		limit, offset,
	)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	payments := make([]Payment, 0)
	for rows.Next() {
		var (
			payment       Payment
			amountDecimal string
		)
		if err := rows.Scan(
			&payment.ID, &payment.OrderID, &payment.StripePaymentIntentID,
			&amountDecimal, &payment.Currency, &payment.Status, &payment.PaymentMethod, &payment.CreatedAt,
		); err != nil {
			return nil, 0, err
		}

		payment.Amount, _ = strconv.ParseFloat(amountDecimal, 64)
		payment.Status = mapAdminPaymentStatus(payment.Status)
		payment.Method = payment.PaymentMethod
		payments = append(payments, payment)
	}

	if err := rows.Err(); err != nil {
		return nil, 0, err
	}

	return payments, total, nil
}

func (h *Handler) createRefund(ctx context.Context, createdBy string, req CreateRefundRequest) (*RefundResponse, *ServiceError) {
	var (
		stripePaymentIntentID string
		amountDecimal         string
		currency              string
	)
	err := h.pool.QueryRow(ctx,
		`SELECT COALESCE(stripe_payment_intent_id, ''),
		        amount::text,
		        currency
		 FROM payments
		 WHERE id = $1`,
		req.PaymentID,
	).Scan(&stripePaymentIntentID, &amountDecimal, &currency)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, newServiceError(http.StatusNotFound, "Payment not found", err)
		}
		return nil, newServiceError(http.StatusInternalServerError, "Database error", err)
	}

	if stripePaymentIntentID == "" {
		return nil, newServiceError(http.StatusBadRequest, "Payment has no Stripe payment intent", nil)
	}

	totalCents, err := decimalAmountToCents(amountDecimal)
	if err != nil {
		return nil, newServiceError(http.StatusInternalServerError, "Invalid payment amount", err)
	}

	refundAmountCents := req.Amount
	if refundAmountCents == 0 {
		refundAmountCents = totalCents
	}
	if refundAmountCents <= 0 || refundAmountCents > totalCents {
		return nil, newServiceError(http.StatusBadRequest, "Invalid refund amount", nil)
	}

	params := &stripe.RefundParams{
		PaymentIntent: stripe.String(stripePaymentIntentID),
		Amount:        stripe.Int64(refundAmountCents),
	}
	if req.Reason == "duplicate" || req.Reason == "fraudulent" || req.Reason == "requested_by_customer" {
		params.Reason = stripe.String(req.Reason)
	}

	stripeRefund, err := refund.New(params)
	if err != nil {
		return nil, newServiceError(http.StatusInternalServerError, "Failed to create refund in Stripe", err)
	}

	tx, err := h.pool.Begin(ctx)
	if err != nil {
		return nil, newServiceError(http.StatusInternalServerError, "Database error", err)
	}
	defer tx.Rollback(ctx)

	now := time.Now()
	if _, err := tx.Exec(ctx,
		`UPDATE payments SET status = 'refunded', updated_at = $2 WHERE id = $1`,
		req.PaymentID, now,
	); err != nil {
		return nil, newServiceError(http.StatusInternalServerError, "Failed to update payment", err)
	}

	var createdByValue interface{}
	if createdBy != "" {
		createdByValue = createdBy
	}

	refundID := uuid.New().String()
	if _, err := tx.Exec(ctx,
		`INSERT INTO refunds (
			id, payment_id, stripe_refund_id, amount, reason, status, created_by, created_at, updated_at
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
		ON CONFLICT (stripe_refund_id) DO UPDATE SET
		  amount = EXCLUDED.amount,
		  reason = EXCLUDED.reason,
		  status = EXCLUDED.status,
		  updated_at = EXCLUDED.updated_at`,
		refundID,
		req.PaymentID,
		stripeRefund.ID,
		centsToDecimal(refundAmountCents),
		req.Reason,
		mapRefundStatus(string(stripeRefund.Status)),
		createdByValue,
		now,
	); err != nil {
		return nil, newServiceError(http.StatusInternalServerError, "Failed to create refund record", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, newServiceError(http.StatusInternalServerError, "Failed to commit transaction", err)
	}

	return &RefundResponse{
		ID:             refundID,
		PaymentID:      req.PaymentID,
		StripeRefundID: stripeRefund.ID,
		Amount:         centsToDecimal(refundAmountCents),
		Currency:       currency,
		Status:         mapRefundStatus(string(stripeRefund.Status)),
		CreatedAt:      now,
	}, nil
}

func (h *Handler) provisionService(ctx context.Context, serviceID string) (*ProvisioningResult, *ServiceError) {
	var (
		userID  string
		orderID string
		planID  string
		status  string
	)
	err := h.pool.QueryRow(ctx,
		`SELECT s.user_id, oi.order_id, s.plan_id, s.status
		 FROM services s
		 JOIN order_items oi ON oi.id = s.order_item_id
		 WHERE s.id = $1`,
		serviceID,
	).Scan(&userID, &orderID, &planID, &status)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, newServiceError(http.StatusNotFound, "Service not found", err)
		}
		return nil, newServiceError(http.StatusInternalServerError, "Failed to query service", err)
	}

	if status == "active" || status == "provisioning" {
		return nil, newServiceError(http.StatusConflict, "Service is already active or provisioning", nil)
	}
	if status == "terminated" || status == "cancelled" {
		return nil, newServiceError(http.StatusBadRequest, "Service is not provisionable in current status", nil)
	}

	now := time.Now()
	jobID := uuid.New().String()

	tx, err := h.pool.Begin(ctx)
	if err != nil {
		return nil, newServiceError(http.StatusInternalServerError, "Failed to start transaction", err)
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx,
		`INSERT INTO provisioning_jobs (
			id, service_id, job_type, status, attempts, max_attempts, created_at, updated_at
		)
		VALUES ($1, $2, 'provision_vps', 'pending', 0, 3, $3, $3)`,
		jobID, serviceID, now,
	); err != nil {
		return nil, newServiceError(http.StatusInternalServerError, "Failed to create provisioning job", err)
	}

	if _, err := tx.Exec(ctx,
		`UPDATE services
		 SET status = 'provisioning', updated_at = $2
		 WHERE id = $1`,
		serviceID, now,
	); err != nil {
		return nil, newServiceError(http.StatusInternalServerError, "Failed to update service status", err)
	}

	if _, err := tx.Exec(ctx,
		`UPDATE orders
		 SET status = 'provisioning', updated_at = $2
		 WHERE id = $1`,
		orderID, now,
	); err != nil {
		return nil, newServiceError(http.StatusInternalServerError, "Failed to update order status", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, newServiceError(http.StatusInternalServerError, "Failed to commit transaction", err)
	}

	task, err := provisioning.NewProvisionVPSTask(provisioning.ProvisionVPSPayload{
		ServiceID: serviceID,
		OrderID:   orderID,
		PlanID:    planID,
		UserID:    userID,
	})
	if err != nil {
		return nil, newServiceError(http.StatusInternalServerError, "Failed to build provisioning task", err)
	}

	client := asynq.NewClient(asynq.RedisClientOpt{Addr: h.redisAddr})
	defer client.Close()

	info, err := client.Enqueue(task, asynq.Queue("critical"), asynq.MaxRetry(5))
	if err != nil {
		failTime := time.Now()
		_, _ = h.pool.Exec(ctx,
			`UPDATE provisioning_jobs
			 SET status = 'failed', last_error = $2, completed_at = $3, updated_at = $3
			 WHERE id = $1`,
			jobID, err.Error(), failTime,
		)
		_, _ = h.pool.Exec(ctx,
			`UPDATE services SET status = 'pending', updated_at = $2 WHERE id = $1`,
			serviceID, failTime,
		)
		_, _ = h.pool.Exec(ctx,
			`UPDATE orders SET status = 'paid', updated_at = $2 WHERE id = $1 AND status = 'provisioning'`,
			orderID, failTime,
		)
		return nil, newServiceError(http.StatusInternalServerError, "Failed to enqueue provisioning task", err)
	}

	return &ProvisioningResult{
		JobID:         jobID,
		TaskID:        info.ID,
		ServiceID:     serviceID,
		OrderID:       orderID,
		Queue:         info.Queue,
		NextProcessAt: info.NextProcessAt,
		Status:        "pending",
	}, nil
}

func (h *Handler) getSystemJobs(ctx context.Context, limit int) (*SystemJobsResponse, *ServiceError) {
	inspector := asynq.NewInspector(asynq.RedisClientOpt{Addr: h.redisAddr})
	defer inspector.Close()

	queues := []string{"critical", "default", "low"}
	queueStats := make([]QueueStats, 0, len(queues))
	for _, queueName := range queues {
		info, err := inspector.GetQueueInfo(queueName)
		if err != nil {
			queueStats = append(queueStats, QueueStats{
				Queue: queueName,
				Error: err.Error(),
			})
			continue
		}

		queueStats = append(queueStats, QueueStats{
			Queue:      queueName,
			Size:       info.Size,
			Pending:    info.Pending,
			Active:     info.Active,
			Scheduled:  info.Scheduled,
			Retry:      info.Retry,
			Archived:   info.Archived,
			Completed:  info.Completed,
			Processing: info.Processed,
			Failed:     info.Failed,
		})
	}

	rows, err := h.pool.Query(ctx,
		`SELECT id, service_id, job_type, status, attempts, max_attempts, last_error,
		        started_at, completed_at, created_at, updated_at
		 FROM provisioning_jobs
		 ORDER BY created_at DESC
		 LIMIT $1`,
		limit,
	)
	if err != nil {
		return nil, newServiceError(http.StatusInternalServerError, "Failed to query provisioning jobs", err)
	}
	defer rows.Close()

	jobs := make([]ProvisioningJob, 0)
	for rows.Next() {
		var job ProvisioningJob
		if err := rows.Scan(
			&job.ID, &job.ServiceID, &job.JobType, &job.Status, &job.Attempts, &job.MaxAttempts,
			&job.LastError, &job.StartedAt, &job.CompletedAt, &job.CreatedAt, &job.UpdatedAt,
		); err != nil {
			return nil, newServiceError(http.StatusInternalServerError, "Failed to read provisioning jobs", err)
		}
		jobs = append(jobs, job)
	}
	if err := rows.Err(); err != nil {
		return nil, newServiceError(http.StatusInternalServerError, "Failed to iterate provisioning jobs", err)
	}

	statusCountRows, err := h.pool.Query(ctx,
		`SELECT status::text, COUNT(*)
		 FROM provisioning_jobs
		 GROUP BY status`,
	)
	if err != nil {
		return nil, newServiceError(http.StatusInternalServerError, "Failed to query job stats", err)
	}
	defer statusCountRows.Close()

	jobStats := map[string]int64{
		"pending":   0,
		"running":   0,
		"completed": 0,
		"failed":    0,
	}
	for statusCountRows.Next() {
		var status string
		var count int64
		if err := statusCountRows.Scan(&status, &count); err != nil {
			return nil, newServiceError(http.StatusInternalServerError, "Failed to read job stats", err)
		}
		jobStats[strings.ToLower(status)] = count
	}
	if err := statusCountRows.Err(); err != nil {
		return nil, newServiceError(http.StatusInternalServerError, "Failed to iterate job stats", err)
	}

	return &SystemJobsResponse{
		Queues:   queueStats,
		JobStats: jobStats,
		Jobs:     jobs,
	}, nil
}

func decimalAmountToCents(value string) (int64, error) {
	parsed, err := strconv.ParseFloat(strings.TrimSpace(value), 64)
	if err != nil {
		return 0, err
	}
	return int64(parsed*100 + 0.5), nil
}

func centsToDecimal(cents int64) string {
	return strconv.FormatFloat(float64(cents)/100.0, 'f', 2, 64)
}

func mapRefundStatus(status string) string {
	switch status {
	case "succeeded":
		return "succeeded"
	case "failed", "canceled":
		return "failed"
	default:
		return "pending"
	}
}

func mapAdminPaymentStatus(status string) string {
	switch status {
	case "succeeded":
		return "completed"
	default:
		return status
	}
}
