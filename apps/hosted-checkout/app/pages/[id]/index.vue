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
const lastName = ref('')
const phone = ref('')

// Delivery state
const fulfillmentType = ref<'pickup' | 'delivery'>('pickup')
const addrFlat = ref('')
const addrBuilding = ref('')
const addrRoad = ref('')
const addrBlock = ref('')
const addrArea = ref('')
const deliveryLat = ref<number | null>(null)
const deliveryLng = ref<number | null>(null)

const deliveryFirstLine = computed(() =>
  [addrFlat.value, addrBuilding.value, addrRoad.value, addrBlock.value, addrArea.value]
    .filter(Boolean).join(', '),
)
const deliveryEstimate = ref<{ fee: number; estimatedDuration?: number } | null>(null)
const estimatingDelivery = ref(false)
const locatingUser = ref(false)
const locationObtained = ref(false)
const locationError = ref<string | null>(null)

async function useMyLocation() {
  if (!navigator.geolocation) {
    locationError.value = 'Geolocation is not supported by your browser'
    return
  }
  locatingUser.value = true
  locationError.value = null

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      deliveryLat.value = position.coords.latitude
      deliveryLng.value = position.coords.longitude
      locationObtained.value = true
      locatingUser.value = false
      // Show / update map
      await initOrUpdateMap(position.coords.latitude, position.coords.longitude)
      // Auto-fetch estimate once we have coordinates
      await fetchDeliveryEstimate()
    },
    (err) => {
      locatingUser.value = false
      if (err.code === err.PERMISSION_DENIED) {
        locationError.value = 'Location access denied. Please enable it in your browser settings.'
      } else {
        locationError.value = 'Could not determine your location. Please try again.'
      }
    },
    { enableHighAccuracy: true, timeout: 10000 },
  )
}

// Google Maps
const mapContainer = ref<HTMLElement | null>(null)
let map: any = null
let marker: any = null
let mapsLoaded = false

