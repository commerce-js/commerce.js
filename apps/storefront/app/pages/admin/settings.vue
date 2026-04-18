<script setup lang="ts">
// ---------------------------------------------------------------------------
// /admin/settings — edit store settings. GETs current payload from
// /api/admin/settings, PATCHes on save. Logo + favicon reuse T04's
// presigned-PUT upload flow (context='store-logo').
//
// socialLinks asymmetry: the platform returns Record<string, string> but
// UpdateStoreInput takes a JSON string. We parse on load, stringify on save.
// ---------------------------------------------------------------------------

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
  ssr: false,
})

interface StoreSettings {
  name: string
  nameAr?: string | null
  description?: string | null
  descriptionAr?: string | null
  logo?: string | null
  favicon?: string | null
  currency: string
  locale: string
  timezone: string
  supportedCurrencies: string[]
  supportedLocales: string[]
  contactEmail?: string | null
  contactPhone?: string | null
  address?: string | null
  socialLinks?: Record<string, string> | null
}

interface SocialRow {
  key: string
  value: string
}

interface FormState {
  name: string
  nameAr: string
  description: string
  descriptionAr: string
  logo: string
  favicon: string
  currency: string
  locale: string
  timezone: string
  contactEmail: string
  contactPhone: string
  address: string
  socialRows: SocialRow[]
}

const toast = useToast()

const { data: settings, pending, error, refresh } = await useFetch<StoreSettings>(
  '/api/admin/settings',
  {
    credentials: 'include',
    key: 'admin-settings',
    server: false,
  },
)

function blankForm(): FormState {
  return {
    name: '',
    nameAr: '',
    description: '',
    descriptionAr: '',
    logo: '',
    favicon: '',
    currency: '',
    locale: '',
    timezone: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    socialRows: [],
  }
}

const form = reactive<FormState>(blankForm())

function hydrate(s: StoreSettings) {
  form.name = s.name ?? ''
  form.nameAr = s.nameAr ?? ''
  form.description = s.description ?? ''
  form.descriptionAr = s.descriptionAr ?? ''
  form.logo = s.logo ?? ''
  form.favicon = s.favicon ?? ''
  form.currency = s.currency ?? ''
  form.locale = s.locale ?? ''
  form.timezone = s.timezone ?? ''
  form.contactEmail = s.contactEmail ?? ''
  form.contactPhone = s.contactPhone ?? ''
  form.address = s.address ?? ''
  form.socialRows = s.socialLinks
    ? Object.entries(s.socialLinks).map(([key, value]) => ({ key, value }))
    : []
}

watch(
  settings,
  (s) => {
    if (s) hydrate(s)
  },
  { immediate: true },
)

const currencyOptions = computed(() => {
  const list = settings.value?.supportedCurrencies ?? []
  return list.filter(Boolean).map(code => ({ label: code, value: code }))
})

const localeOptions = computed(() => {
  const list = settings.value?.supportedLocales ?? []
  return list.filter(Boolean).map(code => ({ label: code, value: code }))
})

// ---- Image upload (logo / favicon) — reuses T04's presign flow ------------

interface PresignResponse {
  uploadUrl: string
  publicUrl: string
  key: string
  expiresIn: number
}

const ACCEPTED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/x-icon', 'image/vnd.microsoft.icon']
const PRESIGN_ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

const logoInput = ref<HTMLInputElement | null>(null)
const faviconInput = ref<HTMLInputElement | null>(null)
const uploadingLogo = ref(false)
const uploadingFavicon = ref(false)

async function uploadTo(field: 'logo' | 'favicon', file: File) {
  if (!PRESIGN_ALLOWED_MIME.has(file.type)) {
    throw new Error(`Unsupported file type (${file.type || 'unknown'}). Allowed: JPEG, PNG, WebP, GIF.`)
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`File exceeds ${MAX_UPLOAD_BYTES / (1024 * 1024)} MB limit`)
  }

  const signed = await $fetch<PresignResponse>('/api/admin/uploads/presign', {
    method: 'POST',
    credentials: 'include',
    body: {
      filename: file.name,
      mimeType: file.type,
      size: file.size,
      context: 'store-logo',
    },
  })

  const putRes = await fetch(signed.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  })
  if (!putRes.ok) {
    const body = await putRes.text().catch(() => '')
    throw new Error(`Upload failed (${putRes.status}) ${body.slice(0, 200)}`)
  }

  form[field] = signed.publicUrl
}

async function handleLogoFile(files: FileList | null) {
  const file = files?.[0]
  if (!file) return
  uploadingLogo.value = true
  try {
    await uploadTo('logo', file)
  }
  catch (err: any) {
    toast.add({ title: 'Could not upload logo', description: err?.message, color: 'error' })
  }
  finally {
    uploadingLogo.value = false
    if (logoInput.value) logoInput.value.value = ''
  }
}

