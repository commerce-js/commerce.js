<script setup lang="ts">
// ---------------------------------------------------------------------------
// /account/forgot-password — buyer password-reset request (pre-auth)
// ---------------------------------------------------------------------------
// Posts to /api/storefront/auth/forgot-password. Always returns 200.
// ---------------------------------------------------------------------------

import { ref } from 'vue'

definePageMeta({
  layout: 'default',
  ssr: false,
})

const email = ref('')
const submitting = ref(false)
const submitted = ref(false)
const errorMessage = ref('')

async function handleSubmit() {
  if (submitting.value) return
  errorMessage.value = ''
  if (!email.value.trim()) {
    errorMessage.value = 'Email is required'
    return
  }
  submitting.value = true
  try {
    await $fetch('/api/storefront/auth/forgot-password', {
      method: 'POST',
      credentials: 'include',
      body: { email: email.value.trim().toLowerCase() },
    })
    submitted.value = true
  }
  catch (err: any) {
    errorMessage.value = err?.data?.message || err?.data?.statusMessage
      || 'Something went wrong — please try again.'
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="max-w-md mx-auto py-12 px-4">
    <UCard>
      <template #header>
        <h1 class="text-lg font-bold text-highlighted">
          Reset your password
        </h1>
      </template>

      <div v-if="submitted" class="space-y-4">
        <UAlert
          color="success"
          variant="subtle"
          icon="i-heroicons-envelope-20-solid"
          title="Check your email"
          description="If an account matches that address, we've sent a link to reset your password. The link expires in 1 hour."
        />
      </div>

      <form v-else class="space-y-4" @submit.prevent="handleSubmit">
        <p class="text-sm text-muted">
          Enter the email for your account. We'll send a link to set a new password.
        </p>
        <UFormField label="Email" required>
          <UInput
            v-model="email"
            type="email"
            autocomplete="email"
            autofocus
            :disabled="submitting"
            class="w-full"
          />
        </UFormField>
        <UAlert
          v-if="errorMessage"
          :title="errorMessage"
          color="error"
          variant="subtle"
          icon="i-heroicons-exclamation-triangle-20-solid"
        />
        <UButton
          type="submit"
          color="primary"
          size="lg"
          block
          :loading="submitting"
          :disabled="!email || submitting"
        >
          Send reset link
        </UButton>
      </form>
    </UCard>
  </div>
</template>
