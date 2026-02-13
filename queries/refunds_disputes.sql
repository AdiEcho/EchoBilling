-- name: CreateRefund :one
INSERT INTO refunds (payment_id, stripe_refund_id, amount, reason, status, created_by)
VALUES ($1, $2, $3, $4, 'pending', $5)
RETURNING *;

-- name: GetRefundByID :one
SELECT * FROM refunds WHERE id = $1;

-- name: ListRefundsByPayment :many
SELECT * FROM refunds WHERE payment_id = $1 ORDER BY created_at DESC;

-- name: ListAllRefunds :many
SELECT * FROM refunds ORDER BY created_at DESC LIMIT $1 OFFSET $2;

-- name: UpdateRefundStatus :one
UPDATE refunds SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *;

-- name: CreateDispute :one
INSERT INTO disputes (payment_id, stripe_dispute_id, amount, reason, status, evidence_due_by)
VALUES ($1, $2, $3, $4, 'needs_response', $5)
RETURNING *;

-- name: GetDisputeByID :one
SELECT * FROM disputes WHERE id = $1;

-- name: GetDisputeByStripeID :one
SELECT * FROM disputes WHERE stripe_dispute_id = $1;

-- name: ListAllDisputes :many
SELECT * FROM disputes ORDER BY created_at DESC LIMIT $1 OFFSET $2;

-- name: UpdateDisputeStatus :one
UPDATE disputes SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *;
