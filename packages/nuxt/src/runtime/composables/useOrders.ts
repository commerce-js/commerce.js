import { useState, readonly, useRuntimeConfig } from '#imports'
import type { DeepReadonly, Ref } from 'vue'
import type { Order, PaginatedResult } from '@commercejs/types'
import { CommerceError, isCommerceError } from '@commercejs/types'
import { createEventHook } from '@vueuse/core'

/**
 * Orders composable — view, cancel, and reorder.
 *
 * Uses server API routes (`/api/_commerce/customer/orders/*`) so it works on both
 * SSR and client-side navigation — same pattern as `useCart`.
 *
 * @example
 * ```vue
 * <script setup>
 * const { orders, loading, loadOrders, cancelOrder, onOrderCancelled } = useOrders()
 *
 * onOrderCancelled((order) => toast.success('Order cancelled'))
 * await loadOrders()
 * </script>
 * ```
 */

const cancelledHook = createEventHook<Order>()
const errorHook = createEventHook<Error>()

export function useOrders() {
  const config = useRuntimeConfig()
  const apiBase = config.public.commerce?.apiBase || '/api/_commerce'

  const orders = useState<Order[]>('commerce_orders', () => [])
  const currentOrder = useState<Order | null>('commerce_current_order', () => null)
  const totalPages = useState<number>('commerce_orders_total_pages', () => 1)
  const currentPage = useState<number>('commerce_orders_page', () => 1)
  const loading = useState<boolean>('commerce_orders_loading', () => false)
  const error = useState<Error | null>('commerce_orders_error', () => null)

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
   * Load a paginated list of customer orders.
   */
  async function loadOrders(params?: { page?: number; perPage?: number }) {
    loading.value = true
    error.value = null
    try {
      const query: Record<string, string> = {}
      if (params?.page) query.page = String(params.page)
      if (params?.perPage) query.perPage = String(params.perPage)

      const result = await $fetch<PaginatedResult<Order>>(`${apiBase}/customer/orders`, {
        query,
      })

      orders.value = result.items
      totalPages.value = result.perPage > 0 ? Math.ceil(result.total / result.perPage) : 1
      currentPage.value = params?.page ?? 1
    }
    catch (err) {
      throw handleError(err)
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Get a single order by ID.
   */
  async function getOrder(orderId: string): Promise<Order> {
    loading.value = true
    error.value = null
    try {
      const order = await $fetch<Order>(`${apiBase}/customer/orders/${orderId}`)
      currentOrder.value = order
      return order
    }
    catch (err) {
      throw handleError(err)
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Cancel an order (if the adapter supports it).
   */
  async function cancelOrder(orderId: string): Promise<Order> {
    loading.value = true
    error.value = null
    try {
      const order = await $fetch<Order>(`${apiBase}/customer/orders/${orderId}/cancel`, {
        method: 'POST',
      })
      // Update the order in the local list
      const idx = orders.value.findIndex((o: Order) => o.id === orderId)
      if (idx !== -1) orders.value[idx] = order
      if (currentOrder.value?.id === orderId) currentOrder.value = order
      cancelledHook.trigger(order)
      return order
    }
    catch (err) {
      throw handleError(err)
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Re-order: add all items from a previous order to the cart.
   * Returns the cart API base URL for the caller to re-fetch the cart.
   */
  async function reorder(orderId: string) {
    const order = currentOrder.value?.id === orderId
      ? currentOrder.value
      : await getOrder(orderId)

    if (!order?.items?.length) {
      throw new CommerceError('Order has no items to reorder', 'VALIDATION')
    }

    // Create a new cart and add each item
    const cart = await $fetch<any>(`${apiBase}/cart`, { method: 'POST' })

    for (const item of order.items) {
      await $fetch(`${apiBase}/cart/${cart.id}/items`, {
        method: 'POST',
        body: {
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
        },
      })
    }

    return cart
  }

  return {
    orders: readonly(orders) as DeepReadonly<Ref<Order[]>>,
    currentOrder: readonly(currentOrder) as DeepReadonly<Ref<Order | null>>,
    totalPages: readonly(totalPages),
    currentPage: readonly(currentPage),
    loading: readonly(loading),
    error: readonly(error),

    // Event hooks
    onOrderCancelled: cancelledHook.on,
    onError: errorHook.on,

    // Methods
    loadOrders,
    getOrder,
    cancelOrder,
    reorder,
  }
}
