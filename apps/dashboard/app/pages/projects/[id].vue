<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const projectId = route.params.id as string

// Fetch project
const { data: project, refresh: refreshProject, status: projectStatus } = await useFetch(`/api/projects/${projectId}`, {
  default: () => null,
})

// Fetch deployments
const { data: deployments, refresh: refreshDeployments } = await useFetch(`/api/projects/${projectId}/deployments`, {
  default: () => [],
})

// Fetch env vars
const { data: envVars, refresh: refreshEnvVars } = await useFetch(`/api/projects/${projectId}/env`, {
  default: () => [],
})

// Tabs
const tabs = [
  { label: 'Deployments', value: 'deployments' },
  { label: 'Environment', value: 'env' },
  { label: 'Domains', value: 'domains' },
  { label: 'Settings', value: 'settings' },
]
const activeTab = ref('deployments')

// Deploy
const toast = useToast()
const deploying = ref(false)
async function triggerDeploy() {
  deploying.value = true
  try {
    await $fetch(`/api/projects/${projectId}/deploy`, {
      method: 'POST',
      body: { environment: 'production' },
    })
    toast.add({ title: 'Deployment started', color: 'success', icon: 'i-lucide-rocket' })
    await refreshDeployments()
    startPolling()
  }
  catch (error: any) {
    const message = error?.data?.message || error?.message || 'Deployment failed'
    toast.add({ title: 'Deploy failed', description: message, color: 'error', icon: 'i-lucide-alert-circle' })
    console.error('Deploy failed:', error)
  }
  finally {
    deploying.value = false
  }
}

// ---------------------------------------------------------------------------
// Live deploy polling — auto-refresh while a deploy is in progress
// ---------------------------------------------------------------------------
const POLL_INTERVAL = 3000
let pollTimer: ReturnType<typeof setInterval> | null = null

const activeDeployment = computed(() => {
  if (!deployments.value?.length) return null
  const active = deployments.value.find((d: any) =>
    ['building', 'deploying', 'queued', 'initializing'].includes(d.status),
  )
  return active ?? null
})

const deploySteps = computed(() => {
  const d = activeDeployment.value
  if (!d) return []
  const steps = [
    { label: 'Queued', key: 'queued', icon: 'i-lucide-clock' },
    { label: 'Building', key: 'building', icon: 'i-lucide-hammer' },
    { label: 'Deploying', key: 'deploying', icon: 'i-lucide-upload-cloud' },
    { label: 'Ready', key: 'ready', icon: 'i-lucide-check-circle' },
  ]
  const statusOrder = ['queued', 'initializing', 'building', 'deploying', 'ready']
  const currentIdx = statusOrder.indexOf(d.status)
  return steps.map((step, i) => ({
    ...step,
    status: i < currentIdx ? 'complete' : i === currentIdx ? 'current' : 'pending',
  }))
})

