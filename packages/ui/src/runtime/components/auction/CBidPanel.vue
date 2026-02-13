<script setup lang="ts">
import type { Bid, AuctionProductMeta, PlaceBidInput } from '@commercejs/types'

/**
 * CBidPanel — Bid placement panel for auction products.
 * Shows current bid, bid input, auto-bidding toggle, and bid history.
 */

export interface BidPanelProps {
  /** Auction metadata */
  auction: AuctionProductMeta
  /** Recent bids */
  bids?: Bid[]
  /** Whether a bid is being submitted */
  loading?: boolean
  /** Currency symbol for display */
  currencySymbol?: string
  /** Per-instance theme overrides */
  ui?: Partial<{
    root: any
    currentBid: any
    form: any
    history: any
  }>
}

const props = withDefaults(defineProps<BidPanelProps>(), {
  bids: () => [],
  loading: false,
  currencySymbol: '',
})

const emit = defineEmits<{
  'place-bid': [input: PlaceBidInput]
}>()

const bidAmount = ref<number>(0)
const enableAutoBid = ref(false)
const maxAutoBidAmount = ref<number>(0)

// Set default bid amount to current bid + increment
watchEffect(() => {
  const current = props.auction.currentBid?.amount ?? props.auction.startingPrice.amount
  const increment = props.auction.bidIncrement.amount
  if (typeof current === 'number' && typeof increment === 'number') {
    bidAmount.value = current + increment
  }
})

const minBid = computed(() => {
  const current = props.auction.currentBid?.amount ?? props.auction.startingPrice.amount
  const increment = props.auction.bidIncrement.amount
  return typeof current === 'number' && typeof increment === 'number'
    ? current + increment
    : 0
})

function handleSubmit() {
  emit('place-bid', {
    productId: '', // Set by parent
    amount: bidAmount.value,
    maxAutoBid: enableAutoBid.value ? maxAutoBidAmount.value : undefined,
  })
}

// Resolve theme from app.config
const appConfig = useAppConfig()
const theme = computed(() => (appConfig.ui as any)?.bidPanel ?? {})

const slotClasses = computed(() => {
  const base = theme.value?.slots ?? {}
  const merge = (slot: string) => [base[slot], props.ui?.[slot as keyof typeof props.ui]]
  return {
    root: merge('root'),
    currentBid: merge('currentBid'),
    form: merge('form'),
    history: merge('history'),
  }
})
</script>

<template>
  <div :class="['space-y-6', slotClasses.root]">
    <!-- Current bid display -->
    <div :class="['text-center p-6 rounded-xl bg-elevated ring ring-default', slotClasses.currentBid]">
      <p class="text-sm text-muted mb-1">{{ auction.bidCount > 0 ? 'Current Highest Bid' : 'Starting Price' }}</p>
      <p class="text-4xl font-bold text-highlighted">
        {{ auction.currentBid?.formatted || auction.startingPrice.formatted }}
      </p>
      <p class="text-xs text-muted mt-2">
        {{ auction.bidCount }} bid{{ auction.bidCount !== 1 ? 's' : '' }}
        · Min increment: {{ auction.bidIncrement.formatted }}
      </p>
    </div>

    <!-- Bid form -->
    <form v-if="auction.status === 'active'" :class="['space-y-4', slotClasses.form]" @submit.prevent="handleSubmit">
      <UFormField label="Your Bid">
        <UInput
          v-model.number="bidAmount"
          type="number"
          :min="minBid"
          :step="auction.bidIncrement.amount"
          :placeholder="`Min: ${minBid}`"
          size="lg"
          required
        />
      </UFormField>

      <!-- Auto-bidding toggle -->
      <div v-if="auction.autoBiddingEnabled" class="space-y-2">
        <UCheckbox v-model="enableAutoBid" label="Enable auto-bidding (proxy bid)" />
        <UFormField v-if="enableAutoBid" label="Maximum Auto-Bid">
          <UInput
            v-model.number="maxAutoBidAmount"
            type="number"
            :min="bidAmount"
            placeholder="Your maximum amount"
          />
          <template #hint>
            <span class="text-xs text-muted">We'll bid on your behalf up to this amount</span>
          </template>
        </UFormField>
      </div>

      <UButton type="submit" block size="lg" color="primary" :loading="loading">
        Place Bid — {{ currencySymbol }}{{ bidAmount }}
      </UButton>

      <!-- Buy it now -->
      <UButton
        v-if="auction.buyNowPrice"
        block
        variant="outline"
        color="neutral"
        size="lg"
      >
        Buy It Now — {{ auction.buyNowPrice.formatted }}
      </UButton>
    </form>

    <!-- Bid status messages -->
    <UAlert
      v-else-if="auction.status === 'ended'"
      icon="i-heroicons-clock"
      title="Auction ended"
      color="neutral"
    />
    <UAlert
      v-else-if="auction.status === 'upcoming'"
      icon="i-heroicons-calendar"
      title="Auction hasn't started yet"
      color="info"
    />

    <!-- Recent bid history -->
    <div v-if="bids.length > 0" :class="['space-y-2', slotClasses.history]">
      <h4 class="text-sm font-semibold text-highlighted">Recent Bids</h4>
      <div class="space-y-1 max-h-48 overflow-y-auto">
        <div
          v-for="bid in bids"
          :key="bid.id"
          class="flex items-center justify-between text-sm py-1.5 px-2 rounded-md"
          :class="bid.isWinning ? 'bg-success/10' : 'bg-elevated'"
        >
          <div class="flex items-center gap-2">
            <UIcon v-if="bid.isWinning" name="i-heroicons-trophy-20-solid" class="text-success text-xs" />
            <span class="text-highlighted">{{ bid.bidderName }}</span>
            <UBadge v-if="bid.isAutoBid" size="xs" variant="subtle" color="info">Auto</UBadge>
          </div>
          <span class="font-medium text-highlighted">{{ bid.amount.formatted }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
