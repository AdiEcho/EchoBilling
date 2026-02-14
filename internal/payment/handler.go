package payment

import (
	"github.com/adiecho/echobilling/internal/app"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/stripe/stripe-go/v82"
)

type Handler struct {
	pool          *pgxpool.Pool
	stripeKey     string
	webhookSecret string
	frontendURL   string
	redisAddr     string
}

func NewHandler(pool *pgxpool.Pool, cfg *app.Config) *Handler {
	stripe.Key = cfg.StripeSecretKey
	return &Handler{
		pool:          pool,
		stripeKey:     cfg.StripeSecretKey,
		webhookSecret: cfg.StripeWebhookSecret,
		frontendURL:   cfg.FrontendURL,
		redisAddr:     cfg.RedisAddr,
	}
}

type CreateCheckoutRequest struct {
	OrderID string `json:"order_id" binding:"required"`
}
