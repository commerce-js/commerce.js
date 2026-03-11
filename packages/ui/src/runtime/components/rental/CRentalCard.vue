<script setup lang="ts">
import { computed } from 'vue'
import { useAppConfig } from '#imports'
import type { Product, RentalProductMeta, AvailabilitySlot } from '@commercejs/types'

/**
 * CRentalCard — Product card for rental items.
 * Shows pricing per unit, deposit requirement, and availability status.
 */

export interface RentalCardProps {
  product: Product
  rental?: RentalProductMeta
  /** Per-instance theme overrides */
  ui?: Partial<{
    root: any
    imageWrapper: any
    image: any
    body: any
    title: any
    pricing: any
    meta: any
    actions: any
  }>
}

const props = defineProps<RentalCardProps>()

const emit = defineEmits<{
  'book': [product: Product]
}>()

const rentalMeta = computed(() => props.rental || props.product.rental)

function t(value: any): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  return value.en || value.ar || Object.values(value)[0] || ''
}

const productName = computed(() => t(props.product.name))
const mainImage = computed(() => props.product.primaryImage || props.product.gallery?.[0])

const unitLabel = computed(() => {
  const map: Record<string, string> = {
    hourly: 'hour',
    daily: 'day',
    weekly: 'week',
    monthly: 'month',
  }
  return map[rentalMeta.value?.pricingUnit || ''] || rentalMeta.value?.pricingUnit
})

// Resolve theme from app.config
const appConfig = useAppConfig()
const theme = computed(() => (appConfig.ui as any)?.rentalCard ?? {})

const slotClasses = computed(() => {
  const base = theme.value?.slots ?? {}
  const merge = (slot: string) => [base[slot], props.ui?.[slot as keyof typeof props.ui]]
  return {
    root: merge('root'),
    imageWrapper: merge('imageWrapper'),
    image: merge('image'),
    body: merge('body'),
    title: merge('title'),
    pricing: merge('pricing'),
    meta: merge('meta'),
    actions: merge('actions'),
  }
})
</script>

<template>
  <div :class="['group relative rounded-lg overflow-hidden ring ring-default bg-default hover:shadow-lg transition-all duration-200', slotClasses.root]">
    <!-- Image -->
    <div :class="['relative aspect-[4/3] overflow-hidden bg-elevated', slotClasses.imageWrapper]">
      <img
        v-if="mainImage"
        :src="mainImage.url"
        :alt="mainImage.alt || productName"
        :class="['size-full object-cover transition-transform duration-300 group-hover:scale-105', slotClasses.image]"
      />
      <!-- Rental badge -->
      <UBadge color="info" size="sm" class="absolute top-3 start-3">
        <UIcon name="i-heroicons-calendar-days" class="me-0.5" />
        Rental
      </UBadge>
    </div>

    <!-- Body -->
    <div :class="['p-4 space-y-2', slotClasses.body]">
      <slot name="title" :name="productName">
        <h3 :class="['font-medium text-sm text-highlighted line-clamp-2', slotClasses.title]">{{ productName }}</h3>
      </slot>

      <!-- Pricing -->
      <slot name="pricing" :rental="rentalMeta">
        <div v-if="rentalMeta" :class="['flex items-baseline gap-1', slotClasses.pricing]">
          <span class="text-lg font-bold text-highlighted">{{ rentalMeta.pricePerUnit.formatted }}</span>
          <span class="text-xs text-muted">/ {{ unitLabel }}</span>
        </div>
      </slot>

      <!-- Meta info -->
      <slot name="meta" :rental="rentalMeta">
        <div v-if="rentalMeta" :class="['flex flex-wrap gap-2 text-xs', slotClasses.meta]">
          <span v-if="rentalMeta.securityDeposit" class="inline-flex items-center gap-1 text-muted">
            <UIcon name="i-heroicons-shield-check" />
            {{ rentalMeta.securityDeposit.formatted }} deposit
          </span>
          <span class="inline-flex items-center gap-1 text-muted">
            <UIcon name="i-heroicons-clock" />
            Min {{ rentalMeta.minDuration }} {{ unitLabel }}{{ rentalMeta.minDuration > 1 ? 's' : '' }}
          </span>
          <span v-if="rentalMeta.requiresPickup" class="inline-flex items-center gap-1 text-muted">
            <UIcon name="i-heroicons-map-pin" />
            Pickup required
          </span>
        </div>
      </slot>

      <!-- Tiered pricing -->
      <slot name="tiers" :tiers="rentalMeta?.pricingTiers">
        <div v-if="rentalMeta?.pricingTiers?.length" class="text-xs text-muted space-y-0.5 pt-1">
          <div v-for="(tier, i) in rentalMeta.pricingTiers" :key="i" class="flex justify-between">
            <span>{{ tier.minUnits }}+ {{ unitLabel }}s</span>
            <span class="font-medium text-highlighted">{{ tier.pricePerUnit.formatted }}/{{ unitLabel }}</span>
          </div>
        </div>
      </slot>

      <!-- Actions -->
      <slot name="actions">
        <UButton
          block
          size="sm"
          color="primary"
          class="mt-2"
          @click="emit('book', product)"
        >
          <UIcon name="i-heroicons-calendar-days-20-solid" class="me-1" />
          Book Now
        </UButton>
      </slot>
    </div>
  </div>
</template>
