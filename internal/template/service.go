package template

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

var ErrTemplateNotFound = errors.New("template not found")

func (h *Handler) listTemplates(ctx context.Context, limit, offset int) ([]Template, error) {
	rows, err := h.pool.Query(ctx, `
		SELECT id, name, slug, description, category, plan_presets, is_active, sort_order, created_at, updated_at
		FROM vps_templates
		ORDER BY sort_order, name
		LIMIT $1 OFFSET $2
	`, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	templates := make([]Template, 0)
	for rows.Next() {
		var t Template
		if err := rows.Scan(&t.ID, &t.Name, &t.Slug, &t.Description, &t.Category,
			&t.PlanPresets, &t.IsActive, &t.SortOrder, &t.CreatedAt, &t.UpdatedAt); err != nil {
			return nil, err
		}
		templates = append(templates, t)
	}
	return templates, rows.Err()
}

func (h *Handler) getTemplate(ctx context.Context, id string) (*Template, error) {
	var t Template
	err := h.pool.QueryRow(ctx, `
		SELECT id, name, slug, description, category, plan_presets, is_active, sort_order, created_at, updated_at
		FROM vps_templates
		WHERE id = $1
	`, id).Scan(&t.ID, &t.Name, &t.Slug, &t.Description, &t.Category,
		&t.PlanPresets, &t.IsActive, &t.SortOrder, &t.CreatedAt, &t.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrTemplateNotFound
		}
		return nil, err
	}
	return &t, nil
}

func (h *Handler) createTemplate(ctx context.Context, req CreateTemplateRequest) (string, error) {
	id := uuid.New().String()
	now := time.Now()

	presets := req.PlanPresets
	if presets == nil {
		presets = json.RawMessage("[]")
	}

	category := req.Category
	if category == "" {
		category = "vps"
	}

	_, err := h.pool.Exec(ctx, `
		INSERT INTO vps_templates (id, name, slug, description, category, plan_presets, is_active, sort_order, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`, id, req.Name, req.Slug, req.Description, category, presets, req.IsActive, req.SortOrder, now, now)
	if err != nil {
		return "", err
	}
	return id, nil
}

func (h *Handler) updateTemplate(ctx context.Context, id string, req UpdateTemplateRequest) (bool, error) {
	result, err := h.pool.Exec(ctx, `
		UPDATE vps_templates
		SET name = COALESCE(NULLIF($2, ''), name),
			slug = COALESCE(NULLIF($3, ''), slug),
			description = COALESCE(NULLIF($4, ''), description),
			category = COALESCE(NULLIF($5, ''), category),
			plan_presets = COALESCE($6, plan_presets),
			is_active = COALESCE($7, is_active),
			sort_order = COALESCE($8, sort_order),
			updated_at = $9
		WHERE id = $1
	`, id, req.Name, req.Slug, req.Description, req.Category, req.PlanPresets, req.IsActive, req.SortOrder, time.Now())
	if err != nil {
		return false, err
	}
	return result.RowsAffected() > 0, nil
}

func (h *Handler) deleteTemplate(ctx context.Context, id string) (bool, error) {
	result, err := h.pool.Exec(ctx, `DELETE FROM vps_templates WHERE id = $1`, id)
	if err != nil {
		return false, err
	}
	return result.RowsAffected() > 0, nil
}

func (h *Handler) applyTemplate(ctx context.Context, templateID string, req ApplyTemplateRequest) (string, error) {
	tmpl, err := h.getTemplate(ctx, templateID)
	if err != nil {
		return "", err
	}

	var presets []PlanPreset
	if err := json.Unmarshal(tmpl.PlanPresets, &presets); err != nil {
		return "", errors.New("invalid plan_presets in template")
	}

	productSlug := tmpl.Slug
	if req.ProductSlug != "" {
		productSlug = req.ProductSlug
	}

	isActive := tmpl.IsActive
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	tx, err := h.pool.Begin(ctx)
	if err != nil {
		return "", err
	}
	defer tx.Rollback(ctx)

	// Create product
	productID := uuid.New().String()
	now := time.Now()

	_, err = tx.Exec(ctx, `
		INSERT INTO products (id, name, slug, description, category, is_active, sort_order, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`, productID, tmpl.Name, productSlug, tmpl.Description, tmpl.Category, isActive, tmpl.SortOrder, now, now)
	if err != nil {
		return "", err
	}

	// Create all plans from presets
	for _, preset := range presets {
		planID := uuid.New().String()

		featuresJSON, err := json.Marshal(preset.Features)
		if err != nil {
			featuresJSON = []byte("[]")
		}

		_, err = tx.Exec(ctx, `
			INSERT INTO plans (id, product_id, name, slug, description, cpu_cores, memory_mb, disk_gb,
							   bandwidth_tb, price_monthly, price_quarterly, price_annually, setup_fee,
							   is_active, sort_order, features, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
		`, planID, productID, preset.Name, preset.Slug, preset.Description,
			preset.CPUCores, preset.MemoryMB, preset.DiskGB, preset.BandwidthTB,
			preset.PriceMonthly, preset.PriceQuarterly, preset.PriceAnnually, preset.SetupFee,
			preset.IsActive, preset.SortOrder, featuresJSON, now, now)
		if err != nil {
			return "", err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return "", err
	}

	return productID, nil
}
