<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const router = useRouter()
const orderId = route.params.id as string
const adminClient = useAdminClient()
const toast = useToast()

const { data: order, status, refresh } = useAsyncData(
  `admin-order-${orderId}`,
  () => adminClient.getOrder(orderId)
)

const { formatCurrency } = useFormatCurrency()

const statusColor = (s: string) => {
  switch (s) {
    case 'completed': return 'success' as const
    case 'processing': return 'warning' as const
    case 'shipped': return 'info' as const
    case 'refunded': return 'error' as const
    default: return 'neutral' as const
  }
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
  })
}

// ---- Fulfill Order ----
const showFulfillModal = ref(false)
const fulfillForm = reactive({
  trackingNumber: '',
  trackingUrl: '',
  note: '',
})
const fulfilling = ref(false)

async function handleFulfill() {
  fulfilling.value = true
  try {
    await adminClient.fulfillOrder(orderId, {
      trackingNumber: fulfillForm.trackingNumber || undefined,
      trackingUrl: fulfillForm.trackingUrl || undefined,
      note: fulfillForm.note || undefined,
    })
    toast.add({ title: 'Order fulfilled', description: `Order ${order.value?.orderNumber} has been marked as shipped.`, color: 'success' })
    showFulfillModal.value = false
    await refresh()
  } catch (e: any) {
    toast.add({ title: 'Failed to fulfill order', description: e.message || 'Something went wrong', color: 'error' })
  } finally {
    fulfilling.value = false
  }
}

// ---- Refund Order ----
const showRefundModal = ref(false)
const refundNote = ref('')
const refunding = ref(false)

async function handleRefund() {
  refunding.value = true
  try {
    await adminClient.refundOrder(orderId, refundNote.value || undefined)
    toast.add({ title: 'Order refunded', description: `Order ${order.value?.orderNumber} has been refunded.`, color: 'success' })
    showRefundModal.value = false
    await refresh()
  } catch (e: any) {
    toast.add({ title: 'Failed to refund order', description: e.message || 'Something went wrong', color: 'error' })
  } finally {
    refunding.value = false
  }
}

const canFulfill = computed(() => {
  const s = order.value?.status
  return s === 'pending' || s === 'processing'
})

const canRefund = computed(() => {
  const s = order.value?.status
  return s === 'completed' || s === 'shipped'
})
</script>

