<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

interface SessionResponse {
  user: { id: string, email: string, name: string, role: string } | null
}
const { data: session } = await useFetch<SessionResponse>('/api/auth/session')

const user = computed(() => session.value?.user ?? null)
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
      <div class="px-6 py-4 max-w-2xl space-y-6">
        <UCard v-if="user">
          <template #header>
            <h2 class="text-lg font-semibold">
              Account
            </h2>
          </template>

          <dl class="grid grid-cols-2 gap-y-3 text-sm">
            <dt class="text-muted">
              Name
            </dt>
            <dd>{{ user.name }}</dd>
            <dt class="text-muted">
              Email
            </dt>
            <dd class="font-mono">
              {{ user.email }}
            </dd>
            <dt class="text-muted">
              Role
            </dt>
            <dd class="capitalize">
              {{ user.role }}
            </dd>
          </dl>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="text-lg font-semibold">
              Security
            </h2>
          </template>

          <p class="text-sm text-muted">
            Password change + two-factor auth land alongside the
            admin-invite flow in a later phase. For now, rotate the
            <code class="font-mono">dashboard_users.password_hash</code>
            directly if needed.
          </p>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
