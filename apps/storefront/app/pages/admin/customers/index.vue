<script setup lang="ts">
// ---------------------------------------------------------------------------
// /admin/customers — merchant customers list. Two sources merged into one
// table:
//
//   1. Registered customers — fetched from /api/admin/customers. These are
//      buyers who created an account on the storefront. Clickable, deletable.
//
//   2. Guest buyers — derived client-side from /api/admin/orders (orders
//      with customerId == null). Grouped by email||phone so repeat guests
//      dedupe. Read-only rows with a "Guest" badge and a link to their
//      latest order.
//
// Why client-side: the platform doesn't model guest buyers as first-class
// records — they live inside order.shippingAddress/billingAddress JSON.
// For smoke + small merchants this is cheap; at scale we'll promote guests
// to a platform-side query (or create a Customer on checkout).
// ---------------------------------------------------------------------------

import type { Customer, Order, PaginatedResult } from '@commercejs/types'
import { refDebounced } from '@vueuse/core'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
  ssr: false,
})

interface RegisteredRow {
  source: 'registered'
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  phone: string | null
  createdAt: string
  orderCount: null
  latestOrderId: null
}

interface GuestRow {
  source: 'guest'
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  phone: string | null
  createdAt: string
  orderCount: number
  latestOrderId: string
}

type Row = RegisteredRow | GuestRow

const route = useRoute()
const router = useRouter()

const search = ref((route.query.q as string) || '')
const searchDebounced = refDebounced(search, 300)

watchEffect(() => {
  const q: Record<string, string> = {}
  if (searchDebounced.value) q.q = searchDebounced.value
  router.replace({ query: q })
})

// ---- Registered customers -------------------------------------------------

const registeredQuery = computed(() => {
  const p: Record<string, string | number> = { perPage: 100 }
  if (searchDebounced.value) p.search = searchDebounced.value
  return p
})

const { data: registeredData, pending: registeredPending, error: registeredError }
  = await useFetch<PaginatedResult<Customer>>(
    '/api/admin/customers',
    {
      credentials: 'include',
      server: false,
      query: registeredQuery,
      key: 'admin-customers-registered',
    },
  )

// ---- Guest buyers (derived from orders) -----------------------------------

const { data: ordersData, pending: ordersPending } = await useFetch<PaginatedResult<Order>>(
  '/api/admin/orders',
  {
    credentials: 'include',
    server: false,
    query: { perPage: 500 },
    key: 'admin-customers-orders',
  },
)

function readAddrField(addr: any, key: string): string {
  if (!addr || typeof addr !== 'object') return ''
  const v = addr[key]
  return typeof v === 'string' ? v.trim() : ''
}

const guestRows = computed<GuestRow[]>(() => {
  const byKey = new Map<string, GuestRow>()
  const orders = ordersData.value?.items ?? []

  for (const o of orders) {
    if (o.customerId) continue

    const email = readAddrField(o.billingAddress, 'email') || readAddrField(o.shippingAddress, 'email')
    const phone = readAddrField(o.shippingAddress, 'phone') || readAddrField(o.billingAddress, 'phone')
    const firstName = readAddrField(o.shippingAddress, 'firstName') || readAddrField(o.billingAddress, 'firstName')
    const lastName = readAddrField(o.shippingAddress, 'lastName') || readAddrField(o.billingAddress, 'lastName')

    const key = email || phone
    if (!key) continue

    const existing = byKey.get(key)
    if (existing) {
      existing.orderCount += 1
      // Keep the most-recent order's createdAt + id
      if (o.createdAt > existing.createdAt) {
        existing.createdAt = o.createdAt
        existing.latestOrderId = o.id
      }
      // Fill missing identity fields from later orders
      if (!existing.email && email) existing.email = email
      if (!existing.phone && phone) existing.phone = phone
      if (!existing.firstName && firstName) existing.firstName = firstName
      if (!existing.lastName && lastName) existing.lastName = lastName
    }
    else {
      byKey.set(key, {
        source: 'guest',
        id: `guest:${key}`,
        email: email || '',
        firstName: firstName || null,
        lastName: lastName || null,
        phone: phone || null,
        createdAt: o.createdAt,
        orderCount: 1,
        latestOrderId: o.id,
      })
    }
  }

  const all = Array.from(byKey.values())

  // Client-side search across guests (since they're not backed by the
  // server-side search param).
  const q = searchDebounced.value.trim().toLowerCase()
  if (!q) return all
  return all.filter((g) => {
    const name = [g.firstName, g.lastName].filter(Boolean).join(' ').toLowerCase()
    return (
      g.email.toLowerCase().includes(q)
      || name.includes(q)
      || (g.phone || '').toLowerCase().includes(q)
    )
  })
})

