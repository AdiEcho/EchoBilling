package auth

import (
	"context"
	"errors"
	"net/http"
	"time"

	"github.com/adiecho/echobilling/internal/common"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
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
	err := h.pool.QueryRow(ctx,
		`SELECT id, email, name, role, password_hash, created_at
		 FROM users
		 WHERE email = $1`,
		req.Email,
	).Scan(&user.ID, &user.Email, &user.Name, &user.Role, &passwordHash, &user.CreatedAt)
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

	authResp, serviceErr := h.issueTokens(user)
	if serviceErr != nil {
		return nil, serviceErr
	}
	return authResp, nil
}

func (h *Handler) getUserByID(ctx context.Context, userID string) (*UserInfo, *common.ServiceError) {
	var user UserInfo
	err := h.pool.QueryRow(ctx,
		`SELECT id, email, name, role, created_at
		 FROM users
		 WHERE id = $1`,
		userID,
	).Scan(&user.ID, &user.Email, &user.Name, &user.Role, &user.CreatedAt)
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
		User:         user,
	}, nil
}
