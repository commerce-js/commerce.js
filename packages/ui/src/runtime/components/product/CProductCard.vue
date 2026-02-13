<script setup lang="ts">
import type { Product, LocalizedString } from '@commercejs/types'

/**
 * CProductCard — Ecommerce product card.
 * Follows Nuxt UI conventions: as prop, ui prop, slot-based theming, variants.
 */

export interface ProductCardProps {
  /** The element or component this component should render as */
  as?: any
  /** Product data from @commercejs/types */
  product: Product
  /** Visual variant */
  variant?: 'outline' | 'soft' | 'ghost'
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Show quick-add button on hover */
  showQuickAdd?: boolean
  /** Show wishlist button */
  showWishlist?: boolean
  /** Show star rating */
  showRating?: boolean
  /** Image aspect ratio class */
  imageAspect?: string
  /** Per-instance theme overrides */
  ui?: Partial<{
    root: any
    imageWrapper: any
    image: any
    badge: any
    overlay: any
    body: any
    title: any
    price: any
    originalPrice: any
    priceWrapper: any
    rating: any
  }>
}

const props = withDefaults(defineProps<ProductCardProps>(), {
  variant: 'outline',
  size: 'md',
  showQuickAdd: true,
  showWishlist: false,
  showRating: false,
  imageAspect: 'aspect-square',
})

const emit = defineEmits<{
  'add-to-cart': [product: Product]
  'toggle-wishlist': [product: Product]
}>()

// Resolve localized strings — first try current locale, fallback chain
function t(value: LocalizedString | string | null | undefined): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  // Simple fallback: en → ar → first available
  return value.en || value.ar || Object.values(value)[0] || ''
}

const productName = computed(() => t(props.product.name))
const mainImage = computed(() => props.product.primaryImage || props.product.gallery?.[0])

const hasDiscount = computed(() => {
  const p = props.product.price
  return p?.originalAmount != null && p.originalAmount > p.amount
})

const discountPercent = computed(() => {
  const p = props.product.price
  if (!p) return 0
  if (p.discountPercent) return p.discountPercent
  if (p.originalAmount && p.originalAmount > p.amount) {
    return Math.round(((p.originalAmount - p.amount) / p.originalAmount) * 100)
  }
  return 0
})

// Resolve theme classes from app.config
const appConfig = useAppConfig()
const theme = computed(() => (appConfig.ui as any)?.productCard ?? {})

const slotClasses = computed(() => {
  const t = theme.value
  const variantStyles = t?.variants?.variant?.[props.variant] ?? {}
  const sizeStyles = t?.variants?.size?.[props.size] ?? {}
  const base = t?.slots ?? {}

  // Merge: base → variant → size → instance ui prop
  const merge = (slot: string) => [
    base[slot],
    variantStyles[slot],
    sizeStyles[slot],
    props.ui?.[slot as keyof typeof props.ui],
  ]

  return {
    root: merge('root'),
    imageWrapper: merge('imageWrapper'),
    image: merge('image'),
    badge: merge('badge'),
    overlay: merge('overlay'),
    body: merge('body'),
    title: merge('title'),
    price: merge('price'),
    originalPrice: merge('originalPrice'),
    priceWrapper: merge('priceWrapper'),
    rating: merge('rating'),
  }
})

const productUrl = computed(() => `/products/${props.product.slug || props.product.id}`)
const rootTag = computed(() => props.as || resolveComponent('NuxtLink'))
</script>

<template>
  <component
    :is="rootTag"
    :to="rootTag !== 'div' ? productUrl : undefined"
    :class="slotClasses.root"
  >
    <!-- Image -->
    <div :class="[slotClasses.imageWrapper, imageAspect]">
      <slot name="image" :product="product" :image="mainImage">
        <img
          v-if="mainImage"
          :src="mainImage.url"
          :alt="mainImage.alt || productName"
          :class="slotClasses.image"
          loading="lazy"
        />
        <div v-else class="size-full bg-elevated flex items-center justify-center">
          <UIcon name="i-heroicons-photo" class="text-3xl text-muted" />
        </div>
      </slot>

      <!-- Discount badge -->
      <slot name="badge" :discount="discountPercent" :has-discount="hasDiscount">
        <UBadge
          v-if="hasDiscount"
          color="error"
          variant="solid"
          size="sm"
          :class="slotClasses.badge"
        >
          -{{ discountPercent }}%
        </UBadge>
      </slot>

      <!-- Hover overlay (quick add, wishlist) -->
      <div v-if="showQuickAdd || showWishlist" :class="slotClasses.overlay">
        <slot name="actions" :product="product">
          <UButton
            v-if="showWishlist"
            icon="i-heroicons-heart"
            variant="soft"
            color="neutral"
            size="sm"
            class="me-2"
            @click.prevent="emit('toggle-wishlist', product)"
          />
          <UButton
            v-if="showQuickAdd"
            icon="i-heroicons-shopping-cart-20-solid"
            variant="solid"
            color="primary"
            size="sm"
            @click.prevent="emit('add-to-cart', product)"
          />
        </slot>
      </div>
    </div>

    <!-- Body -->
    <div :class="slotClasses.body">
      <slot name="title" :name="productName">
        <h3 :class="slotClasses.title">{{ productName }}</h3>
      </slot>

      <!-- Rating -->
      <slot v-if="showRating && product.rating" name="rating" :rating="product.rating">
        <div :class="slotClasses.rating">
          <UIcon name="i-heroicons-star-20-solid" class="text-yellow-400" />
          <span>{{ product.rating.average.toFixed(1) }}</span>
          <span class="text-muted">({{ product.rating.count }})</span>
        </div>
      </slot>

      <!-- Price -->
      <slot name="price" :price="product.price">
        <div v-if="product.price" :class="slotClasses.priceWrapper">
          <span :class="slotClasses.price">{{ product.price.formatted }}</span>
          <span
            v-if="hasDiscount && product.price.originalAmount"
            :class="slotClasses.originalPrice"
          >
            {{ product.price.originalAmount }} {{ product.price.currency }}
          </span>
        </div>
      </slot>
    </div>
  </component>
</template>
