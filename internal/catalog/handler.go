package catalog

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

// Product represents a product
type Product struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Slug        string    `json:"slug"`
	Description string    `json:"description"`
	Category    string    `json:"category"`
	IsActive    bool      `json:"is_active"`
	SortOrder   int       `json:"sort_order"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// Plan represents a pricing plan
type Plan struct {
	ID             string          `json:"id"`
	ProductID      string          `json:"product_id"`
	Name           string          `json:"name"`
	Slug           string          `json:"slug"`
	Description    string          `json:"description"`
	CPUCores       int             `json:"cpu_cores"`
	MemoryMB       int             `json:"memory_mb"`
	DiskGB         int             `json:"disk_gb"`
	BandwidthTB    string          `json:"bandwidth_tb"`
	PriceMonthly   string          `json:"price_monthly"`
	PriceQuarterly string          `json:"price_quarterly"`
	PriceAnnually  string          `json:"price_annually"`
	SetupFee       string          `json:"setup_fee"`
	IsActive       bool            `json:"is_active"`
	SortOrder      int             `json:"sort_order"`
	Features       json.RawMessage `json:"features"`
	CreatedAt      time.Time       `json:"created_at"`
	UpdatedAt      time.Time       `json:"updated_at"`
}

type ProductWithPlans struct {
	Product
	Plans []Plan `json:"plans"`
}

type CreateProductRequest struct {
	Name        string `json:"name" binding:"required"`
	Slug        string `json:"slug" binding:"required"`
	Description string `json:"description"`
	Category    string `json:"category"`
	IsActive    bool   `json:"is_active"`
	SortOrder   int    `json:"sort_order"`
}

type UpdateProductRequest struct {
	Name        string `json:"name"`
	Slug        string `json:"slug"`
	Description string `json:"description"`
	Category    string `json:"category"`
	IsActive    *bool  `json:"is_active"`
	SortOrder   *int   `json:"sort_order"`
}

type CreatePlanRequest struct {
	ProductID      string          `json:"product_id" binding:"required"`
	Name           string          `json:"name" binding:"required"`
	Slug           string          `json:"slug" binding:"required"`
	Description    string          `json:"description"`
	CPUCores       int             `json:"cpu_cores"`
	MemoryMB       int             `json:"memory_mb"`
	DiskGB         int             `json:"disk_gb"`
	BandwidthTB    string          `json:"bandwidth_tb"`
	PriceMonthly   string          `json:"price_monthly" binding:"required"`
	PriceQuarterly string          `json:"price_quarterly"`
	PriceAnnually  string          `json:"price_annually"`
	SetupFee       string          `json:"setup_fee"`
	IsActive       bool            `json:"is_active"`
	SortOrder      int             `json:"sort_order"`
	Features       json.RawMessage `json:"features"`
}

type UpdatePlanRequest struct {
	Name           string          `json:"name"`
	Slug           string          `json:"slug"`
	Description    string          `json:"description"`
	CPUCores       *int            `json:"cpu_cores"`
	MemoryMB       *int            `json:"memory_mb"`
	DiskGB         *int            `json:"disk_gb"`
	BandwidthTB    string          `json:"bandwidth_tb"`
	PriceMonthly   string          `json:"price_monthly"`
	PriceQuarterly string          `json:"price_quarterly"`
	PriceAnnually  string          `json:"price_annually"`
	SetupFee       string          `json:"setup_fee"`
	IsActive       *bool           `json:"is_active"`
	SortOrder      *int            `json:"sort_order"`
	Features       json.RawMessage `json:"features"`
}

// ListProducts - GET /api/v1/products - list active products with their active plans
func (h *Handler) ListProducts(c *gin.Context) {
	limit := 20
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

	products, err := h.listActiveProducts(c.Request.Context(), limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query products"})
		return
	}
	c.JSON(http.StatusOK, products)
}

// GetProductBySlug - GET /api/v1/products/:slug - get product with plans by slug
func (h *Handler) GetProductBySlug(c *gin.Context) {
	product, err := h.getActiveProductBySlug(c.Request.Context(), c.Param("slug"))
	if err != nil {
		if errors.Is(err, ErrProductNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query product"})
		return
	}
	c.JSON(http.StatusOK, product)
}

// ListPlansByProductID - GET /api/v1/products/:id/plans
func (h *Handler) ListPlansByProductID(c *gin.Context) {
	plans, err := h.listActivePlansByProductID(c.Request.Context(), c.Param("id"))
	if err != nil {
		if errors.Is(err, ErrProductNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query plans"})
		return
	}
	c.JSON(http.StatusOK, plans)
}

// AdminCreateProduct - POST /api/v1/admin/products
func (h *Handler) AdminCreateProduct(c *gin.Context) {
	var req CreateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	id, err := h.createProduct(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create product"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"id": id})
}

// AdminUpdateProduct - PUT /api/v1/admin/products/:id
func (h *Handler) AdminUpdateProduct(c *gin.Context) {
	var req UpdateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updated, err := h.updateProduct(c.Request.Context(), c.Param("id"), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update product"})
		return
	}
	if !updated {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Product updated"})
}

// AdminDeleteProduct - DELETE /api/v1/admin/products/:id
func (h *Handler) AdminDeleteProduct(c *gin.Context) {
	deleted, err := h.deleteProduct(c.Request.Context(), c.Param("id"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete product"})
		return
	}
	if !deleted {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Product deleted"})
}

// AdminCreatePlan - POST /api/v1/admin/plans
func (h *Handler) AdminCreatePlan(c *gin.Context) {
	var req CreatePlanRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	id, err := h.createPlan(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create plan"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"id": id})
}

// AdminUpdatePlan - PUT /api/v1/admin/plans/:id
func (h *Handler) AdminUpdatePlan(c *gin.Context) {
	var req UpdatePlanRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updated, err := h.updatePlan(c.Request.Context(), c.Param("id"), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update plan"})
		return
	}
	if !updated {
		c.JSON(http.StatusNotFound, gin.H{"error": "Plan not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Plan updated"})
}

// AdminDeletePlan - DELETE /api/v1/admin/plans/:id
func (h *Handler) AdminDeletePlan(c *gin.Context) {
	deleted, err := h.deletePlan(c.Request.Context(), c.Param("id"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete plan"})
		return
	}
	if !deleted {
		c.JSON(http.StatusNotFound, gin.H{"error": "Plan not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Plan deleted"})
}
