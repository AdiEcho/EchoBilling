-- name: CreateProduct :one
INSERT INTO products (name, slug, description, category, is_active, sort_order)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: GetProductBySlug :one
SELECT * FROM products WHERE slug = $1;

-- name: GetProductByID :one
SELECT * FROM products WHERE id = $1;

-- name: ListActiveProducts :many
SELECT * FROM products WHERE is_active = true ORDER BY sort_order ASC, created_at DESC;

-- name: ListAllProducts :many
SELECT * FROM products ORDER BY sort_order ASC, created_at DESC LIMIT $1 OFFSET $2;

-- name: UpdateProduct :one
UPDATE products SET
    name = COALESCE(sqlc.narg('name'), name),
    slug = COALESCE(sqlc.narg('slug'), slug),
    description = COALESCE(sqlc.narg('description'), description),
    category = COALESCE(sqlc.narg('category'), category),
    is_active = COALESCE(sqlc.narg('is_active'), is_active),
    sort_order = COALESCE(sqlc.narg('sort_order'), sort_order),
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteProduct :exec
DELETE FROM products WHERE id = $1;

-- name: CountProducts :one
SELECT COUNT(*) FROM products;
