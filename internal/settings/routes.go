package settings

import "github.com/gin-gonic/gin"

// RegisterRoutes registers settings routes on the admin router group.
func RegisterRoutes(admin *gin.RouterGroup, h *Handler) {
	admin.GET("/settings", h.GetSettings)
	admin.PUT("/settings", h.UpdateSettings)
	admin.POST("/settings/test-smtp", h.TestSMTP)
}

// RegisterPublicRoutes registers public settings routes (no auth required).
func RegisterPublicRoutes(public *gin.RouterGroup, h *Handler) {
	public.GET("/public", h.GetPublicSettings)
}