function startPolling() {
  if (pollTimer) return
  pollTimer = setInterval(async () => {
    await refreshDeployments()
    // Stop polling if no active deployment
    if (!activeDeployment.value) {
      stopPolling()
    }
  }, POLL_INTERVAL)
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

// Start polling if there's already an active deployment
if (activeDeployment.value) {
  startPolling()
}

onUnmounted(() => {
  stopPolling()
})

// Env vars
const newEnvKey = ref('')
const newEnvValue = ref('')
const addingEnv = ref(false)
async function addEnvVar() {
  if (!newEnvKey.value || !newEnvValue.value) return
  addingEnv.value = true
  try {
    await $fetch(`/api/projects/${projectId}/env`, {
      method: 'POST',
      body: {
        key: newEnvKey.value,
        value: newEnvValue.value,
        isSecret: true,
      },
    })
    newEnvKey.value = ''
    newEnvValue.value = ''
    await refreshEnvVars()
  }
  finally {
    addingEnv.value = false
  }
}

async function deleteEnvVar(envId: string) {
  await $fetch(`/api/projects/${projectId}/env`, {
    method: 'DELETE',
    body: { id: envId },
  })
  await refreshEnvVars()
}

// ---------------------------------------------------------------------------
// GitHub connection & repo picker
// ---------------------------------------------------------------------------
const { data: sessionData } = await useFetch<{ authenticated: boolean; githubUsername?: string }>('/api/auth/session')
const isGithubConnected = computed(() => sessionData.value?.authenticated ?? false)
const githubUsername = computed(() => sessionData.value?.githubUsername ?? '')

const repoUrl = ref(project.value?.repoUrl || '')
const webhookSecret = ref(project.value?.githubWebhookSecret || '')
const savingRepo = ref(false)

// Repos list
const repoSearch = ref('')
const { data: githubRepos, status: reposStatus } = await useFetch<any[]>('/api/github/repos', {
  lazy: true,
  default: () => [],
  watch: false,
})
const filteredRepos = computed(() => {
  if (!githubRepos.value) return []
  const q = repoSearch.value.toLowerCase()
  if (!q) return githubRepos.value
  return githubRepos.value.filter((r: any) =>
    r.fullName.toLowerCase().includes(q) || r.description?.toLowerCase()?.includes(q),
  )
})

// Create from template
const showCreateRepo = ref(false)
const newRepoName = ref('')
const newRepoPrivate = ref(false)
const creatingRepo = ref(false)

async function createFromTemplate() {
  if (!newRepoName.value) return
  creatingRepo.value = true
  try {
    const repo = await $fetch<any>('/api/github/repos', {
      method: 'POST',
      body: {
        name: newRepoName.value,
        private: newRepoPrivate.value,
      },
    })
    repoUrl.value = repo.fullName
    showCreateRepo.value = false
    newRepoName.value = ''
    await saveRepoSettings()
  }
  finally {
    creatingRepo.value = false
  }
}

// Select an existing repo
async function selectRepo(repo: any) {
  repoUrl.value = repo.fullName
  await saveRepoSettings()
}

// Webhook helpers
const webhookUrl = computed(() => {
  if (typeof window === 'undefined') return ''
  return `${window.location.origin}/api/github-webhook`
})

function generateWebhookSecret() {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  webhookSecret.value = Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

async function saveRepoSettings() {
  savingRepo.value = true
  try {
    if (!webhookSecret.value) {
      generateWebhookSecret()
    }
    await $fetch(`/api/projects/${projectId}`, {
      method: 'PATCH',
      body: {
        repoUrl: repoUrl.value,
        githubWebhookSecret: webhookSecret.value,
      },
    })
    await refreshProject()
  }
  finally {
    savingRepo.value = false
  }
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
  }
  catch {
    const el = document.createElement('textarea')
    el.value = text
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
  }
}

// Delete project
const confirmDelete = ref(false)
async function deleteProject() {
  await $fetch(`/api/projects/${projectId}`, { method: 'DELETE' })
  await navigateTo('/projects')
}

// Status display
function deployStatusColor(status: string) {
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
  <UDashboardPanel :id="`project-${projectId}`">
    <template #header>
      <UDashboardNavbar :title="project?.name || 'Loading...'">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #title>
          <div class="flex items-center gap-3">
            <h1 class="text-xl font-semibold text-highlighted">
              {{ project?.name || 'Loading...' }}
            </h1>
            <UBadge
              v-if="project?.cfPagesProjectName"
              color="success"
              variant="subtle"
              size="xs"
            >
              active
            </UBadge>
            <UBadge v-else color="warning" variant="subtle" size="xs">
              pending
            </UBadge>
          </div>
        </template>

        <template #right>
          <UButton
            v-if="project?.subdomain"
            variant="outline"
            color="neutral"
            icon="i-lucide-external-link"
            label="Visit"
            :to="`https://${project.subdomain}`"
            target="_blank"
          />
          <UButton
            color="primary"
            icon="i-lucide-rocket"
            label="Deploy"
            :loading="deploying"
            @click="triggerDeploy"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Loading state -->
      <div v-if="projectStatus === 'pending'" class="flex justify-center py-12">
        <UIcon name="i-lucide-loader-2" class="size-6 animate-spin text-dimmed" />
      </div>

      <template v-else-if="project">
        <!-- Project meta -->
        <div class="flex items-center gap-4 mb-6 text-sm text-muted">
          <span class="flex items-center gap-1">
            <UIcon name="i-lucide-globe" class="size-4" />
            {{ project.subdomain }}
          </span>
          <a v-if="project.repoUrl" :href="`https://github.com/${project.repoUrl}`" target="_blank" class="flex items-center gap-1 hover:text-primary transition-colors">
            <UIcon name="i-simple-icons-github" class="size-4" />
            {{ project.repoUrl }}
          </a>
          <span class="flex items-center gap-1">
            <UIcon name="i-lucide-zap" class="size-4" />
            {{ project.plan }}
          </span>
        </div>

        <!-- Active Deployment Banner -->
        <div
          v-if="activeDeployment"
          class="mb-6 border border-warning/30 bg-warning/5 rounded-xl p-5"
        >
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-loader-2" class="size-5 animate-spin text-warning" />
              <span class="font-semibold text-highlighted">Deployment in progress</span>
            </div>
            <span class="text-xs text-dimmed">
              {{ activeDeployment.environment }} · {{ activeDeployment.branch || 'main' }}
            </span>
          </div>

          <!-- Step indicators -->
          <div class="flex items-center gap-2">
            <template v-for="(step, i) in deploySteps" :key="step.key">
              <div class="flex items-center gap-1.5">
                <div
                  :class="[
                    'flex items-center justify-center rounded-full size-7 text-xs font-medium transition-colors',
                    step.status === 'complete'
                      ? 'bg-success/15 text-success'
                      : step.status === 'current'
                        ? 'bg-warning/15 text-warning ring-2 ring-warning/30'
                        : 'bg-muted/10 text-dimmed',
                  ]"
                >
                  <UIcon
                    v-if="step.status === 'complete'"
                    name="i-lucide-check"
                    class="size-4"
                  />
                  <UIcon
                    v-else-if="step.status === 'current'"
                    :name="step.icon"
                    class="size-4 animate-pulse"
                  />
                  <UIcon
                    v-else
                    :name="step.icon"
                    class="size-4 opacity-40"
                  />
                </div>
                <span
                  :class="[
                    'text-xs font-medium',
                    step.status === 'complete' ? 'text-success' : step.status === 'current' ? 'text-warning' : 'text-dimmed',
                  ]"
                >
                  {{ step.label }}
                </span>
              </div>
              <div
                v-if="i !== deploySteps.length - 1"
                :class="[
                  'flex-1 h-px',
                  step.status === 'complete' ? 'bg-success/30' : 'bg-muted/20',
                ]"
              />
            </template>
          </div>
        </div>

        <!-- Tabs -->
        <UTabs :items="tabs" v-model="activeTab" class="mb-6" color="neutral" />

        <!-- Deployments Tab -->
        <div v-if="activeTab === 'deployments'" class="space-y-3">
          <div v-if="!deployments?.length" class="text-center py-12 text-dimmed">
            <UIcon name="i-lucide-rocket" class="size-10 mx-auto mb-3 opacity-50" />
            <p class="text-sm">No deployments yet. Click Deploy to get started.</p>
          </div>

          <div
            v-for="deploy in deployments"
            :key="deploy.id"
            :class="[
              'border rounded-xl p-4 flex items-center justify-between transition-colors',
              ['building', 'deploying', 'queued', 'initializing'].includes(deploy.status)
                ? 'border-warning/40 bg-warning/5'
                : 'border-default hover:bg-elevated/50',
            ]"
          >
            <div class="flex items-center gap-4">
              <div class="relative">
                <UBadge :color="deployStatusColor(deploy.status)" variant="subtle" size="xs">
                  {{ deploy.status }}
                </UBadge>
                <UIcon
                  v-if="['building', 'deploying', 'queued'].includes(deploy.status)"
                  name="i-lucide-loader-2"
                  class="size-3 animate-spin text-warning absolute -top-1 -right-1"
                />
              </div>
              <div>
                <p class="text-sm text-highlighted font-medium">
                  {{ deploy.environment }} deploy
                </p>
                <p class="text-xs text-dimmed mt-0.5">
                  <span v-if="deploy.branch" class="font-mono">{{ deploy.branch }}</span>
                  <template v-if="deploy.commitSha">
                    · <span class="font-mono">{{ deploy.commitSha?.slice(0, 7) }}</span>
                  </template>
                  <template v-if="deploy.buildDurationMs">
                    · {{ formatDuration(deploy.buildDurationMs) }}
                  </template>
                </p>
                <p v-if="deploy.status === 'failed' && deploy.error" class="text-xs text-error mt-1 max-w-md truncate">
                  {{ deploy.error }}
                </p>
              </div>
            </div>
            <div class="text-right">
              <span class="text-xs text-dimmed">{{ formatTime(deploy.deployedAt || deploy.createdAt) }}</span>
              <p v-if="deploy.url" class="text-xs text-primary font-mono mt-0.5">
                {{ deploy.url }}
              </p>
            </div>
          </div>
        </div>

        <!-- Environment Tab -->
        <div v-else-if="activeTab === 'env'">
          <UCard>
            <div class="space-y-3">
              <div class="flex items-center gap-3">
                <UInput v-model="newEnvKey" placeholder="KEY" class="flex-1 font-mono" />
                <UInput v-model="newEnvValue" placeholder="value" class="flex-1 font-mono" type="password" />
                <UButton
                  icon="i-lucide-plus"
                  color="primary"
                  variant="ghost"
                  :loading="addingEnv"
                  :disabled="!newEnvKey || !newEnvValue"
                  @click="addEnvVar"
                />
              </div>

              <USeparator />

              <div v-if="!envVars?.length" class="py-4 text-center text-sm text-dimmed">
                No environment variables set
              </div>

              <div
                v-for="env in envVars"
                :key="env.id"
                class="flex items-center justify-between py-2"
              >
                <code class="text-sm text-toned">{{ env.key }}</code>
                <div class="flex items-center gap-2">
                  <code class="text-sm text-dimmed">{{ env.value }}</code>
                  <UButton
                    icon="i-lucide-trash-2"
                    variant="ghost"
                    color="error"
                    size="xs"
                    @click="deleteEnvVar(env.id)"
                  />
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
                    {{ project.subdomain }}
                  </p>
                  <p class="text-xs text-dimmed">
                    Default domain
                  </p>
                </div>
                <UBadge color="success" variant="subtle" size="xs">
                  Active
                </UBadge>
              </div>

              <div
                v-if="project.customDomain"
                class="flex items-center justify-between py-3 border-t border-default"
              >
                <div>
                  <p class="text-sm text-highlighted font-medium">
                    {{ project.customDomain }}
                  </p>
                  <p class="text-xs text-dimmed">
                    Custom domain
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
        <div v-else-if="activeTab === 'settings'" class="space-y-6">
          <!-- Connect Repository -->
          <UCard>
            <div class="space-y-4">
              <div class="flex items-center gap-2 mb-1">
                <UIcon name="i-simple-icons-github" class="size-5" />
                <h3 class="text-sm font-semibold text-highlighted">Connect Repository</h3>
              </div>

              <!-- Not connected to GitHub -->
              <template v-if="!isGithubConnected">
                <p class="text-xs text-dimmed">
                  Connect your GitHub account to browse repos, create from template, and enable push-to-deploy.
                </p>
                <UButton
                  label="Connect GitHub"
                  icon="i-simple-icons-github"
                  color="neutral"
                  variant="outline"
                  @click="navigateTo('/api/auth/github', { external: true })"
                />
              </template>

              <!-- Connected to GitHub -->
              <template v-else>
                <div class="flex items-center gap-2 text-xs text-dimmed">
                  <UIcon name="i-lucide-check-circle" class="text-success size-4" />
                  <span>Connected as <strong class="text-highlighted">{{ githubUsername }}</strong></span>
                </div>

                <!-- Currently linked repo -->
                <template v-if="repoUrl">
                  <div class="flex items-center justify-between py-3 px-4 rounded-lg bg-elevated/50 border border-default">
                    <div class="flex items-center gap-3">
                      <UIcon name="i-simple-icons-github" class="size-5 text-dimmed" />
                      <div>
                        <p class="text-sm font-medium text-highlighted">{{ repoUrl }}</p>
                        <p class="text-xs text-dimmed">Push-to-deploy enabled</p>
                      </div>
                    </div>
                    <UButton
                      icon="i-lucide-x"
                      variant="ghost"
                      color="neutral"
                      size="xs"
                      @click="repoUrl = ''; saveRepoSettings()"
                    />
                  </div>
                </template>

                <!-- Repo picker -->
                <template v-else>
                  <div class="space-y-3">
                    <div class="flex items-center gap-2">
                      <UInput
                        v-model="repoSearch"
                        placeholder="Search repositories..."
                        icon="i-lucide-search"
                        size="lg"
                        class="flex-1"
                      />
                      <UButton
                        label="New from Template"
                        icon="i-lucide-plus"
                        color="primary"
                        variant="soft"
                        @click="showCreateRepo = true"
                      />
                    </div>

                    <div v-if="reposStatus === 'pending'" class="py-6 text-center text-xs text-dimmed">
                      Loading repositories...
                    </div>

                    <div v-else class="max-h-64 overflow-y-auto space-y-1 rounded-lg border border-default">
                      <button
                        v-for="repo in filteredRepos"
                        :key="repo.id"
                        class="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-elevated/50 transition-colors first:rounded-t-lg last:rounded-b-lg"
                        @click="selectRepo(repo)"
                      >
                        <UIcon
                          :name="repo.private ? 'i-lucide-lock' : 'i-lucide-book'"
                          class="size-4 text-dimmed shrink-0"
                        />
                        <div class="min-w-0 flex-1">
                          <p class="text-sm font-medium text-highlighted truncate">{{ repo.fullName }}</p>
                          <p v-if="repo.description" class="text-xs text-dimmed truncate">{{ repo.description }}</p>
                        </div>
                        <span v-if="repo.language" class="text-xs text-muted shrink-0">{{ repo.language }}</span>
                      </button>

                      <div v-if="filteredRepos.length === 0" class="px-3 py-6 text-center text-xs text-dimmed">
                        No repositories found
                      </div>
                    </div>
                  </div>
                </template>

                <!-- Webhook info (when repo is linked) -->
                <template v-if="repoUrl">
                  <USeparator />
                  <div class="space-y-3">
                    <UFormField label="Webhook URL">
                      <div class="flex items-center gap-2">
                        <UInput :model-value="webhookUrl" size="lg" readonly class="flex-1 font-mono text-xs" />
                        <UButton icon="i-lucide-copy" variant="outline" color="neutral" @click="copyToClipboard(webhookUrl)" />
                      </div>
                    </UFormField>
                    <UFormField label="Webhook Secret">
                      <div class="flex items-center gap-2">
                        <UInput v-model="webhookSecret" size="lg" readonly class="flex-1 font-mono text-xs" type="password" />
                        <UButton icon="i-lucide-copy" variant="outline" color="neutral" @click="copyToClipboard(webhookSecret)" />
                      </div>
                    </UFormField>
                  </div>
                </template>
              </template>
            </div>
          </UCard>

          <!-- Create from Template Modal -->
          <UModal v-model:open="showCreateRepo" title="Create Repository from Template" description="Start with the Commerce.js storefront template.">
            <template #body>
              <div class="space-y-4 p-4">
                <UFormField label="Repository Name">
                  <UInput v-model="newRepoName" placeholder="my-store" size="lg" icon="i-lucide-folder-git-2" />
                </UFormField>
                <UFormField>
                  <div class="flex items-center gap-2">
                    <UCheckbox v-model="newRepoPrivate" />
                    <span class="text-sm text-muted">Make repository private</span>
                  </div>
                </UFormField>
                <p class="text-xs text-dimmed">
                  This will create <strong>{{ githubUsername }}/{{ newRepoName || '...' }}</strong> using the Commerce.js storefront starter template.
                </p>
              </div>
            </template>
            <template #footer>
              <div class="flex justify-end gap-3">
                <UButton variant="ghost" color="neutral" label="Cancel" @click="showCreateRepo = false" />
                <UButton
                  color="primary"
                  label="Create & Link"
                  icon="i-lucide-plus"
                  :loading="creatingRepo"
                  :disabled="!newRepoName"
                  @click="createFromTemplate"
                />
              </div>
            </template>
          </UModal>

          <!-- General Settings -->
          <UCard>
            <div class="space-y-6">
              <UFormField label="Project Name">
                <UInput :model-value="project.name" size="lg" />
              </UFormField>

              <USeparator />

              <div class="pt-2">
                <h3 class="text-sm font-medium text-error mb-2">
                  Danger Zone
                </h3>
                <UButton
                  color="error"
                  variant="outline"
                  label="Delete Project"
                  icon="i-lucide-trash-2"
                  @click="confirmDelete = true"
                />
              </div>
            </div>
          </UCard>

          <!-- Delete confirmation -->
          <UModal v-model:open="confirmDelete" title="Delete Project" description="This action cannot be undone.">
            <template #footer>
              <div class="flex justify-end gap-3">
                <UButton variant="ghost" color="neutral" label="Cancel" @click="confirmDelete = false" />
                <UButton color="error" label="Delete" @click="deleteProject" />
              </div>
            </template>
          </UModal>
        </div>
      </template>
    </template>
  </UDashboardPanel>
</template>
