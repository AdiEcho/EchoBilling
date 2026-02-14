package payment

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/stripe/stripe-go/v82"
	"github.com/stripe/stripe-go/v82/checkout/session"
)

// CreateCheckoutSession 创建 Stripe Checkout Session
func (h *Handler) CreateCheckoutSession(c *gin.Context) {
	var req CreateCheckoutRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	userIDValue, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	userID := userIDValue.(string)

	ctx := context.Background()
	tx, err := h.pool.Begin(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	defer tx.Rollback(ctx)

	var orderUserID, orderStatus, orderTotal, currency string
	err = tx.QueryRow(ctx,
		`SELECT user_id, status, total_amount::text, currency
		 FROM orders
		 WHERE id = $1`,
		req.OrderID,
	).Scan(&orderUserID, &orderStatus, &orderTotal, &currency)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	if orderUserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Order does not belong to user"})
		return
	}

	if orderStatus != "draft" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Order is not in draft status"})
		return
	}

	rows, err := tx.Query(ctx,
		`SELECT oi.quantity, oi.unit_price::text,
		        COALESCE(oi.plan_snapshot->>'name', p.name, 'Service Plan') AS plan_name
		 FROM order_items oi
		 LEFT JOIN plans p ON p.id = oi.plan_id
		 WHERE oi.order_id = $1`,
		req.OrderID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch order items"})
		return
	}
	defer rows.Close()

	lineItems := make([]*stripe.CheckoutSessionLineItemParams, 0)
	for rows.Next() {
		var quantity int64
		var unitPriceDecimal, name string
		if err := rows.Scan(&quantity, &unitPriceDecimal, &name); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read order items"})
			return
		}

		unitAmount, err := decimalAmountToCents(unitPriceDecimal)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid order item amount"})
			return
		}

		lineItems = append(lineItems, &stripe.CheckoutSessionLineItemParams{
			PriceData: &stripe.CheckoutSessionLineItemPriceDataParams{
				Currency: stripe.String(strings.ToLower(currency)),
				ProductData: &stripe.CheckoutSessionLineItemPriceDataProductDataParams{
					Name: stripe.String(name),
				},
				UnitAmount: stripe.Int64(unitAmount),
			},
			Quantity: stripe.Int64(quantity),
		})
	}

	if err := rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to iterate order items"})
		return
	}

	if len(lineItems) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Order has no items"})
		return
	}

	params := &stripe.CheckoutSessionParams{
		PaymentMethodTypes: stripe.StringSlice([]string{"card"}),
		LineItems:          lineItems,
		Mode:               stripe.String(string(stripe.CheckoutSessionModePayment)),
		SuccessURL:         stripe.String(fmt.Sprintf("%s/checkout/success?session_id={CHECKOUT_SESSION_ID}", h.frontendURL)),
		CancelURL:          stripe.String(fmt.Sprintf("%s/checkout/cancel", h.frontendURL)),
		ClientReferenceID:  stripe.String(req.OrderID),
		Metadata: map[string]string{
			"order_id":    req.OrderID,
			"user_id":     userID,
			"order_total": orderTotal,
		},
	}

	sess, err := session.New(params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create checkout session"})
		return
	}

	_, err = tx.Exec(ctx,
		`UPDATE orders
		 SET status = 'pending_payment', updated_at = $1
		 WHERE id = $2`,
		time.Now(), req.OrderID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update order status"})
		return
	}

	if err := tx.Commit(ctx); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"session_id":  sess.ID,
		"session_url": sess.URL,
	})
}

func (h *Handler) createInvoice(
	ctx context.Context,
	tx pgx.Tx,
	orderID, userID, currency, totalAmount string,
	now time.Time,
) (string, error) {
	var existingInvoiceID string
	err := tx.QueryRow(ctx,
		`SELECT id
		 FROM invoices
		 WHERE order_id = $1
		 ORDER BY created_at DESC
		 LIMIT 1`,
		orderID,
	).Scan(&existingInvoiceID)
	if err == nil {
		return existingInvoiceID, nil
	}
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return "", err
	}

	invoiceID := uuid.New().String()
	invoiceNumber := fmt.Sprintf("INV-%s-%s", now.Format("20060102"), strings.ToUpper(invoiceID[:8]))
	dueDate := now.AddDate(0, 0, 30)

	_, err = tx.Exec(ctx,
		`INSERT INTO invoices (
			id, user_id, order_id, invoice_number, status, subtotal, tax, total, currency,
			due_date, paid_at, created_at, updated_at
		)
		VALUES ($1, $2, $3, $4, 'paid', $5, $6, $7, $8, $9, $10, $10, $10)`,
		invoiceID, userID, orderID, invoiceNumber, totalAmount, "0", totalAmount, strings.ToUpper(currency), dueDate, now,
	)
	if err != nil {
		return "", err
	}

	rows, err := tx.Query(ctx,
		`SELECT COALESCE(oi.plan_snapshot->>'name', p.name, 'Service'),
		        oi.quantity,
		        oi.unit_price::text,
		        (oi.quantity * oi.unit_price)::text
		 FROM order_items oi
		 LEFT JOIN plans p ON p.id = oi.plan_id
		 WHERE oi.order_id = $1`,
		orderID,
	)
	if err != nil {
		return "", err
	}
	defer rows.Close()

	for rows.Next() {
		var (
			description string
			quantity    int64
			unitPrice   string
			amount      string
		)
		if err := rows.Scan(&description, &quantity, &unitPrice, &amount); err != nil {
			return "", err
		}

		_, err = tx.Exec(ctx,
			`INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price, amount, created_at)
			 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
			uuid.New().String(), invoiceID, description, quantity, unitPrice, amount, now,
		)
		if err != nil {
			return "", err
		}
	}

	if err := rows.Err(); err != nil {
		return "", err
	}

	return invoiceID, nil
}

func decimalAmountToCents(value string) (int64, error) {
	normalized := strings.TrimSpace(value)
	if normalized == "" {
		return 0, fmt.Errorf("empty amount")
	}

	parsed, err := strconv.ParseFloat(normalized, 64)
	if err != nil {
		return 0, err
	}
	return int64(parsed*100 + 0.5), nil
}

func centsToDecimal(cents int64) string {
	return strconv.FormatFloat(float64(cents)/100.0, 'f', 2, 64)
}

func mapRefundStatus(stripeStatus string) string {
	switch stripeStatus {
	case "succeeded":
		return "succeeded"
	case "failed", "canceled":
		return "failed"
	default:
		return "pending"
	}
}

func mapDisputeStatus(stripeStatus string) string {
	switch stripeStatus {
	case "won":
		return "won"
	case "lost":
		return "lost"
	case "warning_under_review", "under_review":
		return "under_review"
	default:
		return "needs_response"
	}
}
