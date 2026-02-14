package customer

import "github.com/gin-gonic/gin"

func RegisterRoutes(portal *gin.RouterGroup, h *Handler) {
	portal.GET("/stats", h.GetStats)
	portal.GET("/services", h.ListServices)
	portal.GET("/services/:id", h.GetService)
	portal.POST("/change-password", h.ChangePassword)
}
