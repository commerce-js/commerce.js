<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const adminClient = useAdminClient()

const search = ref('')
const page = ref(1)
const perPage = 20

const { data: result, status } = useAsyncData(
  'admin-orders',
  () => adminClient.listOrders({
    page: page.value,
    perPage,
    search: search.value || undefined,
  }),
  { watch: [page, search] }
)

const orders = computed(() => result.value?.items ?? [])
const total = computed(() => result.value?.total ?? 0)
const totalPages = computed(() => Math.ceil(total.value / perPage))

const statusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'success' as const
    case 'processing': return 'warning' as const
    case 'shipped': return 'info' as const
    case 'refunded': return 'error' as const
    default: return 'neutral' as const
  }
}

const { formatCurrency } = useFormatCurrency()

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  })
}

// Debounce search
let searchTimeout: ReturnType<typeof setTimeout>
function onSearch(value: string) {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    search.value = value
    page.value = 1
  }, 300)
}
</script>

<template>
  <UDashboardPanel id="store-orders">
    <template #header>
      <UDashboardNavbar title="Orders">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UInput
            placeholder="Search orders..."
            icon="i-lucide-search"
            class="w-64"
            :model-value="search"
            @update:model-value="onSearch"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Loading -->
      <div v-if="status === 'pending'" class="space-y-3 p-4">
        <div v-for="i in 5" :key="i" class="h-12 animate-pulse bg-muted/20 rounded" />
      </div>

      <!-- Data -->
      <template v-else-if="orders.length">
        <UTable
          :data="orders"
          :columns="[
            { accessorKey: 'orderNumber', header: 'Order' },
            { accessorKey: 'status', header: 'Status' },
            { accessorKey: 'items', header: 'Items' },
            { accessorKey: 'totals', header: 'Total' },
            { accessorKey: 'createdAt', header: 'Date' },
          ]"
        >
          <template #orderNumber-cell="{ row }">
            <NuxtLink :to="`/store/orders/${row.original.id}`" class="text-primary hover:underline font-mono">
              {{ row.original.orderNumber || row.original.id.slice(0, 8) }}
            </NuxtLink>
          </template>
          <template #status-cell="{ row }">
            <UBadge :color="statusColor(row.original.status)" variant="subtle" size="xs">
              {{ row.original.status }}
            </UBadge>
          </template>
          <template #items-cell="{ row }">
            {{ row.original.items?.length ?? 0 }} items
          </template>
          <template #totals-cell="{ row }">
            {{ formatCurrency(row.original.totals?.total) }}
          </template>
          <template #createdAt-cell="{ row }">
            {{ formatDate(row.original.createdAt) }}
          </template>
        </UTable>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="flex items-center justify-between px-4 py-3 border-t border-default">
          <p class="text-sm text-muted">
            Showing {{ (page - 1) * perPage + 1 }}–{{ Math.min(page * perPage, total) }} of {{ total }}
          </p>
          <div class="flex gap-2">
            <UButton size="xs" variant="outline" :disabled="page <= 1" @click="page--">Previous</UButton>
            <UButton size="xs" variant="outline" :disabled="page >= totalPages" @click="page++">Next</UButton>
          </div>
        </div>
      </template>

      <!-- Empty State -->
      <div v-else class="text-center py-12">
        <UIcon name="i-lucide-inbox" class="text-muted size-8 mb-2" />
        <p class="text-muted">{{ search ? 'No orders match your search' : 'No orders yet' }}</p>
      </div>
    </template>
  </UDashboardPanel>
</template>
