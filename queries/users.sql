-- name: CreateUser :one
INSERT INTO users (email, password_hash, role)
VALUES ($1, $2, $3)
RETURNING id, email, role, email_verified, created_at, updated_at;

-- name: GetUserByEmail :one
SELECT id, email, password_hash, role, email_verified, created_at, updated_at
FROM users WHERE email = $1;

-- name: GetUserByID :one
SELECT id, email, password_hash, role, email_verified, created_at, updated_at
FROM users WHERE id = $1;

-- name: UpdateUserEmail :exec
UPDATE users SET email = $2, updated_at = NOW() WHERE id = $1;

-- name: UpdateUserPassword :exec
UPDATE users SET password_hash = $2, updated_at = NOW() WHERE id = $1;

-- name: ListUsers :many
SELECT id, email, role, email_verified, created_at, updated_at
FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2;

-- name: CountUsers :one
SELECT COUNT(*) FROM users;
