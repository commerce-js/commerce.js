<script setup lang="ts">
/**
 * Main checkout page — displays payment form for a session.
 *
 * Flow:
 *  1. Fetch session from API
 *  2. Show customer info form + goSell.js card element
 *  3. On submit: tokenize card via goSell.submit() → tok_xxx
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
const cardReady = ref(false)

// Form state
const email = ref('')
const firstName = ref('')
const lastName = ref('')
const phone = ref('')

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
  }
}
loading.value = false

// Check if redirected back with cancelled param
if (route.query.cancelled) {
  error.value = 'Payment was cancelled'
}

// Format amount for display
const formattedAmount = computed(() => {
  if (!session.value) return ''
  return new Intl.NumberFormat('en-BH', {
    style: 'currency',
    currency: session.value.currency,
    minimumFractionDigits: 3,
  }).format(session.value.amount)
})

/**
 * Load goSell.js SDK and initialize card elements.
 *
 * Uses goSellElements mode — embeds card fields (number, expiry, CVV, name)
 * directly into our page for the best UX. The SDK handles PCI-scoped input
 * and tokenization; we never touch raw card data.
 */
function initGoSellElements() {
  if (!import.meta.client) return

  // Per-session public key from the merchant's config
  const publicKey = session.value?.tapPublicKey || config.public.tapPublicKey
  if (!publicKey) {
    console.warn('[checkout] No Tap public key available, card element will not mount')
    return
  }

  // goSell.js mounts its form fields into the containerID element
  const goSell = (window as any).goSell
  if (!goSell) {
    console.error('[checkout] goSell.js not loaded')
    return
  }

  goSell.goSellElements({
    containerID: 'tap-card-element',
    gateway: {
      publicKey,
      language: 'en',
      supportedCurrencies: [session.value?.currency || 'BHD'],
      supportedPaymentMethods: 'all',
      notifications: 'tap-notifications',
      // The callback receives the token after goSell.submit()
      callback: handleTokenCallback,
      // Called when there's an error in the card element
      onError: handleTokenError,
      labels: {
        cardNumber: 'Card Number',
        expirationDate: 'MM/YY',
        cvv: 'CVV',
        cardHolder: 'Name on Card',
        actionButton: 'Pay',
      },
      style: {
        base: {
          color: '#171717',
          lineHeight: '18px',
          fontFamily: 'Inter, sans-serif',
          fontSmoothing: 'antialiased',
          fontSize: '15px',
          '::placeholder': {
            color: '#a3a3a3',
            fontSize: '14px',
          },
        },
        invalid: {
          color: '#dc2626',
          iconColor: '#dc2626',
        },
      },
    },
  })

  cardReady.value = true
}

/**
 * goSell.js callback — receives the tokenized card response.
 * Response shape: { id: 'tok_xxx', object: 'token', card: {...}, ... }
 */
async function handleTokenCallback(response: any) {
  if (!response || !response.id) {
    error.value = 'Failed to tokenize card. Please try again.'
    submitting.value = false
    return
  }

  // We got the token! Now submit to our backend
  await submitPaymentWithToken(response.id)
}

/**
 * goSell.js error handler.
 */
function handleTokenError(err: any) {
  console.error('[checkout] goSell error:', err)
  error.value = err?.error?.message || 'Card input error. Please check your details.'
  submitting.value = false
}

/**
 * Submit the form:
 *  1. Validate email
 *  2. Call goSell.submit() to tokenize → callback fires with tok_xxx
 *  3. Callback calls submitPaymentWithToken()
 *
 * If TAP_PUBLIC_KEY is not set (dev mode), skip tokenization and
 * proceed without a source token (Tap will use src_all).
 */
async function submitPayment() {
  if (!email.value) {
    error.value = 'Email is required'
    return
  }

  submitting.value = true
  error.value = null

  const goSell = (window as any).goSell

  // If goSell is loaded and card element is ready, tokenize first
  if (goSell && cardReady.value) {
    // goSell.submit() triggers tokenization asynchronously.
    // The result comes back via handleTokenCallback / handleTokenError.
    goSell.submit()
    return
  }

  // Dev fallback: no goSell → submit without token
  await submitPaymentWithToken(undefined)
}

/**
 * POST the payment to our backend with the card token.
 */
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

    // If there's a redirect URL, go to Tap for 3DS
    if (result.redirectUrl) {
      await navigateTo(result.redirectUrl, { external: true })
      return
    }

    // If already complete, show success
    if (result.state === 'complete') {
      await navigateTo(`/${sessionId}/success`)
      return
    }

    // Otherwise refresh the session state
    session.value = result
    submitting.value = false
  }
  catch (err: any) {
    error.value = err?.data?.message || 'Payment failed. Please try again.'
    submitting.value = false
  }
}

// Load goSell.js SDK and init after mount
onMounted(() => {
  if (!session.value || session.value.state === 'complete') return

  // Load goSell.js CSS
  const cssLink = document.createElement('link')
  cssLink.rel = 'stylesheet'
  cssLink.href = 'https://goSellJSLib.b-cdn.net/v2.0.4/css/gosell.css'
  document.head.appendChild(cssLink)

  // Load goSell.js script
  const script = document.createElement('script')
  script.src = 'https://goSellJSLib.b-cdn.net/v2.0.4/js/gosell.js'
  script.async = true
  script.onload = () => {
    // Small delay to ensure goSell global is available
    setTimeout(initGoSellElements, 100)
  }
  script.onerror = () => {
    console.warn('[checkout] Failed to load goSell.js — card element unavailable')
  }
  document.head.appendChild(script)
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
          <!-- Email -->
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

          <!-- Name -->
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

          <!-- Phone -->
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

          <!-- goSell.js card element -->
          <div class="form-group">
            <label class="form-label">Card details</label>
            <div id="tap-card-element" class="tap-card-element">
              <!-- goSell.js mounts card fields (number, expiry, CVV, name) here -->
            </div>
            <!-- goSell.js notification area -->
            <p id="tap-notifications" class="tap-notification" />
          </div>

          <!-- Pay button -->
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="submitting"
          >
            <span v-if="submitting" class="spinner" />
            {{ submitting ? 'Processing...' : `Pay ${formattedAmount}` }}
          </button>
        </form>

        <!-- Security badge -->
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
