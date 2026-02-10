// ---------------------------------------------------------------------------
// Order status & history types — rich metadata for display & tracking
// ---------------------------------------------------------------------------

import type { Maybe } from './common.js'

/**
 * Rich order status metadata — for displaying statuses on order tracking pages.
 *
 * Distinct from the `OrderStatus` string union (used for `Order.status`),
 * this captures platform-specific display data like colors, icons, and
 * custom sub-statuses.
 */
export interface OrderStatusInfo {
  id: string
  name: string
  slug: string
  /** Whether this is a built-in or merchant-created status */
  type: 'original' | 'custom'
  /** Hex color for status badge display */
  color: Maybe<string>
  /** Icon identifier (platform-specific) */
  icon: Maybe<string>
  /** Whether this status is active in the store's workflow */
  isActive: boolean
  /** Parent status (for custom sub-statuses under an original status) */
  parent: Maybe<{ id: string; name: string }>
  /** Child sub-statuses (custom statuses grouped under this status) */
  children: OrderStatusInfo[]
}

/**
 * A single entry in an order's status change timeline.
 *
 * Used for order tracking — shows the history of status changes,
 * notes, and actions taken on an order.
 */
export interface OrderHistoryEntry {
  id: string
  orderId: string
  /** The action/status change that occurred */
  action: string
  /** Optional note from merchant or system */
  note: Maybe<string>
  createdAt: string
}

/**
 * Input for updating an order's status.
 */
export interface UpdateOrderStatusInput {
  /** Status slug (e.g., 'canceled', 'in_progress') or custom status ID */
  status: string
  /** Optional note to attach to the status change */
  note?: string
  /** Whether to restore stock for canceled/returned items */
  restoreItems?: boolean
}
