import { useState, readonly, computed } from '#imports'
import type { Ref } from 'vue'
import type { Review, ReviewInput, ReviewSummary, PaginatedResult, PaginationParams } from '@commercejs/types'
import { CommerceError, isCommerceError } from '@commercejs/types'
import { createEventHook } from '@vueuse/core'
import { useAdapter } from './useAdapter'

/**
 * Product reviews composable.
 * Fetches reviews and summary for a product, and allows submitting new reviews.
 */
export function useReviews(productId: string) {
  const adapter = useAdapter()

  // ---- State ----
  const reviews = useState<PaginatedResult<Review> | null>(`commerce:reviews:${productId}`, () => null)
  const summary = useState<ReviewSummary | null>(`commerce:reviews:summary:${productId}`, () => null)
  const loading = useState<boolean>(`commerce:reviews:loading:${productId}`, () => false)
  const error = useState<CommerceError | null>(`commerce:reviews:error:${productId}`, () => null)

  // ---- Event hooks ----
  const reviewSubmittedHook = createEventHook<Review>()
  const errorHook = createEventHook<CommerceError>()

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
    errorHook.trigger(e)
    return e
  }

  // ---- Methods ----

  /** Fetch paginated reviews for the product */
  async function fetchReviews(params?: PaginationParams) {
    loading.value = true
    error.value = null
    try {
      reviews.value = await adapter.getProductReviews(productId, params)
    } catch (err) {
      handleError(err)
    } finally {
      loading.value = false
    }
  }

  /** Fetch review summary (average rating, distribution) */
  async function fetchSummary() {
    loading.value = true
    error.value = null
    try {
      summary.value = await adapter.getReviewSummary(productId)
    } catch (err) {
      handleError(err)
    } finally {
      loading.value = false
    }
  }

  /** Submit a new review */
  async function submit(input: Omit<ReviewInput, 'productId'>) {
    loading.value = true
    error.value = null
    try {
      const review = await adapter.submitReview({ ...input, productId })
      reviewSubmittedHook.trigger(review)
      // Refresh both reviews and summary after submission
      await Promise.all([fetchReviews(), fetchSummary()])
      return review
    } catch (err) {
      throw handleError(err)
    } finally {
      loading.value = false
    }
  }

  return {
    // State (readonly)
    reviews: readonly(reviews) as Readonly<Ref<PaginatedResult<Review> | null>>,
    summary: readonly(summary) as Readonly<Ref<ReviewSummary | null>>,
    loading: readonly(loading),
    error: readonly(error),

    // Derived
    averageRating: computed(() => summary.value?.averageRating ?? 0),
    totalReviews: computed(() => summary.value?.totalCount ?? 0),

    // Methods
    fetchReviews,
    fetchSummary,
    submit,

    // Lifecycle hooks
    onReviewSubmitted: reviewSubmittedHook.on,
    onError: errorHook.on,
  }
}
