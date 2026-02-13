-- name: CreateInvoice :one
INSERT INTO invoices (user_id, order_id, invoice_number, status, subtotal, tax, total, currency, due_date)
VALUES ($1, $2, $3, 'draft', $4, $5, $6, $7, $8)
RETURNING *;

-- name: GetInvoiceByID :one
SELECT * FROM invoices WHERE id = $1;

-- name: GetInvoiceByNumber :one
SELECT * FROM invoices WHERE invoice_number = $1;

-- name: ListInvoicesByUser :many
SELECT * FROM invoices WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3;

-- name: ListAllInvoices :many
SELECT * FROM invoices ORDER BY created_at DESC LIMIT $1 OFFSET $2;

-- name: UpdateInvoiceStatus :one
UPDATE invoices SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *;

-- name: MarkInvoicePaid :one
UPDATE invoices SET status = 'paid', paid_at = NOW(), updated_at = NOW() WHERE id = $1 RETURNING *;

-- name: CountInvoices :one
SELECT COUNT(*) FROM invoices;

-- name: CreateInvoiceItem :one
INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, amount)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: ListInvoiceItems :many
SELECT * FROM invoice_items WHERE invoice_id = $1;
