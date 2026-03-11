<script setup lang="ts">
import { computed } from 'vue'
import { useAppConfig } from '#imports'
import type { Review } from '@commercejs/types'

/**
 * CReviewCard — Individual product review card.
 * Displays reviewer name, rating, title, body, and verification badge.
 */

export interface ReviewCardProps {
  /** Review data from @commercejs/types */
  review: Review
  /** Per-instance theme overrides */
  ui?: Partial<{
    root: any
    header: any
    author: any
    date: any
    title: any
    body: any
    verified: any
  }>
}

const props = defineProps<ReviewCardProps>()

const formattedDate = computed(() => {
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(props.review.createdAt))
  } catch {
    return props.review.createdAt
  }
})

// Resolve theme from app.config
const appConfig = useAppConfig()
const theme = computed(() => (appConfig.ui as any)?.reviewCard ?? {})

const slotClasses = computed(() => {
  const base = theme.value?.slots ?? {}
  const merge = (slot: string) => [
    base[slot],
    props.ui?.[slot as keyof typeof props.ui],
  ]
  return {
    root: merge('root'),
    header: merge('header'),
    author: merge('author'),
    date: merge('date'),
    title: merge('title'),
    body: merge('body'),
    verified: merge('verified'),
  }
})
</script>

<template>
  <div :class="slotClasses.root">
    <!-- Header: stars + author + date -->
    <div :class="slotClasses.header">
      <slot name="rating" :rating="review.rating">
        <CReviewStars :model-value="review.rating" size="sm" />
      </slot>

      <div class="flex items-center gap-2 text-sm">
        <slot name="author" :author="review.authorName">
          <span :class="slotClasses.author">{{ review.authorName }}</span>
        </slot>

        <slot name="verified" :verified="review.verified">
          <UBadge v-if="review.verified" color="success" variant="subtle" size="xs">
            <UIcon name="i-heroicons-check-badge-20-solid" class="me-0.5" />
            Verified
          </UBadge>
        </slot>

        <slot name="date" :date="formattedDate">
          <span :class="slotClasses.date">{{ formattedDate }}</span>
        </slot>
      </div>
    </div>

    <!-- Title -->
    <slot v-if="review.title" name="title" :title="review.title">
      <h4 :class="slotClasses.title">{{ review.title }}</h4>
    </slot>

    <!-- Body -->
    <slot v-if="review.body" name="body" :body="review.body">
      <p :class="slotClasses.body">{{ review.body }}</p>
    </slot>
  </div>
</template>
