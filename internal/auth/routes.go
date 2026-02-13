package auth

import (
	"github.com/gin-gonic/gin"
)

// RegisterRoutes 注册认证路由
func RegisterRoutes(rg *gin.RouterGroup, h *Handler, authMiddleware gin.HandlerFunc) {
	// 公开路由
	rg.POST("/register", h.Register)
	rg.POST("/login", h.Login)

	// 需要认证的路由
	rg.GET("/me", authMiddleware, h.Me)
}
