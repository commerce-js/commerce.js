<script setup lang="ts">
import type { WishlistItem, Product } from '@commercejs/types'

/**
 * CWishlistGrid — Displays wishlist items in a responsive grid.
 * Composes CProductCard for each item with remove + add-to-cart actions.
 */

export interface WishlistGridProps {
  items: WishlistItem[]
  /** Number of grid columns (2–6) */
  columns?: 2 | 3 | 4 | 5 | 6
  /** Whether any action is loading */
  loading?: boolean
  /** Per-instance theme overrides */
  ui?: Partial<{
    root: any
    item: any
    actions: any
  }>
}

const props = withDefaults(defineProps<WishlistGridProps>(), {
  columns: 4,
  loading: false,
})

const emit = defineEmits<{
  'remove': [itemId: string]
  'add-to-cart': [product: Product]
}>()

const colClass = computed(() => {
  const map: Record<number, string> = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
    6: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6',
  }
  return map[props.columns] || map[4]
})

// Resolve theme
const appConfig = useAppConfig()
const theme = computed(() => (appConfig.ui as any)?.wishlistGrid ?? {})

const slotClasses = computed(() => {
  const base = theme.value?.slots ?? {}
  const merge = (slot: string) => [base[slot], props.ui?.[slot as keyof typeof props.ui]]
  return {
    root: merge('root'),
    item: merge('item'),
    actions: merge('actions'),
  }
})
</script>

<template>
  <div v-if="items.length === 0">
    <CEmptyState
      icon="i-heroicons-heart"
      title="Your wishlist is empty"
      description="Save your favorite products to find them later"
      action-label="Start Shopping"
      action-to="/products"
    />
  </div>

  <div v-else :class="['grid gap-4', colClass, slotClasses.root]">
    <div v-for="item in items" :key="item.id" :class="['relative group', slotClasses.item]">
      <CProductCard :product="item.product" />

      <!-- Wishlist-specific actions overlay -->
      <div :class="['absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity', slotClasses.actions]">
        <UButton
          size="xs"
          color="primary"
          class="flex-1"
          :loading="loading"
          @click="emit('add-to-cart', item.product)"
        >
          <UIcon name="i-heroicons-shopping-cart-20-solid" class="me-1" />
          Add to Cart
        </UButton>
        <UButton
          icon="i-heroicons-trash-20-solid"
          size="xs"
          variant="ghost"
          color="error"
          @click="emit('remove', item.id)"
        />
      </div>
    </div>
  </div>
</template>
