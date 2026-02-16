<script setup lang="ts">
const implemented = [
  { emoji: '🛍', label: 'Catalog' },
  { emoji: '🛒', label: 'Cart' },
  { emoji: '📦', label: 'Orders' },
  { emoji: '👤', label: 'Customers' },
  { emoji: '💳', label: 'Checkout' },
  { emoji: '⭐', label: 'Reviews' },
  { emoji: '🏷', label: 'Brands' },
  { emoji: '🌍', label: 'Countries' },
  { emoji: '❤️', label: 'Wishlist' },
  { emoji: '🎟', label: 'Promotions' },
  { emoji: '📋', label: 'Returns' },
  { emoji: '🏪', label: 'Store' },
]

const planned = [
  { emoji: '🎁', label: 'Gift Cards' },
  { emoji: '📍', label: 'Locations' },
  { emoji: '🏭', label: 'Wholesale' },
  { emoji: '🔨', label: 'Auctions' },
]
</script>

<template>
  <DiagramContainer icon="i-lucide-shapes" max-width="max-w-5xl">
    <DiagramHeader title="Domain Coverage" subtitle="Unified Type System" />

    <div class="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
      <!-- Implemented -->
      <DiagramPanel label="Implemented Domains" color="success" variant="dashed">
        <div class="grid w-full grid-cols-2 gap-2 sm:grid-cols-3">
          <div
            v-for="domain in implemented"
            :key="domain.label"
            class="flex items-center gap-2 rounded-lg border border-success-200 dark:border-success-700 bg-white dark:bg-zinc-800 px-3 py-2.5 text-xs font-semibold text-success-600 dark:text-success-400"
          >
            <span>{{ domain.emoji }}</span>
            <span>{{ domain.label }}</span>
          </div>
        </div>
      </DiagramPanel>

      <!-- Planned -->
      <DiagramPanel label="Planned Domains" color="secondary" variant="dashed">
        <div class="grid w-full grid-cols-2 gap-2">
          <div
            v-for="domain in planned"
            :key="domain.label"
            class="flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2.5 text-xs font-medium text-zinc-400 dark:text-zinc-500"
          >
            <span>{{ domain.emoji }}</span>
            <span>{{ domain.label }}</span>
          </div>
        </div>
      </DiagramPanel>
    </div>

    <DiagramFooter
      :legends="[
        { color: '#10b981', label: 'Implemented' },
        { color: '#64748b', label: 'Planned' },
      ]"
      document-id="COMMERCE_JS_TYPES_01"
    />
  </DiagramContainer>
</template>
