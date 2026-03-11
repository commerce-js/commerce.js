<script setup lang="ts">
import type { GiftCard, PurchaseGiftCardInput } from '@commercejs/types'
import { useFormField } from '@nuxt/ui/runtime/composables/useFormField.js'
import { computed,ref,nextTick } from 'vue'
import { useAppConfig } from '#imports'

/**
 * CGiftCardForm — Gift card purchase form.
 * Allows customers to select amount, recipient details, and personalize the card.
 */

export interface GiftCardFormProps {
  /** Pre-defined amount options */
  amounts?: number[]
  /** Currency code */
  currency?: string
  /** Whether the form is submitting */
  loading?: boolean
  /** Per-instance theme overrides */
  ui?: Partial<{
    root: any
    amounts: any
    recipient: any
  }>
}

const props = withDefaults(defineProps<GiftCardFormProps>(), {
  amounts: () => [25, 50, 100, 150, 200, 500],
  currency: 'SAR',
  loading: false,
})

const emit = defineEmits<{
  'submit': [input: PurchaseGiftCardInput]
}>()

const selectedAmount = ref<number | null>(null)
const customAmount = ref<number | null>(null)
const recipientEmail = ref('')
const recipientName = ref('')
const senderName = ref('')
const message = ref('')
const isDigital = ref(true)

const finalAmount = computed(() => customAmount.value || selectedAmount.value || 0)
const isCustom = computed(() => selectedAmount.value === null)
const customInputRef = ref<any>(null)

function selectAmount(amount: number) {
  selectedAmount.value = amount
  customAmount.value = null
}

async function handleCustomAmount() {
  selectedAmount.value = null
  await nextTick()
  customInputRef.value?.$el?.querySelector('input')?.focus()
}

function handleSubmit() {
  if (!finalAmount.value) return
  emit('submit', {
    amount: finalAmount.value,
    currency: props.currency,
    recipientEmail: recipientEmail.value || undefined,
    recipientName: recipientName.value || undefined,
    senderName: senderName.value || undefined,
    message: message.value || undefined,
    isDigital: isDigital.value,
  })
}

// Resolve theme from app.config
const appConfig = useAppConfig()
const theme = computed(() => (appConfig.ui as any)?.giftCardForm ?? {})

const slotClasses = computed(() => {
  const base = theme.value?.slots ?? {}
  const merge = (slot: string) => [base[slot], props.ui?.[slot as keyof typeof props.ui]]
  return {
    root: merge('root'),
    amounts: merge('amounts'),
    recipient: merge('recipient'),
  }
})

</script>

<template>
  <UForm :class="['space-y-6', slotClasses.root]" @submit.prevent="handleSubmit">
    <!-- Amount selection -->
    <div :class="['space-y-3', slotClasses.amounts]">
      <!-- <UFormField label="Select Amount"> -->
      <URadioGroup v-model="selectedAmount" :items="amounts" value-key="value" indicator="hidden"
        legend="Select Amount">
        <template #label="{ item }">
          <UButton size="lg" class="justify-center font-semibold w-full"
            :color="selectedAmount === item.value ? 'primary' : 'neutral'" variant="outline"
            @click="selectAmount(item.value)">
            {{ currency }} {{ item.value }}
          </UButton>
        </template>
      </URadioGroup>
      <UCollapsible>
        <UButton size="lg" class="justify-center font-semibold w-full"
          :color="isCustom ? 'primary' : 'neutral'" variant="outline"
          @click="handleCustomAmount">
          Custom Amount
        </UButton>
        <template #content>
          <UFormField label="Enter amount" class="py-1">
            <UInput ref="customInputRef" v-model.number="customAmount" type="number" min="1"
              :placeholder="`${currency} amount`" size="lg" class="w-full" />
          </UFormField>
        </template>
      </UCollapsible>
    </div>

    <USeparator />

    <!-- Card type -->
    <UFormField>
      <URadioGroup v-model="isDigital" :items="[{label: 'Digital (Email)', value: true}, {label: 'Physical Card', value: false}]" value-key="value" indicator="hidden" legend="Select Card Type">
        <template #label="{ item }">
          <UButton size="lg" class="justify-center font-semibold w-full"
            :color="isDigital === item.value ? 'primary' : 'neutral'" variant="outline"
            @click="isDigital = item.value">
            {{ item.label }}
          </UButton>
        </template>
      </URadioGroup>
    </UFormField>

    <!-- Recipient -->
    <div :class="['space-y-3', slotClasses.recipient]">
      <h4 class="text-sm font-medium text-highlighted">Recipient Details</h4>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <UFormField label="Recipient Name">
          <UInput v-model="recipientName" placeholder="Their name" />
        </UFormField>
        <UFormField v-if="isDigital" label="Recipient Email">
          <UInput v-model="recipientEmail" type="email" placeholder="their@email.com" />
        </UFormField>
      </div>
      <UFormField label="Your Name">
        <UInput v-model="senderName" placeholder="From…" />
      </UFormField>
      <UFormField label="Personal Message">
        <UTextarea v-model="message" placeholder="Add a personal message…" rows="3" class="w-full" />
      </UFormField>
    </div>

    <UButton type="submit" block size="lg" color="primary" :loading="loading" :disabled="!finalAmount">
      <UIcon name="i-heroicons-gift-20-solid" class="me-2" />
      Purchase Gift Card — {{ currency }} {{ finalAmount }}
    </UButton>
  </UForm>
</template>
