<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const projectId = route.params.id as string

const project = ref({
  id: projectId,
  name: 'My Store',
  slug: 'my-store',
  status: 'active',
  url: 'https://my-store.cjs.app',
  region: 'GCC (Riyadh)',
  repo: 'user/my-store',
})

const deployments = ref([
  { id: 'd1', status: 'ready', branch: 'main', commit: 'a1b2c3d', message: 'Update product catalog', duration: '42s', createdAt: '2 min ago' },
  { id: 'd2', status: 'ready', branch: 'main', commit: 'e4f5g6h', message: 'Fix checkout flow', duration: '38s', createdAt: '1 hour ago' },
  { id: 'd3', status: 'failed', branch: 'feat/new-theme', commit: 'i7j8k9l', message: 'Add new theme', duration: '15s', createdAt: '3 hours ago' },
])

const tabs = [
  { label: 'Deployments', value: 'deployments' },
  { label: 'Environment', value: 'env' },
  { label: 'Domains', value: 'domains' },
  { label: 'Settings', value: 'settings' },
]

const activeTab = ref('deployments')

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
  <UDashboardPanel :id="`project-${projectId}`">
    <template #header>
      <UDashboardNavbar :title="project.name">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #title>
          <div class="flex items-center gap-3">
            <h1 class="text-xl font-semibold text-highlighted">
              {{ project.name }}
            </h1>
            <UBadge color="success" variant="subtle" size="xs">
              {{ project.status }}
            </UBadge>
          </div>
        </template>

        <template #right>
          <UButton variant="outline" color="neutral" icon="i-lucide-external-link" label="Visit" />
          <UButton color="primary" icon="i-lucide-rocket" label="Deploy" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Project meta -->
      <div class="flex items-center gap-4 mb-6 text-sm text-muted">
        <span class="flex items-center gap-1">
          <UIcon name="i-lucide-globe" class="size-4" />
          {{ project.url }}
        </span>
        <span class="flex items-center gap-1">
          <UIcon name="i-simple-icons-github" class="size-4" />
          {{ project.repo }}
        </span>
        <span class="flex items-center gap-1">
          <UIcon name="i-lucide-map-pin" class="size-4" />
          {{ project.region }}
        </span>
      </div>

      <!-- Tabs -->
      <UTabs :items="tabs" v-model="activeTab" class="mb-6" color="neutral" />

      <!-- Deployments Tab -->
      <div v-if="activeTab === 'deployments'" class="space-y-3">
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

      <!-- Environment Tab -->
      <div v-else-if="activeTab === 'env'">
        <UCard>
          <div class="space-y-3">
            <div class="flex items-center gap-3">
              <UInput placeholder="KEY" class="flex-1 font-mono" />
              <UInput placeholder="value" class="flex-1 font-mono" type="password" />
              <UButton icon="i-lucide-plus" color="primary" variant="ghost" />
            </div>

            <USeparator />

            <div class="flex items-center justify-between py-2">
              <code class="text-sm text-toned">DATABASE_URL</code>
              <div class="flex items-center gap-2">
                <code class="text-sm text-dimmed">••••••••</code>
                <UButton icon="i-lucide-eye" variant="ghost" color="neutral" size="xs" />
                <UButton icon="i-lucide-trash-2" variant="ghost" color="error" size="xs" />
              </div>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Domains Tab -->
      <div v-else-if="activeTab === 'domains'">
        <UCard>
          <div class="space-y-4">
            <div class="flex items-center gap-3">
              <UInput placeholder="store.example.com" class="flex-1" size="lg" />
              <UButton label="Add Domain" color="primary" />
            </div>

            <div class="flex items-center justify-between py-3 border-t border-default">
              <div>
                <p class="text-sm text-highlighted font-medium">
                  my-store.cjs.app
                </p>
                <p class="text-xs text-dimmed">
                  Default domain
                </p>
              </div>
              <UBadge color="success" variant="subtle" size="xs">
                Active
              </UBadge>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Settings Tab -->
      <div v-else-if="activeTab === 'settings'">
        <UCard>
          <div class="space-y-6">
            <UFormField label="Project Name">
              <UInput :model-value="project.name" size="lg" />
            </UFormField>

            <UFormField label="Git Repository">
              <UInput :model-value="project.repo" size="lg" icon="i-simple-icons-github" />
            </UFormField>

            <USeparator />

            <div class="pt-2">
              <h3 class="text-sm font-medium text-error mb-2">
                Danger Zone
              </h3>
              <UButton color="error" variant="outline" label="Delete Project" icon="i-lucide-trash-2" />
            </div>
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
