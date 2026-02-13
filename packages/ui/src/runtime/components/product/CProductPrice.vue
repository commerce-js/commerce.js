<script setup lang="ts">
import type { DiscountablePrice, Price } from '@commercejs/types'

/**
 * CProductPrice — Display a product price with optional discount.
 * Follows Nuxt UI conventions: ui prop, slot-based theming, semantic tokens.
 */

export interface ProductPriceProps {
  /** The price to display */
  price: DiscountablePrice | Price
  /** Size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  /** Show discount percentage badge */
  showDiscount?: boolean
  /** Per-instance theme overrides */
  ui?: Partial<{
    root: any
    current: any
    original: any
    discount: any
  }>
}

const props = withDefaults(defineProps<ProductPriceProps>(), {
  size: 'md',
  showDiscount: true,
})

const hasDiscount = computed(() => {
  const p = props.price as DiscountablePrice
  return p.originalAmount != null && p.originalAmount > p.amount
})

const discountPercent = computed(() => {
  const p = props.price as DiscountablePrice
  if (p.discountPercent) return p.discountPercent
  if (p.originalAmount && p.originalAmount > p.amount) {
    return Math.round(((p.originalAmount - p.amount) / p.originalAmount) * 100)
  }
  return 0
})

const originalFormatted = computed(() => {
  if (!hasDiscount.value) return ''
  const p = props.price as DiscountablePrice
  // Build a formatted original price string
  if (p.formatted && p.originalAmount) {
    return p.formatted.replace(String(p.amount), String(p.originalAmount))
  }
  return `${p.originalAmount} ${p.currency}`
})

// Resolve theme classes from app.config
const appConfig = useAppConfig()
const theme = computed(() => (appConfig.ui as any)?.productPrice ?? {})

const slotClasses = computed(() => {
  const t = theme.value
  const sizeVariant = t?.variants?.size?.[props.size] ?? {}
  const base = t?.slots ?? {}
  return {
    root: [base.root, sizeVariant.root, props.ui?.root],
    current: [base.current, sizeVariant.current, props.ui?.current],
    original: [base.original, sizeVariant.original, props.ui?.original],
    discount: [base.discount, sizeVariant.discount, props.ui?.discount],
  }
})
</script>

<template>
  <span :class="slotClasses.root">
    <slot name="current" :price="price" :formatted="price.formatted">
      <span :class="slotClasses.current">{{ price.formatted }}</span>
    </slot>

    <template v-if="hasDiscount">
      <slot name="original" :original="originalFormatted">
        <span :class="slotClasses.original">{{ originalFormatted }}</span>
      </slot>

      <slot v-if="showDiscount" name="discount" :percent="discountPercent">
        <span :class="slotClasses.discount">-{{ discountPercent }}%</span>
      </slot>
    </template>
  </span>
</template>
