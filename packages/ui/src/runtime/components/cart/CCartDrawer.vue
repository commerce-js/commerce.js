<script setup lang="ts">
import type { Cart, CartItem, LocalizedString } from '@commercejs/types'

/**
 * CCartDrawer — Slide-over panel showing cart contents.
 * Opens from the right, displays compact cart items, subtotal, and action buttons.
 * Designed to be triggered by `onItemAdded` from the `useCart` composable.
 */

export interface CartDrawerProps {
  /** Cart data */
  cart: Cart | null
  /** Cart line items (overrides cart.items if provided) */
  items?: CartItem[]
  /** Number of items in cart (overrides cart.itemCount if provided) */
  itemCount?: number
  /** Whether a cart operation is loading */
  loading?: boolean
  /** Title shown in the drawer header */
  title?: string
  /** Label for the "Checkout" button */
  checkoutLabel?: string
  /** Route for the "Checkout" button */
  checkoutTo?: string
  /** Label for the "View Cart" button */
  viewCartLabel?: string
  /** Route for the "View Cart" button */
  viewCartTo?: string
  /** Function to resolve the product URL from a cart item. Defaults to `/products/{productSlug || productId}` */
  resolveProductUrl?: (item: CartItem) => string
}

const props = withDefaults(defineProps<CartDrawerProps>(), {
  loading: false,
  title: 'Your Cart',
  checkoutLabel: 'Checkout',
  checkoutTo: '/checkout',
  viewCartLabel: 'View Full Cart',
  viewCartTo: '/cart',
  resolveProductUrl: (item: CartItem) => `/products/${item.productSlug || item.productId}`,
})

const emit = defineEmits<{
  'update:quantity': [itemId: string, quantity: number]
  'remove': [itemId: string]
}>()

const open = defineModel<boolean>('open', { default: false })

function t(value: LocalizedString | string | null | undefined): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  return value.en || value.ar || Object.values(value)[0] || ''
}

const cartItems = computed(() => {
  if (props.items) return props.items
  return props.cart?.items ?? []
})

const count = computed(() => {
  if (props.itemCount != null) return props.itemCount
  return props.cart?.itemCount ?? 0
})

const subtotalFormatted = computed(() => {
  return props.cart?.totals?.subtotal?.formatted ?? ''
})

function handleClose() {
  open.value = false
}
</script>

<template>
  <USlideover
    v-model:open="open"
    :title="title"
    side="right"
    :ui="{
      content: 'max-w-sm overflow-hidden',
      body: 'flex flex-col p-0 overflow-hidden',
      footer: 'flex-col items-stretch gap-3',
    }"
  >
    <!-- Hidden default slot (controlled externally via v-model:open) -->
    <template #default>
      <slot name="trigger" />
    </template>

    <!-- Body: cart items list -->
    <template #body>
      <!-- Empty state -->
      <div
        v-if="cartItems.length === 0"
        class="flex-1 flex flex-col items-center justify-center text-center py-16 px-6 gap-3"
      >
        <div class="w-16 h-16 rounded-full bg-elevated flex items-center justify-center mb-2">
          <UIcon name="i-heroicons-shopping-cart" class="text-2xl text-muted" />
        </div>
        <p class="text-sm font-medium text-highlighted">Your cart is empty</p>
        <p class="text-xs text-muted">Add items to get started</p>
        <UButton
          to="/products"
          size="sm"
          variant="soft"
          color="primary"
          class="mt-2"
          @click="handleClose"
        >
          Browse Products
        </UButton>
      </div>

      <!-- Items list -->
      <div v-else class="flex-1 overflow-y-auto overflow-x-hidden">
        <div
          v-for="item in cartItems"
          :key="item.id"
          class="flex items-start gap-3 px-4 py-3 border-b border-(--ui-border) last:border-b-0 overflow-hidden"
        >
          <!-- Thumbnail -->
          <NuxtLink
            :to="resolveProductUrl(item)"
            class="shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-elevated"
            @click="handleClose"
          >
            <img
              v-if="item.image"
              :src="item.image.url"
              :alt="item.image.alt || t(item.name)"
              class="w-full h-full object-cover"
              loading="lazy"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <UIcon name="i-heroicons-photo" class="text-lg text-muted" />
            </div>
          </NuxtLink>

          <!-- Item details -->
          <div class="flex-1 min-w-0">
            <NuxtLink
              :to="resolveProductUrl(item)"
              class="text-sm font-medium text-highlighted hover:text-primary transition-colors line-clamp-1 block"
              @click="handleClose"
            >
              {{ t(item.name) }}
            </NuxtLink>

            <p v-if="item.variantName" class="text-xs text-muted mt-0.5">
              {{ t(item.variantName) }}
            </p>

            <!-- Price -->
            <CProductPrice
              v-if="item.price"
              :price="item.price"
              size="xs"
              class="mt-0.5"
            />

            <!-- Quantity + Remove -->
            <div class="flex items-center justify-between mt-1.5">
              <CQuantitySelector
                :model-value="item.quantity"
                :disabled="loading"
                size="sm"
                @update:model-value="emit('update:quantity', item.id, $event)"
              />

              <UButton
                icon="i-heroicons-trash-20-solid"
                variant="ghost"
                color="error"
                size="xs"
                :loading="loading"
                @click="emit('remove', item.id)"
              />
            </div>
          </div>
        </div>
      </div>
    </template>

    <template v-if="cartItems.length > 0" #footer>
      <div class="flex items-center justify-between">
        <span class="text-sm text-muted">Subtotal ({{ count }} items)</span>
        <span class="text-base font-bold text-highlighted">{{ subtotalFormatted }}</span>
      </div>
      <p class="text-xs text-dimmed">Shipping & taxes calculated at checkout</p>

      <UButton
        :to="checkoutTo"
        color="primary"
        size="xl"
        block
        @click="handleClose"
      >
        {{ checkoutLabel }}
      </UButton>

      <UButton
        :to="viewCartTo"
        variant="ghost"
        color="neutral"
        size="sm"
        block
        @click="handleClose"
      >
        {{ viewCartLabel }}
      </UButton>
    </template>
  </USlideover>
</template>
