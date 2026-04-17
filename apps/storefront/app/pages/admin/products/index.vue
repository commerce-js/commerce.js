<script setup lang="ts">
// ---------------------------------------------------------------------------
// /admin/products — list page. Server-paginated + searchable, status filter,
// thumbnail + name + SKU + price + inventory + status + row actions.
// CSR-only: $fetch calls /api/admin/products from the browser, which lands
// on the dashboard Nitro (:3000) via the storefront-proxy rule.
// ---------------------------------------------------------------------------

import type { Product, PaginatedResult } from '@commercejs/types'
import { refDebounced } from '@vueuse/core'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
  ssr: false,
})

const { t } = useLocalizedString()
const { formatPrice } = usePrice()
const toast = useToast()

const route = useRoute()
const router = useRouter()

const search = ref((route.query.q as string) || '')
const searchDebounced = refDebounced(search, 300)
const status = ref<'' | 'draft' | 'active' | 'archived'>((route.query.status as any) || '')
const page = ref(Number(route.query.page) || 1)
const perPage = 20

watch(searchDebounced, () => { page.value = 1 })
watch(status, () => { page.value = 1 })

watchEffect(() => {
  const q: Record<string, string> = {}
  if (searchDebounced.value) q.q = searchDebounced.value
  if (status.value) q.status = status.value
  if (page.value > 1) q.page = String(page.value)
  router.replace({ query: q })
})

const queryParams = computed(() => {
  const p: Record<string, string | number> = { page: page.value, perPage }
  if (searchDebounced.value) p.search = searchDebounced.value
  if (status.value) p.status = status.value
  return p
})

const { data, pending, error, refresh } = await useFetch<PaginatedResult<Product>>(
  '/api/admin/products',
  {
    credentials: 'include',
    server: false,
    query: queryParams,
    key: 'admin-products-list',
  },
)

const items = computed(() => data.value?.items ?? [])
const total = computed(() => data.value?.total ?? 0)

const statusOptions = [
  { label: 'All statuses', value: '' },
  { label: 'Draft', value: 'draft' },
  { label: 'Active', value: 'active' },
  { label: 'Archived', value: 'archived' },
]

const columns = [
  { accessorKey: 'image', header: '', size: 60 },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'sku', header: 'SKU' },
  { accessorKey: 'price', header: 'Price' },
  { accessorKey: 'inventory', header: 'Inventory' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'actions', header: '', size: 100 },
]

function statusColor(s?: string | null): 'primary' | 'success' | 'warning' | 'error' | 'neutral' {
  if (s === 'active') return 'success'
  if (s === 'draft') return 'warning'
  if (s === 'archived') return 'neutral'
  return 'neutral'
}

function inventoryLabel(p: Product): string {
  if (p.inventoryQuantity != null) return String(p.inventoryQuantity)
  return p.inStock ? 'In stock' : 'Out of stock'
}

const confirmDeleteOpen = ref(false)
const pendingDelete = ref<Product | null>(null)
const deleting = ref(false)

function askDelete(p: Product) {
  pendingDelete.value = p
  confirmDeleteOpen.value = true
}

