<script setup lang="ts">
// ---------------------------------------------------------------------------
// /admin/products/[id]/edit — edit a product. Loads the product via GET,
// PATCHes on submit, DELETEs via confirm modal.
// ---------------------------------------------------------------------------

import type { Category, Product } from '@commercejs/types'
import type { ProductFormValue } from '~/components/AdminProductForm.vue'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
  ssr: false,
})

const { t } = useLocalizedString()
const { store } = useStoreInfo()
const { toPayload } = useAdminProductForm()
const route = useRoute()
const toast = useToast()

const productId = computed(() => route.params.id as string)

const currency = computed(() => store.value?.locales?.find(l => l.isDefault)?.currency || 'USD')

const { data: product, error, refresh } = await useFetch<Product>(
  () => `/api/admin/products/${productId.value}`,
  {
    credentials: 'include',
    server: false,
    key: 'admin-product-edit',
    watch: [productId],
  },
)

const { data: categories } = await useFetch<Category[]>('/api/admin/categories', {
  credentials: 'include',
  server: false,
  key: 'admin-categories',
})

const submitting = ref(false)
const confirmDeleteOpen = ref(false)
const deleting = ref(false)

async function onSubmit(value: ProductFormValue, opts: { publish?: boolean }) {
  if (!value.name.trim()) {
    toast.add({ title: 'Name is required', color: 'warning' })
    return
  }

  submitting.value = true
  try {
    // In edit mode, "Save as draft" forces draft; otherwise keep form status.
    const publishFlag = opts.publish === false ? false : undefined
    await $fetch(`/api/admin/products/${productId.value}`, {
      method: 'PATCH',
      credentials: 'include',
      body: toPayload(value, { publish: publishFlag }),
    })
    toast.add({ title: 'Changes saved', color: 'success' })
    await refresh()
  }
  catch (err: any) {
    toast.add({
      title: 'Could not save changes',
      description: err?.data?.message || err?.message,
      color: 'error',
    })
  }
  finally {
    submitting.value = false
  }
}

async function onDelete() {
  confirmDeleteOpen.value = true
}

async function confirmDelete() {
  deleting.value = true
  try {
    await $fetch(`/api/admin/products/${productId.value}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    toast.add({ title: 'Product deleted', color: 'success' })
    confirmDeleteOpen.value = false
    await navigateTo('/admin/products')
  }
  catch (err: any) {
    toast.add({
      title: 'Could not delete',
      description: err?.data?.message || err?.message,
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
          to="/admin/products"
          class="text-sm text-muted hover:text-primary flex items-center gap-1"
        >
          <UIcon name="i-heroicons-arrow-left-20-solid" />
          Back to products
        </NuxtLink>
        <h1 class="text-2xl font-bold text-highlighted mt-1">
          {{ product ? t(product.name) : 'Edit product' }}
        </h1>
      </div>
    </header>

    <UAlert
      v-if="error"
      color="error"
      variant="subtle"
      :title="error.statusCode === 404 ? 'Product not found' : 'Could not load product'"
      :description="error.message"
      icon="i-heroicons-exclamation-triangle-20-solid"
    />

    <AdminProductForm
      v-if="product"
      mode="edit"
      :initial="product"
      :categories="categories ?? []"
      :currency="currency"
      :submitting="submitting"
      @submit="onSubmit"
      @delete="onDelete"
    />

    <UModal v-model:open="confirmDeleteOpen">
      <template #content>
        <div class="p-6 flex flex-col gap-4">
          <h3 class="text-lg font-semibold text-highlighted">
            Delete product?
          </h3>
          <p class="text-sm text-muted">
            "{{ product ? t(product.name) : '' }}" will be removed permanently. This cannot be undone.
          </p>
          <div class="flex justify-end gap-2">
            <UButton variant="ghost" color="neutral" @click="confirmDeleteOpen = false">
              Cancel
            </UButton>
            <UButton color="error" :loading="deleting" @click="confirmDelete">
              Delete product
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
