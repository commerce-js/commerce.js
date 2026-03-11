<script setup lang="ts">
import { computed,ref } from 'vue'
import { useAppConfig } from '#imports'
import type { RentalProductMeta, AvailabilitySlot, CreateRentalBookingInput } from '@commercejs/types'
import { today, getLocalTimeZone } from '@internationalized/date'
import type { DateValue } from '@internationalized/date'

/**
 * CRentalBookingForm — Date range picker for rentals.
 * Uses Nuxt UI InputDate (range) with Calendar DatePicker for date selection.
 */

export interface RentalBookingFormProps {
  /** Rental metadata for the product */
  rental: RentalProductMeta
  /** Available time slots (optional — for availability display) */
  availability?: AvailabilitySlot[]
  /** Product ID */
  productId: string
  /** Whether booking is being submitted */
  loading?: boolean
  /** Per-instance theme overrides */
  ui?: Partial<{
    root: any
    dates: any
    summary: any
  }>
}

const props = withDefaults(defineProps<RentalBookingFormProps>(), {
  availability: () => [],
  loading: false,
})

const emit = defineEmits<{
  'submit': [input: CreateRentalBookingInput]
}>()

const inputDate = useTemplateRef('inputDate')

const dateRange = shallowRef<{ start: DateValue, end: DateValue } | undefined>()
const quantity = ref(1)

const todayDate = today(getLocalTimeZone())

const unitLabel = computed(() => {
  const map: Record<string, string> = { hourly: 'hour', daily: 'day', weekly: 'week', monthly: 'month' }
  return map[props.rental.pricingUnit] || props.rental.pricingUnit
})

// Calculate duration between dates
const duration = computed(() => {
  if (!dateRange.value?.start || !dateRange.value?.end) return 0

  const s = dateRange.value.start
  const e = dateRange.value.end
  const startMs = new Date(s.year, s.month - 1, s.day).getTime()
  const endMs = new Date(e.year, e.month - 1, e.day).getTime()
  const diffMs = endMs - startMs
  if (diffMs <= 0) return 0

  const map: Record<string, number> = {
    hourly: 3600000,
    daily: 86400000,
    weekly: 604800000,
    monthly: 2592000000,
  }
  return Math.ceil(diffMs / (map[props.rental.pricingUnit] || 86400000))
})

// Calculate effective price per unit (considering tiers)
const effectiveUnitPrice = computed(() => {
  if (props.rental.pricingTiers?.length) {
    const sorted = [...props.rental.pricingTiers].sort((a, b) => b.minUnits - a.minUnits)
    const tier = sorted.find(t => duration.value >= t.minUnits)
    return tier?.pricePerUnit || props.rental.pricePerUnit
  }
  return props.rental.pricePerUnit
})

const isValid = computed(() => {
  return duration.value >= props.rental.minDuration
    && (!props.rental.maxDuration || duration.value <= props.rental.maxDuration)
})

// Check availability for dates
const isDateUnavailable = computed(() => {
  if (!props.availability?.length) return undefined
  const unavailableDates = new Set(
    props.availability
      .filter(s => !s.available)
      .map(s => s.date)
  )
  return (date: DateValue) => {
    const iso = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`
    return unavailableDates.has(iso)
  }
})

function toISO(date: DateValue): string {
  return `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`
}

function handleSubmit() {
  if (!isValid.value || !dateRange.value?.start || !dateRange.value?.end) return
  emit('submit', {
    productId: props.productId,
    startDate: toISO(dateRange.value.start),
    endDate: toISO(dateRange.value.end),
    quantity: quantity.value,
  })
}

// Resolve theme from app.config
const appConfig = useAppConfig()
const theme = computed(() => (appConfig.ui as any)?.rentalBookingForm ?? {})

const slotClasses = computed(() => {
  const base = theme.value?.slots ?? {}
  const merge = (slot: string) => [base[slot], props.ui?.[slot as keyof typeof props.ui]]
  return {
    root: merge('root'),
    dates: merge('dates'),
    summary: merge('summary'),
  }
})
</script>

<template>
  <form :class="['space-y-5', slotClasses.root]" @submit.prevent="handleSubmit">
    <!-- Date range picker -->
    <div :class="slotClasses.dates">
      <label class="block text-sm font-medium text-default mb-1">Rental Period</label>
      <UInputDate
        ref="inputDate"
        v-model="dateRange"
        range
        :min-value="todayDate"
        :is-date-unavailable="isDateUnavailable"
        :disabled="loading"
      >
        <template #trailing>
          <UPopover :reference="(inputDate as any)?.inputsRef?.[0]?.$el">
            <UButton
              color="neutral"
              variant="link"
              size="sm"
              icon="i-heroicons-calendar-days"
              aria-label="Select rental dates"
              class="px-0"
            />

            <template #content>
              <UCalendar
                v-model="dateRange"
                class="p-2"
                :number-of-months="2"
                range
                :min-value="todayDate"
                :is-date-unavailable="isDateUnavailable"
              />
            </template>
          </UPopover>
        </template>
      </UInputDate>
    </div>

    <!-- Duration & pricing summary -->
    <div v-if="duration > 0" :class="['rounded-xl bg-elevated p-4 space-y-2', slotClasses.summary]">
      <div class="flex justify-between text-sm">
        <span class="text-muted">Duration</span>
        <span class="font-medium text-highlighted">{{ duration }} {{ unitLabel }}{{ duration > 1 ? 's' : '' }}</span>
      </div>
      <div class="flex justify-between text-sm">
        <span class="text-muted">Rate</span>
        <span class="font-medium text-highlighted">{{ effectiveUnitPrice.formatted }} / {{ unitLabel }}</span>
      </div>
      <div v-if="rental.securityDeposit" class="flex justify-between text-sm">
        <span class="text-muted">Security Deposit</span>
        <span class="font-medium text-highlighted">{{ rental.securityDeposit.formatted }}</span>
      </div>
      <USeparator />
      <div class="flex justify-between text-base font-bold">
        <span>Estimated Total</span>
        <span class="text-primary">{{ effectiveUnitPrice.formatted }} × {{ duration }}</span>
      </div>

      <!-- Validation messages -->
      <UAlert
        v-if="duration < rental.minDuration"
        icon="i-heroicons-exclamation-triangle"
        color="warning"
        :title="`Minimum rental: ${rental.minDuration} ${unitLabel}${rental.minDuration > 1 ? 's' : ''}`"
        size="sm"
      />
      <UAlert
        v-if="rental.maxDuration && duration > rental.maxDuration"
        icon="i-heroicons-exclamation-triangle"
        color="warning"
        :title="`Maximum rental: ${rental.maxDuration} ${unitLabel}${rental.maxDuration > 1 ? 's' : ''}`"
        size="sm"
      />
    </div>

    <UButton
      type="submit"
      block
      size="lg"
      color="primary"
      :loading="loading"
      :disabled="!isValid || !duration"
    >
      Book Rental
    </UButton>
  </form>
</template>
