<script setup lang="ts">
import { providerRegistry, providerTypeConfig, type ProviderType } from '~/utils/providers'

definePageMeta({ layout: 'dashboard' })

const activeFilter = ref<ProviderType | 'all'>('all')

const filters = [
  { label: 'All', value: 'all' as const, icon: 'i-lucide-layout-grid' },
  { label: 'Payment', value: 'payment' as const, icon: 'i-lucide-credit-card' },
  { label: 'Delivery', value: 'delivery' as const, icon: 'i-lucide-truck' },
  { label: 'Notification', value: 'notification' as const, icon: 'i-lucide-bell' },
  { label: 'Analytics', value: 'analytics' as const, icon: 'i-lucide-bar-chart-2' },
]

const filteredProviders = computed(() => {
  if (activeFilter.value === 'all') return providerRegistry
  return providerRegistry.filter(p => p.type === activeFilter.value)
})

// TODO: replace with real config status from backend
const configuredProviders = ref<Set<string>>(new Set())

function isConfigured(id: string) {
  return configuredProviders.value.has(id)
}
</script>

<template>
  <UDashboardPanel id="integrations">
    <template #header>
      <UDashboardNavbar title="Integrations">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <div class="flex items-center gap-1">
            <UButton
              v-for="filter in filters"
              :key="filter.value"
              :label="filter.label"
              :icon="filter.icon"
              size="sm"
              :color="activeFilter === filter.value ? 'primary' : 'neutral'"
              :variant="activeFilter === filter.value ? 'subtle' : 'ghost'"
              @click="activeFilter = filter.value"
            />
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Provider Grid -->
      <div
        v-if="filteredProviders.length"
        class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <UCard
          v-for="provider in filteredProviders"
          :key="provider.id"
          class="group hover:ring-1 hover:ring-primary/30 transition-all duration-200"
        >
          <div class="flex flex-col gap-4 h-full">
            <!-- Header: Icon + Name + Type -->
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-lg bg-primary/10">
                  <UIcon :name="provider.icon" class="text-primary size-5" />
                </div>
                <div>
                  <h3 class="text-sm font-semibold text-highlighted">{{ provider.name }}</h3>
                  <UBadge
                    :color="(providerTypeConfig[provider.type].color as any)"
                    variant="subtle"
                    size="xs"
                    class="mt-1"
                  >
                    {{ providerTypeConfig[provider.type].label }}
                  </UBadge>
                </div>
              </div>

              <!-- Status indicator -->
              <div class="flex items-center gap-1.5">
                <span
                  class="size-2 rounded-full"
                  :class="isConfigured(provider.id) ? 'bg-success' : 'bg-muted'"
                />
                <span class="text-xs" :class="isConfigured(provider.id) ? 'text-success' : 'text-muted'">
                  {{ isConfigured(provider.id) ? 'Active' : 'Not configured' }}
                </span>
              </div>
            </div>

            <!-- Description -->
            <p class="text-xs text-muted leading-relaxed flex-1">
              {{ provider.description }}
            </p>

            <!-- Footer -->
            <div class="flex items-center justify-between pt-2 border-t border-default">
              <code class="text-[10px] text-dimmed">{{ provider.package }}</code>
              <UButton
                :to="`/store/integrations/${provider.id}`"
                size="xs"
                color="primary"
                :variant="isConfigured(provider.id) ? 'ghost' : 'subtle'"
                :label="isConfigured(provider.id) ? 'Manage' : 'Configure'"
                icon="i-lucide-settings"
                trailing
              />
            </div>
          </div>
        </UCard>
      </div>

      <!-- Empty state -->
      <div v-else class="text-center py-12">
        <UIcon name="i-lucide-plug" class="text-muted size-8 mb-2" />
        <p class="text-muted">No providers match this filter</p>
      </div>
    </template>
  </UDashboardPanel>
</template>
