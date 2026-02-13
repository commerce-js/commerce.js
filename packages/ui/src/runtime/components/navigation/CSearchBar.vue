<script setup lang="ts">
import type { CommandPaletteGroup } from '#ui/types'

/**
 * CSearchBar — Modal CommandPalette search (⌘K).
 * Opens a modal with UCommandPalette for fuzzy search,
 * keyboard navigation, grouped results, and highlight matching.
 */

export interface SearchSuggestion {
  label: string
  suffix?: string
  to?: string
  icon?: string
  avatar?: Record<string, any>
  value?: string
  onSelect?: (e: Event) => void
}

export interface SearchGroup {
  id: string
  label?: string
  items: SearchSuggestion[]
  /** If true, skip client-side filtering (for server-side search) */
  ignoreFilter?: boolean
}

export interface SearchBarProps {
  /** Placeholder text */
  placeholder?: string
  /** Grouped suggestions */
  groups?: SearchGroup[]
  /** Whether results are loading */
  loading?: boolean
  /** Close modal on select */
  closeOnSelect?: boolean
  /** Per-instance theme overrides */
  ui?: Record<string, any>
}

const props = withDefaults(defineProps<SearchBarProps>(), {
  placeholder: 'Search products...',
  groups: () => [],
  loading: false,
  closeOnSelect: true,
})

const emit = defineEmits<{
  'search': [query: string]
  'select': [item: SearchSuggestion]
}>()

const open = ref(false)
const searchTerm = ref('')

// Emit search when user types
watch(searchTerm, (q) => {
  emit('search', q)
})

function handleSelect(item: SearchSuggestion) {
  emit('select', item)
  if (props.closeOnSelect) {
    open.value = false
    searchTerm.value = ''
  }
}

// ⌘K / Ctrl+K global shortcut
defineShortcuts({
  meta_k: () => {
    open.value = !open.value
  },
})

// Resolve theme from app.config
const appConfig = useAppConfig()
const theme = computed(() => (appConfig.ui as any)?.searchBar ?? {})

const paletteUi = computed(() => ({
  ...theme.value?.slots,
  ...props.ui,
}))
</script>

<template>
  <UModal v-model:open="open" class="w-full">
    <button
      class="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg ring ring-accented bg-default text-dimmed text-sm cursor-pointer hover:bg-elevated/50 transition-colors"
    >
      <UIcon name="i-lucide-search" class="shrink-0 size-5" />
      <span class="flex-1 text-left">Search...</span>
      <span class="flex items-center gap-0.5 ms-auto">
        <UKbd value="meta" />
        <UKbd value="K" />
      </span>
    </button>

    <!-- Modal content: CommandPalette -->
    <template #content>
      <UCommandPalette
        :groups="groups as CommandPaletteGroup[]"
        :placeholder="placeholder"
        :loading="loading"
        :ui="paletteUi"
        :close="true"
        :fuse="{ fuseOptions: { includeMatches: true } }"
        v-model:search-term="searchTerm"
        class="h-80"
        @update:model-value="handleSelect"
        @update:open="open = $event"
      >
        <template #empty>
          <div class="flex flex-col items-center justify-center py-8 gap-2 text-center">
            <UIcon name="i-lucide-search" class="text-dimmed text-2xl" />
            <p v-if="searchTerm" class="text-sm text-muted">
              No results for "<span class="font-medium text-highlighted">{{ searchTerm }}</span>"
            </p>
            <p v-else class="text-sm text-muted">
              Start typing to search...
            </p>
          </div>
        </template>
      </UCommandPalette>
    </template>
  </UModal>
</template>
