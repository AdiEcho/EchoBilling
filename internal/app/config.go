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
	RedisPassword        string
	JWTSecret            string
	JWTExpiry            time.Duration
	StripeSecretKey      string
	StripeWebhookSecret  string
	StripePublishableKey string
	FrontendURL          string
	Environment          string
	RenewalWebhookURL    string
	RenewalWebhookToken  string
	NotificationTimeout  time.Duration
	SMTPHost             string
	SMTPPort             string
	SMTPUsername         string
	SMTPPassword         string
	SMTPFrom             string
}

func LoadConfig() (*Config, error) {
	// 尝试加载 .env 文件（如果存在）
	_ = godotenv.Load()

	cfg := &Config{
		ServerPort:           getEnv("SERVER_PORT", "8080"),
		DatabaseURL:          getEnv("DATABASE_URL", ""),
		RedisAddr:            getEnv("REDIS_ADDR", "localhost:6379"),
		RedisPassword:        getEnv("REDIS_PASSWORD", ""),
		JWTSecret:            getEnv("JWT_SECRET", ""),
		StripeSecretKey:      getEnv("STRIPE_SECRET_KEY", ""),
		StripeWebhookSecret:  getEnv("STRIPE_WEBHOOK_SECRET", ""),
		StripePublishableKey: getEnv("STRIPE_PUBLISHABLE_KEY", ""),
		FrontendURL:          getEnv("FRONTEND_URL", "http://localhost:5173"),
		Environment:          getEnv("ENVIRONMENT", "dev"),
		RenewalWebhookURL:    getEnv("RENEWAL_WEBHOOK_URL", ""),
		RenewalWebhookToken:  getEnv("RENEWAL_WEBHOOK_TOKEN", ""),
		SMTPHost:             getEnv("SMTP_HOST", ""),
		SMTPPort:             getEnv("SMTP_PORT", "587"),
		SMTPUsername:         getEnv("SMTP_USERNAME", ""),
		SMTPPassword:         getEnv("SMTP_PASSWORD", ""),
		SMTPFrom:             getEnv("SMTP_FROM", ""),
	}

	// 解析 JWT 过期时间（优先 JWT_EXPIRY_HOURS，其次 JWT_EXPIRY，默认 24h）
	jwtExpiryHours := getEnvInt("JWT_EXPIRY_HOURS", 0)
	switch {
	case jwtExpiryHours > 0:
		cfg.JWTExpiry = time.Duration(jwtExpiryHours) * time.Hour
	case getEnv("JWT_EXPIRY", "") != "":
		if d, err := time.ParseDuration(getEnv("JWT_EXPIRY", "")); err == nil {
			cfg.JWTExpiry = d
		} else {
			cfg.JWTExpiry = 24 * time.Hour
		}
	default:
		cfg.JWTExpiry = 24 * time.Hour
	}
	cfg.NotificationTimeout = time.Duration(getEnvInt("NOTIFICATION_TIMEOUT_SECONDS", 5)) * time.Second

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
