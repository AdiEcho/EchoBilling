-- +migrate Up
CREATE TABLE IF NOT EXISTS system_settings (
    key         TEXT PRIMARY KEY,
    value       TEXT NOT NULL DEFAULT '',
    is_secret   BOOLEAN NOT NULL DEFAULT FALSE,
    description TEXT NOT NULL DEFAULT '',
    group_name  TEXT NOT NULL DEFAULT '',
    updated_by  TEXT NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_system_settings_group ON system_settings (group_name);

-- SMTP settings
INSERT INTO system_settings (key, value, is_secret, description, group_name) VALUES
    ('smtp_host',     '', FALSE, 'SMTP server host',     'smtp'),
    ('smtp_port',     '', FALSE, 'SMTP server port',     'smtp'),
    ('smtp_username', '', FALSE, 'SMTP username',        'smtp'),
    ('smtp_password', '', TRUE,  'SMTP password',        'smtp'),
    ('smtp_from',     '', FALSE, 'Sender email address', 'smtp');

-- Stripe settings
INSERT INTO system_settings (key, value, is_secret, description, group_name) VALUES
    ('stripe_secret_key',      '', TRUE,  'Stripe secret key',      'stripe'),
    ('stripe_webhook_secret',  '', TRUE,  'Stripe webhook secret',  'stripe'),
    ('stripe_publishable_key', '', FALSE, 'Stripe publishable key', 'stripe');

-- Webhook settings
INSERT INTO system_settings (key, value, is_secret, description, group_name) VALUES
    ('renewal_webhook_url',       '', FALSE, 'Renewal notification webhook URL',       'webhook'),
    ('renewal_webhook_token',     '', TRUE,  'Renewal webhook bearer token',           'webhook'),
    ('notification_timeout_secs', '', FALSE, 'HTTP timeout for webhook calls (seconds)', 'webhook');

-- +migrate Down
DROP TABLE IF EXISTS system_settings;
