package settings

import "github.com/gin-gonic/gin"

// RegisterRoutes registers settings routes on the admin router group.
func RegisterRoutes(admin *gin.RouterGroup, h *Handler) {
	admin.GET("/settings", h.GetSettings)
	admin.PUT("/settings", h.UpdateSettings)
	admin.POST("/settings/test-smtp", h.TestSMTP)
}
