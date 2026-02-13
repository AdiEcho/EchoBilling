package app

import (
	"net/http"

	"github.com/adiecho/echobilling/internal/app/middleware"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

func NewServer(cfg *Config, pool *pgxpool.Pool, rdb *redis.Client) *gin.Engine {
	if cfg.Environment == "prod" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()

	r.Use(gin.Recovery())
	r.Use(gin.Logger())
	r.Use(middleware.CORS(cfg.Environment))

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"service": "echobilling",
		})
	})

	return r
}
