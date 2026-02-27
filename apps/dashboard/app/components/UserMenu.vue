<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

defineProps<{
  collapsed?: boolean
}>()

const colorMode = useColorMode()

// Fetch real user data from session
const { data: sessionData } = await useFetch<{
  authenticated: boolean
  userId?: string
  githubUsername?: string
}>('/api/auth/session')

const user = computed(() => ({
  name: sessionData.value?.githubUsername || 'User',
  avatar: {
    src: sessionData.value?.githubUsername
      ? `https://github.com/${sessionData.value.githubUsername}.png`
      : '',
    alt: sessionData.value?.githubUsername || 'User',
  },
}))

const items = computed<DropdownMenuItem[][]>(() => [[{
  type: 'label',
  label: user.value.name,
  avatar: user.value.avatar
}], [{
  label: 'Profile',
  icon: 'i-lucide-user',
  to: '/profile'
}, {
  label: 'Billing',
  icon: 'i-lucide-credit-card',
  to: '/billing'
}, {
  label: 'Settings',
  icon: 'i-lucide-settings',
  to: '/settings'
}], [{
  label: 'Appearance',
  icon: 'i-lucide-sun-moon',
  children: [{
    label: 'Light',
    icon: 'i-lucide-sun',
    type: 'checkbox',
    checked: colorMode.value === 'light',
    onSelect(e: Event) {
      e.preventDefault()
      colorMode.preference = 'light'
    }
  }, {
    label: 'Dark',
    icon: 'i-lucide-moon',
    type: 'checkbox',
    checked: colorMode.value === 'dark',
    onSelect(e: Event) {
      e.preventDefault()
      colorMode.preference = 'dark'
    }
  }, {
    label: 'System',
    icon: 'i-lucide-monitor',
    type: 'checkbox',
    checked: colorMode.value === 'system',
    onSelect(e: Event) {
      e.preventDefault()
      colorMode.preference = 'system'
    }
  }]
}], [{
  label: 'Log out',
  icon: 'i-lucide-log-out',
  async onSelect() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    await navigateTo('/login')
  }
}]])
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'center', collisionPadding: 12 }"
    :ui="{ content: collapsed ? 'w-48' : 'w-(--reka-dropdown-menu-trigger-width)' }"
  >
    <UButton
      v-bind="{
        ...user,
        label: collapsed ? undefined : user?.name,
        trailingIcon: collapsed ? undefined : 'i-lucide-chevrons-up-down'
      }"
      color="neutral"
      variant="ghost"
      block
      :square="collapsed"
      class="data-[state=open]:bg-elevated"
      :ui="{
        trailingIcon: 'text-dimmed'
      }"
    />
  </UDropdownMenu>
</template>
