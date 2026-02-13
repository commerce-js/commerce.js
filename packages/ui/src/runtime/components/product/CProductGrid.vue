<script setup lang="ts">
import type { Product } from '@commercejs/types'

/**
 * CProductGrid — Responsive product grid layout.
 * Wraps CProductCard in a CSS grid with configurable columns.
 */

export interface ProductGridProps {
  /** Products to display */
  products: Product[]
  /** Number of columns (responsive breakpoints) */
  columns?: 2 | 3 | 4 | 5 | 6
  /** Gap between items */
  gap?: 'sm' | 'md' | 'lg'
  /** Props to pass through to each CProductCard */
  cardProps?: Record<string, any>
  /** Per-instance theme overrides */
  ui?: Partial<{
    root: any
    empty: any
  }>
}

const props = withDefaults(defineProps<ProductGridProps>(), {
  columns: 4,
  gap: 'md',
})

const emit = defineEmits<{
  'add-to-cart': [product: Product]
  'toggle-wishlist': [product: Product]
}>()

const gridCols = computed(() => {
  const map: Record<number, string> = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
    6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6',
  }
  return map[props.columns] || map[4]
})

const gapClass = computed(() => {
  const map = { sm: 'gap-3', md: 'gap-4 md:gap-6', lg: 'gap-6 md:gap-8' }
  return map[props.gap] || map.md
})

// Resolve theme from app.config
const appConfig = useAppConfig()
const theme = computed(() => (appConfig.ui as any)?.productGrid ?? {})

const slotClasses = computed(() => {
  const base = theme.value?.slots ?? {}
  return {
    root: [base.root, props.ui?.root],
    empty: [base.empty, props.ui?.empty],
  }
})
</script>

<template>
  <div v-if="products.length > 0" :class="['grid', gridCols, gapClass, slotClasses.root]">
    <slot name="item" v-for="product in products" :key="product.id" :product="product">
      <CProductCard
        :product="product"
        v-bind="cardProps"
        @add-to-cart="emit('add-to-cart', $event)"
        @toggle-wishlist="emit('toggle-wishlist', $event)"
      />
    </slot>
  </div>

  <slot v-else name="empty">
    <div :class="['text-center py-16', slotClasses.empty]">
      <UIcon name="i-heroicons-shopping-bag" class="text-4xl text-muted mb-3" />
      <p class="text-muted">No products found</p>
    </div>
  </slot>
</template>
