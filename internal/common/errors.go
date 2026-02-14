package common

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// ServiceError 统一的业务错误类型
type ServiceError struct {
	StatusCode int
	Message    string
	Err        error
}

func (e *ServiceError) Error() string {
	return e.Message
}

// NewServiceError 创建业务错误
func NewServiceError(status int, message string, err error) *ServiceError {
	return &ServiceError{
		StatusCode: status,
		Message:    message,
		Err:        err,
	}
}

// WriteServiceError 将业务错误写入 HTTP 响应
func WriteServiceError(c *gin.Context, err *ServiceError) {
	if err == nil {
		return
	}
	c.JSON(err.StatusCode, gin.H{"error": err.Message})
}

// 常用错误快捷构造
func ErrBadRequest(message string, err error) *ServiceError {
	return NewServiceError(http.StatusBadRequest, message, err)
}

func ErrUnauthorized(message string, err error) *ServiceError {
	return NewServiceError(http.StatusUnauthorized, message, err)
}

func ErrNotFound(message string, err error) *ServiceError {
	return NewServiceError(http.StatusNotFound, message, err)
}

func ErrInternal(message string, err error) *ServiceError {
	return NewServiceError(http.StatusInternalServerError, message, err)
}
