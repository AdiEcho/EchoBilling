package order

import (
	"github.com/gin-gonic/gin"
)

// RegisterRoutes 注册订单路由
func RegisterRoutes(portal *gin.RouterGroup, admin *gin.RouterGroup, h *Handler) {
	// 用户端订单路由
	orders := portal.Group("/orders")
	{
		orders.POST("", h.CreateOrder)
		orders.GET("", h.ListOrders)
		orders.GET("/:id", h.GetOrder)
	}

	// 管理员订单路由
	adminOrders := admin.Group("/orders")
	{
		adminOrders.GET("", h.AdminListOrders)
		adminOrders.PATCH("/:id/status", h.AdminUpdateOrderStatus)
	}
}
