package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/adiecho/echobilling/internal/admin"
	"github.com/adiecho/echobilling/internal/app"
	"github.com/adiecho/echobilling/internal/app/middleware"
	"github.com/adiecho/echobilling/internal/auth"
	"github.com/adiecho/echobilling/internal/billing"
	"github.com/adiecho/echobilling/internal/catalog"
	"github.com/adiecho/echobilling/internal/content"
	"github.com/adiecho/echobilling/internal/customer"
	"github.com/adiecho/echobilling/internal/order"
	"github.com/adiecho/echobilling/internal/payment"
	"github.com/adiecho/echobilling/internal/settings"
	"github.com/adiecho/echobilling/internal/setup"
	"github.com/adiecho/echobilling/internal/template"
	"github.com/hibiken/asynq"
	"github.com/stripe/stripe-go/v82"
)

func main() {
	cfg, err := app.LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	ctx := context.Background()

	pool, err := app.NewDatabase(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer pool.Close()
	log.Println("Connected to PostgreSQL")

	if err := app.RunMigrations(cfg.DatabaseURL); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	rdb, err := app.NewRedis(cfg.RedisAddr, cfg.RedisPassword)
	if err != nil {
		log.Fatalf("Failed to connect to Redis: %v", err)
	}
	defer rdb.Close()
	log.Println("Connected to Redis")

	// 统一设置 Stripe Key（全局只设置一次）
	// 初始化 SettingsStore
	settingsStore := app.NewSettingsStore(pool, app.BuildEnvDefaults(cfg))
	if err := settingsStore.Load(ctx); err != nil {
		log.Fatalf("Failed to load settings store: %v", err)
	}
	stripe.Key = settingsStore.StripeSecretKey()

	// 创建共享的 Asynq Client
	asynqClient := asynq.NewClient(asynq.RedisClientOpt{Addr: cfg.RedisAddr, Password: cfg.RedisPassword})
	defer asynqClient.Close()

	router := app.NewServer(cfg, pool, rdb)
	authMiddleware := auth.AuthMiddleware(cfg.JWTSecret)
	adminMiddleware := admin.AdminMiddleware()

	// API v1 路由组
	v1 := router.Group("/api/v1")

	// 初始化设置路由（公开，无需认证）
	setupHandler := setup.NewHandler(pool, cfg.JWTSecret, cfg.JWTExpiry)
	setup.RegisterRoutes(v1.Group("/setup"), setupHandler)

	// 认证路由（严格限流：5 req/s，burst 10，防止暴力破解）
	authHandler := auth.NewHandler(pool, rdb, cfg, settingsStore)
	auth.RegisterRoutes(v1.Group("/auth", middleware.RateLimit(5, 10)), authHandler, authMiddleware)

	// 产品目录路由（公开）
	catalogHandler := catalog.NewHandler(pool)
	catalog.RegisterRoutes(v1.Group("/products"), v1.Group("/admin", authMiddleware, adminMiddleware), catalogHandler)

	// 页面内容管理路由（公开读取 + 管理员编辑）
	contentHandler := content.NewHandler(pool)
	content.RegisterRoutes(v1.Group("/content"), v1.Group("/admin/content", authMiddleware, adminMiddleware), contentHandler)

	// VPS 模板管理路由（管理员）
	templateHandler := template.NewHandler(pool)
	template.RegisterRoutes(v1.Group("/admin", authMiddleware, adminMiddleware), templateHandler)

	// 用户门户路由（需要认证）
	portal := v1.Group("/portal", authMiddleware)
	authed := v1.Group("", authMiddleware)

	// 2FA 设置路由（需要认证）
	auth.Register2FARoutes(portal, authHandler)

	// 用户门户附加路由
	customerHandler := customer.NewHandler(pool)
	customer.RegisterRoutes(portal, customerHandler)

	// 订单路由
	orderHandler := order.NewHandler(pool)
	adminGroup := v1.Group("/admin", authMiddleware, adminMiddleware)
	order.RegisterRoutes(portal, adminGroup, orderHandler)
	order.RegisterCartRoutes(authed, orderHandler)

	// 账单路由
	billingHandler := billing.NewHandler(pool)
	billing.RegisterRoutes(portal, adminGroup, billingHandler)

	// 支付路由
	paymentHandler := payment.NewHandler(pool, cfg, asynqClient, settingsStore)
	payment.RegisterRoutes(authed, v1.Group("/webhooks"), paymentHandler)
	// 兼容旧路径
	portal.POST("/checkout/session", paymentHandler.CreateCheckoutSession)

	// 管理后台路由
	adminHandler := admin.NewHandler(pool, cfg, asynqClient)
	admin.RegisterRoutes(adminGroup, adminHandler)

	// 系统设置路由
	settingsSvc := settings.NewService(pool)
	settingsHandler := settings.NewHandler(settingsSvc, settingsStore)
	settings.RegisterRoutes(adminGroup, settingsHandler)
	settings.RegisterPublicRoutes(v1.Group("/settings"), settingsHandler)

	log.Println("All routes registered")

	// 前端 SPA 静态文件服务（frontend/dist 存在时自动启用）
	app.SetupSPA(router)

	srv := &http.Server{
		Addr:         ":" + cfg.ServerPort,
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		log.Printf("Starting server on port %s", cfg.ServerPort)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Printf("Server forced to shutdown: %v", err)
	}
	log.Println("Server exited")
}
