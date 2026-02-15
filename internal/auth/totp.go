package auth

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"io"

	"github.com/pquerna/otp/totp"
)

const (
	totpIssuer      = "EchoBilling"
	recoveryCodeLen = 8
	recoveryCodeNum = 10
)

// GenerateTOTPSecret 生成 TOTP 密钥和 otpauth URI
func GenerateTOTPSecret(email string) (secret string, uri string, err error) {
	key, err := totp.Generate(totp.GenerateOpts{
		Issuer:      totpIssuer,
		AccountName: email,
	})
	if err != nil {
		return "", "", fmt.Errorf("generate TOTP key: %w", err)
	}
	return key.Secret(), key.URL(), nil
}

// ValidateTOTPCode 验证 TOTP 码
func ValidateTOTPCode(secret, code string) bool {
	return totp.Validate(code, secret)
}

// GenerateRecoveryCodes 生成 N 个随机恢复码
func GenerateRecoveryCodes(count int) ([]string, error) {
	codes := make([]string, count)
	for i := 0; i < count; i++ {
		b := make([]byte, recoveryCodeLen)
		if _, err := io.ReadFull(rand.Reader, b); err != nil {
			return nil, fmt.Errorf("generate recovery code: %w", err)
		}
		codes[i] = hex.EncodeToString(b)
	}
	return codes, nil
}

// HashRecoveryCodes 对恢复码做 SHA-256 哈希
func HashRecoveryCodes(codes []string) []string {
	hashes := make([]string, len(codes))
	for i, code := range codes {
		h := sha256.Sum256([]byte(code))
		hashes[i] = hex.EncodeToString(h[:])
	}
	return hashes
}

// VerifyRecoveryCode 验证恢复码，返回匹配的索引（-1 表示无匹配）
func VerifyRecoveryCode(code string, hashes []string) int {
	h := sha256.Sum256([]byte(code))
	target := hex.EncodeToString(h[:])
	for i, hash := range hashes {
		if hash == target {
			return i
		}
	}
	return -1
}

// deriveAESKey 从 JWT secret 派生 AES-256 密钥
func deriveAESKey(jwtSecret string) []byte {
	h := sha256.Sum256([]byte(jwtSecret))
	return h[:]
}

// EncryptTOTPSecret 使用 AES-GCM 加密 TOTP 密钥
func EncryptTOTPSecret(plaintext, jwtSecret string) (string, error) {
	key := deriveAESKey(jwtSecret)
	block, err := aes.NewCipher(key)
	if err != nil {
		return "", fmt.Errorf("create cipher: %w", err)
	}

	aesGCM, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("create GCM: %w", err)
	}

	nonce := make([]byte, aesGCM.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", fmt.Errorf("generate nonce: %w", err)
	}

	ciphertext := aesGCM.Seal(nonce, nonce, []byte(plaintext), nil)
	return base64.StdEncoding.EncodeToString(ciphertext), nil
}

// DecryptTOTPSecret 使用 AES-GCM 解密 TOTP 密钥
func DecryptTOTPSecret(encoded, jwtSecret string) (string, error) {
	key := deriveAESKey(jwtSecret)
	data, err := base64.StdEncoding.DecodeString(encoded)
	if err != nil {
		return "", fmt.Errorf("decode base64: %w", err)
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return "", fmt.Errorf("create cipher: %w", err)
	}

	aesGCM, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("create GCM: %w", err)
	}

	nonceSize := aesGCM.NonceSize()
	if len(data) < nonceSize {
		return "", fmt.Errorf("ciphertext too short")
	}

	nonce, ciphertext := data[:nonceSize], data[nonceSize:]
	plaintext, err := aesGCM.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return "", fmt.Errorf("decrypt: %w", err)
	}

	return string(plaintext), nil
}
