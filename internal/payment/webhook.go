package payment

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/adiecho/echobilling/internal/common"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/stripe/stripe-go/v82"
	"github.com/stripe/stripe-go/v82/webhook"
)

// HandleWebhook 处理 Stripe Webhook 事件
func (h *Handler) HandleWebhook(c *gin.Context) {
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to read request body"})
		return
	}

	event, err := webhook.ConstructEvent(body, c.GetHeader("Stripe-Signature"), h.webhookSecret)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid signature"})
		return
	}

	ctx := c.Request.Context()

	var exists bool
	err = h.pool.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM payment_events WHERE stripe_event_id = $1)`,
		event.ID,
	).Scan(&exists)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	if exists {
		c.JSON(http.StatusOK, gin.H{"message": "Event already processed"})
		return
	}

	eventData, _ := json.Marshal(event.Data.Raw)
	eventRecordID := uuid.New().String()
	_, err = h.pool.Exec(ctx,
		`INSERT INTO payment_events (id, stripe_event_id, event_type, payload, processed, created_at)
		 VALUES ($1, $2, $3, $4, false, $5)`,
		eventRecordID, event.ID, event.Type, eventData, time.Now(),
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to store event"})
		return
	}

	var processErr error
	switch event.Type {
	case "checkout.session.completed":
		processErr = h.handleCheckoutSessionCompleted(ctx, event)
	case "payment_intent.payment_failed":
		processErr = h.handlePaymentIntentFailed(ctx, event)
	case "charge.refunded":
		processErr = h.handleChargeRefunded(ctx, event)
	case "charge.dispute.created":
		processErr = h.handleDisputeCreated(ctx, event)
	}

	now := time.Now()
	if processErr != nil {
		_, _ = h.pool.Exec(ctx,
			`UPDATE payment_events
			 SET processed = true, error_message = $2, processed_at = $3
			 WHERE id = $1`,
			eventRecordID, processErr.Error(), now,
		)
		c.JSON(http.StatusInternalServerError, gin.H{"error": processErr.Error()})
		return
	}

	_, err = h.pool.Exec(ctx,
		`UPDATE payment_events
		 SET processed = true, processed_at = $2
		 WHERE id = $1`,
		eventRecordID, now,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to mark event processed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Webhook processed"})
}

func (h *Handler) handleCheckoutSessionCompleted(ctx context.Context, event stripe.Event) error {
	var sess stripe.CheckoutSession
	if err := json.Unmarshal(event.Data.Raw, &sess); err != nil {
		return fmt.Errorf("failed to parse session: %w", err)
	}

	orderID := sess.Metadata["order_id"]
	if orderID == "" && sess.ClientReferenceID != "" {
		orderID = sess.ClientReferenceID
	}
	if orderID == "" {
		return fmt.Errorf("order_id not found in session metadata")
	}

	tx, err := h.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	var userID, orderStatus, currency, totalAmount string
	err = tx.QueryRow(ctx,
		`SELECT user_id, status, currency, total_amount::text
		 FROM orders
		 WHERE id = $1`,
		orderID,
	).Scan(&userID, &orderStatus, &currency, &totalAmount)
	if err != nil {
		return fmt.Errorf("failed to query order: %w", err)
	}

	now := time.Now()
	if orderStatus != "paid" {
		_, err = tx.Exec(ctx,
			`UPDATE orders
			 SET status = 'paid', updated_at = $1
			 WHERE id = $2`,
			now, orderID,
		)
		if err != nil {
			return fmt.Errorf("failed to update order status: %w", err)
		}
	}

	invoiceID, err := h.createInvoice(ctx, tx, orderID, userID, currency, totalAmount, now)
	if err != nil {
		return fmt.Errorf("failed to create invoice: %w", err)
	}

	amount := totalAmount
	if sess.AmountTotal > 0 {
		amount = common.CentsToDecimal(sess.AmountTotal)
	}

	var paymentIntentID string
	if sess.PaymentIntent != nil {
		paymentIntentID = sess.PaymentIntent.ID
	}

	var existingPaymentID string
	if paymentIntentID != "" {
		_ = tx.QueryRow(ctx,
			`SELECT id
			 FROM payments
			 WHERE stripe_payment_intent_id = $1
			 LIMIT 1`,
			paymentIntentID,
		).Scan(&existingPaymentID)
	}
	if existingPaymentID == "" {
		_ = tx.QueryRow(ctx,
			`SELECT id
			 FROM payments
			 WHERE stripe_checkout_session_id = $1
			 LIMIT 1`,
			sess.ID,
		).Scan(&existingPaymentID)
	}

	if existingPaymentID != "" {
		_, err = tx.Exec(ctx,
			`UPDATE payments
			 SET user_id = $2,
			     invoice_id = $3,
			     stripe_payment_intent_id = COALESCE(NULLIF($4, ''), stripe_payment_intent_id),
			     stripe_checkout_session_id = $5,
			     amount = $6,
			     currency = $7,
			     status = 'succeeded',
			     method = 'card',
			     updated_at = $8
			 WHERE id = $1`,
			existingPaymentID, userID, invoiceID, paymentIntentID, sess.ID, amount, strings.ToUpper(currency), now,
		)
		if err != nil {
			return fmt.Errorf("failed to update payment: %w", err)
		}
	} else {
		paymentID := uuid.New().String()
		var stripePaymentIntentID interface{}
		if paymentIntentID != "" {
			stripePaymentIntentID = paymentIntentID
		}

		_, err = tx.Exec(ctx,
			`INSERT INTO payments (
				id, user_id, invoice_id, stripe_payment_intent_id, stripe_checkout_session_id,
				amount, currency, status, method, created_at, updated_at
			)
			VALUES ($1, $2, $3, $4, $5, $6, $7, 'succeeded', 'card', $8, $8)`,
			paymentID, userID, invoiceID, stripePaymentIntentID, sess.ID, amount, strings.ToUpper(currency), now,
		)
		if err != nil {
			return fmt.Errorf("failed to create payment: %w", err)
		}
	}

	provisioningTasks, err := h.prepareProvisioningJobs(ctx, tx, orderID, userID, now)
	if err != nil {
		return fmt.Errorf("failed to prepare provisioning jobs: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("failed to commit payment transaction: %w", err)
	}

	if err := h.enqueueProvisioningTasks(ctx, provisioningTasks); err != nil {
		return fmt.Errorf("failed to enqueue provisioning tasks: %w", err)
	}

	return nil
}

func (h *Handler) handlePaymentIntentFailed(ctx context.Context, event stripe.Event) error {
	var intent stripe.PaymentIntent
	if err := json.Unmarshal(event.Data.Raw, &intent); err != nil {
		return fmt.Errorf("failed to parse payment intent: %w", err)
	}

	if intent.ID == "" {
		return nil
	}

	_, err := h.pool.Exec(ctx,
		`UPDATE payments
		 SET status = 'failed', updated_at = $2
		 WHERE stripe_payment_intent_id = $1`,
		intent.ID, time.Now(),
	)
	if err != nil {
		return fmt.Errorf("failed to mark payment failed: %w", err)
	}

	return nil
}

func (h *Handler) handleChargeRefunded(ctx context.Context, event stripe.Event) error {
	var charge stripe.Charge
	if err := json.Unmarshal(event.Data.Raw, &charge); err != nil {
		return fmt.Errorf("failed to parse charge: %w", err)
	}

	if charge.PaymentIntent == nil || charge.PaymentIntent.ID == "" {
		return nil
	}
	paymentIntentID := charge.PaymentIntent.ID

	tx, err := h.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	var paymentID string
	err = tx.QueryRow(ctx,
		`SELECT id
		 FROM payments
		 WHERE stripe_payment_intent_id = $1`,
		paymentIntentID,
	).Scan(&paymentID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil
		}
		return fmt.Errorf("failed to get payment: %w", err)
	}

	now := time.Now()
	_, err = tx.Exec(ctx,
		`UPDATE payments
		 SET status = 'refunded', updated_at = $2
		 WHERE id = $1`,
		paymentID, now,
	)
	if err != nil {
		return fmt.Errorf("failed to update payment: %w", err)
	}

	if len(charge.Refunds.Data) > 0 {
		ref := charge.Refunds.Data[0]
		_, err = tx.Exec(ctx,
			`INSERT INTO refunds (id, payment_id, stripe_refund_id, amount, reason, status, created_at, updated_at)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
			 ON CONFLICT (stripe_refund_id) DO UPDATE SET
			   amount = EXCLUDED.amount,
			   reason = EXCLUDED.reason,
			   status = EXCLUDED.status,
			   updated_at = EXCLUDED.updated_at`,
			uuid.New().String(),
			paymentID,
			ref.ID,
			common.CentsToDecimal(ref.Amount),
			string(ref.Reason),
			common.MapRefundStatus(string(ref.Status)),
			now,
		)
		if err != nil {
			return fmt.Errorf("failed to create refund: %w", err)
		}
	}

	return tx.Commit(ctx)
}

func (h *Handler) handleDisputeCreated(ctx context.Context, event stripe.Event) error {
	var dispute stripe.Dispute
	if err := json.Unmarshal(event.Data.Raw, &dispute); err != nil {
		return fmt.Errorf("failed to parse dispute: %w", err)
	}

	if dispute.PaymentIntent == nil || dispute.PaymentIntent.ID == "" {
		return nil
	}
	paymentIntentID := dispute.PaymentIntent.ID

	var paymentID string
	err := h.pool.QueryRow(ctx,
		`SELECT id
		 FROM payments
		 WHERE stripe_payment_intent_id = $1`,
		paymentIntentID,
	).Scan(&paymentID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil
		}
		return fmt.Errorf("failed to get payment: %w", err)
	}

	var evidenceDueBy *time.Time
	if dispute.EvidenceDetails != nil && dispute.EvidenceDetails.DueBy > 0 {
		t := time.Unix(dispute.EvidenceDetails.DueBy, 0)
		evidenceDueBy = &t
	}

	now := time.Now()
	_, err = h.pool.Exec(ctx,
		`INSERT INTO disputes (
			id, payment_id, stripe_dispute_id, amount, reason, status, evidence_due_by, created_at, updated_at
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
		ON CONFLICT (stripe_dispute_id) DO UPDATE SET
		  amount = EXCLUDED.amount,
		  reason = EXCLUDED.reason,
		  status = EXCLUDED.status,
		  evidence_due_by = EXCLUDED.evidence_due_by,
		  updated_at = EXCLUDED.updated_at`,
		uuid.New().String(),
		paymentID,
		dispute.ID,
		common.CentsToDecimal(dispute.Amount),
		dispute.Reason,
		mapDisputeStatus(string(dispute.Status)),
		evidenceDueBy,
		now,
	)
	if err != nil {
		return fmt.Errorf("failed to create dispute: %w", err)
	}

	return nil
}
