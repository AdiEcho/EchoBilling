# EchoBilling 全栈实施方案

## 总体策略

按开发文档的 4 阶段推进，每阶段内按"后端骨架 → 数据库 → API → 前端页面"顺序实施。
采用模块化单体架构，Go 后端 + React 前端 SPA，通过 API 通信。

---

## 开发进度快照（更新于 2026-02-14）

### 总览

| Phase | 状态 | 完成度（估算） | 备注 |
|------|------|------|------|
| Phase 1: 骨架+基础设施 | 基本完成 | 100% | `sqlc` 已生成到 `internal/db/` |
| Phase 2: 认证模块 | 进行中 | 100% | `handler + service + middleware` 已拆分完成，认证功能完整 |
| Phase 3: 产品目录 | 进行中 | 100% | `handler + service` 已拆分完成，产品与后台 CRUD 可用 |
| Phase 4: 订单模块 | 进行中 | 95% | 订单核心 helper 与用户门户逻辑已拆分到独立 `service.go` |
| Phase 5: 支付模块 | 进行中 | 95% | `handler + service + webhook` 已拆分完成，待真实 Stripe 环境联调 |
| Phase 6: 账单模块 | 进行中 | 90% | `handler + service` 已拆分完成，发票接口可用 |
| Phase 7: 管理后台 | 进行中 | 100% | `handler + service + middleware` 已拆分完成，管理端核心接口可用 |
| Phase 8: React 前端 | 进行中 | 80% | 主要页面已落地，设计系统组件与部分路由仍缺口 |
| Phase 9: Worker 任务系统 | 进行中 | 90% | 已接入外部续费提醒 Webhook，并增加每日批量提醒调度 |

### 本次核对结果

- 后端验证：`go test ./...` 通过（含新增单测：状态流转/金额转换/续费提醒日期计算）。
- `sqlc` 代码生成：通过 `CGO_ENABLED=0 go run github.com/sqlc-dev/sqlc/cmd/sqlc@latest generate` 已生成 `internal/db/`。
- 前端构建检查：`npm run build` 通过（Vite 生产构建成功）。

### 本轮同步摘要（后端）

- 已补齐门户后端接口：`GET /api/v1/portal/stats`、`GET /api/v1/portal/services`、`GET /api/v1/portal/services/{id}`、`POST /api/v1/portal/change-password`。
- 已补齐支付到开通闭环：Stripe `checkout.session.completed` 后自动创建 `services`、写入 `provisioning_jobs` 并投递 Asynq 开通任务。
- 已补齐管理系统接口：`GET /api/v1/admin/system`（DB/Redis/Worker 健康摘要）。
- 已接入续费提醒外部通知：Worker 支持可配置 Webhook（含 Token/超时），并增加每日批量提醒调度（7/3/1 天）。
- 当前后端剩余阻塞：Stripe 真实环境联调、后端集成/回归测试。

### 本轮同步摘要（后端拆分）

- 认证模块已完成独立拆分：`internal/auth/handler.go` + `internal/auth/service.go` + `internal/auth/middleware.go`。
- 产品目录模块已完成独立拆分：`internal/catalog/handler.go` + `internal/catalog/service.go`。
- 订单模块已完成服务层拆分：`internal/order/service.go`（购物车草稿单与状态机逻辑从 handler 拆出）。
- 用户门户模块已完成服务层拆分：`internal/customer/handler.go` + `internal/customer/service.go`。
- 支付模块已完成独立拆分：`internal/payment/handler.go` + `internal/payment/service.go` + `internal/payment/webhook.go`。
- 账单模块已完成独立拆分：`internal/billing/handler.go` + `internal/billing/service.go`。
- 管理后台模块已完成独立拆分：`internal/admin/handler.go` + `internal/admin/service.go` + `internal/admin/middleware.go`。

### 主要阻塞（需优先修复）

- Stripe 支付主流程仍缺少真实环境端到端联调（仅完成编译级与代码级修复）。
- 后端仍缺少集成/回归测试（当前以单元测试与编译检查为主）。

---

## Phase 1: 项目骨架 + Go 后端基础设施

