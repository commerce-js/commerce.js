<script setup lang="ts">
// ---------------------------------------------------------------------------
// /admin/customers — list page. Server-paginated + free-text search on
// email / name. CSR-only — $fetch lands on the dashboard Nitro (:3000)
// via the storefront-proxy rule.
// ---------------------------------------------------------------------------

import type { Customer, PaginatedResult } from '@commercejs/types'
import { refDebounced } from '@vueuse/core'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
  ssr: false,
})

const route = useRoute()
const router = useRouter()

const search = ref((route.query.q as string) || '')
const searchDebounced = refDebounced(search, 300)
const page = ref(Number(route.query.page) || 1)
const perPage = 20

watch(searchDebounced, () => { page.value = 1 })

watchEffect(() => {
  const q: Record<string, string> = {}
  if (searchDebounced.value) q.q = searchDebounced.value
  if (page.value > 1) q.page = String(page.value)
  router.replace({ query: q })
})

const queryParams = computed(() => {
  const p: Record<string, string | number> = { page: page.value, perPage }
  if (searchDebounced.value) p.search = searchDebounced.value
  return p
})

const { data, pending, error } = await useFetch<PaginatedResult<Customer>>(
  '/api/admin/customers',
  {
    credentials: 'include',
    server: false,
    query: queryParams,
    key: 'admin-customers-list',
  },
)

const items = computed(() => data.value?.items ?? [])
const total = computed(() => data.value?.total ?? 0)

const columns = [
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'phone', header: 'Phone' },
  { accessorKey: 'createdAt', header: 'Joined' },
  { accessorKey: 'actions', header: '', size: 100 },
]

function customerName(c: Customer): string {
  return [c.firstName, c.lastName].filter(Boolean).join(' ').trim() || '—'
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString()
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
          Customers
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
          placeholder="Search email or name"
          icon="i-heroicons-magnifying-glass-20-solid"
          class="sm:w-80"
        />
      </div>
    </UCard>

    <UAlert
      v-if="error"
      color="error"
      variant="subtle"
      title="Could not load customers"
      :description="error.message"
      icon="i-heroicons-exclamation-triangle-20-solid"
    />

    <UCard v-if="!pending && items.length === 0">
      <div class="flex flex-col items-center text-center py-10 gap-3">
        <UIcon name="i-heroicons-users-20-solid" class="text-4xl text-dimmed" />
        <div>
          <p class="font-medium text-highlighted">
            No customers yet
          </p>
          <p class="text-sm text-muted mt-1">
            Customers appear here after their first order or sign-up on your storefront.
          </p>
        </div>
      </div>
    </UCard>

    <UCard v-else>
      <UTable :data="items" :columns="columns" :loading="pending">
        <template #email-cell="{ row }">
          <NuxtLink
            :to="`/admin/customers/${row.original.id}`"
            class="font-medium text-highlighted hover:text-primary"
            dir="auto"
          >
            {{ row.original.email }}
          </NuxtLink>
        </template>
        <template #name-cell="{ row }">
          <span class="text-sm" dir="auto">{{ customerName(row.original) }}</span>
        </template>
        <template #phone-cell="{ row }">
          <span class="text-sm text-muted">{{ row.original.phone || '—' }}</span>
        </template>
        <template #createdAt-cell="{ row }">
          <span class="text-sm text-muted">{{ formatDate(row.original.createdAt) }}</span>
        </template>
        <template #actions-cell="{ row }">
          <div class="flex items-center justify-end gap-1">
            <UButton
              :to="`/admin/customers/${row.original.id}`"
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