async function handleFaviconFile(files: FileList | null) {
  const file = files?.[0]
  if (!file) return
  uploadingFavicon.value = true
  try {
    await uploadTo('favicon', file)
  }
  catch (err: any) {
    toast.add({ title: 'Could not upload favicon', description: err?.message, color: 'error' })
  }
  finally {
    uploadingFavicon.value = false
    if (faviconInput.value) faviconInput.value.value = ''
  }
}

// ---- Social links ---------------------------------------------------------

function addSocialRow() {
  form.socialRows.push({ key: '', value: '' })
}

function removeSocialRow(index: number) {
  form.socialRows.splice(index, 1)
}

// ---- Save -----------------------------------------------------------------

const submitting = ref(false)

function serializeSocialLinks(rows: SocialRow[]): string | undefined {
  const obj: Record<string, string> = {}
  for (const row of rows) {
    const key = row.key.trim()
    const value = row.value.trim()
    if (!key) continue
    obj[key] = value
  }
  return Object.keys(obj).length > 0 ? JSON.stringify(obj) : JSON.stringify({})
}

async function onSave() {
  if (!form.name.trim()) {
    toast.add({ title: 'Store name is required', color: 'warning' })
    return
  }

  submitting.value = true
  try {
    await $fetch('/api/admin/settings', {
      method: 'PATCH',
      credentials: 'include',
      body: {
        name: form.name.trim(),
        nameAr: form.nameAr,
        description: form.description,
        descriptionAr: form.descriptionAr,
        logo: form.logo,
        favicon: form.favicon,
        currency: form.currency || undefined,
        locale: form.locale || undefined,
        timezone: form.timezone || undefined,
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone,
        address: form.address,
        socialLinks: serializeSocialLinks(form.socialRows),
      },
    })
    toast.add({ title: 'Settings saved', color: 'success' })
    await refresh()
  }
  catch (err: any) {
    toast.add({
      title: 'Could not save settings',
      description: err?.data?.message || err?.message,
      color: 'error',
    })
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-6 max-w-3xl">
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-highlighted">
          Store settings
        </h1>
        <p class="text-sm text-muted mt-1">
          Manage how your store appears and how customers can reach you.
        </p>
      </div>
      <UButton
        color="primary"
        :loading="submitting"
        :disabled="pending || !settings"
        icon="i-heroicons-check-20-solid"
        @click="onSave"
      >
        Save changes
      </UButton>
    </header>

    <UAlert
      v-if="error"
      color="error"
      variant="subtle"
      title="Could not load settings"
      :description="error.message"
      icon="i-heroicons-exclamation-triangle-20-solid"
    />

    <div v-if="pending && !settings" class="text-sm text-muted">
      Loading…
    </div>

    <template v-else-if="settings">
      <!-- Brand ------------------------------------------------------------ -->
      <UCard>
        <template #header>
          <h2 class="font-semibold text-highlighted">
            Brand
          </h2>
        </template>

        <div class="flex flex-col gap-4">
          <UFormField label="Display name" required>
            <UInput v-model="form.name" placeholder="My store" />
          </UFormField>

          <UFormField label="Display name (Arabic)">
            <UInput v-model="form.nameAr" placeholder="اسم المتجر" dir="rtl" />
          </UFormField>

          <UFormField label="Description">
            <UTextarea v-model="form.description" :rows="3" placeholder="Tell shoppers what you sell" />
          </UFormField>

          <UFormField label="Description (Arabic)">
            <UTextarea v-model="form.descriptionAr" :rows="3" dir="rtl" />
          </UFormField>

          <UFormField label="Logo">
            <div class="flex items-center gap-3">
              <div class="w-16 h-16 border border-default rounded bg-elevated flex items-center justify-center overflow-hidden shrink-0">
                <img v-if="form.logo" :src="form.logo" alt="Logo" class="max-w-full max-h-full object-contain">
                <UIcon v-else name="i-heroicons-photo-20-solid" class="text-muted text-xl" />
              </div>
              <input
                ref="logoInput"
                type="file"
                class="hidden"
                :accept="ACCEPTED_MIME.join(',')"
                @change="handleLogoFile(($event.target as HTMLInputElement).files)"
              >
              <UButton
                variant="outline"
                color="neutral"
                size="sm"
                icon="i-heroicons-arrow-up-tray-20-solid"
                :loading="uploadingLogo"
                @click="logoInput?.click()"
              >
                Upload logo
              </UButton>
              <UButton
                v-if="form.logo"
                variant="ghost"
                color="neutral"
                size="sm"
                icon="i-heroicons-x-mark-20-solid"
                @click="form.logo = ''"
              >
                Remove
              </UButton>
            </div>
            <UInput v-model="form.logo" class="mt-2" size="sm" placeholder="https://…" />
          </UFormField>

          <UFormField label="Favicon">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 border border-default rounded bg-elevated flex items-center justify-center overflow-hidden shrink-0">
                <img v-if="form.favicon" :src="form.favicon" alt="Favicon" class="max-w-full max-h-full object-contain">
                <UIcon v-else name="i-heroicons-globe-alt-20-solid" class="text-muted text-sm" />
              </div>
              <input
                ref="faviconInput"
                type="file"
                class="hidden"
                :accept="ACCEPTED_MIME.join(',')"
                @change="handleFaviconFile(($event.target as HTMLInputElement).files)"
              >
              <UButton
                variant="outline"
                color="neutral"
                size="sm"
                icon="i-heroicons-arrow-up-tray-20-solid"
                :loading="uploadingFavicon"
                @click="faviconInput?.click()"
              >
                Upload favicon
              </UButton>
              <UButton
                v-if="form.favicon"
                variant="ghost"
                color="neutral"
                size="sm"
                icon="i-heroicons-x-mark-20-solid"
                @click="form.favicon = ''"
              >
                Remove
              </UButton>
            </div>
            <UInput v-model="form.favicon" class="mt-2" size="sm" placeholder="https://…" />
          </UFormField>
        </div>
      </UCard>

      <!-- Locale ----------------------------------------------------------- -->
      <UCard>
        <template #header>
          <h2 class="font-semibold text-highlighted">
            Locale &amp; currency
          </h2>
        </template>

        <div class="flex flex-col gap-4">
          <UAlert
            color="info"
            variant="subtle"
            icon="i-heroicons-information-circle-20-solid"
            title="Heads up"
            description="Changing the currency or locale does not retroactively convert existing product prices. Update your products separately if needed."
          />

          <UFormField label="Currency">
            <USelect
              v-model="form.currency"
              :items="currencyOptions"
              placeholder="Select a currency"
            />
          </UFormField>

          <UFormField label="Locale">
            <USelect
              v-model="form.locale"
              :items="localeOptions"
              placeholder="Select a locale"
            />
          </UFormField>

          <UFormField label="Timezone" help="IANA timezone identifier, e.g. Asia/Riyadh">
            <UInput v-model="form.timezone" placeholder="Asia/Riyadh" />
          </UFormField>
        </div>
      </UCard>

      <!-- Contact ---------------------------------------------------------- -->
      <UCard>
        <template #header>
          <h2 class="font-semibold text-highlighted">
            Contact
          </h2>
        </template>

        <div class="flex flex-col gap-4">
          <UFormField label="Contact email">
            <UInput v-model="form.contactEmail" type="email" placeholder="hello@store.com" />
          </UFormField>

          <UFormField label="Contact phone">
            <UInput v-model="form.contactPhone" placeholder="+973…" />
          </UFormField>

          <UFormField label="Address">
            <UTextarea v-model="form.address" :rows="3" placeholder="Street, city, country" />
          </UFormField>
        </div>
      </UCard>

      <!-- Social ----------------------------------------------------------- -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="font-semibold text-highlighted">
              Social links
            </h2>
            <UButton
              variant="ghost"
              color="neutral"
              size="sm"
              icon="i-heroicons-plus-20-solid"
              @click="addSocialRow"
            >
              Add link
            </UButton>
          </div>
        </template>

        <div v-if="form.socialRows.length === 0" class="text-sm text-muted">
          No social links yet. Add one to show it in your storefront footer.
        </div>

        <ul v-else class="flex flex-col gap-2">
          <li
            v-for="(row, index) in form.socialRows"
            :key="index"
            class="flex items-center gap-2"
          >
            <UInput
              v-model="row.key"
              placeholder="facebook"
              class="w-1/3 shrink-0"
            />
            <UInput
              v-model="row.value"
              placeholder="https://facebook.com/mystore"
              class="flex-1"
            />
            <UButton
              icon="i-heroicons-trash-20-solid"
              variant="ghost"
              color="neutral"
              size="sm"
              @click="removeSocialRow(index)"
            />
          </li>
        </ul>
      </UCard>

      <div class="flex justify-end">
        <UButton
          color="primary"
          :loading="submitting"
          icon="i-heroicons-check-20-solid"
          @click="onSave"
        >
          Save changes
        </UButton>
      </div>
    </template>
  </div>
</template>
