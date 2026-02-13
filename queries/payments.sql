-- name: CreatePayment :one
INSERT INTO payments (user_id, invoice_id, stripe_payment_intent_id, stripe_checkout_session_id, amount, currency, status, method)
VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7)
RETURNING *;

-- name: GetPaymentByID :one
SELECT * FROM payments WHERE id = $1;

-- name: GetPaymentByStripeSession :one
SELECT * FROM payments WHERE stripe_checkout_session_id = $1;

-- name: GetPaymentByStripeIntent :one
SELECT * FROM payments WHERE stripe_payment_intent_id = $1;

-- name: ListPaymentsByUser :many
SELECT * FROM payments WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3;

-- name: ListAllPayments :many
SELECT * FROM payments ORDER BY created_at DESC LIMIT $1 OFFSET $2;

-- name: UpdatePaymentStatus :one
UPDATE payments SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *;

-- name: CountPayments :one
SELECT COUNT(*) FROM payments;

-- name: CreatePaymentEvent :one
INSERT INTO payment_events (stripe_event_id, event_type, payload)
VALUES ($1, $2, $3)
RETURNING *;

-- name: GetPaymentEventByStripeID :one
SELECT * FROM payment_events WHERE stripe_event_id = $1;

-- name: MarkPaymentEventProcessed :exec
UPDATE payment_events SET processed = true, processed_at = NOW() WHERE id = $1;

-- name: MarkPaymentEventFailed :exec
UPDATE payment_events SET processed = true, error_message = $2, processed_at = NOW() WHERE id = $1;
