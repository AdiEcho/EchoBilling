-- name: UpsertCustomerProfile :one
INSERT INTO customer_profiles (user_id, full_name, company_name, phone, address_line1, address_line2, city, state, postal_code, country, tax_id)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
ON CONFLICT (user_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    company_name = EXCLUDED.company_name,
    phone = EXCLUDED.phone,
    address_line1 = EXCLUDED.address_line1,
    address_line2 = EXCLUDED.address_line2,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    postal_code = EXCLUDED.postal_code,
    country = EXCLUDED.country,
    tax_id = EXCLUDED.tax_id,
    updated_at = NOW()
RETURNING *;

-- name: GetCustomerProfile :one
SELECT * FROM customer_profiles WHERE user_id = $1;
