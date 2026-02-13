package auth

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"fmt"
	"strings"

	"golang.org/x/crypto/argon2"
)

const (
	// Argon2id 参数
	memory      = 64 * 1024 // 64 MB
	iterations  = 3
	parallelism = 2
	saltLength  = 16
	keyLength   = 32
)

// HashPassword 使用 Argon2id 对密码进行哈希
func HashPassword(password string) (string, error) {
	// 生成随机盐
	salt := make([]byte, saltLength)
	if _, err := rand.Read(salt); err != nil {
		return "", fmt.Errorf("failed to generate salt: %w", err)
	}

	// 使用 Argon2id 生成哈希
	hash := argon2.IDKey([]byte(password), salt, iterations, memory, parallelism, keyLength)

	// 编码为 base64
	b64Salt := base64.RawStdEncoding.EncodeToString(salt)
	b64Hash := base64.RawStdEncoding.EncodeToString(hash)

	// 格式: $argon2id$v=19$m=65536,t=3,p=2$<salt>$<hash>
	encodedHash := fmt.Sprintf("$argon2id$v=%d$m=%d,t=%d,p=%d$%s$%s",
		argon2.Version, memory, iterations, parallelism, b64Salt, b64Hash)

	return encodedHash, nil
}

// VerifyPassword 验证密码是否匹配 Argon2id 哈希
func VerifyPassword(password, encodedHash string) (bool, error) {
	// 解析编码的哈希
	parts := strings.Split(encodedHash, "$")
	if len(parts) != 6 {
		return false, fmt.Errorf("invalid hash format")
	}

	if parts[1] != "argon2id" {
		return false, fmt.Errorf("unsupported hash algorithm")
	}

	// 解析参数
	var version int
	var m, t, p uint32
	_, err := fmt.Sscanf(parts[2], "v=%d", &version)
	if err != nil {
		return false, fmt.Errorf("failed to parse version: %w", err)
	}

	_, err = fmt.Sscanf(parts[3], "m=%d,t=%d,p=%d", &m, &t, &p)
	if err != nil {
		return false, fmt.Errorf("failed to parse parameters: %w", err)
	}

	// 解码盐和哈希
	salt, err := base64.RawStdEncoding.DecodeString(parts[4])
	if err != nil {
		return false, fmt.Errorf("failed to decode salt: %w", err)
	}

	hash, err := base64.RawStdEncoding.DecodeString(parts[5])
	if err != nil {
		return false, fmt.Errorf("failed to decode hash: %w", err)
	}

	// 使用相同参数计算新哈希
	newHash := argon2.IDKey([]byte(password), salt, t, m, uint8(p), uint32(len(hash)))

	// 使用恒定时间比较防止时序攻击
	if subtle.ConstantTimeCompare(hash, newHash) == 1 {
		return true, nil
	}

	return false, nil
}
