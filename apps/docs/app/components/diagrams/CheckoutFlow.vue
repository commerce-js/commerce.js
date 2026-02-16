<script setup lang="ts">
const phases = [
  {
    label: 'Information',
    color: 'primary' as const,
    steps: [
      { emoji: '👤', label: 'Collect Info' },
      { emoji: '📦', label: 'Shipping Details' },
    ],
  },
  {
    label: 'Payment',
    color: 'info' as const,
    steps: [
      { emoji: '💳', label: 'Process Payment' },
      { emoji: '🔒', label: 'Verify & Capture' },
    ],
  },
]
</script>

<template>
  <DiagramContainer icon="i-lucide-git-branch-plus" max-width="max-w-5xl">
    <DiagramHeader title="Checkout Flow" subtitle="State Machine" />

    <!-- Horizontal phase layout -->
    <div class="mt-8 grid grid-cols-1 items-stretch gap-6 md:grid-cols-3">
      <!-- Collection + Payment phases -->
      <template v-for="phase in phases" :key="phase.label">
        <DiagramPanel :label="phase.label" :color="phase.color" variant="dashed">
          <div class="flex w-full flex-col items-center gap-2">
            <DiagramNode
              v-for="(step, i) in phase.steps"
              :key="step.label"
              :label="`${step.emoji} ${step.label}`"
              :color="phase.color"
              variant="solid"
            />
            <!-- Arrow between steps within panel -->
            <template v-if="phase.steps.length > 1" />
          </div>
        </DiagramPanel>
      </template>

      <!-- Result phase -->
      <DiagramPanel label="Result" color="secondary" variant="dashed">
        <div class="flex w-full flex-col items-center gap-3">
          <DiagramNode label="✅ Order Complete" color="success" variant="solid" />
          <DiagramNode label="❌ Payment Failed" color="error" variant="solid" />
          <p class="mt-2 text-center text-[10px] font-medium uppercase tracking-wider text-zinc-400">
            Failed → Retry → Payment
          </p>
        </div>
      </DiagramPanel>
    </div>

    <!-- Flow arrows between phases -->
    <div class="mt-4 flex items-center justify-center gap-2 text-xs text-zinc-400">
      <span class="font-medium">Flow:</span>
      <span class="rounded bg-primary-100 dark:bg-primary-900/30 px-2 py-0.5 text-primary-600 dark:text-primary-400">Info</span>
      <span>→</span>
      <span class="rounded bg-info-100 dark:bg-info-900/30 px-2 py-0.5 text-info-600 dark:text-info-400">Payment</span>
      <span>→</span>
      <span class="rounded bg-success-100 dark:bg-success-900/30 px-2 py-0.5 text-success-600 dark:text-success-400">Complete</span>
      <span class="text-zinc-300 dark:text-zinc-600">|</span>
      <span class="rounded bg-error-100 dark:bg-error-900/30 px-2 py-0.5 text-error-600 dark:text-error-400">Failed</span>
    </div>

    <DiagramFooter
      :legends="[
        { color: '#3b82f6', label: 'Collection' },
        { color: '#06b6d4', label: 'Payment' },
        { color: '#10b981', label: 'Success' },
        { color: '#ef4444', label: 'Failure' },
      ]"
      document-id="COMMERCE_JS_FLOW_01"
    />
  </DiagramContainer>
</template>
