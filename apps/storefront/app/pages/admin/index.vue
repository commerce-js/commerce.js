<script setup lang="ts">
// ---------------------------------------------------------------------------
// /admin — merchant dashboard landing. Top cards + status breakdown + a
// recent-orders mini-table, all sourced from getDashboardStats() via
// /api/admin/stats (dashboard route).
// ---------------------------------------------------------------------------

import type { Order } from '@commercejs/types'

type RecentOrder = Order

interface DashboardStats {
  totalProducts: number
  activeProducts: number
  totalOrders: number
  totalRevenue: number
  totalCustomers: number
  recentOrders: RecentOrder[]
  ordersByStatus: Record<string, number>
}

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
  ssr: false,
})

const { store } = useStoreInfo()
const { formatPrice } = usePrice()

const { data: stats, pending, error, refresh } = await useFetch<DashboardStats>('/api/admin/stats', {
  credentials: 'include',
  key: 'admin-dashboard-stats',
  server: false,
})

const currency = computed(() => store.value?.locales?.find(l => l.isDefault)?.currency || 'USD')

const topCards = computed(() => [
  {
    label: 'Total products',
    value: stats.value?.totalProducts ?? 0,
    icon: 'i-heroicons-cube-20-solid',
  },
  {
    label: 'Active products',
    value: stats.value?.activeProducts ?? 0,
    icon: 'i-heroicons-check-badge-20-solid',
  },
  {
    label: 'Orders',
    value: stats.value?.totalOrders ?? 0,
    icon: 'i-heroicons-shopping-bag-20-solid',
  },
  {
    label: 'Revenue',
    value: formatPrice({ amount: stats.value?.totalRevenue ?? 0, currency: currency.value }),
    icon: 'i-heroicons-banknotes-20-solid',
  },
  {
    label: 'Customers',
    value: stats.value?.totalCustomers ?? 0,
    icon: 'i-heroicons-user-group-20-solid',
  },
])

const statusRows = computed(() => {
  const byStatus = stats.value?.ordersByStatus ?? {}
  return Object.entries(byStatus).map(([status, count]) => ({ status, count }))
})

const recentOrders = computed(() => stats.value?.recentOrders ?? [])

const orderColumns = [
  { accessorKey: 'orderNumber', header: 'Order' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'total', header: 'Total' },
  { accessorKey: 'createdAt', header: 'Placed' },
]

function statusColor(status: string): 'primary' | 'success' | 'warning' | 'error' | 'neutral' {
  if (status === 'delivered' || status === 'paid' || status === 'fulfilled') return 'success'
  if (status === 'pending' || status === 'processing') return 'warning'
  if (status === 'canceled' || status === 'refunded' || status === 'failed') return 'error'
  return 'neutral'
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-highlighted">
          Dashboard
        </h1>
        <p class="text-sm text-muted mt-1">
          Overview of your store's activity.
        </p>
      </div>
      <UButton
        icon="i-heroicons-arrow-path-20-solid"
        variant="outline"
        color="neutral"
        size="sm"
        :loading="pending"
        @click="refresh"
      >
        Refresh
      </UButton>
    </header>

    <UAlert
      v-if="error"
      title="Could not load dashboard stats"
      :description="error.message"
      color="error"
      variant="subtle"
      icon="i-heroicons-exclamation-triangle-20-solid"
    />

    <!-- Top cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <UCard v-for="card in topCards" :key="card.label">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm text-muted">
              {{ card.label }}
            </p>
            <p class="text-2xl font-bold text-highlighted mt-1">
              {{ card.value }}
            </p>
          </div>
          <UIcon :name="card.icon" class="text-xl text-primary" />
        </div>
      </UCard>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <!-- Status breakdown -->
      <UCard class="lg:col-span-1">
        <template #header>
          <h2 class="font-semibold text-highlighted">
            Orders by status
          </h2>
        </template>

        <div v-if="statusRows.length === 0" class="text-sm text-muted">
          No orders yet.
        </div>

        <ul v-else class="flex flex-col gap-2">
          <li v-for="row in statusRows" :key="row.status" class="flex items-center justify-between">
            <UBadge :color="statusColor(row.status)" variant="subtle" size="sm">
              {{ row.status }}
            </UBadge>
            <span class="text-sm font-medium text-highlighted">{{ row.count }}</span>
          </li>
        </ul>
      </UCard>

      <!-- Recent orders -->
      <UCard class="lg:col-span-2">
        <template #header>
          <h2 class="font-semibold text-highlighted">
            Recent orders
          </h2>
        </template>

        <div v-if="recentOrders.length === 0" class="text-sm text-muted">
          No orders yet. They'll show up here as soon as buyers start checking out.
        </div>

        <UTable
          v-else
          :data="recentOrders"
          :columns="orderColumns"
        >
          <template #orderNumber-cell="{ row }">
            <span class="font-medium">{{ row.original.orderNumber }}</span>
          </template>
          <template #status-cell="{ row }">
            <UBadge :color="statusColor(row.original.status)" variant="subtle" size="sm">
              {{ row.original.status }}
            </UBadge>
          </template>
          <template #total-cell="{ row }">
            {{ formatPrice(row.original.totals?.total) }}
          </template>
          <template #createdAt-cell="{ row }">
            <span class="text-sm text-muted">
              {{ new Date(row.original.createdAt).toLocaleDateString() }}
            </span>
          </template>
        </UTable>
      </UCard>
    </div>
  </div>
</template>
