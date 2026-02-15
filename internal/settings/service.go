package settings

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Setting represents a single system_settings row.
type Setting struct {
	Key         string    `json:"key"`
	Value       string    `json:"value"`
	IsSecret    bool      `json:"is_secret"`
	Description string    `json:"description"`
	GroupName   string    `json:"group_name"`
	UpdatedBy   string    `json:"updated_by"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// Service provides CRUD operations for system_settings.
type Service struct {
	pool *pgxpool.Pool
}

// NewService creates a new settings Service.
func NewService(pool *pgxpool.Pool) *Service {
	return &Service{pool: pool}
}

// GetAll returns all settings, optionally filtered by group.
func (s *Service) GetAll(ctx context.Context, group string) ([]Setting, error) {
	var query string
	var args []interface{}

	if group != "" {
		query = `SELECT key, value, is_secret, description, group_name, updated_by, updated_at
				 FROM system_settings
				 WHERE group_name = $1
				 ORDER BY key`
		args = append(args, group)
	} else {
		query = `SELECT key, value, is_secret, description, group_name, updated_by, updated_at
				 FROM system_settings
				 ORDER BY group_name, key`
	}

	rows, err := s.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var settings []Setting
	for rows.Next() {
		var st Setting
		if err := rows.Scan(&st.Key, &st.Value, &st.IsSecret, &st.Description, &st.GroupName, &st.UpdatedBy, &st.UpdatedAt); err != nil {
			return nil, err
		}
		settings = append(settings, st)
	}
	return settings, rows.Err()
}

// UpdateBatch updates multiple settings in a single transaction.
func (s *Service) UpdateBatch(ctx context.Context, updates map[string]string, updatedBy string) error {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	for key, value := range updates {
		_, err := tx.Exec(ctx,
			`UPDATE system_settings
			 SET value = $1, updated_by = $2, updated_at = NOW()
			 WHERE key = $3`,
			value, updatedBy, key,
		)
		if err != nil {
			return err
		}
	}

	return tx.Commit(ctx)
}
