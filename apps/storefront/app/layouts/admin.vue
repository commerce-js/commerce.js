<script setup lang="ts">
// ---------------------------------------------------------------------------
// Admin layout — merchant-staff shell: left nav, header with store name +
// sign-out, main content slot. Applied via definePageMeta({ layout: 'admin' })
// on /admin/index and all sub-pages (T03+ adds products, T05 adds orders).
//
// Layout is rendered client-side only because consuming pages set ssr:false.
// This keeps the layout's session-dependent UI (user email, sign-out) out
// of SSR hydration where no cookie is available.
// ---------------------------------------------------------------------------

const { t } = useLocalizedString()
const { store } = useStoreInfo()
const { user, logout } = useMerchantSession()
const route = useRoute()

const storeName = computed(() => t(store.value?.name) || 'CommerceJS')

const navLinks = [
  { label: 'Dashboard', to: '/admin', icon: 'i-heroicons-squares-2x2-20-solid' },
  { label: 'Products', to: '/admin/products', icon: 'i-heroicons-cube-20-solid' },
  { label: 'Orders', to: '/admin/orders', icon: 'i-heroicons-shopping-bag-20-solid' },
  { label: 'Customers', to: '/admin/customers', icon: 'i-heroicons-users-20-solid' },
  { label: 'Settings', to: '/admin/settings', icon: 'i-heroicons-cog-6-tooth-20-solid' },
]

function isActive(to: string): boolean {
  if (to === '/admin') return route.path === '/admin' || route.path === '/admin/'
  return route.path === to || route.path.startsWith(`${to}/`)
}

async function handleSignOut() {
  await logout()
  await navigateTo('/admin/login')
}
</script>

<template>
  <div class="min-h-screen flex bg-default">
    <!-- Sidebar -->
    <aside class="w-60 shrink-0 border-e border-default bg-elevated flex flex-col">
      <div class="h-16 flex items-center gap-2 px-4 border-b border-default">
        <UIcon name="i-heroicons-shopping-bag-20-solid" class="text-2xl text-primary" />
        <span class="font-bold text-highlighted truncate">{{ storeName }}</span>
      </div>

      <nav class="flex-1 p-2 flex flex-col gap-1">
        <UButton
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          :icon="link.icon"
          :variant="isActive(link.to) ? 'soft' : 'ghost'"
          :color="isActive(link.to) ? 'primary' : 'neutral'"
          size="md"
          block
          class="justify-start"
        >
          {{ link.label }}
        </UButton>
      </nav>
    </aside>

    <!-- Main column -->
    <div class="flex-1 flex flex-col min-w-0">
      <header class="h-16 shrink-0 flex items-center justify-between px-6 border-b border-default bg-default">
        <h1 class="text-sm font-medium text-muted">
          Merchant admin
        </h1>

        <div class="flex items-center gap-3">
          <span v-if="user" class="text-sm text-muted hidden sm:block">
            {{ user.email }}
          </span>
          <UButton
            icon="i-heroicons-arrow-right-on-rectangle-20-solid"
            variant="ghost"
            color="neutral"
            size="sm"
            @click="handleSignOut"
          >
            Sign out
          </UButton>
        </div>
      </header>

      <main class="flex-1 p-6 overflow-auto">
        <slot />
      </main>
    </div>
  </div>
</template>
