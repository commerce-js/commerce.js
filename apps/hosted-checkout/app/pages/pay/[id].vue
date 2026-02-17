<script setup lang="ts">
/**
 * Payment Link checkout page — simplified payment-only flow.
 *
 * Accessed via: /pay/:id
 * Created by: POST /api/payment-links
 *
 * Flow:
 *  1. Fetch session from API
 *  2. Show amount + card form (no address/shipping)
 *  3. Show expiry countdown if session has TTL
 *  4. On submit: tokenize → pay → redirect or success
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

// Form state — minimal for payment links
const email = ref('')
const firstName = ref('')
const phone = ref('')

// Expiry countdown
const timeRemaining = ref<string | null>(null)
const isExpired = ref(false)

let countdownInterval: ReturnType<typeof setInterval> | null = null

function updateCountdown() {
  if (!session.value?.expiresAt) return
  const remaining = new Date(session.value.expiresAt).getTime() - Date.now()
  if (remaining <= 0) {
    isExpired.value = true
    timeRemaining.value = 'Expired'
    if (countdownInterval) clearInterval(countdownInterval)
    return
  }
  const minutes = Math.floor(remaining / 60000)
  const seconds = Math.floor((remaining % 60000) / 1000)
  timeRemaining.value = `${minutes}:${seconds.toString().padStart(2, '0')}`
}

/** Translate internal error strings into user-friendly messages */
function toUserFriendlyError(raw: string | null | undefined): string {
  if (!raw) return 'Your payment was declined. Please try again with a different card.'
  const lower = raw.toLowerCase()
  if (lower.includes('expired')) return 'This payment link has expired.'
  if (lower.includes('failed') || lower.includes('declined'))
    return 'Your payment was declined. Please try again or use a different payment method.'
  if (lower.includes('cancelled'))
    return 'Payment was cancelled. Please try again when you\'re ready.'
  return raw
}

// Fetch session on load
const { data: sessionData, error: fetchError } = await useFetch(`/api/sessions/${sessionId}`)

if (fetchError.value) {
  error.value = 'Payment link not found or expired'
}
else if (sessionData.value) {
  session.value = sessionData.value
  if (sessionData.value.customerInfo) {
    email.value = sessionData.value.customerInfo.email || ''
    firstName.value = sessionData.value.customerInfo.firstName || ''
    phone.value = sessionData.value.customerInfo.phone || ''
  }
  if (sessionData.value.state === 'failed') {
    error.value = toUserFriendlyError(sessionData.value.error)
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
    minimumFractionDigits: 2,
  }).format(session.value.amount)
})

// goSell.js card element init
function initGoSellElements() {
  if (!import.meta.client) return
  const publicKey = session.value?.tapPublicKey || config.public.tapPublicKey
  if (!publicKey) return

  const goSell = (window as any).goSell
  if (!goSell) return

  goSell.goSellElements({
    containerID: 'tap-card-element',
    gateway: {
      publicKey,
      language: 'en',
      supportedCurrencies: [session.value?.currency || 'SAR'],
      supportedPaymentMethods: 'all',
      notifications: 'tap-notifications',
      callback: handleTokenCallback,
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
          '::placeholder': { color: '#a3a3a3', fontSize: '14px' },
        },
        invalid: { color: '#dc2626', iconColor: '#dc2626' },
      },
    },
  })
  cardReady.value = true
}

async function handleTokenCallback(response: any) {
  if (!response?.id) {
    error.value = 'Failed to tokenize card. Please try again.'
    submitting.value = false
    return
  }
  await submitPaymentWithToken(response.id)
}

function handleTokenError(err: any) {
  error.value = err?.error?.message || 'Card input error. Please check your details.'
  submitting.value = false
}

async function submitPayment() {
  if (isExpired.value) {
    error.value = 'This payment link has expired.'
    return
  }
  if (!email.value) {
    error.value = 'Email is required'
    return
  }

  submitting.value = true
  error.value = null

  const goSell = (window as any).goSell
  if (goSell && cardReady.value) {
    goSell.submit()
    setTimeout(() => {
      if (submitting.value) {
        error.value = 'Payment timed out. Please check your card details and try again.'
        submitting.value = false
      }
    }, 30000)
    return
  }

  await submitPaymentWithToken(undefined)
}

