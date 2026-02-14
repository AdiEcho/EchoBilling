package admin

import (
	"github.com/adiecho/echobilling/internal/app/middleware"
	"github.com/gin-gonic/gin"
)

// AdminMiddleware 提供管理后台模块独立的管理员中间件入口。
func AdminMiddleware() gin.HandlerFunc {
	return middleware.AdminRequired()
}
