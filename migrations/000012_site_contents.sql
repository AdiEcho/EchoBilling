-- +goose Up
CREATE TABLE site_contents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_key VARCHAR(50) NOT NULL,
    section_key VARCHAR(100) NOT NULL,
    locale VARCHAR(10) NOT NULL DEFAULT 'en',
    content TEXT NOT NULL DEFAULT '',
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_site_contents_unique ON site_contents(page_key, section_key, locale);
CREATE INDEX idx_site_contents_page ON site_contents(page_key, locale);

-- +goose Down
DROP TABLE IF EXISTS site_contents;
