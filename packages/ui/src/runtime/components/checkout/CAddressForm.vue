<script setup lang="ts">
import { computed } from 'vue'
import type { Address } from '@commercejs/types'

/**
 * CAddressForm — Shipping/billing address form.
 * Uses Nuxt UI form components with GCC-specific fields.
 * Country dropdown is searchable with flag avatars.
 * City dropdown loads cities based on selected country.
 */

export interface CountryItem {
  name: string
  flag: string | null
  code: string
}

export interface AddressFormProps {
  /** Current address values */
  modelValue: Partial<Address>
  /** Available countries for the dropdown */
  countries?: CountryItem[]
  /** Cities for the selected country */
  cities?: string[]
  /** Whether countries are loading */
  countriesLoading?: boolean
  /** Whether cities are loading */
  citiesLoading?: boolean
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
  cities: () => [],
  countriesLoading: false,
  citiesLoading: false,
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

/** Find the flag URL for the currently selected country */
const selectedCountryFlag = computed(() =>
  props.countries.find(c => c.code === props.modelValue.country)?.flag || null,
)

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
          class="w-full"
        />
      </UFormField>
      <UFormField label="Last Name" :class="slotClasses.field">
        <UInput
          :model-value="modelValue.lastName || ''"
          placeholder="Last name"
          required
          :disabled="loading"
          @update:model-value="update('lastName', $event)"
          class="w-full"
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
        class="w-full"
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
        class="w-full"
      />
    </UFormField>

    <!-- Street 2 -->
    <UFormField label="Apt, Suite, Floor">
      <UInput
        :model-value="modelValue.street2 || ''"
        placeholder="Apartment, suite, etc. (optional)"
        :disabled="loading"
        @update:model-value="update('street2', $event)"
        class="w-full"
      />
    </UFormField>

    <!-- City + State -->
    <div :class="slotClasses.row">
      <UFormField label="City" :class="slotClasses.field">
        <USelectMenu
          :model-value="modelValue.city || ''"
          :items="cities"
          placeholder="Select city"
          searchable
          :loading="citiesLoading"
          :disabled="loading || !modelValue.country"
          :ui="{ content: 'min-w-[20rem]' }"
          @update:model-value="update('city', $event)"
          class="w-full"
        />
      </UFormField>
      <UFormField label="State / Province" :class="slotClasses.field">
        <UInput
          :model-value="modelValue.state || ''"
          placeholder="State"
          :disabled="loading"
          @update:model-value="update('state', $event)"
          class="w-full"
        />
      </UFormField>
    </div>

    <!-- Country + Postal -->
    <div :class="slotClasses.row">
      <UFormField label="Country" :class="slotClasses.field">
        <USelectMenu
          :model-value="modelValue.country || ''"
          :items="countries"
          value-key="code"
          label-key="name"
          placeholder="Select country"
          searchable
          required
          :loading="countriesLoading"
          :disabled="loading"
          :ui="{ content: 'min-w-[20rem]' }"
          @update:model-value="update('country', $event)"
          class="w-full"
        >
          <template #leading="{ modelValue: val, ui }">
            <UAvatar
              v-if="val && selectedCountryFlag"
              :src="selectedCountryFlag"
              size="2xs"
              :class="ui.leadingIcon()"
            />
            <UIcon
              v-else
              name="i-lucide-earth"
              :class="ui.leadingIcon()"
            />
          </template>
          <template #item-leading="{ item }">
            <UAvatar
              v-if="item.flag"
              :src="item.flag"
              size="2xs"
            />
            <UIcon
              v-else
              name="i-lucide-earth"
              class="size-4"
            />
          </template>
        </USelectMenu>
      </UFormField>
      <UFormField label="Postal Code" :class="slotClasses.field">
        <UInput
          :model-value="modelValue.postalCode || ''"
          placeholder="Postal code"
          :disabled="loading"
          @update:model-value="update('postalCode', $event)"
          class="w-full"
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
            class="w-full"
          />
        </UFormField>
        <UFormField label="National Address (العنوان الوطني)">
          <UInput
            :model-value="modelValue.nationalAddress || ''"
            placeholder="Saudi National Address"
            :disabled="loading"
            @update:model-value="update('nationalAddress', $event)"
            class="w-full"
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
