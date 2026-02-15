-- +goose Up
CREATE TYPE two_factor_method AS ENUM ('totp', 'email');

ALTER TABLE users
  ADD COLUMN totp_secret TEXT,
  ADD COLUMN two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN two_factor_method two_factor_method,
  ADD COLUMN recovery_codes TEXT[];

-- +goose Down
ALTER TABLE users
  DROP COLUMN IF EXISTS recovery_codes,
  DROP COLUMN IF EXISTS two_factor_method,
  DROP COLUMN IF EXISTS two_factor_enabled,
  DROP COLUMN IF EXISTS totp_secret;

DROP TYPE IF EXISTS two_factor_method;
