<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const customerId = route.params.id as string
const adminClient = useAdminClient()

const { data: customer, status } = useAsyncData(
  `admin-customer-${customerId}`,
  () => adminClient.getCustomer(customerId)
)

function fullName(c: any) {
  return [c?.firstName, c?.lastName].filter(Boolean).join(' ') || c?.email || 'Unknown'
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  })
}
</script>

<template>
  <UDashboardPanel id="customer-detail">
    <template #header>
      <UDashboardNavbar :title="customer ? fullName(customer) : 'Customer Details'">
        <template #leading>
          <UButton icon="i-lucide-arrow-left" variant="ghost" to="/store/customers" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Loading -->
      <div v-if="status === 'pending'" class="space-y-4 p-4">
        <div v-for="i in 3" :key="i" class="h-32 animate-pulse bg-muted/20 rounded" />
      </div>

      <!-- Customer Data -->
      <div v-else-if="customer" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Addresses -->
          <UCard>
            <template #header>
              <h3 class="font-semibold text-highlighted">Addresses ({{ customer.addresses?.length ?? 0 }})</h3>
            </template>
            <div v-if="customer.addresses?.length" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                v-for="addr in customer.addresses"
                :key="addr.id"
                class="p-4 rounded-lg border border-default"
                :class="{ 'ring-2 ring-primary/30': addr.isDefault }"
              >
                <div class="flex items-center gap-2 mb-2">
                  <UBadge v-if="addr.isDefault" color="primary" variant="subtle" size="xs">Default</UBadge>
                </div>
                <p class="text-sm text-highlighted">{{ addr.firstName }} {{ addr.lastName }}</p>
                <p class="text-xs text-muted">{{ addr.street }}</p>
                <p v-if="addr.street2" class="text-xs text-muted">{{ addr.street2 }}</p>
                <p class="text-xs text-muted">
                  {{ addr.city }}<span v-if="addr.state">, {{ addr.state }}</span>
                  {{ addr.postalCode }}
                </p>
                <p class="text-xs text-muted">{{ addr.country }}</p>
                <p v-if="addr.phone" class="text-xs text-muted mt-1">{{ addr.phone }}</p>
              </div>
            </div>
            <p v-else class="text-sm text-muted py-4 text-center">No addresses on file</p>
          </UCard>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Profile -->
          <UCard>
            <template #header>
              <h3 class="font-semibold text-highlighted">Profile</h3>
            </template>
            <div class="flex flex-col items-center text-center mb-4">
              <UAvatar :alt="fullName(customer)" size="xl" class="mb-3" />
              <h4 class="font-semibold text-highlighted">{{ fullName(customer) }}</h4>
              <p class="text-sm text-muted">{{ customer.email }}</p>
            </div>
            <div class="space-y-3 text-sm">
              <div v-if="customer.phone" class="flex justify-between">
                <span class="text-muted">Phone</span>
                <span class="text-highlighted">{{ customer.phone }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted">Joined</span>
                <span class="text-highlighted">{{ formatDate(customer.createdAt) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted">Last Updated</span>
                <span class="text-highlighted">{{ formatDate(customer.updatedAt) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted">Addresses</span>
                <span class="text-highlighted">{{ customer.addresses?.length ?? 0 }}</span>
              </div>
            </div>
          </UCard>

          <!-- Customer ID -->
          <UCard>
            <template #header>
              <h3 class="font-semibold text-highlighted">System</h3>
            </template>
            <div class="space-y-3 text-sm">
              <div>
                <span class="text-muted">Customer ID</span>
                <p class="text-highlighted font-mono text-xs break-all">{{ customer.id }}</p>
              </div>
            </div>
          </UCard>
        </div>
      </div>

      <!-- Error State -->
      <div v-else class="text-center py-12">
        <UIcon name="i-lucide-alert-circle" class="text-error size-8 mb-2" />
        <p class="text-muted">Customer not found</p>
        <UButton variant="outline" to="/store/customers" class="mt-4">Back to Customers</UButton>
      </div>
    </template>
  </UDashboardPanel>
</template>
