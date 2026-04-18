<script setup lang="ts">
// ---------------------------------------------------------------------------
// /admin/customers/:id — detail page. Panels: Profile, Addresses, Orders,
// Danger zone (delete). Read-only — customer profile edits stay on the
// buyer-facing storefront (they edit their own account).
//
// Orders panel: second useFetch to /api/admin/orders?customerId=:id.
// Click a row → existing /admin/orders/:id.
// Delete: hard-delete (admin.deleteCustomer). Platform may FK-block if the
// customer has orders — surface the error in a toast.
// ---------------------------------------------------------------------------

import type { Address, Customer, Order, PaginatedResult } from '@commercejs/types'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
  ssr: false,
})

const route = useRoute()
const toast = useToast()
const { formatPrice } = usePrice()

const id = computed(() => route.params.id as string)

const { data, pending, error } = await useFetch<Customer>(
  () => `/api/admin/customers/${id.value}`,
  {
    credentials: 'include',
    server: false,
    key: computed(() => `admin-customer-${id.value}`),
  },
)

const customer = computed(() => data.value)

const { data: ordersData, pending: ordersPending } = await useFetch<PaginatedResult<Order>>(
  '/api/admin/orders',
  {
    credentials: 'include',
    server: false,
    query: computed(() => ({ customerId: id.value, perPage: 50 })),
    key: computed(() => `admin-customer-orders-${id.value}`),
  },
)

const orders = computed(() => ordersData.value?.items ?? [])

function fullName(c: Customer | null | undefined): string {
  if (!c) return ''
  return [c.firstName, c.lastName].filter(Boolean).join(' ').trim()
}

function addressLines(addr: Address): string[] {
  const lines: string[] = []
  const name = [addr.firstName, addr.lastName].filter(Boolean).join(' ').trim()
  if (name) lines.push(name)
  if (addr.street) lines.push([addr.street, addr.street2].filter(Boolean).join(', '))
  const cityLine = [addr.district, addr.city, addr.state, addr.postalCode].filter(Boolean).join(', ')
  if (cityLine) lines.push(cityLine)
  if (addr.country) lines.push(addr.country)
  if (addr.phone) lines.push(addr.phone)
  if (addr.nationalAddress) lines.push(`National address: ${addr.nationalAddress}`)
  return lines
}

function statusColor(s?: string | null): 'primary' | 'info' | 'success' | 'warning' | 'error' | 'neutral' {
  if (s === 'shipped' || s === 'delivered') return 'success'
  if (s === 'processing') return 'info'
  if (s === 'refunded') return 'warning'
  if (s === 'cancelled' || s === 'returned') return 'error'
  return 'neutral'
}

function formatDate(iso?: string): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString()
  }
  catch {
    return iso
  }
}

// ---- delete ----

const deleteOpen = ref(false)
const deleteSubmitting = ref(false)

