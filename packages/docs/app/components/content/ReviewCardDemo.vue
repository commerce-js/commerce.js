<script setup lang="ts">
const review = {
  id: 'r1',
  author: 'Sarah M.',
  rating: 5,
  title: 'Absolutely love these headphones!',
  body: 'The sound quality is incredible and the noise-cancelling is perfect for my daily commute. Battery lasts forever. Highly recommend!',
  verified: true,
  createdAt: '2024-12-15T10:00:00Z'
}
</script>

<template>
  <ComponentDemo>
    <div class="w-full max-w-md">
      <CReviewCard :review="review" />
    </div>
  </ComponentDemo>
</template>
