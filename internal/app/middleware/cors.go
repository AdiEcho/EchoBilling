package middleware

import (
	"github.com/gin-gonic/gin"
)

func CORS(environment string) gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")

		// 根据环境设置允许的源
		allowedOrigins := map[string]bool{
			"http://localhost:3000": true,
			"http://localhost:8080": true,
		}

		// 生产环境添加实际域名
		if environment == "prod" {
			// TODO: 添加生产环境域名
			// allowedOrigins["https://yourdomain.com"] = true
		}

		if allowedOrigins[origin] || environment == "dev" {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
			c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
			c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
			c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")
		}

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}
