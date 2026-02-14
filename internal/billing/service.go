package billing

import (
	"context"
	"errors"
	"strconv"

	"github.com/jackc/pgx/v5"
)

var (
	ErrInvoiceNotFound  = errors.New("invoice not found")
	ErrInvoiceForbidden = errors.New("invoice access forbidden")
)

func (h *Handler) listUserInvoices(ctx context.Context, userID string, page, limit int) ([]Invoice, int64, error) {
	offset := (page - 1) * limit

	var total int64
	err := h.pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM invoices WHERE user_id = $1`,
		userID,
	).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	rows, err := h.pool.Query(ctx,
		`SELECT id, user_id, order_id, invoice_number, status, subtotal, tax, total, currency, due_date, paid_at, created_at
		 FROM invoices
		 WHERE user_id = $1
		 ORDER BY created_at DESC
		 LIMIT $2 OFFSET $3`,
		userID, limit, offset,
	)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	invoices := make([]Invoice, 0)
	for rows.Next() {
		var inv Invoice
		var subtotal, tax, totalAmount string
		if err := rows.Scan(
			&inv.ID, &inv.UserID, &inv.OrderID, &inv.InvoiceNumber, &inv.Status,
			&subtotal, &tax, &totalAmount, &inv.Currency, &inv.DueDate, &inv.PaidAt, &inv.CreatedAt,
		); err != nil {
			return nil, 0, err
		}

		inv.Subtotal = normalizeAmount(subtotal)
		inv.Tax = normalizeAmount(tax)
		inv.Total = normalizeAmount(totalAmount)
		invoices = append(invoices, inv)
	}

	if err := rows.Err(); err != nil {
		return nil, 0, err
	}

	return invoices, total, nil
}

func (h *Handler) getUserInvoice(ctx context.Context, userID, invoiceID string) (*Invoice, error) {
	var inv Invoice
	var subtotal, tax, totalAmount string
	err := h.pool.QueryRow(ctx,
		`SELECT id, user_id, order_id, invoice_number, status, subtotal, tax, total, currency, due_date, paid_at, created_at
		 FROM invoices
		 WHERE id = $1`,
		invoiceID,
	).Scan(
		&inv.ID, &inv.UserID, &inv.OrderID, &inv.InvoiceNumber, &inv.Status,
		&subtotal, &tax, &totalAmount, &inv.Currency, &inv.DueDate, &inv.PaidAt, &inv.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrInvoiceNotFound
		}
		return nil, err
	}

	if inv.UserID != userID {
		return nil, ErrInvoiceForbidden
	}

	inv.Subtotal = normalizeAmount(subtotal)
	inv.Tax = normalizeAmount(tax)
	inv.Total = normalizeAmount(totalAmount)

	rows, err := h.pool.Query(ctx,
		`SELECT id, description, quantity, unit_price, amount
		 FROM invoice_items
		 WHERE invoice_id = $1
		 ORDER BY created_at`,
		invoiceID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]InvoiceItem, 0)
	for rows.Next() {
		var item InvoiceItem
		var unitPrice, amount string
		if err := rows.Scan(&item.ID, &item.Description, &item.Quantity, &unitPrice, &amount); err != nil {
			return nil, err
		}

		item.UnitPrice = normalizeAmount(unitPrice)
		item.Amount = normalizeAmount(amount)
		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	inv.Items = items
	return &inv, nil
}

func (h *Handler) listAdminInvoices(ctx context.Context, page, limit int) ([]AdminInvoiceSummary, int64, error) {
	offset := (page - 1) * limit

	var total int64
	err := h.pool.QueryRow(ctx, `SELECT COUNT(*) FROM invoices`).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	rows, err := h.pool.Query(ctx,
		`SELECT i.id,
		        i.invoice_number,
		        COALESCE(NULLIF(u.name, ''), u.email) AS customer_name,
		        u.email AS customer_email,
		        i.status::text,
		        i.total::text,
		        i.created_at
		 FROM invoices i
		 JOIN users u ON u.id = i.user_id
		 ORDER BY i.created_at DESC
		 LIMIT $1 OFFSET $2`,
		limit, offset,
	)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	invoices := make([]AdminInvoiceSummary, 0)
	for rows.Next() {
		var (
			inv           AdminInvoiceSummary
			amountDecimal string
		)
		if err := rows.Scan(
			&inv.ID,
			&inv.InvoiceNumber,
			&inv.CustomerName,
			&inv.CustomerEmail,
			&inv.Status,
			&amountDecimal,
			&inv.CreatedAt,
		); err != nil {
			return nil, 0, err
		}

		inv.Amount, _ = strconv.ParseFloat(amountDecimal, 64)
		invoices = append(invoices, inv)
	}

	if err := rows.Err(); err != nil {
		return nil, 0, err
	}

	return invoices, total, nil
}

func normalizeAmount(amount string) string {
	parsed, err := strconv.ParseFloat(amount, 64)
	if err != nil {
		return amount
	}
	return strconv.FormatFloat(parsed, 'f', 2, 64)
}
