<script setup lang="ts">
export interface DiagramLegend {
  color: string
  label: string
}

defineProps<{
  legends: DiagramLegend[]
  documentId?: string
}>()
</script>

<template>
  <div class="mt-10 flex items-center justify-between pt-5">
    <div class="flex items-center gap-5">
      <div
        v-for="(legend, i) in legends"
        :key="i"
        class="flex items-center gap-1.5"
      >
        <span
          class="h-2.5 w-2.5 rounded-full"
          :style="{ backgroundColor: legend.color }"
        />
        <span class="text-[10px] font-medium uppercase text-zinc-400">
          {{ legend.label }}
        </span>
      </div>
    </div>
    <div v-if="documentId" class="text-[10px] font-bold uppercase tracking-tight text-zinc-400/40">
      Documentation Asset // {{ documentId }}
    </div>
  </div>
</template>
