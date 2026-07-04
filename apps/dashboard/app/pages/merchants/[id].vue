<script setup lang="ts">
interface Domain {
  id: string
  domain: string
  verified: boolean
  sslStatus: string
  createdAt: string
}

interface Merchant {
  id: string
  name: string
  email: string
  subdomain: string
  plan: string
  status: 'provisioning' | 'active' | 'suspended' | string
  currency: string
  locale: string
  customDomain: string | null
  trialEndsAt: string | null
  databaseUrl: string | null
  neonProjectId: string | null
  neonBranchId: string | null
  createdAt: string
  updatedAt: string
  domains?: Domain[]
}

const route = useRoute()
const id = computed(() => route.params.id as string)

// Forward the operator's session cookie on SSR — /api/merchants/:id is now
// auth-gated, and in-process SSR fetches don't inherit request headers.
const { data: merchant, refresh } = await useFetch<Merchant>(`/api/merchants/${id.value}`, {
  headers: import.meta.server ? useRequestHeaders(['cookie']) : undefined,
})

// Auto-refresh while provisioning.
let timer: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  timer = setInterval(() => {
    if (merchant.value?.status === 'provisioning') refresh()
  }, 5000)
})
onUnmounted(() => {
  if (timer) clearInterval(timer)
})

function statusColor(status: string): 'neutral' | 'success' | 'warning' | 'error' {
  switch (status) {
    case 'active': return 'success'
    case 'provisioning': return 'warning'
    case 'suspended': return 'error'
    default: return 'neutral'
  }
}

// --- Actions ---
const retrying = ref(false)
const retryMessage = ref<string | null>(null)
const retryError = ref<string | null>(null)

async function retryProvision() {
  retryMessage.value = null
  retryError.value = null
  retrying.value = true
  try {
    const res = await $fetch<{ enqueued: boolean, reason?: string }>(
      `/api/merchants/${id.value}/provision`,
      { method: 'POST' },
    )
    retryMessage.value = res.enqueued
      ? 'Provisioning job queued — this page will update when it completes.'
      : res.reason || 'Nothing to do.'
    await refresh()
  }
  catch (err: any) {
    retryError.value = err?.data?.message || err?.message || 'Failed to queue provisioning'
  }
  finally {
    retrying.value = false
  }
}

const deleting = ref(false)
const deleteError = ref<string | null>(null)

async function remove() {
  if (!confirm(`Delete merchant "${merchant.value?.name}"? This removes the control-DB row; the Neon project is retained and must be cleaned up separately.`)) return
  deleteError.value = null
  deleting.value = true
  try {
    await $fetch(`/api/merchants/${id.value}`, { method: 'DELETE' })
    await navigateTo('/merchants')
  }
  catch (err: any) {
    deleteError.value = err?.data?.message || err?.message || 'Delete failed'
  }
  finally {
    deleting.value = false
  }
}
</script>

