<script setup lang="ts">
useHead({
  title: 'Checkout — CommerceJS',
  meta: [
    { name: 'description', content: 'Complete your purchase.' },
  ],
})
</script>

<template>
  <UContainer class="py-12 md:py-16">
    <div class="max-w-2xl mx-auto text-center">
      <UIcon name="i-heroicons-shopping-bag" class="text-6xl text-primary mb-6" />
      <h1 class="text-3xl font-bold text-highlighted mb-4">Checkout</h1>
      <p class="text-lg text-muted mb-8">
        Checkout functionality coming soon.
      </p>
      <UButton to="/products" variant="outline" color="primary" size="lg">
        Continue Shopping
      </UButton>
    </div>
  </UContainer>
</template>
