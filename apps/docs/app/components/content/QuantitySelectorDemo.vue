<script setup>
const qty = ref(1)
</script>

<template>
  <ComponentDemo>
    <div class="flex items-center gap-4">
      <CQuantitySelector v-model="qty" :min="1" :max="10" />
      <span class="text-sm text-[var(--ui-text-muted)]">Value: {{ qty }}</span>
    </div>
  </ComponentDemo>
</template>
