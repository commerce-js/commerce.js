<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const projectId = route.params.id as string

// Mock project data
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
  <div>
    <!-- Project Header -->
    <div class="flex items-start justify-between mb-6">
      <div>
        <div class="flex items-center gap-3">
          <h1 class="text-2xl font-bold text-white">
            {{ project.name }}
          </h1>
          <UBadge color="success" variant="subtle" size="xs">
            {{ project.status }}
          </UBadge>
        </div>
        <div class="flex items-center gap-4 mt-2 text-sm text-gray-400">
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
      </div>

      <div class="flex gap-2">
        <UButton variant="outline" color="neutral" icon="i-lucide-external-link" label="Visit" />
        <UButton color="primary" icon="i-lucide-rocket" label="Deploy" />
      </div>
    </div>

    <!-- Tabs -->
    <UTabs :items="tabs" v-model="activeTab" class="mb-6" />

    <!-- Deployments Tab -->
    <div v-if="activeTab === 'deployments'" class="space-y-3">
      <div
        v-for="deploy in deployments"
        :key="deploy.id"
        class="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between hover:border-gray-700 transition-colors"
      >
        <div class="flex items-center gap-4">
          <UBadge :color="statusColor(deploy.status)" variant="subtle" size="xs">
            {{ deploy.status }}
          </UBadge>
          <div>
            <p class="text-sm text-white font-medium">
              {{ deploy.message }}
            </p>
            <p class="text-xs text-gray-500 mt-0.5">
              <span class="font-mono">{{ deploy.branch }}</span>
              ·
              <span class="font-mono">{{ deploy.commit }}</span>
              · {{ deploy.duration }}
            </p>
          </div>
        </div>
        <span class="text-xs text-gray-500">{{ deploy.createdAt }}</span>
      </div>
    </div>

    <!-- Environment Tab -->
    <div v-else-if="activeTab === 'env'">
      <UCard class="bg-gray-900 border-gray-800">
        <div class="space-y-3">
          <div class="flex items-center gap-3">
            <UInput placeholder="KEY" class="flex-1 font-mono" />
            <UInput placeholder="value" class="flex-1 font-mono" type="password" />
            <UButton icon="i-lucide-plus" color="primary" variant="ghost" />
          </div>

          <UDivider />

          <div class="flex items-center justify-between py-2">
            <code class="text-sm text-gray-300">DATABASE_URL</code>
            <div class="flex items-center gap-2">
              <code class="text-sm text-gray-500">••••••••</code>
              <UButton icon="i-lucide-eye" variant="ghost" color="neutral" size="xs" />
              <UButton icon="i-lucide-trash-2" variant="ghost" color="error" size="xs" />
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Domains Tab -->
    <div v-else-if="activeTab === 'domains'">
      <UCard class="bg-gray-900 border-gray-800">
        <div class="space-y-4">
          <div class="flex items-center gap-3">
            <UInput placeholder="store.example.com" class="flex-1" size="lg" />
            <UButton label="Add Domain" color="primary" />
          </div>

          <div class="flex items-center justify-between py-3 border-t border-gray-800">
            <div>
              <p class="text-sm text-white font-medium">
                my-store.cjs.app
              </p>
              <p class="text-xs text-gray-500">
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
      <UCard class="bg-gray-900 border-gray-800">
        <div class="space-y-6">
          <UFormField label="Project Name">
            <UInput :model-value="project.name" size="lg" />
          </UFormField>

          <UFormField label="Git Repository">
            <UInput :model-value="project.repo" size="lg" icon="i-simple-icons-github" />
          </UFormField>

          <UDivider />

          <div class="pt-2">
            <h3 class="text-sm font-medium text-red-400 mb-2">
              Danger Zone
            </h3>
            <UButton color="error" variant="outline" label="Delete Project" icon="i-lucide-trash-2" />
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
