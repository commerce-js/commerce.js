<script setup lang="ts">
const name = ref('')
const email = ref('')
const subdomain = ref('')
const plan = ref('trial')
const currency = ref('SAR')
const locale = ref('ar-SA')

const submitting = ref(false)
const error = ref<string | null>(null)

// Auto-derive subdomain from name as the operator types, unless they've
// manually edited it.
const subdomainDirty = ref(false)
watch(name, (v) => {
  if (!subdomainDirty.value) {
    subdomain.value = v.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-+|-+$/g, '')
  }
})

const subdomainError = computed(() => {
  const s = subdomain.value
  if (!s) return null
  if (isReservedSubdomain(s)) return `'${s}' is a reserved subdomain`
  if (s.length < 2) return 'Subdomain must be at least 2 characters'
  if (s.length > 63) return 'Subdomain must be 63 characters or fewer'
  return null
})

async function submit() {
  error.value = null
  submitting.value = true
  try {
    const body = {
      name: name.value,
      email: email.value,
      subdomain: subdomain.value || undefined,
      plan: plan.value,
      currency: currency.value,
      locale: locale.value,
    }
    const merchant = await $fetch<{ id: string }>('/api/merchants', {
      method: 'POST',
      body,
    })
    await navigateTo(`/merchants/${merchant.id}`)
  }
  catch (err: any) {
    error.value = err?.data?.message || err?.message || 'Failed to create merchant'
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="merchant-new">
    <template #header>
      <UDashboardNavbar title="New merchant" />
    </template>

    <template #body>
      <div class="px-6 py-4 max-w-2xl">
        <form class="space-y-5" @submit.prevent="submit">
          <UCard>
            <div class="space-y-4">
              <UFormField label="Store name" required hint="Displayed to buyers on the storefront">
                <UInput v-model="name" placeholder="Acme Coffee Roasters" size="lg" required />
              </UFormField>

              <UFormField label="Owner email" required hint="Used for billing + primary contact">
                <UInput v-model="email" type="email" placeholder="owner@acme.com" size="lg" required />
              </UFormField>

              <UFormField
                label="Subdomain"
                required
                :hint="subdomainError ? undefined : `Storefront will be at https://${subdomain || '<subdomain>'}.commercejs.cloud`"
                :error="subdomainError ?? undefined"
              >
                <UInput
                  v-model="subdomain"
                  placeholder="acme"
                  size="lg"
                  required
                  :color="subdomainError ? 'error' : undefined"
                  @input="subdomainDirty = true"
                />
              </UFormField>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <UFormField label="Plan">
                  <USelect
                    v-model="plan"
                    :items="[
                      { label: 'Trial', value: 'trial' },
                      { label: 'Starter', value: 'starter' },
                      { label: 'Pro', value: 'pro' },
                      { label: 'Enterprise', value: 'enterprise' },
                    ]"
                    size="lg"
                  />
                </UFormField>

                <UFormField label="Currency">
                  <UInput v-model="currency" placeholder="SAR" size="lg" />
                </UFormField>

                <UFormField label="Locale">
                  <UInput v-model="locale" placeholder="ar-SA" size="lg" />
                </UFormField>
              </div>
            </div>
          </UCard>

          <p v-if="error" class="text-sm text-red-400">
            {{ error }}
          </p>

          <div class="flex items-center gap-3">
            <UButton
              type="submit"
              size="lg"
              color="primary"
              :loading="submitting"
              :disabled="!!subdomainError"
              label="Create merchant"
            />
            <UButton
              to="/merchants"
              size="lg"
              color="neutral"
              variant="ghost"
              label="Cancel"
            />
          </div>

          <UAlert
            color="warning"
            variant="soft"
            icon="i-lucide-clock"
            title="Provisioning is asynchronous"
            description="The merchant row is created immediately with status='provisioning'. A background job creates a dedicated Neon branch, applies the platform schema, and flips status to 'active' — usually within 20–40 seconds."
          />
        </form>
      </div>
    </template>
  </UDashboardPanel>
</template>
