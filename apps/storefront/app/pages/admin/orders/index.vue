<script setup lang="ts">
// ---------------------------------------------------------------------------
// /admin/orders — list page. Server-paginated + filterable by status + date
// range + free-text search (order number or customer email). CSR-only —
// $fetch lands on the dashboard Nitro (:3000) via the storefront-proxy rule.
// ---------------------------------------------------------------------------

import type { Order, PaginatedResult } from '@commercejs/types'
import { refDebounced } from '@vueuse/core'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
  ssr: false,
})

const { formatPrice } = usePrice()

const route = useRoute()
const router = useRouter()

type StatusFilter =
  | ''
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'
  | 'returned'

const search = ref((route.query.q as string) || '')
const searchDebounced = refDebounced(search, 300)
const status = ref<StatusFilter>((route.query.status as StatusFilter) || '')
const dateFrom = ref((route.query.from as string) || '')
const dateTo = ref((route.query.to as string) || '')
const page = ref(Number(route.query.page) || 1)
const perPage = 20

watch([searchDebounced, status, dateFrom, dateTo], () => { page.value = 1 })

watchEffect(() => {
  const q: Record<string, string> = {}
  if (searchDebounced.value) q.q = searchDebounced.value
  if (status.value) q.status = status.value
  if (dateFrom.value) q.from = dateFrom.value
  if (dateTo.value) q.to = dateTo.value
  if (page.value > 1) q.page = String(page.value)
  router.replace({ query: q })
})

const queryParams = computed(() => {
  const p: Record<string, string | number> = { page: page.value, perPage }
  if (searchDebounced.value) p.search = searchDebounced.value
  if (status.value) p.status = status.value
  if (dateFrom.value) p.dateFrom = dateFrom.value
  if (dateTo.value) p.dateTo = dateTo.value
  return p
})

const { data, pending, error } = await useFetch<PaginatedResult<Order>>(
  '/api/admin/orders',
  {
    credentials: 'include',
    server: false,
    query: queryParams,
    key: 'admin-orders-list',
  },
)

const items = computed(() => data.value?.items ?? [])
const total = computed(() => data.value?.total ?? 0)

const statusOptions = [
  { label: 'All statuses', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Processing', value: 'processing' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Refunded', value: 'refunded' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Returned', value: 'returned' },
]

const columns = [
  { accessorKey: 'orderNumber', header: 'Order' },
  { accessorKey: 'createdAt', header: 'Placed' },
  { accessorKey: 'customer', header: 'Customer' },
  { accessorKey: 'total', header: 'Total' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'actions', header: '', size: 100 },
]

function statusColor(s?: string | null): 'primary' | 'info' | 'success' | 'warning' | 'error' | 'neutral' {
  if (s === 'shipped' || s === 'delivered') return 'success'
  if (s === 'processing') return 'info'
  if (s === 'refunded') return 'warning'
  if (s === 'cancelled' || s === 'returned') return 'error'
  return 'neutral'
}

function customerLabel(o: Order): string {
  const addr = o.shippingAddress || o.billingAddress
  if (addr?.email) return addr.email
  if (addr?.name) return addr.name
  return '—'
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString()
  }
  catch {
    return iso
  }
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-highlighted">
          Orders
        </h1>
        <p class="text-sm text-muted mt-1">
          {{ total }} total
        </p>
      </div>
    </header>

    <UCard>
      <div class="flex flex-col sm:flex-row sm:flex-wrap gap-3">
        <UInput
          v-model="search"
          placeholder="Search order # or email"
          icon="i-heroicons-magnifying-glass-20-solid"
          class="sm:w-80"
        />
        <USelect
          v-model="status"
          :items="statusOptions"
          value-key="value"
          class="sm:w-48"
        />
        <UInput
          v-model="dateFrom"
          type="date"
          placeholder="From"
          class="sm:w-44"
        />
        <UInput
          v-model="dateTo"
          type="date"
          placeholder="To"
          class="sm:w-44"
        />
      </div>
    </UCard>

    <UAlert
      v-if="error"
      color="error"
      variant="subtle"
      title="Could not load orders"
      :description="error.message"
      icon="i-heroicons-exclamation-triangle-20-solid"
    />

    <UCard v-if="!pending && items.length === 0">
      <div class="flex flex-col items-center text-center py-10 gap-3">
        <UIcon name="i-heroicons-shopping-bag-20-solid" class="text-4xl text-dimmed" />
        <div>
          <p class="font-medium text-highlighted">
            No orders match
          </p>
          <p class="text-sm text-muted mt-1">
            Adjust the filters, or wait for a buyer to check out.
          </p>
        </div>
      </div>
    </UCard>

    <UCard v-else>
      <UTable :data="items" :columns="columns" :loading="pending">
        <template #orderNumber-cell="{ row }">
          <NuxtLink
            :to="`/admin/orders/${row.original.id}`"
            class="font-medium text-highlighted hover:text-primary"
          >
            {{ row.original.orderNumber }}
          </NuxtLink>
        </template>
        <template #createdAt-cell="{ row }">
          <span class="text-sm text-muted">{{ formatDate(row.original.createdAt) }}</span>
        </template>
        <template #customer-cell="{ row }">
          <span class="text-sm" dir="auto">{{ customerLabel(row.original) }}</span>
        </template>
        <template #total-cell="{ row }">
          {{ formatPrice(row.original.totals?.total) }}
        </template>
        <template #status-cell="{ row }">
          <UBadge :color="statusColor(row.original.status)" variant="subtle" size="sm">
            {{ row.original.status }}
          </UBadge>
        </template>
        <template #actions-cell="{ row }">
          <div class="flex items-center justify-end gap-1">
            <UButton
              :to="`/admin/orders/${row.original.id}`"
              variant="ghost"
              color="neutral"
              size="sm"
            >
              View
            </UButton>
          </div>
        </template>
      </UTable>

      <div v-if="total > perPage" class="flex justify-center mt-4">
        <UPagination
          v-model:page="page"
          :total="total"
          :items-per-page="perPage"
        />
      </div>
    </UCard>
  </div>
</template>