function loadGoogleMaps(): Promise<void> {
  if (mapsLoaded || (window as any).google?.maps) {
    mapsLoaded = true
    return Promise.resolve()
  }
  return new Promise((resolve, reject) => {
    const config = useRuntimeConfig()
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${config.public.googleMapsKey}`
    script.async = true
    script.defer = true
    script.onload = () => { mapsLoaded = true; resolve() }
    script.onerror = () => reject(new Error('Failed to load Google Maps'))
    document.head.appendChild(script)
  })
}

async function reverseGeocode(lat: number, lng: number) {
  try {
    const google = (window as any).google
    if (!google?.maps?.Geocoder) return

    const geocoder = new google.maps.Geocoder()
    const { results } = await geocoder.geocode({ location: { lat, lng } })
    if (!results?.[0]) return

    const components = results[0].address_components as any[]
    const formatted = results[0].formatted_address || ''
    const get = (type: string) =>
      components.find((c: any) => c.types.includes(type))?.long_name || ''

    // Auto-fill Area from structured components
    const area = get('sublocality_level_1') || get('neighborhood') || get('locality') || get('administrative_area_level_2')
    if (area) addrArea.value = area

    // Parse Road number from formatted address (e.g. "Rd No 6463", "Road 6463")
    const roadMatch = formatted.match(/(?:Rd\.?\s*(?:No\.?\s*)?|Road\s*)(\d+)/i)
    if (roadMatch) addrRoad.value = roadMatch[1]

    // Parse Block number from formatted address (e.g. "Block 264")
    const blockMatch = formatted.match(/Block\s*(\d+)/i)
    if (blockMatch) addrBlock.value = blockMatch[1]

    console.log('[checkout] Reverse geocoded:', formatted, '→ Area:', area, 'Road:', roadMatch?.[1], 'Block:', blockMatch?.[1])
  } catch (err) {
    console.warn('[checkout] Reverse geocode failed:', err)
  }
}

async function onMarkerPositionChanged(lat: number, lng: number) {
  deliveryLat.value = lat
  deliveryLng.value = lng
  locationObtained.value = true
  await Promise.all([
    reverseGeocode(lat, lng),
    fetchDeliveryEstimate(),
  ])
}

async function initOrUpdateMap(lat: number, lng: number) {
  try {
    await loadGoogleMaps()
  } catch {
    console.warn('[checkout] Google Maps failed to load')
    return
  }

  const google = (window as any).google
  const position = { lat, lng }

  // Reverse-geocode the initial position
  reverseGeocode(lat, lng)

  if (!map && mapContainer.value) {
    map = new google.maps.Map(mapContainer.value, {
      center: position,
      zoom: 16,
      disableDefaultUI: true,
      zoomControl: true,
      gestureHandling: 'greedy',
      styles: [
        { featureType: 'poi', stylers: [{ visibility: 'off' }] },
        { featureType: 'transit', stylers: [{ visibility: 'off' }] },
      ],
    })

    marker = new google.maps.Marker({
      position,
      map,
      draggable: true,
      title: 'Drag to adjust delivery location',
      animation: google.maps.Animation.DROP,
    })

    // Update coordinates + reverse geocode on marker drag
    marker.addListener('dragend', async () => {
      const pos = marker.getPosition()
      await onMarkerPositionChanged(pos.lat(), pos.lng())
    })

    // Allow clicking anywhere on map to move marker
    map.addListener('click', async (e: any) => {
      marker.setPosition(e.latLng)
      await onMarkerPositionChanged(e.latLng.lat(), e.latLng.lng())
    })
  } else if (map && marker) {
    map.panTo(position)
    marker.setPosition(position)
  }
}

// OTP digit refs
const otpDigits = ref(['', '', '', '', '', ''])
const otpInputRefs = ref<HTMLInputElement[]>([])

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

const totalAmount = computed(() => {
  if (!session.value) return 0
  const base = session.value.amount
  if (fulfillmentType.value === 'delivery' && deliveryEstimate.value) {
    return base + deliveryEstimate.value.fee
  }
  return base
})

const formattedAmount = computed(() => {
  if (!session.value) return ''
  return new Intl.NumberFormat('en-BH', {
    style: 'currency',
    currency: session.value.currency,
    minimumFractionDigits: 3,
  }).format(totalAmount.value)
})

const formattedDeliveryFee = computed(() => {
  if (!deliveryEstimate.value || !session.value) return ''
  return new Intl.NumberFormat('en-BH', {
    style: 'currency',
    currency: session.value.currency,
    minimumFractionDigits: 3,
  }).format(deliveryEstimate.value.fee)
})

async function fetchDeliveryEstimate() {
  if (!deliveryLat.value || !deliveryLng.value) return
  estimatingDelivery.value = true
  try {
    const result = await $fetch<any>('/api/delivery-estimate', {
      method: 'POST',
      body: {
        origin: {
          contactName: 'Store',
          contactPhone: '+97300000000',
          firstLine: 'Store',
          latitude: 26.279793,
          longitude: 50.662508,
        },
        destination: {
          contactName: firstName.value || 'Customer',
          contactPhone: phone.value || '+97300000000',
          firstLine: deliveryFirstLine.value || 'Delivery',
          latitude: deliveryLat.value,
          longitude: deliveryLng.value,
        },
      },
    })
    deliveryEstimate.value = result
  } catch {
    deliveryEstimate.value = null
  } finally {
    estimatingDelivery.value = false
  }
}

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
  lastName.value = ''
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

  // Auto-submit when all 6 digits entered (nextTick ensures reactivity flush)
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
    if (p.lastName && !lastName.value) lastName.value = p.lastName
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
    currency: session.value.currency || 'BHD',
    email: email.value || undefined,
    firstName: firstName.value || undefined,
    lastName: lastName.value || undefined,
    phone: phone.value || undefined,
    saveCard: true,
    customerId: profile.tapCustomerId.value || undefined,
  })
}

async function submitPayment() {
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

function getCardBrandIcon(brand: string) {
  const b = (brand || '').toLowerCase()
  if (b.includes('visa')) return '💳 Visa'
  if (b.includes('master')) return '💳 Mastercard'
  if (b.includes('amex') || b.includes('american')) return '💳 Amex'
  if (b.includes('mada')) return '💳 mada'
  return '💳 ' + (brand || 'Card')
}

// ---------------------------------------------------------------------------
// Profile save (fires after successful payment)
// ---------------------------------------------------------------------------
async function saveProfileAfterPayment(tapCustomerId?: string) {
  if (!profile.profileId.value) return
  try {
    await profile.saveProfile({
      firstName: firstName.value || undefined,
      lastName: lastName.value || undefined,
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
        lastName: lastName.value,
        phone: phone.value,
        sourceToken,
        tapCustomerId: profile.tapCustomerId.value || undefined,
        shippingAddress: {
          firstName: firstName.value,
          lastName: lastName.value,
          phone: phone.value,
          street: fulfillmentType.value === 'delivery' ? deliveryFirstLine.value : 'Pickup',
          street2: null,
          city: 'Manama',
          state: null,
          country: 'BH',
          postalCode: null,
          district: null,
          nationalAddress: null,
          additionalNumber: null,
        },
        // Delivery info — used for auto-dispatch
        delivery: fulfillmentType.value === 'delivery' ? {
          type: 'delivery',
          address: deliveryFirstLine.value,
          latitude: deliveryLat.value,
          longitude: deliveryLng.value,
          fee: deliveryEstimate.value?.fee ?? 0,
        } : { type: 'pickup' },
      },
    })

    // Save profile data + tapCustomerId BEFORE redirect (must complete before navigation)
    await saveProfileAfterPayment(result.tapCustomerId)

    // Auto-dispatch delivery if delivery was selected
    if (fulfillmentType.value === 'delivery' && deliveryLat.value && deliveryLng.value) {
      try {
        await $fetch('/api/delivery-dispatch', {
          method: 'POST',
          body: {
            orderId: session.value?.orderId || sessionId,
            origin: { branchId: '687e63052457a10038d739ff' },
            destination: {
              contactName: `${firstName.value} ${lastName.value}`.trim() || 'Customer',
              contactPhone: phone.value || '+97300000000',
              firstLine: deliveryFirstLine.value || 'Delivery',
              latitude: deliveryLat.value,
              longitude: deliveryLng.value,
              instructions: '',
            },
            payment: {
              type: 'paid',
              amount: deliveryEstimate.value?.fee ?? 0,
            },
          },
        })
        console.log('[checkout] Delivery dispatched successfully')
      }
      catch (dispatchErr) {
        // Don't block the checkout flow — delivery dispatch is best-effort
        console.warn('[checkout] Delivery dispatch failed:', dispatchErr)
      }
    }

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

// Load SDK once on mount
const sdkReady = ref(false)
onMounted(async () => {
  if (!session.value || session.value.state === 'complete' || session.value.state === 'failed') return
  try {
    await tapCard.loadSDK()
    sdkReady.value = true
  }
  catch {
    console.warn('[checkout] Failed to load Tap Card SDK v2')
  }
})

// The card form should show when: SDK loaded, no saved card selected,
// and the form container is in the DOM (OTP done or not needed)
const shouldShowCardForm = computed(() =>
  sdkReady.value
  && !profile.selectedCard.value
  && (!profile.otpSent.value || profile.otpVerified.value),
)

watch(shouldShowCardForm, (show, wasShowing) => {
  if (show) {
    tapCard.unmount()
    nextTick(() => setTimeout(initCardElement, 200))
  }
}, { immediate: true })
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
          <!-- Email with profile lookup -->
          <div class="form-group">
            <label class="form-label" for="email">Email</label>
            <div class="form-group-with-status">
              <input
                id="email"
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

            <!-- Delivery method selector -->
            <div class="delivery-section">
              <label class="form-label">Fulfillment method</label>
              <div class="delivery-toggle">
                <button
                  type="button"
                  class="toggle-option"
                  :class="{ active: fulfillmentType === 'pickup' }"
                  @click="fulfillmentType = 'pickup'; deliveryEstimate = null"
                >
                  🏪 Pickup
                </button>
                <button
                  type="button"
                  class="toggle-option"
                  :class="{ active: fulfillmentType === 'delivery' }"
                  @click="fulfillmentType = 'delivery'"
                >
                  🚗 Delivery
                </button>
              </div>

              <!-- Delivery address fields -->
              <div v-show="fulfillmentType === 'delivery'" class="delivery-fields">
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label" for="addrFlat">Flat / Apt</label>
                    <input
                      id="addrFlat"
                      v-model="addrFlat"
                      class="form-input"
                      type="text"
                      placeholder="12A"
                    >
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="addrBuilding">Building</label>
                    <input
                      id="addrBuilding"
                      v-model="addrBuilding"
                      class="form-input"
                      type="text"
                      placeholder="456"
                    >
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label" for="addrRoad">Road</label>
                    <input
                      id="addrRoad"
                      v-model="addrRoad"
                      class="form-input"
                      type="text"
                      placeholder="2814"
                    >
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="addrBlock">Block</label>
                    <input
                      id="addrBlock"
                      v-model="addrBlock"
                      class="form-input"
                      type="text"
                      placeholder="328"
                    >
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label" for="addrArea">Area</label>
                  <input
                    id="addrArea"
                    v-model="addrArea"
                    class="form-input"
                    type="text"
                    placeholder="Juffair"
                  >
                </div>

                <!-- Location button -->
                <button
                  type="button"
                  class="btn-location"
                  :disabled="locatingUser || estimatingDelivery"
                  @click="useMyLocation"
                >
                  <template v-if="locatingUser">
                    <span class="spinner spinner-sm" /> Getting your location...
                  </template>
                  <template v-else-if="estimatingDelivery">
                    <span class="spinner spinner-sm" /> Estimating delivery...
                  </template>
                  <template v-else-if="locationObtained && deliveryEstimate">
                    ✅ Location set · Update location
                  </template>
                  <template v-else>
                    📍 Use my location
                  </template>
                </button>

                <div v-if="locationError" class="location-error">
                  {{ locationError }}
                </div>

                <!-- Google Map -->
                <div
                  ref="mapContainer"
                  class="delivery-map"
                  :class="{ 'map-visible': locationObtained }"
                />

                <!-- Estimate result -->
                <div v-if="deliveryEstimate" class="delivery-estimate">
                  <div class="estimate-row">
                    <span>Delivery fee</span>
                    <span class="estimate-value">{{ formattedDeliveryFee }}</span>
                  </div>
                  <div v-if="deliveryEstimate.estimatedDuration" class="estimate-row">
                    <span>Est. time</span>
                    <span class="estimate-value">~{{ deliveryEstimate.estimatedDuration }} min</span>
                  </div>
                </div>
              </div>
            </div>

            <hr class="checkout-divider">

            <!-- Saved cards selector (when returning customer has saved cards) -->
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

            <!-- Card element (Tap Card SDK v2) — hidden when saved card selected -->
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

            <button
              type="submit"
              class="btn btn-primary"
              :disabled="submitting"
            >
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
          Powered by <a href="#">CommerceJS</a>
        </div>
      </div>
    </div>
  </div>
</template>
