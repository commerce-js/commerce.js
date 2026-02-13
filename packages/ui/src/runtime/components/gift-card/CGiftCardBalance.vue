<script setup lang="ts">
import type { GiftCard, RedeemGiftCardInput } from '@commercejs/types'

/**
 * CGiftCardBalance — Displays gift card balance and redeem form.
 * Used at checkout to apply gift card codes.
 */

export interface GiftCardBalanceProps {
  /** Applied gift card (after lookup) */
  giftCard?: GiftCard | null
  /** Whether a lookup or redeem is in progress */
  loading?: boolean
  /** Per-instance theme overrides */
  ui?: Partial<{
    root: any
    card: any
    form: any
  }>
}

const props = withDefaults(defineProps<GiftCardBalanceProps>(), {
  giftCard: null,
  loading: false,
})

const emit = defineEmits<{
  'lookup': [code: string]
  'redeem': [input: RedeemGiftCardInput]
}>()

const code = ref('')

function handleLookup() {
  if (code.value.trim()) {
    emit('lookup', code.value.trim())
  }
}

function handleRedeem() {
  emit('redeem', { code: code.value.trim() })
}

const statusColor = computed(() => {
  if (!props.giftCard) return 'neutral'
  const map: Record<string, string> = {
    active: 'success',
    inactive: 'warning',
    redeemed: 'neutral',
    expired: 'error',
    cancelled: 'error',
  }
  return map[props.giftCard.status] || 'neutral'
})

// Resolve theme from app.config
const appConfig = useAppConfig()
const theme = computed(() => (appConfig.ui as any)?.giftCardBalance ?? {})

const slotClasses = computed(() => {
  const base = theme.value?.slots ?? {}
  const merge = (slot: string) => [base[slot], props.ui?.[slot as keyof typeof props.ui]]
  return {
    root: merge('root'),
    card: merge('card'),
    form: merge('form'),
  }
})
</script>

<template>
  <div :class="['space-y-4', slotClasses.root]">
    <!-- Code input -->
    <div :class="['flex gap-2', slotClasses.form]">
      <UInput
        v-model="code"
        placeholder="Enter gift card code"
        class="flex-1"
        :disabled="loading"
        @keyup.enter="handleLookup"
      />
      <UButton @click="handleLookup" :loading="loading" color="neutral" variant="outline">
        Check Balance
      </UButton>
    </div>

    <!-- Card details -->
    <div v-if="giftCard" :class="['rounded-xl bg-elevated ring ring-default p-5 space-y-3', slotClasses.card]">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-gift" class="text-primary text-lg" />
          <span class="font-mono text-sm text-muted">{{ giftCard.code }}</span>
        </div>
        <UBadge :color="statusColor as any" size="sm">{{ giftCard.status }}</UBadge>
      </div>

      <div class="flex items-baseline gap-2">
        <span class="text-3xl font-bold text-highlighted">{{ giftCard.currentBalance.formatted }}</span>
        <span v-if="giftCard.currentBalance.amount !== giftCard.initialBalance.amount" class="text-sm text-muted">
          of {{ giftCard.initialBalance.formatted }}
        </span>
      </div>

      <div v-if="giftCard.expiresAt" class="text-xs text-muted">
        Expires: {{ new Date(giftCard.expiresAt).toLocaleDateString() }}
      </div>

      <UButton
        v-if="giftCard.status === 'active'"
        block
        color="primary"
        :loading="loading"
        @click="handleRedeem"
      >
        Apply to Order
      </UButton>
    </div>
  </div>
</template>
