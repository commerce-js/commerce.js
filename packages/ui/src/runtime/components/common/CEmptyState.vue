<script setup lang="ts">
import { computed } from 'vue'
import { useAppConfig } from '#imports'
/**
 * CEmptyState — Reusable empty state for cart, wishlist, search results, etc.
 */

export interface EmptyStateProps {
  /** Icon name */
  icon?: string
  /** Title text */
  title?: string
  /** Description text */
  description?: string
  /** CTA button label */
  actionLabel?: string
  /** CTA button link */
  actionTo?: string
  /** Per-instance theme overrides */
  ui?: Partial<{
    root: any
    icon: any
    title: any
    description: any
  }>
}

const props = withDefaults(defineProps<EmptyStateProps>(), {
  icon: 'i-heroicons-inbox',
  title: 'Nothing here yet',
})

const emit = defineEmits<{
  'action': []
}>()

// Resolve theme from app.config
const appConfig = useAppConfig()
const theme = computed(() => (appConfig.ui as any)?.emptyState ?? {})

const slotClasses = computed(() => {
  const base = theme.value?.slots ?? {}
  const merge = (slot: string) => [
    base[slot],
    props.ui?.[slot as keyof typeof props.ui],
  ]
  return {
    root: merge('root'),
    icon: merge('icon'),
    title: merge('title'),
    description: merge('description'),
  }
})
</script>

<template>
  <div :class="['flex flex-col items-center justify-center py-16 px-4', slotClasses.root]">
    <slot name="icon">
      <UIcon :name="icon" :class="['text-5xl text-muted mb-4', slotClasses.icon]" />
    </slot>

    <slot name="title">
      <h3 :class="['text-lg font-medium text-highlighted mb-1', slotClasses.title]">{{ title }}</h3>
    </slot>

    <slot name="description">
      <p v-if="description" :class="['text-sm text-muted max-w-md text-center mb-6', slotClasses.description]">
        {{ description }}
      </p>
    </slot>

    <slot name="action">
      <UButton
        v-if="actionLabel"
        :to="actionTo"
        color="primary"
        @click="emit('action')"
      >
        {{ actionLabel }}
      </UButton>
    </slot>
  </div>
</template>
