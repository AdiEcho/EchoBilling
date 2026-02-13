package catalog

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
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

// ListProducts - GET /api/v1/products - list active products with their active plans
func (h *Handler) ListProducts(c *gin.Context) {
	ctx := context.Background()

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

	rows, err := h.pool.Query(ctx, `
		SELECT id, name, slug, description, category, is_active, sort_order, created_at, updated_at
		FROM products
		WHERE is_active = true
		ORDER BY sort_order, name
		LIMIT $1 OFFSET $2
	`, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query products"})
		return
	}
	defer rows.Close()

	var products []ProductWithPlans
	for rows.Next() {
		var p Product
		if err := rows.Scan(&p.ID, &p.Name, &p.Slug, &p.Description, &p.Category, &p.IsActive, &p.SortOrder, &p.CreatedAt, &p.UpdatedAt); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan product"})
			return
		}

		planRows, err := h.pool.Query(ctx, `
			SELECT id, product_id, name, slug, description, cpu_cores, memory_mb, disk_gb,
				   bandwidth_tb, price_monthly, price_quarterly, price_annually, setup_fee,
				   is_active, sort_order, features, created_at, updated_at
			FROM plans
			WHERE product_id = $1 AND is_active = true
			ORDER BY sort_order, price_monthly
		`, p.ID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query plans"})
			return
		}

		var plans []Plan
		for planRows.Next() {
			var plan Plan
			if err := planRows.Scan(&plan.ID, &plan.ProductID, &plan.Name, &plan.Slug, &plan.Description,
				&plan.CPUCores, &plan.MemoryMB, &plan.DiskGB, &plan.BandwidthTB,
				&plan.PriceMonthly, &plan.PriceQuarterly, &plan.PriceAnnually, &plan.SetupFee,
				&plan.IsActive, &plan.SortOrder, &plan.Features, &plan.CreatedAt, &plan.UpdatedAt); err != nil {
				planRows.Close()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan plan"})
				return
			}
			plans = append(plans, plan)
		}
		planRows.Close()

		products = append(products, ProductWithPlans{
			Product: p,
			Plans:   plans,
		})
	}

	c.JSON(http.StatusOK, products)
}

// GetProductBySlug - GET /api/v1/products/:slug - get product with plans by slug
func (h *Handler) GetProductBySlug(c *gin.Context) {
	ctx := context.Background()
	slug := c.Param("slug")

	var p Product
	err := h.pool.QueryRow(ctx, `
		SELECT id, name, slug, description, category, is_active, sort_order, created_at, updated_at
		FROM products
		WHERE slug = $1 AND is_active = true
	`, slug).Scan(&p.ID, &p.Name, &p.Slug, &p.Description, &p.Category, &p.IsActive, &p.SortOrder, &p.CreatedAt, &p.UpdatedAt)

	if err == pgx.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query product"})
		return
	}

	planRows, err := h.pool.Query(ctx, `
		SELECT id, product_id, name, slug, description, cpu_cores, memory_mb, disk_gb,
			   bandwidth_tb, price_monthly, price_quarterly, price_annually, setup_fee,
			   is_active, sort_order, features, created_at, updated_at
		FROM plans
		WHERE product_id = $1 AND is_active = true
		ORDER BY sort_order, price_monthly
	`, p.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query plans"})
		return
	}
	defer planRows.Close()

	var plans []Plan
	for planRows.Next() {
		var plan Plan
		if err := planRows.Scan(&plan.ID, &plan.ProductID, &plan.Name, &plan.Slug, &plan.Description,
			&plan.CPUCores, &plan.MemoryMB, &plan.DiskGB, &plan.BandwidthTB,
			&plan.PriceMonthly, &plan.PriceQuarterly, &plan.PriceAnnually, &plan.SetupFee,
			&plan.IsActive, &plan.SortOrder, &plan.Features, &plan.CreatedAt, &plan.UpdatedAt); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan plan"})
			return
		}
		plans = append(plans, plan)
	}

	c.JSON(http.StatusOK, ProductWithPlans{
		Product: p,
		Plans:   plans,
	})
}

