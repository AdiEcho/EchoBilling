package payment

import (
	"testing"
	"time"

	"github.com/adiecho/echobilling/internal/common"
)

func TestDecimalAndCentsConversions(t *testing.T) {
	t.Parallel()

	cents, err := common.DecimalAmountToCents("10.99")
	if err != nil {
		t.Fatalf("DecimalAmountToCents returned error: %v", err)
	}
	if cents != 1099 {
		t.Fatalf("DecimalAmountToCents = %d, want 1099", cents)
	}

	amount := common.CentsToDecimal(1099)
	if amount != "10.99" {
		t.Fatalf("CentsToDecimal = %s, want 10.99", amount)
	}
}

func TestRefundAndDisputeStatusMapping(t *testing.T) {
	t.Parallel()

	if got := common.MapRefundStatus("succeeded"); got != "succeeded" {
		t.Fatalf("MapRefundStatus(succeeded) = %s", got)
	}
	if got := common.MapRefundStatus("failed"); got != "failed" {
		t.Fatalf("MapRefundStatus(failed) = %s", got)
	}
	if got := common.MapRefundStatus("random"); got != "pending" {
		t.Fatalf("MapRefundStatus(random) = %s", got)
	}

	if got := mapDisputeStatus("won"); got != "won" {
		t.Fatalf("mapDisputeStatus(won) = %s", got)
	}
	if got := mapDisputeStatus("under_review"); got != "under_review" {
		t.Fatalf("mapDisputeStatus(under_review) = %s", got)
	}
	if got := mapDisputeStatus("random"); got != "needs_response" {
		t.Fatalf("mapDisputeStatus(random) = %s", got)
	}
}

func TestCalculateExpiryDate(t *testing.T) {
	t.Parallel()

	base := time.Date(2026, 2, 14, 0, 0, 0, 0, time.UTC)

	if got := calculateExpiryDate("monthly", base); !got.Equal(base.AddDate(0, 1, 0)) {
		t.Fatalf("monthly expiry mismatch: %s", got)
	}
	if got := calculateExpiryDate("quarterly", base); !got.Equal(base.AddDate(0, 3, 0)) {
		t.Fatalf("quarterly expiry mismatch: %s", got)
	}
	if got := calculateExpiryDate("annually", base); !got.Equal(base.AddDate(1, 0, 0)) {
		t.Fatalf("annual expiry mismatch: %s", got)
	}
}
