import { createSharedComposable } from '@vueuse/core'

export interface Store {
  id: string
  label: string
  slug: string
  url: string
  avatar: { icon: string; class: string }
  status: 'active' | 'building' | 'inactive'
}

const _useDashboard = () => {
  const route = useRoute()
  const router = useRouter()
  const isNotificationsSlideOverOpen = ref(false)

  const stores = ref<Store[]>([
    {
      id: '1',
      label: 'My Store',
      slug: 'my-store',
      url: 'http://localhost:3000',
      avatar: { icon: 'i-lucide-store', class: 'bg-primary/10 text-primary' },
      status: 'active'
    },
    {
      id: '2',
      label: 'Test Store',
      slug: 'test-store',
      url: 'http://localhost:3002',
      avatar: { icon: 'i-lucide-flask-conical', class: 'bg-warning/10 text-warning' },
      status: 'building'
    }
  ])

  const currentStore = ref<Store>(stores.value[0]!)

  function switchStore(store: Store) {
    currentStore.value = store
  }

  defineShortcuts({
    'g-p': () => router.push('/projects'),
    'g-u': () => router.push('/usage'),
    'g-o': () => router.push('/store/orders'),
    'g-b': () => router.push('/billing'),
    'g-s': () => router.push('/settings'),
    'n': () => isNotificationsSlideOverOpen.value = !isNotificationsSlideOverOpen.value,
  })

  watch(() => route.fullPath, () => {
    isNotificationsSlideOverOpen.value = false
  })

  return {
    isNotificationsSlideOverOpen,
    stores,
    currentStore,
    switchStore,
  }
}

export const useDashboard = createSharedComposable(_useDashboard)
