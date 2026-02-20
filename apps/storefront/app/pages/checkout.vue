<script setup lang="ts">
import type { Address, Order } from '@commercejs/types'

const { t } = useLocalizedString()
const { formatPrice } = usePrice()
const { cart, cartId, itemCount } = useCart()
const {
  shippingMethods,
  paymentMethods,
  loading,
  error,
  loadShippingMethods,
  loadPaymentMethods,
  setShippingAddress,
  setShippingMethod,
  setPaymentMethod,
  placeOrder,
} = useCheckout()
// ── Fetch countries (lazy, with flags) ──
type CountryApi = { id: string; code: string; name: { en?: string; ar?: string } | string; flag?: string; iso3?: string }
const { data: countriesData, status: countriesStatus, execute: loadCountries } = await useLazyFetch<CountryApi[]>('/api/_commerce/countries', { immediate: false })

// ── Redirect if no cart ──
const router = useRouter()
onMounted(async () => {
  loadCountries()
  if (!cartId.value || !cart.value || cart.value.items.length === 0) {
    await router.replace('/cart')
  }
})

// ── Navigate to confirmation on order placed ──
const isNavigatingToConfirmation = ref(false)

// ── Step management ──
const currentStep = ref(0)
const steps = [
  { id: 'address', title: 'Shipping Address', icon: 'i-heroicons-map-pin' },
  { id: 'shipping', title: 'Shipping Method', icon: 'i-heroicons-truck' },
  { id: 'payment', title: 'Payment', icon: 'i-heroicons-credit-card' },
  { id: 'review', title: 'Review', icon: 'i-heroicons-clipboard-document-check' },
]

// ── Address form state ──
const addressForm = ref<Partial<Address>>({
  firstName: '',
  lastName: '',
  phone: '',
  street: '',
  street2: '',
  city: '',
  state: '',
  country: '',
  postalCode: '',
  district: '',
  nationalAddress: '',
})

// ── Selected IDs ──
const selectedShippingId = ref('')
const selectedPaymentId = ref('')

// ── Country items for CAddressForm ──
const countryItems = computed(() =>
  (countriesData.value || []).map(c => ({
    name: typeof c.name === 'object' ? (c.name as any).en || Object.values(c.name)[0] || c.code : String(c.name),
    flag: c.flag || null,
    code: c.code,
  })),
)

// ── Dependent city fetch ──
const selectedCountryCode = computed(() => addressForm.value.country || '')
const { data: citiesData, status: citiesStatus, execute: loadCities } = await useLazyFetch<string[]>(
  '/api/_commerce/cities',
  { immediate: false, query: { country: selectedCountryCode }, transform: d => d ?? [] },
)
watch(selectedCountryCode, (code) => {
  // Clear city when country changes
  addressForm.value.city = ''
  if (code) loadCities()
})

// ── Step handlers ──
async function handleAddressSubmit() {
  try {
    await setShippingAddress(addressForm.value as Omit<Address, 'id' | 'isDefault'>)
    await loadShippingMethods()
    currentStep.value = 1
  }
  catch {}
}

function selectShipping(methodId: string) {
  selectedShippingId.value = methodId
}

async function handleShippingContinue() {
  if (!selectedShippingId.value) return
  try {
    await setShippingMethod(selectedShippingId.value)
    await loadPaymentMethods()
    currentStep.value = 2
  }
  catch {}
}

function selectPayment(methodId: string) {
  selectedPaymentId.value = methodId
}

async function handlePaymentContinue() {
  if (!selectedPaymentId.value) return
  try {
    await setPaymentMethod(selectedPaymentId.value)
    currentStep.value = 3
  }
  catch {}
}

// Store placed order in Nuxt state so confirmation page can read it
const placedOrder = useState<Order | null>('commerce_placed_order', () => null)

