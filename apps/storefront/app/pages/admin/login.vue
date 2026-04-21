<script setup lang="ts">
// ---------------------------------------------------------------------------
// /admin/login — merchant staff sign-in. Centered form, no layout.
// POSTs to /api/admin/auth/login (on the dashboard); on 200 navigates to
// the ?redirect= path or /admin. On non-200, shows a single generic
// "Invalid email or password" message — matches T01's error hygiene, no
// user-enumeration leak.
// ---------------------------------------------------------------------------

definePageMeta({
  layout: false,
})

const { fetchSession } = useMerchantSession()
const route = useRoute()

const email = ref('')
const password = ref('')
const submitting = ref(false)
const errorMessage = ref('')

async function handleSubmit() {
  if (submitting.value) return
  submitting.value = true
  errorMessage.value = ''

  try {
    await $fetch('/api/admin/auth/login', {
      method: 'POST',
      credentials: 'include',
      body: { email: email.value.trim(), password: password.value },
    })

    // Warm the shared session state before we navigate.
    await fetchSession()

    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/admin'
    const safe = redirect.startsWith('/admin') ? redirect : '/admin'
    await navigateTo(safe)
  }
  catch {
    errorMessage.value = 'Invalid email or password'
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
          <UIcon name="i-heroicons-shopping-bag-20-solid" class="text-2xl text-primary" />
          <h1 class="text-lg font-bold text-highlighted">
            Merchant sign-in
          </h1>
        </div>
      </template>

      <form class="space-y-4" @submit.prevent="handleSubmit">
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

        <UFormField label="Password" required>
          <UInput
            v-model="password"
            type="password"
            autocomplete="current-password"
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
          :disabled="!email || !password || submitting"
        >
          Sign in
        </UButton>

        <div class="text-center">
          <NuxtLink to="/admin/forgot-password" class="text-sm text-muted hover:text-primary">
            Forgot password?
          </NuxtLink>
        </div>
      </form>
    </UCard>
  </div>
</template>
