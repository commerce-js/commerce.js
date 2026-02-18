<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const projects = ref([
  { id: '1', name: 'My Store', slug: 'my-store', status: 'active', url: 'https://my-store.cjs.app', lastDeploy: '2 min ago' },
  { id: '2', name: 'Test Store', slug: 'test-store', status: 'building', url: 'https://test-store.cjs.app', lastDeploy: 'Building...' },
])

const showCreateModal = ref(false)
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

      <!-- Project Grid -->
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                  {{ project.slug }}
                </p>
              </div>
              <UBadge
                :color="project.status === 'active' ? 'success' : 'warning'"
                variant="subtle"
                size="xs"
              >
                {{ project.status }}
              </UBadge>
            </div>

            <div class="mt-4 pt-4 border-t border-default flex items-center justify-between text-xs text-dimmed">
              <span>{{ project.url }}</span>
              <span>{{ project.lastDeploy }}</span>
            </div>
          </UCard>
        </NuxtLink>
      </div>

      <!-- Create Project Modal -->
      <UModal v-model:open="showCreateModal" title="Create Project" description="Set up a new CommerceJS store">
        <template #body>
          <div class="space-y-4">
            <UFormField label="Project Name">
              <UInput placeholder="my-awesome-store" size="lg" />
            </UFormField>

            <UFormField label="GitHub Repository">
              <UInput placeholder="user/repo" size="lg" icon="i-simple-icons-github" />
            </UFormField>

            <UFormField label="Region">
              <USelect
                :items="[
                  { label: 'GCC (Riyadh)', value: 'gcc' },
                  { label: 'Europe (Frankfurt)', value: 'eu' },
                  { label: 'US East (Virginia)', value: 'us' },
                ]"
                size="lg"
              />
            </UFormField>
          </div>
        </template>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton variant="ghost" color="neutral" label="Cancel" @click="showCreateModal = false" />
            <UButton color="primary" label="Create Project" @click="showCreateModal = false" />
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
