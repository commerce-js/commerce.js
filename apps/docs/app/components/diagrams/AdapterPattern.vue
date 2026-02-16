<template>
  <DiagramContainer icon="i-material-symbols-hub">
    <DiagramHeader title="The Adapter Pattern" subtitle="Architectural Overview" />

    <!-- Two-panel comparison grid -->
    <div class="grid grid-cols-1 gap-8 md:gap-12 lg:grid-cols-2 items-stretch">
      <!-- Left Side: Without Abstraction -->
      <DiagramPanel label="Without Abstraction" color="error" variant="dashed">
        <DiagramNode label="Your Application" />
        <DiagramConnector :count="3" color="#ef4444" dashed :height="120" />
        <div class="flex w-full gap-3">
          <DiagramNode v-for="name in ['Stripe API', 'Braintree API', 'PayPal API']" :key="name" :label="name" size="sm" />
        </div>
        <template #badge>
          <DiagramBadge label="Vendor Lock-in" icon="i-lucide-lock" color="#ef4444" />
        </template>
      </DiagramPanel>

      <!-- Right Side: With Commerce.js -->
      <DiagramPanel label="With Commerce.js" color="primary">
        <DiagramNode label="Your Application" color="primary" />

        <!-- Vertical connector -->
        <div class="h-8 w-[3px] rounded bg-primary-500" />

        <DiagramNode badge="Commerce.js Layer" label="Uniform Adapter" color="primary" size="xl" variant="solid" />

        <DiagramConnector :count="3" color="var(--color-primary-500)" :height="56" />
        <div class="flex w-full gap-3">
          <DiagramNode v-for="name in ['Stripe', 'Braintree', 'PayPal']" :key="name" :label="name" size="sm" color="primary" />
        </div>
        <template #badge>
          <DiagramBadge label="Platform Freedom" icon="i-lucide-shield-check" color="var(--color-primary-500)" />
        </template>
      </DiagramPanel>
    </div>

    <DiagramFooter
      :legends="[
        { color: 'rgba(252,165,165,0.6)', label: 'Tight Coupling' },
        { color: 'rgba(134,239,172,0.6)', label: 'Abstracted Architecture' },
      ]"
      document-id="COMMERCE_JS_DP_02"
    />
  </DiagramContainer>
</template>