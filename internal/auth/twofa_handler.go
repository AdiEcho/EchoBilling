package auth

import (
	"net/http"

	"github.com/adiecho/echobilling/internal/common"
	"github.com/gin-gonic/gin"
)

// Verify2FARequest 2FA 验证请求（登录时）
type Verify2FARequest struct {
	TwoFactorToken string `json:"two_factor_token" binding:"required"`
	Code           string `json:"code" binding:"required"`
	Method         string `json:"method" binding:"required"` // totp, email, recovery
}

// Send2FAEmailRequest 发送邮箱验证码请求（登录时）
type Send2FAEmailRequest struct {
	TwoFactorToken string `json:"two_factor_token" binding:"required"`
}

// Setup2FAEnableRequest 启用 2FA 确认请求
type Setup2FAEnableRequest struct {
	Code   string `json:"code" binding:"required"`
	Method string `json:"method" binding:"required"` // totp, email
	Secret string `json:"secret,omitempty"`          // TOTP 设置时传回
}

// Disable2FARequest 禁用 2FA 请求
type Disable2FARequest struct {
	Password string `json:"password" binding:"required"`
}

// RegenerateRecoveryRequest 重新生成恢复码请求
type RegenerateRecoveryRequest struct {
	Password string `json:"password" binding:"required"`
}

// Verify2FA 登录时验证 2FA 码
func (h *Handler) Verify2FA(c *gin.Context) {
	var req Verify2FARequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	ctx := c.Request.Context()

	// 验证临时 token
	userID, err := h.validate2FAToken(ctx, req.TwoFactorToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired 2FA token"})
		return
	}

	// 获取用户 2FA 信息
	var totpSecret *string
	var twoFactorMethod *string
	var recoveryCodes []string
	err = h.pool.QueryRow(ctx,
		`SELECT totp_secret, two_factor_method::text, recovery_codes FROM users WHERE id = $1`,
		userID,
	).Scan(&totpSecret, &twoFactorMethod, &recoveryCodes)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	verified := false

	switch req.Method {
	case "totp":
		if totpSecret == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "TOTP not configured"})
			return
		}
		// 解密 TOTP secret
		decrypted, err := DecryptTOTPSecret(*totpSecret, h.jwtSecret)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decrypt TOTP secret"})
			return
		}
		verified = ValidateTOTPCode(decrypted, req.Code)

	case "email":
		if twoFactorMethod == nil || *twoFactorMethod != "email" {
			// 也允许 TOTP 用户使用邮箱验证码作为备选
		}
		ok, err := VerifyEmailCode(ctx, h.rdb, userID, req.Code)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Verification error"})
			return
		}
		verified = ok

	case "recovery":
		idx := VerifyRecoveryCode(req.Code, recoveryCodes)
		if idx >= 0 {
			verified = true
			// 消费恢复码：从数组中移除
			newCodes := append(recoveryCodes[:idx], recoveryCodes[idx+1:]...)
			_, err := h.pool.Exec(ctx,
				`UPDATE users SET recovery_codes = $1 WHERE id = $2`,
				newCodes, userID,
			)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to consume recovery code"})
				return
			}
		}

	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid 2FA method"})
		return
	}

	if !verified {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid verification code"})
		return
	}

	// 验证成功，消费 2FA token
	h.consume2FAToken(ctx, req.TwoFactorToken)

	// 签发 JWT
	user, svcErr := h.getUserByID(ctx, userID)
	if svcErr != nil {
		common.WriteServiceError(c, svcErr)
		return
	}

	authResp, svcErr := h.issueTokens(*user)
	if svcErr != nil {
		common.WriteServiceError(c, svcErr)
		return
	}

	c.JSON(http.StatusOK, authResp)
}

// Send2FAEmail 登录时发送邮箱验证码
func (h *Handler) Send2FAEmail(c *gin.Context) {
	var req Send2FAEmailRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	ctx := c.Request.Context()

	userID, err := h.validate2FAToken(ctx, req.TwoFactorToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired 2FA token"})
		return
	}

	// 获取用户邮箱
	var email string
	err = h.pool.QueryRow(ctx, `SELECT email FROM users WHERE id = $1`, userID).Scan(&email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	code, err := GenerateEmailCode()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate code"})
		return
	}

	if err := StoreEmailCode(ctx, h.rdb, userID, code); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to store code"})
		return
	}

	if err := SendEmailCode(h.smtpCfg, email, code); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send email"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Verification code sent"})
}

// SetupTOTP 获取 TOTP 密钥和 QR 码数据（需登录）
func (h *Handler) SetupTOTP(c *gin.Context) {
	userID, ok := common.GetUserID(c)
	if !ok {
		return
	}

	ctx := c.Request.Context()

	var email string
	err := h.pool.QueryRow(ctx, `SELECT email FROM users WHERE id = $1`, userID).Scan(&email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	secret, uri, err := GenerateTOTPSecret(email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate TOTP secret"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"secret": secret,
		"uri":    uri,
	})
}

