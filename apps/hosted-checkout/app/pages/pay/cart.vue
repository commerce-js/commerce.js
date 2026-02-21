<script setup lang="ts">
/**
 * Cart payment page — pay for an existing storefront cart via Tap.
 *
 * URL: /pay/cart?id=<cartId>&return=<storefrontReturnUrl>
 *
 * Flow:
 *  1. Load cart from shared DB
 *  2. Email → profile lookup → OTP (returning buyers) → auto-fill
 *  3. Show cart summary + card form (Tap Card SDK v2)
 *  4. Submit: tokenize → charge → 3DS redirect or direct capture
 *  5. On success: "Save to profile" opt-in
 */

const route = useRoute()
const config = useRuntimeConfig()
const profile = useProfile()

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
const orderComplete = ref(!!successParam)
const completedOrderId = ref(successOrderId || '')

// Form state
const email = ref('')
const firstName = ref('')
const lastName = ref('')
const phone = ref('')

// OTP digit refs
const otpDigits = ref(['', '', '', '', '', ''])
const otpInputRefs = ref<HTMLInputElement[]>([])

// Saved selections
const selectedAddressId = ref<string | null>(null)
const selectedPaymentId = ref<string | null>(null)
const saveToProfile = ref(true) // Default ON like Link

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

    // Pre-fill form from billing address (or shipping as fallback)
    const addr = (cartData.value as any).billingAddress || (cartData.value as any).shippingAddress
    if (addr) {
      firstName.value = addr.firstName || ''
      phone.value = addr.phone || ''
      email.value = addr.email || ''
    }
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

// ---------------------------------------------------------------------------
// Profile lookup on email blur
// ---------------------------------------------------------------------------
function switchIdentity() {
  profile.reset()
  email.value = ''
  firstName.value = ''
  lastName.value = ''
  phone.value = ''
  selectedAddressId.value = null
  selectedPaymentId.value = null
  otpDigits.value = ['', '', '', '', '', '']
}

function skipProfile() {
  profile.reset()
  otpDigits.value = ['', '', '', '', '', '']
}

async function onEmailBlur() {
  if (!email.value || !email.value.includes('@')) return
  if (profile.otpVerified.value) return // Already verified

  const result = await profile.lookupProfile(email.value)
  if (result?.exists) {
    // Returning buyer — send OTP automatically
    await profile.sendOtp()
  }
}

// ---------------------------------------------------------------------------
// OTP digit input handling
// ---------------------------------------------------------------------------
function onOtpInput(index: number, event: Event) {
  const input = event.target as HTMLInputElement
  const value = input.value.replace(/\D/g, '')

  if (value.length > 1) {
    // Handle paste — distribute digits across inputs
    const digits = value.slice(0, 6).split('')
    digits.forEach((d, i) => {
      if (i < 6) otpDigits.value[i] = d
    })
    const nextIndex = Math.min(digits.length, 5)
    otpInputRefs.value[nextIndex]?.focus()

    // Auto-submit if all 6 digits are filled
    if (digits.length === 6) {
      submitOtp()
    }
    return
  }

  otpDigits.value[index] = value

  if (value && index < 5) {
    otpInputRefs.value[index + 1]?.focus()
  }

  // Auto-submit when all 6 digits entered
  if (otpDigits.value.every(d => d !== '')) {
    submitOtp()
  }
}

function onOtpKeydown(index: number, event: KeyboardEvent) {
  if (event.key === 'Backspace' && !otpDigits.value[index] && index > 0) {
    otpInputRefs.value[index - 1]?.focus()
  }
}

async function submitOtp() {
  const code = otpDigits.value.join('')
  if (code.length !== 6) return

  const verified = await profile.verifyOtp(code)
  if (verified && profile.profileData.value) {
    // Auto-fill from profile
    const p = profile.profileData.value
    if (p.firstName && !firstName.value) firstName.value = p.firstName
    if (p.lastName && !lastName.value) lastName.value = p.lastName
    if (p.phone && !phone.value) phone.value = p.phone

    // Pre-select first saved address and payment method
    if (p.addresses?.length) {
      selectedAddressId.value = p.addresses[0].id
    }
    if (p.paymentMethods?.length) {
      selectedPaymentId.value = p.paymentMethods[0].id
    }
  }
  else {
    // Clear digits on failure so they can retry
    otpDigits.value = ['', '', '', '', '', '']
    otpInputRefs.value[0]?.focus()
  }
}