// ---- Merged rows ----------------------------------------------------------

const rows = computed<Row[]>(() => {
  const registered: RegisteredRow[] = (registeredData.value?.items ?? []).map(c => ({
    source: 'registered' as const,
    id: c.id,
    email: c.email,
    firstName: c.firstName,
    lastName: c.lastName,
    phone: c.phone,
    createdAt: c.createdAt,
    orderCount: null,
    latestOrderId: null,
  }))
  return [...registered, ...guestRows.value].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
})

const totalRegistered = computed(() => registeredData.value?.total ?? 0)
const totalGuests = computed(() => guestRows.value.length)
const totalCombined = computed(() => rows.value.length)

const pending = computed(() => registeredPending.value || ordersPending.value)
const error = computed(() => registeredError.value)

// ---- Table ---------------------------------------------------------------

const columns = [
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'phone', header: 'Phone' },
  { accessorKey: 'orders', header: 'Orders' },
  { accessorKey: 'createdAt', header: 'Last activity' },
  { accessorKey: 'actions', header: '', size: 120 },
]

function rowName(r: Row): string {
  return [r.firstName, r.lastName].filter(Boolean).join(' ').trim() || '—'
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
          {{ totalCombined }} total
          <span v-if="totalGuests > 0" class="text-dimmed">
            · {{ totalRegistered }} registered · {{ totalGuests }} guest{{ totalGuests === 1 ? '' : 's' }}
          </span>
        </p>
      </div>
    </header>

    <UCard>
      <div class="flex flex-col sm:flex-row sm:flex-wrap gap-3">
        <UInput
          v-model="search"
          placeholder="Search email, name, or phone"
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

    <UCard v-if="!pending && rows.length === 0">
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
      <UTable :data="rows" :columns="columns" :loading="pending">
        <template #email-cell="{ row }">
          <div class="flex items-center gap-2 min-w-0">
            <NuxtLink
              v-if="row.original.source === 'registered'"
              :to="`/admin/customers/${row.original.id}`"
              class="font-medium text-highlighted hover:text-primary truncate"
              dir="auto"
            >
              {{ row.original.email }}
            </NuxtLink>
            <span
              v-else
              class="font-medium text-highlighted truncate"
              dir="auto"
            >
              {{ row.original.email || '—' }}
            </span>
            <UBadge
              v-if="row.original.source === 'guest'"
              color="neutral"
              variant="subtle"
              size="xs"
              class="shrink-0"
            >
              Guest
            </UBadge>
          </div>
        </template>
        <template #name-cell="{ row }">
          <span class="text-sm" dir="auto">{{ rowName(row.original) }}</span>
        </template>
        <template #phone-cell="{ row }">
          <span class="text-sm text-muted">{{ row.original.phone || '—' }}</span>
        </template>
        <template #orders-cell="{ row }">
          <span class="text-sm text-muted">
            {{ row.original.orderCount ?? '—' }}
          </span>
        </template>
        <template #createdAt-cell="{ row }">
          <span class="text-sm text-muted">{{ formatDate(row.original.createdAt) }}</span>
        </template>
        <template #actions-cell="{ row }">
          <div class="flex items-center justify-end gap-1">
            <UButton
              v-if="row.original.source === 'registered'"
              :to="`/admin/customers/${row.original.id}`"
              variant="ghost"
              color="neutral"
              size="sm"
            >
              View
            </UButton>
            <UButton
              v-else
              :to="`/admin/orders/${row.original.latestOrderId}`"
              variant="ghost"
              color="neutral"
              size="sm"
              icon="i-heroicons-shopping-bag-20-solid"
              trailing
            >
              Latest order
            </UButton>
          </div>
        </template>
      </UTable>
    </UCard>
  </div>
</template>
