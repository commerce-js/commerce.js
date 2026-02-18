<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const subscription = ref({
  plan: 'Pro',
  status: 'active',
  price: '$49/mo',
  billingCycle: 'Monthly',
  nextBillingDate: 'March 1, 2026',
  startDate: 'December 1, 2025',
  paymentMethod: 'Visa ending in 4242',
})

const plans = ref([
  {
    name: 'Starter',
    price: '$0',
    period: '/mo',
    description: 'For individuals getting started',
    features: ['1 store', '100 products', '1,000 orders/mo', 'Community support'],
    current: false,
  },
  {
    name: 'Pro',
    price: '$49',
    period: '/mo',
    description: 'For growing businesses',
    features: ['5 stores', 'Unlimited products', '10,000 orders/mo', 'Priority support', 'Custom domain', 'Analytics'],
    current: true,
  },
  {
    name: 'Enterprise',
    price: '$199',
    period: '/mo',
    description: 'For large-scale operations',
    features: ['Unlimited stores', 'Unlimited products', 'Unlimited orders', 'Dedicated support', 'Custom integrations', 'SLA guarantee', 'SSO'],
    current: false,
  },
])

const invoices = ref([
  { id: 'INV-2026-002', date: 'Feb 1, 2026', amount: '$49.00', status: 'paid' },
  { id: 'INV-2026-001', date: 'Jan 1, 2026', amount: '$49.00', status: 'paid' },
  { id: 'INV-2025-012', date: 'Dec 1, 2025', amount: '$49.00', status: 'paid' },
])
</script>

<template>
  <UDashboardPanel id="subscription">
    <template #header>
      <UDashboardNavbar title="Manage Subscription">
        <template #leading>
          <UDashboardSidebarCollapse />
          <UButton to="/billing" icon="i-lucide-arrow-left" variant="ghost" color="neutral" size="sm" class="mr-2" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="max-w-4xl space-y-8">
        <!-- Current Plan -->
        <UCard>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="p-3 rounded-xl bg-primary/10">
                <UIcon name="i-lucide-crown" class="text-primary size-6" />
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h2 class="text-xl font-semibold text-highlighted">{{ subscription.plan }} Plan</h2>
                  <UBadge color="success" variant="subtle" size="xs">{{ subscription.status }}</UBadge>
                </div>
                <p class="text-sm text-muted mt-1">
                  {{ subscription.price }} · {{ subscription.billingCycle }}
                </p>
              </div>
            </div>
            <div class="text-right text-sm">
              <p class="text-dimmed">Next billing date</p>
              <p class="text-highlighted font-medium">{{ subscription.nextBillingDate }}</p>
            </div>
          </div>
        </UCard>

        <!-- Plan Comparison -->
        <div>
          <h3 class="text-lg font-semibold text-highlighted mb-4">Available Plans</h3>
          <div class="grid gap-4 lg:grid-cols-3">
            <UCard
              v-for="plan in plans"
              :key="plan.name"
              :class="plan.current ? 'ring-2 ring-primary' : ''"
            >
              <div class="text-center mb-4">
                <h4 class="text-lg font-semibold text-highlighted">{{ plan.name }}</h4>
                <div class="mt-2">
                  <span class="text-3xl font-bold text-highlighted">{{ plan.price }}</span>
                  <span class="text-sm text-dimmed">{{ plan.period }}</span>
                </div>
                <p class="text-xs text-muted mt-1">{{ plan.description }}</p>
              </div>

              <ul class="space-y-2 mb-6">
                <li v-for="feature in plan.features" :key="feature" class="flex items-center gap-2 text-sm text-muted">
                  <UIcon name="i-lucide-check" class="text-success size-4 shrink-0" />
                  {{ feature }}
                </li>
              </ul>

              <UButton
                block
                :variant="plan.current ? 'solid' : 'outline'"
                :color="plan.current ? 'primary' : 'neutral'"
                :label="plan.current ? 'Current Plan' : 'Upgrade'"
                :disabled="plan.current"
              />
            </UCard>
          </div>
        </div>

        <!-- Payment Method -->
        <UCard>
          <template #header>
            <h3 class="font-semibold text-highlighted">Payment Method</h3>
          </template>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-lg bg-elevated">
                <UIcon name="i-lucide-credit-card" class="text-muted size-5" />
              </div>
              <div>
                <p class="text-sm font-medium text-highlighted">{{ subscription.paymentMethod }}</p>
                <p class="text-xs text-dimmed">Expires 12/2028</p>
              </div>
            </div>
            <UButton variant="outline" color="neutral" label="Update" size="sm" />
          </div>
        </UCard>

        <!-- Invoices -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="font-semibold text-highlighted">Billing History</h3>
              <UButton variant="ghost" color="neutral" label="Download All" icon="i-lucide-download" size="xs" />
            </div>
          </template>
          <UTable
            :data="invoices"
            :columns="[
              { accessorKey: 'id', header: 'Invoice' },
              { accessorKey: 'date', header: 'Date' },
              { accessorKey: 'amount', header: 'Amount' },
              { accessorKey: 'status', header: 'Status' },
            ]"
          >
            <template #status-cell="{ row }">
              <UBadge color="success" variant="subtle" size="xs">{{ row.original.status }}</UBadge>
            </template>
          </UTable>
        </UCard>

        <!-- Cancel -->
        <UCard class="border-error/20">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="font-semibold text-error">Cancel Subscription</h3>
              <p class="text-sm text-dimmed mt-1">
                Your subscription will remain active until {{ subscription.nextBillingDate }}
              </p>
            </div>
            <UButton variant="outline" color="error" label="Cancel Plan" />
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
