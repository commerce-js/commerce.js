<script setup lang="ts">
import { formatTimeAgo } from '@vueuse/core'
import type { TabsItem } from '@nuxt/ui'

const { isNotificationsSlideOverOpen } = useDashboard()

interface Notification {
  id: string
  title: string
  body: string
  type: 'deploy' | 'error' | 'billing' | 'info'
  date: string
  read: boolean
}

// TODO: Replace with real notifications from API
const notifications = ref<Notification[]>([
  {
    id: '1',
    title: 'Deployment succeeded',
    body: 'my-store was deployed to production via commit abc123f',
    type: 'deploy',
    date: new Date().toISOString(),
    read: false,
  },
  {
    id: '2',
    title: '5xx error spike detected',
    body: 'my-store experienced 12 5xx errors in the last 5 minutes',
    type: 'error',
    date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    read: false,
  },
  {
    id: '3',
    title: 'Invoice generated',
    body: 'Your monthly invoice for $29.00 (Pro plan) is ready',
    type: 'billing',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    read: true,
  },
])

const tabs: TabsItem[] = [
  { label: 'Today', value: 'today', icon: 'i-lucide-sun' },
  { label: 'This Week', value: 'week', icon: 'i-lucide-calendar' },
  { label: 'Earlier', value: 'earlier', icon: 'i-lucide-history' },
]

const now = new Date()
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

const currentFilter = ref('today')

const filteredNotifications = computed(() =>
  notifications.value.filter((n) => {
    const d = new Date(n.date)
    if (currentFilter.value === 'today') return d >= today
    if (currentFilter.value === 'week') return d >= weekAgo && d < today
    return d < weekAgo
  }),
)

const typeIcon: Record<string, string> = {
  deploy: 'i-lucide-rocket',
  error: 'i-lucide-alert-triangle',
  billing: 'i-lucide-receipt',
  info: 'i-lucide-info',
}

const typeColor: Record<string, string> = {
  deploy: 'text-success',
  error: 'text-error',
  billing: 'text-primary',
  info: 'text-info',
}
</script>

<template>
  <USlideover
    v-model:open="isNotificationsSlideOverOpen"
    title="Notifications"
    class="m-4 rounded-xl"
    :ui="{
      overlay: 'bg-black/50',
      content: 'bg-default',
      body: 'p-2 sm:p-4',
    }"
  >
    <template #body>
      <UTabs v-model="currentFilter" :items="tabs">
        <template #content>
          <div class="mt-4 space-y-1">
            <div
              v-for="notification in filteredNotifications"
              :key="notification.id"
              class="px-3 py-3 rounded-lg hover:bg-elevated/50 flex items-start gap-3 cursor-pointer transition-colors"
            >
              <UIcon
                :name="typeIcon[notification.type]"
                :class="typeColor[notification.type]"
                class="mt-0.5 shrink-0"
                size="18"
              />

              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between gap-2">
                  <span class="text-highlighted font-medium text-sm truncate">
                    {{ notification.title }}
                  </span>
                  <time
                    :datetime="notification.date"
                    class="text-muted text-xs whitespace-nowrap"
                    v-text="formatTimeAgo(new Date(notification.date))"
                  />
                </div>
                <p class="text-dimmed text-xs mt-0.5 truncate">
                  {{ notification.body }}
                </p>
              </div>

              <UChip v-if="!notification.read" color="primary" size="xs" />
            </div>

            <div
              v-if="filteredNotifications.length === 0"
              class="py-8 text-center text-muted text-sm"
            >
              No notifications
            </div>
          </div>
        </template>
      </UTabs>
    </template>
  </USlideover>
</template>
