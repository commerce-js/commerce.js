<script setup lang="ts">
// ---------------------------------------------------------------------------
// /admin/orders/:id — order detail page. Panels: Order summary, Items,
// Customer, Shipping, Billing, Actions. Two action modals: Mark Fulfilled
// (tracking# / URL / note) and Refund (note). Buttons are disabled when
// the current status forbids the action — client-side guard only; the
// server is the source of truth.
//
// No History panel: admin.getOrder returns only Order with no audit trail
// surfaced on the AdminAPI. Status-change history lives in the platform
// domain but isn't exposed to the admin surface — out of scope for T05.
// ---------------------------------------------------------------------------

import type { Order } from '@commercejs/types'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
  ssr: false,
})

const route = useRoute()
const toast = useToast()
const { t } = useLocalizedString()
const { formatPrice } = usePrice()

const id = computed(() => route.params.id as string)

const { data, pending, error, refresh } = await useFetch<Order>(
  () => `/api/admin/orders/${id.value}`,
  {
    credentials: 'include',
    server: false,
    key: computed(() => `admin-order-${id.value}`),
  },
)

const order = computed(() => data.value)

// ---- status helpers ----

function statusColor(s?: string | null): 'primary' | 'info' | 'success' | 'warning' | 'error' | 'neutral' {
  if (s === 'shipped' || s === 'delivered') return 'success'
  if (s === 'processing') return 'info'
  if (s === 'refunded') return 'warning'
  if (s === 'cancelled' || s === 'returned') return 'error'
  return 'neutral'
}

const canFulfill = computed(() => {
  const s = order.value?.status
  return s === 'pending' || s === 'processing'
})

const canRefund = computed(() => {
  const s = order.value?.status
  return s === 'processing' || s === 'shipped' || s === 'delivered'
})

// ---- address rendering ----

function addressLines(addr: any): string[] {
  if (!addr || typeof addr !== 'object') return []
  const name = [addr.firstName, addr.lastName].filter(Boolean).join(' ').trim()
  const lines: string[] = []
  if (name) lines.push(name)
  else if (addr.name) lines.push(addr.name)
  if (addr.street) lines.push([addr.street, addr.street2].filter(Boolean).join(', '))
  const cityLine = [addr.district, addr.city, addr.state, addr.postalCode].filter(Boolean).join(', ')
  if (cityLine) lines.push(cityLine)
  if (addr.country) lines.push(addr.country)
  if (addr.nationalAddress) lines.push(`National address: ${addr.nationalAddress}`)
  return lines
}