### 当前进度
- [x] Go 项目初始化、目录结构、`cmd/api` 与 `cmd/worker` 已落地。
- [x] `internal/app` 的配置、DB、Redis、基础 server 与中间件代码已完成。
- [x] `migrations/` 11 个核心迁移已完成。
- [x] `queries/` 查询文件与 `sqlc.yaml` 已完成。
- [x] `sqlc` 代码生成产物（`internal/db/`）已落地。

### 1.1 Go 项目初始化
- 创建 `go.mod`（module `github.com/adiecho/echobilling`）
- 安装核心依赖：gin, pgx, sqlc, asynq, stripe-go, jwt, uuid, argon2
- 创建目录结构：`cmd/api/`, `cmd/worker/`, `internal/*/`, `migrations/`, `queries/`, `configs/`

### 1.2 基础设施层 (`internal/app/`)
- `config.go` - 配置加载（从环境变量/.env）
- `database.go` - PostgreSQL 连接池（pgx）
- `redis.go` - Redis 连接
- `server.go` - Gin 引擎初始化、中间件注册、路由挂载
- `middleware/` - CORS、日志、Recovery、认证中间件、限流

### 1.3 数据库迁移 (`migrations/`)
按顺序创建所有核心表的 SQL 迁移文件：
1. `001_users.up.sql` / `001_users.down.sql`
2. `002_customer_profiles.up.sql`
3. `003_products.up.sql`
4. `004_plans.up.sql`
5. `005_orders_and_items.up.sql`
6. `006_services.up.sql`
7. `007_invoices_and_items.up.sql`
8. `008_payments_and_events.up.sql`
9. `009_refunds_disputes.up.sql`
10. `010_provisioning_jobs.up.sql`
11. `011_audit_logs.up.sql`

### 1.4 sqlc 查询定义 (`queries/`)
- `sqlc.yaml` 配置
- 每个模块的 `.sql` 查询文件
- 生成类型安全的 Go 代码到 `internal/db/`

### 1.5 入口点
- `cmd/api/main.go` - HTTP 服务启动
- `cmd/worker/main.go` - Asynq Worker 启动

---

## Phase 2: 认证模块 (`internal/auth/`)

### 当前进度
- [x] `handler/routes/jwt/password` 已实现，注册/登录/`me` 可用。
- [x] Argon2id 哈希、JWT 生成与校验已接入。
- [x] `POST /api/v1/auth/refresh` 已实现。
- [x] 已拆分独立 `service.go` 与认证 `middleware.go`（模块内独立入口已提供）。

### 2.1 后端
- `handler.go` - Register/Login HTTP handlers
- `service.go` - 业务逻辑（密码哈希 Argon2id、JWT 签发/验证）
- `middleware.go` - JWT 认证中间件
- `routes.go` - 路由注册

### 2.2 API 端点
- `POST /api/v1/auth/register` - 注册（email, password, name）
- `POST /api/v1/auth/login` - 登录（返回 JWT）
- `POST /api/v1/auth/refresh` - Token 刷新
- `GET /api/v1/auth/me` - 当前用户信息
- `POST /api/v1/portal/change-password` - 用户修改密码

---

## Phase 3: 产品目录模块 (`internal/catalog/`)

### 当前进度
- [x] 公开产品列表、产品详情、后台产品/套餐 CRUD 已实现。
- [x] `GET /api/v1/products/{id}/plans` 已作为独立端点提供。
- [x] 已拆分独立 `service.go`（handler 仅负责参数绑定与响应）。

### 3.1 后端
- `handler.go` - 产品/套餐 CRUD
- `service.go` - 业务逻辑
- `routes.go` - 路由

### 3.2 API 端点
- `GET /api/v1/products` - 公开产品列表
- `GET /api/v1/products/{slug}` - 产品详情
- `GET /api/v1/products/{id}/plans` - 套餐列表
- Admin: `POST/PUT/DELETE /api/v1/admin/products`
- Admin: `POST/PUT/DELETE /api/v1/admin/plans`

---

## Phase 4: 订单模块 (`internal/order/`)

### 当前进度
- [x] 下单、用户订单列表/详情、管理员订单列表与状态更新已实现。
- [x] 状态机转换规则（`draft -> pending_payment -> paid -> provisioning -> active`）已在处理逻辑中体现。
- [x] 购物车相关接口（`POST /api/v1/cart/items`、`GET /api/v1/cart`）已实现。
- [x] 已拆分独立 `service.go`（草稿单、购物车与状态机逻辑已迁移）。
- [x] 用户门户模块已拆分独立 `service.go`（`internal/customer/service.go`）。

