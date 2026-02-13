<script setup lang="ts">
import type { Cart } from '@commercejs/types'

/**
 * CCartSummary — Order summary sidebar with line items and totals.
 * Follows Nuxt UI conventions: ui prop, slot-based theming, semantic tokens.
 */

export interface CartSummaryProps {
  /** Cart data from @commercejs/types */
  cart: Cart
  /** Show the checkout/action button */
  showActions?: boolean
  /** Label for the checkout button */
  actionLabel?: string
  /** Route for the checkout button */
  actionTo?: string
  /** Per-instance theme overrides */
  ui?: Partial<{
    root: any
    title: any
    lineItem: any
    lineLabel: any
    lineValue: any
    separator: any
    total: any
    totalLabel: any
    totalValue: any
    actions: any
  }>
}

const props = withDefaults(defineProps<CartSummaryProps>(), {
  showActions: true,
  actionLabel: 'Proceed to Checkout',
  actionTo: '/checkout',
})

// Resolve theme classes from app.config
const appConfig = useAppConfig()
const theme = computed(() => (appConfig.ui as any)?.cartSummary ?? {})

const slotClasses = computed(() => {
  const t = theme.value
  const base = t?.slots ?? {}
  const merge = (slot: string) => [
    base[slot],
    props.ui?.[slot as keyof typeof props.ui],
  ]

  return {
    root: merge('root'),
    title: merge('title'),
    lineItem: merge('lineItem'),
    lineLabel: merge('lineLabel'),
    lineValue: merge('lineValue'),
    separator: merge('separator'),
    total: merge('total'),
    totalLabel: merge('totalLabel'),
    totalValue: merge('totalValue'),
    actions: merge('actions'),
  }
})
</script>

<template>
  <div :class="slotClasses.root">
    <slot name="title">
      <h3 :class="slotClasses.title">Order Summary</h3>
    </slot>

    <!-- Line items -->
    <div class="space-y-2">
      <slot name="subtotal" :subtotal="cart.totals.subtotal">
        <div :class="slotClasses.lineItem">
          <span :class="slotClasses.lineLabel">Subtotal ({{ cart.itemCount }} items)</span>
          <span :class="slotClasses.lineValue">{{ cart.totals.subtotal.formatted }}</span>
        </div>
      </slot>

      <slot name="shipping" :shipping="cart.totals.shipping">
        <div v-if="cart.totals.shipping" :class="slotClasses.lineItem">
          <span :class="slotClasses.lineLabel">Shipping</span>
          <span :class="slotClasses.lineValue">{{ cart.totals.shipping.formatted }}</span>
        </div>
      </slot>

      <slot name="tax" :tax="cart.totals.tax">
        <div v-if="cart.totals.tax" :class="slotClasses.lineItem">
          <span :class="slotClasses.lineLabel">Tax</span>
          <span :class="slotClasses.lineValue">{{ cart.totals.tax.formatted }}</span>
        </div>
      </slot>

      <slot name="discount" :discount="cart.totals.discount">
        <div v-if="cart.totals.discount" :class="slotClasses.lineItem">
          <span :class="slotClasses.lineLabel">Discount</span>
          <span class="font-medium text-success">-{{ cart.totals.discount.formatted }}</span>
        </div>
      </slot>
    </div>

    <USeparator :class="slotClasses.separator" />

    <!-- Total -->
    <slot name="total" :total="cart.totals.total">
      <div :class="slotClasses.total">
        <span :class="slotClasses.totalLabel">Total</span>
        <span :class="slotClasses.totalValue">{{ cart.totals.total.formatted }}</span>
      </div>
    </slot>

    <!-- Actions -->
    <slot v-if="showActions" name="actions">
      <div :class="slotClasses.actions">
        <UButton
          :to="actionTo"
          color="primary"
          size="lg"
          block
        >
          {{ actionLabel }}
        </UButton>
      </div>
    </slot>
  </div>
</template>
