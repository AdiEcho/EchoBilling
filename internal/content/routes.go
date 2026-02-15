package content

import "github.com/gin-gonic/gin"

// RegisterRoutes registers public and admin content routes.
func RegisterRoutes(public *gin.RouterGroup, admin *gin.RouterGroup, h *Handler) {
	public.GET("/:page", h.GetPageContent)
	admin.PUT("/:page", h.UpdatePageContent)
}
