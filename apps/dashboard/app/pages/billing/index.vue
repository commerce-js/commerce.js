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
  <UDashboardPanel id="billing">
    <template #header>
      <UDashboardNavbar title="Billing">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <p class="text-muted text-sm mb-6">
        Manage your subscription and payment methods
      </p>

      <div class="grid gap-6 lg:grid-cols-2">
        <!-- Current Plan -->
        <UCard>
          <template #header>
            <h2 class="text-lg font-semibold text-highlighted">
              Current Plan
            </h2>
          </template>

          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-muted">Plan</span>
              <span class="text-highlighted font-medium">{{ currentPlan.name }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-muted">Price</span>
              <span class="text-highlighted font-medium">{{ currentPlan.price }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-muted">Stores</span>
              <span class="text-highlighted font-medium">{{ currentPlan.stores }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-muted">Deployments</span>
              <span class="text-highlighted font-medium">{{ currentPlan.deploys }}</span>
            </div>
          </div>

          <template #footer>
            <UButton variant="outline" color="neutral" label="Manage Subscription" to="/billing/subscription" block />
          </template>
        </UCard>

        <!-- Recent Invoices -->
        <UCard>
          <template #header>
            <h2 class="text-lg font-semibold text-highlighted">
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
                <p class="text-sm text-highlighted">
                  {{ invoice.date }}
                </p>
                <p class="text-xs text-dimmed">
                  {{ invoice.id }}
                </p>
              </div>
              <div class="flex items-center gap-3">
                <span class="text-sm text-highlighted">{{ invoice.amount }}</span>
                <UBadge color="success" variant="subtle" size="xs">
                  {{ invoice.status }}
                </UBadge>
              </div>
            </div>
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
