<script setup lang="ts">
// ---------------------------------------------------------------------------
// /admin/categories — flat list. Columns: name (EN + AR muted subtext),
// slug, parent name, product count, sortOrder, actions. CSR-only.
//
// Tree view is v2; for typical merchant counts (<50) the flat list with a
// parent-name column is enough and keeps the list predictable under sort.
// ---------------------------------------------------------------------------

import type { Category } from '@commercejs/types'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
  ssr: false,
})

const { t } = useLocalizedString()
const toast = useToast()

const { data, pending, error, refresh } = await useFetch<Category[]>(
  '/api/admin/categories',
  {
    credentials: 'include',
    server: false,
    key: 'admin-categories-list',
  },
)

const items = computed(() => data.value ?? [])
const total = computed(() => items.value.length)

const parentNameById = computed(() => {
  const map = new Map<string, string>()
  for (const c of items.value) map.set(c.id, t(c.name))
  return map
})

// sortOrder is set on create/update but the Category type doesn't expose it
// back — so it's not rendered as a column. Keep it as a form field only.
const columns = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'slug', header: 'Slug' },
  { accessorKey: 'parent', header: 'Parent' },
  { accessorKey: 'products', header: 'Products' },
  { accessorKey: 'actions', header: '', size: 100 },
]

const confirmDeleteOpen = ref(false)
const pendingDelete = ref<Category | null>(null)
const deleting = ref(false)

function askDelete(c: Category) {
  pendingDelete.value = c
  confirmDeleteOpen.value = true
}

async function confirmDelete() {
  if (!pendingDelete.value) return
  deleting.value = true
  try {
    await $fetch(`/api/admin/categories/${pendingDelete.value.id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    toast.add({ title: 'Category deleted', color: 'success' })
    confirmDeleteOpen.value = false
    pendingDelete.value = null
    await refresh()
  }
  catch (err: any) {
    toast.add({
      title: 'Could not delete category',
      description: err?.data?.statusMessage || err?.data?.message || err?.message,
      color: 'error',
    })
  }
  finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-highlighted">
          Categories
        </h1>
        <p class="text-sm text-muted mt-1">
          {{ total }} total
        </p>
      </div>
      <UButton
        to="/admin/categories/new"
        icon="i-heroicons-plus-20-solid"
        color="primary"
      >
        New category
      </UButton>
    </header>

    <UAlert
      v-if="error"
      color="error"
      variant="subtle"
      title="Could not load categories"
      :description="error.message"
      icon="i-heroicons-exclamation-triangle-20-solid"
    />

    <UCard v-if="!pending && items.length === 0">
      <div class="flex flex-col items-center text-center py-10 gap-3">
        <UIcon name="i-heroicons-tag-20-solid" class="text-4xl text-dimmed" />
        <div>
          <p class="font-medium text-highlighted">
            No categories yet
          </p>
          <p class="text-sm text-muted mt-1">
            Group products under categories to help buyers browse the store.
          </p>
        </div>
        <UButton to="/admin/categories/new" icon="i-heroicons-plus-20-solid" color="primary">
          New category
        </UButton>
      </div>
    </UCard>

    <UCard v-else>
      <UTable :data="items" :columns="columns" :loading="pending">
        <template #name-cell="{ row }">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded bg-elevated overflow-hidden flex items-center justify-center shrink-0">
              <img
                v-if="row.original.image?.url"
                :src="row.original.image.url"
                :alt="row.original.image.alt || ''"
                class="w-full h-full object-cover"
              >
              <UIcon v-else name="i-heroicons-tag-20-solid" class="text-muted" />
            </div>
            <div class="flex flex-col">
              <NuxtLink
                :to="`/admin/categories/${row.original.id}/edit`"
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
          </div>
        </template>
        <template #slug-cell="{ row }">
          <span class="text-sm text-muted font-mono">{{ row.original.slug }}</span>
        </template>
        <template #parent-cell="{ row }">
          <span class="text-sm">
            {{ row.original.parentId ? (parentNameById.get(row.original.parentId) || '—') : '—' }}
          </span>
        </template>
        <template #products-cell="{ row }">
          <span class="text-sm">{{ row.original.productCount ?? '—' }}</span>
        </template>
        <template #actions-cell="{ row }">
          <div class="flex items-center justify-end gap-1">
            <UButton
              :to="`/admin/categories/${row.original.id}/edit`"
              icon="i-heroicons-pencil-square-20-solid"
              variant="ghost"
              color="neutral"
              size="sm"
            />
            <UButton
              icon="i-heroicons-trash-20-solid"
              variant="ghost"
              color="error"
              size="sm"
              @click="askDelete(row.original)"
            />
          </div>
        </template>
      </UTable>
    </UCard>

    <UModal v-model:open="confirmDeleteOpen">
      <template #content>
        <div class="p-6 flex flex-col gap-4">
          <h3 class="text-lg font-semibold text-highlighted">
            Delete category?
          </h3>
          <p class="text-sm text-muted">
            "{{ pendingDelete ? t(pendingDelete.name) : '' }}" will be removed permanently. Categories that have children or attached products cannot be deleted.
          </p>
          <div class="flex justify-end gap-2">
            <UButton variant="ghost" color="neutral" @click="confirmDeleteOpen = false">
              Cancel
            </UButton>
            <UButton color="error" :loading="deleting" @click="confirmDelete">
              Delete category
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
