package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/adiecho/echobilling/internal/app"
	"github.com/adiecho/echobilling/internal/provisioning"
	"github.com/hibiken/asynq"
)

func main() {
	ctx := context.Background()

	// 加载配置
	cfg, err := app.LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// 连接数据库
	pool, err := app.NewDatabase(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer pool.Close()

	log.Println("Connected to database")

	// 创建任务处理器
	handler := provisioning.NewTaskHandler(pool)

	// 创建 Asynq 服务器
	srv := asynq.NewServer(
		asynq.RedisClientOpt{Addr: cfg.RedisAddr},
		asynq.Config{
			// 并发处理任务数
			Concurrency: 10,
			// 队列优先级
			Queues: map[string]int{
				"critical": 6,
				"default":  3,
				"low":      1,
			},
		},
	)

	// 创建任务处理器多路复用器
	mux := asynq.NewServeMux()

	// 注册任务处理器
	mux.HandleFunc(provisioning.TypeProvisionVPS, handler.HandleProvisionVPS)
	mux.HandleFunc(provisioning.TypeSuspendVPS, handler.HandleSuspendVPS)
	mux.HandleFunc(provisioning.TypeTerminateVPS, handler.HandleTerminateVPS)
	mux.HandleFunc(provisioning.TypeRenewalReminder, handler.HandleRenewalReminder)
	mux.HandleFunc(provisioning.TypeGenerateInvoice, handler.HandleGenerateInvoice)
	mux.HandleFunc(provisioning.TypeExpireService, handler.HandleExpireService)

	log.Println("Registered task handlers:")
	log.Println("  - vps:provision")
	log.Println("  - vps:suspend")
	log.Println("  - vps:terminate")
	log.Println("  - billing:renewal_reminder")
	log.Println("  - billing:generate_invoice")
	log.Println("  - service:expire")

	// 创建调度器（用于周期性任务）
	scheduler := asynq.NewScheduler(
		asynq.RedisClientOpt{Addr: cfg.RedisAddr},
		&asynq.SchedulerOpts{},
	)

	// 注册周期性任务
	if err := provisioning.RegisterPeriodicTasks(scheduler); err != nil {
		log.Fatalf("Failed to register periodic tasks: %v", err)
	}

	log.Println("Starting Asynq worker and scheduler...")

	// 启动调度器
	go func() {
		if err := scheduler.Run(); err != nil {
			log.Fatalf("Failed to start scheduler: %v", err)
		}
	}()

	// 启动 worker
	go func() {
		if err := srv.Run(mux); err != nil {
			log.Fatalf("Failed to start worker: %v", err)
		}
	}()

	// 优雅关闭
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down worker and scheduler...")

	// 关闭调度器
	scheduler.Shutdown()

	// 关闭 worker
	srv.Shutdown()

	log.Println("Worker exited")
}
