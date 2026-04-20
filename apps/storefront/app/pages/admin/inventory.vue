<script setup lang="ts">
// ---------------------------------------------------------------------------
// /admin/inventory — low-stock list with inline quantity adjuster. Wraps
// admin.getLowStockProducts + admin.updateInventory via the dashboard Nitro.
// CSR-only; per-variant editing is deferred (click-through to product edit).
// ---------------------------------------------------------------------------

import type { Product } from '@commercejs/types'
import { refDebounced } from '@vueuse/core'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
  ssr: false,
})

const { t } = useLocalizedString()
const toast = useToast()

const threshold = ref(10)
const thresholdDebounced = refDebounced(threshold, 300)

const { data, pending, error, refresh } = await useFetch<Product[]>(
  '/api/admin/inventory',
  {
    credentials: 'include',
    server: false,
    query: computed(() => ({ threshold: thresholdDebounced.value })),
    key: 'admin-inventory-low-stock',
  },
)

const items = computed(() => data.value ?? [])

const columns = [
  { accessorKey: 'image', header: '', size: 60 },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'sku', header: 'SKU' },
  { accessorKey: 'inventory', header: 'Current' },
  { accessorKey: 'variants', header: 'Variants' },
  { accessorKey: 'adjust', header: 'Adjust stock' },
]

type RowState = {
  quantity: number
  adjustment: 'set' | 'increment' | 'decrement'
  saving: boolean
}

const rowState = reactive<Record<string, RowState>>({})

function ensureRow(id: string): RowState {
  if (!rowState[id]) {
    rowState[id] = { quantity: 0, adjustment: 'set', saving: false }
  }
  return rowState[id]!
}

const adjustmentOptions = [
  { label: 'Set to', value: 'set' },
  { label: '+ Add', value: 'increment' },
  { label: '− Remove', value: 'decrement' },
]

const confirmOpen = ref(false)
const pendingApply = ref<Product | null>(null)

function onApply(product: Product) {
  const s = ensureRow(product.id)
  if (s.adjustment === 'decrement' && s.quantity > 10) {
    pendingApply.value = product
    confirmOpen.value = true
    return
  }
  void applyRow(product)
}

async function applyRow(product: Product) {
  const s = ensureRow(product.id)
  s.saving = true
  try {
    await $fetch('/api/admin/inventory/update', {
      method: 'POST',
      credentials: 'include',
      body: {
        productId: product.id,
        quantity: s.quantity,
        adjustment: s.adjustment,
      },
    })
    toast.add({ title: 'Inventory updated', color: 'success' })
    s.quantity = 0
    s.adjustment = 'set'
    await refresh()
  }
  catch (err: any) {
    toast.add({
      title: 'Could not update inventory',
      description: err?.data?.statusMessage || err?.message,
      color: 'error',
    })
  }
  finally {
    s.saving = false
  }
}

async function confirmLargeDecrement() {
  const product = pendingApply.value
  confirmOpen.value = false
  pendingApply.value = null
  if (product) await applyRow(product)
}

