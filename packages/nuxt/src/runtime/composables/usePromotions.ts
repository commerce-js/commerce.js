import { useState, readonly } from '#imports'
import type { Ref } from 'vue'
import type { Promotion, Coupon } from '@commercejs/types'
import { CommerceError, isCommerceError } from '@commercejs/types'
import { useAdapter } from './useAdapter'

/**
 * Promotions composable.
 * Fetches active promotions and validates coupon codes.
 */
export function usePromotions() {
  const adapter = useAdapter()

  const promotions = useState<Promotion[]>('commerce:promotions', () => [])
  const loading = useState<boolean>('commerce:promotions:loading', () => false)
  const error = useState<CommerceError | null>('commerce:promotions:error', () => null)

  function handleError(err: unknown): CommerceError {
    const e = isCommerceError(err)
      ? err
      : new CommerceError(
          err instanceof Error ? err.message : String(err),
          'UNKNOWN',
          undefined,
          err,
        )
    error.value = e
    return e
  }

  /** Fetch all currently active promotions */
  async function fetchPromotions() {
    loading.value = true
    error.value = null
    try {
      promotions.value = await adapter.getActivePromotions()
    } catch (err) {
      handleError(err)
    } finally {
      loading.value = false
    }
  }

  /** Validate a coupon code before applying to cart */
  async function validateCoupon(code: string): Promise<Coupon> {
    loading.value = true
    error.value = null
    try {
      return await adapter.validateCoupon(code)
    } catch (err) {
      throw handleError(err)
    } finally {
      loading.value = false
    }
  }

  return {
    promotions: readonly(promotions) as Readonly<Ref<Promotion[]>>,
    loading: readonly(loading),
    error: readonly(error),
    fetchPromotions,
    validateCoupon,
  }
}
