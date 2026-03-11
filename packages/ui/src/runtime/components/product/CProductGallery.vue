<script setup lang="ts">
import { computed,ref,watch } from 'vue'
import { useAppConfig } from '#imports'
import type { Image } from '@commercejs/types'

/**
 * CProductGallery — Product image gallery with thumbnails and main image.
 * Uses Nuxt UI's UCarousel when available, falls back to manual implementation.
 */

export interface ProductGalleryProps {
  /** Array of product images */
  images: Image[]
  /** Selected image index */
  modelValue?: number
  /** Show thumbnail strip */
  showThumbnails?: boolean
  /** Thumbnail position */
  thumbnailPosition?: 'bottom' | 'start'
  /** Enable zoom on hover */
  zoomable?: boolean
  /** Per-instance theme overrides */
  ui?: Partial<{
    root: any
    main: any
    mainImage: any
    thumbnails: any
    thumbnail: any
    thumbnailActive: any
  }>
}

const props = withDefaults(defineProps<ProductGalleryProps>(), {
  modelValue: 0,
  showThumbnails: true,
  thumbnailPosition: 'bottom',
  zoomable: false,
})

const emit = defineEmits<{
  'update:modelValue': [index: number]
}>()

const selectedIndex = ref(props.modelValue)

watch(() => props.modelValue, (v) => { selectedIndex.value = v })

function selectImage(index: number) {
  selectedIndex.value = index
  emit('update:modelValue', index)
}

const currentImage = computed(() => props.images[selectedIndex.value] || props.images[0])

// Resolve theme from app.config
const appConfig = useAppConfig()
const theme = computed(() => (appConfig.ui as any)?.productGallery ?? {})

const slotClasses = computed(() => {
  const base = theme.value?.slots ?? {}
  const positionStyles = theme.value?.variants?.thumbnailPosition?.[props.thumbnailPosition] ?? {}
  const merge = (slot: string) => [
    base[slot],
    positionStyles[slot],
    props.ui?.[slot as keyof typeof props.ui],
  ]
  return {
    root: merge('root'),
    main: merge('main'),
    mainImage: merge('mainImage'),
    thumbnails: merge('thumbnails'),
    thumbnail: merge('thumbnail'),
    thumbnailActive: merge('thumbnailActive'),
  }
})
</script>

<template>
  <div :class="slotClasses.root">
    <!-- Main image -->
    <slot name="main" :image="currentImage" :index="selectedIndex">
      <div :class="slotClasses.main">
        <img
          v-if="currentImage"
          :src="currentImage.url"
          :alt="currentImage.alt"
          :class="slotClasses.mainImage"
        />
        <div v-else class="size-full bg-elevated flex items-center justify-center">
          <UIcon name="i-heroicons-photo" class="text-5xl text-muted" />
        </div>
      </div>
    </slot>

    <!-- Thumbnails -->
    <slot v-if="showThumbnails && images.length > 1" name="thumbnails" :images="images" :selected="selectedIndex" :select="selectImage">
      <div :class="slotClasses.thumbnails">
        <button
          v-for="(img, i) in images"
          :key="i"
          :class="[
            slotClasses.thumbnail,
            selectedIndex === i ? slotClasses.thumbnailActive : ''
          ]"
          @click="selectImage(i)"
        >
          <img :src="img.url" :alt="img.alt" class="size-full object-cover" />
        </button>
      </div>
    </slot>
  </div>
</template>
