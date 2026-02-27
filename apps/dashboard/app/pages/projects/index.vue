<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

// Fetch projects from D1
const { data: projects, refresh, status } = await useFetch('/api/projects', {
  default: () => [],
})

// Session for ownerId
const { data: sessionData } = await useFetch<{ authenticated: boolean; userId?: string; githubUsername?: string }>('/api/auth/session')

const showCreateModal = ref(false)
const newProject = ref({ name: '', repoUrl: '' })
const creating = ref(false)

// GitHub repos for repo picker
const repoSearch = ref('')
const repoMode = ref<'select' | 'create'>('select')
const newRepoName = ref('')
const newRepoPrivate = ref(false)
const creatingRepo = ref(false)

const { data: githubRepos, status: reposStatus } = await useFetch<any[]>('/api/github/repos', {
  lazy: true,
  default: () => [],
  watch: false,
})

const filteredRepos = computed(() => {
  if (!githubRepos.value) return []
  const q = repoSearch.value.toLowerCase()
  if (!q) return githubRepos.value.slice(0, 20)
  return githubRepos.value.filter((r: any) =>
    r.fullName.toLowerCase().includes(q) || r.description?.toLowerCase()?.includes(q),
  )
})

function selectRepo(repo: any) {
  newProject.value.repoUrl = repo.fullName
}

async function createRepoFromTemplate() {
  if (!newRepoName.value) return
  creatingRepo.value = true
  try {
    const repo = await $fetch<any>('/api/github/repos', {
      method: 'POST',
      body: { name: newRepoName.value, private: newRepoPrivate.value },
    })
    newProject.value.repoUrl = repo.fullName
    repoMode.value = 'select'
    newRepoName.value = ''
  }
  finally {
    creatingRepo.value = false
  }
}

async function createProject() {
  if (!newProject.value.name) return
  creating.value = true

  try {
    await $fetch('/api/projects', {
      method: 'POST',
      body: {
        name: newProject.value.name,
        ownerId: sessionData.value?.userId || 'default',
        repoUrl: newProject.value.repoUrl || undefined,
      },
    })

    showCreateModal.value = false
    newProject.value = { name: '', repoUrl: '' }
    await refresh()
  }
  catch (error) {
    console.error('Failed to create project:', error)
  }
  finally {
    creating.value = false
  }
}

function projectStatus(project: any) {
  return project.cfPagesProjectName ? 'active' : 'pending'
}

function statusColor(status: string) {
  return status === 'active' ? 'success' as const : 'warning' as const
}
</script>

