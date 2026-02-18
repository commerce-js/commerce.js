<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

defineProps<{
  collapsed?: boolean
}>()

const { stores, currentStore, switchStore } = useDashboard()
const toast = useToast()

const items = computed<DropdownMenuItem[][]>(() => [
  stores.value.map(store => ({
    label: store.label,
    avatar: store.avatar,
    type: 'checkbox' as const,
    checked: currentStore.value.id === store.id,
    onSelect() {
      switchStore(store)
      toast.add({ title: `Switched to ${store.label}`, icon: 'i-lucide-check' })
    }
  })),
  [
    {
      label: 'Create store',
      icon: 'i-lucide-circle-plus',
      to: '/projects'
    }
  ]
])
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'center', collisionPadding: 12 }"
    :ui="{
      content: collapsed ? 'w-48' : 'w-(--reka-dropdown-menu-trigger-width)'
    }"
  >
    <UButton
      v-bind="{
        ...currentStore,
        label: collapsed ? undefined : currentStore?.label,
        trailingIcon: collapsed ? undefined : 'i-lucide-chevrons-up-down'
      }"
      variant="ghost"
      block
      :square="collapsed"
      class="data-[state=open]:bg-elevated"
    />
  </UDropdownMenu>
</template>
