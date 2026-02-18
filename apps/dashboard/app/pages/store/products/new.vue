<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const form = ref({
  name: '',
  slug: '',
  description: '',
  price: '',
  compareAtPrice: '',
  cost: '',
  sku: '',
  barcode: '',
  weight: '',
  category: '',
  status: 'draft',
  trackInventory: true,
  stock: '0',
})

const categories = [
  { label: 'Apparel', value: 'Apparel' },
  { label: 'Footwear', value: 'Footwear' },
  { label: 'Accessories', value: 'Accessories' },
  { label: 'Electronics', value: 'Electronics' },
]

const statuses = [
  { label: 'Active', value: 'active' },
  { label: 'Draft', value: 'draft' },
  { label: 'Archived', value: 'archived' },
]

const toast = useToast()
const router = useRouter()

function onSave() {
  toast.add({ title: 'Product created', icon: 'i-lucide-check', color: 'success' })
  router.push('/store/products')
}
</script>

<template>
  <UDashboardPanel id="product-new">
    <template #header>
      <UDashboardNavbar title="New Product">
        <template #leading>
          <UDashboardSidebarCollapse />
          <UButton to="/store/products" icon="i-lucide-arrow-left" variant="ghost" color="neutral" size="sm" class="mr-2" />
        </template>

        <template #right>
          <UButton variant="outline" color="neutral" label="Discard" to="/store/products" />
          <UButton color="primary" label="Create Product" @click="onSave" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="grid gap-6 lg:grid-cols-3">
        <div class="lg:col-span-2 space-y-6">
          <!-- Basic Info -->
          <UCard>
            <template #header>
              <h3 class="font-semibold text-highlighted">Basic Information</h3>
            </template>
            <div class="space-y-4">
              <UFormField label="Product Name" required>
                <UInput v-model="form.name" placeholder="e.g. Premium T-Shirt" size="lg" />
              </UFormField>
              <UFormField label="URL Slug">
                <UInput v-model="form.slug" placeholder="premium-t-shirt" size="lg" icon="i-lucide-link" />
              </UFormField>
              <UFormField label="Description">
                <UTextarea v-model="form.description" placeholder="Describe your product..." :rows="4" />
              </UFormField>
            </div>
          </UCard>

          <!-- Media -->
          <UCard>
            <template #header>
              <h3 class="font-semibold text-highlighted">Media</h3>
            </template>
            <div class="border-2 border-dashed border-default rounded-lg p-8 text-center">
              <UIcon name="i-lucide-image-plus" class="size-8 text-dimmed mx-auto mb-2" />
              <p class="text-sm text-muted">Drag and drop images here, or click to browse</p>
              <p class="text-xs text-dimmed mt-1">PNG, JPG, WebP up to 10MB</p>
              <UButton variant="outline" color="neutral" label="Upload Images" class="mt-4" icon="i-lucide-upload" />
            </div>
          </UCard>

          <!-- Pricing -->
          <UCard>
            <template #header>
              <h3 class="font-semibold text-highlighted">Pricing</h3>
            </template>
            <div class="grid grid-cols-3 gap-4">
              <UFormField label="Price" required>
                <UInput v-model="form.price" placeholder="0.00" size="lg" icon="i-lucide-dollar-sign" />
              </UFormField>
              <UFormField label="Compare at Price">
                <UInput v-model="form.compareAtPrice" placeholder="0.00" size="lg" icon="i-lucide-dollar-sign" />
              </UFormField>
              <UFormField label="Cost per Item">
                <UInput v-model="form.cost" placeholder="0.00" size="lg" icon="i-lucide-dollar-sign" />
              </UFormField>
            </div>
          </UCard>

          <!-- Inventory -->
          <UCard>
            <template #header>
              <h3 class="font-semibold text-highlighted">Inventory</h3>
            </template>
            <div class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <UFormField label="SKU">
                  <UInput v-model="form.sku" placeholder="SKU-001" size="lg" />
                </UFormField>
                <UFormField label="Barcode">
                  <UInput v-model="form.barcode" placeholder="1234567890123" size="lg" />
                </UFormField>
              </div>
              <div class="flex items-center justify-between py-2">
                <div>
                  <p class="text-sm font-medium text-highlighted">Track inventory</p>
                  <p class="text-xs text-dimmed">Automatically reduce stock when orders are placed</p>
                </div>
                <USwitch v-model="form.trackInventory" />
              </div>
              <UFormField v-if="form.trackInventory" label="Stock Quantity">
                <UInput v-model="form.stock" type="number" placeholder="0" size="lg" />
              </UFormField>
            </div>
          </UCard>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <UCard>
            <template #header>
              <h3 class="font-semibold text-highlighted">Status</h3>
            </template>
            <UFormField label="Product Status">
              <USelect v-model="form.status" :items="statuses" size="lg" />
            </UFormField>
          </UCard>

          <UCard>
            <template #header>
              <h3 class="font-semibold text-highlighted">Organization</h3>
            </template>
            <div class="space-y-4">
              <UFormField label="Category">
                <USelect v-model="form.category" :items="categories" size="lg" placeholder="Select category" />
              </UFormField>
              <UFormField label="Weight (g)">
                <UInput v-model="form.weight" type="number" placeholder="0" size="lg" />
              </UFormField>
            </div>
          </UCard>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
