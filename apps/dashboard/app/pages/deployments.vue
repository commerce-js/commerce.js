<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

// Fetch all projects first, then fetch deployments for each
const { data: projects } = await useFetch('/api/projects', { default: () => [] })

// Build a map of project names for display
const projectNames = computed(() => {
  const map: Record<string, string> = {}
  for (const p of projects.value || []) {
    map[(p as any).id] = (p as any).name
  }
  return map
})

// Fetch deployments across all projects
const allDeployments = ref<any[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    const results = await Promise.all(
      (projects.value || []).map(async (p: any) => {
        const deploys = await $fetch(`/api/projects/${p.id}/deployments`)
        return (deploys as any[]).map(d => ({ ...d, projectName: p.name }))
      }),
    )
    allDeployments.value = results
      .flat()
      .sort((a, b) => new Date(b.deployedAt).getTime() - new Date(a.deployedAt).getTime())
      .slice(0, 50)
  }
  finally {
    loading.value = false
  }
})

function statusColor(status: string) {
  switch (status) {
    case 'ready': return 'success' as const
    case 'building':
    case 'deploying': return 'warning' as const
    case 'failed': return 'error' as const
    default: return 'neutral' as const
  }
}

function formatDuration(ms: number | null | undefined) {
  if (!ms) return '—'
  return ms < 1000 ? `${ms}ms` : `${Math.round(ms / 1000)}s`
}

function formatTime(iso: string | null | undefined) {
  if (!iso) return '—'
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.round(diffMs / 60000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.round(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  return `${Math.round(diffHr / 24)}d ago`
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

      <!-- Loading state -->
      <div v-if="loading" class="flex justify-center py-12">
        <UIcon name="i-lucide-loader-2" class="size-6 animate-spin text-dimmed" />
      </div>

      <!-- Empty state -->
      <div v-else-if="!allDeployments.length" class="text-center py-16">
        <UIcon name="i-lucide-rocket" class="size-12 text-dimmed mx-auto mb-4" />
        <h3 class="text-lg font-semibold text-highlighted mb-2">
          No deployments yet
        </h3>
        <p class="text-sm text-muted">
          Deploy a project to see its history here
        </p>
      </div>

      <!-- Deployment list -->
      <div v-else class="space-y-3">
        <div
          v-for="deploy in allDeployments"
          :key="deploy.id"
          class="border border-default rounded-xl p-4 flex items-center justify-between hover:bg-elevated/50 transition-colors"
        >
          <div class="flex items-center gap-4">
            <UBadge :color="statusColor(deploy.status)" variant="subtle" size="xs">
              {{ deploy.status }}
            </UBadge>
            <div>
              <p class="text-sm text-highlighted font-medium">
                {{ deploy.environment }} deploy
              </p>
              <p class="text-xs text-dimmed mt-0.5">
                <span class="font-medium text-muted">{{ deploy.projectName }}</span>
                <template v-if="deploy.branch">
                  · <span class="font-mono">{{ deploy.branch }}</span>
                </template>
                <template v-if="deploy.commitSha">
                  · <span class="font-mono">{{ deploy.commitSha?.slice(0, 7) }}</span>
                </template>
                <template v-if="deploy.buildDurationMs">
                  · {{ formatDuration(deploy.buildDurationMs) }}
                </template>
              </p>
            </div>
          </div>
          <span class="text-xs text-dimmed">{{ formatTime(deploy.deployedAt) }}</span>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
