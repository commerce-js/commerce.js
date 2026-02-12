<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
}>()
</script>

<template>
  <div class="mb-12 md:mb-16 text-center">
    <h2 class="m-0 mb-2 text-3xl md:text-4xl font-bold text-zinc-900 dark:text-zinc-100">
      {{ title }}
    </h2>
    <p
      v-if="subtitle"
      class="m-0 text-sm font-medium uppercase tracking-[0.2em] text-success-500 dark:text-success-400"
    >
      {{ subtitle }}
    </p>
  </div>
</template>
