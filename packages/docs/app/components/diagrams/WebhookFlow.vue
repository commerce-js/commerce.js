<script setup lang="ts">
interface Message {
  from: number
  to: number
  label: string
  dashed?: boolean
}

const participants = [
  { label: 'Customer Browser', icon: '🌐', color: '#f59e0b' },
  { label: 'Your Server', icon: '🖥', color: '#3b82f6' },
  { label: 'Dev Tunnel', icon: '🔗', color: '#10b981' },
  { label: 'Payment Gateway', icon: '💳', color: '#8b5cf6' },
]

const messages: Message[] = [
  { from: 0, to: 1, label: 'Submit Payment' },
  { from: 1, to: 3, label: 'Create charge (webhook URL = tunnel)' },
  { from: 3, to: 0, label: '3D Secure Verification' },
  { from: 0, to: 3, label: 'Complete Verification' },
  { from: 3, to: 2, label: 'POST webhook (payload + signature)', dashed: true },
  { from: 2, to: 1, label: 'Forward to localhost', dashed: true },
  { from: 1, to: 1, label: 'Verify Signature → Update Order' },
]
</script>

<template>
  <DiagramContainer icon="i-lucide-webhook" max-width="max-w-5xl">
    <DiagramHeader title="Webhook Flow" subtitle="Development Tunnel" />

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
              <!-- Self-message (from === to) -->
              <template v-if="msg.from === msg.to">
                <div
                  class="flex items-center justify-center"
                  :style="{ gridColumn: `${msg.from + 1} / ${msg.from + 2}` }"
                >
                  <span class="rounded-md border border-dashed border-primary-300 dark:border-primary-600 bg-primary-50/50 dark:bg-primary-900/20 px-3 py-1.5 text-[11px] font-medium text-primary-600 dark:text-primary-400">
                    {{ msg.label }}
                  </span>
                </div>
              </template>

              <!-- Normal arrow spanning from→to -->
              <template v-else>
                <div
                  class="flex items-center"
                  :style="{
                    gridColumn: `${Math.min(msg.from, msg.to) + 1} / ${Math.max(msg.from, msg.to) + 2}`,
                  }"
                >
                  <div class="relative flex w-full items-center">
                    <div
                      class="h-[2px] w-full"
                      :class="msg.dashed ? 'border-t-2 border-dashed border-zinc-400 dark:border-zinc-500' : 'bg-zinc-400 dark:bg-zinc-500'"
                    />
                    <div
                      class="absolute h-0 w-0 border-y-[5px] border-y-transparent"
                      :class="[
                        msg.to > msg.from
                          ? 'right-0 border-l-8 border-l-zinc-400 dark:border-l-zinc-500'
                          : 'left-0 border-r-8 border-r-zinc-400 dark:border-r-zinc-500',
                      ]"
                    />
                    <span
                      class="absolute left-1/2 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-white/90 dark:bg-zinc-800/90 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:text-zinc-300 backdrop-blur-sm"
                    >
                      {{ msg.label }}
                    </span>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>

        <!-- Participant footers -->
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
      document-id="COMMERCE_JS_SEQ_02"
    />
  </DiagramContainer>
</template>
