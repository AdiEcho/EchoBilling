package template

import (
	"encoding/json"
	"errors"
	"log"
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

// Template represents a VPS template
type Template struct {
	ID          string          `json:"id"`
	Name        string          `json:"name"`
	Slug        string          `json:"slug"`
	Description string          `json:"description"`
	Category    string          `json:"category"`
	PlanPresets json.RawMessage `json:"plan_presets"`
	IsActive    bool            `json:"is_active"`
	SortOrder   int             `json:"sort_order"`
	CreatedAt   time.Time       `json:"created_at"`
	UpdatedAt   time.Time       `json:"updated_at"`
}

// PlanPreset represents a plan preset within a template
type PlanPreset struct {
	Name           string   `json:"name"`
	Slug           string   `json:"slug"`
	Description    string   `json:"description"`
	CPUCores       int      `json:"cpu_cores"`
	MemoryMB       int      `json:"memory_mb"`
	DiskGB         int      `json:"disk_gb"`
	BandwidthTB    string   `json:"bandwidth_tb"`
	PriceMonthly   string   `json:"price_monthly"`
	PriceQuarterly string   `json:"price_quarterly"`
	PriceAnnually  string   `json:"price_annually"`
	SetupFee       string   `json:"setup_fee"`
	IsActive       bool     `json:"is_active"`
	SortOrder      int      `json:"sort_order"`
	Features       []string `json:"features"`
}

type CreateTemplateRequest struct {
	Name        string          `json:"name" binding:"required"`
	Slug        string          `json:"slug" binding:"required"`
	Description string          `json:"description"`
	Category    string          `json:"category"`
	PlanPresets json.RawMessage `json:"plan_presets"`
	IsActive    bool            `json:"is_active"`
	SortOrder   int             `json:"sort_order"`
}

type UpdateTemplateRequest struct {
	Name        string          `json:"name"`
	Slug        string          `json:"slug"`
	Description string          `json:"description"`
	Category    string          `json:"category"`
	PlanPresets json.RawMessage `json:"plan_presets"`
	IsActive    *bool           `json:"is_active"`
	SortOrder   *int            `json:"sort_order"`
}

type ApplyTemplateRequest struct {
	ProductSlug string `json:"product_slug"`
	IsActive    *bool  `json:"is_active"`
}

// ListTemplates - GET /api/v1/admin/templates
func (h *Handler) ListTemplates(c *gin.Context) {
	limit := 50
	offset := 0
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 {
			limit = parsed
		}
	}
	if o := c.Query("offset"); o != "" {
		if parsed, err := strconv.Atoi(o); err == nil && parsed >= 0 {
			offset = parsed
		}
	}

	templates, err := h.listTemplates(c.Request.Context(), limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query templates"})
		return
	}
	c.JSON(http.StatusOK, templates)
}

// GetTemplate - GET /api/v1/admin/templates/:id
func (h *Handler) GetTemplate(c *gin.Context) {
	tmpl, err := h.getTemplate(c.Request.Context(), c.Param("id"))
	if err != nil {
		if errors.Is(err, ErrTemplateNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Template not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query template"})
		return
	}
	c.JSON(http.StatusOK, tmpl)
}

// CreateTemplate - POST /api/v1/admin/templates
func (h *Handler) CreateTemplate(c *gin.Context) {
	var req CreateTemplateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	id, err := h.createTemplate(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create template"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"id": id})
}

// UpdateTemplate - PUT /api/v1/admin/templates/:id
func (h *Handler) UpdateTemplate(c *gin.Context) {
	var req UpdateTemplateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updated, err := h.updateTemplate(c.Request.Context(), c.Param("id"), req)
	if err != nil {
		log.Printf("Failed to update template %s: %v", c.Param("id"), err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update template"})
		return
	}
	if !updated {
		c.JSON(http.StatusNotFound, gin.H{"error": "Template not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Template updated"})
}

// DeleteTemplate - DELETE /api/v1/admin/templates/:id
func (h *Handler) DeleteTemplate(c *gin.Context) {
	deleted, err := h.deleteTemplate(c.Request.Context(), c.Param("id"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete template"})
		return
	}
	if !deleted {
		c.JSON(http.StatusNotFound, gin.H{"error": "Template not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Template deleted"})
}

// ApplyTemplate - POST /api/v1/admin/templates/:id/apply
func (h *Handler) ApplyTemplate(c *gin.Context) {
	var req ApplyTemplateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		// allow empty body — use template defaults
		req = ApplyTemplateRequest{}
	}

	productID, err := h.applyTemplate(c.Request.Context(), c.Param("id"), req)
	if err != nil {
		if errors.Is(err, ErrTemplateNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Template not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to apply template: " + err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"product_id": productID})
}
