package catalog

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

var ErrProductNotFound = errors.New("product not found")

func (h *Handler) listActiveProducts(ctx context.Context, limit, offset int) ([]ProductWithPlans, error) {
	rows, err := h.pool.Query(ctx, `
		SELECT id, name, slug, description, category, is_active, sort_order, created_at, updated_at
		FROM products
		WHERE is_active = true
		ORDER BY sort_order, name
		LIMIT $1 OFFSET $2
	`, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	products := make([]ProductWithPlans, 0)
	for rows.Next() {
		var p Product
		if err := rows.Scan(&p.ID, &p.Name, &p.Slug, &p.Description, &p.Category, &p.IsActive, &p.SortOrder, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, err
		}

		plans, err := h.queryActivePlansByProductID(ctx, p.ID)
		if err != nil {
			return nil, err
		}

		products = append(products, ProductWithPlans{
			Product: p,
			Plans:   plans,
		})
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return products, nil
}

func (h *Handler) getActiveProductBySlug(ctx context.Context, slug string) (*ProductWithPlans, error) {
	var p Product
	err := h.pool.QueryRow(ctx, `
		SELECT id, name, slug, description, category, is_active, sort_order, created_at, updated_at
		FROM products
		WHERE slug = $1 AND is_active = true
	`, slug).Scan(&p.ID, &p.Name, &p.Slug, &p.Description, &p.Category, &p.IsActive, &p.SortOrder, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrProductNotFound
		}
		return nil, err
	}

	plans, err := h.queryActivePlansByProductID(ctx, p.ID)
	if err != nil {
		return nil, err
	}

	return &ProductWithPlans{
		Product: p,
		Plans:   plans,
	}, nil
}

func (h *Handler) listActivePlansByProductID(ctx context.Context, productID string) ([]Plan, error) {
	var exists bool
	err := h.pool.QueryRow(ctx,
		`SELECT EXISTS(
			SELECT 1 FROM products WHERE id = $1 AND is_active = true
		)`,
		productID,
	).Scan(&exists)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, ErrProductNotFound
	}

	return h.queryActivePlansByProductID(ctx, productID)
}

func (h *Handler) queryActivePlansByProductID(ctx context.Context, productID string) ([]Plan, error) {
	rows, err := h.pool.Query(ctx, `
		SELECT id, product_id, name, slug, description, cpu_cores, memory_mb, disk_gb,
		       bandwidth_tb, price_monthly, price_quarterly, price_annually, setup_fee,
		       is_active, sort_order, features, created_at, updated_at
		FROM plans
		WHERE product_id = $1 AND is_active = true
		ORDER BY sort_order, price_monthly
	`, productID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	plans := make([]Plan, 0)
	for rows.Next() {
		var plan Plan
		if err := rows.Scan(&plan.ID, &plan.ProductID, &plan.Name, &plan.Slug, &plan.Description,
			&plan.CPUCores, &plan.MemoryMB, &plan.DiskGB, &plan.BandwidthTB,
			&plan.PriceMonthly, &plan.PriceQuarterly, &plan.PriceAnnually, &plan.SetupFee,
			&plan.IsActive, &plan.SortOrder, &plan.Features, &plan.CreatedAt, &plan.UpdatedAt); err != nil {
			return nil, err
		}
		plans = append(plans, plan)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}
	return plans, nil
}

func (h *Handler) createProduct(ctx context.Context, req CreateProductRequest) (string, error) {
	id := uuid.New().String()
	now := time.Now()

	_, err := h.pool.Exec(ctx, `
		INSERT INTO products (id, name, slug, description, category, is_active, sort_order, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`, id, req.Name, req.Slug, req.Description, req.Category, req.IsActive, req.SortOrder, now, now)
	if err != nil {
		return "", err
	}
	return id, nil
}

func (h *Handler) updateProduct(ctx context.Context, id string, req UpdateProductRequest) (bool, error) {
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
		return false, err
	}
	return result.RowsAffected() > 0, nil
}

func (h *Handler) deleteProduct(ctx context.Context, id string) (bool, error) {
	result, err := h.pool.Exec(ctx, `DELETE FROM products WHERE id = $1`, id)
	if err != nil {
		return false, err
	}
	return result.RowsAffected() > 0, nil
}

func (h *Handler) createPlan(ctx context.Context, req CreatePlanRequest) (string, error) {
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
		return "", err
	}
	return id, nil
}

func (h *Handler) updatePlan(ctx context.Context, id string, req UpdatePlanRequest) (bool, error) {
	result, err := h.pool.Exec(ctx, `
		UPDATE plans
		SET name = COALESCE(NULLIF($2, ''), name),
			slug = COALESCE(NULLIF($3, ''), slug),
			description = COALESCE(NULLIF($4, ''), description),
			cpu_cores = COALESCE($5, cpu_cores),
			memory_mb = COALESCE($6, memory_mb),
			disk_gb = COALESCE($7, disk_gb),
			bandwidth_tb = COALESCE($8, bandwidth_tb),
			price_monthly = COALESCE($9, price_monthly),
			price_quarterly = COALESCE($10, price_quarterly),
			price_annually = COALESCE($11, price_annually),
			setup_fee = COALESCE($12, setup_fee),
			is_active = COALESCE($13, is_active),
			sort_order = COALESCE($14, sort_order),
			features = COALESCE($15, features),
			updated_at = $16
		WHERE id = $1
	`, id, req.Name, req.Slug, req.Description, req.CPUCores, req.MemoryMB, req.DiskGB,
		req.BandwidthTB, req.PriceMonthly, req.PriceQuarterly, req.PriceAnnually, req.SetupFee,
		req.IsActive, req.SortOrder, req.Features, time.Now())
	if err != nil {
		return false, err
	}
	return result.RowsAffected() > 0, nil
}

func (h *Handler) deletePlan(ctx context.Context, id string) (bool, error) {
	result, err := h.pool.Exec(ctx, `DELETE FROM plans WHERE id = $1`, id)
	if err != nil {
		return false, err
	}
	return result.RowsAffected() > 0, nil
}
