package admin

import (
	"net/http"
	"strconv"
	"time"

	"github.com/adiecho/echobilling/internal/app"
	"github.com/adiecho/echobilling/internal/common"
	"github.com/gin-gonic/gin"
	"github.com/hibiken/asynq"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Handler struct {
	pool        *pgxpool.Pool
	stripeKey   string
	redisAddr   string
	asynqClient *asynq.Client
}

func NewHandler(pool *pgxpool.Pool, cfg *app.Config, asynqClient *asynq.Client) *Handler {
	return &Handler{
		pool:        pool,
		stripeKey:   cfg.StripeSecretKey,
		redisAddr:   cfg.RedisAddr,
		asynqClient: asynqClient,
	}
}

type DashboardStats struct {
	TotalCustomers int64   `json:"total_customers"`
	TotalOrders    int64   `json:"total_orders"`
	TotalRevenue   string  `json:"total_revenue"`
	Revenue        float64 `json:"revenue"`
	ActiveServices int64   `json:"active_services"`
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
	Amount                float64   `json:"amount"`
	Currency              string    `json:"currency"`
	Status                string    `json:"status"`
	Method                string    `json:"method"`
	PaymentMethod         string    `json:"payment_method"`
	CreatedAt             time.Time `json:"created_at"`
}

type CreateRefundRequest struct {
	PaymentID string `json:"payment_id" binding:"required"`
	Amount    int64  `json:"amount"` // 单位：分；0 表示全额退款
	Reason    string `json:"reason"`
}

type QueueStats struct {
	Queue      string `json:"queue"`
	Size       int    `json:"size"`
	Pending    int    `json:"pending"`
	Active     int    `json:"active"`
	Scheduled  int    `json:"scheduled"`
	Retry      int    `json:"retry"`
	Archived   int    `json:"archived"`
	Completed  int    `json:"completed"`
	Processing int    `json:"processing_today"`
	Failed     int    `json:"failed_today"`
	Error      string `json:"error,omitempty"`
}

type ProvisioningJob struct {
	ID          string     `json:"id"`
	ServiceID   string     `json:"service_id"`
	JobType     string     `json:"job_type"`
	Status      string     `json:"status"`
	Attempts    int        `json:"attempts"`
	MaxAttempts int        `json:"max_attempts"`
	LastError   *string    `json:"last_error"`
	StartedAt   *time.Time `json:"started_at"`
	CompletedAt *time.Time `json:"completed_at"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

type SystemInfo struct {
	APIVersion     string `json:"api_version"`
	DatabaseStatus string `json:"database_status"`
	RedisStatus    string `json:"redis_status"`
	WorkerStatus   string `json:"worker_status"`
}

type RefundResponse struct {
	ID             string    `json:"id"`
	PaymentID      string    `json:"payment_id"`
	StripeRefundID string    `json:"stripe_refund_id"`
	Amount         string    `json:"amount"`
	Currency       string    `json:"currency"`
	Status         string    `json:"status"`
	CreatedAt      time.Time `json:"created_at"`
}

type ProvisioningResult struct {
	JobID         string    `json:"job_id"`
	TaskID        string    `json:"task_id"`
	ServiceID     string    `json:"service_id"`
	OrderID       string    `json:"order_id"`
	Queue         string    `json:"queue"`
	NextProcessAt time.Time `json:"next_process_at"`
	Status        string    `json:"status"`
}

type SystemJobsResponse struct {
	Queues   []QueueStats      `json:"queues"`
	JobStats map[string]int64  `json:"job_stats"`
	Jobs     []ProvisioningJob `json:"jobs"`
}

func normalizePagination(c *gin.Context, maxLimit int) (int, int) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > maxLimit {
		limit = 20
	}
	return page, limit
}

// GetDashboardStats 获取仪表板统计数据
func (h *Handler) GetDashboardStats(c *gin.Context) {
	stats, err := h.getDashboardStats(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch dashboard stats"})
		return
	}
	c.JSON(http.StatusOK, stats)
}

// GetSystemInfo 获取系统状态摘要
func (h *Handler) GetSystemInfo(c *gin.Context) {
	c.JSON(http.StatusOK, h.getSystemInfo(c.Request.Context()))
}

// ListCustomers 获取客户列表
func (h *Handler) ListCustomers(c *gin.Context) {
	page, limit := normalizePagination(c, 100)
	customers, total, err := h.listCustomers(c.Request.Context(), page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	c.Header("X-Total-Count", strconv.FormatInt(total, 10))
	c.Header("X-Page", strconv.Itoa(page))
	c.Header("X-Limit", strconv.Itoa(limit))
	c.JSON(http.StatusOK, customers)
}

// AdminListPayments 获取所有支付记录
func (h *Handler) AdminListPayments(c *gin.Context) {
	page, limit := normalizePagination(c, 100)
	payments, total, err := h.listPayments(c.Request.Context(), page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	c.Header("X-Total-Count", strconv.FormatInt(total, 10))
	c.Header("X-Page", strconv.Itoa(page))
	c.Header("X-Limit", strconv.Itoa(limit))
	c.JSON(http.StatusOK, payments)
}

// AdminCreateRefund 创建退款
func (h *Handler) AdminCreateRefund(c *gin.Context) {
	var req CreateRefundRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	var createdBy string
	if uid, ok := c.Get("user_id"); ok {
		if userID, ok := uid.(string); ok {
			createdBy = userID
		}
	}

	resp, err := h.createRefund(c.Request.Context(), createdBy, req)
	if err != nil {
		common.WriteServiceError(c, err)
		return
	}

	c.JSON(http.StatusCreated, resp)
}

// AdminProvisionService 手动开通服务
func (h *Handler) AdminProvisionService(c *gin.Context) {
	resp, err := h.provisionService(c.Request.Context(), c.Param("id"))
	if err != nil {
		common.WriteServiceError(c, err)
		return
	}

	c.JSON(http.StatusAccepted, resp)
}

// AdminGetSystemJobs 查看任务队列和作业状态
func (h *Handler) AdminGetSystemJobs(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if limit < 1 || limit > 200 {
		limit = 20
	}

	resp, err := h.getSystemJobs(c.Request.Context(), limit)
	if err != nil {
		common.WriteServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, resp)
}
