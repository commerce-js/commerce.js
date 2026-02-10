<script setup lang="ts">
/**
 * Success page — payment completed.
 */

const route = useRoute()
const sessionId = route.params.id as string

// Fetch final session state
const { data: session } = await useFetch(`/api/sessions/${sessionId}`)

const formattedAmount = computed(() => {
  if (!session.value) return ''
  return new Intl.NumberFormat('en-SA', {
    style: 'currency',
    currency: session.value.currency,
    minimumFractionDigits: 2,
  }).format(session.value.amount)
})
</script>

<template>
  <div class="checkout-layout">
    <div class="checkout-container">
      <div class="checkout-card">
        <div class="status-message">
          <div class="status-icon success">✓</div>
          <div class="status-title">Payment successful!</div>
          <div class="status-description">
            <template v-if="session">
              {{ formattedAmount }} has been charged.
              <br>
              <span v-if="session.orderId" style="margin-top: 0.5rem; display: block;">
                Order: {{ session.orderId }}
              </span>
            </template>
            <template v-else>
              Your payment has been processed successfully.
            </template>
          </div>
        </div>

        <div v-if="session?.paymentSession?.id" style="text-align: center; margin-top: 1rem;">
          <p style="font-size: 0.75rem; color: var(--color-text-subtle);">
            Transaction: {{ session.paymentSession.id }}
          </p>
        </div>

        <div class="security-badge">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clip-rule="evenodd" />
          </svg>
          Secured by Tap Payments · PCI DSS Compliant
        </div>

        <div class="powered-by">
          Powered by <a href="#">CommerceJS</a>
        </div>
      </div>
    </div>
  </div>
</template>
