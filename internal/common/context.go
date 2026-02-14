package common

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// GetUserID safely extracts the user ID from the Gin context.
// Returns an empty string and sends a 401 response if not found or wrong type.
func GetUserID(c *gin.Context) (string, bool) {
	v, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return "", false
	}
	userID, ok := v.(string)
	if !ok || userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user identity"})
		return "", false
	}
	return userID, true
}

// GetUserRole safely extracts the user role from the Gin context.
func GetUserRole(c *gin.Context) (string, bool) {
	v, exists := c.Get("user_role")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User role not found"})
		return "", false
	}
	role, ok := v.(string)
	if !ok || role == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user role"})
		return "", false
	}
	return role, true
}
