// ---------------------------------------------------------------------------
// Plan limits — shared quotas (importable by routes AND middleware)
// ---------------------------------------------------------------------------
// Lives in utils/ (not the plan-limits middleware) so route handlers can
// import it without pulling a middleware module into their bundle.

/** Per-plan API-key allowance (enterprise = effectively unlimited). */
export const KEY_LIMITS: Record<string, number> = {
  trial: 1,
  starter: 2,
  pro: 5,
  business: 20,
  enterprise: 100,
}

/** Per-plan product cap. `null` = unlimited. Enforced at the product mutation site. */
export const PRODUCT_LIMITS: Record<string, number | null> = {
  trial: 10,
  starter: 100,
  pro: null,
  business: null,
  enterprise: null,
}
