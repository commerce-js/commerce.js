<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const { isNotificationsSlideOverOpen } = useDashboard()
const route = useRoute()

const links = ref<NavigationMenuItem[][]>([
  [
    {
      label: 'Projects',
      icon: 'i-lucide-folder-kanban',
      to: '/projects'
    },
    {
      label: 'Deployments',
      icon: 'i-lucide-rocket',
      to: '/deployments'
    },
    {
      label: 'Usage',
      icon: 'i-lucide-bar-chart-3',
      to: '/usage'
    },
    {
      label: 'Uptime',
      icon: 'i-lucide-activity',
      to: '/uptime'
    }
  ],
  [
    {
      label: 'Store',
      icon: 'i-lucide-shopping-bag',
      defaultOpen: false,
      children: [
        {
          label: 'Overview',
          icon: 'i-lucide-layout-dashboard',
          to: '/store'
        },
        {
          label: 'Orders',
          icon: 'i-lucide-shopping-cart',
          to: '/store/orders'
        },
        {
          label: 'Products',
          icon: 'i-lucide-package',
          to: '/store/products'
        },
        {
          label: 'Customers',
          icon: 'i-lucide-users',
          to: '/store/customers'
        },
        {
          label: 'Analytics',
          icon: 'i-lucide-trending-up',
          to: '/store/analytics'
        }
      ]
    }
  ],
  [
    {
      label: 'Billing',
      icon: 'i-lucide-credit-card',
      to: '/billing'
    },
    {
      label: 'Settings',
      icon: 'i-lucide-settings',
      to: '/settings'
    }
  ]
])

const groups = computed(() => [
  {
    id: 'links',
    label: 'Go to',
    items: links.value.flat().flatMap(item =>
      item.children
        ? [item, ...item.children]
        : [item]
    ).filter(item => item.to)
  },
  {
    id: 'actions',
    label: 'Actions',
    items: [
      {
        label: 'New Project',
        icon: 'i-lucide-plus',
        to: '/projects'
      },
      {
        label: 'View Notifications',
        icon: 'i-lucide-bell',
        click: () => {
          isNotificationsSlideOverOpen.value = true
        }
      }
    ]
  }
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
        <ProjectSwitcher :collapsed="collapsed" />
      </template>

      <template #default="{ collapsed }">
        <!-- Search -->
        <UDashboardSearchButton
          :label="collapsed ? undefined : 'Search...'"
          :square="collapsed"
          color="neutral"
          variant="outline"
        />

        <!-- Platform navigation -->
        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[0]"
          orientation="vertical"
        />

        <USeparator />

        <!-- Store navigation -->
        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[1]"
          orientation="vertical"
        />

        <!-- Bottom links -->
        <div class="mt-auto">
          <USeparator />

          <UNavigationMenu
            :collapsed="collapsed"
            :items="links[2]"
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
