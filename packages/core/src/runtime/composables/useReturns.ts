import { useState, readonly } from '#imports'
import type { Ref } from 'vue'
import type { ReturnRequest, CreateReturnInput, PaginationParams, PaginatedResult } from '@commercejs/types'
import { CommerceError, isCommerceError } from '@commercejs/types'
import { createEventHook } from '@vueuse/core'
import { useAdapter } from './useAdapter'

/**
 * Returns composable.
 * Manages return requests for customer orders.
 */
export function useReturns() {
  const adapter = useAdapter()

  // ---- State ----
  const returns = useState<PaginatedResult<ReturnRequest> | null>('commerce:returns', () => null)
  const loading = useState<boolean>('commerce:returns:loading', () => false)
  const error = useState<CommerceError | null>('commerce:returns:error', () => null)

  // ---- Event hooks ----
  const returnCreatedHook = createEventHook<ReturnRequest>()
  const returnCancelledHook = createEventHook<ReturnRequest>()
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

  /** Fetch paginated list of return requests */
  async function fetchReturns(params?: PaginationParams) {
    loading.value = true
    error.value = null
    try {
      returns.value = await adapter.getReturns(params)
    } catch (err) {
      handleError(err)
    } finally {
      loading.value = false
    }
  }

  /** Get a single return request by ID */
  async function getReturn(returnId: string): Promise<ReturnRequest> {
    loading.value = true
    error.value = null
    try {
      return await adapter.getReturn(returnId)
    } catch (err) {
      throw handleError(err)
    } finally {
      loading.value = false
    }
  }

  /** Create a return request */
  async function createReturn(input: CreateReturnInput): Promise<ReturnRequest> {
    loading.value = true
    error.value = null
    try {
      const returnReq = await adapter.createReturn(input)
      returnCreatedHook.trigger(returnReq)
      // Refresh list after creation
      await fetchReturns()
      return returnReq
    } catch (err) {
      throw handleError(err)
    } finally {
      loading.value = false
    }
  }

  /** Cancel a return request */
  async function cancelReturn(returnId: string): Promise<ReturnRequest> {
    loading.value = true
    error.value = null
    try {
      const returnReq = await adapter.cancelReturn(returnId)
      returnCancelledHook.trigger(returnReq)
      await fetchReturns()
      return returnReq
    } catch (err) {
      throw handleError(err)
    } finally {
      loading.value = false
    }
  }

  return {
    // State (readonly)
    returns: readonly(returns) as Readonly<Ref<PaginatedResult<ReturnRequest> | null>>,
    loading: readonly(loading),
    error: readonly(error),

    // Methods
    fetchReturns,
    getReturn,
    createReturn,
    cancelReturn,

    // Lifecycle hooks
    onReturnCreated: returnCreatedHook.on,
    onReturnCancelled: returnCancelledHook.on,
    onError: errorHook.on,
  }
}
