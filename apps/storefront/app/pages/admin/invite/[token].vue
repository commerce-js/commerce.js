<script setup lang="ts">
// ---------------------------------------------------------------------------
// /admin/invite/:token — pre-auth invite acceptance. Shown when a new staff
// member clicks the link in their invite email. Fetches the token to
// confirm it's valid + look up the invited email, then prompts for a
// password. POSTs to /api/admin/invite/:token/accept which issues the
// merchant session cookie, so on success we navigate straight to /admin
// without bouncing through /admin/login.
// ---------------------------------------------------------------------------

import { computed, onMounted, ref } from 'vue'

definePageMeta({
  // `admin` layout assumes a session + renders the sidebar. This is a
  // pre-auth page, so use the blank layout like /admin/login.
  layout: false,
  ssr: false,
})

const route = useRoute()
const { fetchSession } = useMerchantSession()
const toast = useToast()

const token = computed(() => {
  const raw = route.params.token
  return Array.isArray(raw) ? raw[0] : raw
})

type Status = 'loading' | 'ready' | 'invalid'
const status = ref<Status>('loading')
const inviteEmail = ref<string>('')
const expiresAt = ref<string>('')
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
      `/api/admin/invite/${encodeURIComponent(token.value)}`,
      { credentials: 'include' },
    )
    inviteEmail.value = res.email
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
    await $fetch(`/api/admin/invite/${encodeURIComponent(token.value!)}/accept`, {
      method: 'POST',
      credentials: 'include',
      body: { password: password.value },
    })
    await fetchSession()
    toast.add({ title: 'Welcome aboard', color: 'success' })
    await navigateTo('/admin')
  }
  catch (err: any) {
    errorMessage.value
      = err?.data?.message || err?.data?.statusMessage || 'Could not accept invite'
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
          <UIcon name="i-heroicons-envelope-20-solid" class="text-2xl text-primary" />
          <h1 class="text-lg font-bold text-highlighted">
            Accept invite
          </h1>
        </div>
      </template>

      <div v-if="status === 'loading'" class="flex items-center gap-2 py-8 justify-center text-muted">
        <UIcon name="i-heroicons-arrow-path-20-solid" class="animate-spin" />
        <span>Checking invite…</span>
      </div>

      <div v-else-if="status === 'invalid'" class="space-y-4">
        <UAlert
          color="error"
          variant="subtle"
          icon="i-heroicons-exclamation-triangle-20-solid"
          title="This invite is no longer valid"
          description="It may have expired, already been used, or the link is incorrect. Ask the person who invited you to send a new one."
        />
        <UButton color="primary" to="/admin/login" block>
          Go to sign in
        </UButton>
      </div>

      <form v-else class="space-y-4" @submit.prevent="handleSubmit">
        <p class="text-sm text-muted">
          Setting up access for <strong class="text-highlighted">{{ inviteEmail }}</strong>. This invite expires on {{ expiresLabel }}.
        </p>

        <UFormField label="Email">
          <UInput :model-value="inviteEmail" disabled class="w-full" />
        </UFormField>

        <UFormField label="Choose a password" required help="At least 8 characters.">
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

        <UFormField label="Confirm password" required>
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
          Set password and continue
        </UButton>
      </form>
    </UCard>
  </div>
</template>
