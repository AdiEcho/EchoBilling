package catalog

import "github.com/gin-gonic/gin"

func RegisterRoutes(public *gin.RouterGroup, admin *gin.RouterGroup, h *Handler) {
	public.GET("", h.ListProducts)
	public.GET("/:id/plans", h.ListPlansByProductID)
	public.GET("/:id", h.GetProductBySlug)

	adminProducts := admin.Group("/products")
	adminProducts.POST("", h.AdminCreateProduct)
	adminProducts.PUT("/:id", h.AdminUpdateProduct)
	adminProducts.DELETE("/:id", h.AdminDeleteProduct)

	adminPlans := admin.Group("/plans")
	adminPlans.POST("", h.AdminCreatePlan)
	adminPlans.PUT("/:id", h.AdminUpdatePlan)
	adminPlans.DELETE("/:id", h.AdminDeletePlan)
}
