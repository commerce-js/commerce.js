<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const projects = ref([
  { id: '1', name: 'My Store', slug: 'my-store', status: 'active', url: 'https://my-store.cjs.app', lastDeploy: '2 min ago' },
  { id: '2', name: 'Test Store', slug: 'test-store', status: 'building', url: 'https://test-store.cjs.app', lastDeploy: 'Building...' },
])

const showCreateModal = ref(false)
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-white">
          Projects
        </h1>
        <p class="mt-1 text-gray-400 text-sm">
          Manage your CommerceJS stores
        </p>
      </div>

      <UButton
        icon="i-lucide-plus"
        label="New Project"
        color="primary"
        @click="showCreateModal = true"
      />
    </div>

    <!-- Project Grid -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <NuxtLink
        v-for="project in projects"
        :key="project.id"
        :to="`/projects/${project.id}`"
        class="group"
      >
        <UCard class="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors cursor-pointer h-full">
          <div class="flex items-start justify-between">
            <div>
              <h3 class="font-semibold text-white group-hover:text-primary-400 transition-colors">
                {{ project.name }}
              </h3>
              <p class="text-xs text-gray-500 mt-1 font-mono">
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

          <div class="mt-4 pt-4 border-t border-gray-800 flex items-center justify-between text-xs text-gray-500">
            <span>{{ project.url }}</span>
            <span>{{ project.lastDeploy }}</span>
          </div>
        </UCard>
      </NuxtLink>
    </div>

    <!-- Create Project Modal -->
    <UModal v-model:open="showCreateModal">
      <template #content>
        <UCard class="bg-gray-900 border-gray-800">
          <template #header>
            <h2 class="text-lg font-semibold text-white">
              Create Project
            </h2>
          </template>

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

          <template #footer>
            <div class="flex justify-end gap-3">
              <UButton variant="ghost" color="neutral" label="Cancel" @click="showCreateModal = false" />
              <UButton color="primary" label="Create Project" @click="showCreateModal = false" />
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </div>
</template>
