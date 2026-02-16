<script setup lang="ts">
const loading = ref(false)

function handleSubmit(data: any) {
  loading.value = true
  setTimeout(() => { loading.value = false }, 1500)
}
</script>

<template>
  <ComponentDemo>
    <div class="w-full max-w-md mx-auto">
      <div class="rounded-xl bg-elevated/50 ring ring-default p-6">
        <div class="flex items-center gap-2 mb-4">
          <UIcon name="i-heroicons-gift-20-solid" class="text-primary text-lg" />
          <h3 class="text-base font-semibold text-highlighted">Send a Gift Card</h3>
        </div>
        <CGiftCardForm
          :amounts="[25, 50, 100, 200, 500]"
          currency="USD"
          :loading="loading"
          @submit="handleSubmit"
        />
      </div>
    </div>
  </ComponentDemo>
</template>
