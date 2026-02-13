package payment

import "github.com/gin-gonic/gin"

func RegisterRoutes(public *gin.RouterGroup, webhook *gin.RouterGroup, h *Handler) {
	public.POST("/checkout/session", h.CreateCheckoutSession)
	webhook.POST("/stripe", h.HandleWebhook)
}
