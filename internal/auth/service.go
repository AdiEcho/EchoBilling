package auth

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/adiecho/echobilling/internal/common"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/redis/go-redis/v9"
)

func (h *Handler) registerUser(ctx context.Context, req RegisterRequest) (*AuthResponse, *common.ServiceError) {
	var exists bool
	err := h.pool.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)", req.Email).Scan(&exists)
	if err != nil {
		return nil, common.NewServiceError(http.StatusInternalServerError, "Database error", err)
	}
	if exists {
		return nil, common.NewServiceError(http.StatusConflict, "Email already registered", nil)
	}

	hashedPassword, err := HashPassword(req.Password)
	if err != nil {
		return nil, common.NewServiceError(http.StatusInternalServerError, "Failed to hash password", err)
	}

	userID := uuid.New().String()
	now := time.Now()
	var user UserInfo
	err = h.pool.QueryRow(ctx,
		`INSERT INTO users (id, email, password_hash, name, role, created_at, updated_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $6)
		 RETURNING id, email, name, role, created_at`,
		userID, req.Email, hashedPassword, req.Name, "customer", now,
	).Scan(&user.ID, &user.Email, &user.Name, &user.Role, &user.CreatedAt)
	if err != nil {
		return nil, common.NewServiceError(http.StatusInternalServerError, "Failed to create user", err)
	}

	authResp, serviceErr := h.issueTokens(user)
	if serviceErr != nil {
		return nil, serviceErr
	}
	return authResp, nil
}

func (h *Handler) loginUser(ctx context.Context, req LoginRequest) (*AuthResponse, *common.ServiceError) {
	var user UserInfo
	var passwordHash string
	var twoFactorEnabled bool
	err := h.pool.QueryRow(ctx,
		`SELECT id, email, name, role, password_hash, two_factor_enabled, created_at
		 FROM users
		 WHERE email = $1`,
		req.Email,
	).Scan(&user.ID, &user.Email, &user.Name, &user.Role, &passwordHash, &twoFactorEnabled, &user.CreatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, common.NewServiceError(http.StatusUnauthorized, "Invalid email or password", err)
		}
		return nil, common.NewServiceError(http.StatusInternalServerError, "Database error", err)
	}

	valid, err := VerifyPassword(req.Password, passwordHash)
	if err != nil || !valid {
		return nil, common.NewServiceError(http.StatusUnauthorized, "Invalid email or password", err)
	}

	user.TwoFactorEnabled = twoFactorEnabled

	// 用户已启用 2FA，返回临时 token
	if twoFactorEnabled {
		token, err := generate2FAToken()
		if err != nil {
			return nil, common.NewServiceError(http.StatusInternalServerError, "Failed to generate 2FA token", err)
		}
		// 存入 Redis，TTL 5 分钟，绑定 userID
		key := fmt.Sprintf("2fa:token:%s", token)
		if err := h.rdb.Set(ctx, key, user.ID, 5*time.Minute).Err(); err != nil {
			return nil, common.NewServiceError(http.StatusInternalServerError, "Failed to store 2FA token", err)
		}
		return &AuthResponse{
			Requires2FA:    true,
			TwoFactorToken: token,
		}, nil
	}

	authResp, serviceErr := h.issueTokens(user)
	if serviceErr != nil {
		return nil, serviceErr
	}
	return authResp, nil
}

func (h *Handler) getUserByID(ctx context.Context, userID string) (*UserInfo, *common.ServiceError) {
	var user UserInfo
	err := h.pool.QueryRow(ctx,
		`SELECT id, email, name, role, two_factor_enabled, created_at
		 FROM users
		 WHERE id = $1`,
		userID,
	).Scan(&user.ID, &user.Email, &user.Name, &user.Role, &user.TwoFactorEnabled, &user.CreatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, common.NewServiceError(http.StatusNotFound, "User not found", err)
		}
		return nil, common.NewServiceError(http.StatusInternalServerError, "Database error", err)
	}

	return &user, nil
}

func (h *Handler) refreshAuth(ctx context.Context, refreshToken string) (*AuthResponse, *common.ServiceError) {
	claims, err := ValidateToken(refreshToken, h.jwtSecret)
	if err != nil || claims.UserID == "" {
		return nil, common.NewServiceError(http.StatusUnauthorized, "Invalid or expired refresh token", err)
	}

	user, serviceErr := h.getUserByID(ctx, claims.UserID)
	if serviceErr != nil {
		// Refresh 场景统一返回 401
		if serviceErr.StatusCode == http.StatusNotFound {
			serviceErr.StatusCode = http.StatusUnauthorized
		}
		return nil, serviceErr
	}

	authResp, issueErr := h.issueTokens(*user)
	if issueErr != nil {
		return nil, issueErr
	}
	return authResp, nil
}

func (h *Handler) issueTokens(user UserInfo) (*AuthResponse, *common.ServiceError) {
	accessToken, err := GenerateAccessToken(user.ID, user.Role, h.jwtSecret, h.jwtExpiry)
	if err != nil {
		return nil, common.NewServiceError(http.StatusInternalServerError, "Failed to generate access token", err)
	}

	refreshToken, err := GenerateRefreshToken(user.ID, h.jwtSecret)
	if err != nil {
		return nil, common.NewServiceError(http.StatusInternalServerError, "Failed to generate refresh token", err)
	}

	return &AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User:         &user,
	}, nil
}

// generate2FAToken 生成安全随机 2FA 临时 token
func generate2FAToken() (string, error) {
	return uuid.New().String(), nil
}

// validate2FAToken 验证 2FA 临时 token 并返回 userID
func (h *Handler) validate2FAToken(ctx context.Context, token string) (string, error) {
	key := fmt.Sprintf("2fa:token:%s", token)
	userID, err := h.rdb.Get(ctx, key).Result()
	if err == redis.Nil {
		return "", fmt.Errorf("invalid or expired 2FA token")
	}
	if err != nil {
		return "", fmt.Errorf("check 2FA token: %w", err)
	}
	return userID, nil
}

// consume2FAToken 消费 2FA 临时 token
func (h *Handler) consume2FAToken(ctx context.Context, token string) {
	key := fmt.Sprintf("2fa:token:%s", token)
	h.rdb.Del(ctx, key)
}