### 4.1 后端
- `handler.go` - 购物车、下单
- `service.go` - 订单状态机（draft → pending_payment → paid → provisioning → active）
- `routes.go`

### 4.2 API 端点
- `POST /api/v1/cart/items` - 添加购物车
- `GET /api/v1/cart` - 查看购物车
- `POST /api/v1/orders` - 创建订单
- `GET /api/v1/portal/orders` - 用户订单列表
- `GET /api/v1/portal/orders/{id}` - 订单详情
- `GET /api/v1/portal/stats` - 用户中心统计概览
- `GET /api/v1/portal/services` - 用户服务列表
- `GET /api/v1/portal/services/{id}` - 用户服务详情

---

## Phase 5: 支付模块 (`internal/payment/`)

### 当前进度
- [x] `POST /api/v1/checkout/session`、`POST /api/v1/webhooks/stripe` 已实现。
- [x] 管理端退款接口已实现（位于 `internal/admin` 的 `POST /api/v1/admin/refunds`）。
- [x] 支付模块 SQL 字段与迁移错配问题已完成修复（含 `payments/payment_events/refunds/disputes` 等）。
- [x] 支付成功后自动创建 `services`、`provisioning_jobs` 并投递 VPS 开通任务（Asynq）。
- [x] `service.go`、`webhook.go` 已按计划拆分为独立文件。
- [ ] 仍需真实 Stripe 环境联调与回归验证。

### 5.1 后端
- `handler.go` - Checkout Session 创建、Webhook 处理
- `service.go` - Stripe 集成逻辑
- `webhook.go` - Webhook 验签、事件去重、分发处理
- `routes.go`

### 5.2 API 端点
- `POST /api/v1/checkout/session` - 创建 Stripe Checkout
- `POST /api/v1/webhooks/stripe` - Webhook 接收
- Admin: `POST /api/v1/admin/refunds` - 发起退款

---

## Phase 6: 账单模块 (`internal/billing/`)

### 当前进度
- [x] 用户发票列表/详情与管理端发票列表接口已实现。
- [x] 已拆分独立 `service.go`（查询与金额处理逻辑已迁移）。

### 6.1 后端
- `handler.go` - 发票查看
- `service.go` - 发票生成、续费逻辑
- `routes.go`

### 6.2 API 端点
- `GET /api/v1/portal/invoices` - 用户发票列表
- `GET /api/v1/portal/invoices/{id}` - 发票详情
- Admin: `GET /api/v1/admin/invoices`

---

## Phase 7: 管理后台模块 (`internal/admin/`)

### 当前进度
- [x] 已实现仪表板、客户列表、支付列表、管理员退款等核心接口。
- [x] 管理员权限校验中间件已在公共中间件中实现并接入路由。
- [x] `POST /api/v1/admin/services/{id}/provision` 与 `GET /api/v1/admin/system/jobs` 已实现。
- [x] `PATCH /api/v1/admin/orders/{id}` 已补齐（兼容 `PATCH /api/v1/admin/orders/{id}/status`）。
- [x] `GET /api/v1/admin/system` 系统健康摘要接口已实现（DB/Redis/Worker）。
- [x] 已拆分独立 `service.go` 与 `middleware.go`（handler 仅保留 HTTP 参数绑定与响应）。

### 7.1 后端
- `handler.go` - 管理端聚合接口
- `service.go` - 管理操作（用户管理、订单处理等）
- `middleware.go` - 管理员权限校验
- `routes.go`

### 7.2 API 端点
- `GET /api/v1/admin/customers` - 客户列表
- `PATCH /api/v1/admin/orders/{id}` - 更新订单
- `POST /api/v1/admin/services/{id}/provision` - 手动开通
- `GET /api/v1/admin/payments` - 支付记录
- `GET /api/v1/admin/system` - 系统健康摘要
- `GET /api/v1/admin/system/jobs` - 任务队列状态

---

## Phase 8: React 前端

