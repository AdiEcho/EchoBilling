package template

import "github.com/gin-gonic/gin"

func RegisterRoutes(admin *gin.RouterGroup, h *Handler) {
	templates := admin.Group("/templates")
	templates.GET("", h.ListTemplates)
	templates.GET("/:id", h.GetTemplate)
	templates.POST("", h.CreateTemplate)
	templates.PUT("/:id", h.UpdateTemplate)
	templates.DELETE("/:id", h.DeleteTemplate)
	templates.POST("/:id/apply", h.ApplyTemplate)
}
