<script setup lang="ts">
import { getProviderById, providerTypeConfig } from '~/utils/providers'

definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const toast = useToast()

const providerId = route.params.id as string
const provider = getProviderById(providerId)

// Form state — populate with empty values based on provider fields
const formValues = ref<Record<string, string>>(
  provider
    ? Object.fromEntries(provider.fields.map(f => [f.key, '']))
    : {}
)

// Track which password fields are visible
const visiblePasswords = ref<Set<string>>(new Set())

function togglePasswordVisibility(key: string) {
  if (visiblePasswords.value.has(key)) {
    visiblePasswords.value.delete(key)
  } else {
    visiblePasswords.value.add(key)
  }
}

const saving = ref(false)

async function saveConfig() {
  saving.value = true
  try {
    // TODO: wire to backend via useAdminClient().saveProviderConfig()
    await new Promise(resolve => setTimeout(resolve, 800))
    toast.add({ title: 'Configuration saved', description: `${provider?.name} settings updated successfully.`, color: 'success' })
  } catch {
    toast.add({ title: 'Failed to save', color: 'error' })
  } finally {
    saving.value = false
  }
}

const isFormValid = computed(() => {
  if (!provider) return false
  return provider.fields
    .filter(f => f.required)
    .every(f => formValues.value[f.key]?.trim())
})

// Breadcrumb items
const breadcrumbItems = computed(() => [
  { label: 'Integrations', to: '/store/integrations', icon: 'i-lucide-plug' },
  { label: provider?.name ?? 'Unknown', icon: provider?.icon },
])
</script>

<template>
  <UDashboardPanel :id="`provider-${providerId}`">
    <template #header>
      <UDashboardNavbar>
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #default>
          <UBreadcrumb :items="breadcrumbItems" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Provider not found -->
      <div v-if="!provider" class="text-center py-12">
        <UIcon name="i-lucide-circle-alert" class="text-error size-8 mb-2" />
        <p class="text-muted mb-4">Provider "{{ providerId }}" not found</p>
        <UButton to="/store/integrations" label="Back to Integrations" variant="outline" icon="i-lucide-arrow-left" />
      </div>

      <div v-else class="max-w-2xl space-y-6">
        <!-- Provider Header -->
        <UCard>
          <div class="flex items-start gap-4">
            <div class="p-3 rounded-xl bg-primary/10 shrink-0">
              <UIcon :name="provider.icon" class="text-primary size-7" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-3 mb-1">
                <h1 class="text-xl font-bold text-highlighted">{{ provider.name }}</h1>
                <UBadge
                  :color="(providerTypeConfig[provider.type].color as any)"
                  variant="subtle"
                  size="xs"
                >
                  {{ providerTypeConfig[provider.type].label }}
                </UBadge>
              </div>
              <p class="text-sm text-muted leading-relaxed">{{ provider.description }}</p>
              <div class="flex items-center gap-4 mt-3">
                <code class="text-xs text-dimmed bg-muted/10 px-2 py-0.5 rounded">{{ provider.package }}</code>
                <UButton
                  v-if="provider.docsUrl"
                  :to="provider.docsUrl"
                  target="_blank"
                  size="xs"
                  variant="link"
                  color="primary"
                  icon="i-lucide-external-link"
                  label="Documentation"
                  trailing
                />
              </div>
            </div>
          </div>
        </UCard>

        <!-- Configuration Form -->
        <UCard>
          <div class="space-y-6">
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold text-highlighted">Configuration</h2>
              <span class="text-xs text-muted">
                {{ provider.fields.filter(f => f.required).length }} required field{{ provider.fields.filter(f => f.required).length === 1 ? '' : 's' }}
              </span>
            </div>

            <div class="space-y-4">
              <UFormField
                v-for="field in provider.fields"
                :key="field.key"
                :label="field.label"
                :required="field.required"
                :hint="field.hint"
              >
                <UInput
                  v-model="formValues[field.key]"
                  :type="field.type === 'password' && !visiblePasswords.has(field.key) ? 'password' : 'text'"
                  :placeholder="field.placeholder"
                  size="lg"
                >
                  <template v-if="field.type === 'password'" #trailing>
                    <UButton
                      :icon="visiblePasswords.has(field.key) ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                      variant="ghost"
                      color="neutral"
                      size="xs"
                      :padded="false"
                      @click="togglePasswordVisibility(field.key)"
                    />
                  </template>
                </UInput>
              </UFormField>
            </div>

            <div class="flex items-center justify-between pt-4 border-t border-default">
              <p class="text-xs text-dimmed">
                Credentials are encrypted at rest and never exposed after saving.
              </p>
              <UButton
                color="primary"
                label="Save Configuration"
                icon="i-lucide-check"
                :loading="saving"
                :disabled="!isFormValid"
                @click="saveConfig"
              />
            </div>
          </div>
        </UCard>

        <!-- Danger Zone -->
        <UCard>
          <div class="space-y-3">
            <h2 class="text-sm font-medium text-error">Danger Zone</h2>
            <p class="text-sm text-muted">
              Disconnect this provider. This will remove the saved credentials and disable the integration.
            </p>
            <UButton
              color="error"
              variant="outline"
              label="Disconnect Provider"
              icon="i-lucide-unplug"
              size="sm"
            />
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
