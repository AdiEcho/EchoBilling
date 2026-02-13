-- +goose Up
CREATE TYPE job_status AS ENUM ('pending', 'running', 'completed', 'failed');

CREATE TABLE provisioning_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    job_type VARCHAR(50) NOT NULL,
    status job_status NOT NULL DEFAULT 'pending',
    attempts INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 3,
    last_error TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_provisioning_jobs_service_id ON provisioning_jobs(service_id);
CREATE INDEX idx_provisioning_jobs_status ON provisioning_jobs(status);
CREATE INDEX idx_provisioning_jobs_job_type ON provisioning_jobs(job_type);
CREATE INDEX idx_provisioning_jobs_created_at ON provisioning_jobs(created_at);

-- +goose Down
DROP TABLE IF EXISTS provisioning_jobs;
DROP TYPE IF EXISTS job_status;
