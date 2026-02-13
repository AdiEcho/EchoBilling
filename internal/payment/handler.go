package payment

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/adiecho/echobilling/internal/app"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/stripe/stripe-go/v82"
	"github.com/stripe/stripe-go/v82/checkout/session"
	"github.com/stripe/stripe-go/v82/webhook"
)

type Handler struct {
	pool          *pgxpool.Pool
	stripeKey     string
	webhookSecret string
	frontendURL   string
}

func NewHandler(pool *pgxpool.Pool, cfg *app.Config) *Handler {
	stripe.Key = cfg.StripeSecretKey
	return &Handler{
		pool:          pool,
		stripeKey:     cfg.StripeSecretKey,
		webhookSecret: cfg.StripeWebhookSecret,
		frontendURL:   cfg.FrontendURL,
	}
}

type CreateCheckoutRequest struct {
	OrderID string `json:"order_id" binding:"required"`
}

// CreateCheckoutSession 创建 Stripe Checkout Session
func (h *Handler) CreateCheckoutSession(c *gin.Context) {
	var req CreateCheckoutRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	ctx := context.Background()

	// 开始事务
	tx, err := h.pool.Begin(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	defer tx.Rollback(ctx)

	// 验证订单存在、属于用户且状态为 draft
	var orderUserID, orderStatus, currency string
	var totalAmount int64
	err = tx.QueryRow(ctx,
		`SELECT user_id, status, total_amount, currency FROM orders WHERE id = $1`,
		req.OrderID,
	).Scan(&orderUserID, &orderStatus, &totalAmount, &currency)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	if orderUserID != userID.(string) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Order does not belong to user"})
		return
	}

	if orderStatus != "draft" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Order is not in draft status"})
		return
	}

	// 获取订单项和计划信息
	rows, err := tx.Query(ctx,
		`SELECT oi.quantity, p.name, p.price, p.billing_cycle
		 FROM order_items oi
		 JOIN plans p ON oi.plan_id = p.id
		 WHERE oi.order_id = $1`,
		req.OrderID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch order items"})
		return
	}
	defer rows.Close()

	var lineItems []*stripe.CheckoutSessionLineItemParams
	for rows.Next() {
		var quantity int
		var name string
		var price int64
		var billingCycle string

		if err := rows.Scan(&quantity, &name, &price, &billingCycle); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read order items"})
			return
		}

		lineItems = append(lineItems, &stripe.CheckoutSessionLineItemParams{
			PriceData: &stripe.CheckoutSessionLineItemPriceDataParams{
				Currency: stripe.String(currency),
				ProductData: &stripe.CheckoutSessionLineItemPriceDataProductDataParams{
					Name: stripe.String(name),
				},
				UnitAmount: stripe.Int64(price),
			},
			Quantity: stripe.Int64(int64(quantity)),
		})
	}

	if len(lineItems) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Order has no items"})
		return
	}

	// 创建 Stripe Checkout Session
	params := &stripe.CheckoutSessionParams{
		PaymentMethodTypes: stripe.StringSlice([]string{"card"}),
		LineItems:          lineItems,
		Mode:               stripe.String(string(stripe.CheckoutSessionModePayment)),
		SuccessURL:         stripe.String(fmt.Sprintf("%s/checkout/success?session_id={CHECKOUT_SESSION_ID}", h.frontendURL)),
		CancelURL:          stripe.String(fmt.Sprintf("%s/checkout/cancel", h.frontendURL)),
		ClientReferenceID:  stripe.String(req.OrderID),
		Metadata: map[string]string{
			"order_id": req.OrderID,
			"user_id":  userID.(string),
		},
	}

	sess, err := session.New(params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create checkout session"})
		return
	}

	// 更新订单状态为 pending_payment
	_, err = tx.Exec(ctx,
		`UPDATE orders SET status = 'pending_payment', updated_at = $1 WHERE id = $2`,
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

// HandleWebhook 处理 Stripe Webhook 事件
func (h *Handler) HandleWebhook(c *gin.Context) {
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to read request body"})
		return
	}

	// 验证 webhook 签名
	event, err := webhook.ConstructEvent(body, c.GetHeader("Stripe-Signature"), h.webhookSecret)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid signature"})
		return
	}

	ctx := context.Background()

	// 检查事件幂等性
	var exists bool
	err = h.pool.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM payment_events WHERE stripe_event_id = $1)`,
		event.ID,
	).Scan(&exists)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	if exists {
		c.JSON(http.StatusOK, gin.H{"message": "Event already processed"})
		return
	}

	// 存储原始事件
	eventData, _ := json.Marshal(event.Data.Raw)
	_, err = h.pool.Exec(ctx,
		`INSERT INTO payment_events (id, stripe_event_id, event_type, event_data, created_at)
		 VALUES ($1, $2, $3, $4, $5)`,
		uuid.New().String(), event.ID, event.Type, eventData, time.Now(),
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to store event"})
		return
	}

	// 处理不同类型的事件
	switch event.Type {
	case "checkout.session.completed":
		if err := h.handleCheckoutSessionCompleted(ctx, event); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	case "payment_intent.payment_failed":
		// 记录支付失败事件
		// 可以在这里添加通知逻辑
	case "charge.refunded":
		if err := h.handleChargeRefunded(ctx, event); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	case "charge.dispute.created":
		if err := h.handleDisputeCreated(ctx, event); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Webhook processed"})
}

func (h *Handler) handleCheckoutSessionCompleted(ctx context.Context, event stripe.Event) error {
	var sess stripe.CheckoutSession
	if err := json.Unmarshal(event.Data.Raw, &sess); err != nil {
		return fmt.Errorf("failed to parse session: %w", err)
	}

	orderID := sess.Metadata["order_id"]
	if orderID == "" {
		return fmt.Errorf("order_id not found in metadata")
	}

	tx, err := h.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	// 更新订单状态为 paid
	now := time.Now()
	_, err = tx.Exec(ctx,
		`UPDATE orders SET status = 'paid', paid_at = $1, updated_at = $1 WHERE id = $2`,
		now, orderID,
	)
	if err != nil {
		return fmt.Errorf("failed to update order: %w", err)
	}

	// 创建支付记录
	paymentID := uuid.New().String()
	_, err = tx.Exec(ctx,
		`INSERT INTO payments (id, order_id, stripe_payment_intent_id, amount, currency, status, payment_method, created_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
		paymentID, orderID, sess.PaymentIntent.ID, sess.AmountTotal, sess.Currency, "succeeded", "card", now,
	)
	if err != nil {
		return fmt.Errorf("failed to create payment: %w", err)
	}

	// 创建发票
	if err := h.createInvoice(ctx, tx, orderID); err != nil {
		return fmt.Errorf("failed to create invoice: %w", err)
	}

	return tx.Commit(ctx)
}

