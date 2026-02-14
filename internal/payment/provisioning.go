package payment

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"github.com/adiecho/echobilling/internal/provisioning"
	"github.com/google/uuid"
	"github.com/hibiken/asynq"
	"github.com/jackc/pgx/v5"
)

type provisioningTask struct {
	ServiceID string
	OrderID   string
	PlanID    string
	UserID    string
	JobID     string
}

func (h *Handler) prepareProvisioningJobs(
	ctx context.Context,
	tx pgx.Tx,
	orderID string,
	userID string,
	now time.Time,
) ([]provisioningTask, error) {
	rows, err := tx.Query(ctx,
		`SELECT id, plan_id, billing_cycle::text
		 FROM order_items
		 WHERE order_id = $1
		 ORDER BY created_at ASC`,
		orderID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	tasks := make([]provisioningTask, 0)
	for rows.Next() {
		var (
			orderItemID  string
			planID       string
			billingCycle string
		)
		if err := rows.Scan(&orderItemID, &planID, &billingCycle); err != nil {
			return nil, err
		}

		serviceID, serviceStatus, err := h.ensureServiceRecord(ctx, tx, orderItemID, planID, userID, billingCycle, now)
		if err != nil {
			return nil, err
		}
		if serviceStatus == "active" {
			continue
		}

		jobID, shouldEnqueue, err := h.ensureProvisioningJob(ctx, tx, serviceID, now)
		if err != nil {
			return nil, err
		}
		if !shouldEnqueue {
			continue
		}

		tasks = append(tasks, provisioningTask{
			ServiceID: serviceID,
			OrderID:   orderID,
			PlanID:    planID,
			UserID:    userID,
			JobID:     jobID,
		})
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	if len(tasks) > 0 {
		_, err = tx.Exec(ctx,
			`UPDATE orders
			 SET status = 'provisioning', updated_at = $2
			 WHERE id = $1`,
			orderID, now,
		)
		if err != nil {
			return nil, err
		}
	}

	return tasks, nil
}

func (h *Handler) ensureServiceRecord(
	ctx context.Context,
	tx pgx.Tx,
	orderItemID string,
	planID string,
	userID string,
	billingCycle string,
	now time.Time,
) (string, string, error) {
	var (
		serviceID string
		status    string
	)
	err := tx.QueryRow(ctx,
		`SELECT id, status::text
		 FROM services
		 WHERE order_item_id = $1`,
		orderItemID,
	).Scan(&serviceID, &status)
	if err == nil {
		if status != "active" && status != "provisioning" {
			_, err = tx.Exec(ctx,
				`UPDATE services
				 SET status = 'provisioning', updated_at = $2
				 WHERE id = $1`,
				serviceID, now,
			)
			if err != nil {
				return "", "", err
			}
			status = "provisioning"
		}
		return serviceID, status, nil
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return "", "", err
	}

	expiresAt := calculateExpiryDate(billingCycle, now)
	metadata, _ := json.Marshal(map[string]interface{}{
		"provisioning_source": "stripe_webhook",
		"created_at":          now.UTC().Format(time.RFC3339),
	})

	serviceID = uuid.New().String()
	_, err = tx.Exec(ctx,
		`INSERT INTO services (
			id, user_id, order_item_id, plan_id, status, expires_at, metadata, created_at, updated_at
		)
		VALUES ($1, $2, $3, $4, 'provisioning', $5, $6, $7, $7)`,
		serviceID, userID, orderItemID, planID, expiresAt, metadata, now,
	)
	if err != nil {
		return "", "", err
	}

	return serviceID, "provisioning", nil
}

func (h *Handler) ensureProvisioningJob(
	ctx context.Context,
	tx pgx.Tx,
	serviceID string,
	now time.Time,
) (string, bool, error) {
	var (
		existingJobID string
		existingState string
	)
	err := tx.QueryRow(ctx,
		`SELECT id, status::text
		 FROM provisioning_jobs
		 WHERE service_id = $1
		   AND job_type = 'provision_vps'
		 ORDER BY created_at DESC
		 LIMIT 1`,
		serviceID,
	).Scan(&existingJobID, &existingState)

	if err == nil {
		if existingState == "pending" || existingState == "running" {
			return existingJobID, false, nil
		}
	}
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return "", false, err
	}

	jobID := uuid.New().String()
	_, err = tx.Exec(ctx,
		`INSERT INTO provisioning_jobs (
			id, service_id, job_type, status, attempts, max_attempts, created_at, updated_at
		)
		VALUES ($1, $2, 'provision_vps', 'pending', 0, 5, $3, $3)`,
		jobID, serviceID, now,
	)
	if err != nil {
		return "", false, err
	}

	return jobID, true, nil
}

func (h *Handler) enqueueProvisioningTasks(ctx context.Context, tasks []provisioningTask) error {
	if len(tasks) == 0 {
		return nil
	}

	client := h.asynqClient

	enqueueErrors := make([]string, 0)
	for _, item := range tasks {
		task, err := provisioning.NewProvisionVPSTask(provisioning.ProvisionVPSPayload{
			ServiceID: item.ServiceID,
			OrderID:   item.OrderID,
			PlanID:    item.PlanID,
			UserID:    item.UserID,
		})
		if err != nil {
			enqueueErrors = append(enqueueErrors, err.Error())
			h.markProvisioningJobFailed(ctx, item.JobID, item.ServiceID, err)
			continue
		}

		if _, err := client.Enqueue(task, asynq.Queue("critical"), asynq.MaxRetry(5)); err != nil {
			enqueueErrors = append(enqueueErrors, err.Error())
			h.markProvisioningJobFailed(ctx, item.JobID, item.ServiceID, err)
			continue
		}
	}

	if len(enqueueErrors) > 0 {
		return errors.New(strings.Join(enqueueErrors, "; "))
	}

	return nil
}

func (h *Handler) markProvisioningJobFailed(ctx context.Context, jobID, serviceID string, err error) {
	failTime := time.Now()
	_, _ = h.pool.Exec(ctx,
		`UPDATE provisioning_jobs
		 SET status = 'failed', last_error = $2, completed_at = $3, updated_at = $3
		 WHERE id = $1`,
		jobID, err.Error(), failTime,
	)
	_, _ = h.pool.Exec(ctx,
		`UPDATE services
		 SET status = 'pending', updated_at = $2
		 WHERE id = $1 AND status = 'provisioning'`,
		serviceID, failTime,
	)
}

func calculateExpiryDate(billingCycle string, now time.Time) time.Time {
	switch billingCycle {
	case "quarterly":
		return now.AddDate(0, 3, 0)
	case "annually":
		return now.AddDate(1, 0, 0)
	default:
		return now.AddDate(0, 1, 0)
	}
}
