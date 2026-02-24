<script setup lang="ts">
import type { Product } from '@commercejs/types'

const props = defineProps<{
  product: Product
}>()

const { addItem, createCart, cartId } = useCart()
const toast = useToast()

async function handleAddToCart(product: Product) {
  try {
    // Ensure cart exists
    if (!cartId.value) {
      await createCart()
    }
    await addItem({
      productId: product.id,
      quantity: 1,
    })
    // No success toast — the cart drawer slides open automatically as confirmation
  } catch (e) {
    toast.add({
      title: 'Failed to add to cart',
      icon: 'i-heroicons-exclamation-triangle',
      color: 'error',
    })
  }
}
</script>

<template>
  <CProductCard
    :product="product"
    variant="outline"
    show-quick-add
    @add-to-cart="handleAddToCart"
  />
</template>
