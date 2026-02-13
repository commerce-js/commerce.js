<script setup lang="ts">
import type { CreateQuoteInput } from '@commercejs/types'

/**
 * CQuoteRequestForm — B2B Request-for-Quote form.
 * Allows buyers to submit RFQ with line items, target prices, and company info.
 */

export interface QuoteRequestFormProps {
  /** Pre-populated items (e.g., from cart) */
  initialItems?: Array<{
    productId: string
    productName?: string
    quantity: number
    targetPrice?: number
  }>
  /** Whether the form is submitting */
  loading?: boolean
  /** Per-instance theme overrides */
  ui?: Partial<{
    root: any
    items: any
    contact: any
  }>
}

const props = withDefaults(defineProps<QuoteRequestFormProps>(), {
  initialItems: () => [],
  loading: false,
})

const emit = defineEmits<{
  'submit': [input: CreateQuoteInput]
}>()

// Form state
const items = ref(props.initialItems.map(item => ({
  productId: item.productId,
  productName: item.productName || '',
  quantity: item.quantity,
  targetPrice: item.targetPrice,
  note: '',
})))

const companyName = ref('')
const contactEmail = ref('')
const note = ref('')

function addItem() {
  items.value.push({ productId: '', productName: '', quantity: 1, targetPrice: undefined, note: '' })
}

function removeItem(index: number) {
  items.value.splice(index, 1)
}

function handleSubmit() {
  emit('submit', {
    items: items.value.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      targetPrice: item.targetPrice,
      note: item.note || undefined,
    })),
    companyName: companyName.value || undefined,
    contactEmail: contactEmail.value,
    note: note.value || undefined,
  })
}

// Resolve theme from app.config
const appConfig = useAppConfig()
const theme = computed(() => (appConfig.ui as any)?.quoteRequestForm ?? {})

const slotClasses = computed(() => {
  const base = theme.value?.slots ?? {}
  const merge = (slot: string) => [base[slot], props.ui?.[slot as keyof typeof props.ui]]
  return {
    root: merge('root'),
    items: merge('items'),
    contact: merge('contact'),
  }
})
</script>

<template>
  <form :class="['space-y-6', slotClasses.root]" @submit.prevent="handleSubmit">
    <h3 class="text-lg font-semibold text-highlighted">Request for Quote</h3>

    <!-- Line items -->
    <div :class="['space-y-4', slotClasses.items]">
      <div
        v-for="(item, i) in items"
        :key="i"
        class="rounded-lg bg-elevated p-4 ring ring-default relative"
      >
        <UButton
          v-if="items.length > 1"
          icon="i-heroicons-x-mark-20-solid"
          variant="ghost"
          color="error"
          size="xs"
          class="absolute top-2 end-2"
          @click="removeItem(i)"
        />

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <UFormField label="Product">
            <UInput v-model="item.productName" :placeholder="item.productId || 'Product ID'" disabled size="sm" />
          </UFormField>
          <UFormField label="Quantity">
            <UInput v-model.number="item.quantity" type="number" min="1" size="sm" required />
          </UFormField>
          <UFormField label="Target Price (optional)">
            <UInput v-model.number="item.targetPrice" type="number" min="0" step="0.01" placeholder="Your ideal price" size="sm" />
          </UFormField>
        </div>
        <UFormField label="Note" class="mt-2">
          <UInput v-model="item.note" placeholder="Special requirements…" size="sm" />
        </UFormField>
      </div>

      <UButton variant="outline" size="sm" @click="addItem" icon="i-heroicons-plus-20-solid">
        Add Item
      </UButton>
    </div>

    <USeparator />

    <!-- Contact info -->
    <div :class="['grid grid-cols-1 sm:grid-cols-2 gap-4', slotClasses.contact]">
      <UFormField label="Company Name">
        <UInput v-model="companyName" placeholder="Your company" />
      </UFormField>
      <UFormField label="Contact Email" required>
        <UInput v-model="contactEmail" type="email" placeholder="buyer@company.com" required />
      </UFormField>
    </div>

    <UFormField label="Additional Notes">
      <UTextarea v-model="note" placeholder="Any additional requirements, delivery timeline, etc." rows="3" />
    </UFormField>

    <UButton type="submit" block size="lg" color="primary" :loading="loading">
      Submit Quote Request
    </UButton>
  </form>
</template>
