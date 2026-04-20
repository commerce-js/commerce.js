<script setup lang="ts">
// ---------------------------------------------------------------------------
// /admin/staff — list staff users on this merchant. Owners see add / edit /
// remove actions; admins and editors see a read-only directory. CSR-only.
//
// Status badge is forward-compat for the email-workstream invite flow —
// every row in T09 renders 'active'. Role triad is owner / admin / editor.
// ---------------------------------------------------------------------------

import type { AdminUserSafe } from '@commercejs/platform'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
  ssr: false,
})

const toast = useToast()
const { user } = useMerchantSession()

const { data, pending, error, refresh } = await useFetch<AdminUserSafe[]>(
  '/api/admin/staff',
  {
    credentials: 'include',
    server: false,
    key: 'admin-staff-list',
  },
)

const items = computed(() => data.value ?? [])
const total = computed(() => items.value.length)
const isOwner = computed(() => user.value?.role === 'owner')

const columns = [
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'role', header: 'Role' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'actions', header: '', size: 120 },
]

function roleColor(role: string) {
  if (role === 'owner') return 'primary'
  if (role === 'admin') return 'info'
  return 'neutral'
}

function statusColor(status: string) {
  if (status === 'active') return 'success'
  if (status === 'invited') return 'warning'
  return 'neutral'
}

const confirmRemoveOpen = ref(false)
const pendingRemove = ref<AdminUserSafe | null>(null)
const removing = ref(false)

function askRemove(s: AdminUserSafe) {
  pendingRemove.value = s
  confirmRemoveOpen.value = true
}

async function confirmRemove() {
  if (!pendingRemove.value) return
  removing.value = true
  try {
    await $fetch(`/api/admin/staff/${pendingRemove.value.id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    toast.add({ title: 'Staff member removed', color: 'success' })
    confirmRemoveOpen.value = false
    pendingRemove.value = null
    await refresh()
  }
  catch (err: any) {
    toast.add({
      title: 'Could not remove staff member',
      description: err?.data?.statusMessage || err?.data?.message || err?.message,
      color: 'error',
    })
  }
  finally {
    removing.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-highlighted">
          Staff
        </h1>
        <p class="text-sm text-muted mt-1">
          {{ total }} total
        </p>
      </div>
      <UButton
        v-if="isOwner"
        to="/admin/staff/new"
        icon="i-heroicons-plus-20-solid"
        color="primary"
      >
        Add staff
      </UButton>
    </header>

    <UAlert
      v-if="error"
      color="error"
      variant="subtle"
      title="Could not load staff"
      :description="error.message"
      icon="i-heroicons-exclamation-triangle-20-solid"
    />

    <UAlert
      v-if="!isOwner"
      color="neutral"
      variant="subtle"
      icon="i-heroicons-information-circle-20-solid"
      title="Read-only"
      description="Only owners can add, edit, or remove staff members."
    />

    <UCard v-if="!pending && items.length === 0">
      <div class="flex flex-col items-center text-center py-10 gap-3">
        <UIcon name="i-heroicons-user-group-20-solid" class="text-4xl text-dimmed" />
        <div>
          <p class="font-medium text-highlighted">
            No staff members yet
          </p>
          <p class="text-sm text-muted mt-1">
            Add a teammate so multiple people can run the store.
          </p>
        </div>
        <UButton
          v-if="isOwner"
          to="/admin/staff/new"
          icon="i-heroicons-plus-20-solid"
          color="primary"
        >
          Add staff
        </UButton>
      </div>
    </UCard>

    <UCard v-else>
      <UTable :data="items" :columns="columns" :loading="pending">
        <template #email-cell="{ row }">
          <div class="flex flex-col">
            <span class="font-medium text-highlighted">{{ row.original.email }}</span>
            <span v-if="row.original.id === user?.id" class="text-xs text-muted">
              (you)
            </span>
          </div>
        </template>
        <template #name-cell="{ row }">
          <span class="text-sm">{{ row.original.name || '—' }}</span>
        </template>
        <template #role-cell="{ row }">
          <UBadge :color="roleColor(row.original.role)" variant="subtle" size="sm">
            {{ row.original.role }}
          </UBadge>
        </template>
        <template #status-cell="{ row }">
          <UBadge :color="statusColor(row.original.status)" variant="subtle" size="sm">
            {{ row.original.status }}
          </UBadge>
        </template>
        <template #actions-cell="{ row }">
          <div class="flex items-center justify-end gap-1">
            <UButton
              v-if="isOwner"
              :to="`/admin/staff/${row.original.id}/edit`"
              icon="i-heroicons-pencil-square-20-solid"
              variant="ghost"
              color="neutral"
              size="sm"
            />
            <UButton
              v-if="isOwner && row.original.id !== user?.id"
              icon="i-heroicons-trash-20-solid"
              variant="ghost"
              color="error"
              size="sm"
              @click="askRemove(row.original)"
            />
          </div>
        </template>
      </UTable>
    </UCard>

    <UModal v-model:open="confirmRemoveOpen">
      <template #content>
        <div class="p-6 flex flex-col gap-4">
          <h3 class="text-lg font-semibold text-highlighted">
            Remove staff member?
          </h3>
          <p class="text-sm text-muted">
            <strong>{{ pendingRemove?.email }}</strong> will lose access to this store immediately. The last owner cannot be removed.
          </p>
          <div class="flex justify-end gap-2">
            <UButton variant="ghost" color="neutral" @click="confirmRemoveOpen = false">
              Cancel
            </UButton>
            <UButton color="error" :loading="removing" @click="confirmRemove">
              Remove staff member
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
