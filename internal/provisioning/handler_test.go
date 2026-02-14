package provisioning

import (
	"testing"
	"time"
)

func TestIsReminderDay(t *testing.T) {
	t.Parallel()

	if !isReminderDay(7) || !isReminderDay(3) || !isReminderDay(1) {
		t.Fatalf("expected reminder days 7/3/1 to be true")
	}
	if isReminderDay(2) || isReminderDay(0) {
		t.Fatalf("unexpected reminder day accepted")
	}
}

func TestDaysUntil(t *testing.T) {
	t.Parallel()

	now := time.Date(2026, 2, 14, 10, 0, 0, 0, time.UTC)
	if got := daysUntil(now.Add(2*time.Hour), now); got != 1 {
		t.Fatalf("daysUntil(2h) = %d, want 1", got)
	}
	if got := daysUntil(now.Add(49*time.Hour), now); got != 3 {
		t.Fatalf("daysUntil(49h) = %d, want 3", got)
	}
	if got := daysUntil(now.Add(-1*time.Hour), now); got != 0 {
		t.Fatalf("daysUntil(-1h) = %d, want 0", got)
	}
}
