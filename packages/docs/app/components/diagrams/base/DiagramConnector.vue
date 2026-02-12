<script setup lang="ts">
const props = defineProps<{
  /** Number of target endpoints to fan out to */
  count: number
  /** Hex color for the connector lines */
  color: string
  /** Whether lines are dashed */
  dashed?: boolean
  /** Height of the connector area in pixels */
  height?: number
  /** Whether to use full width (no max-width cap) */
  wide?: boolean
}>()

const viewBoxWidth = 400
const svgHeight = computed(() => props.height ?? (props.dashed ? 120 : 60))

/** Calculate evenly-spaced endpoint X positions */
const endpoints = computed(() => {
  const padding = props.wide ? 15 : 100
  const span = viewBoxWidth - padding * 2
  if (props.count <= 1) return [viewBoxWidth / 2]
  return Array.from({ length: props.count }, (_, i) =>
    padding + (span * i) / (props.count - 1),
  )
})

const centerX = viewBoxWidth / 2
const strokeAttrs = computed(() =>
  props.dashed ? { 'stroke-dasharray': '5,5' } : {},
)
</script>

<template>
  <div class="-my-1 w-full mx-auto" :class="wide ? '' : 'max-w-[400px]'" :style="{ height: `${svgHeight}px` }">
    <svg
      class="block h-full w-full"
      :viewBox="`0 0 ${viewBoxWidth} ${svgHeight}`"
      :preserveAspectRatio="wide ? 'none' : 'xMidYMid meet'"
    >
      <line
        v-for="(x, i) in endpoints"
        :key="i"
        :x1="centerX"
        y1="5"
        :x2="x"
        :y2="svgHeight - 2"
        :stroke="`${color}${dashed ? '59' : ''}`"
        stroke-width="2"
        v-bind="strokeAttrs"
      />
      <circle :cx="centerX" cy="5" r="4" :fill="color" />
    </svg>
  </div>
</template>
