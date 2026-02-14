package billing

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Handler struct {
	pool *pgxpool.Pool
}

func NewHandler(pool *pgxpool.Pool) *Handler {
	return &Handler{pool: pool}
}

type Invoice struct {
	ID            string          `json:"id"`
	UserID        string          `json:"user_id"`
	OrderID       string          `json:"order_id"`
	InvoiceNumber string          `json:"invoice_number"`
	Status        string          `json:"status"`
	Subtotal      string          `json:"subtotal"`
	Tax           string          `json:"tax"`
	Total         string          `json:"total"`
	Currency      string          `json:"currency"`
	DueDate       *time.Time      `json:"due_date"`
	PaidAt        *time.Time      `json:"paid_at"`
	Items         []InvoiceItem   `json:"items,omitempty"`
	CreatedAt     time.Time       `json:"created_at"`
	Metadata      json.RawMessage `json:"metadata,omitempty"`
}

type InvoiceItem struct {
	ID          string `json:"id"`
	Description string `json:"description"`
	Quantity    int    `json:"quantity"`
	UnitPrice   string `json:"unit_price"`
	Amount      string `json:"amount"`
}

type AdminInvoiceSummary struct {
	ID            string    `json:"id"`
	InvoiceNumber string    `json:"invoice_number"`
	CustomerName  string    `json:"customer_name"`
	CustomerEmail string    `json:"customer_email"`
	Status        string    `json:"status"`
	Amount        float64   `json:"amount"`
	CreatedAt     time.Time `json:"created_at"`
}

// ListInvoices 获取用户的发票列表
func (h *Handler) ListInvoices(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	invoices, total, err := h.listUserInvoices(c.Request.Context(), userID.(string), page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
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

	invoice, err := h.getUserInvoice(c.Request.Context(), userID.(string), c.Param("id"))
	if err != nil {
		switch {
		case errors.Is(err, ErrInvoiceNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "Invoice not found"})
		case errors.Is(err, ErrInvoiceForbidden):
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		}
		return
	}

	c.JSON(http.StatusOK, invoice)
}

// AdminListInvoices 管理员查看所有发票
func (h *Handler) AdminListInvoices(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	invoices, total, err := h.listAdminInvoices(c.Request.Context(), page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	c.Header("X-Total-Count", strconv.FormatInt(total, 10))
	c.Header("X-Page", strconv.Itoa(page))
	c.Header("X-Limit", strconv.Itoa(limit))
	c.JSON(http.StatusOK, invoices)
}
