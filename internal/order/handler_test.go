package order

import "testing"

func TestIsValidStatusTransition(t *testing.T) {
	t.Parallel()

	testCases := []struct {
		name string
		from string
		to   string
		want bool
	}{
		{name: "draft to pending_payment", from: "draft", to: "pending_payment", want: true},
		{name: "pending_payment to paid", from: "pending_payment", to: "paid", want: true},
		{name: "paid to provisioning", from: "paid", to: "provisioning", want: true},
		{name: "active to cancelled disallowed", from: "active", to: "cancelled", want: false},
		{name: "unknown status disallowed", from: "unknown", to: "paid", want: false},
	}

	for _, tc := range testCases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			got := isValidStatusTransition(tc.from, tc.to)
			if got != tc.want {
				t.Fatalf("isValidStatusTransition(%q, %q) = %v, want %v", tc.from, tc.to, got, tc.want)
			}
		})
	}
}

func TestMapAdminOrderStatus(t *testing.T) {
	t.Parallel()

	testCases := []struct {
		in   string
		want string
	}{
		{in: "draft", want: "pending"},
		{in: "pending_payment", want: "pending"},
		{in: "paid", want: "processing"},
		{in: "provisioning", want: "processing"},
		{in: "active", want: "completed"},
		{in: "cancelled", want: "cancelled"},
		{in: "refunded", want: "cancelled"},
		{in: "other", want: "other"},
	}

	for _, tc := range testCases {
		tc := tc
		t.Run(tc.in, func(t *testing.T) {
			t.Parallel()
			got := mapAdminOrderStatus(tc.in)
			if got != tc.want {
				t.Fatalf("mapAdminOrderStatus(%q) = %q, want %q", tc.in, got, tc.want)
			}
		})
	}
}
