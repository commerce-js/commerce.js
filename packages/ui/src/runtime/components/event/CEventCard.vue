<script setup lang="ts">
import { computed } from 'vue'
import { useAppConfig } from '#imports'
import type { Product, EventProductMeta } from '@commercejs/types'

/**
 * CEventCard — Product card for event/ticket products.
 * Shows event date, venue, virtual badge, and ticket purchase CTA.
 */

export interface EventCardProps {
  product: Product
  event?: EventProductMeta
  /** Per-instance theme overrides */
  ui?: Partial<{
    root: any
    imageWrapper: any
    dateOverlay: any
    body: any
    title: any
    meta: any
    actions: any
  }>
}

const props = defineProps<EventCardProps>()

const emit = defineEmits<{
  'get-tickets': [product: Product]
}>()

const eventMeta = computed(() => props.event || props.product.event)

function t(value: any): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  return value.en || value.ar || Object.values(value)[0] || ''
}

const productName = computed(() => t(props.product.name))
const mainImage = computed(() => props.product.primaryImage || props.product.gallery?.[0])

const eventDate = computed(() => {
  if (!eventMeta.value?.startDate) return null
  return new Date(eventMeta.value.startDate)
})

const formattedMonth = computed(() => eventDate.value?.toLocaleString('en', { month: 'short' }).toUpperCase())
const formattedDay = computed(() => eventDate.value?.getDate())
const formattedTime = computed(() => eventDate.value?.toLocaleString('en', { hour: 'numeric', minute: '2-digit' }))

const spotsLeft = computed(() => {
  if (!eventMeta.value?.capacity) return null
  return eventMeta.value.capacity
})

// Resolve theme
const appConfig = useAppConfig()
const theme = computed(() => (appConfig.ui as any)?.eventCard ?? {})

const slotClasses = computed(() => {
  const base = theme.value?.slots ?? {}
  const merge = (slot: string) => [base[slot], props.ui?.[slot as keyof typeof props.ui]]
  return {
    root: merge('root'),
    imageWrapper: merge('imageWrapper'),
    dateOverlay: merge('dateOverlay'),
    body: merge('body'),
    title: merge('title'),
    meta: merge('meta'),
    actions: merge('actions'),
  }
})
</script>

<template>
  <div :class="['group relative rounded-lg overflow-hidden ring ring-default bg-default hover:shadow-lg transition-all duration-200', slotClasses.root]">
    <!-- Image -->
    <div :class="['relative aspect-[16/9] overflow-hidden bg-elevated', slotClasses.imageWrapper]">
      <img
        v-if="mainImage"
        :src="mainImage.url"
        :alt="mainImage.alt || productName"
        class="size-full object-cover transition-transform duration-300 group-hover:scale-105"
      />

      <!-- Date overlay -->
      <div v-if="eventDate" :class="['absolute top-3 start-3 bg-default/90 backdrop-blur-sm rounded-lg w-14 text-center py-1.5 ring ring-default', slotClasses.dateOverlay]">
        <span class="text-[10px] font-bold text-primary block leading-none">{{ formattedMonth }}</span>
        <span class="text-xl font-black text-highlighted block leading-tight">{{ formattedDay }}</span>
      </div>

      <!-- Virtual badge -->
      <UBadge v-if="eventMeta?.isVirtual" color="info" size="sm" class="absolute top-3 end-3">
        <UIcon name="i-heroicons-video-camera" class="me-0.5" />
        Online
      </UBadge>
    </div>

    <!-- Body -->
    <div :class="['p-4 space-y-2', slotClasses.body]">
      <slot name="title" :name="productName">
        <h3 :class="['font-medium text-sm text-highlighted line-clamp-2', slotClasses.title]">{{ productName }}</h3>
      </slot>

      <!-- Event meta -->
      <div :class="['space-y-1 text-xs text-muted', slotClasses.meta]">
        <div v-if="formattedTime" class="flex items-center gap-1">
          <UIcon name="i-heroicons-clock" />
          <span>{{ formattedTime }}</span>
        </div>
        <div v-if="eventMeta?.venue || eventMeta?.location" class="flex items-center gap-1">
          <UIcon :name="eventMeta.isVirtual ? 'i-heroicons-globe-alt' : 'i-heroicons-map-pin'" />
          <span class="line-clamp-1">{{ t(eventMeta.venue) || eventMeta.location }}</span>
        </div>
        <div v-if="spotsLeft" class="flex items-center gap-1">
          <UIcon name="i-heroicons-users" />
          <span>{{ spotsLeft }} spots available</span>
        </div>
      </div>

      <!-- Price + CTA -->
      <div class="flex items-center justify-between pt-1">
        <CProductPrice v-if="product.price" :price="product.price" size="sm" />
        <UButton size="xs" color="primary" @click="emit('get-tickets', product)">
          Get Tickets
        </UButton>
      </div>
    </div>
  </div>
</template>
