-- +goose Up
CREATE TABLE vps_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    category product_category NOT NULL DEFAULT 'vps',
    plan_presets JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vps_templates_slug ON vps_templates(slug);
CREATE INDEX idx_vps_templates_is_active ON vps_templates(is_active);

-- +goose Down
DROP TABLE IF EXISTS vps_templates;