async function handlePlaceOrder() {
  try {
    // Card payments redirect to hosted checkout for Tap processing
    if (selectedPaymentId.value === 'card') {
      const checkoutUrl = 'https://checkout.commercejs.cloud'
      const returnUrl = encodeURIComponent(window.location.origin)
      isNavigatingToConfirmation.value = true
      await navigateTo(
        `${checkoutUrl}/pay/cart?id=${cartId.value}&return=${returnUrl}`,
        { external: true },
      )
      return
    }

    // COD and other methods — place order directly
    const order = await placeOrder()
    placedOrder.value = order
    isNavigatingToConfirmation.value = true
    await navigateTo(`/order-confirmation?orderId=${order.id}`)
  }
  catch {}
}

// ── Computed helpers ──
const selectedShipping = computed(() =>
  shippingMethods.value.find(m => m.id === selectedShippingId.value),
)
const selectedPayment = computed(() =>
  paymentMethods.value.find(m => m.id === selectedPaymentId.value),
)
const cartItems = computed(() => cart.value?.items ?? [])
const subtotal = computed(() => cart.value?.totals?.subtotal)
const total = computed(() => cart.value?.totals?.total)
const shippingCost = computed(() => selectedShipping.value?.price)

useHead({
  title: 'Checkout — CommerceJS',
  meta: [
    { name: 'description', content: 'Complete your purchase securely.' },
  ],
})
</script>

