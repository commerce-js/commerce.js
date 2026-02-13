<script setup lang="ts">
/**
 * CQuantitySelector — Increment/decrement quantity input.
 * Follows Nuxt UI conventions: ui prop, slot-based theming, semantic tokens.
 */

export interface QuantitySelectorProps {
  /** Current quantity value */
  modelValue: number
  /** Minimum allowed value */
  min?: number
  /** Maximum allowed value (null = unlimited) */
  max?: number | null
  /** Disable the control */
  disabled?: boolean
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Per-instance theme overrides */
  ui?: Partial<{
    root: any
    button: any
    input: any
  }>
}

const props = withDefaults(defineProps<QuantitySelectorProps>(), {
  min: 1,
  max: null,
  disabled: false,
  size: 'md',
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const canDecrement = computed(() => props.modelValue > props.min)
const canIncrement = computed(() => props.max === null || props.modelValue < props.max)

function decrement() {
  if (canDecrement.value && !props.disabled) {
    emit('update:modelValue', props.modelValue - 1)
  }
}

function increment() {
  if (canIncrement.value && !props.disabled) {
    emit('update:modelValue', props.modelValue + 1)
  }
}

// Resolve theme classes from app.config
const appConfig = useAppConfig()
const theme = computed(() => (appConfig.ui as any)?.quantitySelector ?? {})

const buttonSize = computed(() => {
  const map = { sm: 'xs', md: 'sm', lg: 'md' } as const
  return map[props.size] ?? 'sm'
})

const slotClasses = computed(() => {
  const t = theme.value
  const sizeVariant = t?.variants?.size?.[props.size] ?? {}
  const base = t?.slots ?? {}
  return {
    root: [base.root, sizeVariant.root, props.ui?.root],
    button: [base.button, sizeVariant.button, props.ui?.button],
    input: [base.input, sizeVariant.input, props.ui?.input],
  }
})
</script>

<template>
  <div :class="slotClasses.root">
    <slot name="decrement" :decrement="decrement" :disabled="!canDecrement || disabled">
      <UButton
        icon="i-heroicons-minus-20-solid"
        :size="buttonSize"
        variant="soft"
        color="neutral"
        :disabled="!canDecrement || disabled"
        :class="slotClasses.button"
        @click="decrement"
      />
    </slot>

    <slot name="value" :value="modelValue">
      <input
        type="text"
        :value="modelValue"
        readonly
        :disabled="disabled"
        :class="slotClasses.input"
        aria-label="Quantity"
      />
    </slot>

    <slot name="increment" :increment="increment" :disabled="!canIncrement || disabled">
      <UButton
        icon="i-heroicons-plus-20-solid"
        :size="buttonSize"
        variant="soft"
        color="neutral"
        :disabled="!canIncrement || disabled"
        :class="slotClasses.button"
        @click="increment"
      />
    </slot>
  </div>
</template>