async function resendOtp() {
  profile.otpError.value = null
  otpDigits.value = ['', '', '', '', '', '']
  await profile.sendOtp()
  otpInputRefs.value[0]?.focus()
}

// Computed: selected address object
const selectedAddress = computed(() => {
  if (!selectedAddressId.value || !profile.profileData.value?.addresses) return null
  return profile.profileData.value.addresses.find((a: any) => a.id === selectedAddressId.value)
})

// Computed: selected payment method
const selectedPayment = computed(() => {
  if (!selectedPaymentId.value || !profile.profileData.value?.paymentMethods) return null
  return profile.profileData.value.paymentMethods.find((pm: any) => pm.id === selectedPaymentId.value)
})

// Computed: has profile data to auto-fill
const isCompactMode = computed(() => {
  return profile.otpVerified.value && profile.profileData.value
})

// ---------------------------------------------------------------------------
// Tap Card SDK v2
// ---------------------------------------------------------------------------
const tapCard = useTapCard()

function initCardElement() {
  if (!import.meta.client) return
  const publicKey = config.public.tapPublicKey
  if (!publicKey || !cart.value) return

  tapCard.render({
    containerId: 'tap-card-element',
    publicKey,
    amount: cart.value.totals.total.amount,
    currency: cart.value.totals.total.currency || 'BHD',
    email: email.value || undefined,
    firstName: firstName.value || undefined,
    lastName: lastName.value || undefined,
    phone: phone.value || undefined,
    saveCard: !!profile.profileId.value,
  })
}

