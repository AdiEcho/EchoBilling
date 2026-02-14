package setup

import (
	"context"
	"net/http"
	"regexp"
	"time"

	"github.com/adiecho/echobilling/internal/auth"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

var emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)

type Handler struct {
	pool      *pgxpool.Pool
	jwtSecret string
	jwtExpiry time.Duration
}

func NewHandler(pool *pgxpool.Pool, jwtSecret string, jwtExpiry time.Duration) *Handler {
	return &Handler{
		pool:      pool,
		jwtSecret: jwtSecret,
		jwtExpiry: jwtExpiry,
	}
}

type StatusResponse struct {
	NeedsSetup bool `json:"needs_setup"`
}

type CreateAdminRequest struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
	Name     string `json:"name"`
}

func (h *Handler) hasAdmin(ctx context.Context) (bool, error) {
	var exists bool
	err := h.pool.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM users WHERE role = 'admin')").Scan(&exists)
	return exists, err
}

// GetStatus 检查系统是否需要初始化设置
func (h *Handler) GetStatus(c *gin.Context) {
	exists, err := h.hasAdmin(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	c.JSON(http.StatusOK, StatusResponse{NeedsSetup: !exists})
}

// CreateAdmin 创建初始管理员账户（仅当无管理员时可用）
func (h *Handler) CreateAdmin(c *gin.Context) {
	ctx := c.Request.Context()

	// 先检查是否已有管理员
	exists, err := h.hasAdmin(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	if exists {
		c.JSON(http.StatusForbidden, gin.H{"error": "Admin already exists, setup is disabled"})
		return
	}

	var req CreateAdminRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	if !emailRegex.MatchString(req.Email) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid email format"})
		return
	}

	if len(req.Password) < 8 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Password must be at least 8 characters"})
		return
	}

	hashedPassword, err := auth.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	userID := uuid.New().String()
	now := time.Now()

	var user auth.UserInfo
	err = h.pool.QueryRow(ctx,
		`INSERT INTO users (id, email, password_hash, name, role, created_at, updated_at)
		 VALUES ($1, $2, $3, $4, 'admin', $5, $5)
		 RETURNING id, email, name, role, created_at`,
		userID, req.Email, hashedPassword, req.Name, now,
	).Scan(&user.ID, &user.Email, &user.Name, &user.Role, &user.CreatedAt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create admin user"})
		return
	}

	// 创建成功后签发 token，让管理员直接登录
	accessToken, err := auth.GenerateAccessToken(user.ID, user.Role, h.jwtSecret, h.jwtExpiry)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	refreshToken, err := auth.GenerateRefreshToken(user.ID, h.jwtSecret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate refresh token"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"access_token":  accessToken,
		"refresh_token": refreshToken,
		"user":          user,
	})
}
