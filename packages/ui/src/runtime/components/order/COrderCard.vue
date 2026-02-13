<script setup lang="ts">
import type { Order, OrderStatus } from '@commercejs/types'

/**
 * COrderCard — Order summary card for order listing pages.
 * Shows order number, status, date, item count, and total.
 */

export interface OrderCardProps {
  order: Order
  /** Per-instance theme overrides */
  ui?: Partial<{
    root: any
    header: any
    items: any
    footer: any
  }>
}

const props = defineProps<OrderCardProps>()

function t(value: any): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  return value.en || value.ar || Object.values(value)[0] || ''
}

const statusColor = computed(() => {
  const map: Record<OrderStatus, string> = {
    pending: 'warning',
    processing: 'info',
    shipped: 'primary',
    delivered: 'success',
    cancelled: 'error',
    refunded: 'neutral',
    returned: 'neutral',
  }
  return map[props.order.status] || 'neutral'
})

const statusLabel = computed(() => {
  const map: Record<OrderStatus, string> = {
    pending: 'Pending',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    refunded: 'Refunded',
    returned: 'Returned',
  }
  return map[props.order.status] || props.order.status
})

const formattedDate = computed(() => new Date(props.order.createdAt).toLocaleDateString())

// Resolve theme from app.config
const appConfig = useAppConfig()
const theme = computed(() => (appConfig.ui as any)?.orderCard ?? {})

const slotClasses = computed(() => {
  const base = theme.value?.slots ?? {}
  const merge = (slot: string) => [base[slot], props.ui?.[slot as keyof typeof props.ui]]
  return {
    root: merge('root'),
    header: merge('header'),
    items: merge('items'),
    footer: merge('footer'),
  }
})
</script>

<template>
  <div :class="['rounded-xl ring ring-default bg-default overflow-hidden', slotClasses.root]">
    <!-- Header -->
    <div :class="['flex items-center justify-between px-5 py-3 bg-elevated', slotClasses.header]">
      <div>
        <span class="text-sm font-medium text-highlighted">#{{ order.orderNumber }}</span>
        <span class="text-xs text-muted ms-2">{{ formattedDate }}</span>
      </div>
      <UBadge :color="statusColor as any" size="sm" variant="subtle">{{ statusLabel }}</UBadge>
    </div>

    <!-- Item thumbnails -->
    <div :class="['px-5 py-4', slotClasses.items]">
      <slot name="items" :items="order.items">
        <div class="flex items-center gap-3">
          <div class="flex -space-x-2">
            <div
              v-for="(item, i) in order.items.slice(0, 4)"
              :key="item.id"
              class="size-10 rounded-lg ring-2 ring-default overflow-hidden bg-elevated shrink-0"
            >
              <img v-if="item.image" :src="item.image.url" :alt="t(item.name)" class="size-full object-cover" />
              <div v-else class="size-full flex items-center justify-center text-xs text-muted">
                {{ t(item.name).charAt(0) }}
              </div>
            </div>
          </div>
          <span class="text-sm text-muted">
            {{ order.items.length }} item{{ order.items.length !== 1 ? 's' : '' }}
            <span v-if="order.items.length > 4" class="text-xs">(+{{ order.items.length - 4 }} more)</span>
          </span>
        </div>
      </slot>
    </div>

    <!-- Footer -->
    <div :class="['flex items-center justify-between px-5 py-3 bg-elevated', slotClasses.footer]">
      <span class="text-sm font-semibold text-highlighted">{{ order.totals.total?.formatted }}</span>
      <slot name="actions">
        <UButton :to="`/orders/${order.id}`" size="xs" variant="outline" color="neutral" trailing-icon="i-heroicons-chevron-right-20-solid">
          View Details
        </UButton>
      </slot>
    </div>
  </div>
</template>
