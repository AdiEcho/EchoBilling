package app

import (
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

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
	r.Use(middleware.RequestID())
	r.Use(gin.Logger())
	r.Use(middleware.CORS(cfg.Environment, cfg.FrontendURL))
	r.Use(middleware.RateLimit(100, 200)) // 全局限流：100 req/s，burst 200

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"service": "echobilling",
		})
	})

	return r
}

// SetupSPA 配置前端 SPA 静态文件服务。
// 当 frontend/dist 目录存在时，后端直接提供前端页面，无需单独启动前端服务。
func SetupSPA(r *gin.Engine) {
	frontendDir := "./frontend/dist"
	if _, err := os.Stat(frontendDir); err != nil {
		log.Println("Frontend dist not found, skipping SPA setup")
		return
	}

	log.Println("Serving frontend from ./frontend/dist")

	indexFile := filepath.Join(frontendDir, "index.html")

	// 提供静态资源文件（JS、CSS 等）
	r.Static("/assets", filepath.Join(frontendDir, "assets"))

	// SPA 回退：非 API 路由返回 index.html，由前端路由处理
	r.NoRoute(func(c *gin.Context) {
		path := c.Request.URL.Path
		if strings.HasPrefix(path, "/api/") {
			c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
			return
		}
		c.File(indexFile)
	})
}
