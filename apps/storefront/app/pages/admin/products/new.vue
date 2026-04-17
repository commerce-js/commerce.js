<script setup lang="ts">
// ---------------------------------------------------------------------------
// /admin/products/new — create a product. POSTs to /api/admin/products and
// redirects to the edit page on success.
// ---------------------------------------------------------------------------

import type { Category, Product } from '@commercejs/types'
import type { ProductFormValue } from '~/components/AdminProductForm.vue'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
  ssr: false,
})

const { store } = useStoreInfo()
const { toPayload } = useAdminProductForm()
const toast = useToast()

const currency = computed(() => store.value?.locales?.find(l => l.isDefault)?.currency || 'USD')

const { data: categories } = await useFetch<Category[]>('/api/admin/categories', {
  credentials: 'include',
  server: false,
  key: 'admin-categories',
})

const submitting = ref(false)

async function onSubmit(value: ProductFormValue, opts: { publish?: boolean }) {
  if (!value.name.trim()) {
    toast.add({ title: 'Name is required', color: 'warning' })
    return
  }

  submitting.value = true
  try {
    const created = await $fetch<Product>('/api/admin/products', {
      method: 'POST',
      credentials: 'include',
      body: toPayload(value, opts),
    })
    toast.add({
      title: opts.publish ? 'Product published' : 'Draft saved',
      color: 'success',
    })
    await navigateTo(`/admin/products/${created.id}/edit`)
  }
  catch (err: any) {
    toast.add({
      title: 'Could not save product',
      description: err?.data?.message || err?.message,
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
          to="/admin/products"
          class="text-sm text-muted hover:text-primary flex items-center gap-1"
        >
          <UIcon name="i-heroicons-arrow-left-20-solid" />
          Back to products
        </NuxtLink>
        <h1 class="text-2xl font-bold text-highlighted mt-1">
          New product
        </h1>
      </div>
    </header>

    <AdminProductForm
      mode="create"
      :categories="categories ?? []"
      :currency="currency"
      :submitting="submitting"
      @submit="onSubmit"
    />
  </div>
</template>