<template>
  <UDashboardPanel id="order-detail">
    <template #header>
      <UDashboardNavbar :title="order ? `Order ${order.orderNumber || order.id.slice(0, 8)}` : 'Order Details'">
        <template #leading>
          <UButton icon="i-lucide-arrow-left" variant="ghost" to="/store/orders" />
        </template>
        <template #right>
          <div class="flex items-center gap-2">
            <UBadge v-if="order" :color="statusColor(order.status)" variant="subtle">
              {{ order.status }}
            </UBadge>
            <UButton
              v-if="order && canFulfill"
              icon="i-lucide-truck"
              label="Fulfill"
              color="primary"
              size="sm"
              @click="showFulfillModal = true"
            />
            <UButton
              v-if="order && canRefund"
              icon="i-lucide-undo"
              label="Refund"
              color="error"
              variant="outline"
              size="sm"
              @click="showRefundModal = true"
            />
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Loading -->
      <div v-if="status === 'pending'" class="space-y-4 p-4">
        <div v-for="i in 3" :key="i" class="h-32 animate-pulse bg-muted/20 rounded" />
      </div>

      <!-- Order Data -->
      <div v-else-if="order" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Line Items -->
          <UCard>
            <template #header>
              <h3 class="font-semibold text-highlighted">Items</h3>
            </template>
            <div class="divide-y divide-default">
              <div v-for="item in order.items" :key="item.id" class="flex items-center gap-4 py-3">
                <img
                  v-if="item.image?.url"
                  :src="item.image.url"
                  :alt="typeof item.name === 'object' ? item.name.en : item.name"
                  class="size-12 rounded object-cover"
                />
                <div v-else class="size-12 rounded bg-muted/20 flex items-center justify-center">
                  <UIcon name="i-lucide-package" class="text-muted size-5" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-highlighted truncate">
                    {{ typeof item.name === 'object' ? item.name.en || item.name.ar : item.name }}
                  </p>
                  <p class="text-xs text-muted">Qty: {{ item.quantity }}</p>
                </div>
                <p class="text-sm font-medium text-highlighted">{{ formatCurrency(item.totalPrice) }}</p>
              </div>
            </div>
          </UCard>

          <!-- Totals -->
          <UCard>
            <template #header>
              <h3 class="font-semibold text-highlighted">Summary</h3>
            </template>
            <div class="space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-muted">Subtotal</span>
                <span class="text-highlighted">{{ formatCurrency(order.totals?.subtotal) }}</span>
              </div>
              <div v-if="order.totals?.shipping" class="flex justify-between text-sm">
                <span class="text-muted">Shipping</span>
                <span class="text-highlighted">{{ formatCurrency(order.totals.shipping) }}</span>
              </div>
              <div v-if="order.totals?.tax" class="flex justify-between text-sm">
                <span class="text-muted">Tax</span>
                <span class="text-highlighted">{{ formatCurrency(order.totals.tax) }}</span>
              </div>
              <div v-if="order.totals?.discount" class="flex justify-between text-sm">
                <span class="text-muted">Discount</span>
                <span class="text-success">-{{ formatCurrency(order.totals.discount) }}</span>
              </div>
              <div class="border-t border-default pt-2 flex justify-between font-semibold">
                <span class="text-highlighted">Total</span>
                <span class="text-highlighted">{{ formatCurrency(order.totals?.total) }}</span>
              </div>
            </div>
          </UCard>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Order Info -->
          <UCard>
            <template #header>
              <h3 class="font-semibold text-highlighted">Order Info</h3>
            </template>
            <div class="space-y-3 text-sm">
              <div>
                <span class="text-muted">Date</span>
                <p class="text-highlighted">{{ formatDate(order.createdAt) }}</p>
              </div>
              <div v-if="order.customerId">
                <span class="text-muted">Customer ID</span>
                <NuxtLink :to="`/store/customers/${order.customerId}`" class="text-primary hover:underline block">
                  {{ order.customerId.slice(0, 12) }}...
                </NuxtLink>
              </div>
              <div v-if="order.trackingNumber">
                <span class="text-muted">Tracking</span>
                <p class="text-highlighted font-mono">{{ order.trackingNumber }}</p>
              </div>
              <div v-if="order.note">
                <span class="text-muted">Note</span>
                <p class="text-highlighted">{{ order.note }}</p>
              </div>
            </div>
          </UCard>

          <!-- Shipping Address -->
          <UCard v-if="order.shippingAddress">
            <template #header>
              <h3 class="font-semibold text-highlighted">Shipping Address</h3>
            </template>
            <div class="text-sm text-highlighted space-y-1">
              <p>{{ order.shippingAddress.firstName }} {{ order.shippingAddress.lastName }}</p>
              <p class="text-muted">{{ order.shippingAddress.street }}</p>
              <p v-if="order.shippingAddress.street2" class="text-muted">{{ order.shippingAddress.street2 }}</p>
              <p class="text-muted">
                {{ order.shippingAddress.city }}<span v-if="order.shippingAddress.state">, {{ order.shippingAddress.state }}</span>
                {{ order.shippingAddress.postalCode }}
              </p>
              <p class="text-muted">{{ order.shippingAddress.country }}</p>
            </div>
          </UCard>

          <!-- Payment Method -->
          <UCard v-if="order.paymentMethod">
            <template #header>
              <h3 class="font-semibold text-highlighted">Payment</h3>
            </template>
            <p class="text-sm text-highlighted">
              {{ typeof order.paymentMethod.name === 'object' ? order.paymentMethod.name.en : order.paymentMethod.name }}
            </p>
          </UCard>
        </div>
      </div>

      <!-- Error State -->
      <div v-else class="text-center py-12">
        <UIcon name="i-lucide-alert-circle" class="text-error size-8 mb-2" />
        <p class="text-muted">Order not found</p>
        <UButton variant="outline" to="/store/orders" class="mt-4">Back to Orders</UButton>
      </div>
    </template>
  </UDashboardPanel>

  <!-- Fulfill Modal -->
  <UModal v-model:open="showFulfillModal">
    <template #content>
      <UCard>
        <template #header>
          <h3 class="font-semibold text-highlighted">Fulfill Order</h3>
        </template>
        <div class="space-y-4">
          <UFormField label="Tracking Number">
            <UInput v-model="fulfillForm.trackingNumber" placeholder="e.g. 1Z999AA10123456784" />
          </UFormField>
          <UFormField label="Tracking URL">
            <UInput v-model="fulfillForm.trackingUrl" placeholder="https://..." />
          </UFormField>
          <UFormField label="Note">
            <UTextarea v-model="fulfillForm.note" placeholder="Optional fulfillment note" />
          </UFormField>
        </div>
        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton variant="ghost" label="Cancel" @click="showFulfillModal = false" />
            <UButton
              color="primary"
              icon="i-lucide-truck"
              label="Mark as Fulfilled"
              :loading="fulfilling"
              @click="handleFulfill"
            />
          </div>
        </template>
      </UCard>
    </template>
  </UModal>

  <!-- Refund Modal -->
  <UModal v-model:open="showRefundModal">
    <template #content>
      <UCard>
        <template #header>
          <h3 class="font-semibold text-highlighted">Refund Order</h3>
        </template>
        <div class="space-y-4">
          <p class="text-sm text-muted">
            This will refund the full order amount of {{ formatCurrency(order?.totals?.total) }}.
          </p>
          <UFormField label="Reason (optional)">
            <UTextarea v-model="refundNote" placeholder="Reason for refund" />
          </UFormField>
        </div>
        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton variant="ghost" label="Cancel" @click="showRefundModal = false" />
            <UButton
              color="error"
              icon="i-lucide-undo"
              label="Confirm Refund"
              :loading="refunding"
              @click="handleRefund"
            />
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>
