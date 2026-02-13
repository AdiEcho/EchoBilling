package app

import (
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	ServerPort           string
	DatabaseURL          string
	RedisAddr            string
	JWTSecret            string
	JWTExpiry            time.Duration
	StripeSecretKey      string
	StripeWebhookSecret  string
	StripePublishableKey string
	FrontendURL          string
	Environment          string
}

func LoadConfig() (*Config, error) {
	// 尝试加载 .env 文件（如果存在）
	_ = godotenv.Load()

	cfg := &Config{
		ServerPort:           getEnv("SERVER_PORT", "8080"),
		DatabaseURL:          getEnv("DATABASE_URL", ""),
		RedisAddr:            getEnv("REDIS_ADDR", "localhost:6379"),
		JWTSecret:            getEnv("JWT_SECRET", ""),
		StripeSecretKey:      getEnv("STRIPE_SECRET_KEY", ""),
		StripeWebhookSecret:  getEnv("STRIPE_WEBHOOK_SECRET", ""),
		StripePublishableKey: getEnv("STRIPE_PUBLISHABLE_KEY", ""),
		FrontendURL:          getEnv("FRONTEND_URL", "http://localhost:3000"),
		Environment:          getEnv("ENVIRONMENT", "dev"),
	}

	// 解析 JWT 过期时间（默认 24 小时）
	jwtExpiryHours := getEnvInt("JWT_EXPIRY_HOURS", 24)
	cfg.JWTExpiry = time.Duration(jwtExpiryHours) * time.Hour

	// 验证必需的配置
	if cfg.DatabaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL is required")
	}
	if cfg.JWTSecret == "" {
		return nil, fmt.Errorf("JWT_SECRET is required")
	}

	return cfg, nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}
