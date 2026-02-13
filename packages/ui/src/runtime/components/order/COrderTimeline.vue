<script setup lang="ts">
import type { OrderHistoryEntry } from '@commercejs/types'

/**
 * COrderTimeline — Displays order status history as a timeline.
 */

export interface OrderTimelineProps {
  entries: OrderHistoryEntry[]
  /** Per-instance theme overrides */
  ui?: Partial<{
    root: any
    entry: any
    dot: any
    line: any
  }>
}

const props = defineProps<OrderTimelineProps>()

const statusIcon = computed(() => (status: string) => {
  const map: Record<string, string> = {
    pending: 'i-heroicons-clock',
    processing: 'i-heroicons-cog-6-tooth',
    shipped: 'i-heroicons-truck',
    delivered: 'i-heroicons-check-circle',
    cancelled: 'i-heroicons-x-circle',
    refunded: 'i-heroicons-arrow-uturn-left',
    returned: 'i-heroicons-arrow-path',
  }
  return map[status] || 'i-heroicons-ellipsis-horizontal-circle'
})

const statusColor = computed(() => (status: string) => {
  const map: Record<string, string> = {
    pending: 'text-warning',
    processing: 'text-info',
    shipped: 'text-primary',
    delivered: 'text-success',
    cancelled: 'text-error',
    refunded: 'text-muted',
    returned: 'text-muted',
  }
  return map[status] || 'text-muted'
})

// Resolve theme from app.config
const appConfig = useAppConfig()
const theme = computed(() => (appConfig.ui as any)?.orderTimeline ?? {})

const slotClasses = computed(() => {
  const base = theme.value?.slots ?? {}
  const merge = (slot: string) => [base[slot], props.ui?.[slot as keyof typeof props.ui]]
  return {
    root: merge('root'),
    entry: merge('entry'),
    dot: merge('dot'),
    line: merge('line'),
  }
})
</script>

<template>
  <div :class="['relative', slotClasses.root]">
    <div
      v-for="(entry, i) in entries"
      :key="entry.timestamp || i"
      :class="['flex gap-4 pb-6 last:pb-0', slotClasses.entry]"
    >
      <!-- Timeline dot & line -->
      <div class="flex flex-col items-center">
        <div
          :class="[
            'size-8 rounded-full flex items-center justify-center ring-4 ring-default bg-default z-10',
            statusColor(entry.status),
            slotClasses.dot,
          ]"
        >
          <UIcon :name="statusIcon(entry.status)" class="text-lg" />
        </div>
        <div
          v-if="i < entries.length - 1"
          :class="['w-0.5 flex-1 bg-default mt-1', slotClasses.line]"
        />
      </div>

      <!-- Content -->
      <div class="flex-1 pt-1 min-w-0">
        <div class="flex items-center justify-between gap-2">
          <span class="font-medium text-sm text-highlighted capitalize">{{ entry.status.replace(/_/g, ' ') }}</span>
          <time class="text-xs text-muted shrink-0">
            {{ new Date(entry.timestamp).toLocaleString() }}
          </time>
        </div>
        <p v-if="entry.note" class="text-sm text-muted mt-0.5">{{ entry.note }}</p>
      </div>
    </div>
  </div>
</template>
