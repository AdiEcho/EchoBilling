-- +goose Up
CREATE TYPE refund_status AS ENUM ('pending', 'succeeded', 'failed');
CREATE TYPE dispute_status AS ENUM ('needs_response', 'under_review', 'won', 'lost');

CREATE TABLE refunds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    stripe_refund_id VARCHAR(255) UNIQUE,
    amount NUMERIC(10,2) NOT NULL,
    reason TEXT,
    status refund_status NOT NULL DEFAULT 'pending',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    stripe_dispute_id VARCHAR(255) UNIQUE,
    amount NUMERIC(10,2) NOT NULL,
    reason VARCHAR(255),
    status dispute_status NOT NULL DEFAULT 'needs_response',
    evidence_due_by TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refunds_payment_id ON refunds(payment_id);
CREATE INDEX idx_refunds_stripe_refund_id ON refunds(stripe_refund_id);
CREATE INDEX idx_refunds_status ON refunds(status);
CREATE INDEX idx_disputes_payment_id ON disputes(payment_id);
CREATE INDEX idx_disputes_stripe_dispute_id ON disputes(stripe_dispute_id);
CREATE INDEX idx_disputes_status ON disputes(status);

-- +goose Down
DROP TABLE IF EXISTS disputes;
DROP TABLE IF EXISTS refunds;
DROP TYPE IF EXISTS dispute_status;
DROP TYPE IF EXISTS refund_status;
