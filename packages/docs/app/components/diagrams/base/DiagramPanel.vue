<script setup lang="ts">
type PanelColor = 'error' | 'success' | 'warning' | 'info' | 'primary' | 'secondary' | 'tertiary'

const props = defineProps<{
  /** Floating label text at the top */
  label: string
  /** Color theme — maps to semantic tokens */
  color: PanelColor
  /** Border style */
  variant?: 'dashed' | 'solid'
}>()

/** Color-to-hex mapping for inline label backgrounds (CSS layer safety) */
const colorHexMap: Record<PanelColor, string> = {
  error: '#ef4444',
  success: '#10b981',
  warning: '#f59e0b',
  info: '#3b82f6',
  primary: '#3b82f6',
  secondary: '#64748b',
  tertiary: '#94a3b8',
}

const labelBg = computed(() => colorHexMap[props.color])

/** Dynamic Tailwind classes based on color + variant */
const panelClasses = computed(() => {
  const variant = props.variant ?? 'solid'
  const base = 'relative flex flex-col items-center rounded-2xl border-2 p-6 md:p-8 pt-4 md:pt-5'
  const borderStyle = variant === 'dashed' ? 'border-dashed' : 'border-solid'

  const colorMap: Record<PanelColor, string> = {
    error: 'border-error-300 dark:border-error-500/40 bg-error-50/30 dark:bg-error-950/15',
    success: 'border-success-500 dark:border-success-400/60 bg-success-50/30 dark:bg-success-950/15',
    warning: 'border-warning-300 dark:border-warning-500/40 bg-warning-50/30 dark:bg-warning-950/15',
    info: 'border-info-300 dark:border-info-500/40 bg-info-50/30 dark:bg-info-950/15',
    primary: 'border-primary-300 dark:border-primary-500/40 bg-primary-50/30 dark:bg-primary-950/15',
    secondary: 'border-secondary-300 dark:border-secondary-500/40 bg-secondary-50/30 dark:bg-secondary-950/15',
    tertiary: 'border-tertiary-300 dark:border-tertiary-500/40 bg-tertiary-50/30 dark:bg-tertiary-950/15',
  }

  return [base, borderStyle, colorMap[props.color]]
})
</script>

<template>
  <div :class="panelClasses">
    <!-- Floating label pill -->
    <div
      class="-mt-7 md:-mt-8 mb-4 z-10 whitespace-nowrap rounded-full px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-white"
      :style="{ backgroundColor: labelBg }"
    >
      {{ label }}
    </div>

    <!-- Panel body -->
    <slot />

    <!-- Optional badge slot -->
    <slot name="badge" />
  </div>
</template>