async function confirmDelete() {
  if (!pendingDelete.value) return
  deleting.value = true
  try {
    await $fetch(`/api/admin/products/${pendingDelete.value.id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    toast.add({ title: 'Product deleted', color: 'success' })
    confirmDeleteOpen.value = false
    pendingDelete.value = null
    await refresh()
  }
  catch (err: any) {
    toast.add({ title: 'Could not delete', description: err?.message, color: 'error' })
  }
  finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-highlighted">
          Products
        </h1>
        <p class="text-sm text-muted mt-1">
          {{ total }} total
        </p>
      </div>
      <UButton
        to="/admin/products/new"
        icon="i-heroicons-plus-20-solid"
        color="primary"
      >
        New product
      </UButton>
    </header>

    <UCard>
      <div class="flex flex-col sm:flex-row gap-3">
        <UInput
          v-model="search"
          placeholder="Search name or SKU"
          icon="i-heroicons-magnifying-glass-20-solid"
          class="sm:w-80"
        />
        <USelect
          v-model="status"
          :items="statusOptions"
          value-key="value"
          class="sm:w-56"
        />
      </div>
    </UCard>

    <UAlert
      v-if="error"
      color="error"
      variant="subtle"
      title="Could not load products"
      :description="error.message"
      icon="i-heroicons-exclamation-triangle-20-solid"
    />

    <UCard v-if="!pending && items.length === 0">
      <div class="flex flex-col items-center text-center py-10 gap-3">
        <UIcon name="i-heroicons-cube-20-solid" class="text-4xl text-dimmed" />
        <div>
          <p class="font-medium text-highlighted">
            No products yet
          </p>
          <p class="text-sm text-muted mt-1">
            Add your first product to start selling.
          </p>
        </div>
        <UButton to="/admin/products/new" icon="i-heroicons-plus-20-solid" color="primary">
          New product
        </UButton>
      </div>
    </UCard>

    <UCard v-else>
      <UTable :data="items" :columns="columns" :loading="pending">
        <template #image-cell="{ row }">
          <div class="w-10 h-10 rounded bg-elevated overflow-hidden flex items-center justify-center">
            <img
              v-if="row.original.primaryImage?.url"
              :src="row.original.primaryImage.url"
              :alt="row.original.primaryImage.altText || ''"
              class="w-full h-full object-cover"
            >
            <UIcon v-else name="i-heroicons-photo-20-solid" class="text-muted" />
          </div>
        </template>
        <template #name-cell="{ row }">
          <div class="flex flex-col">
            <NuxtLink
              :to="`/admin/products/${row.original.id}/edit`"
              class="font-medium text-highlighted hover:text-primary"
            >
              {{ t(row.original.name) }}
            </NuxtLink>
            <span
              v-if="row.original.name?.ar && row.original.name.ar !== t(row.original.name)"
              class="text-xs text-muted"
              dir="rtl"
            >
              {{ row.original.name.ar }}
            </span>
          </div>
        </template>
        <template #sku-cell="{ row }">
          <span class="text-sm text-muted">{{ row.original.sku || '—' }}</span>
        </template>
        <template #price-cell="{ row }">
          {{ formatPrice(row.original.price) || '—' }}
        </template>
        <template #inventory-cell="{ row }">
          <span class="text-sm">{{ inventoryLabel(row.original) }}</span>
        </template>
        <template #status-cell="{ row }">
          <UBadge :color="statusColor(row.original.status)" variant="subtle" size="sm">
            {{ row.original.status || 'unknown' }}
          </UBadge>
        </template>
        <template #actions-cell="{ row }">
          <div class="flex items-center justify-end gap-1">
            <UButton
              :to="`/admin/products/${row.original.id}/edit`"
              icon="i-heroicons-pencil-square-20-solid"
              variant="ghost"
              color="neutral"
              size="sm"
            />
            <UButton
              icon="i-heroicons-trash-20-solid"
              variant="ghost"
              color="error"
              size="sm"
              @click="askDelete(row.original)"
            />
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

    <UModal v-model:open="confirmDeleteOpen">
      <template #content>
        <div class="p-6 flex flex-col gap-4">
          <h3 class="text-lg font-semibold text-highlighted">
            Delete product?
          </h3>
          <p class="text-sm text-muted">
            "{{ pendingDelete ? t(pendingDelete.name) : '' }}" will be removed permanently. This cannot be undone.
          </p>
          <div class="flex justify-end gap-2">
            <UButton variant="ghost" color="neutral" @click="confirmDeleteOpen = false">
              Cancel
            </UButton>
            <UButton color="error" :loading="deleting" @click="confirmDelete">
              Delete product
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
