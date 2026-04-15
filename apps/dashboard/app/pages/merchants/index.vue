<script setup lang="ts">
interface Merchant {
  id: string
  name: string
  email: string
  subdomain: string
  plan: string
  status: 'provisioning' | 'active' | 'suspended' | string
  currency: string
  locale: string
  customDomain: string | null
  trialEndsAt: string | null
  createdAt: string
}

// Polling — merchants in `provisioning` flip to `active` out-of-band; refresh
// every 5 s while at least one is in flight so operators see the transition.
const { data: merchants, refresh } = await useFetch<Merchant[]>('/api/merchants')

let timer: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  timer = setInterval(() => {
    if (merchants.value?.some(m => m.status === 'provisioning')) {
      refresh()
    }
  }, 5000)
})
onUnmounted(() => {
  if (timer) clearInterval(timer)
})

function statusColor(status: string): 'neutral' | 'primary' | 'success' | 'warning' | 'error' {
  switch (status) {
    case 'active': return 'success'
    case 'provisioning': return 'warning'
    case 'suspended': return 'error'
    default: return 'neutral'
  }
}

function relative(date: string): string {
  const d = new Date(date)
  const diff = Date.now() - d.getTime()
  const min = Math.round(diff / 60_000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m ago`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr}h ago`
  return d.toLocaleDateString()
}
</script>

<template>
  <UDashboardPanel id="merchants">
    <template #header>
      <UDashboardNavbar title="Merchants" :ui="{ right: 'gap-2' }">
        <template #right>
          <UButton
            to="/merchants/new"
            icon="i-lucide-plus"
            label="New merchant"
            color="primary"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="px-6 py-4">
        <UCard v-if="!merchants || merchants.length === 0" class="text-center py-12">
          <UIcon name="i-lucide-building-2" class="w-12 h-12 mx-auto text-muted" />
          <p class="mt-4 text-muted">
            No merchants yet. Create your first one to provision a dedicated
            Neon database and storefront.
          </p>
          <UButton
            to="/merchants/new"
            icon="i-lucide-plus"
            label="Create merchant"
            color="primary"
            class="mt-4"
          />
        </UCard>

        <UTable
          v-else
          :data="merchants"
          :columns="[
            { accessorKey: 'name', header: 'Name' },
            { accessorKey: 'subdomain', header: 'Subdomain' },
            { accessorKey: 'plan', header: 'Plan' },
            { accessorKey: 'status', header: 'Status' },
            { accessorKey: 'createdAt', header: 'Created' },
          ]"
        >
          <template #name-cell="{ row }">
            <NuxtLink
              :to="`/merchants/${row.original.id}`"
              class="font-medium text-primary-400 hover:underline"
            >
              {{ row.original.name }}
            </NuxtLink>
            <div class="text-xs text-muted">
              {{ row.original.email }}
            </div>
          </template>

          <template #subdomain-cell="{ row }">
            <span class="font-mono text-sm">{{ row.original.subdomain }}.commercejs.cloud</span>
          </template>

          <template #plan-cell="{ row }">
            <UBadge :label="row.original.plan" color="neutral" variant="subtle" class="capitalize" />
          </template>

          <template #status-cell="{ row }">
            <UBadge
              :label="row.original.status"
              :color="statusColor(row.original.status)"
              variant="subtle"
              class="capitalize"
            />
          </template>

          <template #createdAt-cell="{ row }">
            <span class="text-sm text-muted">{{ relative(row.original.createdAt) }}</span>
          </template>
        </UTable>
      </div>
    </template>
  </UDashboardPanel>
</template>
