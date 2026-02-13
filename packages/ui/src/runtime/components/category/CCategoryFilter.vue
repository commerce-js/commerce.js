<script setup lang="ts">
import type { Facet, FacetValue, LocalizedString } from '@commercejs/types'

/**
 * CCategoryFilter — Faceted category/attribute sidebar filter.
 * Displays facet groups with checkable values and counts.
 */

export interface CategoryFilterProps {
  /** Available facets from search response */
  facets: Facet[]
  /** Currently selected filters: { facetCode: [valueId, ...] } */
  modelValue: Record<string, string[]>
  /** Whether to show value counts */
  showCounts?: boolean
  /** Max visible values per facet before "Show more" */
  maxVisible?: number
  /** Per-instance theme overrides */
  ui?: Partial<{
    root: any
    group: any
    groupTitle: any
    values: any
    value: any
    count: any
    showMore: any
  }>
}

const props = withDefaults(defineProps<CategoryFilterProps>(), {
  showCounts: true,
  maxVisible: 5,
})

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, string[]>]
}>()

function t(value: LocalizedString | string | null | undefined): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  return value.en || value.ar || Object.values(value)[0] || ''
}

// Track which facets are expanded
const expanded = reactive<Record<string, boolean>>({})

function isExpanded(code: string): boolean {
  return expanded[code] ?? false
}

function toggleExpanded(code: string) {
  expanded[code] = !expanded[code]
}

function getVisibleItems(facet: Facet) {
  const values = isExpanded(facet.code) || facet.values.length <= props.maxVisible
    ? facet.values
    : facet.values.slice(0, props.maxVisible)

  return values.map(val => ({
    label: t(val.label),
    value: val.value,
    count: val.count,
  }))
}

function getSelectedValues(facetCode: string): string[] {
  return props.modelValue[facetCode] ?? []
}

function updateSelection(facetCode: string, values: string[]) {
  emit('update:modelValue', {
    ...props.modelValue,
    [facetCode]: values,
  })
}

// Resolve theme from app.config
const appConfig = useAppConfig()
const theme = computed(() => (appConfig.ui as any)?.categoryFilter ?? {})

const slotClasses = computed(() => {
  const base = theme.value?.slots ?? {}
  const merge = (slot: string) => [
    base[slot],
    props.ui?.[slot as keyof typeof props.ui],
  ]
  return {
    root: merge('root'),
    group: merge('group'),
    showMore: merge('showMore'),
  }
})
</script>

<template>
  <div :class="slotClasses.root">
    <div v-for="facet in facets" :key="facet.code" :class="slotClasses.group">
      <UCheckboxGroup
        :legend="t(facet.name)"
        :items="getVisibleItems(facet)"
        :model-value="getSelectedValues(facet.code)"
        @update:model-value="updateSelection(facet.code, $event as string[])"
      >
        <template #label="{ item }">
          {{ item.label }}
          <UBadge v-if="showCounts && item.count != null" size="xs" color="neutral" variant="subtle" :label="item.count?.toString()" />
        </template>
      </UCheckboxGroup>

      <UButton
        v-if="facet.values.length > maxVisible"
        :class="slotClasses.showMore"
        variant="link"
        size="sm"
        @click="toggleExpanded(facet.code)"
      >
        {{ isExpanded(facet.code) ? 'Show less' : `Show ${facet.values.length - maxVisible} more` }}
      </UButton>
    </div>
  </div>
</template>
