<script setup lang="ts">
/**
 * Payment Link checkout page — simplified payment-only flow.
 *
 * Accessed via: /pay/:id
 * Created by: POST /api/payment-links
 *
 * Flow:
 *  1. Fetch session from API
 *  2. Email → profile lookup → OTP (returning buyers) → auto-fill
 *  3. Show amount + card form (Tap Card SDK v2) or saved card selector
 *  4. Show expiry countdown if session has TTL
 *  5. On submit: tokenize → pay → redirect or success
 */

const route = useRoute()
const config = useRuntimeConfig()
const profile = useProfile()
const sessionId = route.params.id as string

// Session state
const session = ref<Record<string, any> | null>(null)
const loading = ref(true)
const submitting = ref(false)
const error = ref<string | null>(null)

// Form state
const email = ref('')
const firstName = ref('')
const phone = ref('')

// OTP digit refs
const otpDigits = ref(['', '', '', '', '', ''])
const otpInputRefs = ref<HTMLInputElement[]>([])

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

// ---------------------------------------------------------------------------
// Profile lookup on email blur
// ---------------------------------------------------------------------------
async function onEmailBlur() {
  if (!email.value || !email.value.includes('@')) return
  if (profile.otpVerified.value) return // Already verified

  const result = await profile.lookupProfile(email.value)
  if (result?.exists) {
    // Returning buyer — send OTP automatically
    await profile.sendOtp()
  }
}

function switchIdentity() {
  profile.reset()
  email.value = ''
  firstName.value = ''
  phone.value = ''
  otpDigits.value = ['', '', '', '', '', '']
}

function skipProfile() {
  profile.reset()
  otpDigits.value = ['', '', '', '', '', '']
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

    if (digits.length === 6) {
      nextTick(() => submitOtp())
    }
    return
  }

  otpDigits.value[index] = value

  if (value && index < 5) {
    otpInputRefs.value[index + 1]?.focus()
  }

  // Auto-submit when all 6 digits entered
  if (otpDigits.value.every(d => d !== '')) {
    nextTick(() => submitOtp())
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
    if (p.phone && !phone.value) phone.value = p.phone
  }
  else {
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
    currency: session.value.currency || 'SAR',
    email: email.value || undefined,
    firstName: firstName.value || undefined,
    phone: phone.value || undefined,
    saveCard: true,
    customerId: profile.tapCustomerId.value || undefined,
  })
}

