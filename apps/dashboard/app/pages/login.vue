<script setup lang="ts">
definePageMeta({ layout: false, auth: false })

interface SessionResponse {
  user: { id: string, email: string, name: string, role: string } | null
  hasAnyOperator: boolean
}

const { data: session, refresh } = await useFetch<SessionResponse>('/api/auth/session')

// If already signed in, bounce to the merchants list.
if (session.value?.user) {
  await navigateTo('/merchants')
}

const isFirstRun = computed(() => !session.value?.hasAnyOperator)

const name = ref('')
const email = ref('')
const password = ref('')
const submitting = ref(false)
const error = ref<string | null>(null)

async function submit() {
  error.value = null
  submitting.value = true
  try {
    const path = isFirstRun.value ? '/api/auth/register' : '/api/auth/login'
    const body = isFirstRun.value
      ? { name: name.value, email: email.value, password: password.value }
      : { email: email.value, password: password.value }
    await $fetch(path, { method: 'POST', body })
    await refresh()
    await navigateTo('/merchants')
  }
  catch (err: any) {
    error.value = err?.data?.message || err?.message || 'Sign-in failed. Try again.'
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-950 flex items-center justify-center">
    <div class="w-full max-w-md px-6">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-white tracking-tight">
          CommerceJS <span class="text-primary-400">Cloud</span>
        </h1>
        <p class="mt-2 text-gray-400">
          Operator dashboard — manage merchants on the platform
        </p>
      </div>

      <UCard class="bg-gray-900 border-gray-800">
        <template #header>
          <div>
            <h2 class="text-lg font-semibold text-white">
              {{ isFirstRun ? 'Create the first admin account' : 'Sign in' }}
            </h2>
            <p v-if="isFirstRun" class="mt-1 text-sm text-gray-400">
              No operators exist yet. This form registers you as the first admin;
              it auto-closes after the account is created.
            </p>
          </div>
        </template>

        <form class="space-y-4" @submit.prevent="submit">
          <UFormField v-if="isFirstRun" label="Name" required>
            <UInput v-model="name" placeholder="Your name" size="lg" autocomplete="name" required />
          </UFormField>

          <UFormField label="Email" required>
            <UInput
              v-model="email"
              type="email"
              placeholder="you@example.com"
              size="lg"
              autocomplete="email"
              required
            />
          </UFormField>

          <UFormField label="Password" required :hint="isFirstRun ? 'At least 10 characters' : undefined">
            <UInput
              v-model="password"
              type="password"
              placeholder="••••••••"
              size="lg"
              :autocomplete="isFirstRun ? 'new-password' : 'current-password'"
              required
            />
          </UFormField>

          <p v-if="error" class="text-sm text-red-400">
            {{ error }}
          </p>

          <UButton
            type="submit"
            block
            size="lg"
            color="primary"
            :loading="submitting"
            :label="isFirstRun ? 'Create admin and continue' : 'Sign in'"
          />
        </form>
      </UCard>
    </div>
  </div>
</template>
