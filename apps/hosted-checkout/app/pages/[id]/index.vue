<script setup lang="ts">
/**
 * Main checkout page — displays payment form for a session.
 *
 * Flow:
 *  1. Fetch session from API
 *  2. Show customer info form + Tap Card SDK v2
 *  3. On submit: tokenize card via CardSDK.tokenize() → tok_xxx
 *  4. POST /api/sessions/:id/pay with { sourceToken: tok_xxx }
 *  5. If redirectUrl → redirect to Tap 3DS
 *  6. If complete → show success
 */

const route = useRoute()
const config = useRuntimeConfig()
const sessionId = route.params.id as string

// Session state
const session = ref<Record<string, any> | null>(null)
const loading = ref(true)
const submitting = ref(false)
const error = ref<string | null>(null)

// Form state
const email = ref('')
const firstName = ref('')
const lastName = ref('')
const phone = ref('')

/** Translate internal error strings into user-friendly messages */
function toUserFriendlyError(raw: string | null | undefined): string {
  if (!raw) return 'Your payment was declined. Please try again with a different card.'
  const lower = raw.toLowerCase()
  if (lower.includes('failed') || lower.includes('declined') || lower.includes('restricted'))
    return 'Your payment was declined. Please try again or use a different payment method.'
  if (lower.includes('cancelled') || lower.includes('abandoned'))
    return 'Payment was cancelled. Please try again when you\'re ready.'
  if (lower.includes('timed') || lower.includes('timeout'))
    return 'Payment timed out. Please try again.'
  return raw
}

// Fetch session on load
const { data: sessionData, error: fetchError } = await useFetch(`/api/sessions/${sessionId}`)

if (fetchError.value) {
  error.value = 'Checkout session not found or expired'
}
else if (sessionData.value) {
  session.value = sessionData.value
  if (sessionData.value.customerInfo) {
    email.value = sessionData.value.customerInfo.email || ''
    firstName.value = sessionData.value.customerInfo.firstName || ''
    lastName.value = sessionData.value.customerInfo.lastName || ''
    phone.value = sessionData.value.customerInfo.phone || ''
  }
  if (sessionData.value.state === 'failed') {
    error.value = toUserFriendlyError(sessionData.value.error)
  }
}
loading.value = false

if (route.query.cancelled) {
  error.value = 'Payment was cancelled'
}

const formattedAmount = computed(() => {
  if (!session.value) return ''
  return new Intl.NumberFormat('en-BH', {
    style: 'currency',
    currency: session.value.currency,
    minimumFractionDigits: 3,
  }).format(session.value.amount)
})

// ---------------------------------------------------------------------------
// Tap Card SDK v2
// ---------------------------------------------------------------------------
const tapCard = useTapCard()

function initCardElement() {
  if (!import.meta.client) return
  const publicKey = session.value?.tapPublicKey || config.public.tapPublicKey
  if (!publicKey || !session.value) return

  tapCard.render({
    containerId: 'tap-card-element',
    publicKey,
    amount: session.value.amount,
    currency: session.value.currency || 'BHD',
    email: email.value || undefined,
    firstName: firstName.value || undefined,
    lastName: lastName.value || undefined,
    phone: phone.value || undefined,
    saveCard: true,
  })
}

async function submitPayment() {
  if (!email.value) {
    error.value = 'Email is required'
    return
  }

  submitting.value = true
  error.value = null

  if (!tapCard.ready.value) {
    await submitPaymentWithToken(undefined)
    return
  }

  try {
    const token = await tapCard.tokenize()
    await submitPaymentWithToken(token.id)
  }
  catch (err: any) {
    error.value = err?.message || 'Failed to tokenize card. Please try again.'
    submitting.value = false
  }
}

async function submitPaymentWithToken(sourceToken: string | undefined) {
  try {
    const result = await $fetch(`/api/sessions/${sessionId}/pay`, {
      method: 'POST',
      body: {
        email: email.value,
        firstName: firstName.value,
        lastName: lastName.value,
        phone: phone.value,
        sourceToken,
        shippingAddress: {
          firstName: firstName.value,
          lastName: lastName.value,
          phone: phone.value,
          street: 'Hosted Checkout',
          street2: null,
          city: 'Manama',
          state: null,
          country: 'BH',
          postalCode: null,
          district: null,
          nationalAddress: null,
          additionalNumber: null,
        },
      },
    })

    if (result.redirectUrl) {
      await navigateTo(result.redirectUrl, { external: true })
      return
    }

    if (result.state === 'complete') {
      await navigateTo(`/${sessionId}/success`)
      return
    }

    if (result.state === 'failed') {
      error.value = toUserFriendlyError(result.error)
      session.value = result
      submitting.value = false
      return
    }

    session.value = result
    submitting.value = false
  }
  catch (err: any) {
    error.value = toUserFriendlyError(err?.data?.message)
    submitting.value = false
  }
}

