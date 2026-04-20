<script setup lang="ts">
// ---------------------------------------------------------------------------
// /admin/categories/[id]/edit — edit a category. Loads via GET, PATCHes on
// submit, DELETEs via confirm modal. Stays on the page after save (mirrors
// T03's product-edit rhythm).
// ---------------------------------------------------------------------------

import type { Category } from '@commercejs/types'
import type { CategoryFormValue } from '~/components/AdminCategoryForm.vue'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
  ssr: false,
})

const { t } = useLocalizedString()
const route = useRoute()
const toast = useToast()

const categoryId = computed(() => route.params.id as string)

const { data: category, error, refresh } = await useFetch<Category>(
  () => `/api/admin/categories/${categoryId.value}`,
  {
    credentials: 'include',
    server: false,
    key: 'admin-category-edit',
    watch: [categoryId],
  },
)

const { data: allCategories } = await useFetch<Category[]>('/api/admin/categories', {
  credentials: 'include',
  server: false,
  key: 'admin-categories-parent-options',
})

const submitting = ref(false)
const confirmDeleteOpen = ref(false)
const deleting = ref(false)

function toPayload(value: CategoryFormValue) {
  return {
    name: value.name.trim(),
    nameAr: value.nameAr.trim() || undefined,
    slug: value.slug.trim() || undefined,
    description: value.description.trim() || undefined,
    descriptionAr: value.descriptionAr.trim() || undefined,
    image: value.image || undefined,
    parentId: value.parentId || undefined,
    sortOrder: value.sortOrder ?? undefined,
  }
}

async function onSubmit(value: CategoryFormValue) {
  if (!value.name.trim()) {
    toast.add({ title: 'Name is required', color: 'warning' })
    return
  }

  submitting.value = true
  try {
    await $fetch(`/api/admin/categories/${categoryId.value}`, {
      method: 'PATCH',
      credentials: 'include',
      body: toPayload(value),
    })
    toast.add({ title: 'Changes saved', color: 'success' })
    await refresh()
  }
  catch (err: any) {
    toast.add({
      title: 'Could not save changes',
      description: err?.data?.statusMessage || err?.data?.message || err?.message,
      color: 'error',
    })
  }
  finally {
    submitting.value = false
  }
}

function onDelete() {
  confirmDeleteOpen.value = true
}

async function confirmDelete() {
  deleting.value = true
  try {
    await $fetch(`/api/admin/categories/${categoryId.value}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    toast.add({ title: 'Category deleted', color: 'success' })
    confirmDeleteOpen.value = false
    await navigateTo('/admin/categories')
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
  <div class="flex flex-col gap-6 max-w-3xl">
    <header class="flex items-center justify-between">
      <div>
        <NuxtLink
          to="/admin/categories"
          class="text-sm text-muted hover:text-primary flex items-center gap-1"
        >
          <UIcon name="i-heroicons-arrow-left-20-solid" />
          Back to categories
        </NuxtLink>
        <h1 class="text-2xl font-bold text-highlighted mt-1">
          {{ category ? t(category.name) : 'Edit category' }}
        </h1>
      </div>
    </header>

    <UAlert
      v-if="error"
      color="error"
      variant="subtle"
      :title="error.statusCode === 404 ? 'Category not found' : 'Could not load category'"
      :description="error.message"
      icon="i-heroicons-exclamation-triangle-20-solid"
    />

    <AdminCategoryForm
      v-if="category"
      mode="edit"
      :initial="category"
      :categories="allCategories ?? []"
      :exclude-id="categoryId"
      :submitting="submitting"
      @submit="onSubmit"
      @delete="onDelete"
    />

    <UModal v-model:open="confirmDeleteOpen">
      <template #content>
        <div class="p-6 flex flex-col gap-4">
          <h3 class="text-lg font-semibold text-highlighted">
            Delete category?
          </h3>
          <p class="text-sm text-muted">
            "{{ category ? t(category.name) : '' }}" will be removed permanently. Categories that have children or attached products cannot be deleted.
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
