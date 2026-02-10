<script setup lang="ts">
/**
 * Landing page — creates a demo checkout session and redirects to it.
 * In production, merchants would create sessions via API and redirect customers
 * directly to /:sessionId
 */
const loading = ref(false)
const error = ref<string | null>(null)

async function createDemoSession() {
  loading.value = true
  error.value = null
  try {
    const session = await $fetch('/api/sessions', {
      method: 'POST',
      body: {
        amount: 99.999,
        currency: 'BHD',
        orderId: 'demo-order-001',
      },
    })
    await navigateTo(`/${session.sessionId}`)
  }
  catch (err: any) {
    error.value = err?.data?.message || 'Failed to create session'
    loading.value = false
  }
}
</script>

<template>
  <div class="checkout-layout">
    <div class="checkout-container">
      <div class="checkout-card">
        <div class="checkout-header">
          <div class="checkout-logo">CommerceJS</div>
          <h1 style="font-size: 1.5rem; font-weight: 600; margin-bottom: 0.5rem;">
            Hosted Checkout
          </h1>
          <p style="color: var(--color-text-muted); font-size: 0.875rem;">
            Secure, PCI-free payment processing
          </p>
        </div>

        <hr class="checkout-divider">

        <div v-if="error" class="error-alert">
          {{ error }}
        </div>

        <p style="color: var(--color-text-muted); font-size: 0.8125rem; margin-bottom: 1rem;">
          This is a demo page. In production, merchants create checkout sessions
          via the API and redirect customers directly to the checkout page.
        </p>

        <button
          class="btn btn-primary"
          :disabled="loading"
          @click="createDemoSession"
        >
          <span v-if="loading" class="spinner" />
          {{ loading ? 'Creating...' : 'Create Demo Checkout' }}
        </button>

        <div class="powered-by">
          Powered by <a href="#">CommerceJS</a>
        </div>
      </div>
    </div>
  </div>
</template>
