<script setup lang="ts">
/**
 * 3DS redirect return page — confirms payment after Tap redirects back.
 *
 * Tap redirects here with query params like ?tap_id=chg_xxx
 * We POST to our confirm endpoint and show the result.
 */

const route = useRoute()
const sessionId = route.params.id as string
const tapChargeId = route.query.tap_id as string | undefined

const state = ref<'confirming' | 'success' | 'failed'>('confirming')
const error = ref<string | null>(null)

// Auto-confirm on mount
onMounted(async () => {
  try {
    const result = await $fetch<any>(`/api/sessions/${sessionId}/confirm`, {
      method: 'POST',
      body: {
        chargeId: tapChargeId,
      },
    })

    if (result.state === 'complete') {
      state.value = 'success'
      // tapCustomerId is saved server-side in confirm.post.ts
      // Redirect to success page after brief delay
      setTimeout(() => {
        navigateTo(`/${sessionId}/success`)
      }, 1500)
    }
    else if (result.state === 'failed') {
      state.value = 'failed'
      error.value = result.error || 'Payment was not successful'
    }
    else {
      // Still processing
      state.value = 'confirming'
    }
  }
  catch (err: any) {
    state.value = 'failed'
    error.value = err?.data?.message || 'Failed to confirm payment'
  }
})
</script>

<template>
  <div class="checkout-layout">
    <div class="checkout-container">
      <div class="checkout-card">
        <!-- Confirming -->
        <div v-if="state === 'confirming'" class="status-message">
          <div class="status-icon loading">
            <span class="spinner" style="border-color: rgba(37,99,235,0.3); border-top-color: #2563eb;" />
          </div>
          <div class="status-title">Confirming payment...</div>
          <div class="status-description">
            Please wait while we verify your payment.
          </div>
        </div>

        <!-- Success (brief) -->
        <div v-else-if="state === 'success'" class="status-message">
          <div class="status-icon success">✓</div>
          <div class="status-title">Payment confirmed!</div>
          <div class="status-description">
            Redirecting...
          </div>
        </div>

        <!-- Failed -->
        <div v-else class="status-message">
          <div class="status-icon error">✕</div>
          <div class="status-title">Payment failed</div>
          <div class="status-description">
            {{ error || 'Something went wrong with your payment.' }}
          </div>
          <button
            class="btn btn-primary"
            style="margin-top: 1.5rem; max-width: 200px;"
            @click="navigateTo(`/${sessionId}`)"
          >
            Try again
          </button>
        </div>

        <div class="powered-by">
          Powered by <a href="#">CommerceJS</a>
        </div>
      </div>
    </div>
  </div>
</template>
