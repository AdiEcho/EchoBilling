package app

import (
	"context"
	"log"
	"strconv"
	"sync"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// SMTPSettings holds a snapshot of the SMTP configuration.
type SMTPSettings struct {
	Host     string
	Port     string
	Username string
	Password string
	From     string
}

// SettingsStore is a concurrency-safe, in-process cache of system_settings.
// Consumers hold a *SettingsStore reference and call getter methods to read
// the latest values. After an admin saves new settings, call Reload() to
// refresh the in-memory map from the database.
type SettingsStore struct {
	pool        *pgxpool.Pool
	envDefaults map[string]string

	mu   sync.RWMutex
	data map[string]string
}

// NewSettingsStore creates a new SettingsStore. envDefaults provides
// fallback values (typically derived from environment variables) that are
// used when the corresponding database value is empty.
func NewSettingsStore(pool *pgxpool.Pool, envDefaults map[string]string) *SettingsStore {
	return &SettingsStore{
		pool:        pool,
		envDefaults: envDefaults,
		data:        make(map[string]string),
	}
}

// Load reads all settings from the database into memory. It should be called
// once during application startup.
func (s *SettingsStore) Load(ctx context.Context) error {
	return s.Reload(ctx)
}

// Reload re-reads all settings from the database, replacing the in-memory
// snapshot atomically.
func (s *SettingsStore) Reload(ctx context.Context) error {
	rows, err := s.pool.Query(ctx, `SELECT key, value FROM system_settings`)
	if err != nil {
		return err
	}
	defer rows.Close()

	fresh := make(map[string]string, len(s.envDefaults))
	for rows.Next() {
		var k, v string
		if err := rows.Scan(&k, &v); err != nil {
			return err
		}
		fresh[k] = v
	}
	if err := rows.Err(); err != nil {
		return err
	}

	s.mu.Lock()
	s.data = fresh
	s.mu.Unlock()

	return nil
}

// Get returns the value for key. If the DB value is empty, it falls back to
// the environment default.
func (s *SettingsStore) Get(key string) string {
	s.mu.RLock()
	v := s.data[key]
	s.mu.RUnlock()
	if v != "" {
		return v
	}
	return s.envDefaults[key]
}

// GetInt returns the integer value for key, or defaultVal if empty / unparsable.
func (s *SettingsStore) GetInt(key string, defaultVal int) int {
	raw := s.Get(key)
	if raw == "" {
		return defaultVal
	}
	n, err := strconv.Atoi(raw)
	if err != nil {
		return defaultVal
	}
	return n
}

// GetDuration returns the duration for key (interpreted as seconds), or
// defaultVal if empty / unparsable.
func (s *SettingsStore) GetDuration(key string, defaultVal time.Duration) time.Duration {
	raw := s.Get(key)
	if raw == "" {
		return defaultVal
	}
	n, err := strconv.Atoi(raw)
	if err != nil {
		return defaultVal
	}
	return time.Duration(n) * time.Second
}

// SMTPConfig returns a snapshot of the current SMTP settings, or nil if the
// host is not configured.
func (s *SettingsStore) SMTPConfig() *SMTPSettings {
	host := s.Get("smtp_host")
	if host == "" {
		return nil
	}
	return &SMTPSettings{
		Host:     host,
		Port:     s.Get("smtp_port"),
		Username: s.Get("smtp_username"),
		Password: s.Get("smtp_password"),
		From:     s.Get("smtp_from"),
	}
}

// StripeSecretKey returns the current Stripe secret key.
func (s *SettingsStore) StripeSecretKey() string {
	return s.Get("stripe_secret_key")
}

// StripeWebhookSecret returns the current Stripe webhook signing secret.
func (s *SettingsStore) StripeWebhookSecret() string {
	return s.Get("stripe_webhook_secret")
}

// StartPeriodicReload launches a background goroutine that calls Reload
// every interval. It stops when ctx is cancelled.
func (s *SettingsStore) StartPeriodicReload(ctx context.Context, interval time.Duration) {
	go func() {
		ticker := time.NewTicker(interval)
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				if err := s.Reload(ctx); err != nil {
					log.Printf("[settings] periodic reload failed: %v", err)
				}
			}
		}
	}()
}

// BuildEnvDefaults creates a key→value map of environment-sourced defaults
// that correspond to the system_settings keys. This allows the SettingsStore
// to fall back to env vars when a DB value is empty.
func BuildEnvDefaults(cfg *Config) map[string]string {
	return map[string]string{
		"smtp_host":                 cfg.SMTPHost,
		"smtp_port":                 cfg.SMTPPort,
		"smtp_username":             cfg.SMTPUsername,
		"smtp_password":             cfg.SMTPPassword,
		"smtp_from":                 cfg.SMTPFrom,
		"stripe_secret_key":         cfg.StripeSecretKey,
		"stripe_webhook_secret":     cfg.StripeWebhookSecret,
		"stripe_publishable_key":    cfg.StripePublishableKey,
		"renewal_webhook_url":       cfg.RenewalWebhookURL,
		"renewal_webhook_token":     cfg.RenewalWebhookToken,
		"notification_timeout_secs": strconv.Itoa(int(cfg.NotificationTimeout.Seconds())),
	}
}
