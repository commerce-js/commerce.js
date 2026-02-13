<script setup lang="ts">
const images = [
  { url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop', alt: 'Headphones front' },
  { url: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&h=600&fit=crop', alt: 'Headphones side' },
  { url: 'https://images.unsplash.com/photo-1487215078519-e21cc028cb29?w=600&h=600&fit=crop', alt: 'Headphones detail' },
  { url: 'https://images.unsplash.com/photo-1524678606370-a47ad25cb82a?w=600&h=600&fit=crop', alt: 'Headphones lifestyle' },
]

const selectedIndex = ref(0)
</script>

<template>
  <ComponentDemo>
    <div class="w-full max-w-md">
      <CProductGallery v-model="selectedIndex" :images="images" />
    </div>
  </ComponentDemo>
</template>
