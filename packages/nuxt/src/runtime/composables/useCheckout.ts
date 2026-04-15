import { readonly, useRuntimeConfig, useState } from '#imports'
import type {
  Address,
  Cart,
  Order,
  PaymentMethod,
  ShippingMethod,
} from '@commercejs/types'
import { CommerceError, isCommerceError } from '@commercejs/types'
import { createEventHook } from '@vueuse/core'
import { useCart } from './useCart'

/**
 * Checkout flow composable.
 *
 * Hits the session-based storefront API (T01 contract):
 *
 *     GET   /api/storefront/checkout          → { cart, shippingMethods, paymentMethods }
 *     POST  /api/storefront/checkout          → set shipping + billing addresses
 *     PATCH /api/storefront/checkout          → select shipping or payment method
 *     POST  /api/storefront/checkout/complete → finalize order
 *
 * Cart ID lives on the buyer session cookie — no need to pass it.
 *
 * @example
 * ```vue
 * <script setup>
 * const {
 *   cart, shippingMethods, paymentMethods,
 *   refreshCheckout,
 *   setAddresses, setShippingMethod, setPaymentMethod,
 *   placeOrder, onOrderPlaced,
 * } = useCheckout()
 *
 * onOrderPlaced((order) => navigateTo(`/orders/${order.id}`))
 * </script>
 * ```
 */
export function useCheckout() {
  const config = useRuntimeConfig()
  const apiBase = config.public.commerce?.apiBase || '/api/storefront'
  const { cart, cartId } = useCart()

  const shippingMethods = useState<ShippingMethod[]>('commerce_shipping_methods', () => [])
  const paymentMethods = useState<PaymentMethod[]>('commerce_payment_methods', () => [])
  const loading = useState<boolean>('commerce_checkout_loading', () => false)
  const error = useState<Error | null>('commerce_checkout_error', () => null)

  const orderPlacedHook = createEventHook<Order>()
  const errorHook = createEventHook<Error>()

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

  type CheckoutPayload = {
    cart: Cart
    shippingMethods: ShippingMethod[]
    paymentMethods: PaymentMethod[]
  }

  /**
   * Load (or refresh) the full checkout snapshot — cart + both method
   * lists — in a single request. Call after setting addresses so the
   * consumer can render the shipping/payment pickers.
   */
  async function refreshCheckout() {
    loading.value = true
    error.value = null
    try {
      const data = await $fetch<CheckoutPayload>(`${apiBase}/checkout`)
      // Share cart state with useCart's useState key.
      useState<Cart | null>('commerce_cart').value = data.cart
      shippingMethods.value = data.shippingMethods
      paymentMethods.value = data.paymentMethods
    }
    catch (err) {
      throw handleError(err)
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Back-compat aliases for the split T0 API. Both trigger the single
   * T01 GET /checkout. If both are called in sequence they coalesce
   * cheaply (the second call re-hydrates the same state).
   */
  async function loadShippingMethods() { await refreshCheckout() }
  async function loadPaymentMethods() { await refreshCheckout() }

  type AddressInput = Omit<Address, 'id' | 'isDefault'>

  /**
   * Set shipping + billing addresses in one POST. If `billingAddress`
   * is omitted, the server uses the shipping address for both.
   * Automatically refreshes methods so the caller can move straight
   * to picking a shipping option.
   */
  async function setAddresses(input: { shippingAddress: AddressInput, billingAddress?: AddressInput }) {
    loading.value = true
    error.value = null
    try {
      const updatedCart = await $fetch<Cart>(`${apiBase}/checkout`, {
        method: 'POST',
        body: input,
      })
      useState<Cart | null>('commerce_cart').value = updatedCart
      await refreshCheckout()
    }
    catch (err) {
      throw handleError(err)
    }
    finally {
      loading.value = false
    }
  }

  async function setShippingMethod(shippingMethodId: string) {
    loading.value = true
    error.value = null
    try {
      const updatedCart = await $fetch<Cart>(`${apiBase}/checkout`, {
        method: 'PATCH',
        body: { shippingMethodId },
      })
      useState<Cart | null>('commerce_cart').value = updatedCart
    }
    catch (err) {
      throw handleError(err)
    }
    finally {
      loading.value = false
    }
  }

  async function setPaymentMethod(paymentMethodId: string) {
    loading.value = true
    error.value = null
    try {
      const updatedCart = await $fetch<Cart>(`${apiBase}/checkout`, {
        method: 'PATCH',
        body: { paymentMethodId },
      })
      useState<Cart | null>('commerce_cart').value = updatedCart
    }
    catch (err) {
      throw handleError(err)
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Place the order. On success the server clears the cart ID from
   * the buyer session; we reset the local cart state to match so the
   * layout's cart drawer / counter immediately reflect the empty cart.
   */
  async function placeOrder(): Promise<Order> {
    loading.value = true
    error.value = null
    try {
      const order = await $fetch<Order>(`${apiBase}/checkout/complete`, {
        method: 'POST',
      })
      useState<Cart | null>('commerce_cart').value = null
      shippingMethods.value = []
      paymentMethods.value = []
      orderPlacedHook.trigger(order)
      return order
    }
    catch (err) {
      throw handleError(err)
    }
    finally {
      loading.value = false
    }
  }

  return {
    cart,
    cartId,
    shippingMethods: readonly(shippingMethods),
    paymentMethods: readonly(paymentMethods),
    loading: readonly(loading),
    error: readonly(error),

    onOrderPlaced: orderPlacedHook.on,
    onError: errorHook.on,

    refreshCheckout,
    loadShippingMethods,
    loadPaymentMethods,
    setAddresses,
    setShippingMethod,
    setPaymentMethod,
    placeOrder,
  }
}
