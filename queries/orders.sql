-- name: CreateOrder :one
INSERT INTO orders (user_id, status, total_amount, currency, notes)
VALUES ($1, 'draft', $2, $3, $4)
RETURNING *;

-- name: GetOrderByID :one
SELECT * FROM orders WHERE id = $1;

-- name: ListOrdersByUser :many
SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3;

-- name: ListAllOrders :many
SELECT * FROM orders ORDER BY created_at DESC LIMIT $1 OFFSET $2;

-- name: UpdateOrderStatus :one
UPDATE orders SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *;

-- name: UpdateOrderTotal :exec
UPDATE orders SET total_amount = $2, updated_at = NOW() WHERE id = $1;

-- name: CountOrders :one
SELECT COUNT(*) FROM orders;

-- name: CountOrdersByUser :one
SELECT COUNT(*) FROM orders WHERE user_id = $1;

-- name: CreateOrderItem :one
INSERT INTO order_items (order_id, plan_id, plan_snapshot, quantity, unit_price, billing_cycle)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: ListOrderItems :many
SELECT * FROM order_items WHERE order_id = $1;

-- name: DeleteOrderItems :exec
DELETE FROM order_items WHERE order_id = $1;
