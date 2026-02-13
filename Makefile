.PHONY: help dev build run migrate-up migrate-down sqlc test lint docker-up docker-down

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

build: ## Build API and Worker binaries
	go build -o bin/api ./cmd/api
	go build -o bin/worker ./cmd/worker

run-api: ## Run API server
	go run ./cmd/api

run-worker: ## Run Asynq worker
	go run ./cmd/worker

migrate-up: ## Run database migrations up
	goose -dir migrations postgres "$$DATABASE_URL" up

migrate-down: ## Run database migrations down one step
	goose -dir migrations postgres "$$DATABASE_URL" down

migrate-status: ## Show migration status
	goose -dir migrations postgres "$$DATABASE_URL" status

migrate-create: ## Create a new migration (usage: make migrate-create NAME=create_xxx)
	goose -dir migrations create $(NAME) sql

sqlc: ## Generate sqlc code
	sqlc generate

test: ## Run tests
	go test ./... -v -count=1

lint: ## Run linter
	golangci-lint run ./...

docker-up: ## Start all services with docker-compose
	docker compose up -d

docker-down: ## Stop all services
	docker compose down

docker-build: ## Build docker images
	docker compose build

clean: ## Clean build artifacts
	rm -rf bin/