async function retryPayment() {
  error.value = null
  tapCard.unmount()
  session.value!.state = 'idle'
  await nextTick()

  try {
    await tapCard.loadSDK()
    setTimeout(initCardElement, 150)
  }
  catch {
    error.value = 'Could not load payment form. Please reload the page.'
  }
}

onMounted(async () => {
  if (!session.value || session.value.state === 'complete' || session.value.state === 'failed') return

  try {
    await tapCard.loadSDK()
    setTimeout(initCardElement, 100)
  }
  catch {
    console.warn('[checkout] Failed to load Tap Card SDK v2')
  }
})
</script>

<template>
  <div class="checkout-layout">
    <div class="checkout-container">
      <!-- Loading state -->
      <div v-if="loading" class="checkout-card">
        <div class="status-message">
          <div class="status-icon loading">
            <span class="spinner" style="border-color: rgba(37,99,235,0.3); border-top-color: #2563eb;" />
          </div>
          <div class="status-title">Loading checkout...</div>
        </div>
      </div>

      <!-- Session not found -->
      <div v-else-if="!session" class="checkout-card">
        <div class="status-message">
          <div class="status-icon error">✕</div>
          <div class="status-title">Session not found</div>
          <div class="status-description">
            This checkout link has expired or is invalid.
          </div>
        </div>
      </div>

      <!-- Already complete -->
      <div v-else-if="session.state === 'complete'" class="checkout-card">
        <div class="status-message">
          <div class="status-icon success">✓</div>
          <div class="status-title">Payment complete</div>
          <div class="status-description">
            This checkout has already been completed.
          </div>
        </div>
      </div>

      <!-- Payment failed -->
      <div v-else-if="session.state === 'failed'" class="checkout-card">
        <div class="status-message">
          <div class="status-icon error">✕</div>
          <div class="status-title">Payment failed</div>
          <div class="status-description">
            {{ error || 'Your payment could not be processed. Please try again or use a different payment method.' }}
          </div>
          <button
            class="btn btn-primary"
            style="margin-top: 1.5rem; max-width: 200px;"
            @click="retryPayment"
          >
            Try again
          </button>
        </div>
        <div class="powered-by">
          Powered by <a href="#">CommerceJS</a>
        </div>
      </div>

      <!-- Checkout form -->
      <div v-else class="checkout-card">
        <div class="checkout-header">
          <div class="checkout-logo">Checkout</div>
          <div class="checkout-amount">
            {{ formattedAmount }}
          </div>
          <div v-if="session.orderId" class="checkout-order-id">
            Order {{ session.orderId }}
          </div>
        </div>

        <hr class="checkout-divider">

        <div v-if="error" class="error-alert">
          {{ error }}
        </div>

        <form @submit.prevent="submitPayment">
          <div class="form-group">
            <label class="form-label" for="email">Email</label>
            <input
              id="email"
              v-model="email"
              class="form-input"
              type="email"
              placeholder="ali@example.com"
              required
              autocomplete="email"
            >
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="firstName">First name</label>
              <input
                id="firstName"
                v-model="firstName"
                class="form-input"
                type="text"
                placeholder="Ali"
                autocomplete="given-name"
              >
            </div>
            <div class="form-group">
              <label class="form-label" for="lastName">Last name</label>
              <input
                id="lastName"
                v-model="lastName"
                class="form-input"
                type="text"
                placeholder="Ahmed"
                autocomplete="family-name"
              >
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="phone">Phone</label>
            <input
              id="phone"
              v-model="phone"
              class="form-input"
              type="tel"
              placeholder="+966 50 000 0000"
              autocomplete="tel"
            >
          </div>

          <hr class="checkout-divider">

          <!-- Card element (Tap Card SDK v2) -->
          <div class="form-group">
            <label class="form-label">Card details</label>
            <div id="tap-card-element" class="tap-card-element" />
            <p id="tap-notifications" class="tap-notification" />
          </div>

          <button
            type="submit"
            class="btn btn-primary"
            :disabled="submitting"
          >
            <span v-if="submitting" class="spinner" />
            {{ submitting ? 'Processing...' : `Pay ${formattedAmount}` }}
          </button>
        </form>

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
