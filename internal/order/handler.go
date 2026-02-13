package order

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Handler 订单处理器
type Handler struct {
	pool *pgxpool.Pool
}

// NewHandler 创建新的订单处理器
func NewHandler(pool *pgxpool.Pool) *Handler {
	return &Handler{
		pool: pool,
	}
}

// Order 订单
type Order struct {
	ID          string      `json:"id"`
	UserID      string      `json:"user_id"`
	Status      string      `json:"status"`
	TotalAmount string      `json:"total_amount"`
	Currency    string      `json:"currency"`
	Notes       *string     `json:"notes"`
	Items       []OrderItem `json:"items,omitempty"`
	CreatedAt   time.Time   `json:"created_at"`
	UpdatedAt   time.Time   `json:"updated_at"`
}

// OrderItem 订单项
type OrderItem struct {
	ID           string          `json:"id"`
	OrderID      string          `json:"order_id"`
	PlanID       string          `json:"plan_id"`
	PlanSnapshot json.RawMessage `json:"plan_snapshot"`
	Quantity     int             `json:"quantity"`
	UnitPrice    string          `json:"unit_price"`
	BillingCycle string          `json:"billing_cycle"`
	CreatedAt    time.Time       `json:"created_at"`
}

// CreateOrderRequest 创建订单请求
type CreateOrderRequest struct {
	Items []CreateOrderItemRequest `json:"items" binding:"required,min=1"`
	Notes *string                  `json:"notes"`
}

// CreateOrderItemRequest 创建订单项请求
type CreateOrderItemRequest struct {
	PlanID       string `json:"plan_id" binding:"required"`
	BillingCycle string `json:"billing_cycle" binding:"required,oneof=monthly quarterly annually"`
	Quantity     int    `json:"quantity" binding:"required,min=1"`
}

// UpdateOrderStatusRequest 更新订单状态请求
type UpdateOrderStatusRequest struct {
	Status string `json:"status" binding:"required"`
}