<template>
  <UDashboardPanel v-if="merchant" id="merchant-detail">
    <template #header>
      <UDashboardNavbar :title="merchant.name">
        <template #leading>
          <UButton
            to="/merchants"
            icon="i-lucide-arrow-left"
            variant="ghost"
            color="neutral"
            square
          />
        </template>

        <template #right>
          <UBadge
            :label="merchant.status"
            :color="statusColor(merchant.status)"
            variant="subtle"
            class="capitalize"
          />
          <UButton
            v-if="merchant.status !== 'active'"
            icon="i-lucide-refresh-cw"
            label="Retry provisioning"
            color="primary"
            variant="outline"
            :loading="retrying"
            @click="retryProvision"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="px-6 py-4 space-y-6">
        <UAlert
          v-if="retryMessage"
          color="primary"
          variant="soft"
          icon="i-lucide-info"
          :description="retryMessage"
        />
        <UAlert
          v-if="retryError"
          color="error"
          variant="soft"
          icon="i-lucide-alert-triangle"
          :description="retryError"
        />

        <!-- Overview -->
        <UCard>
          <template #header>
            <h2 class="text-lg font-semibold">
              Overview
            </h2>
          </template>

          <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <div>
              <dt class="text-muted">
                Owner email
              </dt>
              <dd>{{ merchant.email }}</dd>
            </div>
            <div>
              <dt class="text-muted">
                Storefront URL
              </dt>
              <dd class="font-mono">
                https://{{ merchant.subdomain }}.commercejs.cloud
              </dd>
            </div>
            <div>
              <dt class="text-muted">
                Plan
              </dt>
              <dd class="capitalize">
                {{ merchant.plan }}
              </dd>
            </div>
            <div>
              <dt class="text-muted">
                Currency / locale
              </dt>
              <dd>{{ merchant.currency }} · {{ merchant.locale }}</dd>
            </div>
            <div v-if="merchant.trialEndsAt">
              <dt class="text-muted">
                Trial ends
              </dt>
              <dd>{{ new Date(merchant.trialEndsAt).toLocaleString() }}</dd>
            </div>
            <div>
              <dt class="text-muted">
                Created
              </dt>
              <dd>{{ new Date(merchant.createdAt).toLocaleString() }}</dd>
            </div>
          </dl>
        </UCard>

        <!-- Database / infra -->
        <UCard>
          <template #header>
            <h2 class="text-lg font-semibold">
              Infrastructure
            </h2>
          </template>

          <div v-if="merchant.status === 'provisioning'" class="flex items-center gap-3 text-muted">
            <UIcon name="i-lucide-loader-2" class="animate-spin" />
            Provisioning Neon branch + applying schema… this page polls every 5 s.
          </div>

          <dl v-else class="grid grid-cols-1 gap-y-4 text-sm">
            <div>
              <dt class="text-muted">
                Neon project ID
              </dt>
              <dd class="font-mono break-all">
                {{ merchant.neonProjectId ?? '—' }}
              </dd>
            </div>
            <div>
              <dt class="text-muted">
                Neon branch ID
              </dt>
              <dd class="font-mono break-all">
                {{ merchant.neonBranchId ?? '—' }}
              </dd>
            </div>
            <div>
              <dt class="text-muted">
                Database URL
              </dt>
              <dd class="font-mono text-xs break-all">
                <!-- Show only the host portion; hide the password. -->
                {{
                  merchant.databaseUrl
                    ? merchant.databaseUrl.replace(/:[^@/:]+@/, ':***@')
                    : '—'
                }}
              </dd>
            </div>
          </dl>
        </UCard>

        <!-- Domains -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold">
                Custom domains
              </h2>
              <UBadge
                v-if="merchant.domains?.length"
                :label="`${merchant.domains.length} configured`"
                color="neutral"
                variant="subtle"
              />
            </div>
          </template>

          <p v-if="!merchant.domains?.length" class="text-sm text-muted">
            No custom domains yet. Add one via POST
            <code class="font-mono">/api/merchants/{{ merchant.id }}/domains</code>.
          </p>

          <UTable
            v-else
            :data="merchant.domains"
            :columns="[
              { accessorKey: 'domain', header: 'Domain' },
              { accessorKey: 'verified', header: 'Verified' },
              { accessorKey: 'sslStatus', header: 'SSL' },
            ]"
          >
            <template #domain-cell="{ row }">
              <span class="font-mono">{{ row.original.domain }}</span>
            </template>
            <template #verified-cell="{ row }">
              <UBadge
                :label="row.original.verified ? 'yes' : 'no'"
                :color="row.original.verified ? 'success' : 'warning'"
                variant="subtle"
              />
            </template>
            <template #sslStatus-cell="{ row }">
              <UBadge :label="row.original.sslStatus" color="neutral" variant="subtle" class="capitalize" />
            </template>
          </UTable>
        </UCard>

        <!-- Danger zone -->
        <UCard :ui="{ root: 'border-red-500/40' }">
          <template #header>
            <h2 class="text-lg font-semibold text-red-400">
              Danger zone
            </h2>
          </template>

          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-sm font-medium">
                Delete merchant
              </p>
              <p class="text-sm text-muted">
                Removes the control-DB row and all related API keys / domains.
                The Neon project is retained; delete it separately via the Neon console.
              </p>
            </div>
            <UButton
              color="error"
              variant="outline"
              icon="i-lucide-trash-2"
              label="Delete"
              :loading="deleting"
              @click="remove"
            />
          </div>

          <UAlert
            v-if="deleteError"
            class="mt-4"
            color="error"
            variant="soft"
            icon="i-lucide-alert-triangle"
            :description="deleteError"
          />
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
