<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const monitors = ref([
  { name: 'my-store.cjs.app', status: 'up', uptime: '99.98%', latency: '42ms', lastCheck: '30s ago' },
  { name: 'test-store.cjs.app', status: 'up', uptime: '99.95%', latency: '68ms', lastCheck: '30s ago' },
  { name: 'api.my-store.cjs.app', status: 'down', uptime: '98.12%', latency: '—', lastCheck: '15s ago' },
])
</script>

<template>
  <UDashboardPanel id="uptime">
    <template #header>
      <UDashboardNavbar title="Uptime">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <p class="text-muted text-sm mb-6">
        Monitor the availability of your services
      </p>

      <div class="space-y-4">
        <UCard v-for="monitor in monitors" :key="monitor.name">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div
                class="size-3 rounded-full"
                :class="monitor.status === 'up' ? 'bg-success' : 'bg-error'"
              />
              <div>
                <p class="text-sm font-medium text-highlighted">{{ monitor.name }}</p>
                <p class="text-xs text-dimmed">Last checked {{ monitor.lastCheck }}</p>
              </div>
            </div>
            <div class="flex items-center gap-6 text-sm">
              <div class="text-right">
                <p class="text-dimmed text-xs">Uptime</p>
                <p class="font-medium text-highlighted">{{ monitor.uptime }}</p>
              </div>
              <div class="text-right">
                <p class="text-dimmed text-xs">Latency</p>
                <p class="font-medium text-highlighted">{{ monitor.latency }}</p>
              </div>
              <UBadge
                :color="monitor.status === 'up' ? 'success' : 'error'"
                variant="subtle"
                size="xs"
              >
                {{ monitor.status }}
              </UBadge>
            </div>
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
