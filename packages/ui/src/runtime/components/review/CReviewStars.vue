<script setup lang="ts">
/**
 * CReviewStars — Star rating display (read-only or interactive).
 * Uses Heroicons star icons via UIcon.
 */

export interface ReviewStarsProps {
  /** Rating value (0-5, supports half values) */
  modelValue?: number
  /** Maximum stars */
  max?: number
  /** Whether the user can click to rate */
  interactive?: boolean
  /** Size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg'
  /** Per-instance theme overrides */
  ui?: Partial<{
    root: any
    star: any
    starFilled: any
    starEmpty: any
    count: any
  }>
}

const props = withDefaults(defineProps<ReviewStarsProps>(), {
  modelValue: 0,
  max: 5,
  interactive: false,
  size: 'md',
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const hoverValue = ref<number | null>(null)

const displayValue = computed(() => hoverValue.value ?? props.modelValue)

function handleClick(star: number) {
  if (props.interactive) {
    emit('update:modelValue', star)
  }
}

function handleHover(star: number) {
  if (props.interactive) {
    hoverValue.value = star
  }
}

function handleLeave() {
  hoverValue.value = null
}

const iconSize = computed(() => {
  const map = { xs: 'text-xs', sm: 'text-sm', md: 'text-base', lg: 'text-lg' }
  return map[props.size] || map.md
})

// Resolve theme from app.config
const appConfig = useAppConfig()
const theme = computed(() => (appConfig.ui as any)?.reviewStars ?? {})

const slotClasses = computed(() => {
  const base = theme.value?.slots ?? {}
  return {
    root: [base.root, props.ui?.root],
    star: [base.star, props.ui?.star],
    starFilled: [base.starFilled, props.ui?.starFilled],
    starEmpty: [base.starEmpty, props.ui?.starEmpty],
    count: [base.count, props.ui?.count],
  }
})
</script>

<template>
  <div
    :class="['inline-flex items-center gap-0.5', slotClasses.root]"
    :role="interactive ? 'radiogroup' : undefined"
    :aria-label="interactive ? 'Rating' : undefined"
    @mouseleave="handleLeave"
  >
    <button
      v-for="star in max"
      :key="star"
      :class="[
        slotClasses.star,
        iconSize,
        interactive ? 'cursor-pointer' : 'cursor-default',
      ]"
      :disabled="!interactive"
      :aria-label="`${star} star${star > 1 ? 's' : ''}`"
      @click="handleClick(star)"
      @mouseenter="handleHover(star)"
    >
      <UIcon
        :name="star <= displayValue ? 'i-heroicons-star-20-solid' : 'i-heroicons-star'"
        :class="star <= displayValue ? ['text-amber-400', slotClasses.starFilled] : ['text-muted/30', slotClasses.starEmpty]"
      />
    </button>

    <slot name="count" />
  </div>
</template>
