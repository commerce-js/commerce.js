<script setup lang="ts">
defineProps<{
  label: string
  icon: string
  /** Hex color for the badge background — uses inline style for CSS layer safety */
  color: string
}>()
</script>

<template>
  <div
    class="mt-10 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-white"
    :style="{ backgroundColor: color }"
  >
    <UIcon :name="icon" class="size-4 shrink-0" />
    <span class="text-sm font-bold uppercase tracking-wide">{{ label }}</span>
  </div>
</template>
