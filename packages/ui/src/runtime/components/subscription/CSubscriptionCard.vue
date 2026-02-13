<script setup lang="ts">
import type { Product, SubscriptionProductMeta } from '@commercejs/types'

/**
 * CSubscriptionCard — Product card for subscription products.
 * Shows recurring price, interval, trial info, and subscribe CTA.
 */

export interface SubscriptionCardProps {
  product: Product
  subscription?: SubscriptionProductMeta
  /** Highlight as recommended/popular */
  featured?: boolean
  /** Per-instance theme overrides */
  ui?: Partial<{
    root: any
    header: any
    pricing: any
    features: any
    actions: any
  }>
}

const props = withDefaults(defineProps<SubscriptionCardProps>(), {
  featured: false,
})

const emit = defineEmits<{
  'subscribe': [product: Product]
}>()

const subMeta = computed(() => props.subscription || props.product.subscription)

function t(value: any): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  return value.en || value.ar || Object.values(value)[0] || ''
}

const productName = computed(() => t(props.product.name))

const intervalLabel = computed(() => {
  if (!subMeta.value) return ''
  const count = subMeta.value.intervalCount
  const map: Record<string, string> = {
    daily: count > 1 ? `${count} days` : 'day',
    weekly: count > 1 ? `${count} weeks` : 'week',
    monthly: count > 1 ? `${count} months` : 'month',
    quarterly: 'quarter',
    yearly: count > 1 ? `${count} years` : 'year',
  }
  return map[subMeta.value.interval] || subMeta.value.interval
})

// Resolve theme from app.config
const appConfig = useAppConfig()
const theme = computed(() => (appConfig.ui as any)?.subscriptionCard ?? {})

const slotClasses = computed(() => {
  const base = theme.value?.slots ?? {}
  const merge = (slot: string) => [base[slot], props.ui?.[slot as keyof typeof props.ui]]
  return {
    root: merge('root'),
    header: merge('header'),
    pricing: merge('pricing'),
    features: merge('features'),
    actions: merge('actions'),
  }
})
</script>

<template>
  <div :class="[
    'relative rounded-xl overflow-hidden ring transition-all duration-200',
    featured ? 'ring-2 ring-primary shadow-lg shadow-primary/10' : 'ring-default',
    'bg-default hover:shadow-lg',
    slotClasses.root,
  ]">
    <!-- Featured badge -->
    <div v-if="featured" class="bg-primary text-white text-center text-xs font-semibold py-1.5">
      Most Popular
    </div>

    <div class="p-6 space-y-4">
      <!-- Header -->
      <div :class="['text-center', slotClasses.header]">
        <slot name="title" :name="productName">
          <h3 class="text-lg font-semibold text-highlighted">{{ productName }}</h3>
        </slot>
        <slot name="description">
          <p v-if="product.shortDescription" class="text-sm text-muted mt-1">
            {{ t(product.shortDescription) }}
          </p>
        </slot>
      </div>

      <!-- Pricing -->
      <div :class="['text-center py-4', slotClasses.pricing]">
        <slot name="pricing" :subscription="subMeta">
          <div v-if="subMeta" class="space-y-1">
            <div class="flex items-baseline justify-center gap-1">
              <span class="text-4xl font-bold text-highlighted">{{ subMeta.recurringPrice.formatted }}</span>
              <span class="text-muted text-sm">/ {{ intervalLabel }}</span>
            </div>
            <p v-if="subMeta.trialDays > 0" class="text-sm text-success font-medium">
              {{ subMeta.trialDays }}-day free trial
            </p>
          </div>
        </slot>
      </div>

      <!-- Features / description -->
      <slot name="features">
        <div
          v-if="product.description"
          :class="['prose prose-sm max-w-none text-muted', slotClasses.features]"
          v-html="t(product.description)"
        />
      </slot>

      <!-- Actions -->
      <div :class="slotClasses.actions">
        <slot name="actions">
          <UButton
            block
            size="lg"
            :color="featured ? 'primary' : 'neutral'"
            :variant="featured ? 'solid' : 'outline'"
            @click="emit('subscribe', product)"
          >
            {{ subMeta?.trialDays ? 'Start Free Trial' : 'Subscribe' }}
          </UButton>
        </slot>
      </div>
    </div>
  </div>
</template>
