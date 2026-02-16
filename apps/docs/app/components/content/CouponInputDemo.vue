<script setup lang="ts">
const appliedCoupon = ref(null) as any
const loading = ref(false)
const error = ref('')

async function handleApply(code: string) {
  loading.value = true
  error.value = ''
  await new Promise(r => setTimeout(r, 800))
  if (code.toUpperCase() === 'SAVE20') {
    appliedCoupon.value = {
      code: 'SAVE20',
      promotion: {
        name: { en: '20% Off' },
        discountType: 'percentage',
        discountValue: 20
      }
    }
  } else {
    error.value = 'Invalid coupon code. Try "SAVE20"'
  }
  loading.value = false
}

function handleRemove() {
  appliedCoupon.value = null
}
</script>

<template>
  <ComponentDemo>
    <div class="w-full max-w-sm">
      <CCouponInput
        :applied-coupon="appliedCoupon"
        :loading="loading"
        :error="error"
        @apply="handleApply"
        @remove="handleRemove"
      />
      <p class="text-xs text-muted mt-2">Try code: <code class="px-1 py-0.5 bg-elevated rounded text-xs font-mono">SAVE20</code></p>
    </div>
  </ComponentDemo>
</template>
