// ---------------------------------------------------------------------------
// Plan-limits middleware — enforces trial + plan-tier gating
// ---------------------------------------------------------------------------
//
// Runs AFTER the tenant middleware (h3 middleware executes in filesystem
// order; `plan-limits.ts` sorts after `tenant.ts`). Skips any request where
// no merchant was attached — either because the tenant middleware skipped
// it (admin / control-DB routes) or because the user is on a trial-expired
// storefront that's already been 402'd by the tenant middleware.
//
// Trial / suspended statuses are already rejected by the tenant middleware
// before this layer runs; this middleware only deals with limits that apply
// to *active* merchants:
//
//   - Trial end date — 402 Payment Required once past.
//   - Plan-tier write caps — 429 when a tier cap would be breached by the
//     next mutation. (Actual counting is stubbed for Step 4 — Step 7 wires
//     it to admin.catalog.countProducts and friends.)
// ---------------------------------------------------------------------------

// defineEventHandler / createError / getMethod / getRequestURL are Nitro auto-imports.
import type { H3Event } from 'h3'

type PlanTier = 'trial' | 'starter' | 'pro' | 'enterprise'

/** Per-tier feature caps — enforced by comparing against live counts. */
export const PLAN_LIMITS: Record<PlanTier, { products: number, staff: number, customDomains: number }> = {
  trial: { products: 25, staff: 1, customDomains: 0 },
  starter: { products: 500, staff: 3, customDomains: 1 },
  pro: { products: 10_000, staff: 10, customDomains: 10 },
  enterprise: { products: Number.POSITIVE_INFINITY, staff: Number.POSITIVE_INFINITY, customDomains: Number.POSITIVE_INFINITY },
}

function normalizePlan(plan: string): PlanTier {
  return (plan in PLAN_LIMITS ? plan : 'trial') as PlanTier
}

const WRITE_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE'])

export default defineEventHandler(async (event) => {
  const merchant = event.context.merchant
  if (!merchant) return // Non-tenant route (tenant middleware skipped it)

  // 1. Trial expiry
  if (merchant.plan === 'trial' && merchant.trialEndsAt && merchant.trialEndsAt <= new Date()) {
    throw createError({
      statusCode: 402,
      statusMessage: 'Trial expired',
      message: 'Your trial has ended. Upgrade your plan to continue.',
    })
  }

  // 2. Writes are gated by plan-tier caps; reads always pass here.
  if (!WRITE_METHODS.has(getMethod(event))) return

  const path = getRequestURL(event).pathname
  const plan = normalizePlan(merchant.plan)
  const limits = PLAN_LIMITS[plan]

  // Product cap — applied to admin product-create endpoints. Actual live
  // count is wired in Step 7 via `event.context.admin.catalog.countProducts`;
  // for now the check is a no-op past the tier lookup so the plumbing is
  // live and the Step 7 change is a one-line swap.
  if (limits.products !== Number.POSITIVE_INFINITY && isProductCreate(path, event)) {
    // const count = await event.context.admin.catalog.countProducts()
    // if (count >= limits.products) {
    //   throw createError({
    //     statusCode: 429,
    //     statusMessage: 'Plan limit reached',
    //     message: `Your ${plan} plan allows up to ${limits.products} products. Upgrade to add more.`,
    //   })
    // }
  }
})

function isProductCreate(path: string, event: H3Event): boolean {
  // Placeholder for the Step 7 admin product routes; currently nothing
  // matches, so this always returns false.
  return getMethod(event) === 'POST' && /^\/api\/admin\/products\/?$/.test(path)
}
