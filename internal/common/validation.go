package common

import "regexp"

var emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)

// ValidateEmail 验证邮箱格式
func ValidateEmail(email string) bool {
	return emailRegex.MatchString(email)
}
