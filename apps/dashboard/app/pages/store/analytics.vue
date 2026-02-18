<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const period = ref('30d')
const periods = [
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' },
  { label: '90 Days', value: '90d' },
]

const metrics = ref([
  { label: 'Total Revenue', value: '$42,830', change: '+24%' },
  { label: 'Avg Order Value', value: '$68.50', change: '+8%' },
  { label: 'Repeat Customers', value: '32%', change: '+5%' },
  { label: 'Cart Abandonment', value: '18%', change: '-3%' },
])

const topProducts = ref([
  { name: 'Premium T-Shirt', revenue: '$4,280', orders: 143 },
  { name: 'Classic Hoodie', revenue: '$3,540', orders: 59 },
  { name: 'Leather Wallet', revenue: '$2,970', orders: 66 },
  { name: 'Canvas Sneakers', revenue: '$2,140', orders: 24 },
])
</script>

<template>
  <UDashboardPanel id="store-analytics">
    <template #header>
      <UDashboardNavbar title="Analytics">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <USelect :items="periods" v-model="period" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Metrics -->
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <UCard v-for="metric in metrics" :key="metric.label">
          <p class="text-xs text-muted">{{ metric.label }}</p>
          <p class="text-2xl font-semibold text-highlighted mt-1">{{ metric.value }}</p>
          <p class="text-xs mt-2" :class="metric.change.startsWith('+') ? 'text-success' : metric.change.startsWith('-') ? 'text-error' : 'text-muted'">
            {{ metric.change }} from last period
          </p>
        </UCard>
      </div>

      <div class="grid gap-6 lg:grid-cols-2">
        <!-- Chart placeholder -->
        <UCard>
          <template #header>
            <h2 class="text-lg font-semibold text-highlighted">Revenue Trend</h2>
          </template>
          <div class="flex items-center justify-center py-16 text-muted text-sm">
            <div class="text-center">
              <UIcon name="i-lucide-trending-up" class="size-8 mb-2 mx-auto text-dimmed" />
              <p>Revenue chart coming soon</p>
            </div>
          </div>
        </UCard>

        <!-- Top Products -->
        <UCard>
          <template #header>
            <h2 class="text-lg font-semibold text-highlighted">Top Products</h2>
          </template>

          <div class="space-y-3">
            <div
              v-for="(product, index) in topProducts"
              :key="product.name"
              class="flex items-center justify-between py-2"
            >
              <div class="flex items-center gap-3">
                <span class="text-xs text-dimmed font-mono w-5 text-right">{{ index + 1 }}</span>
                <span class="text-sm text-highlighted">{{ product.name }}</span>
              </div>
              <div class="flex items-center gap-4 text-sm">
                <span class="text-muted">{{ product.orders }} orders</span>
                <span class="font-medium text-highlighted">{{ product.revenue }}</span>
              </div>
            </div>
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
