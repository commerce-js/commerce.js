// ---------------------------------------------------------------------------
// Merchant payment configuration store
// ---------------------------------------------------------------------------
// Stores merchant Tap credentials. In-memory for MVP, swap to Redis/Postgres
// or integrate with Medusa merchant modules in production.
// ---------------------------------------------------------------------------

export interface MerchantPaymentConfig {
  merchantId: string
  /** Tap secret key (sk_live_* or sk_test_*) — encrypted at rest in production */
  tapSecretKey: string
  /** Tap publishable key (pk_live_* or pk_test_*) — safe to expose to client */
  tapPublicKey: string
  /** Tap's own merchant/destination ID (from Connect onboarding) */
  tapMerchantId?: string
  /** How the merchant was onboarded */
  onboardingMethod: 'tap_connect' | 'direct'
  /** Whether the merchant's credentials are active */
  status: 'active' | 'pending' | 'revoked'
  createdAt: string
  updatedAt: string
}

// ---------------------------------------------------------------------------
// In-memory store (replace with database in production)
// ---------------------------------------------------------------------------

const merchants = new Map<string, MerchantPaymentConfig>()

/**
 * Get a merchant's payment configuration.
 * Throws if the merchant is not found or not active.
 */
export async function getMerchantConfig(merchantId: string): Promise<MerchantPaymentConfig> {
  const config = merchants.get(merchantId)
  if (!config) {
    throw new Error(`Merchant "${merchantId}" not found. Complete payment setup first.`)
  }
  if (config.status !== 'active') {
    throw new Error(`Merchant "${merchantId}" payment config is ${config.status}.`)
  }
  return config
}

/**
 * Save or update a merchant's payment configuration.
 */
export async function saveMerchantConfig(
  config: Omit<MerchantPaymentConfig, 'createdAt' | 'updatedAt'>,
): Promise<MerchantPaymentConfig> {
  const existing = merchants.get(config.merchantId)
  const now = new Date().toISOString()

  const full: MerchantPaymentConfig = {
    ...config,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }

  merchants.set(config.merchantId, full)
  return full
}

/**
 * Check if a merchant has active payment configuration.
 */
export async function hasMerchantConfig(merchantId: string): Promise<boolean> {
  const config = merchants.get(merchantId)
  return !!config && config.status === 'active'
}

/**
 * Delete a merchant's payment configuration (for testing / revocation).
 */
export async function deleteMerchantConfig(merchantId: string): Promise<void> {
  merchants.delete(merchantId)
}
