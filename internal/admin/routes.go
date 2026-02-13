package admin

import "github.com/gin-gonic/gin"

func RegisterRoutes(admin *gin.RouterGroup, h *Handler) {
	admin.GET("/dashboard", h.GetDashboardStats)
	admin.GET("/customers", h.ListCustomers)
	admin.GET("/payments", h.AdminListPayments)
	admin.POST("/refunds", h.AdminCreateRefund)
}