async function submitPayment() {
  if (!email.value) {
    error.value = 'Email is required'
    return
  }

  submitting.value = true
  error.value = null

  // Save profile in background if opted in
  saveProfileIfOptedIn()

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

// ---------------------------------------------------------------------------
// Pre-payment save (fires during payment if opted in)
// ---------------------------------------------------------------------------
async function saveProfileIfOptedIn() {
  if (!saveToProfile.value || !profile.profileId.value) return
  // Fire-and-forget save alongside payment
  profile.saveProfile({
    firstName: firstName.value || undefined,
    lastName: lastName.value || undefined,
    phone: phone.value || undefined,
  }).catch(() => {})
}

// ---------------------------------------------------------------------------
// Mount
// ---------------------------------------------------------------------------
onMounted(async () => {
  if (!cart.value || orderComplete.value) return

  try {
    await tapCard.loadSDK()
    setTimeout(initCardElement, 100)
  }
  catch {
    console.warn('[pay/cart] Failed to load Tap Card SDK v2')
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
              <img v-if="item.image" :src="item.image.url" :alt="item.image.alt || ''">
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

          <!-- ============================================================ -->
          <!-- COMPACT VERIFIED VIEW (Link-style) -->
          <!-- ============================================================ -->
          <template v-if="isCompactMode">
            <!-- Locked email row -->
            <div class="compact-row">
              <span class="compact-label">Email</span>
              <div class="compact-value-group">
                <span class="compact-value">{{ email }}</span>
                <button type="button" class="compact-action" @click="switchIdentity">⋯</button>
              </div>
            </div>

            <!-- Shipping to (if address selected) -->
            <div v-if="selectedAddress" class="compact-row">
              <span class="compact-label">Ship to</span>
              <div class="compact-value-group">
                <span class="compact-value">{{ selectedAddress.street }}, {{ selectedAddress.city }}</span>
                <select
                  v-if="profile.profileData.value?.addresses?.length > 1"
                  v-model="selectedAddressId"
                  class="compact-select"
                >
                  <option
                    v-for="addr in profile.profileData.value.addresses"
                    :key="addr.id"
                    :value="addr.id"
                  >
                    {{ addr.label || addr.street }}
                  </option>
                </select>
              </div>
            </div>

            <!-- Pay with (saved card dropdown) -->
            <div v-if="profile.profileData.value?.paymentMethods?.length" class="compact-row">
              <span class="compact-label">Pay with</span>
              <div class="compact-value-group">
                <span class="compact-value pay-with-value">
                  <span class="card-brand">{{ selectedPayment?.brand?.toUpperCase() || 'CARD' }}</span>
                  •••• {{ selectedPayment?.last4 || '••••' }}
                </span>
                <select
                  v-if="profile.profileData.value.paymentMethods.length > 1"
                  v-model="selectedPaymentId"
                  class="compact-select"
                >
                  <option
                    v-for="pm in profile.profileData.value.paymentMethods"
                    :key="pm.id"
                    :value="pm.id"
                  >
                    {{ pm.brand?.toUpperCase() }} •••• {{ pm.last4 }}
                  </option>
                </select>
              </div>
            </div>

            <hr class="checkout-divider">

            <!-- Card element (for new card or if no saved cards) -->
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
          </template>

          <!-- ============================================================ -->
          <!-- STANDARD VIEW (new buyer or pre-OTP) -->
          <!-- ============================================================ -->
          <template v-else>
            <!-- Email (hidden during OTP step — shown in OTP description instead) -->
            <div v-if="!profile.otpSent.value || profile.otpVerified.value" class="form-group">
              <label class="form-label" for="pay-email">Email</label>
              <div class="form-group-with-status">
                <input
                  id="pay-email"
                  v-model="email"
                  class="form-input"
                  type="email"
                  placeholder="ali@example.com"
                  required
                  autocomplete="email"
                  @blur="onEmailBlur"
                >
                <span v-if="profile.lookingUp.value" class="field-status">
                  <span class="spinner" />
                </span>
              </div>
            </div>

            <!-- OTP step: "Confirm it's you" -->
            <div v-if="profile.otpSent.value && !profile.otpVerified.value" class="otp-step">
              <div class="otp-step-title">Confirm it's you</div>
              <div class="otp-step-description">
                Enter the code sent to <strong>{{ email }}</strong> to use your saved information.
              </div>

              <div class="otp-input-group">
                <input
                  v-for="(_, i) in 6"
                  :key="i"
                  :ref="(el) => { if (el) otpInputRefs[i] = el as HTMLInputElement }"
                  v-model="otpDigits[i]"
                  class="otp-digit"
                  :class="{ filled: otpDigits[i] }"
                  type="text"
                  inputmode="numeric"
                  maxlength="6"
                  autocomplete="one-time-code"
                  :disabled="profile.otpVerifying.value"
                  @input="onOtpInput(i, $event)"
                  @keydown="onOtpKeydown(i, $event)"
                >
              </div>

              <div v-if="profile.otpVerifying.value" style="text-align: center; font-size: 0.8125rem; color: var(--color-text-muted);">
                Verifying...
              </div>
              <div v-if="profile.otpError.value" class="otp-error">
                {{ profile.otpError.value }}
              </div>

              <div class="otp-actions">
                <button
                  type="button"
                  class="otp-resend-btn"
                  :disabled="profile.otpSending.value"
                  @click="resendOtp"
                >
                  {{ profile.otpSending.value ? 'Sending...' : 'Resend code' }}
                </button>
                <button type="button" class="otp-skip-btn" @click="skipProfile">
                  Continue without profile
                </button>
              </div>
            </div>

            <!-- Rest of form (hidden while OTP is pending) -->
            <template v-if="!profile.otpSent.value || profile.otpVerified.value">
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

              <!-- Save opt-in (shown for all buyers, like Link) -->
              <div v-if="profile.profileId.value" class="save-opt-in">
                <label class="save-opt-in-check">
                  <input v-model="saveToProfile" type="checkbox">
                  <div>
                    <div class="save-opt-in-text">Save my info for secure 1-click checkout</div>
                    <div class="save-opt-in-sub">Pay faster on this store and thousands of sites</div>
                  </div>
                </label>
              </div>

              <!-- Pay button -->
              <button type="submit" class="btn btn-primary" :disabled="submitting">
                <span v-if="submitting" class="spinner" />
                {{ submitting ? 'Processing...' : `Pay ${formattedTotal}` }}
              </button>
            </template>
          </template>
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
