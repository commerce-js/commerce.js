<template>
  <UDropdownMenu
    v-slot="{ open }"
    :modal="false"
    :items="[{
      label: 'Types',
      to: '/packages/types'
    }, {
      label: 'Checkout',
      to: '/packages/checkout'
    }, {
      label: 'Tap Payment',
      to: '/packages/payment-tap'
    }, {
      label: 'Webhook Verifier',
      to: '/packages/webhook-verifier'
    }, {
      label: 'Salla Adapter',
      to: '/packages/adapter-salla'
    }, {
      label: 'Hosted Checkout',
      to: '/packages/hosted-checkout'
    }]"
    :content="{ align: 'start' }"
    :ui="{ content: 'min-w-fit' }"
    size="xs"
  >
    <UButton
      label="Docs"
      variant="subtle"
      trailing-icon="i-lucide-chevron-down"
      size="xs"
      class="-mb-[6px] font-semibold rounded-full truncate"
      :class="[open && 'bg-primary/15']"
      :ui="{
        trailingIcon: ['transition-transform duration-200', open ? 'rotate-180' : undefined].filter(Boolean).join(' ')
      }"
    />
  </UDropdownMenu>
</template>
