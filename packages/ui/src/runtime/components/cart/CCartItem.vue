<script setup lang="ts">
import { computed } from 'vue'
import { useAppConfig } from '#imports'
import type { CartItem, LocalizedString } from '@commercejs/types'

/**
 * CCartItem — Individual cart line item with image, details, quantity, and remove.
 * Follows Nuxt UI conventions: ui prop, slot-based theming, semantic tokens.
 */

export interface CartItemProps {
  /** Cart item data from @commercejs/types */
  item: CartItem
  /** Whether an operation is loading */
  loading?: boolean
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Per-instance theme overrides */
  ui?: Partial<{
    root: any
    imageWrapper: any
    image: any
    body: any
    title: any
    variant: any
    priceWrapper: any
    actions: any
  }>
}

const props = withDefaults(defineProps<CartItemProps>(), {
  loading: false,
  size: 'md',
})

const emit = defineEmits<{
  'update:quantity': [value: number]
  'remove': []
}>()

function t(value: LocalizedString | string | null | undefined): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  return value.en || value.ar || Object.values(value)[0] || ''
}

const itemName = computed(() => t(props.item.name))

// Resolve theme classes from app.config
const appConfig = useAppConfig()
const theme = computed(() => (appConfig.ui as any)?.cartItem ?? {})

const slotClasses = computed(() => {
  const t = theme.value
  const sizeStyles = t?.variants?.size?.[props.size] ?? {}
  const base = t?.slots ?? {}

  const merge = (slot: string) => [
    base[slot],
    sizeStyles[slot],
    props.ui?.[slot as keyof typeof props.ui],
  ]

  return {
    root: merge('root'),
    imageWrapper: merge('imageWrapper'),
    image: merge('image'),
    body: merge('body'),
    title: merge('title'),
    variant: merge('variant'),
    priceWrapper: merge('priceWrapper'),
    actions: merge('actions'),
  }
})
</script>

<template>
  <div :class="slotClasses.root">
    <!-- Image -->
    <slot name="image" :item="item">
      <div :class="slotClasses.imageWrapper">
        <img
          v-if="item.image"
          :src="item.image.url"
          :alt="item.image.alt || itemName"
          :class="slotClasses.image"
          loading="lazy"
        />
        <div v-else class="size-full flex items-center justify-center">
          <UIcon name="i-heroicons-photo" class="text-xl text-muted" />
        </div>
      </div>
    </slot>

    <!-- Details -->
    <div :class="slotClasses.body">
      <slot name="title" :name="itemName">
        <h4 :class="slotClasses.title">{{ itemName }}</h4>
      </slot>

      <slot name="variant" :item="item">
        <p v-if="item.variantId" :class="slotClasses.variant">
          {{ item.variantId }}
        </p>
      </slot>

      <!-- Price -->
      <slot name="price" :price="item.price">
        <div :class="slotClasses.priceWrapper">
          <CProductPrice :price="item.price" size="sm" :show-discount="false" />
        </div>
      </slot>

      <!-- Actions: quantity + remove -->
      <div :class="slotClasses.actions">
        <slot name="quantity" :quantity="item.quantity" :update="(v: number) => emit('update:quantity', v)">
          <CQuantitySelector
            :model-value="item.quantity"
            :disabled="loading"
            size="sm"
            @update:model-value="emit('update:quantity', $event)"
          />
        </slot>

        <slot name="remove" :remove="() => emit('remove')">
          <UButton
            icon="i-heroicons-trash-20-solid"
            variant="ghost"
            color="error"
            size="sm"
            :loading="loading"
            @click="emit('remove')"
          />
        </slot>
      </div>
    </div>
  </div>
</template>
