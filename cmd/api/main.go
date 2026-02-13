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
	"github.com/adiecho/echobilling/internal/order"
	"github.com/adiecho/echobilling/internal/payment"
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

	rdb, err := app.NewRedis(cfg.RedisAddr)
	if err != nil {
		log.Fatalf("Failed to connect to Redis: %v", err)
	}
	defer rdb.Close()
	log.Println("Connected to Redis")

	router := app.NewServer(cfg, pool, rdb)
	authMiddleware := middleware.AuthRequired(cfg.JWTSecret)
	adminMiddleware := middleware.AdminRequired()

	// API v1 路由组
	v1 := router.Group("/api/v1")

	// 认证路由
	authHandler := auth.NewHandler(pool, cfg)
	auth.RegisterRoutes(v1.Group("/auth"), authHandler, authMiddleware)

	// 产品目录路由（公开）
	catalogHandler := catalog.NewHandler(pool)
	catalog.RegisterRoutes(v1.Group("/products"), v1.Group("/admin", authMiddleware, adminMiddleware), catalogHandler)

	// 用户门户路由（需要认证）
	portal := v1.Group("/portal", authMiddleware)

	// 订单路由
	orderHandler := order.NewHandler(pool)
	adminGroup := v1.Group("/admin", authMiddleware, adminMiddleware)
	order.RegisterRoutes(portal, adminGroup, orderHandler)

	// 账单路由
	billingHandler := billing.NewHandler(pool)
	billing.RegisterRoutes(portal, adminGroup, billingHandler)

	// 支付路由
	paymentHandler := payment.NewHandler(pool, cfg)
	payment.RegisterRoutes(portal, v1.Group("/webhooks"), paymentHandler)

	// 管理后台路由
	adminHandler := admin.NewHandler(pool, cfg)
	admin.RegisterRoutes(adminGroup, adminHandler)

	log.Println("All routes registered")

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
