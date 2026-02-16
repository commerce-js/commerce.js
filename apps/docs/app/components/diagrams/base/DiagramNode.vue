<script setup lang="ts">
type NodeColor = 'neutral' | 'success' | 'error' | 'primary' | 'secondary' | 'tertiary' | 'info' | 'warning'
type NodeVariant = 'outline' | 'solid' | 'soft'
type NodeSize = 'sm' | 'md' | 'lg' | 'xl'

const props = defineProps<{
  label: string
  badge?: string
  icon?: string
  size?: NodeSize
  color?: NodeColor
  variant?: NodeVariant
}>()

const size = computed(() => props.size ?? 'md')
const variant = computed(() => props.variant ?? 'outline')

// -- Size classes --
const sizeMap: Record<NodeSize, string> = {
  sm: 'h-11 flex-1 text-xs rounded-lg',
  md: 'h-14 w-48 rounded-xl',
  lg: 'h-16 w-56 rounded-xl',
  xl: 'h-20 w-64 rounded-xl',
}

// -- Color × Variant matrix (all classes explicit for Tailwind scanning) --
const styleMap: Record<NodeVariant, Record<NodeColor, string>> = {
  outline: {
    neutral: 'border-2 border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300',
    primary: 'border-2 border-primary-200 dark:border-primary-600 bg-white dark:bg-zinc-800 text-primary-600 dark:text-primary-300',
    success: 'border-2 border-success-200 dark:border-success-600 bg-white dark:bg-zinc-800 text-success-600 dark:text-success-300',
    error: 'border-2 border-error-200 dark:border-error-600 bg-white dark:bg-zinc-800 text-error-600 dark:text-error-300',
    secondary: 'border-2 border-secondary-200 dark:border-secondary-600 bg-white dark:bg-zinc-800 text-secondary-600 dark:text-secondary-300',
    tertiary: 'border-2 border-tertiary-200 dark:border-tertiary-600 bg-white dark:bg-zinc-800 text-tertiary-600 dark:text-tertiary-300',
    info: 'border-2 border-info-200 dark:border-info-600 bg-white dark:bg-zinc-800 text-info-600 dark:text-info-300',
    warning: 'border-2 border-warning-200 dark:border-warning-600 bg-white dark:bg-zinc-800 text-warning-600 dark:text-warning-300',
  },
  solid: {
    neutral: 'border-0 bg-zinc-500 text-white',
    primary: 'border-0 bg-primary-500 text-white',
    success: 'border-0 bg-success-500 text-white',
    error: 'border-0 bg-error-500 text-white',
    secondary: 'border-0 bg-secondary-500 text-white',
    tertiary: 'border-0 bg-tertiary-500 text-white',
    info: 'border-0 bg-info-500 text-white',
    warning: 'border-0 bg-warning-500 text-white',
  },
  soft: {
    neutral: 'border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400',
    primary: 'border border-primary-200 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
    success: 'border border-success-200 dark:border-success-700 bg-success-50 dark:bg-success-900/30 text-success-600 dark:text-success-400',
    error: 'border border-error-200 dark:border-error-700 bg-error-50 dark:bg-error-900/30 text-error-600 dark:text-error-400',
    secondary: 'border border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-900/30 text-secondary-600 dark:text-secondary-400',
    tertiary: 'border border-tertiary-200 dark:border-tertiary-700 bg-tertiary-50 dark:bg-tertiary-900/30 text-tertiary-600 dark:text-tertiary-400',
    info: 'border border-info-200 dark:border-info-700 bg-info-50 dark:bg-info-900/30 text-info-600 dark:text-info-400',
    warning: 'border border-warning-200 dark:border-warning-700 bg-warning-50 dark:bg-warning-900/30 text-warning-600 dark:text-warning-400',
  },
}

const nodeClasses = computed(() => {
  const color = props.color ?? 'neutral'
  return [
    'z-10 flex items-center justify-center gap-1.5 shadow-sm font-semibold',
    sizeMap[size.value],
    styleMap[variant.value][color],
    props.badge ? 'flex-col gap-0.5 py-2' : '',
  ]
})
</script>

<template>
  <div :class="nodeClasses">
    <span v-if="badge" class="text-[10px] font-medium uppercase tracking-wider opacity-80">
      {{ badge }}
    </span>
    <UIcon v-if="icon" :name="icon" class="size-5 shrink-0" />
    <span :class="size === 'sm' ? 'text-xs' : ''">{{ label }}</span>
  </div>
</template>
