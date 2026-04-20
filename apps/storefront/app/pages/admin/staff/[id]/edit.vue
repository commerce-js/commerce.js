<script setup lang="ts">
// ---------------------------------------------------------------------------
// /admin/staff/[id]/edit — owner edits a teammate's name + role. The session
// actor cannot demote themselves (UI guard); the platform's last-owner guard
// is the server-side safety net. Password change is a separate modal that
// only the actor can use on their own account (the API enforces id ===
// session.userId — see api/admin/staff/[id]/password.patch.ts).
// ---------------------------------------------------------------------------

import type { AdminUserSafe } from '@commercejs/platform'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
  ssr: false,
})

const route = useRoute()
const toast = useToast()
const { user } = useMerchantSession()

const staffId = computed(() => route.params.id as string)

if (user.value && user.value.role !== 'owner') {
  await navigateTo('/admin/staff')
}

const { data: staff, error, refresh } = await useFetch<AdminUserSafe>(
  () => `/api/admin/staff/${staffId.value}`,
  {
    credentials: 'include',
    server: false,
    key: 'admin-staff-edit',
    watch: [staffId],
  },
)

const form = reactive({
  name: '',
  role: 'admin' as 'owner' | 'admin' | 'editor',
})

watchEffect(() => {
  if (staff.value) {
    form.name = staff.value.name ?? ''
    form.role = staff.value.role
  }
})

const isSelf = computed(() => user.value?.id === staffId.value)
// Self-role-change foot-gun: even if not the last owner, demoting yourself
// could lock you out of staff management. Block it in UI; the platform's
// server-side last-owner guard still covers the worst case.
const roleDisabled = computed(() => isSelf.value)

const roleOptions = [
  { label: 'Owner — full access including staff management', value: 'owner' },
  { label: 'Admin — store operations, no staff management', value: 'admin' },
  { label: 'Editor — products and content only', value: 'editor' },
]

const submitting = ref(false)

async function onSave() {
  submitting.value = true
  try {
    const body: { name?: string; role?: typeof form.role } = {
      name: form.name.trim(),
    }
    if (!isSelf.value) body.role = form.role

    await $fetch(`/api/admin/staff/${staffId.value}`, {
      method: 'PATCH',
      credentials: 'include',
      body,
    })
    toast.add({ title: 'Changes saved', color: 'success' })
    await refresh()
  }
  catch (err: any) {
    toast.add({
      title: 'Could not save changes',
      description: err?.data?.statusMessage || err?.data?.message || err?.message,
      color: 'error',
    })
  }
  finally {
    submitting.value = false
  }
}

// ---- Password change (self-only) ----------------------------------------

const passwordOpen = ref(false)
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
})
const showCurrent = ref(false)
const showNew = ref(false)
const changingPassword = ref(false)

function openPasswordModal() {
  passwordForm.currentPassword = ''
  passwordForm.newPassword = ''
  showCurrent.value = false
  showNew.value = false
  passwordOpen.value = true
}

async function submitPassword() {
  if (passwordForm.newPassword.length < 8) {
    toast.add({ title: 'New password must be at least 8 characters', color: 'warning' })
    return
  }

  changingPassword.value = true
  try {
    await $fetch(`/api/admin/staff/${staffId.value}/password`, {
      method: 'PATCH',
      credentials: 'include',
      body: {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      },
    })
    toast.add({ title: 'Password updated', color: 'success' })
    passwordOpen.value = false
  }
  catch (err: any) {
    toast.add({
      title: 'Could not update password',
      description: err?.data?.statusMessage || err?.data?.message || err?.message,
      color: 'error',
    })
  }
  finally {
    changingPassword.value = false
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
          {{ staff?.email ?? 'Edit staff member' }}
        </h1>
      </div>
    </header>

    <UAlert
      v-if="error"
      color="error"
      variant="subtle"
      :title="error.statusCode === 404 ? 'Staff member not found' : 'Could not load staff member'"
      :description="error.message"
      icon="i-heroicons-exclamation-triangle-20-solid"
    />

    <UCard v-if="staff">
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="font-semibold text-highlighted">
            Profile
          </h2>
          <UBadge color="success" variant="subtle" size="sm">
            {{ staff.status }}
          </UBadge>
        </div>
      </template>

      <form class="flex flex-col gap-4" @submit.prevent="onSave">
        <UFormField label="Email" help="Email cannot be changed. Remove and re-add to use a different address.">
          <UInput :model-value="staff.email" disabled class="w-full" />
        </UFormField>

        <UFormField label="Name">
          <UInput v-model="form.name" placeholder="Full name (optional)" class="w-full" />
        </UFormField>

        <UFormField
          label="Role"
          :help="isSelf ? 'You cannot change your own role.' : undefined"
        >
          <USelect
            v-model="form.role"
            :items="roleOptions"
            value-key="value"
            :disabled="roleDisabled"
            class="w-full"
          />
        </UFormField>

        <div class="flex items-center justify-between pt-2">
          <UButton
            v-if="isSelf"
            type="button"
            icon="i-heroicons-key-20-solid"
            variant="outline"
            color="neutral"
            @click="openPasswordModal"
          >
            Change password
          </UButton>
          <span v-else />
          <UButton type="submit" color="primary" :loading="submitting">
            Save changes
          </UButton>
        </div>
      </form>
    </UCard>

    <UModal v-model:open="passwordOpen">
      <template #content>
        <form class="p-6 flex flex-col gap-4" @submit.prevent="submitPassword">
          <h3 class="text-lg font-semibold text-highlighted">
            Change password
          </h3>
          <p class="text-sm text-muted">
            Enter your current password and the new one. You'll stay signed in.
          </p>

          <UFormField label="Current password" required>
            <div class="flex gap-2">
              <UInput
                v-model="passwordForm.currentPassword"
                :type="showCurrent ? 'text' : 'password'"
                autocomplete="current-password"
                class="flex-1 w-full"
              />
              <UButton
                type="button"
                :icon="showCurrent ? 'i-heroicons-eye-slash-20-solid' : 'i-heroicons-eye-20-solid'"
                variant="outline"
                color="neutral"
                @click="showCurrent = !showCurrent"
              />
            </div>
          </UFormField>

          <UFormField label="New password" required help="At least 8 characters.">
            <div class="flex gap-2">
              <UInput
                v-model="passwordForm.newPassword"
                :type="showNew ? 'text' : 'password'"
                autocomplete="new-password"
                class="flex-1 w-full"
              />
              <UButton
                type="button"
                :icon="showNew ? 'i-heroicons-eye-slash-20-solid' : 'i-heroicons-eye-20-solid'"
                variant="outline"
                color="neutral"
                @click="showNew = !showNew"
              />
            </div>
          </UFormField>

          <div class="flex justify-end gap-2 pt-2">
            <UButton type="button" variant="ghost" color="neutral" @click="passwordOpen = false">
              Cancel
            </UButton>
            <UButton type="submit" color="primary" :loading="changingPassword">
              Update password
            </UButton>
          </div>
        </form>
      </template>
    </UModal>
  </div>
</template>
