import { useState, readonly } from '#imports'
import type {
  Address,
  Order,
  ShippingMethod,
  PaymentMethod,
} from '@commercejs/types'
import { CommerceError, isCommerceError } from '@commercejs/types'
import { createEventHook } from '@vueuse/core'
import { useAdapter } from './useAdapter'
import { useCart } from './useCart'

/**
 * Checkout flow composable.
 * Manages the checkout process step by step.
 *
 * Exposes lifecycle event hooks for order placement analytics, etc.
 *
 * @example
 * ```vue
 * <script setup>
 * const {
 *   shippingMethods,
 *   paymentMethods,
 *   setShippingAddress,
 *   setShippingMethod,
 *   setPaymentMethod,
 *   placeOrder,
 *   onOrderPlaced,
 * } = useCheckout()
 *
 * onOrderPlaced((order) => navigateTo(`/order/${order.id}/confirmation`))
 * </script>
 * ```
 */
export function useCheckout() {
  const adapter = useAdapter()
  const { cart, cartId } = useCart()

  const shippingMethods = useState<ShippingMethod[]>('commerce_shipping_methods', () => [])
  const paymentMethods = useState<PaymentMethod[]>('commerce_payment_methods', () => [])
  const loading = useState<boolean>('commerce_checkout_loading', () => false)
  const error = useState<Error | null>('commerce_checkout_error', () => null)

  // Event hooks
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

  function requireCartId(): string {
    if (!cartId.value) {
      throw new Error('[@commercejs/core] No cart ID found. Add items to cart first.')
    }
    return cartId.value
  }

  /**
   * Fetch available shipping methods for the current cart.
   */
  async function loadShippingMethods() {
    const id = requireCartId()
    loading.value = true
    error.value = null
    try {
      shippingMethods.value = await adapter.getShippingMethods(id)
    }
    catch (err) {
      throw handleError(err)
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Fetch available payment methods for the current cart.
   */
  async function loadPaymentMethods() {
    const id = requireCartId()
    loading.value = true
    error.value = null
    try {
      paymentMethods.value = await adapter.getPaymentMethods(id)
    }
    catch (err) {
      throw handleError(err)
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Set the shipping address for the current cart.
   */
  async function setShippingAddress(address: Omit<Address, 'id' | 'isDefault'>) {
    const id = requireCartId()
    loading.value = true
    error.value = null
    try {
      const updatedCart = await adapter.setShippingAddress(id, address)
      // Update the cart state via useState directly since useCart's cart is readonly
      useState<typeof updatedCart>('commerce_cart').value = updatedCart
    }
    catch (err) {
      throw handleError(err)
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Set the billing address for the current cart.
   */
  async function setBillingAddress(address: Omit<Address, 'id' | 'isDefault'>) {
    const id = requireCartId()
    loading.value = true
    error.value = null
    try {
      const updatedCart = await adapter.setBillingAddress(id, address)
      useState<typeof updatedCart>('commerce_cart').value = updatedCart
    }
    catch (err) {
      throw handleError(err)
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Select a shipping method.
   */
  async function setShippingMethod(methodId: string) {
    const id = requireCartId()
    loading.value = true
    error.value = null
    try {
      const updatedCart = await adapter.setShippingMethod(id, methodId)
      useState<typeof updatedCart>('commerce_cart').value = updatedCart
    }
    catch (err) {
      throw handleError(err)
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Select a payment method.
   */
  async function setPaymentMethod(methodId: string) {
    const id = requireCartId()
    loading.value = true
    error.value = null
    try {
      const updatedCart = await adapter.setPaymentMethod(id, methodId)
      useState<typeof updatedCart>('commerce_cart').value = updatedCart
    }
    catch (err) {
      throw handleError(err)
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Place the order — finalizes checkout.
   * Returns the created Order and clears the cart state.
   */
  async function placeOrder(): Promise<Order> {
    const id = requireCartId()
    loading.value = true
    error.value = null
    try {
      const order = await adapter.placeOrder(id)
      // Clear cart state after successful order
      useState('commerce_cart').value = null
      cartId.value = ''
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
    shippingMethods: readonly(shippingMethods),
    paymentMethods: readonly(paymentMethods),
    loading: readonly(loading),
    error: readonly(error),

    // Event hooks
    onOrderPlaced: orderPlacedHook.on,
    onError: errorHook.on,

    // Methods
    loadShippingMethods,
    loadPaymentMethods,
    setShippingAddress,
    setBillingAddress,
    setShippingMethod,
    setPaymentMethod,
    placeOrder,
  }
}
