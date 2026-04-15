<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const { isNotificationsSlideOverOpen } = useDashboard()

const links = ref<NavigationMenuItem[][]>([
  [
    {
      label: 'Merchants',
      icon: 'i-lucide-building-2',
      to: '/merchants',
    },
  ],
  [
    {
      label: 'Settings',
      icon: 'i-lucide-settings',
      to: '/settings',
    },
    {
      label: 'Profile',
      icon: 'i-lucide-user',
      to: '/profile',
    },
  ],
])

const groups = computed(() => [
  {
    id: 'links',
    label: 'Go to',
    items: links.value.flat().filter(item => item.to),
  },
  {
    id: 'actions',
    label: 'Actions',
    items: [
      {
        label: 'New merchant',
        icon: 'i-lucide-plus',
        to: '/merchants/new',
      },
      {
        label: 'View notifications',
        icon: 'i-lucide-bell',
        click: () => {
          isNotificationsSlideOverOpen.value = true
        },
      },
    ],
  },
])
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="dashboard"
      resizable
      collapsible
      :min-size="14"
      :default-size="16"
      :max-size="18"
    >
      <template #header="{ collapsed }">
        <NuxtLink
          to="/merchants"
          class="flex items-center gap-2 px-2 py-3 text-default hover:opacity-80"
        >
          <UIcon name="i-lucide-box" class="w-6 h-6 text-primary-400" />
          <span v-if="!collapsed" class="font-semibold tracking-tight">
            CommerceJS <span class="text-primary-400">Cloud</span>
          </span>
        </NuxtLink>
      </template>

      <template #default="{ collapsed }">
        <!-- Search -->
        <UDashboardSearchButton
          :label="collapsed ? undefined : 'Search...'"
          :square="collapsed"
          color="neutral"
          variant="outline"
        />

        <!-- Primary navigation -->
        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[0]"
          orientation="vertical"
        />

        <!-- Bottom links -->
        <div class="mt-auto">
          <USeparator />
          <UNavigationMenu
            :collapsed="collapsed"
            :items="links[1]"
            orientation="vertical"
          />
        </div>
      </template>

      <template #footer="{ collapsed }">
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <UDashboardSearch :groups="groups" />

    <slot />

    <NotificationsSlideOver />
  </UDashboardGroup>
</template>
