<script setup lang="ts">
/**
 * CHeroBanner — Full-width marketing hero banner with CTA.
 * Supports image/video backgrounds, overlays, and multiple content slots.
 */

export interface HeroBannerProps {
  /** Background image URL */
  imageUrl?: string
  /** Optional video URL for background */
  videoUrl?: string
  /** Title text */
  title?: string
  /** Subtitle text */
  subtitle?: string
  /** Primary CTA label */
  ctaLabel?: string
  /** Primary CTA link */
  ctaTo?: string
  /** Secondary CTA label */
  secondaryCtaLabel?: string
  /** Secondary CTA link */
  secondaryCtaTo?: string
  /** Content alignment */
  align?: 'start' | 'center' | 'end'
  /** Overlay intensity */
  overlay?: 'none' | 'light' | 'dark'
  /** Height variant */
  height?: 'sm' | 'md' | 'lg' | 'full'
  /** Per-instance theme overrides */
  ui?: Partial<{
    root: any
    background: any
    overlay: any
    content: any
    title: any
    subtitle: any
    actions: any
  }>
}

const props = withDefaults(defineProps<HeroBannerProps>(), {
  align: 'center',
  overlay: 'dark',
  height: 'lg',
})

const heightClass = computed(() => {
  const map = {
    sm: 'min-h-[240px] md:min-h-[320px]',
    md: 'min-h-[320px] md:min-h-[480px]',
    lg: 'min-h-[400px] md:min-h-[560px]',
    full: 'min-h-screen',
  }
  return map[props.height] || map.lg
})

const alignClass = computed(() => {
  const map = {
    start: 'items-start text-start',
    center: 'items-center text-center',
    end: 'items-end text-end',
  }
  return map[props.align] || map.center
})

const overlayClass = computed(() => {
  const map = {
    none: '',
    light: 'bg-white/30',
    dark: 'bg-black/50',
  }
  return map[props.overlay] || map.dark
})

// Resolve theme from app.config
const appConfig = useAppConfig()
const theme = computed(() => (appConfig.ui as any)?.heroBanner ?? {})

const slotClasses = computed(() => {
  const base = theme.value?.slots ?? {}
  const merge = (slot: string) => [
    base[slot],
    props.ui?.[slot as keyof typeof props.ui],
  ]
  return {
    root: merge('root'),
    background: merge('background'),
    overlay: merge('overlay'),
    content: merge('content'),
    title: merge('title'),
    subtitle: merge('subtitle'),
    actions: merge('actions'),
  }
})
</script>

<template>
  <div :class="['relative overflow-hidden flex', heightClass, slotClasses.root]">
    <!-- Background -->
    <slot name="background" :image-url="imageUrl" :video-url="videoUrl">
      <video
        v-if="videoUrl"
        :src="videoUrl"
        autoplay
        muted
        loop
        playsinline
        :class="['absolute inset-0 size-full object-cover', slotClasses.background]"
      />
      <img
        v-else-if="imageUrl"
        :src="imageUrl"
        alt=""
        :class="['absolute inset-0 size-full object-cover', slotClasses.background]"
      />
    </slot>

    <!-- Overlay -->
    <div :class="['absolute inset-0 z-10', overlayClass, slotClasses.overlay]" />

    <!-- Content -->
    <div :class="['relative z-20 flex flex-col justify-center px-6 md:px-12 lg:px-24 w-full', alignClass, slotClasses.content]">
      <slot>
        <h1 v-if="title" :class="['text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4', slotClasses.title]">
          {{ title }}
        </h1>
        <p v-if="subtitle" :class="['text-lg md:text-xl text-white/80 max-w-2xl mb-8', slotClasses.subtitle]">
          {{ subtitle }}
        </p>
        <div v-if="ctaLabel || secondaryCtaLabel" :class="['flex gap-3 flex-wrap', alignClass.includes('center') ? 'justify-center' : '', slotClasses.actions]">
          <UButton v-if="ctaLabel" :to="ctaTo" size="lg" color="primary">
            {{ ctaLabel }}
          </UButton>
          <UButton v-if="secondaryCtaLabel" :to="secondaryCtaTo" size="lg" variant="outline" color="neutral" class="text-white border-white/30 hover:bg-white/10">
            {{ secondaryCtaLabel }}
          </UButton>
        </div>
      </slot>
    </div>
  </div>
</template>
