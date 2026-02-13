<script setup lang="ts">
import type { Address } from '@commercejs/types'

/**
 * CAddressForm — Shipping/billing address form.
 * Uses Nuxt UI form components (UInput, USelect) with GCC-specific fields.
 */

export interface AddressFormProps {
  /** Current address values */
  modelValue: Partial<Address>
  /** Available countries for the dropdown */
  countries?: { label: string; value: string }[]
  /** Whether to show GCC-specific fields (district, nationalAddress) */
  showGccFields?: boolean
  /** Whether the form is in loading/submitting state */
  loading?: boolean
  /** Per-instance theme overrides */
  ui?: Partial<{
    root: any
    row: any
    field: any
  }>
}

const props = withDefaults(defineProps<AddressFormProps>(), {
  countries: () => [],
  showGccFields: true,
  loading: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: Partial<Address>]
  'submit': [value: Partial<Address>]
}>()

function update(field: keyof Address, value: any) {
  emit('update:modelValue', { ...props.modelValue, [field]: value })
}

function handleSubmit() {
  emit('submit', props.modelValue)
}

// Resolve theme from app.config
const appConfig = useAppConfig()
const theme = computed(() => (appConfig.ui as any)?.addressForm ?? {})

const slotClasses = computed(() => {
  const base = theme.value?.slots ?? {}
  return {
    root: [base.root, props.ui?.root],
    row: [base.row, props.ui?.row],
    field: [base.field, props.ui?.field],
  }
})
</script>

<template>
  <form :class="slotClasses.root" @submit.prevent="handleSubmit">
    <!-- Name row -->
    <div :class="slotClasses.row">
      <UFormField label="First Name" :class="slotClasses.field">
        <UInput
          :model-value="modelValue.firstName || ''"
          placeholder="First name"
          required
          :disabled="loading"
          @update:model-value="update('firstName', $event)"
        />
      </UFormField>
      <UFormField label="Last Name" :class="slotClasses.field">
        <UInput
          :model-value="modelValue.lastName || ''"
          placeholder="Last name"
          required
          :disabled="loading"
          @update:model-value="update('lastName', $event)"
        />
      </UFormField>
    </div>

    <!-- Phone -->
    <UFormField label="Phone">
      <UInput
        :model-value="modelValue.phone || ''"
        placeholder="+966 5xx xxx xxxx"
        type="tel"
        :disabled="loading"
        @update:model-value="update('phone', $event)"
      />
    </UFormField>

    <!-- Street -->
    <UFormField label="Street Address">
      <UInput
        :model-value="modelValue.street || ''"
        placeholder="Street address"
        required
        :disabled="loading"
        @update:model-value="update('street', $event)"
      />
    </UFormField>

    <!-- Street 2 -->
    <UFormField label="Apt, Suite, Floor">
      <UInput
        :model-value="modelValue.street2 || ''"
        placeholder="Apartment, suite, etc. (optional)"
        :disabled="loading"
        @update:model-value="update('street2', $event)"
      />
    </UFormField>

    <!-- City + State -->
    <div :class="slotClasses.row">
      <UFormField label="City" :class="slotClasses.field">
        <UInput
          :model-value="modelValue.city || ''"
          placeholder="City"
          required
          :disabled="loading"
          @update:model-value="update('city', $event)"
        />
      </UFormField>
      <UFormField label="State / Province" :class="slotClasses.field">
        <UInput
          :model-value="modelValue.state || ''"
          placeholder="State"
          :disabled="loading"
          @update:model-value="update('state', $event)"
        />
      </UFormField>
    </div>

    <!-- Country + Postal -->
    <div :class="slotClasses.row">
      <UFormField label="Country" :class="slotClasses.field">
        <USelect
          :model-value="modelValue.country || ''"
          :items="countries"
          placeholder="Select country"
          required
          :disabled="loading"
          @update:model-value="update('country', $event)"
        />
      </UFormField>
      <UFormField label="Postal Code" :class="slotClasses.field">
        <UInput
          :model-value="modelValue.postalCode || ''"
          placeholder="Postal code"
          :disabled="loading"
          @update:model-value="update('postalCode', $event)"
        />
      </UFormField>
    </div>

    <!-- GCC-specific fields -->
    <template v-if="showGccFields">
      <slot name="gcc-fields">
        <UFormField label="District (حي)">
          <UInput
            :model-value="modelValue.district || ''"
            placeholder="District / Neighborhood"
            :disabled="loading"
            @update:model-value="update('district', $event)"
          />
        </UFormField>
        <UFormField label="National Address (العنوان الوطني)">
          <UInput
            :model-value="modelValue.nationalAddress || ''"
            placeholder="Saudi National Address"
            :disabled="loading"
            @update:model-value="update('nationalAddress', $event)"
          />
        </UFormField>
      </slot>
    </template>

    <slot name="actions">
      <UButton type="submit" color="primary" :loading="loading" block>
        Save Address
      </UButton>
    </slot>
  </form>
</template>
