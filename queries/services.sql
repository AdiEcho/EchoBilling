-- name: CreateService :one
INSERT INTO services (user_id, order_item_id, plan_id, status, hostname, ip_address, expires_at, metadata)
VALUES ($1, $2, $3, 'pending', $4, $5, $6, $7)
RETURNING *;

-- name: GetServiceByID :one
SELECT * FROM services WHERE id = $1;

-- name: ListServicesByUser :many
SELECT * FROM services WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3;

-- name: ListAllServices :many
SELECT * FROM services ORDER BY created_at DESC LIMIT $1 OFFSET $2;

-- name: UpdateServiceStatus :one
UPDATE services SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *;

-- name: UpdateServiceExpiry :exec
UPDATE services SET expires_at = $2, updated_at = NOW() WHERE id = $1;

-- name: CancelService :exec
UPDATE services SET status = 'cancelled', cancelled_at = NOW(), updated_at = NOW() WHERE id = $1;

-- name: ListExpiringServices :many
SELECT * FROM services WHERE status = 'active' AND expires_at <= $1 ORDER BY expires_at ASC;

-- name: CountServicesByUser :one
SELECT COUNT(*) FROM services WHERE user_id = $1;
