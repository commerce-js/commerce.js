<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const user = ref({
  name: 'Baker',
  email: 'baker@commercejs.dev',
  avatar: 'https://ui-avatars.com/api/?name=Baker&background=6366f1&color=fff',
  role: 'Owner',
  joined: 'November 2025',
  timezone: 'Asia/Riyadh',
  language: 'English',
  twoFactor: false,
})

const sessions = ref([
  { device: 'MacBook Pro', browser: 'Chrome 121', ip: '192.168.1.1', location: 'Riyadh, SA', lastActive: 'Now', current: true },
  { device: 'iPhone 15', browser: 'Safari 17', ip: '192.168.1.42', location: 'Riyadh, SA', lastActive: '2 hours ago', current: false },
])
</script>

<template>
  <UDashboardPanel id="profile">
    <template #header>
      <UDashboardNavbar title="Profile">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="max-w-2xl space-y-8">
        <!-- Avatar & Identity -->
        <UCard>
          <div class="flex items-center gap-6">
            <UAvatar :src="user.avatar" :alt="user.name" size="3xl" />
            <div class="flex-1">
              <h2 class="text-xl font-semibold text-highlighted">{{ user.name }}</h2>
              <p class="text-sm text-muted">{{ user.email }}</p>
              <div class="flex items-center gap-2 mt-2">
                <UBadge color="primary" variant="subtle" size="xs">{{ user.role }}</UBadge>
                <span class="text-xs text-dimmed">Member since {{ user.joined }}</span>
              </div>
            </div>
            <UButton variant="outline" color="neutral" label="Edit" icon="i-lucide-pencil" />
          </div>
        </UCard>

        <!-- Account Settings -->
        <UCard>
          <div class="space-y-6">
            <h3 class="text-lg font-semibold text-highlighted">Account Settings</h3>

            <UFormField label="Display Name">
              <UInput v-model="user.name" size="lg" />
            </UFormField>

            <UFormField label="Email Address">
              <UInput v-model="user.email" size="lg" type="email" icon="i-lucide-mail" />
            </UFormField>

            <UFormField label="Timezone">
              <USelect
                v-model="user.timezone"
                :items="[
                  { label: 'Asia/Riyadh (GMT+3)', value: 'Asia/Riyadh' },
                  { label: 'Europe/Berlin (GMT+1)', value: 'Europe/Berlin' },
                  { label: 'America/New_York (GMT-5)', value: 'America/New_York' },
                ]"
                size="lg"
              />
            </UFormField>

            <UFormField label="Language">
              <USelect
                v-model="user.language"
                :items="[
                  { label: 'English', value: 'English' },
                  { label: 'العربية', value: 'Arabic' },
                ]"
                size="lg"
              />
            </UFormField>

            <div class="flex justify-end">
              <UButton color="primary" label="Save Changes" />
            </div>
          </div>
        </UCard>

        <!-- Security -->
        <UCard>
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-highlighted">Security</h3>

            <div class="flex items-center justify-between py-3 border-b border-default">
              <div>
                <p class="text-sm font-medium text-highlighted">Password</p>
                <p class="text-xs text-dimmed">Last changed 3 months ago</p>
              </div>
              <UButton variant="outline" color="neutral" label="Change Password" size="sm" />
            </div>

            <div class="flex items-center justify-between py-3">
              <div>
                <p class="text-sm font-medium text-highlighted">Two-Factor Authentication</p>
                <p class="text-xs text-dimmed">Add an extra layer of security to your account</p>
              </div>
              <USwitch v-model="user.twoFactor" />
            </div>
          </div>
        </UCard>

        <!-- Active Sessions -->
        <UCard>
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-highlighted">Active Sessions</h3>

            <div
              v-for="session in sessions"
              :key="session.ip"
              class="flex items-center justify-between py-3 border-b border-default last:border-0"
            >
              <div class="flex items-center gap-3">
                <UIcon
                  :name="session.device.includes('iPhone') ? 'i-lucide-smartphone' : 'i-lucide-laptop'"
                  class="text-muted size-5"
                />
                <div>
                  <div class="flex items-center gap-2">
                    <p class="text-sm font-medium text-highlighted">{{ session.device }}</p>
                    <UBadge v-if="session.current" color="success" variant="subtle" size="xs">Current</UBadge>
                  </div>
                  <p class="text-xs text-dimmed">
                    {{ session.browser }} · {{ session.ip }} · {{ session.location }}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <span class="text-xs text-dimmed">{{ session.lastActive }}</span>
                <UButton
                  v-if="!session.current"
                  variant="ghost"
                  color="error"
                  icon="i-lucide-log-out"
                  size="xs"
                />
              </div>
            </div>
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
