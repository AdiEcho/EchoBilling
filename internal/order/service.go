package order

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

func (h *Handler) getOrCreateDraftOrder(ctx context.Context, tx pgx.Tx, userID string) (string, error) {
	var orderID string
	err := tx.QueryRow(ctx,
		`SELECT id
		 FROM orders
		 WHERE user_id = $1 AND status = 'draft'
		 ORDER BY created_at DESC
		 LIMIT 1`,
		userID,
	).Scan(&orderID)

	if err == nil {
		return orderID, nil
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return "", err
	}

	orderID = uuid.New().String()
	now := time.Now()
	_, err = tx.Exec(ctx,
		`INSERT INTO orders (id, user_id, status, total_amount, currency, notes, created_at, updated_at)
		 VALUES ($1, $2, 'draft', $3, 'USD', $4, $5, $5)`,
		orderID, userID, "0", nil, now,
	)
	if err != nil {
		return "", err
	}

	return orderID, nil
}

func (h *Handler) getDraftCart(ctx context.Context, userID string) (*Order, error) {
	var order Order
	err := h.pool.QueryRow(ctx,
		`SELECT id, user_id, status, total_amount, currency, notes, created_at, updated_at
		 FROM orders
		 WHERE user_id = $1 AND status = 'draft'
		 ORDER BY created_at DESC
		 LIMIT 1`,
		userID,
	).Scan(&order.ID, &order.UserID, &order.Status, &order.TotalAmount, &order.Currency, &order.Notes, &order.CreatedAt, &order.UpdatedAt)

	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	rows, err := h.pool.Query(ctx,
		`SELECT id, order_id, plan_id, plan_snapshot, quantity, unit_price, billing_cycle, created_at
		 FROM order_items
		 WHERE order_id = $1
		 ORDER BY created_at`,
		order.ID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	order.Items = make([]OrderItem, 0)
	for rows.Next() {
		var item OrderItem
		if err := rows.Scan(&item.ID, &item.OrderID, &item.PlanID, &item.PlanSnapshot, &item.Quantity, &item.UnitPrice, &item.BillingCycle, &item.CreatedAt); err != nil {
			return nil, err
		}
		order.Items = append(order.Items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return &order, nil
}

// isValidStatusTransition 验证订单状态转换是否有效
func isValidStatusTransition(from, to string) bool {
	validTransitions := map[string][]string{
		"draft":           {"pending_payment", "cancelled"},
		"pending_payment": {"paid", "cancelled"},
		"paid":            {"provisioning", "refunded", "cancelled"},
		"provisioning":    {"active", "cancelled"},
		"active":          {},
		"cancelled":       {},
		"refunded":        {},
	}

	allowedStatuses, exists := validTransitions[from]
	if !exists {
		return false
	}

	for _, status := range allowedStatuses {
		if status == to {
			return true
		}
	}

	return false
}

func mapAdminOrderStatus(status string) string {
	switch status {
	case "draft", "pending_payment":
		return "pending"
	case "paid", "provisioning":
		return "processing"
	case "active":
		return "completed"
	case "cancelled", "refunded":
		return "cancelled"
	default:
		return status
	}
}
