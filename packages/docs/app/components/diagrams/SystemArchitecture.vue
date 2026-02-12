<script setup lang="ts">
const layers = [
  {
    label: 'Application Layer',
    color: 'success' as const,
    nodes: [
      { label: 'Storefront UI', icon: 'i-lucide-monitor' },
      { label: 'Framework Module', icon: 'i-lucide-puzzle' },
    ],
  },
  {
    label: 'Commerce Engine',
    color: 'primary' as const,
    nodes: [
      { label: 'Unified Data Model', icon: 'i-lucide-database' },
      { label: 'Orchestration', icon: 'i-lucide-workflow' },
      { label: 'Checkout Engine', icon: 'i-lucide-shopping-cart' },
    ],
  },
  {
    label: 'Integration Layer',
    color: 'info' as const,
    nodes: [
      { label: 'Platform Adapters', icon: 'i-lucide-blocks' },
      { label: 'Payment Providers', icon: 'i-lucide-credit-card' },
      { label: 'Webhook Security', icon: 'i-lucide-shield-check' },
    ],
  },
]

const externals = [
  { label: 'Stripe', icon: 'i-lucide-credit-card' },
  { label: 'SendGrid', icon: 'i-lucide-mail' },
  { label: 'Algolia', icon: 'i-lucide-search' },
  { label: 'ShipStation', icon: 'i-lucide-truck' },
]
</script>

<template>
  <DiagramContainer icon="i-lucide-network" max-width="max-w-5xl">
    <DiagramHeader title="System Architecture" subtitle="Package Layer Diagram" />

    <div class="mt-8 flex flex-col items-center gap-2">
      <!-- Render each architectural layer -->
      <template v-for="(layer, i) in layers" :key="layer.label">
        <!-- Layer with rotated side label -->
        <div class="flex w-full items-stretch gap-0">
          <!-- Rotated side label -->
          <div
            class="flex w-8 shrink-0 items-center justify-center rounded-l-2xl border-2 border-r-0 py-4"
            :class="{
              'border-success-500 dark:border-success-400/60 bg-success-50/50 dark:bg-success-950/20': layer.color === 'success',
              'border-primary-300 dark:border-primary-500/40 bg-primary-50/50 dark:bg-primary-950/20': layer.color === 'primary',
              'border-info-300 dark:border-info-500/40 bg-info-50/50 dark:bg-info-950/20': layer.color === 'info',
            }"
          >
            <span
              class="whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.15em]"
              :class="{
                'text-success-600 dark:text-success-400': layer.color === 'success',
                'text-primary-500 dark:text-primary-400': layer.color === 'primary',
                'text-info-500 dark:text-info-400': layer.color === 'info',
              }"
              style="writing-mode: vertical-rl; transform: rotate(180deg)"
            >
              {{ layer.label }}
            </span>
          </div>

          <!-- Panel body (no floating pill — label is on the side) -->
          <div
            class="flex flex-1 flex-wrap items-center justify-center gap-3 rounded-r-2xl border-2 border-l-0 p-6"
            :class="{
              'border-success-500 dark:border-success-400/60 bg-success-50/20 dark:bg-success-950/10': layer.color === 'success',
              'border-primary-300 dark:border-primary-500/40 bg-primary-50/20 dark:bg-primary-950/10': layer.color === 'primary',
              'border-info-300 dark:border-info-500/40 bg-info-50/20 dark:bg-info-950/10': layer.color === 'info',
            }"
          >
            <DiagramNode
              v-for="node in layer.nodes"
              :key="node.label"
              :label="node.label"
              :icon="node.icon"
              size="sm"
              :color="layer.color"
              variant="outline"
            />
          </div>
        </div>

        <!-- Dotted connector between layers -->
        <DiagramConnector
          v-if="i < layers.length - 1"
          :count="1"
          color="#9ca3af"
          dashed
          :height="40"
        />
      </template>

      <!-- External systems row with inline dashed connectors -->
      <div class="flex w-full justify-around pt-4">
        <div
          v-for="ext in externals"
          :key="ext.label"
          class="flex flex-col items-center gap-2"
        >
          <!-- Dashed vertical line -->
          <div class="h-10 w-px border-l-2 border-dashed border-zinc-300 dark:border-zinc-600" />
          <!-- Icon box -->
          <div class="flex size-12 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800">
            <UIcon :name="ext.icon" class="size-5 text-zinc-500 dark:text-zinc-400" />
          </div>
          <span class="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            {{ ext.label }}
          </span>
        </div>
      </div>
    </div>

    <DiagramFooter
      :legends="[
        { color: '#10b981', label: 'Application' },
        { color: '#3b82f6', label: 'Engine' },
        { color: '#06b6d4', label: 'Integration' },
        { color: '#64748b', label: 'External' },
      ]"
      document-id="COMMERCE_JS_ARCH_01"
    />
  </DiagramContainer>
</template>
