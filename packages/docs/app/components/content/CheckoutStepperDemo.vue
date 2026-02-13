<script setup lang="ts">
const steps = [
  { id: 'shipping', title: 'Shipping', icon: 'i-heroicons-truck' },
  { id: 'payment', title: 'Payment', icon: 'i-heroicons-credit-card' },
  { id: 'review', title: 'Review', icon: 'i-heroicons-clipboard-document-check' }
]

const currentStep = ref(0)
</script>

<template>
  <ComponentDemo>
    <div class="w-full max-w-lg">
      <CCheckoutStepper
        v-model="currentStep"
        :steps="steps"
      />
      <div class="mt-4 flex justify-center gap-2">
        <UButton size="sm" variant="soft" :disabled="currentStep === 0" @click="currentStep--">Back</UButton>
        <UButton size="sm" :disabled="currentStep === steps.length - 1" @click="currentStep++">Next</UButton>
      </div>
    </div>
  </ComponentDemo>
</template>
