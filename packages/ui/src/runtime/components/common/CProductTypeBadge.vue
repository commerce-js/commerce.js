<script setup lang="ts">
import { computed } from 'vue'
import type { ProductType } from '@commercejs/types'

/**
 * CProductTypeBadge — Small badge indicating a product's type.
 * Used on cards, listings, and detail pages.
 */

export interface ProductTypeBadgeProps {
  type: ProductType
  /** Per-instance theme overrides */
  ui?: Partial<{ root: any }>
}

const props = defineProps<ProductTypeBadgeProps>()

const config = computed(() => {
  const map: Record<ProductType, { label: string; icon: string; color: string }> = {
    physical: { label: 'Physical', icon: 'i-heroicons-cube', color: 'neutral' },
    digital: { label: 'Digital', icon: 'i-heroicons-arrow-down-tray', color: 'info' },
    service: { label: 'Service', icon: 'i-heroicons-wrench-screwdriver', color: 'primary' },
    event: { label: 'Event', icon: 'i-heroicons-ticket', color: 'warning' },
    subscription: { label: 'Subscription', icon: 'i-heroicons-arrow-path', color: 'success' },
    auction: { label: 'Auction', icon: 'i-heroicons-bolt', color: 'error' },
    rental: { label: 'Rental', icon: 'i-heroicons-calendar-days', color: 'info' },
    gift_card: { label: 'Gift Card', icon: 'i-heroicons-gift', color: 'primary' },
  }
  return map[props.type] || map.physical
})
</script>

<template>
  <UBadge :color="config.color as any" size="xs" variant="subtle" :class="props.ui?.root">
    <UIcon :name="config.icon" class="me-0.5" />
    {{ config.label }}
  </UBadge>
</template>
