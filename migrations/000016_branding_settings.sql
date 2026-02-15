-- +goose Up
INSERT INTO system_settings (key, value, is_secret, description, group_name) VALUES
    ('site_name',          'EchoBilling', FALSE, 'Site display name',       'branding'),
    ('company_legal_name', 'EchoBilling LLC', FALSE, 'Company legal name', 'branding');

-- +goose Down
DELETE FROM system_settings WHERE key IN ('site_name', 'company_legal_name');
