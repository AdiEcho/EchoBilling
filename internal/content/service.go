package content

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Service struct {
	pool *pgxpool.Pool
}

func NewService(pool *pgxpool.Pool) *Service {
	return &Service{pool: pool}
}

// GetPageContent retrieves all sections for a page+locale combination.
func (s *Service) GetPageContent(ctx context.Context, pageKey, locale string) (map[string]string, error) {
	rows, err := s.pool.Query(ctx,
		`SELECT section_key, content
		 FROM site_contents
		 WHERE page_key = $1 AND locale = $2
		 ORDER BY section_key`,
		pageKey, locale,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	sections := make(map[string]string)
	for rows.Next() {
		var key, val string
		if err := rows.Scan(&key, &val); err != nil {
			return nil, err
		}
		sections[key] = val
	}

	return sections, rows.Err()
}

// UpsertPageContent inserts or updates sections for a page+locale, using UPSERT.
func (s *Service) UpsertPageContent(ctx context.Context, pageKey, locale, updatedBy string, sections map[string]string) error {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	for sectionKey, content := range sections {
		_, err := tx.Exec(ctx,
			`INSERT INTO site_contents (page_key, section_key, locale, content, updated_by)
			 VALUES ($1, $2, $3, $4, $5)
			 ON CONFLICT (page_key, section_key, locale) DO UPDATE SET
			   content = EXCLUDED.content,
			   updated_by = EXCLUDED.updated_by,
			   updated_at = NOW()`,
			pageKey, sectionKey, locale, content, updatedBy,
		)
		if err != nil {
			return err
		}
	}

	return tx.Commit(ctx)
}
