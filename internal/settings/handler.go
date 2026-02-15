package settings

import (
	"fmt"
	"net/http"
	"net/smtp"
	"strings"

	"github.com/adiecho/echobilling/internal/app"
	"github.com/adiecho/echobilling/internal/common"
	"github.com/gin-gonic/gin"
	"github.com/stripe/stripe-go/v82"
)

// Handler handles system settings API requests.
type Handler struct {
	svc   *Service
	store *app.SettingsStore
}

// NewHandler creates a new settings Handler.
func NewHandler(svc *Service, store *app.SettingsStore) *Handler {
	return &Handler{svc: svc, store: store}
}

// settingResponse is the JSON shape returned to the client.
type settingResponse struct {
	Key         string `json:"key"`
	Value       string `json:"value"`
	IsSecret    bool   `json:"is_secret"`
	Description string `json:"description"`
	GroupName   string `json:"group_name"`
}

// GetSettings handles GET /admin/settings?group=
func (h *Handler) GetSettings(c *gin.Context) {
	group := c.Query("group")

	settings, err := h.svc.GetAll(c.Request.Context(), group)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load settings"})
		return
	}

	out := make([]settingResponse, 0, len(settings))
	for _, s := range settings {
		val := s.Value
		// If the DB value is empty, show the env default (also masked if secret).
		if val == "" {
			val = h.store.Get(s.Key)
		}
		if s.IsSecret && val != "" {
			val = maskSecret(val)
		}
		out = append(out, settingResponse{
			Key:         s.Key,
			Value:       val,
			IsSecret:    s.IsSecret,
			Description: s.Description,
			GroupName:   s.GroupName,
		})
	}

	c.JSON(http.StatusOK, out)
}

// updateRequest is the JSON body for PUT /admin/settings.
type updateRequest struct {
	Settings map[string]string `json:"settings" binding:"required"`
}

// UpdateSettings handles PUT /admin/settings
func (h *Handler) UpdateSettings(c *gin.Context) {
	var req updateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	userID, ok := common.GetUserID(c)
	if !ok {
		return
	}

	// Filter out masked values — the user didn't change them.
	filtered := make(map[string]string, len(req.Settings))
	for k, v := range req.Settings {
		if strings.HasPrefix(v, "***") {
			continue
		}
		filtered[k] = v
	}

	if len(filtered) == 0 {
		c.JSON(http.StatusOK, gin.H{"message": "No changes"})
		return
	}

	if err := h.svc.UpdateBatch(c.Request.Context(), filtered, userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save settings"})
		return
	}

	// Hot-reload the in-memory store.
	if err := h.store.Reload(c.Request.Context()); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Settings saved but reload failed"})
		return
	}

	// If the Stripe secret key was updated, apply it globally.
	if _, changed := filtered["stripe_secret_key"]; changed {
		stripe.Key = h.store.StripeSecretKey()
	}

	c.JSON(http.StatusOK, gin.H{"message": "Settings saved"})
}

// testSMTPRequest is the body for POST /admin/settings/test-smtp.
type testSMTPRequest struct {
	Email string `json:"email" binding:"required"`
}

// TestSMTP handles POST /admin/settings/test-smtp
func (h *Handler) TestSMTP(c *gin.Context) {
	var req testSMTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	if !common.ValidateEmail(req.Email) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid email address"})
		return
	}

	cfg := h.store.SMTPConfig()
	if cfg == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "SMTP is not configured"})
		return
	}

	// Send a simple test email.
	subject := "EchoBilling - SMTP Test"
	body := "This is a test email from EchoBilling admin settings. If you received this, SMTP is working correctly."
	msg := fmt.Sprintf(
		"From: %s\r\nTo: %s\r\nSubject: %s\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n%s",
		cfg.From, req.Email, subject, body,
	)

	addr := fmt.Sprintf("%s:%s", cfg.Host, cfg.Port)
	auth := smtp.PlainAuth("", cfg.Username, cfg.Password, cfg.Host)

	if err := smtp.SendMail(addr, auth, cfg.From, []string{req.Email}, []byte(msg)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("SMTP test failed: %v", err)})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Test email sent"})
}

// maskSecret returns a masked version showing only the last 4 characters.
func maskSecret(s string) string {
	if len(s) <= 4 {
		return "****"
	}
	return "***" + s[len(s)-4:]
}
