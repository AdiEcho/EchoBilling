package customer

import (
	"context"
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/adiecho/echobilling/internal/auth"
	"github.com/jackc/pgx/v5"
)

func (h *Handler) getStats(ctx context.Context, userID string) (*StatsResponse, error) {
	var stats StatsResponse

	if err := h.pool.QueryRow(ctx,
		`SELECT COUNT(*)
		 FROM services
		 WHERE user_id = $1 AND status = 'active'`,
		userID,
	).Scan(&stats.ActiveServices); err != nil {
		return nil, err
	}

	if err := h.pool.QueryRow(ctx,
		`SELECT COUNT(*)
		 FROM orders
		 WHERE user_id = $1
		   AND status IN ('draft', 'pending_payment', 'paid', 'provisioning')`,
		userID,
	).Scan(&stats.PendingOrders); err != nil {
		return nil, err
	}

	if err := h.pool.QueryRow(ctx,
		`SELECT COUNT(*)
		 FROM invoices
		 WHERE user_id = $1
		   AND status IN ('draft', 'pending')`,
		userID,
	).Scan(&stats.UnpaidInvoices); err != nil {
		return nil, err
	}

	var totalSpent string
	if err := h.pool.QueryRow(ctx,
		`SELECT COALESCE(SUM(amount), 0)::text
		 FROM payments
		 WHERE user_id = $1 AND status = 'succeeded'`,
		userID,
	).Scan(&totalSpent); err != nil {
		return nil, err
	}
	stats.TotalSpent, _ = strconv.ParseFloat(totalSpent, 64)

	return &stats, nil
}

func (h *Handler) listServices(ctx context.Context, userID string) ([]ServiceSummary, error) {
	rows, err := h.pool.Query(ctx,
		`SELECT s.id,
		        COALESCE(s.hostname, ''),
		        COALESCE(s.ip_address, ''),
		        p.name,
		        s.status::text,
		        s.expires_at,
		        s.created_at
		 FROM services s
		 JOIN plans p ON p.id = s.plan_id
		 WHERE s.user_id = $1
		 ORDER BY s.created_at DESC`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	services := make([]ServiceSummary, 0)
	for rows.Next() {
		var service ServiceSummary
		if err := rows.Scan(
			&service.ID,
			&service.Hostname,
			&service.IPAddress,
			&service.PlanName,
			&service.Status,
			&service.ExpiresAt,
			&service.CreatedAt,
		); err != nil {
			return nil, err
		}
		services = append(services, service)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return services, nil
}

func (h *Handler) getService(ctx context.Context, userID, serviceID string) (*ServiceSummary, *ServiceError) {
	var service ServiceSummary
	err := h.pool.QueryRow(ctx,
		`SELECT s.id,
		        COALESCE(s.hostname, ''),
		        COALESCE(s.ip_address, ''),
		        p.name,
		        s.status::text,
		        s.expires_at,
		        s.created_at
		 FROM services s
		 JOIN plans p ON p.id = s.plan_id
		 WHERE s.id = $1 AND s.user_id = $2`,
		serviceID, userID,
	).Scan(
		&service.ID,
		&service.Hostname,
		&service.IPAddress,
		&service.PlanName,
		&service.Status,
		&service.ExpiresAt,
		&service.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, newServiceError(http.StatusNotFound, "Service not found", err)
		}
		return nil, newServiceError(http.StatusInternalServerError, "Failed to query service", err)
	}

	return &service, nil
}

func (h *Handler) changePassword(ctx context.Context, userID string, req ChangePasswordRequest) *ServiceError {
	var currentHash string
	err := h.pool.QueryRow(ctx,
		`SELECT password_hash
		 FROM users
		 WHERE id = $1`,
		userID,
	).Scan(&currentHash)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return newServiceError(http.StatusNotFound, "User not found", err)
		}
		return newServiceError(http.StatusInternalServerError, "Failed to query user", err)
	}

	valid, err := auth.VerifyPassword(req.CurrentPassword, currentHash)
	if err != nil || !valid {
		return newServiceError(http.StatusUnauthorized, "Current password is incorrect", err)
	}

	newHash, err := auth.HashPassword(req.NewPassword)
	if err != nil {
		return newServiceError(http.StatusInternalServerError, "Failed to hash new password", err)
	}

	if _, err := h.pool.Exec(ctx,
		`UPDATE users
		 SET password_hash = $2, updated_at = $3
		 WHERE id = $1`,
		userID, newHash, time.Now(),
	); err != nil {
		return newServiceError(http.StatusInternalServerError, "Failed to update password", err)
	}

	return nil
}
