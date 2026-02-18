<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const adminClient = useAdminClient()
const { formatCurrency } = useFormatCurrency()

const { data: stats, status: statsStatus } = useAsyncData('dashboard-stats', () =>
  adminClient.getDashboardStats()
)

const statusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'success' as const
    case 'processing': return 'warning' as const
    case 'refunded': return 'error' as const
    case 'shipped': return 'info' as const
    default: return 'neutral' as const
  }
}
</script>

<template>
  <UDashboardPanel id="store-overview">
    <template #header>
      <UDashboardNavbar title="Store Overview">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Loading State -->
      <div v-if="statsStatus === 'pending'" class="space-y-4">
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <UCard v-for="i in 4" :key="i">
            <div class="h-16 animate-pulse bg-muted/20 rounded" />
          </UCard>
        </div>
      </div>

      <!-- Stats Grid -->
      <div v-else-if="stats" class="space-y-8">
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <UCard>
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-lg bg-primary/10">
                <UIcon name="i-lucide-dollar-sign" class="text-primary size-5" />
              </div>
              <div>
                <p class="text-xs text-muted">Revenue</p>
                <p class="text-lg font-semibold text-highlighted">{{ formatCurrency(stats.totalRevenue) }}</p>
              </div>
            </div>
          </UCard>

          <UCard>
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-lg bg-primary/10">
                <UIcon name="i-lucide-shopping-cart" class="text-primary size-5" />
              </div>
              <div>
                <p class="text-xs text-muted">Orders</p>
                <p class="text-lg font-semibold text-highlighted">{{ stats.totalOrders }}</p>
              </div>
            </div>
          </UCard>

          <UCard>
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-lg bg-primary/10">
                <UIcon name="i-lucide-users" class="text-primary size-5" />
              </div>
              <div>
                <p class="text-xs text-muted">Customers</p>
                <p class="text-lg font-semibold text-highlighted">{{ stats.totalCustomers }}</p>
              </div>
            </div>
          </UCard>

          <UCard>
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-lg bg-primary/10">
                <UIcon name="i-lucide-package" class="text-primary size-5" />
              </div>
              <div>
                <p class="text-xs text-muted">Products</p>
                <p class="text-lg font-semibold text-highlighted">
                  {{ stats.activeProducts }} <span class="text-xs text-muted">/ {{ stats.totalProducts }}</span>
                </p>
              </div>
            </div>
          </UCard>
        </div>

        <!-- Orders by Status -->
        <div class="grid gap-4 sm:grid-cols-2">
          <UCard>
            <template #header>
              <h2 class="text-lg font-semibold text-highlighted">Orders by Status</h2>
            </template>
            <div class="space-y-3">
              <div
                v-for="(count, status) in stats.ordersByStatus"
                :key="status"
                class="flex items-center justify-between"
              >
                <div class="flex items-center gap-2">
                  <UBadge :color="statusColor(String(status))" variant="subtle" size="xs">
                    {{ status }}
                  </UBadge>
                </div>
                <span class="text-sm font-medium text-highlighted">{{ count }}</span>
              </div>
            </div>
          </UCard>

          <!-- Recent Orders -->
          <UCard>
            <template #header>
              <h2 class="text-lg font-semibold text-highlighted">Recent Orders</h2>
            </template>
            <div class="space-y-3">
              <div
                v-for="order in stats.recentOrders"
                :key="order.id"
                class="flex items-center justify-between py-2"
              >
                <div class="flex items-center gap-3">
                  <NuxtLink :to="`/store/orders/${order.id}`" class="text-sm font-mono text-primary hover:underline">
                    {{ order.orderNumber || order.id.slice(0, 8) }}
                  </NuxtLink>
                </div>
                <div class="flex items-center gap-4">
                  <span class="text-sm text-highlighted font-medium">
                    {{ formatCurrency(order.totals?.total?.amount ?? 0) }}
                  </span>
                  <UBadge :color="statusColor(order.status)" variant="subtle" size="xs">
                    {{ order.status }}
                  </UBadge>
                </div>
              </div>
              <p v-if="!stats.recentOrders?.length" class="text-sm text-muted py-4 text-center">
                No orders yet
              </p>
            </div>
          </UCard>
        </div>
      </div>

      <!-- Error State -->
      <div v-else class="text-center py-12">
        <UIcon name="i-lucide-alert-circle" class="text-error size-8 mb-2" />
        <p class="text-muted">Failed to load dashboard stats. Make sure the storefront is running.</p>
      </div>
    </template>
  </UDashboardPanel>
</template>
