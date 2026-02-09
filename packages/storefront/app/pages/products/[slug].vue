<script setup lang="ts">
import type { Product } from '@commercejs/types'

const route = useRoute()
const slug = computed(() => route.params.slug as string)

const { data: product, status } = await useProduct({ id: slug.value })

const { t } = useLocalizedString()
const { formatPrice, hasDiscount, formatOriginal } = usePrice()
const { addItem, createCart, cartId } = useCart()

// Selected options (optionId → selected valueId)
// Salla resolves SKU + price server-side when adding to cart,
// so we only need to track the user's selections here.
const selectedOptions = reactive<Record<string, string>>({})

function selectOption(optionId: string, valueId: string) {
  selectedOptions[optionId] = valueId
}

// Selected image index
const selectedImageIndex = ref(0)

const allImages = computed(() => {
  if (!product.value) return []
  const imgs = [...(product.value.gallery || [])]
  if (product.value.primaryImage) imgs.unshift(product.value.primaryImage)
  // Deduplicate by URL
  return imgs.filter((img, i, arr) => arr.findIndex(x => x.url === img.url) === i)
})

const currentImage = computed(() => allImages.value[selectedImageIndex.value])

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

    toast.add({
      title: 'Added to cart',
      description: `${t(product.value.name)} has been added to your cart.`,
      icon: 'i-heroicons-check-circle',
      color: 'success',
    })
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
      <div class="h-6 w-48 bg-(--ui-bg-accented) rounded" />
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div class="aspect-square bg-(--ui-bg-accented) rounded-2xl" />
        <div class="space-y-4">
          <div class="h-8 bg-(--ui-bg-accented) rounded w-3/4" />
          <div class="h-6 bg-(--ui-bg-accented) rounded w-1/3" />
          <div class="h-32 bg-(--ui-bg-accented) rounded" />
        </div>
      </div>
    </div>

    <!-- 404 -->
    <div v-else-if="!product" class="text-center py-24">
      <UIcon name="i-heroicons-exclamation-triangle" class="text-5xl text-(--ui-text-dimmed) mb-4" />
      <h2 class="text-xl font-semibold text-(--ui-text-highlighted) mb-2">Product not found</h2>
      <UButton to="/products" variant="outline" color="primary" class="mt-4">Back to Products</UButton>
    </div>

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
        <!-- Image gallery -->
        <div class="space-y-4">
          <!-- Main image -->
          <div class="relative aspect-square rounded-2xl overflow-hidden bg-(--ui-bg-elevated) border border-(--ui-border)">
            <img
              v-if="currentImage"
              :src="currentImage.url"
              :alt="currentImage.alt || t(product.name)"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <UIcon name="i-heroicons-photo" class="text-6xl text-(--ui-text-dimmed)" />
            </div>

            <!-- Discount badge -->
            <UBadge
              v-if="hasDiscount(product.price)"
              color="error"
              size="lg"
              class="absolute top-4 left-4"
            >
              -{{ Math.round(product.price!.discountPercent!) }}%
            </UBadge>
          </div>

          <!-- Thumbnails -->
          <div v-if="allImages.length > 1" class="flex gap-2 overflow-x-auto pb-2">
            <button
              v-for="(img, index) in allImages"
              :key="img.url"
              class="shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all"
              :class="selectedImageIndex === index ? 'border-(--ui-primary) ring-2 ring-(--ui-primary)/20' : 'border-(--ui-border) hover:border-(--ui-primary)/50'"
              @click="selectedImageIndex = index"
            >
              <img
                :src="img.url"
                :alt="img.alt"
                class="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          </div>
        </div>

        <!-- Product info -->
        <div class="space-y-6">
          <!-- Name -->
          <h1 class="text-2xl md:text-3xl font-bold text-(--ui-text-highlighted)">
            {{ t(product.name) }}
          </h1>

          <!-- Rating -->
          <div v-if="product.rating && product.rating.average != null && product.rating.average >= 0" class="flex items-center gap-2">
            <div class="flex items-center gap-0.5">
              <UIcon
                v-for="i in 5"
                :key="i"
                :name="i <= Math.round(product.rating.average) ? 'i-heroicons-star-solid' : 'i-heroicons-star'"
                class="text-sm"
                :class="i <= Math.round(product.rating.average) ? 'text-yellow-400' : 'text-(--ui-text-dimmed)'"
              />
            </div>
            <span class="text-sm text-(--ui-text-muted)">
              {{ product.rating.average.toFixed(1) }} ({{ product.rating.count || 0 }} reviews)
            </span>
          </div>

          <!-- Price -->
          <div class="flex items-baseline gap-3">
            <span class="text-3xl font-bold text-(--ui-primary)">
              {{ formatPrice(product.price) }}
            </span>
            <span
              v-if="hasDiscount(product.price)"
              class="text-lg text-(--ui-text-dimmed) line-through"
            >
              {{ formatOriginal(product.price) }}
            </span>
          </div>

          <!-- Stock status -->
          <UBadge :color="product.inStock ? 'success' : 'error'" variant="subtle" size="sm">
            {{ product.inStock ? 'In Stock' : 'Out of Stock' }}
          </UBadge>

          <!-- Options / Variant Selectors -->
          <div v-if="product.options.length > 0" class="space-y-4">
            <div v-for="option in product.options" :key="option.id">
              <h3 class="text-sm font-semibold text-(--ui-text-highlighted) uppercase tracking-wider mb-2">{{ t(option.name) }}</h3>
              <div class="flex flex-wrap gap-2">
                <UButton
                  v-for="val in option.values"
                  :key="val.id"
                  :variant="selectedOptions[option.id] === val.id ? 'solid' : 'outline'"
                  :color="selectedOptions[option.id] === val.id ? 'primary' : 'neutral'"
                  size="sm"
                  @click="selectOption(option.id, val.id)"
                >
                  {{ t(val.name) }}
                </UButton>
              </div>
            </div>
          </div>

          <USeparator />

          <!-- Quantity + Add to Cart -->
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <UButton
                icon="i-heroicons-minus-20-solid"
                variant="outline"
                color="neutral"
                size="sm"
                :disabled="quantity <= 1"
                @click="quantity--"
              />
              <span class="w-12 text-center font-medium text-(--ui-text-highlighted)">{{ quantity }}</span>
              <UButton
                icon="i-heroicons-plus-20-solid"
                variant="outline"
                color="neutral"
                size="sm"
                :disabled="quantity >= maxQty"
                @click="quantity++"
              />
            </div>

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
            <h3 class="text-sm font-semibold text-(--ui-text-highlighted) uppercase tracking-wider">Description</h3>
            <div
              class="prose prose-sm max-w-none text-(--ui-text-muted)"
              v-html="t(product.description)"
            />
          </div>

          <!-- Attributes -->
          <div v-if="product.attributes.length > 0" class="space-y-3">
            <h3 class="text-sm font-semibold text-(--ui-text-highlighted) uppercase tracking-wider">Specifications</h3>
            <div class="grid grid-cols-2 gap-2">
              <div
                v-for="attr in product.attributes"
                :key="attr.code"
                class="bg-(--ui-bg-elevated) rounded-lg p-3"
              >
                <span class="text-xs text-(--ui-text-dimmed) uppercase">{{ t(attr.name) }}</span>
                <p class="text-sm font-medium text-(--ui-text-highlighted)">{{ t(attr.value) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </UContainer>
</template>
