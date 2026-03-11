<script setup lang="ts">
import { computed,ref } from 'vue'
import { useAppConfig } from '#imports'
import type { Coupon } from '@commercejs/types'

/**
 * CCouponInput — Coupon code input with validation feedback.
 * Used at cart/checkout to apply discount codes.
 */

export interface CouponInputProps {
  /** Applied coupon (if already applied) */
  appliedCoupon?: Coupon | null
  /** Whether the coupon is being validated */
  loading?: boolean
  /** Error message */
  error?: string
  /** Per-instance theme overrides */
  ui?: Partial<{
    root: any
    input: any
    applied: any
  }>
}

const props = withDefaults(defineProps<CouponInputProps>(), {
  appliedCoupon: null,
  loading: false,
  error: '',
})

const emit = defineEmits<{
  'apply': [code: string]
  'remove': []
}>()

const code = ref('')

function t(value: any): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  return value.en || value.ar || Object.values(value)[0] || ''
}

function handleApply() {
  if (code.value.trim()) {
    emit('apply', code.value.trim().toUpperCase())
  }
}

// Resolve theme from app.config
const appConfig = useAppConfig()
const theme = computed(() => (appConfig.ui as any)?.couponInput ?? {})

const slotClasses = computed(() => {
  const base = theme.value?.slots ?? {}
  const merge = (slot: string) => [base[slot], props.ui?.[slot as keyof typeof props.ui]]
  return {
    root: merge('root'),
    input: merge('input'),
    applied: merge('applied'),
  }
})
</script>

<template>
  <div :class="['space-y-2', slotClasses.root]">
    <!-- Applied coupon -->
    <div v-if="appliedCoupon" :class="['flex items-center justify-between p-3 rounded-lg bg-success/10 ring ring-success/30', slotClasses.applied]">
      <div class="flex items-center gap-2">
        <UIcon name="i-heroicons-ticket" class="text-success" />
        <span class="font-mono font-semibold text-sm text-highlighted">{{ appliedCoupon.code }}</span>
        <UBadge color="success" size="xs" variant="subtle">
          {{ appliedCoupon.promotion.discountType === 'percentage'
            ? `${appliedCoupon.promotion.discountValue}% off`
            : t(appliedCoupon.promotion.name)
          }}
        </UBadge>
      </div>
      <UButton
        icon="i-heroicons-x-mark-20-solid"
        variant="ghost"
        color="error"
        size="xs"
        @click="emit('remove')"
      />
    </div>

    <!-- Input form -->
    <form v-else class="flex gap-2" @submit.prevent="handleApply">
      <UInput
        v-model="code"
        :class="['flex-1 font-mono uppercase', slotClasses.input]"
        placeholder="Enter coupon code"
        :disabled="loading"
        :color="error ? 'error' : undefined"
      />
      <UButton type="submit" :loading="loading" variant="outline" color="neutral">
        Apply
      </UButton>
    </form>

    <!-- Error message -->
    <p v-if="error" class="text-xs text-error">{{ error }}</p>
  </div>
</template>
