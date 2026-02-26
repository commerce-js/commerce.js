<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

// Fetch projects from D1
const { data: projects, refresh, status } = await useFetch('/api/projects', {
  default: () => [],
})

const showCreateModal = ref(false)
const newProject = ref({
  name: '',
  repoUrl: '',
})
const creating = ref(false)

async function createProject() {
  if (!newProject.value.name) return
  creating.value = true

  try {
    await $fetch('/api/projects', {
      method: 'POST',
      body: {
        name: newProject.value.name,
        ownerId: 'default', // TODO: Replace with authenticated user
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
  // Derive status from last deployment
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

            <UFormField label="GitHub Repository">
              <UInput
                v-model="newProject.repoUrl"
                placeholder="https://github.com/user/repo"
                size="lg"
                icon="i-simple-icons-github"
              />
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
