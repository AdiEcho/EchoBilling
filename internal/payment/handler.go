package payment

import (
	"github.com/adiecho/echobilling/internal/app"
	"github.com/hibiken/asynq"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Handler struct {
	pool          *pgxpool.Pool
	stripeKey     string
	webhookSecret string
	frontendURL   string
	asynqClient   *asynq.Client
}

func NewHandler(pool *pgxpool.Pool, cfg *app.Config, asynqClient *asynq.Client) *Handler {
	return &Handler{
		pool:          pool,
		stripeKey:     cfg.StripeSecretKey,
		webhookSecret: cfg.StripeWebhookSecret,
		frontendURL:   cfg.FrontendURL,
		asynqClient:   asynqClient,
	}
}

type CreateCheckoutRequest struct {
	OrderID string `json:"order_id" binding:"required"`
}
