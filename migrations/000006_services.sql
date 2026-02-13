-- +goose Up
CREATE TYPE service_status AS ENUM ('pending', 'provisioning', 'active', 'suspended', 'cancelled', 'terminated');

CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_item_id UUID UNIQUE NOT NULL REFERENCES order_items(id) ON DELETE RESTRICT,
    plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
    status service_status NOT NULL DEFAULT 'pending',
    hostname VARCHAR(255),
    ip_address VARCHAR(45),
    expires_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_services_user_id ON services(user_id);
CREATE INDEX idx_services_order_item_id ON services(order_item_id);
CREATE INDEX idx_services_status ON services(status);
CREATE INDEX idx_services_expires_at ON services(expires_at);

-- +goose Down
DROP TABLE IF EXISTS services;
DROP TYPE IF EXISTS service_status;
