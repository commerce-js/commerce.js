<script setup lang="ts">
const initialItems = [
  { productId: 'p1', productName: 'Industrial LED Panel', quantity: 100, targetPrice: 22 },
  { productId: 'p2', productName: 'Cable Harness Kit', quantity: 500, targetPrice: 8 },
]

const loading = ref(false)

function handleSubmit(data: any) {
  loading.value = true
  setTimeout(() => { loading.value = false }, 1500)
}
</script>

<template>
  <ComponentDemo>
    <div class="w-full max-w-lg mx-auto">
      <div class="rounded-xl bg-elevated/50 ring ring-default p-6">
        <div class="flex items-center gap-2 mb-4">
          <UIcon name="i-heroicons-document-text-20-solid" class="text-primary text-lg" />
          <h3 class="text-base font-semibold text-highlighted">Request a Quote</h3>
        </div>
        <CQuoteRequestForm
          :initial-items="initialItems"
          :loading="loading"
          @submit="handleSubmit"
        />
      </div>
    </div>
  </ComponentDemo>
</template>
