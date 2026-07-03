// ---------------------------------------------------------------------------
// Merchant serialization — keep secrets server-side
// ---------------------------------------------------------------------------
// Merchant rows carry two fields that must NEVER reach a browser:
//   - databaseUrl  — a live Postgres connection string (with credentials)
//   - passwordHash — the merchant's control-DB credential hash
// The control plane (tenant resolver, provisioner) reads full rows directly
// from Prisma; anything that becomes an HTTP response goes through here.

/** Prisma select of merchant fields safe to send to the dashboard client. */
export const PUBLIC_MERCHANT_SELECT = {
  id: true,
  name: true,
  email: true,
  subdomain: true,
  plan: true,
  status: true,
  provisionError: true,
  dashboardRole: true,
  provisionedBy: true,
  tapCustomerId: true,
  currency: true,
  locale: true,
  customDomain: true,
  neonProjectId: true,
  neonBranchId: true,
  trialEndsAt: true,
  createdAt: true,
  updatedAt: true,
} as const

/** Strip secrets from an already-fetched full merchant row. */
export function toPublicMerchant<T extends Record<string, unknown>>(
  merchant: T,
): Omit<T, 'databaseUrl' | 'passwordHash'> {
  const { databaseUrl: _databaseUrl, passwordHash: _passwordHash, ...safe } = merchant as T & {
    databaseUrl?: unknown
    passwordHash?: unknown
  }
  return safe
}
