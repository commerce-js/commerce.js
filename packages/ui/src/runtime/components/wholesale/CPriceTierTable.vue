<script setup lang="ts">
import { computed } from 'vue'
import { useAppConfig } from '#imports'
import type { PriceTier } from '@commercejs/types'

/**
 * CPriceTierTable — Displays volume-based pricing tiers for B2B/wholesale products.
 */

export interface PriceTierTableProps {
  /** Price tiers from product.priceTiers */
  tiers: PriceTier[]
  /** Currently selected / applicable quantity */
  currentQuantity?: number
  /** Per-instance theme overrides */
  ui?: Partial<{
    root: any
    row: any
    activeRow: any
  }>
}

const props = withDefaults(defineProps<PriceTierTableProps>(), {
  currentQuantity: 0,
})

function t(value: any): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  return value.en || value.ar || Object.values(value)[0] || ''
}

function isActiveTier(tier: PriceTier): boolean {
  if (props.currentQuantity < tier.minQuantity) return false
  if (tier.maxQuantity && props.currentQuantity > tier.maxQuantity) return false
  return true
}

// Resolve theme from app.config
const appConfig = useAppConfig()
const theme = computed(() => (appConfig.ui as any)?.priceTierTable ?? {})

const slotClasses = computed(() => {
  const base = theme.value?.slots ?? {}
  const merge = (slot: string) => [base[slot], props.ui?.[slot as keyof typeof props.ui]]
  return {
    root: merge('root'),
    row: merge('row'),
    activeRow: merge('activeRow'),
  }
})
</script>

<template>
  <div :class="['overflow-hidden rounded-lg ring ring-default', slotClasses.root]">
    <table class="w-full text-sm">
      <thead class="bg-elevated text-muted">
        <tr>
          <th class="text-start py-2 px-3 font-medium">Quantity</th>
          <th class="text-start py-2 px-3 font-medium">Price / Unit</th>
          <th v-if="tiers.some(t => t.label)" class="text-start py-2 px-3 font-medium">Tier</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(tier, i) in tiers"
          :key="i"
          :class="[
            'border-t border-default transition-colors',
            isActiveTier(tier) ? 'bg-primary/5 font-medium' : '',
            slotClasses.row,
            isActiveTier(tier) ? slotClasses.activeRow : '',
          ]"
        >
          <td class="py-2.5 px-3 text-highlighted">
            {{ tier.minQuantity }}{{ tier.maxQuantity ? ` – ${tier.maxQuantity}` : '+' }}
          </td>
          <td class="py-2.5 px-3">
            <span :class="isActiveTier(tier) ? 'text-primary font-semibold' : 'text-highlighted'">
              {{ tier.unitPrice.formatted }}
            </span>
          </td>
          <td v-if="tiers.some(t => t.label)" class="py-2.5 px-3 text-muted">
            {{ t(tier.label) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
