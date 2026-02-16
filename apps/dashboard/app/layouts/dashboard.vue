<script setup lang="ts">
const route = useRoute()

const navigation = [
  { label: 'Projects', to: '/projects', icon: 'i-lucide-folder' },
  { label: 'Billing', to: '/billing', icon: 'i-lucide-credit-card' },
]
</script>

<template>
  <div class="min-h-screen bg-gray-950 text-white">
    <!-- Top Nav -->
    <header class="border-b border-gray-800 bg-gray-950/80 backdrop-blur-xl sticky top-0 z-50">
      <div class="mx-auto max-w-7xl flex items-center justify-between px-6 h-16">
        <div class="flex items-center gap-8">
          <NuxtLink to="/" class="text-xl font-bold tracking-tight">
            CommerceJS <span class="text-primary-400">Cloud</span>
          </NuxtLink>

          <nav class="hidden md:flex items-center gap-1">
            <NuxtLink
              v-for="item in navigation"
              :key="item.to"
              :to="item.to"
              class="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              :class="route.path.startsWith(item.to) ? 'text-white bg-gray-800' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'"
            >
              {{ item.label }}
            </NuxtLink>
          </nav>
        </div>

        <div class="flex items-center gap-3">
          <UButton variant="ghost" color="neutral" icon="i-lucide-bell" />
          <UAvatar text="U" size="sm" />
        </div>
      </div>
    </header>

    <!-- Page Content -->
    <main class="mx-auto max-w-7xl px-6 py-8">
      <slot />
    </main>
  </div>
</template>