<template>
  <UContainer class="py-8 md:py-12">
    <UBreadcrumb
      :items="[
        { label: 'Home', to: '/' },
        { label: 'Cart', to: '/cart' },
        { label: 'Checkout' },
      ]"
      class="mb-8"
    />

    <!-- Empty cart fallback -->
    <CEmptyState
      v-if="!isNavigatingToConfirmation && (!cart || cartItems.length === 0)"
      icon="i-heroicons-shopping-cart"
      title="Your cart is empty"
      description="Add items to your cart before checking out"
      action-label="Browse Products"
      action-to="/products"
    />

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- ═══════════ LEFT: Form steps ═══════════ -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Stepper -->
        <CCheckoutStepper
          v-model="currentStep"
          :steps="steps"
          :linear="true"
          color="primary"
        />

        <!-- Error banner -->
        <UAlert
          v-if="error"
          color="error"
          icon="i-heroicons-exclamation-triangle"
          :title="error.message"
        />

        <!-- ─── Step 0: Shipping Address ─── -->
        <div v-if="currentStep === 0" class="space-y-4">
          <h2 class="text-xl font-semibold text-highlighted">
            Shipping Address
          </h2>
          <div class="rounded-2xl bg-elevated ring ring-default p-6">
            <CAddressForm
              v-model="addressForm"
              :countries="countryItems"
              :cities="citiesData || []"
              :countries-loading="countriesStatus === 'pending'"
              :cities-loading="citiesStatus === 'pending'"
              :loading="loading"
              :show-gcc-fields="true"
              @submit="handleAddressSubmit"
            >
              <template #actions>
                <UButton
                  type="submit"
                  color="primary"
                  size="lg"
                  :loading="loading"
                  block
                  icon="i-heroicons-arrow-right-20-solid"
                  trailing
                >
                  Continue to Shipping
                </UButton>
              </template>
            </CAddressForm>
          </div>
        </div>

        <!-- ─── Step 1: Shipping Method ─── -->
        <div v-if="currentStep === 1" class="space-y-4">
          <h2 class="text-xl font-semibold text-highlighted">
            Shipping Method
          </h2>
          <div class="space-y-3">
            <button
              v-for="method in shippingMethods"
              :key="method.id"
              class="w-full text-left rounded-2xl p-5 ring transition-all duration-200"
              :class="selectedShippingId === method.id
                ? 'ring-2 ring-primary bg-primary/5'
                : 'ring-default bg-elevated hover:ring-primary/50'"
              @click="selectShipping(method.id)"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <UIcon
                    :name="method.id === 'express' ? 'i-heroicons-bolt' : 'i-heroicons-truck'"
                    class="text-2xl"
                    :class="selectedShippingId === method.id ? 'text-primary' : 'text-muted'"
                  />
                  <div>
                    <p class="font-medium text-highlighted">
                      {{ t(method.name) }}
                    </p>
                    <p class="text-sm text-muted">
                      <template v-if="method.fulfillmentType === 'local_delivery' && method.estimatedMinutes">
                        ~{{ method.estimatedMinutes }} min delivery
                      </template>
                      <template v-else-if="method.fulfillmentType === 'pickup'">
                        Ready for pickup
                      </template>
                      <template v-else-if="method.estimatedDays">
                        {{ method.estimatedDays.min }}–{{ method.estimatedDays.max }} business days
                      </template>
                    </p>
                  </div>
                </div>
                <span class="font-semibold text-highlighted">
                  {{ formatPrice(method.price) }}
                </span>
              </div>
            </button>
          </div>

          <div class="flex items-center justify-between pt-2">
            <UButton
              variant="ghost"
              color="neutral"
              icon="i-heroicons-arrow-left-20-solid"
              @click="currentStep = 0"
            >
              Back to Address
            </UButton>
            <UButton
              color="primary"
              size="lg"
              :disabled="!selectedShippingId || loading"
              :loading="loading"
              @click="handleShippingContinue"
            >
              Continue to Payment
            </UButton>
          </div>
        </div>

        <!-- ─── Step 2: Payment Method ─── -->
        <div v-if="currentStep === 2" class="space-y-4">
          <h2 class="text-xl font-semibold text-highlighted">
            Payment Method
          </h2>
          <div class="space-y-3">
            <button
              v-for="method in paymentMethods"
              :key="method.id"
              class="w-full text-left rounded-2xl p-5 ring transition-all duration-200"
              :class="selectedPaymentId === method.id
                ? 'ring-2 ring-primary bg-primary/5'
                : 'ring-default bg-elevated hover:ring-primary/50'"
              @click="selectPayment(method.id)"
            >
              <div class="flex items-center gap-3">
                <UIcon
                  :name="method.type === 'card' ? 'i-heroicons-credit-card' : 'i-heroicons-banknotes'"
                  class="text-2xl"
                  :class="selectedPaymentId === method.id ? 'text-primary' : 'text-muted'"
                />
                <div>
                  <p class="font-medium text-highlighted">
                    {{ t(method.name) }}
                  </p>
                  <p class="text-sm text-muted">
                    {{ method.type === 'card' ? 'Visa, Mastercard, mada' : 'Pay when you receive your order' }}
                  </p>
                </div>
              </div>
            </button>
          </div>

          <div class="flex items-center justify-between pt-2">
            <UButton
              variant="ghost"
              color="neutral"
              icon="i-heroicons-arrow-left-20-solid"
              @click="currentStep = 1"
            >
              Back to Shipping
            </UButton>
            <UButton
              color="primary"
              size="lg"
              :disabled="!selectedPaymentId || loading"
              :loading="loading"
              @click="handlePaymentContinue"
            >
              Continue to Review
            </UButton>
          </div>
        </div>

        <!-- ─── Step 3: Review & Place Order ─── -->
        <div v-if="currentStep === 3" class="space-y-6">
          <h2 class="text-xl font-semibold text-highlighted">
            Review Your Order
          </h2>

          <!-- Address summary -->
          <div class="rounded-2xl bg-elevated ring ring-default p-5">
            <div class="flex items-center justify-between mb-3">
              <h3 class="font-medium text-highlighted">
                Shipping Address
              </h3>
              <UButton
                variant="link"
                color="primary"
                size="xs"
                @click="currentStep = 0"
              >
                Edit
              </UButton>
            </div>
            <p class="text-sm text-muted leading-relaxed">
              {{ addressForm.firstName }} {{ addressForm.lastName }}<br>
              {{ addressForm.street }}<template v-if="addressForm.street2">, {{ addressForm.street2 }}</template><br>
              {{ addressForm.city }}<template v-if="addressForm.state">, {{ addressForm.state }}</template>
              {{ addressForm.postalCode }}<br>
              {{ addressForm.country }}
            </p>
          </div>

          <!-- Shipping & Payment summary -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="rounded-2xl bg-elevated ring ring-default p-5">
              <div class="flex items-center justify-between mb-2">
                <h3 class="font-medium text-highlighted">
                  Shipping
                </h3>
                <UButton variant="link" color="primary" size="xs" @click="currentStep = 1">
                  Edit
                </UButton>
              </div>
              <p v-if="selectedShipping" class="text-sm text-muted">
                {{ t(selectedShipping.name) }} — {{ formatPrice(selectedShipping.price) }}
              </p>
            </div>
            <div class="rounded-2xl bg-elevated ring ring-default p-5">
              <div class="flex items-center justify-between mb-2">
                <h3 class="font-medium text-highlighted">
                  Payment
                </h3>
                <UButton variant="link" color="primary" size="xs" @click="currentStep = 2">
                  Edit
                </UButton>
              </div>
              <p v-if="selectedPayment" class="text-sm text-muted">
                {{ t(selectedPayment.name) }}
              </p>
            </div>
          </div>

          <!-- Items review -->
          <div class="rounded-2xl bg-elevated ring ring-default p-5">
            <h3 class="font-medium text-highlighted mb-4">
              Items ({{ itemCount }})
            </h3>
            <div class="space-y-3">
              <div
                v-for="item in cartItems"
                :key="item.id"
                class="flex items-center gap-3"
              >
                <div class="w-12 h-12 rounded-lg overflow-hidden bg-accented shrink-0">
                  <img
                    v-if="item.image"
                    :src="item.image.url"
                    :alt="item.image.alt || t(item.name)"
                    class="w-full h-full object-cover"
                  />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-highlighted truncate">
                    {{ t(item.name) }}
                  </p>
                  <p class="text-xs text-muted">
                    Qty: {{ item.quantity }}
                  </p>
                </div>
                <span class="text-sm font-medium text-highlighted shrink-0">
                  {{ formatPrice(item.totalPrice) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Place order -->
          <div class="flex items-center gap-4">
            <UButton
              variant="ghost"
              color="neutral"
              icon="i-heroicons-arrow-left-20-solid"
              @click="currentStep = 2"
            >
              Back
            </UButton>
            <UButton
              color="primary"
              size="lg"
              :loading="loading"
              class="flex-1"
              icon="i-heroicons-lock-closed-20-solid"
              @click="handlePlaceOrder"
            >
              Place Order
            </UButton>
          </div>
        </div>
      </div>

      <!-- ═══════════ RIGHT: Order summary sidebar ═══════════ -->
      <div class="lg:col-span-1">
        <div class="sticky top-20 rounded-2xl bg-elevated ring ring-default p-6 space-y-4">
          <h3 class="font-semibold text-highlighted text-lg">
            Order Summary
          </h3>

          <USeparator />

          <!-- Line items (compact) -->
          <div class="space-y-2 max-h-48 overflow-y-auto">
            <div
              v-for="item in cartItems"
              :key="item.id"
              class="flex justify-between text-sm"
            >
              <span class="text-muted truncate mr-2">
                {{ t(item.name) }} × {{ item.quantity }}
              </span>
              <span class="font-medium shrink-0">
                {{ formatPrice(item.totalPrice) }}
              </span>
            </div>
          </div>

          <USeparator />

          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-muted">Subtotal</span>
              <span class="font-medium">{{ formatPrice(subtotal) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted">Shipping</span>
              <span :class="shippingCost ? 'font-medium' : 'text-dimmed'">
                {{ shippingCost ? formatPrice(shippingCost) : 'Select method' }}
              </span>
            </div>
          </div>

          <USeparator />

          <div class="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span class="text-primary">{{ formatPrice(total) }}</span>
          </div>

          <div class="flex items-center gap-2 text-xs text-muted pt-2">
            <UIcon name="i-heroicons-lock-closed" class="text-sm" />
            <span>Secure checkout</span>
          </div>
        </div>
      </div>
    </div>
  </UContainer>
</template>
