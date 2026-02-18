<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const period = ref('24h')
const periods = [
  { label: '24 Hours', value: '24h' },
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' },
]

const stats = ref([
  { label: 'Requests', value: '12,847', change: '+12%', icon: 'i-lucide-globe' },
  { label: 'Bandwidth', value: '4.2 GB', change: '+8%', icon: 'i-lucide-hard-drive' },
  { label: 'Functions', value: '3,291', change: '-3%', icon: 'i-lucide-zap' },
  { label: 'Build Minutes', value: '14 min', change: '+5%', icon: 'i-lucide-timer' },
])
</script>

<template>
  <UDashboardPanel id="usage">
    <template #header>
      <UDashboardNavbar title="Usage">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <USelect :items="periods" v-model="period" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <p class="text-muted text-sm mb-6">
        Monitor resource consumption across your projects
      </p>

      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <UCard v-for="stat in stats" :key="stat.label">
          <div class="flex items-center gap-3">
            <div class="p-2 rounded-lg bg-primary/10">
              <UIcon :name="stat.icon" class="text-primary size-5" />
            </div>
            <div>
              <p class="text-xs text-muted">{{ stat.label }}</p>
              <p class="text-lg font-semibold text-highlighted">{{ stat.value }}</p>
            </div>
          </div>
          <p class="text-xs mt-2" :class="stat.change.startsWith('+') ? 'text-success' : 'text-error'">
            {{ stat.change }} from last period
          </p>
        </UCard>
      </div>

      <UCard>
        <div class="flex items-center justify-center py-16 text-muted text-sm">
          <div class="text-center">
            <UIcon name="i-lucide-bar-chart-3" class="size-8 mb-2 mx-auto text-dimmed" />
            <p>Usage charts coming soon</p>
          </div>
        </div>
      </UCard>
    </template>
  </UDashboardPanel>
</template>
