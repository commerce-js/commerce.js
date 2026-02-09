<script setup lang="ts">
import type { Product } from '@commercejs/types'

const props = defineProps<{
  product: Product
}>()

const { t } = useLocalizedString()
const { formatPrice, hasDiscount, formatOriginal } = usePrice()

const productName = computed(() => t(props.product.name))
const productSlug = computed(() => props.product.slug || props.product.id)
const mainImage = computed(() => props.product.primaryImage || props.product.gallery?.[0])
const discount = computed(() => {
  const p = props.product.price
  if (p && 'discountPercent' in p && p.discountPercent && p.discountPercent > 0) {
    return Math.round(p.discountPercent)
  }
  return null
})
</script>

<template>
  <NuxtLink
    :to="`/products/${productSlug}`"
    class="group block rounded-xl overflow-hidden bg-(--ui-bg-elevated) border border-(--ui-border) hover:border-(--ui-primary)/50 transition-all duration-300 hover:shadow-lg hover:shadow-(--ui-primary)/5 hover:-translate-y-0.5"
  >
    <!-- Image -->
    <div class="relative aspect-square overflow-hidden bg-(--ui-bg-accented)">
      <img
        v-if="mainImage"
        :src="mainImage.url"
        :alt="mainImage.alt || productName"
        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
      />
      <div v-else class="w-full h-full flex items-center justify-center">
        <UIcon name="i-heroicons-photo" class="text-4xl text-(--ui-text-dimmed)" />
      </div>

      <!-- Discount badge -->
      <UBadge
        v-if="discount"
        color="error"
        size="sm"
        class="absolute top-3 left-3"
      >
        -{{ discount }}%
      </UBadge>

      <!-- Quick add overlay -->
      <div class="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
        <UButton
          block
          size="sm"
          color="primary"
          icon="i-heroicons-shopping-cart-20-solid"
          class="backdrop-blur-sm"
        >
          Add to Cart
        </UButton>
      </div>
    </div>

    <!-- Content -->
    <div class="p-4 space-y-2">
      <h3 class="font-medium text-sm text-(--ui-text-highlighted) line-clamp-2 leading-snug group-hover:text-(--ui-primary) transition-colors">
        {{ productName }}
      </h3>

      <div class="flex items-baseline gap-2">
        <span class="font-bold text-(--ui-primary)">
          {{ formatPrice(product.price) }}
        </span>
        <span
          v-if="hasDiscount(product.price)"
          class="text-xs text-(--ui-text-dimmed) line-through"
        >
          {{ formatOriginal(product.price) }}
        </span>
      </div>
    </div>
  </NuxtLink>
</template>
