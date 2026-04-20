// ---------------------------------------------------------------------------
// useActivityLabel — humanize activity-event action strings
// ---------------------------------------------------------------------------
//
// Maps the namespaced `action` key written by the dashboard's audit.ts helper
// into a short verb phrase rendered in the timeline. Falls back to the raw
// action on unknown keys — a new action in a future task should never crash
// the Activity page. Keep this map in sync with the retrofit wiring in
// apps/dashboard/server/api/admin/**.
// ---------------------------------------------------------------------------

const VERBS: Record<string, string> = {
  'product.created': 'created product',
  'product.updated': 'updated product',
  'product.deleted': 'deleted product',
  'order.fulfilled': 'fulfilled order',
  'order.refunded': 'refunded order',
  'customer.deleted': 'deleted customer',
  'category.created': 'created category',
  'category.updated': 'updated category',
  'category.deleted': 'deleted category',
  'settings.updated': 'updated store settings',
  'staff.created': 'added staff',
  'staff.updated': 'updated staff',
  'staff.deleted': 'removed staff',
  'staff.password_changed': 'changed password',
  'inventory.updated': 'adjusted inventory',
}

export function useActivityLabel() {
  function label(action: string): string {
    return VERBS[action] ?? action
  }
  return { label }
}
