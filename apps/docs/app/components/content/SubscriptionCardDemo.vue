<script setup lang="ts">
const product = {
  id: 'sub_1',
  slug: 'pro-plan',
  name: { en: 'Pro Plan' },
  shortDescription: { en: 'Everything you need for a growing business.' },
  description: { en: '<ul><li>Unlimited products</li><li>Priority support</li><li>Analytics dashboard</li><li>Custom domain</li></ul>' },
  type: 'subscription',
  status: 'active',
  subscription: {
    interval: 'monthly',
    intervalCount: 1,
    trialDays: 14,
    recurringPrice: { amount: 29.99, currency: 'USD', formatted: '$29.99' }
  }
} as any
</script>

<template>
  <ComponentDemo>
    <div class="w-72">
      <CSubscriptionCard :product="product" featured />
    </div>
  </ComponentDemo>
</template>
