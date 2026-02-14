package auth

import (
	"github.com/adiecho/echobilling/internal/app/middleware"
	"github.com/gin-gonic/gin"
)

// AuthMiddleware 提供模块内独立的认证中间件入口。
func AuthMiddleware(jwtSecret string) gin.HandlerFunc {
	return middleware.AuthRequired(jwtSecret)
}

// AdminMiddleware 提供模块内独立的管理员中间件入口。
func AdminMiddleware() gin.HandlerFunc {
	return middleware.AdminRequired()
}
