<script setup lang="ts">
/**
 * Cart payment page — pay for an existing storefront cart via Tap.
 *
 * URL: /pay/cart?id=<cartId>&return=<storefrontReturnUrl>
 *
 * Flow:
 *  1. Load cart from shared DB
 *  2. Show cart summary + card form (goSell.js)
 *  3. Submit: tokenize → charge → 3DS redirect or direct capture
 *  4. On success: redirect to storefront order confirmation
 */

const route = useRoute()
const config = useRuntimeConfig()

const cartId = route.query.id as string
const returnUrl = route.query.return as string || ''
const successOrderId = route.query.orderId as string
const errorParam = route.query.error as string
const successParam = route.query.success as string

// State
const cart = ref<Record<string, any> | null>(null)
const loading = ref(true)
const submitting = ref(false)
const error = ref<string | null>(errorParam || null)
const cardReady = ref(false)
const orderComplete = ref(!!successParam)
const completedOrderId = ref(successOrderId || '')

// Form state
const email = ref('')
const firstName = ref('')
const phone = ref('')

// Load cart
if (cartId && !orderComplete.value) {
  const { data: cartData, error: fetchError } = await useFetch('/api/cart', {
    query: { id: cartId },
  })

  if (fetchError.value) {
    error.value = 'Cart not found or expired'
  }
  else if (cartData.value) {
    cart.value = cartData.value as any
  }
}
loading.value = false

// Format price for display
function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

const formattedTotal = computed(() => {
  if (!cart.value) return ''
  return formatPrice(cart.value.totals.total.amount, cart.value.totals.total.currency)
})

// goSell.js card element
function initGoSellElements() {
  if (!import.meta.client) return
  const publicKey = config.public.tapPublicKey
  if (!publicKey) return

  const goSell = (window as any).goSell
  if (!goSell) return

  goSell.goSellElements({
    containerID: 'tap-card-element',
    gateway: {
      publicKey,
      language: 'en',
      supportedCurrencies: [cart.value?.totals?.total?.currency || 'BHD'],
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
        error.value = 'Payment timed out. Please try again.'
        submitting.value = false
      }
    }, 30000)
    return
  }

  await submitPaymentWithToken(undefined)
}

async function submitPaymentWithToken(sourceToken: string | undefined) {
  try {
    const result = await $fetch<any>('/api/cart-pay', {
      method: 'POST',
      body: {
        cartId,
        email: email.value,
        firstName: firstName.value,
        phone: phone.value,
        sourceToken,
        returnUrl: returnUrl ? `${returnUrl}/order-confirmation` : '',
      },
    })

    if (result.redirectUrl) {
      await navigateTo(result.redirectUrl, { external: true })
      return
    }

    if (result.state === 'complete') {
      if (returnUrl) {
        await navigateTo(`${returnUrl}/order-confirmation?id=${result.orderId}`, { external: true })
      }
      else {
        orderComplete.value = true
        completedOrderId.value = result.orderId
      }
      return
    }

    error.value = 'Payment was not captured. Please try again.'
    submitting.value = false
  }
  catch (err: any) {
    error.value = err?.data?.message || 'Payment failed. Please try again.'
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

onMounted(async () => {
  if (!cart.value || orderComplete.value) return

  try {
    await loadGoSellSDK()
    setTimeout(initGoSellElements, 100)
  }
  catch {
    console.warn('[pay/cart] Failed to load goSell.js')
  }
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
          <div class="status-title">Loading cart...</div>
        </div>
      </div>

      <!-- Order Complete -->
      <div v-else-if="orderComplete" class="checkout-card">
        <div class="status-message">
          <div class="status-icon success">✓</div>
          <div class="status-title">Payment successful!</div>
          <div class="status-description">
            Your order has been placed. Thank you for your purchase.
          </div>
          <a v-if="returnUrl" :href="`${returnUrl}/order-confirmation?id=${completedOrderId}`" class="btn btn-primary" style="margin-top: 1.5rem; max-width: 220px; text-decoration: none;">
            View order
          </a>
        </div>
      </div>

      <!-- Cart not found -->
      <div v-else-if="!cart" class="checkout-card">
        <div class="status-message">
          <div class="status-icon error">✕</div>
          <div class="status-title">Cart not found</div>
          <div class="status-description">
            This cart may have expired or already been checked out.
          </div>
        </div>
      </div>

      <!-- Payment form -->
      <div v-else class="checkout-card">
        <div class="checkout-header">
          <div class="checkout-logo">Checkout</div>
          <div class="checkout-amount">{{ formattedTotal }}</div>
        </div>

        <!-- Cart items summary -->
        <div class="cart-summary">
          <div v-for="item in cart.items" :key="item.id" class="cart-item">
            <div class="cart-item-image">
              <img v-if="item.image" :src="item.image.url" :alt="item.image.alt || ''" />
              <div v-else class="cart-item-placeholder">📦</div>
            </div>
            <div class="cart-item-details">
              <div class="cart-item-name">{{ typeof item.name === 'object' ? item.name.en : item.name }}</div>
              <div class="cart-item-qty">Qty: {{ item.quantity }}</div>
            </div>
            <div class="cart-item-price">
              {{ formatPrice(item.totalPrice.amount, item.totalPrice.currency) }}
            </div>
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

          <!-- Name + Phone -->
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
                placeholder="+973 3000 0000"
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
          <button type="submit" class="btn btn-primary" :disabled="submitting">
            <span v-if="submitting" class="spinner" />
            {{ submitting ? 'Processing...' : `Pay ${formattedTotal}` }}
          </button>
        </form>

        <div class="security-badge">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clip-rule="evenodd" />
          </svg>
          Secured by Tap Payments · PCI DSS Compliant
        </div>

        <div class="powered-by">
          Powered by <a href="https://commercejs.cloud">CommerceJS</a>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cart-summary {
  padding: 0.75rem 0;
}
.cart-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
}
.cart-item + .cart-item {
  border-top: 1px solid #f3f4f6;
}
.cart-item-image {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  background: #f9fafb;
}
.cart-item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.cart-item-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}
.cart-item-details {
  flex: 1;
  min-width: 0;
}
.cart-item-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: #171717;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cart-item-qty {
  font-size: 0.75rem;
  color: #737373;
}
.cart-item-price {
  font-size: 0.875rem;
  font-weight: 600;
  color: #171717;
  flex-shrink: 0;
}
</style>