func (h *Handler) handleChargeRefunded(ctx context.Context, event stripe.Event) error {
	var charge stripe.Charge
	if err := json.Unmarshal(event.Data.Raw, &charge); err != nil {
		return fmt.Errorf("failed to parse charge: %w", err)
	}

	tx, err := h.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	// 更新支付状态
	_, err = tx.Exec(ctx,
		`UPDATE payments SET status = 'refunded', updated_at = $1
		 WHERE stripe_payment_intent_id = $2`,
		time.Now(), charge.PaymentIntent.ID,
	)
	if err != nil {
		return fmt.Errorf("failed to update payment: %w", err)
	}

	// 创建退款记录
	refundID := uuid.New().String()
	_, err = tx.Exec(ctx,
		`INSERT INTO refunds (id, payment_id, stripe_refund_id, amount, currency, reason, status, created_at)
		 SELECT $1, id, $2, $3, $4, $5, $6, $7
		 FROM payments WHERE stripe_payment_intent_id = $8`,
		refundID, charge.Refunds.Data[0].ID, charge.AmountRefunded, charge.Currency, "requested_by_customer", "succeeded", time.Now(), charge.PaymentIntent.ID,
	)
	if err != nil {
		return fmt.Errorf("failed to create refund: %w", err)
	}

	return tx.Commit(ctx)
}

func (h *Handler) handleDisputeCreated(ctx context.Context, event stripe.Event) error {
	var dispute stripe.Dispute
	if err := json.Unmarshal(event.Data.Raw, &dispute); err != nil {
		return fmt.Errorf("failed to parse dispute: %w", err)
	}

	disputeID := uuid.New().String()
	_, err := h.pool.Exec(ctx,
		`INSERT INTO disputes (id, payment_id, stripe_dispute_id, amount, currency, reason, status, created_at)
		 SELECT $1, id, $2, $3, $4, $5, $6, $7
		 FROM payments WHERE stripe_payment_intent_id = $8`,
		disputeID, dispute.ID, dispute.Amount, dispute.Currency, dispute.Reason, dispute.Status, time.Now(), dispute.PaymentIntent.ID,
	)
	if err != nil {
		return fmt.Errorf("failed to create dispute: %w", err)
	}

	return nil
}

func (h *Handler) createInvoice(ctx context.Context, tx pgx.Tx, orderID string) error {
	// 获取订单信息
	var userID, currency string
	var subtotal, tax, total int64
	err := tx.QueryRow(ctx,
		`SELECT user_id, subtotal_amount, tax_amount, total_amount, currency FROM orders WHERE id = $1`,
		orderID,
	).Scan(&userID, &subtotal, &tax, &total, &currency)
	if err != nil {
		return err
	}

	// 生成发票号
	invoiceNumber := fmt.Sprintf("INV-%s-%s", time.Now().Format("20060102"), generateRandomString(4))

	// 创建发票
	invoiceID := uuid.New().String()
	now := time.Now()
	dueDate := now.AddDate(0, 0, 30) // 30天后到期

	_, err = tx.Exec(ctx,
		`INSERT INTO invoices (id, user_id, order_id, invoice_number, status, subtotal, tax, total, currency, due_date, paid_at, created_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
		invoiceID, userID, orderID, invoiceNumber, "paid", subtotal, tax, total, currency, dueDate, now, now,
	)
	if err != nil {
		return err
	}

	// 创建发票项
	rows, err := tx.Query(ctx,
		`SELECT oi.plan_id, p.name, oi.quantity, p.price, (oi.quantity * p.price) as amount
		 FROM order_items oi
		 JOIN plans p ON oi.plan_id = p.id
		 WHERE oi.order_id = $1`,
		orderID,
	)
	if err != nil {
		return err
	}
	defer rows.Close()

	for rows.Next() {
		var planID, description string
		var quantity int
		var unitPrice, amount int64

		if err := rows.Scan(&planID, &description, &quantity, &unitPrice, &amount); err != nil {
			return err
		}

		itemID := uuid.New().String()
		_, err = tx.Exec(ctx,
			`INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price, amount, created_at)
			 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
			itemID, invoiceID, description, quantity, unitPrice, amount, now,
		)
		if err != nil {
			return err
		}
	}

	return nil
}

func generateRandomString(length int) string {
	const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	b := make([]byte, length)
	for i := range b {
		b[i] = charset[time.Now().UnixNano()%int64(len(charset))]
	}
	return string(b)
}
