<script setup lang="ts">
/**
 * ComponentDemo — Generic preview wrapper for component demos in docs.
 * Renders a bordered card with "Preview" label above the slotted content.
 */
defineProps<{
  /** Optional label, defaults to "Preview" */
  label?: string
  /** Background style */
  background?: 'default' | 'subtle' | 'checkered'
  /** Max width class */
  maxWidth?: string
}>()
</script>

<template>
  <div class="not-prose my-6">
    <div class="text-xs font-semibold text-[var(--ui-text-muted)] uppercase tracking-wider mb-2">
      {{ label || 'Preview' }}
    </div>
    <div
      class="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] p-6 flex items-start justify-center overflow-visible"
      :class="maxWidth"
    >
      <slot />
    </div>
  </div>
</template>
