package customer

import (
	"context"
	"net/http"
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

type StatsResponse struct {
	ActiveServices int64   `json:"active_services"`
	PendingOrders  int64   `json:"pending_orders"`
	UnpaidInvoices int64   `json:"unpaid_invoices"`
	TotalSpent     float64 `json:"total_spent"`
}

type ServiceSummary struct {
	ID        string     `json:"id"`
	Hostname  string     `json:"hostname"`
	IPAddress string     `json:"ip_address"`
	PlanName  string     `json:"plan_name"`
	Status    string     `json:"status"`
	ExpiresAt *time.Time `json:"expires_at"`
	CreatedAt time.Time  `json:"created_at"`
}

type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password" binding:"required"`
	NewPassword     string `json:"new_password" binding:"required"`
}

type ServiceError struct {
	StatusCode int
	Message    string
	Err        error
}

func newServiceError(statusCode int, message string, err error) *ServiceError {
	return &ServiceError{
		StatusCode: statusCode,
		Message:    message,
		Err:        err,
	}
}

func writeServiceError(c *gin.Context, err *ServiceError) {
	if err == nil {
		return
	}
	c.JSON(err.StatusCode, gin.H{"error": err.Message})
}

func userIDFromContext(c *gin.Context) (string, bool) {
	userIDValue, exists := c.Get("user_id")
	if !exists {
		return "", false
	}
	userID, ok := userIDValue.(string)
	return userID, ok && userID != ""
}

func (h *Handler) GetStats(c *gin.Context) {
	userID, ok := userIDFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	stats, err := h.getStats(context.Background(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query stats"})
		return
	}

	c.JSON(http.StatusOK, stats)
}

func (h *Handler) ListServices(c *gin.Context) {
	userID, ok := userIDFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	services, err := h.listServices(context.Background(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query services"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"services": services})
}

func (h *Handler) GetService(c *gin.Context) {
	userID, ok := userIDFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	serviceID := c.Param("id")

	service, err := h.getService(context.Background(), userID, serviceID)
	if err != nil {
		writeServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, service)
}

func (h *Handler) ChangePassword(c *gin.Context) {
	var req ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	if len(req.NewPassword) < 8 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Password must be at least 8 characters"})
		return
	}

	userID, ok := userIDFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	err := h.changePassword(context.Background(), userID, req)
	if err != nil {
		writeServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password updated"})
}
