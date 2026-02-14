package middleware

import (
	"log"

	"github.com/gin-gonic/gin"
)

func CORS(environment, frontendURL string) gin.HandlerFunc {
	isDevEnv := environment == "dev" || environment == "development" || environment == "local"

	if !isDevEnv && frontendURL == "" {
		log.Println("[CORS] WARNING: production environment with empty frontendURL — only localhost origins allowed")
	}

	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")

		allowedOrigins := make(map[string]bool)

		if isDevEnv {
			allowedOrigins["http://localhost:3000"] = true
			allowedOrigins["http://localhost:8080"] = true
			allowedOrigins["http://localhost:5173"] = true
		}

		if frontendURL != "" {
			allowedOrigins[frontendURL] = true
		}

		if allowedOrigins[origin] {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
			c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
			c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With, X-Request-ID")
			c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")
		}

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}