async function submitPaymentWithToken(sourceToken: string | undefined) {
  try {
    const result = await $fetch(`/api/sessions/${sessionId}/pay`, {
      method: 'POST',
      body: {
        email: email.value,
        firstName: firstName.value,
        phone: phone.value,
        sourceToken,
      },
    })

    if (result.redirectUrl) {
      await navigateTo(result.redirectUrl, { external: true })
      return
    }

    if (result.state === 'complete') {
      await navigateTo(`/pay/${sessionId}/success`)
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

function loadGoSellSDK(): Promise<void> {
  if ((window as any).goSell) return Promise.resolve()

  return new Promise((resolve, reject) => {
    if (!document.querySelector('link[href*="gosell.css"]')) {
      const cssLink = document.createElement('link')
      cssLink.rel = 'stylesheet'
      cssLink.href = 'https://goSellJSLib.b-cdn.net/v2.0.4/css/gosell.css'
      document.head.appendChild(cssLink)
    }

    const existing = document.querySelector('script[src*="gosell.js"]')
    if (existing) {
      existing.addEventListener('load', () => resolve())
      if ((window as any).goSell) resolve()
      return
    }

    const script = document.createElement('script')
    script.src = 'https://goSellJSLib.b-cdn.net/v2.0.4/js/gosell.js'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load goSell.js'))
    document.head.appendChild(script)
  })
}

async function retryPayment() {
  error.value = null
  cardReady.value = false
  session.value!.state = 'idle'
  await nextTick()

  try {
    await loadGoSellSDK()
    setTimeout(initGoSellElements, 150)
  }
  catch {
    error.value = 'Could not load payment form. Please reload the page.'
  }
}

onMounted(async () => {
  // Start expiry countdown
  if (session.value?.expiresAt) {
    updateCountdown()
    countdownInterval = setInterval(updateCountdown, 1000)
  }

  if (!session.value || session.value.state === 'complete' || session.value.state === 'failed') return

  try {
    await loadGoSellSDK()
    setTimeout(initGoSellElements, 100)
  }
  catch {
    console.warn('[pay] Failed to load goSell.js')
  }
})

onUnmounted(() => {
  if (countdownInterval) clearInterval(countdownInterval)
})
</script>

<template>
  <div class="checkout-layout">
    <div class="checkout-container">
      <!-- Loading -->
      <div v-if="loading" class="checkout-card">
        <div class="status-message">
          <div class="status-icon loading">
            <span class="spinner" style="border-color: rgba(37,99,235,0.3); border-top-color: #2563eb;" />
          </div>
          <div class="status-title">Loading payment...</div>
        </div>
      </div>

      <!-- Not found / expired link -->
      <div v-else-if="!session || isExpired" class="checkout-card">
        <div class="status-message">
          <div class="status-icon error">✕</div>
          <div class="status-title">{{ isExpired ? 'Payment link expired' : 'Link not found' }}</div>
          <div class="status-description">
            {{ isExpired ? 'This payment link has expired. Please request a new one.' : 'This payment link is invalid or has expired.' }}
          </div>
        </div>
      </div>

      <!-- Already complete -->
      <div v-else-if="session.state === 'complete'" class="checkout-card">
        <div class="status-message">
          <div class="status-icon success">✓</div>
          <div class="status-title">Payment complete</div>
          <div class="status-description">
            Thank you! Your payment of {{ formattedAmount }} has been received.
          </div>
        </div>
      </div>

      <!-- Payment failed -->
      <div v-else-if="session.state === 'failed'" class="checkout-card">
        <div class="status-message">
          <div class="status-icon error">✕</div>
          <div class="status-title">Payment failed</div>
          <div class="status-description">
            {{ error || 'Your payment could not be processed. Please try again.' }}
          </div>
          <button class="btn btn-primary" style="margin-top: 1.5rem; max-width: 200px;" @click="retryPayment">
            Try again
          </button>
        </div>
        <div class="powered-by">
          Powered by <a href="#">CommerceJS</a>
        </div>
      </div>

      <!-- Payment form (simplified — no address/shipping) -->
      <div v-else class="checkout-card">
        <div class="checkout-header">
          <div class="checkout-logo">Payment</div>
          <div class="checkout-amount">
            {{ formattedAmount }}
          </div>
          <div v-if="session.orderId" class="checkout-order-id">
            Order {{ session.orderId }}
          </div>
          <div v-if="timeRemaining" class="checkout-expiry" :class="{ 'expiry-warning': timeRemaining && parseInt(timeRemaining) < 5 }">
            ⏳ Expires in {{ timeRemaining }}
          </div>
        </div>

        <hr class="checkout-divider">

        <div v-if="error" class="error-alert">
          {{ error }}
        </div>

        <form @submit.prevent="submitPayment">
          <!-- Email -->
          <div class="form-group">
            <label class="form-label" for="pay-email">Email</label>
            <input
              id="pay-email"
              v-model="email"
              class="form-input"
              type="email"
              placeholder="ali@example.com"
              required
              autocomplete="email"
            >
          </div>

          <!-- Name + Phone (single row) -->
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="pay-name">Name</label>
              <input
                id="pay-name"
                v-model="firstName"
                class="form-input"
                type="text"
                placeholder="Ali"
                autocomplete="given-name"
              >
            </div>
            <div class="form-group">
              <label class="form-label" for="pay-phone">Phone</label>
              <input
                id="pay-phone"
                v-model="phone"
                class="form-input"
                type="tel"
                placeholder="+966 50 000 0000"
                autocomplete="tel"
              >
            </div>
          </div>

          <hr class="checkout-divider">

          <!-- Card element -->
          <div class="form-group">
            <label class="form-label">Card details</label>
            <div id="tap-card-element" class="tap-card-element" />
            <p id="tap-notifications" class="tap-notification" />
          </div>

          <!-- Pay button -->
          <button type="submit" class="btn btn-primary" :disabled="submitting || isExpired">
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

<style scoped>
.checkout-expiry {
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: #737373;
}
.expiry-warning {
  color: #dc2626;
  font-weight: 600;
}
</style>