// CreateOrder 创建订单
func (h *Handler) CreateOrder(c *gin.Context) {
	var req CreateOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// 从上下文获取用户 ID
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	ctx := context.Background()

	// 开始事务
	tx, err := h.pool.Begin(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start transaction"})
		return
	}
	defer tx.Rollback(ctx)

	// 验证所有计划并获取价格
	type planInfo struct {
		ID             string
		Name           string
		ProductID      string
		Description    *string
		CPUCores       *int
		MemoryMB       *int
		DiskGB         *int
		BandwidthTB    *string
		PriceMonthly   *string
		PriceQuarterly *string
		PriceAnnually  *string
		SetupFee       string
		Features       json.RawMessage
		BillingCycle   string
		Quantity       int
		UnitPrice      string
	}

	plans := make([]planInfo, 0, len(req.Items))
	totalAmount := 0.0

	for _, item := range req.Items {
		var plan planInfo
		var priceMonthly, priceQuarterly, priceAnnually *string
		var isActive bool

		err := tx.QueryRow(ctx,
			`SELECT id, name, product_id, description, cpu_cores, memory_mb, disk_gb,
			        bandwidth_tb, price_monthly, price_quarterly, price_annually,
			        setup_fee, features, is_active
			 FROM plans
			 WHERE id = $1`,
			item.PlanID,
		).Scan(
			&plan.ID, &plan.Name, &plan.ProductID, &plan.Description,
			&plan.CPUCores, &plan.MemoryMB, &plan.DiskGB, &plan.BandwidthTB,
			&priceMonthly, &priceQuarterly, &priceAnnually,
			&plan.SetupFee, &plan.Features, &isActive,
		)

		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Plan not found: " + item.PlanID})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query plan"})
			return
		}

		// 检查计划是否激活
		if !isActive {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Plan is not active: " + item.PlanID})
			return
		}

		// 根据计费周期选择价格
		var price string
		switch item.BillingCycle {
		case "monthly":
			if priceMonthly == nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Monthly billing not available for plan: " + item.PlanID})
				return
			}
			price = *priceMonthly
		case "quarterly":
			if priceQuarterly == nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Quarterly billing not available for plan: " + item.PlanID})
				return
			}
			price = *priceQuarterly
		case "annually":
			if priceAnnually == nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Annual billing not available for plan: " + item.PlanID})
				return
			}
			price = *priceAnnually
		}

		plan.BillingCycle = item.BillingCycle
		plan.Quantity = item.Quantity
		plan.UnitPrice = price
		plan.PriceMonthly = priceMonthly
		plan.PriceQuarterly = priceQuarterly
		plan.PriceAnnually = priceAnnually

		// 计算总金额
		var priceFloat float64
		if _, err := fmt.Sscanf(price, "%f", &priceFloat); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid price format"})
			return
		}
		totalAmount += priceFloat * float64(item.Quantity)

		plans = append(plans, plan)
	}

	// 创建订单
	orderID := uuid.New().String()
	now := time.Now()

	var order Order
	err = tx.QueryRow(ctx,
		`INSERT INTO orders (id, user_id, status, total_amount, currency, notes, created_at, updated_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
		 RETURNING id, user_id, status, total_amount, currency, notes, created_at, updated_at`,
		orderID, userID, "draft", totalAmount, "USD", req.Notes, now,
	).Scan(&order.ID, &order.UserID, &order.Status, &order.TotalAmount, &order.Currency, &order.Notes, &order.CreatedAt, &order.UpdatedAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create order"})
		return
	}

	// 创建订单项
	order.Items = make([]OrderItem, 0, len(plans))
	for _, plan := range plans {
		// 创建计划快照
		snapshot := map[string]interface{}{
			"id":              plan.ID,
			"name":            plan.Name,
			"product_id":      plan.ProductID,
			"description":     plan.Description,
			"cpu_cores":       plan.CPUCores,
			"memory_mb":       plan.MemoryMB,
			"disk_gb":         plan.DiskGB,
			"bandwidth_tb":    plan.BandwidthTB,
			"price_monthly":   plan.PriceMonthly,
			"price_quarterly": plan.PriceQuarterly,
			"price_annually":  plan.PriceAnnually,
			"setup_fee":       plan.SetupFee,
			"features":        plan.Features,
		}

		snapshotJSON, err := json.Marshal(snapshot)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create plan snapshot"})
			return
		}

		itemID := uuid.New().String()
		var item OrderItem

		err = tx.QueryRow(ctx,
			`INSERT INTO order_items (id, order_id, plan_id, plan_snapshot, quantity, unit_price, billing_cycle, created_at)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
			 RETURNING id, order_id, plan_id, plan_snapshot, quantity, unit_price, billing_cycle, created_at`,
			itemID, orderID, plan.ID, snapshotJSON, plan.Quantity, plan.UnitPrice, plan.BillingCycle, now,
		).Scan(&item.ID, &item.OrderID, &item.PlanID, &item.PlanSnapshot, &item.Quantity, &item.UnitPrice, &item.BillingCycle, &item.CreatedAt)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create order item"})
			return
		}

		order.Items = append(order.Items, item)
	}

	// 提交事务
	if err := tx.Commit(ctx); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	c.JSON(http.StatusCreated, order)
}

// ListOrders 列出用户订单
func (h *Handler) ListOrders(c *gin.Context) {
	// 从上下文获取用户 ID
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	ctx := context.Background()

	// 查询订单
	rows, err := h.pool.Query(ctx,
		`SELECT id, user_id, status, total_amount, currency, notes, created_at, updated_at
		 FROM orders
		 WHERE user_id = $1
		 ORDER BY created_at DESC`,
		userID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query orders"})
		return
	}
	defer rows.Close()

	orders := make([]Order, 0)
	for rows.Next() {
		var order Order
		err := rows.Scan(&order.ID, &order.UserID, &order.Status, &order.TotalAmount, &order.Currency, &order.Notes, &order.CreatedAt, &order.UpdatedAt)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan order"})
			return
		}
		orders = append(orders, order)
	}

	if err := rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to iterate orders"})
		return
	}

	c.JSON(http.StatusOK, orders)
}

