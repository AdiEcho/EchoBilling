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
		adminOrders.PATCH("/:id", h.AdminUpdateOrderStatus)
	}
}

// RegisterCartRoutes 注册购物车路由（认证后）
func RegisterCartRoutes(authenticated *gin.RouterGroup, h *Handler) {
	cart := authenticated.Group("/cart")
	{
		cart.POST("/items", h.AddCartItem)
		cart.GET("", h.GetCart)
	}
}
