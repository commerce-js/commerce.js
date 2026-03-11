<script setup lang="ts">
import { computed,ref,onMounted,onUnmounted } from 'vue'
import { useAppConfig } from '#imports'
import type { Product, AuctionProductMeta } from '@commercejs/types'

/**
 * CAuctionCard — Product card for auction items.
 * Shows current bid, bid count, time remaining, and auction status.
 */

export interface AuctionCardProps {
  product: Product
  /** Override auction meta (optional, reads from product.auction by default) */
  auction?: AuctionProductMeta
  /** Show buy-now button */
  showBuyNow?: boolean
  /** Per-instance theme overrides */
  ui?: Partial<{
    root: any
    imageWrapper: any
    image: any
    statusBadge: any
    body: any
    title: any
    bidInfo: any
    currentBid: any
    bidCount: any
    timer: any
    actions: any
  }>
}

const props = withDefaults(defineProps<AuctionCardProps>(), {
  showBuyNow: true,
})

const emit = defineEmits<{
  'bid': [product: Product]
  'buy-now': [product: Product]
}>()

const auctionMeta = computed(() => props.auction || props.product.auction)

function t(value: any): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  return value.en || value.ar || Object.values(value)[0] || ''
}

const productName = computed(() => t(props.product.name))
const mainImage = computed(() => props.product.primaryImage || props.product.gallery?.[0])

// Time remaining
const timeRemaining = ref('')
let timer: ReturnType<typeof setInterval>

function updateTimer() {
  if (!auctionMeta.value) return
  const end = new Date(auctionMeta.value.endsAt).getTime()
  const now = Date.now()
  const diff = end - now

  if (diff <= 0) {
    timeRemaining.value = 'Ended'
    clearInterval(timer)
    return
  }

  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  const mins = Math.floor((diff % 3600000) / 60000)
  const secs = Math.floor((diff % 60000) / 1000)

  if (days > 0) {
    timeRemaining.value = `${days}d ${hours}h`
  } else if (hours > 0) {
    timeRemaining.value = `${hours}h ${mins}m`
  } else {
    timeRemaining.value = `${mins}m ${secs}s`
  }
}

onMounted(() => {
  updateTimer()
  timer = setInterval(updateTimer, 1000)
})

onUnmounted(() => clearInterval(timer))

const statusColor = computed(() => {
  const map: Record<string, string> = {
    upcoming: 'info',
    active: 'success',
    ended: 'neutral',
    sold: 'primary',
    cancelled: 'error',
    reserve_not_met: 'warning',
  }
  return map[auctionMeta.value?.status || ''] || 'neutral'
})

const statusLabel = computed(() => {
  const map: Record<string, string> = {
    upcoming: 'Upcoming',
    active: 'Live',
    ended: 'Ended',
    sold: 'Sold',
    cancelled: 'Cancelled',
    reserve_not_met: 'Reserve Not Met',
  }
  return map[auctionMeta.value?.status || ''] || auctionMeta.value?.status
})

// Resolve theme from app.config
const appConfig = useAppConfig()
const theme = computed(() => (appConfig.ui as any)?.auctionCard ?? {})

const slotClasses = computed(() => {
  const base = theme.value?.slots ?? {}
  const merge = (slot: string) => [base[slot], props.ui?.[slot as keyof typeof props.ui]]
  return {
    root: merge('root'),
    imageWrapper: merge('imageWrapper'),
    image: merge('image'),
    statusBadge: merge('statusBadge'),
    body: merge('body'),
    title: merge('title'),
    bidInfo: merge('bidInfo'),
    currentBid: merge('currentBid'),
    bidCount: merge('bidCount'),
    timer: merge('timer'),
    actions: merge('actions'),
  }
})
</script>

<template>
  <div :class="['group relative rounded-lg overflow-hidden ring ring-default bg-default hover:shadow-lg transition-all duration-200', slotClasses.root]">
    <!-- Image -->
    <div :class="['relative aspect-square overflow-hidden bg-elevated', slotClasses.imageWrapper]">
      <img
        v-if="mainImage"
        :src="mainImage.url"
        :alt="mainImage.alt || productName"
        :class="['size-full object-cover transition-transform duration-300 group-hover:scale-105', slotClasses.image]"
      />

      <!-- Status badge -->
      <slot name="status" :status="auctionMeta?.status" :label="statusLabel">
        <UBadge
          v-if="auctionMeta"
          :color="statusColor as any"
          size="sm"
          :class="['absolute top-3 start-3', slotClasses.statusBadge]"
        >
          <UIcon v-if="auctionMeta.status === 'active'" name="i-heroicons-signal" class="me-0.5 animate-pulse" />
          {{ statusLabel }}
        </UBadge>
      </slot>

      <!-- Timer -->
      <slot name="timer" :remaining="timeRemaining">
        <div v-if="auctionMeta?.status === 'active'" :class="['absolute bottom-3 end-3 bg-black/70 backdrop-blur-sm text-white text-xs font-mono px-2 py-1 rounded', slotClasses.timer]">
          <UIcon name="i-heroicons-clock" class="me-1" />
          {{ timeRemaining }}
        </div>
      </slot>
    </div>

    <!-- Body -->
    <div :class="['p-4 space-y-2', slotClasses.body]">
      <slot name="title" :name="productName">
        <h3 :class="['font-medium text-sm text-highlighted line-clamp-2', slotClasses.title]">{{ productName }}</h3>
      </slot>

      <!-- Bid info -->
      <slot name="bid-info" :auction="auctionMeta">
        <div v-if="auctionMeta" :class="['space-y-1', slotClasses.bidInfo]">
          <div class="flex items-baseline justify-between">
            <span class="text-xs text-muted">{{ auctionMeta.bidCount > 0 ? 'Current Bid' : 'Starting Price' }}</span>
            <span :class="['font-bold text-lg text-highlighted', slotClasses.currentBid]">
              {{ auctionMeta.currentBid?.formatted || auctionMeta.startingPrice.formatted }}
            </span>
          </div>
          <span :class="['text-xs text-muted', slotClasses.bidCount]">
            {{ auctionMeta.bidCount }} bid{{ auctionMeta.bidCount !== 1 ? 's' : '' }}
          </span>
        </div>
      </slot>

      <!-- Actions -->
      <slot name="actions" :auction="auctionMeta">
        <div v-if="auctionMeta?.status === 'active'" :class="['flex gap-2 pt-1', slotClasses.actions]">
          <UButton
            size="sm"
            color="primary"
            class="flex-1"
            @click="emit('bid', product)"
          >
            Place Bid
          </UButton>
          <UButton
            v-if="showBuyNow && auctionMeta.buyNowPrice"
            size="sm"
            variant="outline"
            color="neutral"
            @click="emit('buy-now', product)"
          >
            Buy Now {{ auctionMeta.buyNowPrice.formatted }}
          </UButton>
        </div>
      </slot>
    </div>
  </div>
</template>
