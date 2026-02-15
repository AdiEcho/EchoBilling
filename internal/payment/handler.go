package payment

import (
	"github.com/adiecho/echobilling/internal/app"
	"github.com/hibiken/asynq"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Handler struct {
	pool        *pgxpool.Pool
	store       *app.SettingsStore
	frontendURL string
	asynqClient *asynq.Client
}

func NewHandler(pool *pgxpool.Pool, cfg *app.Config, asynqClient *asynq.Client, store *app.SettingsStore) *Handler {
	return &Handler{
		pool:        pool,
		store:       store,
		frontendURL: cfg.FrontendURL,
		asynqClient: asynqClient,
	}
}

type CreateCheckoutRequest struct {
	OrderID string `json:"order_id" binding:"required"`
}
