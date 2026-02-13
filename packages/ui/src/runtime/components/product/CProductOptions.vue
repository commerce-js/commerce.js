<script setup lang="ts">
import type { ProductOption, LocalizedString, Id } from '@commercejs/types'

/**
 * CProductOptions — Variant option selector (size, color, etc.)
 * Renders each option group with selectable values.
 */

export interface ProductOptionsProps {
  /** Available product options */
  items: ProductOption[]
  /** Currently selected option values: { optionId: valueId } */
  modelValue: Record<string, string>
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Per-instance theme overrides */
  ui?: Partial<{
    root: any
    group: any
    label: any
    values: any
    value: any
    valueActive: any
  }>
}

const props = withDefaults(defineProps<ProductOptionsProps>(), {
  size: 'md',
})

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, string>]
}>()

function t(value: LocalizedString | string | null | undefined): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  return value.en || value.ar || Object.values(value)[0] || ''
}

function selectValue(optionId: string, valueId: string) {
  emit('update:modelValue', {
    ...props.modelValue,
    [optionId]: valueId,
  })
}

function isSelected(optionId: string, valueId: string): boolean {
  return props.modelValue[optionId] === valueId
}

// Resolve theme from app.config
const appConfig = useAppConfig()
const theme = computed(() => (appConfig.ui as any)?.productOptions ?? {})

const slotClasses = computed(() => {
  const base = theme.value?.slots ?? {}
  const sizeStyles = theme.value?.variants?.size?.[props.size] ?? {}
  const merge = (slot: string) => [
    base[slot],
    sizeStyles[slot],
    props.ui?.[slot as keyof typeof props.ui],
  ]
  return {
    root: merge('root'),
    group: merge('group'),
    label: merge('label'),
    values: merge('values'),
    value: merge('value'),
    valueActive: merge('valueActive'),
  }
})
</script>

<template>
  <div :class="slotClasses.root">
    <div v-for="option in items" :key="option.id" :class="slotClasses.group">
      <slot name="label" :option="option">
        <label :class="slotClasses.label">
          {{ t(option.name) }}
          <span v-if="modelValue[option.id]" class="text-muted font-normal">
            — {{ t(option.values.find(v => v.id === modelValue[option.id])?.name) }}
          </span>
        </label>
      </slot>

      <div :class="slotClasses.values">
        <slot name="value" v-for="val in option.values" :key="val.id" :option="option" :value="val" :selected="isSelected(option.id, val.id)" :select="() => selectValue(option.id, val.id)">
          <UButton
            :variant="isSelected(option.id, val.id) ? 'soft' : 'outline'"
            :color="isSelected(option.id, val.id) ? 'primary' : 'neutral'"
            size="sm"
            @click="selectValue(option.id, val.id)"
          >
            {{ t(val.name) }}
          </UButton>
        </slot>
      </div>
    </div>
  </div>
</template>
