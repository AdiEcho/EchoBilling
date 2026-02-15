package content

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Handler struct {
	svc *Service
}

func NewHandler(pool *pgxpool.Pool) *Handler {
	return &Handler{svc: NewService(pool)}
}

type pageContentResponse struct {
	PageKey  string            `json:"page_key"`
	Locale   string            `json:"locale"`
	Sections map[string]string `json:"sections"`
}

type updateContentRequest struct {
	Locale   string            `json:"locale" binding:"required"`
	Sections map[string]string `json:"sections" binding:"required"`
}

// allowedPages restricts which page keys can be used.
var allowedPages = map[string]bool{
	"about":   true,
	"contact": true,
}

// GetPageContent handles GET /api/v1/content/:page?locale=en
func (h *Handler) GetPageContent(c *gin.Context) {
	page := c.Param("page")
	if !allowedPages[page] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid page key"})
		return
	}

	locale := c.DefaultQuery("locale", "en")

	sections, err := h.svc.GetPageContent(c.Request.Context(), page, locale)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch content"})
		return
	}

	c.JSON(http.StatusOK, pageContentResponse{
		PageKey:  page,
		Locale:   locale,
		Sections: sections,
	})
}

// UpdatePageContent handles PUT /api/v1/admin/content/:page
func (h *Handler) UpdatePageContent(c *gin.Context) {
	page := c.Param("page")
	if !allowedPages[page] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid page key"})
		return
	}

	var req updateContentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	var updatedBy string
	if uid, ok := c.Get("user_id"); ok {
		if userID, ok := uid.(string); ok {
			updatedBy = userID
		}
	}

	if err := h.svc.UpsertPageContent(c.Request.Context(), page, req.Locale, updatedBy, req.Sections); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save content"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Content updated successfully"})
}
