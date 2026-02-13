-- +goose Up
CREATE TABLE plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    cpu_cores INT,
    memory_mb INT,
    disk_gb INT,
    bandwidth_tb NUMERIC(10,2),
    price_monthly NUMERIC(10,2),
    price_quarterly NUMERIC(10,2),
    price_annually NUMERIC(10,2),
    setup_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    features JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_plans_product_id ON plans(product_id);
CREATE INDEX idx_plans_slug ON plans(slug);
CREATE INDEX idx_plans_is_active ON plans(is_active);

-- +goose Down
DROP TABLE IF EXISTS plans;
