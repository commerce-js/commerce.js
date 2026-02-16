<script setup lang="ts">
defineProps<{
  /** Icon name to display in the top-right corner */
  icon?: string
  /** Max width class — defaults to max-w-6xl */
  maxWidth?: string
}>()
</script>

<template>
  <div
    :class="[
      'relative w-full rounded-3xl border-2 border-primary-100/50 dark:border-primary-700/50 p-8 md:p-12 shadow-[0_0_0_1px_rgba(0,0,0,0.05)]',
      maxWidth ?? 'max-w-6xl',
    ]"
  >
    <UIcon
      v-if="icon"
      :name="icon"
      class="size-24 opacity-10 shrink-0 absolute top-4 right-4"
    />
    <slot />
  </div>
</template>
