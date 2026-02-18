<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const router = useRouter()
const productId = route.params.id as string
const adminClient = useAdminClient()
const toast = useToast()

const { data: product, status } = useAsyncData(
  `admin-product-${productId}`,
  () => adminClient.getProduct(productId)
)

// ---- Delete Product ----
const showDeleteModal = ref(false)
const deleting = ref(false)

async function handleDelete() {
  deleting.value = true
  try {
    await adminClient.deleteProduct(productId)
    toast.add({ title: 'Product deleted', description: `${productName(product.value)} has been deleted.`, color: 'success' })
    router.push('/store/products')
  } catch (e: any) {
    toast.add({ title: 'Failed to delete', description: e.message || 'Something went wrong', color: 'error' })
  } finally {
    deleting.value = false
  }
}

const { formatCurrency } = useFormatCurrency()

function productName(p: any) {
  if (!p?.name) return 'Untitled'
  return typeof p.name === 'object' ? p.name.en || p.name.ar : p.name
}

function productDescription(p: any) {
  if (!p?.description) return null
  return typeof p.description === 'object' ? p.description.en || p.description.ar : p.description
}
</script>

<template>
  <UDashboardPanel id="product-detail">
    <template #header>
      <UDashboardNavbar :title="product ? productName(product) : 'Product Details'">
        <template #leading>
          <UButton icon="i-lucide-arrow-left" variant="ghost" to="/store/products" />
        </template>
        <template #right>
          <div class="flex items-center gap-2">
            <UButton v-if="product" variant="outline" icon="i-lucide-pencil" label="Edit" :to="`/store/products/${productId}/edit`" />
            <UButton v-if="product" variant="outline" color="error" icon="i-lucide-trash-2" label="Delete" @click="showDeleteModal = true" />
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Loading -->
      <div v-if="status === 'pending'" class="space-y-4 p-4">
        <div v-for="i in 3" :key="i" class="h-32 animate-pulse bg-muted/20 rounded" />
      </div>

      <!-- Product Data -->
      <div v-else-if="product" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Gallery -->
          <UCard v-if="product.gallery?.length">
            <template #header>
              <h3 class="font-semibold text-highlighted">Images</h3>
            </template>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <img
                v-for="(img, idx) in product.gallery"
                :key="idx"
                :src="img.url"
                :alt="img.alt || productName(product)"
                class="rounded-lg object-cover w-full aspect-square"
              />
            </div>
          </UCard>

          <!-- Description -->
          <UCard v-if="productDescription(product)">
            <template #header>
              <h3 class="font-semibold text-highlighted">Description</h3>
            </template>
            <p class="text-sm text-muted leading-relaxed">{{ productDescription(product) }}</p>
          </UCard>

          <!-- Variants -->
          <UCard v-if="product.variants?.length">
            <template #header>
              <h3 class="font-semibold text-highlighted">Variants ({{ product.variants.length }})</h3>
            </template>
            <UTable
              :data="product.variants"
              :columns="[
                { accessorKey: 'name', header: 'Variant' },
                { accessorKey: 'sku', header: 'SKU' },
                { accessorKey: 'price', header: 'Price' },
                { accessorKey: 'inventoryQuantity', header: 'Stock' },
                { accessorKey: 'inStock', header: 'Status' },
              ]"
            >
              <template #name-cell="{ row }">
                {{ row.original.name ? (typeof row.original.name === 'object' ? row.original.name.en : row.original.name) : '—' }}
              </template>
              <template #sku-cell="{ row }">
                <span class="font-mono text-xs text-muted">{{ row.original.sku || '—' }}</span>
              </template>
              <template #price-cell="{ row }">
                {{ formatCurrency(row.original.price?.current) }}
              </template>
              <template #inStock-cell="{ row }">
                <UBadge :color="row.original.inStock ? 'success' : 'error'" variant="subtle" size="xs">
                  {{ row.original.inStock ? 'In Stock' : 'Out of Stock' }}
                </UBadge>
              </template>
            </UTable>
          </UCard>

          <!-- Attributes -->
          <UCard v-if="product.attributes?.length">
            <template #header>
              <h3 class="font-semibold text-highlighted">Attributes</h3>
            </template>
            <div class="space-y-2">
              <div v-for="attr in product.attributes" :key="attr.code" class="flex justify-between text-sm">
                <span class="text-muted">
                  {{ typeof attr.name === 'object' ? attr.name.en : attr.name }}
                </span>
                <span class="text-highlighted">
                  {{ typeof attr.value === 'object' ? attr.value.en : attr.value }}
                </span>
              </div>
            </div>
          </UCard>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Pricing -->
          <UCard>
            <template #header>
              <h3 class="font-semibold text-highlighted">Pricing</h3>
            </template>
            <div class="space-y-3 text-sm">
              <div class="flex justify-between">
                <span class="text-muted">Current Price</span>
                <span class="text-highlighted text-lg font-semibold">{{ formatCurrency(product.price?.current) }}</span>
              </div>
              <div v-if="product.price?.original" class="flex justify-between">
                <span class="text-muted">Compare at</span>
                <span class="text-muted line-through">{{ formatCurrency(product.price.original) }}</span>
              </div>
              <div v-if="product.vatRate" class="flex justify-between">
                <span class="text-muted">VAT Rate</span>
                <span class="text-highlighted">{{ product.vatRate }}%</span>
              </div>
            </div>
          </UCard>

          <!-- Details -->
          <UCard>
            <template #header>
              <h3 class="font-semibold text-highlighted">Details</h3>
            </template>
            <div class="space-y-3 text-sm">
              <div class="flex justify-between">
                <span class="text-muted">SKU</span>
                <span class="text-highlighted font-mono">{{ product.sku || '—' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted">Type</span>
                <span class="text-highlighted capitalize">{{ product.productType }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted">Stock</span>
                <UBadge :color="product.inStock ? 'success' : 'error'" variant="subtle" size="xs">
                  {{ product.inStock ? 'In Stock' : 'Out of Stock' }}
                </UBadge>
              </div>
              <div class="flex justify-between">
                <span class="text-muted">Shipping</span>
                <span class="text-highlighted">{{ product.requiresShipping ? 'Required' : 'Digital' }}</span>
              </div>
            </div>
          </UCard>

          <!-- Categories -->
          <UCard v-if="product.categories?.length">
            <template #header>
              <h3 class="font-semibold text-highlighted">Categories</h3>
            </template>
            <div class="flex flex-wrap gap-2">
              <UBadge v-for="cat in product.categories" :key="cat.id" variant="subtle" color="neutral">
                {{ typeof cat.name === 'object' ? cat.name.en : cat.name }}
              </UBadge>
            </div>
          </UCard>

          <!-- Tags -->
          <UCard v-if="product.tags?.length">
            <template #header>
              <h3 class="font-semibold text-highlighted">Tags</h3>
            </template>
            <div class="flex flex-wrap gap-2">
              <UBadge v-for="tag in product.tags" :key="tag" variant="subtle" color="neutral">
                {{ tag }}
              </UBadge>
            </div>
          </UCard>
        </div>
      </div>

      <!-- Error State -->
      <div v-else class="text-center py-12">
        <UIcon name="i-lucide-alert-circle" class="text-error size-8 mb-2" />
        <p class="text-muted">Product not found</p>
        <UButton variant="outline" to="/store/products" class="mt-4">Back to Products</UButton>
      </div>
    </template>
  </UDashboardPanel>

  <!-- Delete Confirmation Modal -->
  <UModal v-model:open="showDeleteModal">
    <template #content>
      <UCard>
        <template #header>
          <h3 class="font-semibold text-highlighted">Delete Product</h3>
        </template>
        <p class="text-sm text-muted">
          Are you sure you want to delete <strong class="text-highlighted">{{ productName(product) }}</strong>? This action cannot be undone.
        </p>
        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton variant="ghost" label="Cancel" @click="showDeleteModal = false" />
            <UButton
              color="error"
              icon="i-lucide-trash-2"
              label="Delete Product"
              :loading="deleting"
              @click="handleDelete"
            />
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>
