<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const adminClient = useAdminClient()

const { data: storeSettings, status } = useAsyncData('store-settings', () =>
  adminClient.getStoreSettings()
)

// Local form state populated from API
const settings = ref({
  storeName: '',
  contactEmail: '',
  contactPhone: '',
  currency: '',
  locale: '',
  timezone: '',
})

// Populate form when data loads
watch(storeSettings, (s) => {
  if (s) {
    settings.value = {
      storeName: s.name || '',
      contactEmail: s.contactEmail || '',
      contactPhone: s.contactPhone || '',
      currency: s.currency || 'SAR',
      locale: s.locale || 'en',
      timezone: s.timezone || 'Asia/Riyadh',
    }
  }
}, { immediate: true })

const timezones = [
  { label: 'Asia/Riyadh (GMT+3)', value: 'Asia/Riyadh' },
  { label: 'Europe/Berlin (GMT+1)', value: 'Europe/Berlin' },
  { label: 'America/New_York (GMT-5)', value: 'America/New_York' },
  { label: 'America/Los_Angeles (GMT-8)', value: 'America/Los_Angeles' },
]

const currencies = [
  { label: 'SAR - Saudi Riyal', value: 'SAR' },
  { label: 'USD - US Dollar', value: 'USD' },
  { label: 'EUR - Euro', value: 'EUR' },
  { label: 'GBP - British Pound', value: 'GBP' },
]

const saving = ref(false)
const toast = useToast()

async function saveSettings() {
  saving.value = true
  try {
    await adminClient.updateStoreSettings({
      name: settings.value.storeName,
      contactEmail: settings.value.contactEmail,
      contactPhone: settings.value.contactPhone,
      currency: settings.value.currency,
      locale: settings.value.locale,
      timezone: settings.value.timezone,
    })
    toast.add({ title: 'Settings saved', color: 'success' })
  } catch {
    toast.add({ title: 'Failed to save settings', color: 'error' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="settings">
    <template #header>
      <UDashboardNavbar title="Settings">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Loading -->
      <div v-if="status === 'pending'" class="max-w-2xl space-y-4">
        <div v-for="i in 3" :key="i" class="h-24 animate-pulse bg-muted/20 rounded" />
      </div>

      <div v-else class="max-w-2xl space-y-8">
        <UCard>
          <div class="space-y-6">
            <h2 class="text-lg font-semibold text-highlighted">Store Settings</h2>

            <UFormField label="Store Name">
              <UInput v-model="settings.storeName" size="lg" />
            </UFormField>

            <UFormField label="Contact Email">
              <UInput v-model="settings.contactEmail" size="lg" type="email" icon="i-lucide-mail" />
            </UFormField>

            <UFormField label="Contact Phone">
              <UInput v-model="settings.contactPhone" size="lg" icon="i-lucide-phone" />
            </UFormField>

            <UFormField label="Currency">
              <USelect :items="currencies" v-model="settings.currency" size="lg" />
            </UFormField>

            <UFormField label="Timezone">
              <USelect :items="timezones" v-model="settings.timezone" size="lg" />
            </UFormField>

            <div class="flex justify-end">
              <UButton color="primary" label="Save Changes" :loading="saving" @click="saveSettings" />
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="space-y-4">
            <h2 class="text-lg font-semibold text-highlighted">API Keys</h2>
            <p class="text-sm text-muted">Manage your API keys for programmatic access</p>

            <div class="flex items-center justify-between py-3 border-t border-default">
              <div>
                <p class="text-sm font-medium text-highlighted">Production Key</p>
                <code class="text-xs text-dimmed">cjs_live_••••••••••••</code>
              </div>
              <div class="flex items-center gap-2">
                <UButton icon="i-lucide-copy" variant="ghost" color="neutral" size="xs" />
                <UButton icon="i-lucide-rotate-ccw" variant="ghost" color="error" size="xs" />
              </div>
            </div>

            <div class="flex items-center justify-between py-3 border-t border-default">
              <div>
                <p class="text-sm font-medium text-highlighted">Test Key</p>
                <code class="text-xs text-dimmed">cjs_test_••••••••••••</code>
              </div>
              <div class="flex items-center gap-2">
                <UButton icon="i-lucide-copy" variant="ghost" color="neutral" size="xs" />
                <UButton icon="i-lucide-rotate-ccw" variant="ghost" color="error" size="xs" />
              </div>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="space-y-4">
            <h2 class="text-sm font-medium text-error">Danger Zone</h2>
            <p class="text-sm text-muted">Permanently delete your organization and all its data</p>
            <UButton color="error" variant="outline" label="Delete Organization" icon="i-lucide-trash-2" />
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
