package setup

import "github.com/gin-gonic/gin"

// RegisterRoutes 注册初始化设置路由（公开，无需认证）
func RegisterRoutes(rg *gin.RouterGroup, h *Handler) {
	rg.GET("/status", h.GetStatus)
	rg.POST("/admin", h.CreateAdmin)
}
