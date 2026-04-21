<script setup lang="ts">
// ---------------------------------------------------------------------------
// /account/reset/:token — buyer password-reset completion (pre-auth)
// ---------------------------------------------------------------------------

import { computed, onMounted, ref } from 'vue'

definePageMeta({
  layout: 'default',
  ssr: false,
})

const route = useRoute()
const toast = useToast()

const token = computed(() => {
  const raw = route.params.token
  return Array.isArray(raw) ? raw[0] : raw
})

type Status = 'loading' | 'ready' | 'invalid'
const status = ref<Status>('loading')
const resetEmail = ref('')
const expiresAt = ref('')
const password = ref('')
const confirm = ref('')
const showPassword = ref(false)
const submitting = ref(false)
const errorMessage = ref('')

const expiresLabel = computed(() => {
  if (!expiresAt.value) return ''
  const d = new Date(expiresAt.value)
  if (Number.isNaN(d.getTime())) return expiresAt.value
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
})

onMounted(async () => {
  if (!token.value) {
    status.value = 'invalid'
    return
  }
  try {
    const res = await $fetch<{ email: string, expiresAt: string }>(
      `/api/storefront/auth/reset/${encodeURIComponent(token.value)}`,
      { credentials: 'include' },
    )
    resetEmail.value = res.email
    expiresAt.value = res.expiresAt
    status.value = 'ready'
  }
  catch {
    status.value = 'invalid'
  }
})

async function handleSubmit() {
  if (submitting.value) return
  errorMessage.value = ''
  if (password.value.length < 8) {
    errorMessage.value = 'Password must be at least 8 characters'
    return
  }
  if (password.value !== confirm.value) {
    errorMessage.value = 'Passwords do not match'
    return
  }
  submitting.value = true
  try {
    await $fetch(`/api/storefront/auth/reset/${encodeURIComponent(token.value!)}/complete`, {
      method: 'POST',
      credentials: 'include',
      body: { password: password.value },
    })
    toast.add({ title: 'Password updated — you are signed in', color: 'success' })
    await navigateTo('/')
  }
  catch (err: any) {
    errorMessage.value
      = err?.data?.message || err?.data?.statusMessage || 'Could not reset password'
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
          Set new password
        </h1>
      </template>

      <div v-if="status === 'loading'" class="flex items-center gap-2 py-8 justify-center text-muted">
        <UIcon name="i-heroicons-arrow-path-20-solid" class="animate-spin" />
        <span>Checking link…</span>
      </div>

      <div v-else-if="status === 'invalid'" class="space-y-4">
        <UAlert
          color="error"
          variant="subtle"
          icon="i-heroicons-exclamation-triangle-20-solid"
          title="This link is no longer valid"
          description="It may have expired (links work for 1 hour), already been used, or been copied incorrectly."
        />
        <UButton color="primary" to="/account/forgot-password" block>
          Request a new link
        </UButton>
      </div>

      <form v-else class="space-y-4" @submit.prevent="handleSubmit">
        <p class="text-sm text-muted">
          Resetting password for <strong class="text-highlighted">{{ resetEmail }}</strong>. Link expires {{ expiresLabel }}.
        </p>
        <UFormField label="New password" required help="At least 8 characters.">
          <div class="flex gap-2">
            <UInput
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="new-password"
              autofocus
              :disabled="submitting"
              class="flex-1 w-full"
            />
            <UButton
              type="button"
              :icon="showPassword ? 'i-heroicons-eye-slash-20-solid' : 'i-heroicons-eye-20-solid'"
              variant="outline"
              color="neutral"
              @click="showPassword = !showPassword"
            />
          </div>
        </UFormField>
        <UFormField label="Confirm new password" required>
          <UInput
            v-model="confirm"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="new-password"
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
          :disabled="!password || !confirm || submitting"
        >
          Set password
        </UButton>
      </form>
    </UCard>
  </div>
</template>
