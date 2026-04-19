<script setup lang="ts">
// ---------------------------------------------------------------------------
// /admin/categories/new — create a category. POSTs to /api/admin/categories
// and redirects to the list on success.
// ---------------------------------------------------------------------------

import type { Category } from '@commercejs/types'
import type { CategoryFormValue } from '~/components/AdminCategoryForm.vue'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
  ssr: false,
})

const toast = useToast()

const { data: categories } = await useFetch<Category[]>('/api/admin/categories', {
  credentials: 'include',
  server: false,
  key: 'admin-categories-parent-options',
})

const ROOT_SENTINEL = '__root__'
const submitting = ref(false)

function toPayload(value: CategoryFormValue) {
  return {
    name: value.name.trim(),
    nameAr: value.nameAr.trim() || undefined,
    slug: value.slug.trim() || undefined,
    description: value.description.trim() || undefined,
    descriptionAr: value.descriptionAr.trim() || undefined,
    image: value.image || undefined,
    parentId: value.parentId && value.parentId !== ROOT_SENTINEL ? value.parentId : undefined,
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
    await $fetch<Category>('/api/admin/categories', {
      method: 'POST',
      credentials: 'include',
      body: toPayload(value),
    })
    toast.add({ title: 'Category created', color: 'success' })
    await navigateTo('/admin/categories')
  }
  catch (err: any) {
    toast.add({
      title: 'Could not create category',
      description: err?.data?.statusMessage || err?.data?.message || err?.message,
      color: 'error',
    })
  }
  finally {
    submitting.value = false
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
          New category
        </h1>
      </div>
    </header>

    <AdminCategoryForm
      mode="create"
      :categories="categories ?? []"
      :submitting="submitting"
      @submit="onSubmit"
    />
  </div>
</template>