<template>
  <UDashboardPanel id="projects">
    <template #header>
      <UDashboardNavbar title="Projects">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton
            icon="i-lucide-plus"
            label="New Project"
            color="primary"
            @click="showCreateModal = true"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-1 mb-6">
        <p class="text-muted text-sm">
          Manage your CommerceJS stores
        </p>
      </div>

      <!-- Loading state -->
      <div v-if="status === 'pending'" class="flex justify-center py-12">
        <UIcon name="i-lucide-loader-2" class="size-6 animate-spin text-dimmed" />
      </div>

      <!-- Empty state -->
      <div v-else-if="!projects?.length" class="text-center py-16">
        <UIcon name="i-lucide-folder-plus" class="size-12 text-dimmed mx-auto mb-4" />
        <h3 class="text-lg font-semibold text-highlighted mb-2">
          No projects yet
        </h3>
        <p class="text-sm text-muted mb-6">
          Create your first project to deploy a CommerceJS store
        </p>
        <UButton
          icon="i-lucide-plus"
          label="Create Project"
          color="primary"
          @click="showCreateModal = true"
        />
      </div>

      <!-- Project Grid -->
      <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <NuxtLink
          v-for="project in projects"
          :key="project.id"
          :to="`/projects/${project.id}`"
          class="group"
        >
          <UCard class="hover:ring-primary/50 transition-all cursor-pointer h-full">
            <div class="flex items-start justify-between">
              <div>
                <h3 class="font-semibold text-highlighted group-hover:text-primary transition-colors">
                  {{ project.name }}
                </h3>
                <p class="text-xs text-dimmed mt-1 font-mono">
                  {{ project.subdomain }}
                </p>
              </div>
              <UBadge
                :color="statusColor(projectStatus(project))"
                variant="subtle"
                size="xs"
              >
                {{ projectStatus(project) }}
              </UBadge>
            </div>

            <div class="mt-4 pt-4 border-t border-default flex items-center justify-between text-xs text-dimmed">
              <span>{{ project.subdomain }}</span>
              <span>{{ project.plan }}</span>
            </div>
          </UCard>
        </NuxtLink>
      </div>

      <!-- Create Project Modal -->
      <UModal v-model:open="showCreateModal" title="Create Project" description="Set up a new CommerceJS store">
        <template #body>
          <div class="space-y-4">
            <UFormField label="Project Name" required>
              <UInput
                v-model="newProject.name"
                placeholder="my-awesome-store"
                size="lg"
              />
            </UFormField>

            <!-- GitHub Repository -->
            <UFormField label="GitHub Repository">
              <!-- Selected repo display -->
              <div v-if="newProject.repoUrl" class="flex items-center justify-between py-2.5 px-3 rounded-lg bg-elevated/50 border border-default">
                <div class="flex items-center gap-2">
                  <UIcon name="i-simple-icons-github" class="size-4 text-dimmed" />
                  <span class="text-sm font-medium text-highlighted">{{ newProject.repoUrl }}</span>
                </div>
                <UButton
                  icon="i-lucide-x"
                  variant="ghost"
                  color="neutral"
                  size="xs"
                  @click="newProject.repoUrl = ''"
                />
              </div>

              <!-- Repo picker -->
              <template v-else>
                <div class="space-y-2">
                  <!-- Mode tabs -->
                  <div class="flex gap-1 p-0.5 rounded-lg bg-elevated/50">
                    <button
                      class="flex-1 text-xs py-1.5 px-3 rounded-md transition-colors"
                      :class="repoMode === 'select' ? 'bg-default text-highlighted shadow-sm' : 'text-muted hover:text-highlighted'"
                      @click="repoMode = 'select'"
                    >
                      Select Existing
                    </button>
                    <button
                      class="flex-1 text-xs py-1.5 px-3 rounded-md transition-colors"
                      :class="repoMode === 'create' ? 'bg-default text-highlighted shadow-sm' : 'text-muted hover:text-highlighted'"
                      @click="repoMode = 'create'"
                    >
                      Create from Template
                    </button>
                  </div>

                  <!-- Select existing repo -->
                  <template v-if="repoMode === 'select'">
                    <UInput
                      v-model="repoSearch"
                      placeholder="Search repositories..."
                      icon="i-lucide-search"
                      size="sm"
                    />
                    <div v-if="reposStatus === 'pending'" class="py-4 text-center text-xs text-dimmed">
                      Loading...
                    </div>
                    <div v-else class="max-h-40 overflow-y-auto rounded-lg border border-default">
                      <button
                        v-for="repo in filteredRepos"
                        :key="repo.id"
                        class="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-elevated/50 transition-colors text-sm"
                        @click="selectRepo(repo)"
                      >
                        <UIcon
                          :name="repo.private ? 'i-lucide-lock' : 'i-lucide-book'"
                          class="size-3.5 text-dimmed shrink-0"
                        />
                        <span class="truncate text-highlighted">{{ repo.fullName }}</span>
                        <span v-if="repo.language" class="text-xs text-muted ml-auto shrink-0">{{ repo.language }}</span>
                      </button>
                      <div v-if="filteredRepos.length === 0" class="px-3 py-4 text-center text-xs text-dimmed">
                        No repos found
                      </div>
                    </div>
                  </template>

                  <!-- Create from template -->
                  <template v-else>
                    <UInput
                      v-model="newRepoName"
                      placeholder="my-store"
                      size="sm"
                      icon="i-lucide-folder-git-2"
                    />
                    <div class="flex items-center gap-2">
                      <UCheckbox v-model="newRepoPrivate" />
                      <span class="text-xs text-muted">Private</span>
                    </div>
                    <p class="text-xs text-dimmed">
                      Creates <strong>{{ sessionData?.githubUsername || '...' }}/{{ newRepoName || '...' }}</strong> from starter template.
                    </p>
                    <UButton
                      label="Create Repository"
                      icon="i-lucide-plus"
                      color="primary"
                      variant="soft"
                      size="sm"
                      :loading="creatingRepo"
                      :disabled="!newRepoName"
                      block
                      @click="createRepoFromTemplate"
                    />
                  </template>
                </div>
              </template>
            </UFormField>
          </div>
        </template>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton variant="ghost" color="neutral" label="Cancel" @click="showCreateModal = false" />
            <UButton
              color="primary"
              label="Create Project"
              :loading="creating"
              :disabled="!newProject.name"
              @click="createProject"
            />
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
