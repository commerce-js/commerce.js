<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const deployments = ref([
  { id: 'd1', project: 'My Store', status: 'ready', branch: 'main', commit: 'a1b2c3d', message: 'Update product catalog', duration: '42s', createdAt: '2 min ago' },
  { id: 'd2', project: 'My Store', status: 'ready', branch: 'main', commit: 'e4f5g6h', message: 'Fix checkout flow', duration: '38s', createdAt: '1 hour ago' },
  { id: 'd3', project: 'Test Store', status: 'failed', branch: 'feat/new-theme', commit: 'i7j8k9l', message: 'Add new theme', duration: '15s', createdAt: '3 hours ago' },
  { id: 'd4', project: 'My Store', status: 'ready', branch: 'main', commit: 'm1n2o3p', message: 'Update pricing page', duration: '45s', createdAt: '5 hours ago' },
  { id: 'd5', project: 'Test Store', status: 'ready', branch: 'main', commit: 'q4r5s6t', message: 'Initial deploy', duration: '52s', createdAt: '1 day ago' },
])

const statusColor = (status: string) => {
  switch (status) {
    case 'ready': return 'success' as const
    case 'building': return 'warning' as const
    case 'failed': return 'error' as const
    default: return 'neutral' as const
  }
}
</script>

<template>
  <UDashboardPanel id="deployments">
    <template #header>
      <UDashboardNavbar title="Deployments">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <p class="text-muted text-sm mb-6">
        All deployments across your projects
      </p>

      <div class="space-y-3">
        <div
          v-for="deploy in deployments"
          :key="deploy.id"
          class="border border-default rounded-xl p-4 flex items-center justify-between hover:bg-elevated/50 transition-colors"
        >
          <div class="flex items-center gap-4">
            <UBadge :color="statusColor(deploy.status)" variant="subtle" size="xs">
              {{ deploy.status }}
            </UBadge>
            <div>
              <p class="text-sm text-highlighted font-medium">
                {{ deploy.message }}
              </p>
              <p class="text-xs text-dimmed mt-0.5">
                <span class="font-medium text-muted">{{ deploy.project }}</span>
                ·
                <span class="font-mono">{{ deploy.branch }}</span>
                ·
                <span class="font-mono">{{ deploy.commit }}</span>
                · {{ deploy.duration }}
              </p>
            </div>
          </div>
          <span class="text-xs text-dimmed">{{ deploy.createdAt }}</span>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