### 当前进度
- [x] Vite + React + TypeScript + Tailwind v4 + Router + Zustand 基础架构已完成。
- [x] 公开页、认证页、用户中心、管理后台主要页面均已创建并接入路由。
- [x] 字体与主题变量（Space Grotesk / DM Sans / JetBrains Mono）已配置。
- [ ] 设计系统仅完成 `Button/Input/Card/Badge`，`Modal/Table/Skeleton` 缺失。
- [ ] 路由为 `/portal/services` 列表页，计划中的 `/portal/services/{id}` 详情页未实现。

### 8.1 项目初始化 (`frontend/`)
- Vite + React + TypeScript
- TailwindCSS v4 配置（Dark Tech 主题）
- React Router v7
- Axios/fetch API 客户端
- 字体：Space Grotesk + DM Sans + JetBrains Mono

### 8.2 设计系统 (`frontend/src/components/ui/`)
- Button, Input, Card, Badge, Modal, Table, Skeleton
- 深色主题色彩系统（Slate 900 背景、Indigo 500 主色、Emerald 500 CTA）
- Glassmorphism 卡片样式
- 响应式布局组件

### 8.3 公开页面（Stripe 审核关键）
- `/` - 首页（Hero + Bento Grid 特性展示 + 信任背书）
- `/pricing` - 套餐价格页（参数矩阵对比）
- `/vps/{slug}` - 产品详情页
- `/about` - 公司信息（LLC 名称）
- `/contact` - 联系方式
- `/terms` - 服务条款
- `/privacy` - 隐私政策
- `/refund-policy` - 退款政策
- `/cancellation-policy` - 取消政策

### 8.4 认证页面
- `/login` - 登录
- `/register` - 注册

### 8.5 用户中心页面 (`/portal/*`)
- Dashboard - 服务概览
- Orders - 订单列表
- Services/{id} - 服务详情（状态指示器、操作按钮）
- Invoices - 发票列表
- Billing Methods - 支付方式管理
- Security - 密码修改

### 8.6 管理后台页面 (`/admin/*`)
- Products - 产品管理 CRUD
- Orders - 订单管理
- Invoices - 发票管理
- Payments - 支付记录
- Customers - 客户管理
- System/Jobs - 任务队列监控

---

## Phase 9: Worker 任务系统

- [x] Worker 进程启动、任务类型定义、调度器注册已实现。
- [x] VPS 开通/暂停/终止、续费提醒、发票生成、过期检查任务处理器已创建。
- [x] 续费提醒已接入外部通知系统（Webhook，可配置 Token 与超时），并保留审计日志。
- [x] 发票/服务任务字段与迁移不一致问题已修复。

- `cmd/worker/main.go` - Asynq worker 启动
- `internal/provisioning/` - VPS 开通任务（模拟）
- 续费提醒任务
- 发票生成任务
- 服务到期处理任务

---

## 实施顺序（按优先级）

由于代码量巨大，按以下顺序分批实施：

### 批次 1: 后端骨架 + 数据库
- Phase 1 全部（项目初始化、基础设施、迁移、sqlc）
- Phase 2（认证模块）

### 批次 2: 核心业务后端
- Phase 3（产品目录）
- Phase 4（订单）
- Phase 5（支付/Stripe）
- Phase 6（账单）
- Phase 7（管理后台）

### 批次 3: 前端
- Phase 8.1-8.3（前端初始化 + 设计系统 + 公开页面）
- Phase 8.4-8.6（认证 + 用户中心 + 管理后台）

### 批次 4: Worker + 收尾
- Phase 9（任务系统）
- 集成测试
- 配置文件和部署脚本

---

## 技术决策

| 决策 | 选择 | 理由 |
|------|------|------|
| 迁移工具 | goose | 更简洁，支持 Go 和 SQL 迁移 |
| 前端路由 | React Router v7 | 成熟稳定 |
| 状态管理 | Zustand | 轻量，适合中等规模 |
| HTTP 客户端 | fetch + 自定义封装 | 减少依赖 |
| 图标库 | Lucide React | 与设计规范一致 |
| 表单 | React Hook Form + Zod | 类型安全验证 |
| 表格 | TanStack Table | 功能强大，headless |

---

## 文件预估

- Go 后端：~50 个文件
- SQL 迁移：~22 个文件（11 对 up/down）
- sqlc 查询：~10 个文件
- React 前端：~60 个文件
- 配置文件：~10 个文件
- 总计：~150 个文件