// AdminCreateProduct - POST /api/v1/admin/products
func (h *Handler) AdminCreateProduct(c *gin.Context) {
	ctx := context.Background()

	var req struct {
		Name        string `json:"name" binding:"required"`
		Slug        string `json:"slug" binding:"required"`
		Description string `json:"description"`
		Category    string `json:"category"`
		IsActive    bool   `json:"is_active"`
		SortOrder   int    `json:"sort_order"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	id := uuid.New().String()
	now := time.Now()

	_, err := h.pool.Exec(ctx, `
		INSERT INTO products (id, name, slug, description, category, is_active, sort_order, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`, id, req.Name, req.Slug, req.Description, req.Category, req.IsActive, req.SortOrder, now, now)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create product"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"id": id})
}

// AdminUpdateProduct - PUT /api/v1/admin/products/:id
func (h *Handler) AdminUpdateProduct(c *gin.Context) {
	ctx := context.Background()
	id := c.Param("id")

	var req struct {
		Name        string `json:"name"`
		Slug        string `json:"slug"`
		Description string `json:"description"`
		Category    string `json:"category"`
		IsActive    *bool  `json:"is_active"`
		SortOrder   *int   `json:"sort_order"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := h.pool.Exec(ctx, `
		UPDATE products
		SET name = COALESCE(NULLIF($2, ''), name),
			slug = COALESCE(NULLIF($3, ''), slug),
			description = COALESCE(NULLIF($4, ''), description),
			category = COALESCE(NULLIF($5, ''), category),
			is_active = COALESCE($6, is_active),
			sort_order = COALESCE($7, sort_order),
			updated_at = $8
		WHERE id = $1
	`, id, req.Name, req.Slug, req.Description, req.Category, req.IsActive, req.SortOrder, time.Now())

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update product"})
		return
	}

	if result.RowsAffected() == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Product updated"})
}

// AdminDeleteProduct - DELETE /api/v1/admin/products/:id
func (h *Handler) AdminDeleteProduct(c *gin.Context) {
	ctx := context.Background()
	id := c.Param("id")

	result, err := h.pool.Exec(ctx, `DELETE FROM products WHERE id = $1`, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete product"})
		return
	}

	if result.RowsAffected() == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Product deleted"})
}

// AdminCreatePlan - POST /api/v1/admin/plans
func (h *Handler) AdminCreatePlan(c *gin.Context) {
	ctx := context.Background()

	var req struct {
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

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	id := uuid.New().String()
	now := time.Now()

	_, err := h.pool.Exec(ctx, `
		INSERT INTO plans (id, product_id, name, slug, description, cpu_cores, memory_mb, disk_gb,
						   bandwidth_tb, price_monthly, price_quarterly, price_annually, setup_fee,
						   is_active, sort_order, features, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
	`, id, req.ProductID, req.Name, req.Slug, req.Description, req.CPUCores, req.MemoryMB, req.DiskGB,
		req.BandwidthTB, req.PriceMonthly, req.PriceQuarterly, req.PriceAnnually, req.SetupFee,
		req.IsActive, req.SortOrder, req.Features, now, now)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create plan"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"id": id})
}

// AdminUpdatePlan - PUT /api/v1/admin/plans/:id
func (h *Handler) AdminUpdatePlan(c *gin.Context) {
	ctx := context.Background()
	id := c.Param("id")

	var req struct {
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

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := h.pool.Exec(ctx, `
		UPDATE plans
		SET name = COALESCE(NULLIF($2, ''), name),
			slug = COALESCE(NULLIF($3, ''), slug),
			description = COALESCE(NULLIF($4, ''), description),
			cpu_cores = COALESCE($5, cpu_cores),
			memory_mb = COALESCE($6, memory_mb),
			disk_gb = COALESCE($7, disk_gb),
			bandwidth_tb = COALESCE(NULLIF($8, ''), bandwidth_tb),
			price_monthly = COALESCE(NULLIF($9, ''), price_monthly),
			price_quarterly = COALESCE(NULLIF($10, ''), price_quarterly),
			price_annually = COALESCE(NULLIF($11, ''), price_annually),
			setup_fee = COALESCE(NULLIF($12, ''), setup_fee),
			is_active = COALESCE($13, is_active),
			sort_order = COALESCE($14, sort_order),
			features = COALESCE($15, features),
			updated_at = $16
		WHERE id = $1
	`, id, req.Name, req.Slug, req.Description, req.CPUCores, req.MemoryMB, req.DiskGB,
		req.BandwidthTB, req.PriceMonthly, req.PriceQuarterly, req.PriceAnnually, req.SetupFee,
		req.IsActive, req.SortOrder, req.Features, time.Now())

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update plan"})
		return
	}

	if result.RowsAffected() == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Plan not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Plan updated"})
}

// AdminDeletePlan - DELETE /api/v1/admin/plans/:id
func (h *Handler) AdminDeletePlan(c *gin.Context) {
	ctx := context.Background()
	id := c.Param("id")

	result, err := h.pool.Exec(ctx, `DELETE FROM plans WHERE id = $1`, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete plan"})
		return
	}

	if result.RowsAffected() == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Plan not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Plan deleted"})
}
