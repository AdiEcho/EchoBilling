package billing

import (
	"context"
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Handler struct {
	pool *pgxpool.Pool
}

func NewHandler(pool *pgxpool.Pool) *Handler {
	return &Handler{pool: pool}
}

type Invoice struct {
	ID            string        `json:"id"`
	UserID        string        `json:"user_id"`
	OrderID       string        `json:"order_id"`
	InvoiceNumber string        `json:"invoice_number"`
	Status        string        `json:"status"`
	Subtotal      string        `json:"subtotal"`
	Tax           string        `json:"tax"`
	Total         string        `json:"total"`
	Currency      string        `json:"currency"`
	DueDate       *time.Time    `json:"due_date"`
	PaidAt        *time.Time    `json:"paid_at"`
	Items         []InvoiceItem `json:"items,omitempty"`
	CreatedAt     time.Time     `json:"created_at"`
}

type InvoiceItem struct {
	ID          string `json:"id"`
	Description string `json:"description"`
	Quantity    int    `json:"quantity"`
	UnitPrice   string `json:"unit_price"`
	Amount      string `json:"amount"`
}

// ListInvoices 获取用户的发票列表
func (h *Handler) ListInvoices(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// 分页参数
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
	err := h.pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM invoices WHERE user_id = $1`,
		userID,
	).Scan(&total)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	// 查询发票列表
	rows, err := h.pool.Query(ctx,
		`SELECT id, user_id, order_id, invoice_number, status, subtotal, tax, total, currency, due_date, paid_at, created_at
		 FROM invoices
		 WHERE user_id = $1
		 ORDER BY created_at DESC
		 LIMIT $2 OFFSET $3`,
		userID, limit, offset,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	defer rows.Close()

	var invoices []Invoice
	for rows.Next() {
		var inv Invoice
		var subtotal, tax, total int64
		err := rows.Scan(
			&inv.ID, &inv.UserID, &inv.OrderID, &inv.InvoiceNumber, &inv.Status,
			&subtotal, &tax, &total, &inv.Currency, &inv.DueDate, &inv.PaidAt, &inv.CreatedAt,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read invoices"})
			return
		}

		inv.Subtotal = formatAmount(subtotal)
		inv.Tax = formatAmount(tax)
		inv.Total = formatAmount(total)
		invoices = append(invoices, inv)
	}

	if invoices == nil {
		invoices = []Invoice{}
	}

	c.JSON(http.StatusOK, gin.H{
		"invoices": invoices,
		"total":    total,
		"page":     page,
		"limit":    limit,
	})
}

// GetInvoice 获取单个发票详情
func (h *Handler) GetInvoice(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	invoiceID := c.Param("id")
	ctx := context.Background()

	// 查询发票
	var inv Invoice
	var subtotal, tax, total int64
	err := h.pool.QueryRow(ctx,
		`SELECT id, user_id, order_id, invoice_number, status, subtotal, tax, total, currency, due_date, paid_at, created_at
		 FROM invoices
		 WHERE id = $1`,
		invoiceID,
	).Scan(
		&inv.ID, &inv.UserID, &inv.OrderID, &inv.InvoiceNumber, &inv.Status,
		&subtotal, &tax, &total, &inv.Currency, &inv.DueDate, &inv.PaidAt, &inv.CreatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Invoice not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	// 验证所有权
	if inv.UserID != userID.(string) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	inv.Subtotal = formatAmount(subtotal)
	inv.Tax = formatAmount(tax)
	inv.Total = formatAmount(total)

	// 查询发票项
	rows, err := h.pool.Query(ctx,
		`SELECT id, description, quantity, unit_price, amount
		 FROM invoice_items
		 WHERE invoice_id = $1
		 ORDER BY created_at`,
		invoiceID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch invoice items"})
		return
	}
	defer rows.Close()

	var items []InvoiceItem
	for rows.Next() {
		var item InvoiceItem
		var unitPrice, amount int64
		err := rows.Scan(&item.ID, &item.Description, &item.Quantity, &unitPrice, &amount)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read invoice items"})
			return
		}

		item.UnitPrice = formatAmount(unitPrice)
		item.Amount = formatAmount(amount)
		items = append(items, item)
	}

	if items == nil {
		items = []InvoiceItem{}
	}
	inv.Items = items

	c.JSON(http.StatusOK, inv)
}

// AdminListInvoices 管理员查看所有发票
func (h *Handler) AdminListInvoices(c *gin.Context) {
	// 分页参数
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
	err := h.pool.QueryRow(ctx, `SELECT COUNT(*) FROM invoices`).Scan(&total)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	// 查询发票列表
	rows, err := h.pool.Query(ctx,
		`SELECT id, user_id, order_id, invoice_number, status, subtotal, tax, total, currency, due_date, paid_at, created_at
		 FROM invoices
		 ORDER BY created_at DESC
		 LIMIT $1 OFFSET $2`,
		limit, offset,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	defer rows.Close()

	var invoices []Invoice
	for rows.Next() {
		var inv Invoice
		var subtotal, tax, total int64
		err := rows.Scan(
			&inv.ID, &inv.UserID, &inv.OrderID, &inv.InvoiceNumber, &inv.Status,
			&subtotal, &tax, &total, &inv.Currency, &inv.DueDate, &inv.PaidAt, &inv.CreatedAt,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read invoices"})
			return
		}

		inv.Subtotal = formatAmount(subtotal)
		inv.Tax = formatAmount(tax)
		inv.Total = formatAmount(total)
		invoices = append(invoices, inv)
	}

	if invoices == nil {
		invoices = []Invoice{}
	}

	c.JSON(http.StatusOK, gin.H{
		"invoices": invoices,
		"total":    total,
		"page":     page,
		"limit":    limit,
	})
}

func formatAmount(amount int64) string {
	return strconv.FormatFloat(float64(amount)/100.0, 'f', 2, 64)
}
