<script setup lang="ts">
import { computed,ref,onMounted,onUnmounted } from 'vue'
import { useAppConfig } from '#imports'
import type { Promotion } from '@commercejs/types'

/**
 * CPromoBanner — Promotional banner with countdown timer and CTA.
 * Used for flash sales, limited-time offers, and campaign banners.
 */

export interface PromoBannerProps {
  promotion: Promotion
  /** Banner variant */
  variant?: 'inline' | 'full-width' | 'compact'
  /** Custom background image URL */
  backgroundImage?: string
  /** Per-instance theme overrides */
  ui?: Partial<{
    root: any
    content: any
    timer: any
    cta: any
  }>
}

const props = withDefaults(defineProps<PromoBannerProps>(), {
  variant: 'inline',
})

const emit = defineEmits<{
  'click': [promotion: Promotion]
}>()

function t(value: any): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  return value.en || value.ar || Object.values(value)[0] || ''
}

// Countdown
const timeRemaining = ref({ days: 0, hours: 0, mins: 0, secs: 0 })
const hasEnded = ref(false)
let timer: ReturnType<typeof setInterval>

function updateTimer() {
  if (!props.promotion.endsAt) return
  const diff = new Date(props.promotion.endsAt).getTime() - Date.now()
  if (diff <= 0) {
    hasEnded.value = true
    clearInterval(timer)
    return
  }
  timeRemaining.value = {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    mins: Math.floor((diff % 3600000) / 60000),
    secs: Math.floor((diff % 60000) / 1000),
  }
}

onMounted(() => {
  updateTimer()
  timer = setInterval(updateTimer, 1000)
})

onUnmounted(() => clearInterval(timer))

// Discount display
const discountDisplay = computed(() => {
  if (props.promotion.discountType === 'percentage') return `${props.promotion.discountValue}% OFF`
  if (props.promotion.discountType === 'fixed_amount') return `${props.promotion.currency || ''} ${props.promotion.discountValue} OFF`
  if (props.promotion.discountType === 'free_shipping') return 'FREE SHIPPING'
  if (props.promotion.discountType === 'buy_x_get_y') return 'BOGO'
  return 'SPECIAL OFFER'
})

// Resolve theme from app.config
const appConfig = useAppConfig()
const theme = computed(() => (appConfig.ui as any)?.promoBanner ?? {})

const slotClasses = computed(() => {
  const base = theme.value?.slots ?? {}
  const merge = (slot: string) => [base[slot], props.ui?.[slot as keyof typeof props.ui]]
  return {
    root: merge('root'),
    content: merge('content'),
    timer: merge('timer'),
    cta: merge('cta'),
  }
})
</script>

<template>
  <div
    v-if="promotion.isActive && !hasEnded"
    :class="[
      'relative overflow-hidden rounded-xl',
      variant === 'full-width' ? 'rounded-none' : '',
      variant === 'compact' ? 'py-2 px-4' : 'py-6 px-6',
      slotClasses.root,
    ]"
    :style="backgroundImage ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}"
  >
    <!-- Gradient overlay for bg images -->
    <div v-if="backgroundImage" class="absolute inset-0 bg-gradient-to-r from-black/80 to-black/40" />

    <div :class="[
      'relative z-10 flex items-center justify-between gap-4',
      variant === 'compact' ? 'flex-row' : 'flex-col md:flex-row',
      slotClasses.content,
    ]">
      <!-- Left: Promo info -->
      <div :class="variant === 'compact' ? '' : 'text-center md:text-start'">
        <span :class="[
          'font-black tracking-tight',
          variant === 'compact' ? 'text-lg' : 'text-2xl md:text-3xl',
          backgroundImage ? 'text-white' : 'text-highlighted',
        ]">
          {{ discountDisplay }}
        </span>
        <p :class="[
          'text-sm mt-0.5',
          backgroundImage ? 'text-white/80' : 'text-muted',
        ]">
          {{ t(promotion.name) }}
        </p>
      </div>

      <!-- Center: Countdown -->
      <div v-if="promotion.endsAt" :class="['flex gap-2', slotClasses.timer]">
        <div v-for="(val, label) in { d: timeRemaining.days, h: timeRemaining.hours, m: timeRemaining.mins, s: timeRemaining.secs }" :key="label"
          :class="[
            'text-center rounded-lg px-2 py-1',
            backgroundImage ? 'bg-white/20 backdrop-blur-sm text-white' : 'bg-elevated text-highlighted',
          ]"
        >
          <span class="text-lg font-bold font-mono block leading-tight">{{ String(val).padStart(2, '0') }}</span>
          <span class="text-[10px] uppercase opacity-70">{{ label }}</span>
        </div>
      </div>

      <!-- Right: CTA -->
      <slot name="action">
        <UButton
          :color="backgroundImage ? 'white' : 'primary'"
          size="sm"
          :class="slotClasses.cta"
          @click="emit('click', promotion)"
        >
          Shop Now
        </UButton>
      </slot>
    </div>
  </div>
</template>
