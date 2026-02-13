-- name: CreatePlan :one
INSERT INTO plans (product_id, name, slug, description, cpu_cores, memory_mb, disk_gb, bandwidth_tb, price_monthly, price_quarterly, price_annually, setup_fee, is_active, sort_order, features)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
RETURNING *;

-- name: GetPlanByID :one
SELECT * FROM plans WHERE id = $1;

-- name: GetPlanBySlug :one
SELECT * FROM plans WHERE slug = $1;

-- name: ListPlansByProduct :many
SELECT * FROM plans WHERE product_id = $1 AND is_active = true ORDER BY sort_order ASC, price_monthly ASC;

-- name: ListAllPlans :many
SELECT * FROM plans ORDER BY sort_order ASC, created_at DESC LIMIT $1 OFFSET $2;

-- name: UpdatePlan :one
UPDATE plans SET
    name = COALESCE(sqlc.narg('name'), name),
    slug = COALESCE(sqlc.narg('slug'), slug),
    description = COALESCE(sqlc.narg('description'), description),
    cpu_cores = COALESCE(sqlc.narg('cpu_cores'), cpu_cores),
    memory_mb = COALESCE(sqlc.narg('memory_mb'), memory_mb),
    disk_gb = COALESCE(sqlc.narg('disk_gb'), disk_gb),
    bandwidth_tb = COALESCE(sqlc.narg('bandwidth_tb'), bandwidth_tb),
    price_monthly = COALESCE(sqlc.narg('price_monthly'), price_monthly),
    price_quarterly = COALESCE(sqlc.narg('price_quarterly'), price_quarterly),
    price_annually = COALESCE(sqlc.narg('price_annually'), price_annually),
    setup_fee = COALESCE(sqlc.narg('setup_fee'), setup_fee),
    is_active = COALESCE(sqlc.narg('is_active'), is_active),
    sort_order = COALESCE(sqlc.narg('sort_order'), sort_order),
    features = COALESCE(sqlc.narg('features'), features),
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeletePlan :exec
DELETE FROM plans WHERE id = $1;
