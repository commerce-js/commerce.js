<script setup lang="ts">
const address = ref({
  firstName: 'John',
  lastName: 'Doe',
  street: '123 Al-Olaya Street',
  city: 'Riyadh',
  state: 'Riyadh Province',
  postalCode: '12345',
  country: 'SA',
  phone: '+966501234567'
})

const countries = [
  { label: 'Saudi Arabia', value: 'SA' },
  { label: 'United Arab Emirates', value: 'AE' },
  { label: 'Kuwait', value: 'KW' },
  { label: 'Bahrain', value: 'BH' },
  { label: 'Qatar', value: 'QA' },
  { label: 'Oman', value: 'OM' },
]

function handleSubmit(data: any) {
  // Demo only
}
</script>

<template>
  <ComponentDemo>
    <div class="w-full max-w-lg mx-auto">
      <div class="rounded-xl bg-elevated/50 ring ring-default p-6">
        <div class="flex items-center gap-2 mb-4">
          <UIcon name="i-heroicons-map-pin-20-solid" class="text-primary text-lg" />
          <h3 class="text-base font-semibold text-highlighted">Shipping Address</h3>
        </div>
        <CAddressForm
          v-model="address"
          :countries="countries"
          show-gcc-fields
          @submit="handleSubmit"
        />
      </div>
    </div>
  </ComponentDemo>
</template>
