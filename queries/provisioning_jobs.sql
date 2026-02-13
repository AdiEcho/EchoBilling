-- name: CreateProvisioningJob :one
INSERT INTO provisioning_jobs (service_id, job_type, status)
VALUES ($1, $2, 'pending')
RETURNING *;

-- name: GetProvisioningJobByID :one
SELECT * FROM provisioning_jobs WHERE id = $1;

-- name: ListJobsByService :many
SELECT * FROM provisioning_jobs WHERE service_id = $1 ORDER BY created_at DESC;

-- name: ListPendingJobs :many
SELECT * FROM provisioning_jobs WHERE status = 'pending' ORDER BY created_at ASC LIMIT $1;

-- name: UpdateJobStatus :one
UPDATE provisioning_jobs SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *;

-- name: StartJob :one
UPDATE provisioning_jobs SET status = 'running', started_at = NOW(), attempts = attempts + 1, updated_at = NOW()
WHERE id = $1 RETURNING *;

-- name: CompleteJob :one
UPDATE provisioning_jobs SET status = 'completed', completed_at = NOW(), updated_at = NOW()
WHERE id = $1 RETURNING *;

-- name: FailJob :one
UPDATE provisioning_jobs SET status = 'failed', last_error = $2, updated_at = NOW()
WHERE id = $1 RETURNING *;

-- name: ListRetryableJobs :many
SELECT * FROM provisioning_jobs
WHERE status = 'failed' AND attempts < max_attempts
ORDER BY created_at ASC LIMIT $1;
