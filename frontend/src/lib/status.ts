import type { BadgeVariant } from '../types/models'

/**
 * Unified status → Badge variant mapping.
 * Replaces the 6+ duplicate `statusVariant` / `getStatusVariant` functions.
 */
export function getStatusVariant(status: string): BadgeVariant {
  switch (status) {
    // success states
    case 'active':
    case 'paid':
    case 'completed':
      return 'success'
    // warning states
    case 'pending':
    case 'pending_payment':
    case 'processing':
    case 'sent':
    case 'degraded':
    case 'running':
      return 'warning'
    // danger states
    case 'cancelled':
    case 'overdue':
    case 'failed':
    case 'suspended':
    case 'stopped':
    case 'down':
      return 'danger'
    // info states
    case 'provisioning':
      return 'info'
    // system health
    case 'healthy':
      return 'success'
    default:
      return 'default'
  }
}

/**
 * Format a currency amount with 2 decimal places.
 */
export function formatCurrency(amount: number): string {
  return amount.toFixed(2)
}

/**
 * Truncate a UUID to its first 8 characters for display.
 */
export function formatId(id: string): string {
  return id.substring(0, 8)
}
