-- +goose Up
INSERT INTO system_settings (key, value, is_secret, description, group_name) VALUES
    ('site_domain', '', FALSE, 'Site domain for email addresses (e.g. example.com)', 'branding');

-- +goose Down
DELETE FROM system_settings WHERE key = 'site_domain';
