package billing

import "github.com/gin-gonic/gin"

func RegisterRoutes(portal *gin.RouterGroup, admin *gin.RouterGroup, h *Handler) {
	invoices := portal.Group("/invoices")
	{
		invoices.GET("", h.ListInvoices)
		invoices.GET("/:id", h.GetInvoice)
	}

	adminInvoices := admin.Group("/invoices")
	{
		adminInvoices.GET("", h.AdminListInvoices)
	}
}