function inventoryLabel(p: Product): string {
  if (p.inventoryQuantity != null) return String(p.inventoryQuantity)
  return p.inStock ? 'In stock' : 'Out of stock'
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <header class="flex items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-highlighted">
          Inventory
        </h1>
        <p class="text-sm text-muted mt-1">
          Products at or below the threshold. Bulk CSV import is coming later.
        </p>
      </div>
    </header>

    <UCard>
      <div class="flex flex-col sm:flex-row sm:items-end gap-3">
        <UFormField label="Low-stock threshold" class="sm:w-56">
          <UInput
            v-model.number="threshold"
            type="number"
            :min="0"
            class="w-full"
          />
        </UFormField>
        <p class="text-xs text-muted sm:pb-2">
          Showing products with inventory ≤ {{ thresholdDebounced }}.
        </p>
      </div>
    </UCard>

    <UAlert
      v-if="error"
      color="error"
      variant="subtle"
      title="Could not load inventory"
      :description="error.message"
      icon="i-heroicons-exclamation-triangle-20-solid"
    />

    <UCard v-if="!pending && items.length === 0">
      <div class="flex flex-col items-center text-center py-10 gap-3">
        <UIcon name="i-heroicons-check-badge-20-solid" class="text-4xl text-success" />
        <div>
          <p class="font-medium text-highlighted">
            Nothing below threshold {{ thresholdDebounced }}.
          </p>
          <p class="text-sm text-muted mt-1">
            Try a lower threshold to hunt for stockouts.
          </p>
        </div>
      </div>
    </UCard>

    <UCard v-else>
      <UTable :data="items" :columns="columns" :loading="pending">
        <template #image-cell="{ row }">
          <div class="w-10 h-10 rounded bg-elevated overflow-hidden flex items-center justify-center">
            <img
              v-if="row.original.primaryImage?.url"
              :src="row.original.primaryImage.url"
              :alt="row.original.primaryImage.altText || ''"
              class="w-full h-full object-cover"
            >
            <UIcon v-else name="i-heroicons-photo-20-solid" class="text-muted" />
          </div>
        </template>
        <template #name-cell="{ row }">
          <div class="flex flex-col">
            <NuxtLink
              :to="`/admin/products/${row.original.id}/edit`"
              class="font-medium text-highlighted hover:text-primary"
            >
              {{ t(row.original.name) }}
            </NuxtLink>
            <span
              v-if="row.original.name?.ar && row.original.name.ar !== t(row.original.name)"
              class="text-xs text-muted"
              dir="rtl"
            >
              {{ row.original.name.ar }}
            </span>
          </div>
        </template>
        <template #sku-cell="{ row }">
          <span class="text-sm text-muted">{{ row.original.sku || '—' }}</span>
        </template>
        <template #inventory-cell="{ row }">
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium">{{ inventoryLabel(row.original) }}</span>
            <UBadge
              v-if="row.original.inventoryQuantity != null && row.original.inventoryQuantity <= thresholdDebounced"
              color="warning"
              variant="subtle"
              size="sm"
            >
              low
            </UBadge>
          </div>
        </template>
        <template #variants-cell="{ row }">
          <NuxtLink
            v-if="row.original.variants && row.original.variants.length > 0"
            :to="`/admin/products/${row.original.id}/edit`"
            class="text-xs text-muted hover:text-primary"
          >
            {{ row.original.variants.length }} variants — edit
          </NuxtLink>
          <span v-else class="text-xs text-dimmed">—</span>
        </template>
        <template #adjust-cell="{ row }">
          <div class="flex items-center gap-2 justify-end">
            <USelect
              :model-value="ensureRow(row.original.id).adjustment"
              :items="adjustmentOptions"
              value-key="value"
              class="w-28"
              size="sm"
              @update:model-value="(v: 'set' | 'increment' | 'decrement') => ensureRow(row.original.id).adjustment = v"
            />
            <UInput
              :model-value="ensureRow(row.original.id).quantity"
              type="number"
              :min="0"
              size="sm"
              class="w-20"
              @update:model-value="(v: string | number) => ensureRow(row.original.id).quantity = Number(v)"
            />
            <UButton
              color="primary"
              size="sm"
              :loading="ensureRow(row.original.id).saving"
              @click="onApply(row.original)"
            >
              Apply
            </UButton>
          </div>
        </template>
      </UTable>
    </UCard>

    <UModal v-model:open="confirmOpen">
      <template #content>
        <div class="p-6 flex flex-col gap-4">
          <h3 class="text-lg font-semibold text-highlighted">
            Remove {{ pendingApply ? ensureRow(pendingApply.id).quantity : 0 }} units?
          </h3>
          <p class="text-sm text-muted">
            That's more than 10 at once — double-check you haven't typed an
            extra zero.
          </p>
          <div class="flex justify-end gap-2">
            <UButton variant="ghost" color="neutral" @click="confirmOpen = false">
              Cancel
            </UButton>
            <UButton color="error" @click="confirmLargeDecrement">
              Yes, remove
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
