import { useState, useCookie, computed, readonly, useRuntimeConfig } from '#imports'
import type { DeepReadonly, Ref } from 'vue'
import type { Cart, AddToCartInput } from '@commercejs/types'
import { CommerceError, isCommerceError } from '@commercejs/types'
import { createEventHook } from '@vueuse/core'

/**
 * Stateful cart composable.
 * Uses server API routes (`/api/_commerce/cart/*`) so it works on both
 * SSR and client-side navigation. Cart ID is persisted in a cookie.
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

// Shared event hooks (module-scoped so all useCart() callers share them)
const itemAddedHook = createEventHook<Cart>()
const itemUpdatedHook = createEventHook<Cart>()
const itemRemovedHook = createEventHook<Cart>()
const errorHook = createEventHook<Error>()

export function useCart() {
  const config = useRuntimeConfig()
  const apiBase = config.public.commerce?.apiBase || '/api/_commerce'

  const cartId = useCookie<string>('commerce_cart_id', { maxAge: 60 * 60 * 24 * 30 }) // 30 days
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
   * Create a new empty cart and persist its ID.
   */
  async function createCart() {
    loading.value = true
    error.value = null
    try {
      const newCart = await $fetch<Cart>(`${apiBase}/cart`, { method: 'POST' })
      cart.value = newCart
      cartId.value = newCart.id
      return newCart
    } catch (err) {
      throw handleError(err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch or refresh the cart from the backend.
   */
  async function refresh() {
    if (!cartId.value) return

    loading.value = true
    error.value = null
    try {
      cart.value = await $fetch<Cart>(`${apiBase}/cart/${cartId.value}`)
    }
    catch (err) {
      handleError(err)
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Add an item to the cart.
   */
  async function addItem(item: AddToCartInput) {
    if (!cartId.value) {
      throw new Error('[@commercejs/nuxt] No cart ID. Ensure the cart is initialized.')
    }

    loading.value = true
    error.value = null
    try {
      cart.value = await $fetch<Cart>(`${apiBase}/cart/${cartId.value}/items`, {
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

  /**
   * Update the quantity of a cart item.
   */
  async function updateItem(itemId: string, quantity: number) {
    if (!cartId.value) return

    loading.value = true
    error.value = null
    try {
      cart.value = await $fetch<Cart>(`${apiBase}/cart/${cartId.value}/items/${itemId}`, {
        method: 'PUT',
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

  /**
   * Remove an item from the cart.
   */
  async function removeItem(itemId: string) {
    if (!cartId.value) return

    loading.value = true
    error.value = null
    try {
      cart.value = await $fetch<Cart>(`${apiBase}/cart/${cartId.value}/items/${itemId}`, {
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
   * Apply a coupon code.
   */
  async function applyCoupon(code: string) {
    if (!cartId.value) return

    loading.value = true
    error.value = null
    try {
      cart.value = await $fetch<Cart>(`${apiBase}/promotions/validate`, {
        method: 'POST',
        body: { cartId: cartId.value, code },
      })
    }
    catch (err) {
      throw handleError(err)
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Remove the applied coupon.
   */
  async function removeCoupon() {
    // Re-fetch cart to remove coupon effect
    await refresh()
  }

  return {
    /** Reactive cart state (readonly to enforce mutations through methods) */
    cart: readonly(cart) as DeepReadonly<Ref<Cart | null>>,
    /** Cart ID stored in cookie */
    cartId,
    /** Whether a cart operation is in progress */
    loading: readonly(loading),
    /** Last error from a cart operation */
    error: readonly(error),
    /** Number of items in the cart */
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
