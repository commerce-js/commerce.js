<script setup lang="ts">
// ---------------------------------------------------------------------------
// /admin/staff/new — owner sets up a teammate with a local password. After
// the create succeeds we surface the password ONCE in a banner so the owner
// can copy it and share out-of-band; redirect to the list happens on
// "Done" (not auto, so the password stays visible until acknowledged).
//
// The email-workstream plan replaces this UI with a "send invite" button
// that emails an acceptance token instead — at that point this page goes
// away and `status: 'invited'` rows appear in the list.
// ---------------------------------------------------------------------------

import type { AdminUserSafe } from '@commercejs/platform'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
  ssr: false,
})

const toast = useToast()
const { user } = useMerchantSession()

if (user.value && user.value.role !== 'owner') {
  // Owners only — bounce non-owners out before the form renders.
  await navigateTo('/admin/staff')
}

const form = reactive({
  email: '',
  password: '',
  name: '',
  role: 'admin' as 'owner' | 'admin' | 'editor',
})

const showPassword = ref(false)
const submitting = ref(false)
const created = ref<AdminUserSafe | null>(null)
const sharedPassword = ref('')

const roleOptions = [
  { label: 'Owner — full access including staff management', value: 'owner' },
  { label: 'Admin — store operations, no staff management', value: 'admin' },
  { label: 'Editor — products and content only', value: 'editor' },
]

function generatePassword() {
  // 16 chars, alpha-num + symbol, avoids look-alikes (0/O, 1/l). Random
  // enough for a one-time share; the new staff can rotate it after login.
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#%&'
  const arr = new Uint32Array(16)
  crypto.getRandomValues(arr)
  form.password = Array.from(arr, n => chars[n % chars.length]).join('')
  showPassword.value = true
}

async function onSubmit() {
  const email = form.email.trim().toLowerCase()
  if (!email) {
    toast.add({ title: 'Email is required', color: 'warning' })
    return
  }
  if (form.password.length < 8) {
    toast.add({ title: 'Password must be at least 8 characters', color: 'warning' })
    return
  }

  submitting.value = true
  try {
    const result = await $fetch<AdminUserSafe>('/api/admin/staff', {
      method: 'POST',
      credentials: 'include',
      body: {
        email,
        password: form.password,
        name: form.name.trim() || undefined,
        role: form.role,
      },
    })
    sharedPassword.value = form.password
    created.value = result
    toast.add({ title: 'Staff member created', color: 'success' })
  }
  catch (err: any) {
    toast.add({
      title: 'Could not create staff member',
      description: err?.data?.statusMessage || err?.data?.message || err?.message,
      color: 'error',
    })
  }
  finally {
    submitting.value = false
  }
}

async function copyShared() {
  try {
    await navigator.clipboard.writeText(sharedPassword.value)
    toast.add({ title: 'Password copied', color: 'success' })
  }
  catch {
    toast.add({ title: 'Could not copy — copy manually', color: 'warning' })
  }
}
</script>

<template>
  <div class="flex flex-col gap-6 max-w-2xl">
    <header class="flex items-center justify-between">
      <div>
        <NuxtLink
          to="/admin/staff"
          class="text-sm text-muted hover:text-primary flex items-center gap-1"
        >
          <UIcon name="i-heroicons-arrow-left-20-solid" />
          Back to staff
        </NuxtLink>
        <h1 class="text-2xl font-bold text-highlighted mt-1">
          Add staff member
        </h1>
      </div>
    </header>

    <UCard v-if="!created">
      <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
        <UFormField label="Email" required>
          <UInput
            v-model="form.email"
            type="email"
            autocomplete="off"
            placeholder="teammate@example.com"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Name" help="Shown in audit trails and the staff list.">
          <UInput v-model="form.name" placeholder="Full name (optional)" class="w-full" />
        </UFormField>

        <UFormField label="Role" required>
          <USelect
            v-model="form.role"
            :items="roleOptions"
            value-key="value"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Password" required help="At least 8 characters. You'll share this with the new staff member.">
          <div class="flex gap-2">
            <UInput
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="new-password"
              class="flex-1 w-full"
            />
            <UButton
              type="button"
              :icon="showPassword ? 'i-heroicons-eye-slash-20-solid' : 'i-heroicons-eye-20-solid'"
              variant="outline"
              color="neutral"
              @click="showPassword = !showPassword"
            />
            <UButton
              type="button"
              icon="i-heroicons-sparkles-20-solid"
              variant="outline"
              color="neutral"
              @click="generatePassword"
            >
              Generate
            </UButton>
          </div>
        </UFormField>

        <div class="flex items-center justify-end gap-2 pt-2">
          <UButton type="button" variant="ghost" color="neutral" to="/admin/staff">
            Cancel
          </UButton>
          <UButton type="submit" color="primary" :loading="submitting">
            Create staff member
          </UButton>
        </div>
      </form>
    </UCard>

    <UCard v-else>
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-check-circle-20-solid" class="text-success text-xl" />
          <h2 class="font-semibold text-highlighted">
            Staff member created
          </h2>
        </div>
      </template>

      <div class="flex flex-col gap-4">
        <p class="text-sm">
          <strong>{{ created.email }}</strong> can now sign in to <code>/admin/login</code>. Share the password below with them — we won't show it again.
        </p>

        <div class="flex items-center gap-2 p-3 rounded bg-elevated border border-default">
          <code class="flex-1 font-mono text-sm break-all">{{ sharedPassword }}</code>
          <UButton
            icon="i-heroicons-clipboard-20-solid"
            variant="outline"
            color="neutral"
            size="sm"
            @click="copyShared"
          >
            Copy
          </UButton>
        </div>

        <UAlert
          color="warning"
          variant="subtle"
          icon="i-heroicons-exclamation-triangle-20-solid"
          title="One-time view"
          description="Closing this page or navigating away will discard the password. The new staff member can change it after their first sign-in."
        />

        <div class="flex items-center justify-end gap-2 pt-2">
          <UButton variant="ghost" color="neutral" to="/admin/staff/new">
            Add another
          </UButton>
          <UButton color="primary" to="/admin/staff">
            Done
          </UButton>
        </div>
      </div>
    </UCard>
  </div>
</template>
