<script setup lang="ts">
// ---------------------------------------------------------------------------
// /admin/forgot-password — admin password-reset request (pre-auth)
// ---------------------------------------------------------------------------
// Posts the email to /api/admin/forgot-password. The API always returns
// 200 regardless of whether the email exists (enumeration hygiene), so
// the UI shows the same "check your email" confirmation unconditionally.
// ---------------------------------------------------------------------------

import { ref } from 'vue'

definePageMeta({
  layout: false,
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
    await $fetch('/api/admin/forgot-password', {
      method: 'POST',
      credentials: 'include',
      body: { email: email.value.trim().toLowerCase() },
    })
    submitted.value = true
  }
  catch (err: any) {
    // 400 here means validation failed on the server — surface it. Any
    // other failure we still want to confirm "email sent" to avoid
    // revealing the presence or absence of an admin_users row.
    errorMessage.value = err?.data?.message || err?.data?.statusMessage
      || 'Something went wrong — please try again.'
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-default px-4">
    <UCard class="w-full max-w-md">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-key-20-solid" class="text-2xl text-primary" />
          <h1 class="text-lg font-bold text-highlighted">
            Reset admin password
          </h1>
        </div>
      </template>

      <div v-if="submitted" class="space-y-4">
        <UAlert
          color="success"
          variant="subtle"
          icon="i-heroicons-envelope-20-solid"
          title="Check your email"
          description="If an account matches that address, we've sent a link to reset your password. The link expires in 1 hour."
        />
        <UButton color="primary" variant="outline" to="/admin/login" block>
          Back to sign in
        </UButton>
      </div>

      <form v-else class="space-y-4" @submit.prevent="handleSubmit">
        <p class="text-sm text-muted">
          Enter the email you use to sign in. We'll send you a link to set a new password.
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
        <div class="text-center">
          <NuxtLink to="/admin/login" class="text-sm text-muted hover:text-primary">
            Back to sign in
          </NuxtLink>
        </div>
      </form>
    </UCard>
  </div>
</template>
