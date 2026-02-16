<script setup>
const rating = ref(3)
</script>

<template>
  <ComponentDemo>
    <div class="flex flex-col gap-4 items-center">
      <div class="flex items-center gap-3">
        <span class="text-sm text-muted">Read-only:</span>
        <CReviewStars :model-value="4.5" />
      </div>
      <div class="flex items-center gap-3">
        <span class="text-sm text-muted">Interactive:</span>
        <CReviewStars v-model="rating" interactive />
        <span class="text-sm text-muted">({{ rating }})</span>
      </div>
    </div>
  </ComponentDemo>
</template>