function contactLines(addr: any): string[] {
  if (!addr || typeof addr !== 'object') return []
  const out: string[] = []
  if (addr.email) out.push(addr.email)
  if (addr.phone) out.push(addr.phone)
  return out
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

// ---- actions ----

const fulfillOpen = ref(false)
const refundOpen = ref(false)

const trackingNumber = ref('')
const trackingUrl = ref('')
const fulfillNote = ref('')
const fulfillSubmitting = ref(false)

const refundNote = ref('')
const refundSubmitting = ref(false)

function openFulfill() {
  trackingNumber.value = order.value?.trackingNumber ?? ''
  trackingUrl.value = order.value?.trackingUrl ?? ''
  fulfillNote.value = ''
  fulfillOpen.value = true
}

async function submitFulfill() {
  if (!order.value) return
  fulfillSubmitting.value = true
  try {
    await $fetch(`/api/admin/orders/${order.value.id}/fulfill`, {
      method: 'POST',
      credentials: 'include',
      body: {
        trackingNumber: trackingNumber.value || undefined,
        trackingUrl: trackingUrl.value || undefined,
        note: fulfillNote.value || undefined,
      },
    })
    toast.add({ title: 'Order fulfilled', color: 'success' })
    fulfillOpen.value = false
    await refresh()
  }
  catch (err: any) {
    toast.add({
      title: 'Could not fulfill order',
      description: err?.data?.message ?? err?.message,
      color: 'error',
    })
  }
  finally {
    fulfillSubmitting.value = false
  }
}

function openRefund() {
  refundNote.value = ''
  refundOpen.value = true
}

async function submitRefund() {
  if (!order.value) return
  refundSubmitting.value = true
  try {
    await $fetch(`/api/admin/orders/${order.value.id}/refund`, {
      method: 'POST',
      credentials: 'include',
      body: { note: refundNote.value || undefined },
    })
    toast.add({ title: 'Order refunded', color: 'success' })
    refundOpen.value = false
    await refresh()
  }
  catch (err: any) {
    toast.add({
      title: 'Could not refund order',
      description: err?.data?.message ?? err?.message,
      color: 'error',
    })
  }
  finally {
    refundSubmitting.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div>
      <UButton
        to="/admin/orders"
        icon="i-heroicons-arrow-left-20-solid"
        variant="ghost"
        color="neutral"
        size="sm"
      >
        Back to orders
      </UButton>
    </div>

    <UAlert
      v-if="error"
      color="error"
      variant="subtle"
      title="Could not load order"
      :description="error.message"
      icon="i-heroicons-exclamation-triangle-20-solid"
    />

    <div v-if="pending && !order" class="text-sm text-muted">
      Loading order…
    </div>

    <template v-if="order">
      <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-highlighted">
            Order {{ order.orderNumber }}
          </h1>
          <p class="text-sm text-muted mt-1">
            Placed {{ formatDate(order.createdAt) }}
          </p>
        </div>
        <div class="flex items-center gap-2">
          <UBadge :color="statusColor(order.status)" variant="subtle" size="md">
            {{ order.status }}
          </UBadge>
        </div>
      </header>

      <!-- Actions -->
      <UCard>
        <template #header>
          <h2 class="font-semibold text-highlighted">
            Actions
          </h2>
        </template>
        <div class="flex flex-wrap gap-2">
          <UButton
            color="primary"
            icon="i-heroicons-truck-20-solid"
            :disabled="!canFulfill"
            @click="openFulfill"
          >
            Mark fulfilled
          </UButton>
          <UButton
            color="warning"
            variant="soft"
            icon="i-heroicons-arrow-uturn-left-20-solid"
            :disabled="!canRefund"
            @click="openRefund"
          >
            Refund
          </UButton>
        </div>
        <p v-if="!canFulfill && !canRefund" class="text-xs text-muted mt-3">
          No actions available for orders in status "{{ order.status }}".
        </p>
      </UCard>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- Items -->
        <UCard class="lg:col-span-2">
          <template #header>
            <h2 class="font-semibold text-highlighted">
              Items ({{ order.items.length }})
            </h2>
          </template>

          <ul class="flex flex-col divide-y divide-default">
            <li
              v-for="item in order.items"
              :key="item.id"
              class="py-3 first:pt-0 last:pb-0 flex items-center gap-3"
            >
              <div class="w-12 h-12 rounded bg-elevated overflow-hidden flex items-center justify-center shrink-0">
                <img
                  v-if="item.image?.url"
                  :src="item.image.url"
                  :alt="item.image.altText || ''"
                  class="w-full h-full object-cover"
                >
                <UIcon v-else name="i-heroicons-cube-20-solid" class="text-muted" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-medium text-highlighted truncate" dir="auto">
                  {{ t(item.name) }}
                </p>
                <p class="text-xs text-muted">
                  Qty {{ item.quantity }} · {{ formatPrice(item.price) }}
                </p>
              </div>
              <div class="text-sm font-medium text-highlighted shrink-0">
                {{ formatPrice(item.totalPrice) }}
              </div>
            </li>
          </ul>
        </UCard>

        <!-- Order summary -->
        <UCard>
          <template #header>
            <h2 class="font-semibold text-highlighted">
              Order
            </h2>
          </template>
          <dl class="text-sm flex flex-col gap-2">
            <div class="flex justify-between">
              <dt class="text-muted">Number</dt>
              <dd class="text-highlighted font-medium">{{ order.orderNumber }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-muted">Status</dt>
              <dd>
                <UBadge :color="statusColor(order.status)" variant="subtle" size="sm">
                  {{ order.status }}
                </UBadge>
              </dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-muted">Placed</dt>
              <dd class="text-highlighted">{{ formatDate(order.createdAt) }}</dd>
            </div>
            <div v-if="order.paymentMethod" class="flex justify-between">
              <dt class="text-muted">Payment</dt>
              <dd class="text-highlighted" dir="auto">{{ t(order.paymentMethod.name) }}</dd>
            </div>
            <UDivider class="my-2" />
            <div class="flex justify-between">
              <dt class="text-muted">Subtotal</dt>
              <dd class="text-highlighted">{{ formatPrice(order.totals.subtotal) }}</dd>
            </div>
            <div v-if="order.totals.shipping" class="flex justify-between">
              <dt class="text-muted">Shipping</dt>
              <dd class="text-highlighted">{{ formatPrice(order.totals.shipping) }}</dd>
            </div>
            <div v-if="order.totals.tax" class="flex justify-between">
              <dt class="text-muted">Tax</dt>
              <dd class="text-highlighted">{{ formatPrice(order.totals.tax) }}</dd>
            </div>
            <div v-if="order.totals.discount" class="flex justify-between">
              <dt class="text-muted">Discount</dt>
              <dd class="text-highlighted">−{{ formatPrice(order.totals.discount) }}</dd>
            </div>
            <div class="flex justify-between text-base font-semibold pt-2 border-t border-default">
              <dt>Total</dt>
              <dd>{{ formatPrice(order.totals.total) }}</dd>
            </div>
          </dl>
        </UCard>

        <!-- Customer -->
        <UCard>
          <template #header>
            <h2 class="font-semibold text-highlighted">
              Customer
            </h2>
          </template>
          <div v-if="contactLines(order.shippingAddress).length || order.customerId" class="text-sm flex flex-col gap-1">
            <p
              v-for="(line, i) in contactLines(order.shippingAddress)"
              :key="i"
              class="text-highlighted"
              dir="auto"
            >
              {{ line }}
            </p>
            <p v-if="order.customerId" class="text-xs text-muted mt-2">
              Customer ID: {{ order.customerId }}
            </p>
          </div>
          <p v-else class="text-sm text-muted">
            Guest checkout — no customer contact on file.
          </p>
        </UCard>

        <!-- Shipping -->
        <UCard>
          <template #header>
            <h2 class="font-semibold text-highlighted">
              Shipping
            </h2>
          </template>
          <div v-if="order.requiresShipping" class="text-sm flex flex-col gap-2">
            <div v-if="addressLines(order.shippingAddress).length">
              <p
                v-for="(line, i) in addressLines(order.shippingAddress)"
                :key="i"
                class="text-highlighted"
                dir="auto"
              >
                {{ line }}
              </p>
            </div>
            <p v-else class="text-muted">No shipping address on file.</p>

            <div v-if="order.shippingMethod" class="mt-2 pt-2 border-t border-default">
              <p class="text-muted">Method</p>
              <p class="text-highlighted" dir="auto">{{ t(order.shippingMethod.name) }}</p>
            </div>

            <div v-if="order.trackingNumber || order.trackingUrl" class="mt-2 pt-2 border-t border-default">
              <p class="text-muted">Tracking</p>
              <p v-if="order.trackingNumber" class="text-highlighted">{{ order.trackingNumber }}</p>
              <a
                v-if="order.trackingUrl"
                :href="order.trackingUrl"
                target="_blank"
                rel="noopener"
                class="text-primary hover:underline break-all"
              >
                {{ order.trackingUrl }}
              </a>
            </div>
          </div>
          <p v-else class="text-sm text-muted">
            No shipping required for this order.
          </p>
        </UCard>

        <!-- Billing -->
        <UCard>
          <template #header>
            <h2 class="font-semibold text-highlighted">
              Billing
            </h2>
          </template>
          <div v-if="addressLines(order.billingAddress).length" class="text-sm flex flex-col gap-1">
            <p
              v-for="(line, i) in addressLines(order.billingAddress)"
              :key="i"
              class="text-highlighted"
              dir="auto"
            >
              {{ line }}
            </p>
          </div>
          <p v-else class="text-sm text-muted">
            Same as shipping, or not captured.
          </p>
        </UCard>
      </div>

      <!-- Fulfill modal -->
      <UModal v-model:open="fulfillOpen">
        <template #content>
          <div class="p-6 flex flex-col gap-4">
            <h3 class="text-lg font-semibold text-highlighted">
              Mark order fulfilled
            </h3>
            <p class="text-sm text-muted">
              The order will move to "shipped". Tracking info is optional but recommended.
            </p>
            <UFormField label="Tracking number">
              <UInput v-model="trackingNumber" placeholder="e.g. AR123456789BH" class="w-full" />
            </UFormField>
            <UFormField label="Tracking URL">
              <UInput v-model="trackingUrl" placeholder="https://…" type="url" class="w-full" />
            </UFormField>
            <UFormField label="Internal note (optional)">
              <UTextarea v-model="fulfillNote" :rows="2" class="w-full" />
            </UFormField>
            <div class="flex justify-end gap-2">
              <UButton variant="ghost" color="neutral" :disabled="fulfillSubmitting" @click="fulfillOpen = false">
                Cancel
              </UButton>
              <UButton color="primary" :loading="fulfillSubmitting" @click="submitFulfill">
                Mark fulfilled
              </UButton>
            </div>
          </div>
        </template>
      </UModal>

      <!-- Refund modal -->
      <UModal v-model:open="refundOpen">
        <template #content>
          <div class="p-6 flex flex-col gap-4">
            <h3 class="text-lg font-semibold text-highlighted">
              Refund order
            </h3>
            <p class="text-sm text-muted">
              The order will move to "refunded". This does not trigger a payment-provider refund — process that separately in your payment dashboard.
            </p>
            <UFormField label="Reason / note (optional)">
              <UTextarea v-model="refundNote" :rows="3" class="w-full" />
            </UFormField>
            <div class="flex justify-end gap-2">
              <UButton variant="ghost" color="neutral" :disabled="refundSubmitting" @click="refundOpen = false">
                Cancel
              </UButton>
              <UButton color="warning" :loading="refundSubmitting" @click="submitRefund">
                Refund order
              </UButton>
            </div>
          </div>
        </template>
      </UModal>
    </template>
  </div>
</template>
