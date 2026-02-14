package common

import (
	"fmt"
	"strconv"
	"strings"
)

// DecimalAmountToCents 将十进制金额字符串转换为分（整数），避免浮点精度问题
func DecimalAmountToCents(value string) (int64, error) {
	normalized := strings.TrimSpace(value)
	if normalized == "" {
		return 0, fmt.Errorf("empty amount")
	}

	// 使用整数运算避免浮点精度问题
	parts := strings.SplitN(normalized, ".", 2)
	intPart, err := strconv.ParseInt(parts[0], 10, 64)
	if err != nil {
		return 0, fmt.Errorf("invalid integer part: %w", err)
	}

	cents := intPart * 100
	if len(parts) == 2 {
		fracStr := parts[1]
		// 只取前两位小数
		switch len(fracStr) {
		case 0:
			// nothing
		case 1:
			frac, err := strconv.ParseInt(fracStr, 10, 64)
			if err != nil {
				return 0, fmt.Errorf("invalid fractional part: %w", err)
			}
			cents += frac * 10
		default:
			frac, err := strconv.ParseInt(fracStr[:2], 10, 64)
			if err != nil {
				return 0, fmt.Errorf("invalid fractional part: %w", err)
			}
			cents += frac
			// 四舍五入第三位
			if len(fracStr) > 2 && fracStr[2] >= '5' {
				cents++
			}
		}
	}

	if strings.HasPrefix(normalized, "-") {
		// intPart 已经是负数，cents 已经是负的
		// 但小数部分需要减去而非加上
		// 重新计算
		absCents := (-intPart) * 100
		if len(parts) == 2 {
			fracStr := parts[1]
			switch len(fracStr) {
			case 0:
			case 1:
				frac, _ := strconv.ParseInt(fracStr, 10, 64)
				absCents += frac * 10
			default:
				frac, _ := strconv.ParseInt(fracStr[:2], 10, 64)
				absCents += frac
				if len(fracStr) > 2 && fracStr[2] >= '5' {
					absCents++
				}
			}
		}
		return -absCents, nil
	}

	return cents, nil
}

// CentsToDecimal 将分转换为十进制金额字符串
func CentsToDecimal(cents int64) string {
	return strconv.FormatFloat(float64(cents)/100.0, 'f', 2, 64)
}

// NormalizeAmount 标准化金额字符串为两位小数
func NormalizeAmount(amount string) string {
	parsed, err := strconv.ParseFloat(amount, 64)
	if err != nil {
		return amount
	}
	return strconv.FormatFloat(parsed, 'f', 2, 64)
}

// MapRefundStatus 映射 Stripe 退款状态
func MapRefundStatus(stripeStatus string) string {
	switch stripeStatus {
	case "succeeded":
		return "succeeded"
	case "failed", "canceled":
		return "failed"
	default:
		return "pending"
	}
}
