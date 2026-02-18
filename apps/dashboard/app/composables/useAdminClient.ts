// ---------------------------------------------------------------------------
// Admin API client — calls dashboard proxy which forwards to storefront
// ---------------------------------------------------------------------------

interface AdminListParams {
  page?: number
  perPage?: number
  search?: string
  status?: string
  sortField?: string
  sortDir?: 'asc' | 'desc'
}

interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  perPage: number
  hasMore: boolean
}

interface DashboardStats {
  totalProducts: number
  activeProducts: number
  totalOrders: number
  totalRevenue: number
  totalCustomers: number
  recentOrders: any[]
  ordersByStatus: Record<string, number>
}

interface StoreSettings {
  name: string
  nameAr?: string | null
  description?: string | null
  currency: string
  locale: string
  timezone: string
  contactEmail?: string | null
  contactPhone?: string | null
}

/**
 * Composable providing typed methods for calling admin API endpoints.
 * Calls go through the dashboard's own Nitro proxy at `/api/admin/*`,
 * which forwards to the storefront's `/_commerce/admin/*` endpoints.
 */
export function useAdminClient() {
  const { currentStore } = useDashboard()

  function adminFetch<T>(path: string, params: Record<string, any> = {}): Promise<T> {
    const query = {
      ...params,
      _storeUrl: currentStore.value.url,
    }
    return $fetch<T>(`/api/admin/${path}`, { query })
  }

  return {
    // Dashboard overview
    getDashboardStats() {
      return adminFetch<DashboardStats>('stats')
    },

    // Products
    listProducts(params?: AdminListParams) {
      return adminFetch<PaginatedResult<any>>('products', params ?? {})
    },
    getProduct(id: string) {
      return adminFetch<any>(`products/${id}`)
    },
    createProduct(input: any) {
      return $fetch<any>('/api/admin/products', {
        method: 'POST',
        body: input,
        query: { _storeUrl: currentStore.value.url },
      })
    },
    updateProduct(id: string, input: any) {
      return $fetch<any>(`/api/admin/products/${id}`, {
        method: 'PATCH',
        body: input,
        query: { _storeUrl: currentStore.value.url },
      })
    },
    deleteProduct(id: string) {
      return $fetch<void>(`/api/admin/products/${id}`, {
        method: 'DELETE',
        query: { _storeUrl: currentStore.value.url },
      })
    },

    // Orders
    listOrders(params?: AdminListParams) {
      return adminFetch<PaginatedResult<any>>('orders', params ?? {})
    },
    getOrder(id: string) {
      return adminFetch<any>(`orders/${id}`)
    },
    fulfillOrder(id: string, input: any) {
      return $fetch<void>(`/api/admin/orders/${id}/fulfill`, {
        method: 'POST',
        body: input,
        query: { _storeUrl: currentStore.value.url },
      })
    },
    refundOrder(id: string, note?: string) {
      return $fetch<void>(`/api/admin/orders/${id}/refund`, {
        method: 'POST',
        body: { note },
        query: { _storeUrl: currentStore.value.url },
      })
    },

    // Customers
    listCustomers(params?: AdminListParams) {
      return adminFetch<PaginatedResult<any>>('customers', params ?? {})
    },
    getCustomer(id: string) {
      return adminFetch<any>(`customers/${id}`)
    },

    // Store settings
    getStoreSettings() {
      return adminFetch<StoreSettings>('store')
    },
    updateStoreSettings(input: any) {
      return $fetch<StoreSettings>('/api/admin/store', {
        method: 'PATCH',
        body: input,
        query: { _storeUrl: currentStore.value.url },
      })
    },
  }
}
