<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const adminClient = useAdminClient()

const search = ref('')
const page = ref(1)
const perPage = 20

const { data: result, status } = useAsyncData(
  'admin-customers',
  () => adminClient.listCustomers({
    page: page.value,
    perPage,
    search: search.value || undefined,
  }),
  { watch: [page, search] }
)

const customers = computed(() => result.value?.items ?? [])
const total = computed(() => result.value?.total ?? 0)
const totalPages = computed(() => Math.ceil(total.value / perPage))

function fullName(customer: any) {
  return [customer.firstName, customer.lastName].filter(Boolean).join(' ') || customer.email
}

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
  <UDashboardPanel id="store-customers">
    <template #header>
      <UDashboardNavbar title="Customers">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UInput
            placeholder="Search customers..."
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
      <template v-else-if="customers.length">
        <UTable
          :data="customers"
          :columns="[
            { accessorKey: 'name', header: 'Customer' },
            { accessorKey: 'email', header: 'Email' },
            { accessorKey: 'phone', header: 'Phone' },
            { accessorKey: 'addresses', header: 'Addresses' },
            { accessorKey: 'createdAt', header: 'Joined' },
          ]"
        >
          <template #name-cell="{ row }">
            <div class="flex items-center gap-3">
              <UAvatar :alt="fullName(row.original)" size="xs" />
              <NuxtLink :to="`/store/customers/${row.original.id}`" class="text-primary hover:underline font-medium">
                {{ fullName(row.original) }}
              </NuxtLink>
            </div>
          </template>
          <template #phone-cell="{ row }">
            <span class="text-muted">{{ row.original.phone || '—' }}</span>
          </template>
          <template #addresses-cell="{ row }">
            {{ row.original.addresses?.length ?? 0 }}
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
        <UIcon name="i-lucide-users" class="text-muted size-8 mb-2" />
        <p class="text-muted">{{ search ? 'No customers match your search' : 'No customers yet' }}</p>
      </div>
    </template>
  </UDashboardPanel>
</template>
