package auth

import (
	"context"
	"crypto/rand"
	"fmt"
	"math/big"
	"net/smtp"
	"time"

	"github.com/redis/go-redis/v9"
)

const (
	emailCodeLen = 6
	emailCodeTTL = 5 * time.Minute
)

// SMTPConfig SMTP 邮件配置
type SMTPConfig struct {
	Host     string
	Port     string
	Username string
	Password string
	From     string
}

// GenerateEmailCode 生成 6 位随机数字码
func GenerateEmailCode() (string, error) {
	code := ""
	for i := 0; i < emailCodeLen; i++ {
		n, err := rand.Int(rand.Reader, big.NewInt(10))
		if err != nil {
			return "", fmt.Errorf("generate digit: %w", err)
		}
		code += fmt.Sprintf("%d", n.Int64())
	}
	return code, nil
}

// StoreEmailCode 存入 Redis，TTL 5 分钟
func StoreEmailCode(ctx context.Context, rdb *redis.Client, userID, code string) error {
	key := fmt.Sprintf("2fa:email:%s", userID)
	return rdb.Set(ctx, key, code, emailCodeTTL).Err()
}

// VerifyEmailCode 验证 Redis 中的码并删除（一次性使用）
func VerifyEmailCode(ctx context.Context, rdb *redis.Client, userID, code string) (bool, error) {
	key := fmt.Sprintf("2fa:email:%s", userID)
	stored, err := rdb.Get(ctx, key).Result()
	if err == redis.Nil {
		return false, nil
	}
	if err != nil {
		return false, fmt.Errorf("get email code: %w", err)
	}
	if stored != code {
		return false, nil
	}
	// 验证成功，删除码
	rdb.Del(ctx, key)
	return true, nil
}

// SendEmailCode 通过 SMTP 发送验证码邮件
func SendEmailCode(cfg *SMTPConfig, toEmail, code string) error {
	if cfg == nil || cfg.Host == "" {
		return fmt.Errorf("SMTP not configured")
	}

	subject := "EchoBilling - Your Verification Code"
	body := fmt.Sprintf(
		"Your verification code is: %s\n\nThis code will expire in 5 minutes.\nIf you did not request this code, please ignore this email.",
		code,
	)

	msg := fmt.Sprintf(
		"From: %s\r\nTo: %s\r\nSubject: %s\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n%s",
		cfg.From, toEmail, subject, body,
	)

	addr := fmt.Sprintf("%s:%s", cfg.Host, cfg.Port)
	auth := smtp.PlainAuth("", cfg.Username, cfg.Password, cfg.Host)

	return smtp.SendMail(addr, auth, cfg.From, []string{toEmail}, []byte(msg))
}
