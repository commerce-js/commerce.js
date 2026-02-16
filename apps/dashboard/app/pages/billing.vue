<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const currentPlan = ref({
  name: 'Pro',
  price: '$29/mo',
  stores: '5 stores',
  deploys: 'Unlimited deploys',
})

const invoices = ref([
  { id: 'inv_001', date: 'Feb 2026', amount: '$29.00', status: 'paid' },
  { id: 'inv_002', date: 'Jan 2026', amount: '$29.00', status: 'paid' },
])
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-white">
        Billing
      </h1>
      <p class="mt-1 text-gray-400 text-sm">
        Manage your subscription and payment methods
      </p>
    </div>

    <div class="grid gap-6 lg:grid-cols-2">
      <!-- Current Plan -->
      <UCard class="bg-gray-900 border-gray-800">
        <template #header>
          <h2 class="text-lg font-semibold text-white">
            Current Plan
          </h2>
        </template>

        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-gray-400">Plan</span>
            <span class="text-white font-medium">{{ currentPlan.name }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-gray-400">Price</span>
            <span class="text-white font-medium">{{ currentPlan.price }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-gray-400">Stores</span>
            <span class="text-white font-medium">{{ currentPlan.stores }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-gray-400">Deployments</span>
            <span class="text-white font-medium">{{ currentPlan.deploys }}</span>
          </div>
        </div>

        <template #footer>
          <UButton variant="outline" color="neutral" label="Manage Subscription" block />
        </template>
      </UCard>

      <!-- Recent Invoices -->
      <UCard class="bg-gray-900 border-gray-800">
        <template #header>
          <h2 class="text-lg font-semibold text-white">
            Invoices
          </h2>
        </template>

        <div class="space-y-3">
          <div
            v-for="invoice in invoices"
            :key="invoice.id"
            class="flex items-center justify-between py-2"
          >
            <div>
              <p class="text-sm text-white">
                {{ invoice.date }}
              </p>
              <p class="text-xs text-gray-500">
                {{ invoice.id }}
              </p>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-sm text-white">{{ invoice.amount }}</span>
              <UBadge color="success" variant="subtle" size="xs">
                {{ invoice.status }}
              </UBadge>
            </div>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
