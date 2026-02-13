# EchoBilling

EchoBilling 是一个面向托管/VPS 类产品的全栈计费平台。
项目包含：

- Go 后端服务（`cmd/api`）
- 基于 Asynq 的 Go 后台任务进程（`cmd/worker`）
- React + Vite 前端（`frontend/`）
- PostgreSQL 数据库迁移（`migrations/`）与 SQLC 查询定义（`queries/`）

## 当前状态

仓库目前处于积极开发中。
已包含核心认证、商品目录、订单、管理端与计费模块，以及公开页、用户门户和管理后台相关前端页面。

## 技术栈

- 后端：Go、Gin、pgx、JWT、Stripe SDK、Asynq
- 数据库：PostgreSQL
- 缓存/队列：Redis
- 前端：React、TypeScript、Vite、Tailwind CSS
- 工具链：goose、sqlc、golangci-lint、Docker Compose

## 仓库结构

```text
.
|- cmd/
|  |- api/                 # 后端服务入口
|  `- worker/              # Asynq Worker 入口
|- internal/               # 后端业务模块
|- frontend/               # React 单页应用
|- migrations/             # Goose SQL 迁移文件
|- queries/                # SQLC 查询文件
|- docker-compose.yml
`- Makefile
```

## 环境要求

- Go `1.24+`
- Node.js `20+` 与 npm
- Docker + Docker Compose（推荐用于本地启动 Postgres/Redis）

可选的本地 CLI 工具：

- `goose`：数据库迁移
- `sqlc`：代码生成
- `golangci-lint`：代码检查

## 环境变量

先复制模板：

```bash
cp .env.example .env
```

重要字段如下：

- `DATABASE_URL`：Postgres 连接串
- `REDIS_ADDR`：Redis 地址
- `JWT_SECRET`：JWT 签名密钥
- `STRIPE_SECRET_KEY`、`STRIPE_PUBLISHABLE_KEY`、`STRIPE_WEBHOOK_SECRET`：Stripe 集成配置
- `FRONTEND_URL`：结账跳转使用的前端地址
- `ENVIRONMENT`：本地开发请使用 `dev`

Token 过期配置说明：

- 后端读取 `JWT_EXPIRY_HOURS`（整数，默认 `24`）。
- 如果 `.env` 里只有 `JWT_EXPIRY`，当前后端配置加载器会忽略它。

## 快速开始（本地开发）

### 1) 启动 PostgreSQL 和 Redis

```bash
make docker-db-up
```

### 2) 执行数据库迁移

先在 shell 中设置 `DATABASE_URL`（需与 `.env` 一致）：

```bash
export DATABASE_URL="postgres://echobilling:echobilling@localhost:5432/echobilling?sslmode=disable"
```

可直接使用 goose 执行迁移：

```bash
go run github.com/pressly/goose/v3/cmd/goose@latest -dir migrations postgres "$DATABASE_URL" up
```

或者（本地已安装 goose 时）：

```bash
make migrate-up
```

### 3) 启动后端服务

在两个终端中分别运行：

```bash
make run-api
```

```bash
make run-worker
```

### 4) 启动前端

```bash
cd frontend
npm install
npm run dev
```

### 5) 健康检查

```bash
curl http://localhost:8080/health
```

期望返回：

```json
{"status":"ok","service":"echobilling"}
```

## 快速开始（Docker 方式）

```bash
cp .env.example .env
make docker-build
make docker-up
```

随后在宿主机执行迁移（命令同上）。

停止服务：

```bash
make docker-down
```

## 默认访问地址

- 前端：`http://localhost:5173`
- 健康检查：`http://localhost:8080/health`

## 管理员账号设置

公开注册创建的用户角色默认为 `customer`。
如需提升为管理员：

1. 先注册并登录目标用户。
2. 执行以下 SQL 更新角色：

```bash
docker compose exec -T postgres psql -U echobilling -d echobilling \
  -c "UPDATE users SET role='admin' WHERE email='admin@example.com';"
```

## 常用 Make 命令

- `make help`：查看可用命令
- `make run-api`：本地运行后端服务
- `make run-worker`：本地运行 worker
- `make test`：执行 `go test ./...`
- `make build`：构建 `bin/api` 与 `bin/worker`
- `make sqlc`：重新生成 SQLC 代码
- `make migrate-status`：查看迁移状态
- `make migrate-create NAME=create_xxx`：创建新迁移

## 许可证

MIT License，详见 `LICENSE`。