// SetupEmail 发送邮箱设置验证码（需登录）
func (h *Handler) SetupEmail(c *gin.Context) {
	userID, ok := common.GetUserID(c)
	if !ok {
		return
	}

	ctx := c.Request.Context()

	var email string
	err := h.pool.QueryRow(ctx, `SELECT email FROM users WHERE id = $1`, userID).Scan(&email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	code, err := GenerateEmailCode()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate code"})
		return
	}

	if err := StoreEmailCode(ctx, h.rdb, userID, code); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to store code"})
		return
	}

	if err := SendEmailCode(h.smtpCfg, email, code); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send email"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Verification code sent"})
}

// Enable2FA 确认验证码后启用 2FA（需登录）
func (h *Handler) Enable2FA(c *gin.Context) {
	userID, ok := common.GetUserID(c)
	if !ok {
		return
	}

	var req Setup2FAEnableRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	ctx := c.Request.Context()

	switch req.Method {
	case "totp":
		if req.Secret == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Secret is required for TOTP setup"})
			return
		}
		// 验证用户输入的 TOTP 码
		if !ValidateTOTPCode(req.Secret, req.Code) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid TOTP code"})
			return
		}
		// 加密 TOTP secret 后存储
		encrypted, err := EncryptTOTPSecret(req.Secret, h.jwtSecret)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to encrypt secret"})
			return
		}

		// 生成恢复码
		recoveryCodes, err := GenerateRecoveryCodes(recoveryCodeNum)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate recovery codes"})
			return
		}
		hashedCodes := HashRecoveryCodes(recoveryCodes)

		_, err = h.pool.Exec(ctx,
			`UPDATE users SET totp_secret = $1, two_factor_enabled = TRUE, two_factor_method = 'totp', recovery_codes = $2 WHERE id = $3`,
			encrypted, hashedCodes, userID,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to enable 2FA"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message":        "2FA enabled successfully",
			"recovery_codes": recoveryCodes,
		})

	case "email":
		// 验证邮箱验证码
		ok, err := VerifyEmailCode(ctx, h.rdb, userID, req.Code)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Verification error"})
			return
		}
		if !ok {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid verification code"})
			return
		}

		// 生成恢复码
		recoveryCodes, err := GenerateRecoveryCodes(recoveryCodeNum)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate recovery codes"})
			return
		}
		hashedCodes := HashRecoveryCodes(recoveryCodes)

		_, err = h.pool.Exec(ctx,
			`UPDATE users SET two_factor_enabled = TRUE, two_factor_method = 'email', recovery_codes = $1 WHERE id = $2`,
			hashedCodes, userID,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to enable 2FA"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message":        "2FA enabled successfully",
			"recovery_codes": recoveryCodes,
		})

	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid method, use 'totp' or 'email'"})
	}
}

// Disable2FA 禁用 2FA（需密码确认）
func (h *Handler) Disable2FA(c *gin.Context) {
	userID, ok := common.GetUserID(c)
	if !ok {
		return
	}

	var req Disable2FARequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	ctx := c.Request.Context()

	// 验证密码
	var passwordHash string
	err := h.pool.QueryRow(ctx, `SELECT password_hash FROM users WHERE id = $1`, userID).Scan(&passwordHash)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	valid, err := VerifyPassword(req.Password, passwordHash)
	if err != nil || !valid {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid password"})
		return
	}

	_, err = h.pool.Exec(ctx,
		`UPDATE users SET two_factor_enabled = FALSE, two_factor_method = NULL, totp_secret = NULL, recovery_codes = NULL WHERE id = $1`,
		userID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to disable 2FA"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "2FA disabled successfully"})
}

// RegenerateRecoveryCodes 重新生成恢复码（需密码确认）
func (h *Handler) RegenerateRecoveryCodes(c *gin.Context) {
	userID, ok := common.GetUserID(c)
	if !ok {
		return
	}

	var req RegenerateRecoveryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	ctx := c.Request.Context()

	// 验证密码
	var passwordHash string
	err := h.pool.QueryRow(ctx, `SELECT password_hash FROM users WHERE id = $1`, userID).Scan(&passwordHash)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	valid, err := VerifyPassword(req.Password, passwordHash)
	if err != nil || !valid {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid password"})
		return
	}

	recoveryCodes, err := GenerateRecoveryCodes(recoveryCodeNum)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate recovery codes"})
		return
	}
	hashedCodes := HashRecoveryCodes(recoveryCodes)

	_, err = h.pool.Exec(ctx,
		`UPDATE users SET recovery_codes = $1 WHERE id = $2`,
		hashedCodes, userID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update recovery codes"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":        "Recovery codes regenerated",
		"recovery_codes": recoveryCodes,
	})
}

// Get2FAStatus 获取当前 2FA 状态
func (h *Handler) Get2FAStatus(c *gin.Context) {
	userID, ok := common.GetUserID(c)
	if !ok {
		return
	}

	ctx := c.Request.Context()

	var enabled bool
	var method *string
	err := h.pool.QueryRow(ctx,
		`SELECT two_factor_enabled, two_factor_method::text FROM users WHERE id = $1`,
		userID,
	).Scan(&enabled, &method)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	resp := gin.H{
		"enabled": enabled,
	}
	if method != nil {
		resp["method"] = *method
	}

	c.JSON(http.StatusOK, resp)
}
