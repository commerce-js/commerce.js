<script setup lang="ts">
interface Message {
  from: number
  to: number
  label: string
  dashed?: boolean
}

const participants = [
  { label: 'Merchant Server', icon: '🖥', color: '#3b82f6' },
  { label: 'Checkout Page', icon: '📄', color: '#10b981' },
  { label: 'Payment Gateway', icon: '💳', color: '#8b5cf6' },
  { label: 'Customer Browser', icon: '🌐', color: '#f59e0b' },
]

const messages: Message[] = [
  { from: 0, to: 1, label: 'Create Session' },
  { from: 1, to: 0, label: 'Session URL', dashed: true },
  { from: 0, to: 3, label: 'Redirect to Checkout' },
  { from: 3, to: 1, label: 'Enter Payment Details' },
  { from: 1, to: 2, label: 'Submit Payment' },
  { from: 2, to: 3, label: '3D Secure Verification' },
  { from: 3, to: 1, label: 'Return from 3DS' },
  { from: 1, to: 2, label: 'Confirm Payment' },
  { from: 2, to: 1, label: 'Webhook — Captured', dashed: true },
]
</script>

<template>
  <DiagramContainer icon="i-lucide-layout-dashboard" max-width="max-w-5xl">
    <DiagramHeader title="Hosted Checkout" subtitle="Sequence Diagram" />

    <div class="mt-8 overflow-x-auto">
      <div class="min-w-[600px]">
        <!-- Participant headers -->
        <div class="grid grid-cols-4 gap-4">
          <div
            v-for="p in participants"
            :key="p.label"
            class="flex flex-col items-center gap-1"
          >
            <div
              class="flex h-14 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-white shadow-sm"
              :style="{ backgroundColor: p.color }"
            >
              <span>{{ p.icon }}</span>
              <span>{{ p.label }}</span>
            </div>
          </div>
        </div>

        <!-- Lifelines + messages -->
        <div class="relative mt-2">
          <!-- Vertical lifelines -->
          <div class="absolute inset-0 grid grid-cols-4 gap-4">
            <div v-for="p in participants" :key="p.label" class="flex justify-center">
              <div
                class="h-full w-0.5 opacity-20"
                :style="{ backgroundColor: p.color }"
              />
            </div>
          </div>

          <!-- Messages -->
          <div class="relative flex flex-col gap-0">
            <div
              v-for="(msg, i) in messages"
              :key="i"
              class="grid grid-cols-4 gap-4 py-3"
            >
              <!-- Arrow container spanning from→to columns -->
              <div
                class="flex items-center"
                :style="{
                  gridColumn: `${Math.min(msg.from, msg.to) + 1} / ${Math.max(msg.from, msg.to) + 2}`,
                }"
              >
                <div class="relative flex w-full items-center">
                  <!-- Arrow line -->
                  <div
                    class="h-[2px] w-full"
                    :class="msg.dashed ? 'border-t-2 border-dashed border-zinc-400 dark:border-zinc-500' : 'bg-zinc-400 dark:bg-zinc-500'"
                  />
                  <!-- Arrowhead (on the 'to' side) -->
                  <div
                    class="absolute h-0 w-0 border-y-[5px] border-y-transparent"
                    :class="[
                      msg.to > msg.from
                        ? 'right-0 border-l-8 border-l-zinc-400 dark:border-l-zinc-500'
                        : 'left-0 border-r-8 border-r-zinc-400 dark:border-r-zinc-500',
                    ]"
                  />
                  <!-- Label centered on arrow -->
                  <span
                    class="absolute left-1/2 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-white/90 dark:bg-zinc-800/90 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:text-zinc-300 backdrop-blur-sm"
                  >
                    {{ msg.label }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Participant footers (mirror headers) -->
        <div class="mt-2 grid grid-cols-4 gap-4">
          <div
            v-for="p in participants"
            :key="p.label"
            class="flex justify-center"
          >
            <div
              class="h-3 w-3 rounded-full"
              :style="{ backgroundColor: p.color }"
            />
          </div>
        </div>
      </div>
    </div>

    <DiagramFooter
      :legends="participants.map(p => ({ color: p.color, label: p.label }))"
      document-id="COMMERCE_JS_SEQ_01"
    />
  </DiagramContainer>
</template>
