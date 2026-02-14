.PHONY: help dev build run migrate-up migrate-down sqlc test lint docker-up docker-down docker-build deploy-up deploy-down deploy-build clean

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

# === 开发环境（仅基础设施，方便本地调试） ===

docker-up: ## Start infrastructure (postgres + redis) for local development
	docker compose up -d

docker-down: ## Stop infrastructure services
	docker compose down

# === 部署环境（完整服务栈，前端已打包进后端） ===

deploy-build: ## Build deployment docker images (includes frontend)
	docker compose -f docker-compose.deploy.yml build

deploy-up: ## Deploy full stack (api + worker + postgres + redis)
	docker compose -f docker-compose.deploy.yml up -d

deploy-down: ## Stop full stack deployment
	docker compose -f docker-compose.deploy.yml down

clean: ## Clean build artifacts
	rm -rf bin/
