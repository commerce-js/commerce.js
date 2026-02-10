// ---------------------------------------------------------------------------
// Salla → OrderStatus & OrderHistory mappers
// ---------------------------------------------------------------------------

import type { OrderStatusInfo, OrderHistoryEntry } from '@commercejs/types'
import type { SallaRawOrderStatus, SallaRawOrderHistory } from '../types.js'

/** Extract a date string from Salla's date object or ISO string */
function extractDate(date: string | { date: string; timezone_type: number; timezone: string } | undefined): string {
  if (!date) return new Date().toISOString()
  if (typeof date === 'string') return date
  return date.date
}

/** Map Salla raw order status → unified OrderStatusInfo */
export function mapSallaOrderStatus(raw: SallaRawOrderStatus): OrderStatusInfo {
  return {
    id: String(raw.id),
    name: raw.name,
    slug: raw.slug,
    type: raw.type,
    color: raw.color ?? null,
    icon: raw.icon ?? null,
    isActive: raw.is_active,
    parent: raw.parent
      ? { id: String(raw.parent.id), name: raw.parent.name }
      : null,
    children: (raw.children ?? []).map(mapSallaOrderStatus),
  }
}

/** Map Salla raw order history → unified OrderHistoryEntry */
export function mapSallaOrderHistory(raw: SallaRawOrderHistory, orderId: string): OrderHistoryEntry {
  return {
    id: String(raw.id),
    orderId,
    action: raw.action,
    note: raw.note ?? null,
    createdAt: extractDate(raw.created_at),
  }
}
