import { computed, readonly, useRuntimeConfig, useState } from '#imports'
import type { DeepReadonly, Ref } from 'vue'
import type { AddToCartInput, Cart } from '@commercejs/types'
import { CommerceError, isCommerceError } from '@commercejs/types'
import { createEventHook } from '@vueuse/core'

/**
 * Stateful cart composable.
 *
 * Hits the session-based storefront API (T01 contract on CommerceJS Cloud,
 * same shape for self-hosters via `@commercejs/nuxt` remote mode):
 *
 *     GET    /api/storefront/cart          → current cart, auto-creates
 *     POST   /api/storefront/cart/items    → add item
 *     PATCH  /api/storefront/cart/items/:id → change quantity
 *     DELETE /api/storefront/cart/items/:id → remove item
 *
 * The cart ID lives on the buyer's sealed session cookie server-side —
 * clients never pass it explicitly. `cartId` here is exposed as a
 * read-only reactive derived from the cart object for backward
 * compatibility with code that checks "is a cart established?", but
 * mutations don't need it.
 *
 * @example
 * ```vue
 * <script setup>
 * const { cart, addItem, removeItem, itemCount, loading, onItemAdded, onError } = useCart()
 *
 * onItemAdded((cart) => analytics.track('item_added', { cartId: cart.id }))
 * onError((err) => toast.error(err.message))
 * </script>
 * ```
 */

// Shared event hooks (module-scoped so all useCart() callers share them).
const itemAddedHook = createEventHook<Cart>()
const itemUpdatedHook = createEventHook<Cart>()
const itemRemovedHook = createEventHook<Cart>()
const errorHook = createEventHook<Error>()

export function useCart() {
  const config = useRuntimeConfig()
  const apiBase = config.public.commerce?.apiBase || '/api/storefront'

  const cart = useState<Cart | null>('commerce_cart', () => null)
  const loading = useState<boolean>('commerce_cart_loading', () => false)
  const error = useState<Error | null>('commerce_cart_error', () => null)

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

  /**
   * Fetch the active cart. GET /cart auto-creates on the server if the
   * buyer doesn't have one yet, so this doubles as "ensure a cart
   * exists" and `createCart()` is kept only as a compatibility alias.
   */
  async function refresh() {
    loading.value = true
    error.value = null
    try {
      cart.value = await $fetch<Cart>(`${apiBase}/cart`)
    }
    catch (err) {
      throw handleError(err)
    }
    finally {
      loading.value = false
    }
  }

  /** Alias for refresh() — the session API auto-creates on first read. */
  async function createCart() {
    await refresh()
    return cart.value!
  }

  async function addItem(item: AddToCartInput) {
    loading.value = true
    error.value = null
    try {
      cart.value = await $fetch<Cart>(`${apiBase}/cart/items`, {
        method: 'POST',
        body: item,
      })
      itemAddedHook.trigger(cart.value!)
    }
    catch (err) {
      throw handleError(err)
    }
    finally {
      loading.value = false
    }
  }

  async function updateItem(itemId: string, quantity: number) {
    loading.value = true
    error.value = null
    try {
      cart.value = await $fetch<Cart>(`${apiBase}/cart/items/${itemId}`, {
        method: 'PATCH',
        body: { quantity },
      })
      itemUpdatedHook.trigger(cart.value!)
    }
    catch (err) {
      throw handleError(err)
    }
    finally {
      loading.value = false
    }
  }

  async function removeItem(itemId: string) {
    loading.value = true
    error.value = null
    try {
      cart.value = await $fetch<Cart>(`${apiBase}/cart/items/${itemId}`, {
        method: 'DELETE',
      })
      itemRemovedHook.trigger(cart.value!)
    }
    catch (err) {
      throw handleError(err)
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Coupon endpoints are deferred (not yet in T01). Throw a clear error
   * so consumers know what's unsupported rather than silently no-op.
   */
  function applyCoupon(_code: string): Promise<void> {
    throw handleError(new Error(
      '[@commercejs/nuxt] applyCoupon is not implemented against the storefront API yet — '
      + 'promotion endpoints are phase-2 work (see .plans/storefront-eaas/).',
    ))
  }
  function removeCoupon(): Promise<void> {
    throw handleError(new Error(
      '[@commercejs/nuxt] removeCoupon is not implemented against the storefront API yet.',
    ))
  }

  return {
    /** Reactive cart state (readonly — mutate through the methods below). */
    cart: readonly(cart) as DeepReadonly<Ref<Cart | null>>,

    /**
     * Cart ID, derived from the loaded cart. Read-only — the server
     * owns cart creation (session-based). Consumers that used to guard
     * with `if (!cartId.value) await createCart()` can keep that shape;
     * `createCart()` is just `refresh()` under the hood.
     */
    cartId: computed(() => cart.value?.id ?? ''),

    /** Whether a cart operation is in progress. */
    loading: readonly(loading),
    /** Last error from a cart operation. */
    error: readonly(error),
    /** Number of items in the cart. */
    itemCount: computed(() => cart.value?.itemCount ?? 0),

    // Event hooks — subscribe: onItemAdded((cart) => { ... })
    onItemAdded: itemAddedHook.on,
    onItemUpdated: itemUpdatedHook.on,
    onItemRemoved: itemRemovedHook.on,
    onError: errorHook.on,

    // Methods
    createCart,
    refresh,
    addItem,
    updateItem,
    removeItem,
    applyCoupon,
    removeCoupon,
  }
}
