// ---------------------------------------------------------------------------
// Server utility — create a TapPaymentProvider per merchant
// ---------------------------------------------------------------------------
// In multi-merchant mode, each merchant has their own Tap credentials.
// This factory looks up merchant config and returns a provider + public key.
//
// Falls back to env-level keys when no merchantId is provided (dev/testing).
// ---------------------------------------------------------------------------

import { TapPaymentProvider } from '@commercejs/payment-tap'
import { getMerchantConfig } from './merchant-store'

/** Cached providers keyed by merchantId */
const providerCache = new Map<string, TapPaymentProvider>()

export interface TapProviderResult {
  provider: TapPaymentProvider
  publicKey: string
}

/**
 * Get or create a TapPaymentProvider for a specific merchant.
 *
 * Looks up the merchant's credentials from the merchant store.
 * Caches providers per-merchant to avoid re-creation on every request.
 */
export async function useTapProviderForMerchant(merchantId: string): Promise<TapProviderResult> {
  const config = await getMerchantConfig(merchantId)

  let provider = providerCache.get(merchantId)
  if (!provider) {
    provider = new TapPaymentProvider({
      secretKey: config.tapSecretKey,
      webhookSecret: undefined, // per-merchant webhook secrets can be added later
    })
    providerCache.set(merchantId, provider)
  }

  return {
    provider,
    publicKey: config.tapPublicKey,
  }
}

/**
 * Fallback: get a TapPaymentProvider using env-level keys.
 * Used when no merchantId is provided (dev/testing mode).
 */
export function useTapProviderFromEnv(): TapProviderResult {
  const runtimeConfig = useRuntimeConfig()

  if (!runtimeConfig.tapSecretKey) {
    throw new Error('TAP_SECRET_KEY is not configured and no merchantId was provided')
  }

  const provider = new TapPaymentProvider({
    secretKey: runtimeConfig.tapSecretKey,
    webhookSecret: runtimeConfig.tapWebhookSecret || undefined,
  })

  return {
    provider,
    publicKey: runtimeConfig.public.tapPublicKey || '',
  }
}

/**
 * Invalidate cached provider for a merchant (call after key rotation).
 */
export function invalidateMerchantProvider(merchantId: string): void {
  providerCache.delete(merchantId)
}
