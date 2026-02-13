<script setup lang="ts">
/**
 * CCheckoutStepper — Multi-step checkout progress indicator.
 * Wraps Nuxt UI's UStepper with ecommerce-specific defaults.
 */

export interface CheckoutStep {
  /** Step key */
  id: string
  /** Display label */
  title: string
  /** Optional description */
  description?: string
  /** Optional icon name */
  icon?: string
}

export interface CheckoutStepperProps {
  /** Steps configuration */
  steps: CheckoutStep[]
  /** Current active step (0-indexed) */
  modelValue?: number
  /** Orientation */
  orientation?: 'horizontal' | 'vertical'
  /** Whether steps must be completed in order */
  linear?: boolean
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Color */
  color?: 'primary' | 'secondary' | 'success' | 'neutral'
  /** Per-instance theme overrides */
  ui?: Partial<{
    root: any
  }>
}

const props = withDefaults(defineProps<CheckoutStepperProps>(), {
  modelValue: 0,
  orientation: 'horizontal',
  linear: true,
  size: 'md',
  color: 'primary',
})

const emit = defineEmits<{
  'update:modelValue': [step: number]
}>()

// Map our steps to UStepper items format
const stepperItems = computed(() =>
  props.steps.map(step => ({
    title: step.title,
    description: step.description,
    icon: step.icon,
  }))
)

// Resolve theme from app.config
const appConfig = useAppConfig()
const theme = computed(() => (appConfig.ui as any)?.checkoutStepper ?? {})

const slotClasses = computed(() => {
  const base = theme.value?.slots ?? {}
  return {
    root: [base.root, props.ui?.root],
  }
})
</script>

<template>
  <div :class="slotClasses.root">
    <slot :steps="steps" :active="modelValue">
      <UStepper
        :items="stepperItems"
        :model-value="modelValue"
        :orientation="orientation"
        :linear="linear"
        :size="size"
        :color="color"
        @update:model-value="emit('update:modelValue', $event)"
      />
    </slot>
  </div>
</template>