function getCardBrandIcon(brand: string) {
  const b = (brand || '').toLowerCase()
  if (b.includes('visa')) return '💳 Visa'
  if (b.includes('master')) return '💳 Mastercard'
  if (b.includes('amex') || b.includes('american')) return '💳 Amex'
  if (b.includes('mada')) return '💳 mada'
  return '💳 ' + (brand || 'Card')
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

  // If a saved card is selected, tokenize it on the server
  if (profile.selectedCard.value) {
    try {
      const token = await profile.tokenizeSavedCard(profile.selectedCard.value)
      if (!token) {
        error.value = 'Failed to process saved card. Please try a new card.'
        submitting.value = false
        return
      }
      await submitPaymentWithToken(token)
    }
    catch (err: any) {
      error.value = err?.message || 'Failed to process saved card'
      submitting.value = false
    }
    return
  }

  // New card via Tap Card SDK
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

// ---------------------------------------------------------------------------
// Profile save (fires after successful payment)
// ---------------------------------------------------------------------------
async function saveProfileAfterPayment(tapCustomerId?: string) {
  if (!profile.profileId.value) return
  try {
    await profile.saveProfile({
      firstName: firstName.value || undefined,
      phone: phone.value || undefined,
      tapCustomerId: tapCustomerId || undefined,
    })
  }
  catch {
    // Best-effort — don't fail the payment flow
  }
}

async function submitPaymentWithToken(sourceToken: string | undefined) {
  try {
    const result = await $fetch<any>(`/api/sessions/${sessionId}/pay`, {
      method: 'POST',
      body: {
        email: email.value,
        firstName: firstName.value,
        phone: phone.value,
        sourceToken,
        tapCustomerId: profile.tapCustomerId.value || undefined,
      },
    })

    // Save profile data + tapCustomerId BEFORE redirect
    await saveProfileAfterPayment(result.tapCustomerId)

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

// ---------------------------------------------------------------------------
// Mount
// ---------------------------------------------------------------------------
const sdkReady = ref(false)
onMounted(async () => {
  // Start expiry countdown
  if (session.value?.expiresAt) {
    updateCountdown()
    countdownInterval = setInterval(updateCountdown, 1000)
  }

  if (!session.value || session.value.state === 'complete' || session.value.state === 'failed') return

  try {
    await tapCard.loadSDK()
    sdkReady.value = true
  }
  catch {
    console.warn('[pay] Failed to load Tap Card SDK v2')
  }
})

const shouldShowCardForm = computed(() =>
  sdkReady.value
  && !profile.selectedCard.value
  && (!profile.otpSent.value || profile.otpVerified.value),
)

watch(shouldShowCardForm, (show) => {
  if (show) {
    tapCard.unmount()
    nextTick(() => setTimeout(initCardElement, 200))
  }
}, { immediate: true })

onUnmounted(() => {
  if (countdownInterval) clearInterval(countdownInterval)
  tapCard.unmount()
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
          <!-- Email with profile lookup -->
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
            <!-- Verified identity badge -->
            <div v-if="profile.otpVerified.value" class="verified-badge">
              <span>✓ {{ email }}</span>
              <button type="button" class="switch-identity-btn" @click="switchIdentity">
                Not you?
              </button>
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

            <!-- Saved cards selector -->
            <div v-if="profile.savedCards.value.length > 0" class="saved-cards">
              <label class="form-label">Payment method</label>

              <label
                v-for="card in profile.savedCards.value"
                :key="card.id"
                class="saved-card-option"
                :class="{ selected: profile.selectedCard.value === card.id }"
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  :value="card.id"
                  :checked="profile.selectedCard.value === card.id"
                  @change="profile.selectedCard.value = card.id"
                >
                <span class="card-info">
                  <span class="card-brand">{{ getCardBrandIcon(card.brand) }}</span>
                  <span class="card-last4">•••• {{ card.last_four }}</span>
                  <span class="card-expiry">{{ String(card.exp_month).padStart(2, '0') }}/{{ String(card.exp_year).slice(-2) }}</span>
                </span>
              </label>

              <label
                class="saved-card-option"
                :class="{ selected: profile.selectedCard.value === null }"
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  :value="null"
                  :checked="profile.selectedCard.value === null"
                  @change="profile.selectedCard.value = null"
                >
                <span class="card-info">
                  <span class="card-brand">➕</span>
                  <span class="card-last4">Use a new card</span>
                </span>
              </label>
            </div>

            <!-- Card element — hidden when saved card selected -->
            <div v-show="!profile.selectedCard.value" class="form-group">
              <label v-if="profile.savedCards.value.length === 0" class="form-label">Card details</label>
              <!-- SDK loading spinner -->
              <div v-if="!sdkReady && !profile.selectedCard.value" class="sdk-loading">
                <span class="spinner" />
                <span class="sdk-loading-text">Loading card form...</span>
              </div>
              <div id="tap-card-element" class="tap-card-element" />
              <p id="tap-notifications" class="tap-notification" />
            </div>

            <!-- Pay button -->
            <button type="submit" class="btn btn-primary" :disabled="submitting || isExpired">
              <span v-if="submitting" class="spinner" />
              {{ submitting ? 'Processing...' : `Pay ${formattedAmount}` }}
            </button>
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
.checkout-expiry {
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: #737373;
}
.expiry-warning {
  color: #dc2626;
  font-weight: 600;
}
.sdk-loading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 0;
  color: #737373;
}
.sdk-loading-text {
  font-size: 0.8125rem;
}
</style>