async function submitDelete() {
  if (!customer.value) return
  deleteSubmitting.value = true
  try {
    await $fetch(`/api/admin/customers/${customer.value.id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    toast.add({ title: 'Customer deleted', color: 'success' })
    deleteOpen.value = false
    await navigateTo('/admin/customers')
  }
  catch (err: any) {
    toast.add({
      title: 'Could not delete customer',
      description: err?.data?.message ?? err?.message,
      color: 'error',
    })
  }
  finally {
    deleteSubmitting.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div>
      <UButton
        to="/admin/customers"
        icon="i-heroicons-arrow-left-20-solid"
        variant="ghost"
        color="neutral"
        size="sm"
      >
        Back to customers
      </UButton>
    </div>

    <UAlert
      v-if="error"
      color="error"
      variant="subtle"
      title="Could not load customer"
      :description="error.message"
      icon="i-heroicons-exclamation-triangle-20-solid"
    />

    <div v-if="pending && !customer" class="text-sm text-muted">
      Loading customer…
    </div>

    <template v-if="customer">
      <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-highlighted" dir="auto">
            {{ fullName(customer) || customer.email }}
          </h1>
          <p class="text-sm text-muted mt-1" dir="auto">
            {{ customer.email }} · joined {{ formatDate(customer.createdAt) }}
          </p>
        </div>
      </header>

      <p class="text-xs text-muted -mt-2">
        Customers edit their own profile from the storefront — this page is read-only.
      </p>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- Profile -->
        <UCard>
          <template #header>
            <h2 class="font-semibold text-highlighted">
              Profile
            </h2>
          </template>
          <dl class="text-sm flex flex-col gap-2">
            <div class="flex justify-between gap-4">
              <dt class="text-muted">Email</dt>
              <dd class="text-highlighted text-right truncate" dir="auto">{{ customer.email }}</dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-muted">First name</dt>
              <dd class="text-highlighted text-right" dir="auto">{{ customer.firstName || '—' }}</dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-muted">Last name</dt>
              <dd class="text-highlighted text-right" dir="auto">{{ customer.lastName || '—' }}</dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-muted">Phone</dt>
              <dd class="text-highlighted text-right">{{ customer.phone || '—' }}</dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-muted">Joined</dt>
              <dd class="text-highlighted text-right">{{ formatDate(customer.createdAt) }}</dd>
            </div>
            <div v-if="customer.updatedAt && customer.updatedAt !== customer.createdAt" class="flex justify-between gap-4">
              <dt class="text-muted">Updated</dt>
              <dd class="text-highlighted text-right">{{ formatDate(customer.updatedAt) }}</dd>
            </div>
          </dl>
        </UCard>

        <!-- Addresses -->
        <UCard class="lg:col-span-2">
          <template #header>
            <h2 class="font-semibold text-highlighted">
              Addresses ({{ customer.addresses.length }})
            </h2>
          </template>
          <div v-if="customer.addresses.length === 0" class="text-sm text-muted">
            No saved addresses.
          </div>
          <ul v-else class="flex flex-col divide-y divide-default">
            <li
              v-for="addr in customer.addresses"
              :key="addr.id"
              class="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3"
            >
              <div class="text-sm flex flex-col gap-0.5 min-w-0" dir="auto">
                <p
                  v-for="(line, i) in addressLines(addr)"
                  :key="i"
                  :class="i === 0 ? 'text-highlighted font-medium' : 'text-muted'"
                >
                  {{ line }}
                </p>
              </div>
              <UBadge
                v-if="addr.isDefault || customer.defaultAddressId === addr.id"
                color="primary"
                variant="subtle"
                size="sm"
                class="shrink-0"
              >
                Default
              </UBadge>
            </li>
          </ul>
        </UCard>

        <!-- Orders -->
        <UCard class="lg:col-span-3">
          <template #header>
            <div class="flex items-center justify-between gap-2">
              <h2 class="font-semibold text-highlighted">
                Orders ({{ orders.length }})
              </h2>
              <span v-if="ordersPending" class="text-xs text-muted">Loading…</span>
            </div>
          </template>
          <div v-if="!ordersPending && orders.length === 0" class="text-sm text-muted">
            This customer hasn't placed any orders yet.
          </div>
          <ul v-else class="flex flex-col divide-y divide-default">
            <li
              v-for="o in orders"
              :key="o.id"
              class="py-3 first:pt-0 last:pb-0 flex items-center gap-3"
            >
              <div class="flex-1 min-w-0">
                <NuxtLink
                  :to="`/admin/orders/${o.id}`"
                  class="font-medium text-highlighted hover:text-primary"
                >
                  {{ o.orderNumber }}
                </NuxtLink>
                <p class="text-xs text-muted">{{ formatDate(o.createdAt) }}</p>
              </div>
              <div class="text-sm text-highlighted shrink-0">
                {{ formatPrice(o.totals?.total) }}
              </div>
              <UBadge :color="statusColor(o.status)" variant="subtle" size="sm">
                {{ o.status }}
              </UBadge>
            </li>
          </ul>
        </UCard>

        <!-- Danger zone -->
        <UCard class="lg:col-span-3 border-error">
          <template #header>
            <h2 class="font-semibold text-error">
              Danger zone
            </h2>
          </template>
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p class="text-sm text-highlighted font-medium">
                Delete customer
              </p>
              <p class="text-xs text-muted mt-1">
                This permanently removes the customer and their saved addresses. Existing orders may block deletion.
              </p>
            </div>
            <UButton
              color="error"
              variant="soft"
              icon="i-heroicons-trash-20-solid"
              @click="deleteOpen = true"
            >
              Delete customer
            </UButton>
          </div>
        </UCard>
      </div>

      <!-- Delete modal -->
      <UModal v-model:open="deleteOpen">
        <template #content>
          <div class="p-6 flex flex-col gap-4">
            <h3 class="text-lg font-semibold text-highlighted">
              Delete this customer?
            </h3>
            <p class="text-sm text-muted" dir="auto">
              {{ customer.email }} will be permanently deleted, along with their saved addresses. This cannot be undone.
            </p>
            <p class="text-sm text-muted">
              If the customer has existing orders, the delete may be blocked — delete or anonymize those orders first.
            </p>
            <div class="flex justify-end gap-2">
              <UButton variant="ghost" color="neutral" :disabled="deleteSubmitting" @click="deleteOpen = false">
                Cancel
              </UButton>
              <UButton color="error" :loading="deleteSubmitting" @click="submitDelete">
                Delete customer
              </UButton>
            </div>
          </div>
        </template>
      </UModal>
    </template>
  </div>
</template>
