import { useState, readonly } from '#imports'
import type { DeepReadonly, Ref } from 'vue'
import type { Wishlist } from '@commercejs/types'
import { CommerceError, isCommerceError } from '@commercejs/types'
import { createEventHook } from '@vueuse/core'
import { useAdapter } from './useAdapter'

/**
 * Stateful wishlist composable.
 * Manages the authenticated customer's wishlist (favorites).
 */
export function useWishlist() {
  const adapter = useAdapter()

  // ---- State ----
  const wishlist = useState<Wishlist | null>('commerce:wishlist', () => null)
  const loading = useState<boolean>('commerce:wishlist:loading', () => false)
  const error = useState<CommerceError | null>('commerce:wishlist:error', () => null)

  // ---- Event hooks ----
  const itemAddedHook = createEventHook<Wishlist>()
  const itemRemovedHook = createEventHook<Wishlist>()
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

  /** Fetch the current wishlist */
  async function refresh() {
    loading.value = true
    error.value = null
    try {
      wishlist.value = await adapter.getWishlist()
    } catch (err) {
      handleError(err)
    } finally {
      loading.value = false
    }
  }

  /** Add a product to the wishlist */
  async function addItem(productId: string, variantId?: string) {
    loading.value = true
    error.value = null
    try {
      wishlist.value = await adapter.addToWishlist(productId, variantId)
      itemAddedHook.trigger(wishlist.value!)
    } catch (err) {
      handleError(err)
    } finally {
      loading.value = false
    }
  }

  /** Remove an item from the wishlist */
  async function removeItem(itemId: string) {
    loading.value = true
    error.value = null
    try {
      wishlist.value = await adapter.removeFromWishlist(itemId)
      itemRemovedHook.trigger(wishlist.value!)
    } catch (err) {
      handleError(err)
    } finally {
      loading.value = false
    }
  }

  /** Check if a product is in the wishlist */
  function isInWishlist(productId: string): boolean {
    return wishlist.value?.items.some(item => item.product.id === productId) ?? false
  }

  return {
    // State (readonly)
    wishlist: readonly(wishlist) as Readonly<Ref<DeepReadonly<Wishlist> | null>>,
    loading: readonly(loading),
    error: readonly(error),

    // Item count
    itemCount: readonly(useState<number>('commerce:wishlist:count', () =>
      wishlist.value?.itemCount ?? 0
    )),

    // Methods
    refresh,
    addItem,
    removeItem,
    isInWishlist,

    // Lifecycle hooks
    onItemAdded: itemAddedHook.on,
    onItemRemoved: itemRemovedHook.on,
    onError: errorHook.on,
  }
}
