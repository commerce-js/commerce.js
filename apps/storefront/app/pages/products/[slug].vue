<script setup lang="ts">
import type { Product } from '@commercejs/types'

const route = useRoute()
const slug = computed(() => route.params.slug as string)

const { data: product, status } = useProduct({ id: slug.value })

const { t } = useLocalizedString()
const { formatPrice, hasDiscount, formatOriginal } = usePrice()
const { addItem, createCart, cartId } = useCart()

// Selected options (optionId → selected valueId)
// Salla resolves SKU + price server-side when adding to cart,
// so we only need to track the user's selections here.
const selectedOptions = reactive<Record<string, string>>({})

// Selected image index
const selectedImageIndex = ref(0)

const allImages = computed(() => {
  if (!product.value) return []
  const imgs = [...(product.value.gallery || [])]
  if (product.value.primaryImage) imgs.unshift(product.value.primaryImage)
  // Deduplicate by URL
  return imgs.filter((img, i, arr) => arr.findIndex(x => x.url === img.url) === i)
})

// Quantity
const quantity = ref(1)
const maxQty = computed(() => product.value?.quantityLimit ?? 99)

// Add to cart
const adding = ref(false)
const toast = useToast()

async function handleAddToCart() {
  if (!product.value) return
  adding.value = true
  try {
    // Ensure cart exists
    if (!cartId.value) {
      await createCart()
    }

    await addItem({
      productId: product.value.id,
      quantity: quantity.value,
      // Selected option value IDs for Salla's server-side SKU resolution
      options: Object.keys(selectedOptions).length > 0 ? selectedOptions : undefined,
    })

    // No success toast — the cart drawer slides open automatically as confirmation
  } catch (e) {
    toast.add({
      title: 'Error',
      description: 'Could not add item to cart.',
      icon: 'i-heroicons-exclamation-circle',
      color: 'error',
    })
  } finally {
    adding.value = false
  }
}

// SEO
useHead({
  title: computed(() => product.value ? `${t(product.value.name)} — CommerceJS` : 'Product'),
})

useSeoMeta({
  description: computed(() => product.value ? t(product.value.shortDescription || product.value.description) : ''),
  ogImage: computed(() => product.value?.primaryImage?.url || ''),
})
</script>

<template>
  <UContainer class="py-8 md:py-12">
    <!-- Loading -->
    <div v-if="status === 'pending'" class="animate-pulse space-y-8">
      <div class="h-6 w-48 bg-accented rounded" />
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div class="aspect-square bg-accented rounded-2xl" />
        <div class="space-y-4">
          <div class="h-8 bg-accented rounded w-3/4" />
          <div class="h-6 bg-accented rounded w-1/3" />
          <div class="h-32 bg-accented rounded" />
        </div>
      </div>
    </div>

    <!-- 404 -->
    <CEmptyState
      v-else-if="!product"
      icon="i-heroicons-exclamation-triangle"
      title="Product not found"
      action-label="Back to Products"
      action-to="/products"
    />

    <!-- Product detail -->
    <div v-else>
      <!-- Breadcrumb -->
      <UBreadcrumb
        :items="[
          { label: 'Home', to: '/' },
          { label: 'Products', to: '/products' },
          { label: t(product.name) },
        ]"
        class="mb-8"
      />

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        <!-- Image gallery — now using CProductGallery -->
        <CProductGallery
          :images="allImages"
          v-model="selectedImageIndex"
        />

        <!-- Product info -->
        <div class="space-y-6">
          <!-- Name -->
          <h1 class="text-2xl md:text-3xl font-bold text-highlighted">
            {{ t(product.name) }}
          </h1>

          <!-- Rating — now using CReviewStars -->
          <div v-if="product.rating && product.rating.average != null && product.rating.average >= 0" class="flex items-center gap-2">
            <CReviewStars :model-value="Math.round(product.rating.average)" size="sm" />
            <span class="text-sm text-muted">
              {{ product.rating.average.toFixed(1) }} ({{ product.rating.count || 0 }} reviews)
            </span>
          </div>

          <!-- Price — now using CProductPrice -->
          <CProductPrice v-if="product.price" :price="product.price" size="xl" show-discount />

          <!-- Stock status -->
          <UBadge :color="product.inStock ? 'success' : 'error'" variant="subtle" size="sm">
            {{ product.inStock ? 'In Stock' : 'Out of Stock' }}
          </UBadge>

          <!-- Options — now using CProductOptions -->
          <CProductOptions
            v-if="product.options.length > 0"
            :options="product.options"
            v-model="selectedOptions"
          />

          <USeparator />

          <!-- Quantity + Add to Cart — now using CQuantitySelector -->
          <div class="flex items-center gap-4">
            <CQuantitySelector
              v-model="quantity"
              :min="1"
              :max="maxQty"
            />

            <UButton
              size="lg"
              color="primary"
              :loading="adding"
              :disabled="!product.inStock"
              class="flex-1"
              @click="handleAddToCart"
            >
              <UIcon name="i-heroicons-shopping-cart-20-solid" class="mr-2" />
              Add to Cart
            </UButton>
          </div>

          <!-- Description -->
          <div v-if="product.description" class="space-y-3">
            <h3 class="text-sm font-semibold text-highlighted uppercase tracking-wider">Description</h3>
            <div
              class="prose prose-sm max-w-none text-muted"
              v-html="t(product.description)"
            />
          </div>

          <!-- Attributes -->
          <div v-if="product.attributes.length > 0" class="space-y-3">
            <h3 class="text-sm font-semibold text-highlighted uppercase tracking-wider">Specifications</h3>
            <div class="grid grid-cols-2 gap-2">
              <div
                v-for="attr in product.attributes"
                :key="attr.code"
                class="bg-elevated rounded-lg p-3"
              >
                <span class="text-xs text-dimmed uppercase">{{ t(attr.name) }}</span>
                <p class="text-sm font-medium text-highlighted">{{ t(attr.value) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </UContainer>
</template>