// GetOrder 获取订单详情
func (h *Handler) GetOrder(c *gin.Context) {
	orderID := c.Param("id")

	// 从上下文获取用户 ID
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	ctx := context.Background()

	// 查询订单并验证所有权
	var order Order
	err := h.pool.QueryRow(ctx,
		`SELECT id, user_id, status, total_amount, currency, notes, created_at, updated_at
		 FROM orders
		 WHERE id = $1 AND user_id = $2`,
		orderID, userID,
	).Scan(&order.ID, &order.UserID, &order.Status, &order.TotalAmount, &order.Currency, &order.Notes, &order.CreatedAt, &order.UpdatedAt)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query order"})
		return
	}

	// 查询订单项
	rows, err := h.pool.Query(ctx,
		`SELECT id, order_id, plan_id, plan_snapshot, quantity, unit_price, billing_cycle, created_at
		 FROM order_items
		 WHERE order_id = $1`,
		orderID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query order items"})
		return
	}
	defer rows.Close()

	order.Items = make([]OrderItem, 0)
	for rows.Next() {
		var item OrderItem
		err := rows.Scan(&item.ID, &item.OrderID, &item.PlanID, &item.PlanSnapshot, &item.Quantity, &item.UnitPrice, &item.BillingCycle, &item.CreatedAt)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan order item"})
			return
		}
		order.Items = append(order.Items, item)
	}

	if err := rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to iterate order items"})
		return
	}

	c.JSON(http.StatusOK, order)
}

// AdminListOrders 管理员列出所有订单
func (h *Handler) AdminListOrders(c *gin.Context) {
	ctx := context.Background()

	// 查询所有订单
	rows, err := h.pool.Query(ctx,
		`SELECT id, user_id, status, total_amount, currency, notes, created_at, updated_at
		 FROM orders
		 ORDER BY created_at DESC`,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query orders"})
		return
	}
	defer rows.Close()

	orders := make([]Order, 0)
	for rows.Next() {
		var order Order
		err := rows.Scan(&order.ID, &order.UserID, &order.Status, &order.TotalAmount, &order.Currency, &order.Notes, &order.CreatedAt, &order.UpdatedAt)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan order"})
			return
		}
		orders = append(orders, order)
	}

	if err := rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to iterate orders"})
		return
	}

	c.JSON(http.StatusOK, orders)
}

// AdminUpdateOrderStatus 管理员更新订单状态
func (h *Handler) AdminUpdateOrderStatus(c *gin.Context) {
	orderID := c.Param("id")

	var req UpdateOrderStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	ctx := context.Background()

	// 查询当前订单状态
	var currentStatus string
	err := h.pool.QueryRow(ctx,
		`SELECT status FROM orders WHERE id = $1`,
		orderID,
	).Scan(&currentStatus)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query order"})
		return
	}

	// 验证状态转换
	if !isValidStatusTransition(currentStatus, req.Status) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid status transition from " + currentStatus + " to " + req.Status})
		return
	}

	// 更新订单状态
	now := time.Now()
	var order Order
	err = h.pool.QueryRow(ctx,
		`UPDATE orders
		 SET status = $1, updated_at = $2
		 WHERE id = $3
		 RETURNING id, user_id, status, total_amount, currency, notes, created_at, updated_at`,
		req.Status, now, orderID,
	).Scan(&order.ID, &order.UserID, &order.Status, &order.TotalAmount, &order.Currency, &order.Notes, &order.CreatedAt, &order.UpdatedAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update order status"})
		return
	}

	c.JSON(http.StatusOK, order)
}

// isValidStatusTransition 验证订单状态转换是否有效
func isValidStatusTransition(from, to string) bool {
	// 定义有效的状态转换
	validTransitions := map[string][]string{
		"draft":           {"pending_payment", "cancelled"},
		"pending_payment": {"paid", "cancelled"},
		"paid":            {"provisioning", "refunded", "cancelled"},
		"provisioning":    {"active", "cancelled"},
		"active":          {}, // active 状态不能转换到其他状态
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
