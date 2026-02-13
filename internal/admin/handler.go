package admin

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"github.com/adiecho/echobilling/internal/app"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/stripe/stripe-go/v82"
	"github.com/stripe/stripe-go/v82/refund"
)

type Handler struct {
	pool      *pgxpool.Pool
	stripeKey string
}

func NewHandler(pool *pgxpool.Pool, cfg *app.Config) *Handler {
	stripe.Key = cfg.StripeSecretKey
	return &Handler{
		pool:      pool,
		stripeKey: cfg.StripeSecretKey,
	}
}

type DashboardStats struct {
	TotalCustomers int64  `json:"total_customers"`
	TotalOrders    int64  `json:"total_orders"`
	TotalRevenue   string `json:"total_revenue"`
	ActiveServices int64  `json:"active_services"`
}

type Customer struct {
	ID        string    `json:"id"`
	Email     string    `json:"email"`
	Name      string    `json:"name"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"created_at"`
}

type Payment struct {
	ID                    string    `json:"id"`
	OrderID               string    `json:"order_id"`
	StripePaymentIntentID string    `json:"stripe_payment_intent_id"`
	Amount                string    `json:"amount"`
	Currency              string    `json:"currency"`
	Status                string    `json:"status"`
	PaymentMethod         string    `json:"payment_method"`
	CreatedAt             time.Time `json:"created_at"`
}

type CreateRefundRequest struct {
	PaymentID string `json:"payment_id" binding:"required"`
	Amount    int64  `json:"amount"`
	Reason    string `json:"reason"`
}

// GetDashboardStats 获取仪表板统计数据
func (h *Handler) GetDashboardStats(c *gin.Context) {
	ctx := context.Background()

	var stats DashboardStats

	// 总客户数
	err := h.pool.QueryRow(ctx, `SELECT COUNT(*) FROM users WHERE role = 'customer'`).Scan(&stats.TotalCustomers)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch customer count"})
		return
	}

	// 总订单数
	err = h.pool.QueryRow(ctx, `SELECT COUNT(*) FROM orders`).Scan(&stats.TotalOrders)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch order count"})
		return
	}

	// 总收入
	var totalRevenue int64
	err = h.pool.QueryRow(ctx, `SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'succeeded'`).Scan(&totalRevenue)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch revenue"})
		return
	}
	stats.TotalRevenue = strconv.FormatFloat(float64(totalRevenue)/100.0, 'f', 2, 64)

	// 活跃服务数
	err = h.pool.QueryRow(ctx, `SELECT COUNT(*) FROM services WHERE status = 'active'`).Scan(&stats.ActiveServices)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch active services"})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// ListCustomers 获取客户列表
func (h *Handler) ListCustomers(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	offset := (page - 1) * limit

	ctx := context.Background()

	// 查询总数
	var total int64
	err := h.pool.QueryRow(ctx, `SELECT COUNT(*) FROM users`).Scan(&total)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	// 查询客户列表
	rows, err := h.pool.Query(ctx,
		`SELECT id, email, name, role, created_at
		 FROM users
		 ORDER BY created_at DESC
		 LIMIT $1 OFFSET $2`,
		limit, offset,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	defer rows.Close()

	var customers []Customer
	for rows.Next() {
		var customer Customer
		err := rows.Scan(&customer.ID, &customer.Email, &customer.Name, &customer.Role, &customer.CreatedAt)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read customers"})
			return
		}
		customers = append(customers, customer)
	}

	if customers == nil {
		customers = []Customer{}
	}

	c.JSON(http.StatusOK, gin.H{
		"customers": customers,
		"total":     total,
		"page":      page,
		"limit":     limit,
	})
}

// AdminListPayments 获取所有支付记录
func (h *Handler) AdminListPayments(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	offset := (page - 1) * limit

	ctx := context.Background()

	// 查询总数
	var total int64
	err := h.pool.QueryRow(ctx, `SELECT COUNT(*) FROM payments`).Scan(&total)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	// 查询支付列表
	rows, err := h.pool.Query(ctx,
		`SELECT id, order_id, stripe_payment_intent_id, amount, currency, status, payment_method, created_at
		 FROM payments
		 ORDER BY created_at DESC
		 LIMIT $1 OFFSET $2`,
		limit, offset,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	defer rows.Close()

	var payments []Payment
	for rows.Next() {
		var payment Payment
		var amount int64
		err := rows.Scan(
			&payment.ID, &payment.OrderID, &payment.StripePaymentIntentID,
			&amount, &payment.Currency, &payment.Status, &payment.PaymentMethod, &payment.CreatedAt,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read payments"})
			return
		}
		payment.Amount = strconv.FormatFloat(float64(amount)/100.0, 'f', 2, 64)
		payments = append(payments, payment)
	}

	if payments == nil {
		payments = []Payment{}
	}

	c.JSON(http.StatusOK, gin.H{
		"payments": payments,
		"total":    total,
		"page":     page,
		"limit":    limit,
	})
}

// AdminCreateRefund 创建退款
func (h *Handler) AdminCreateRefund(c *gin.Context) {
	var req CreateRefundRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	ctx := context.Background()

	// 查询支付信息
	var stripePaymentIntentID, currency string
	var amount int64
	err := h.pool.QueryRow(ctx,
		`SELECT stripe_payment_intent_id, amount, currency FROM payments WHERE id = $1`,
		req.PaymentID,
	).Scan(&stripePaymentIntentID, &amount, &currency)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Payment not found"})
		return
	}

	// 如果未指定金额，则全额退款
	refundAmount := req.Amount
	if refundAmount == 0 {
		refundAmount = amount
	}

	// 创建 Stripe 退款
	params := &stripe.RefundParams{
		PaymentIntent: stripe.String(stripePaymentIntentID),
		Amount:        stripe.Int64(refundAmount),
	}
	if req.Reason != "" {
		params.Reason = stripe.String(req.Reason)
	}

	stripeRefund, err := refund.New(params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create refund in Stripe"})
		return
	}

	// 开始事务
	tx, err := h.pool.Begin(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	defer tx.Rollback(ctx)

	// 更新支付状态
	_, err = tx.Exec(ctx,
		`UPDATE payments SET status = 'refunded', updated_at = $1 WHERE id = $2`,
		time.Now(), req.PaymentID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update payment"})
		return
	}

	// 创建退款记录
	refundID := uuid.New().String()
	now := time.Now()
	_, err = tx.Exec(ctx,
		`INSERT INTO refunds (id, payment_id, stripe_refund_id, amount, currency, reason, status, created_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
		refundID, req.PaymentID, stripeRefund.ID, refundAmount, currency, req.Reason, stripeRefund.Status, now,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create refund record"})
		return
	}

	if err := tx.Commit(ctx); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"id":               refundID,
		"payment_id":       req.PaymentID,
		"stripe_refund_id": stripeRefund.ID,
		"amount":           strconv.FormatFloat(float64(refundAmount)/100.0, 'f', 2, 64),
		"currency":         currency,
		"status":           stripeRefund.Status,
		"created_at":       now,
	})
}
