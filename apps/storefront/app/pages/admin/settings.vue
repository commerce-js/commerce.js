<script setup lang="ts">
// ---------------------------------------------------------------------------
// /admin/settings — edit store settings. GETs current payload from
// /api/admin/settings, PATCHes on save. Logo + favicon reuse T04's
// presigned-PUT upload flow (context='store-logo').
//
// UX:
// - Two-column layout (section-anchor nav left, content right).
// - Dirty-state tracked via JSON snapshot; sticky save bar appears only when
//   the form has diverged from the hydrated server state.
// - ⌘/Ctrl+S saves; beforeunload + route-leave guard warn about unsaved changes.
// - Arabic fields live behind per-card "Add Arabic" toggles (auto-open when
//   server data has Arabic content).
// - Social links: curated platforms with brand icons; custom rows for extras.
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

interface CustomSocialRow {
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
  social: Record<string, string>
  customRows: CustomSocialRow[]
}

const SOCIAL_PLATFORMS: { key: string, label: string, icon: string, placeholder: string }[] = [
  { key: 'facebook', label: 'Facebook', icon: 'i-lucide-facebook', placeholder: 'https://facebook.com/yourstore' },
  { key: 'instagram', label: 'Instagram', icon: 'i-lucide-instagram', placeholder: 'https://instagram.com/yourstore' },
  { key: 'x', label: 'X (Twitter)', icon: 'i-lucide-twitter', placeholder: 'https://x.com/yourstore' },
  { key: 'tiktok', label: 'TikTok', icon: 'i-lucide-music-2', placeholder: 'https://tiktok.com/@yourstore' },
  { key: 'youtube', label: 'YouTube', icon: 'i-lucide-youtube', placeholder: 'https://youtube.com/@yourstore' },
  { key: 'snapchat', label: 'Snapchat', icon: 'i-lucide-ghost', placeholder: 'https://snapchat.com/add/yourstore' },
  { key: 'whatsapp', label: 'WhatsApp', icon: 'i-lucide-message-circle-more', placeholder: 'https://wa.me/97300000000' },
  { key: 'linkedin', label: 'LinkedIn', icon: 'i-lucide-linkedin', placeholder: 'https://linkedin.com/company/yourstore' },
]

const SOCIAL_PLATFORM_KEYS = new Set(SOCIAL_PLATFORMS.map(p => p.key))

const sections = [
  { id: 'brand', label: 'Brand', icon: 'i-heroicons-swatch-20-solid' },
  { id: 'locale', label: 'Locale & currency', icon: 'i-heroicons-globe-alt-20-solid' },
  { id: 'contact', label: 'Contact', icon: 'i-heroicons-envelope-20-solid' },
  { id: 'social', label: 'Social links', icon: 'i-heroicons-share-20-solid' },
]

const toast = useToast()

const { data: settings, pending, error, refresh } = await useFetch<StoreSettings>(
  '/api/admin/settings',
  {
    credentials: 'include',
    key: 'admin-settings',
    server: false,
  },
)

function blankSocial(): Record<string, string> {
  const obj: Record<string, string> = {}
  for (const p of SOCIAL_PLATFORMS) obj[p.key] = ''
  return obj
}

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
    social: blankSocial(),
    customRows: [],
  }
}

const form = reactive<FormState>(blankForm())
const initialSnapshot = ref<string>('')
const showArabicBrand = ref(false)

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

  // Split socialLinks into known-platform fields + custom rows
  const social = blankSocial()
  const custom: CustomSocialRow[] = []
  if (s.socialLinks) {
    for (const [key, value] of Object.entries(s.socialLinks)) {
      if (SOCIAL_PLATFORM_KEYS.has(key)) {
        social[key] = value
      }
      else {
        custom.push({ key, value })
      }
    }
  }
  form.social = social
  form.customRows = custom

  showArabicBrand.value = Boolean((s.nameAr ?? '').trim() || (s.descriptionAr ?? '').trim())
  initialSnapshot.value = JSON.stringify(form)
}

watch(
  settings,
  (s) => {
    if (s) hydrate(s)
  },
  { immediate: true },
)

const isDirty = computed(() => JSON.stringify(form) !== initialSnapshot.value)

// ---- Intl-powered friendly labels -----------------------------------------

const languageDisplay = import.meta.client ? new Intl.DisplayNames(['en'], { type: 'language' }) : null
const currencyDisplay = import.meta.client ? new Intl.DisplayNames(['en'], { type: 'currency' }) : null

function currencyLabel(code: string): string {
  try {
    const name = currencyDisplay?.of(code)
    return name && name !== code ? `${code} — ${name}` : code
  }
  catch {
    return code
  }
}

function localeLabel(code: string): string {
  try {
    const name = languageDisplay?.of(code)
    return name && name !== code ? `${code} — ${name}` : code
  }
  catch {
    return code
  }
}

const currencyOptions = computed(() => {
  const list = settings.value?.supportedCurrencies ?? []
  return list.filter(Boolean).map(code => ({ label: currencyLabel(code), value: code }))
})

const localeOptions = computed(() => {
  const list = settings.value?.supportedLocales ?? []
  return list.filter(Boolean).map(code => ({ label: localeLabel(code), value: code }))
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
const showLogoUrl = ref(false)
const showFaviconUrl = ref(false)

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

async function handleFile(field: 'logo' | 'favicon', files: FileList | null) {
  const file = files?.[0]
  if (!file) return
  const flag = field === 'logo' ? uploadingLogo : uploadingFavicon
  flag.value = true
  try {
    await uploadTo(field, file)
  }
  catch (err: any) {
    toast.add({ title: `Could not upload ${field}`, description: err?.message, color: 'error' })
  }
  finally {
    flag.value = false
    const inputRef = field === 'logo' ? logoInput : faviconInput
    if (inputRef.value) inputRef.value.value = ''
  }
}

// ---- Social links ---------------------------------------------------------

function addCustomRow() {
  form.customRows.push({ key: '', value: '' })
}

function removeCustomRow(index: number) {
  form.customRows.splice(index, 1)
}

// ---- Save -----------------------------------------------------------------

const submitting = ref(false)

function serializeSocialLinks(): string {
  const obj: Record<string, string> = {}
  for (const [key, value] of Object.entries(form.social)) {
    const v = (value || '').trim()
    if (v) obj[key] = v
  }
  for (const row of form.customRows) {
    const key = row.key.trim()
    const value = row.value.trim()
    if (key && value) obj[key] = value
  }
  return JSON.stringify(obj)
}

async function onSave() {
  if (!isDirty.value || submitting.value) return
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
        socialLinks: serializeSocialLinks(),
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

function onDiscard() {
  if (settings.value) hydrate(settings.value)
}

// ---- Section nav ----------------------------------------------------------

const activeSection = ref(sections[0]!.id)
let sectionObserver: IntersectionObserver | null = null

function scrollTo(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// ---- Keyboard + navigation guards -----------------------------------------

function keyHandler(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && (e.key === 's' || e.key === 'S')) {
    e.preventDefault()
    if (isDirty.value && !submitting.value) onSave()
  }
}

function beforeUnloadHandler(e: BeforeUnloadEvent) {
  if (isDirty.value) {
    e.preventDefault()
    e.returnValue = ''
  }
}

onMounted(() => {
  window.addEventListener('keydown', keyHandler)
  window.addEventListener('beforeunload', beforeUnloadHandler)

  sectionObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter(e => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
      if (visible.length > 0) activeSection.value = visible[0]!.target.id
    },
    { rootMargin: '-80px 0px -60% 0px', threshold: 0 },
  )
  // Defer observer attachment until after initial render
  nextTick(() => {
    for (const s of sections) {
      const el = document.getElementById(s.id)
      if (el) sectionObserver!.observe(el)
    }
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', keyHandler)
  window.removeEventListener('beforeunload', beforeUnloadHandler)
  sectionObserver?.disconnect()
})

onBeforeRouteLeave(() => {
  if (!isDirty.value) return true
  return window.confirm('You have unsaved changes. Leave anyway?')
})
</script>

<template>
  <div class="relative min-h-full pb-24">
    <div class="max-w-5xl mx-auto w-full flex flex-col gap-6">
      <!-- Header --------------------------------------------------------- -->
      <header class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-highlighted">
            Store settings
          </h1>
          <p class="text-sm text-muted mt-1">
            Manage how your store appears and how customers can reach you.
          </p>
        </div>
        <UButton
          to="/"
          target="_blank"
          icon="i-heroicons-arrow-top-right-on-square-20-solid"
          trailing
          variant="ghost"
          color="neutral"
          size="sm"
        >
          View storefront
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

      <div v-if="pending && !settings" class="flex items-center gap-2 text-sm text-muted">
        <UIcon name="i-heroicons-arrow-path-20-solid" class="animate-spin" />
        Loading settings…
      </div>

      <template v-else-if="settings">
        <!-- Two-column grid -->
        <div class="grid lg:grid-cols-[200px_1fr] gap-8 items-start">
          <!-- Section nav -->
          <nav class="hidden lg:flex flex-col gap-1 sticky top-2 self-start">
            <p class="text-xs font-medium uppercase tracking-wider text-muted px-3 pb-2">
              Sections
            </p>
            <UButton
              v-for="s in sections"
              :key="s.id"
              :icon="s.icon"
              :variant="activeSection === s.id ? 'soft' : 'ghost'"
              :color="activeSection === s.id ? 'primary' : 'neutral'"
              size="sm"
              block
              class="justify-start"
              @click="scrollTo(s.id)"
            >
              {{ s.label }}
            </UButton>
          </nav>

          <!-- Content column -->
          <div class="flex flex-col gap-6 min-w-0">
            <!-- Brand -------------------------------------------------- -->
            <UCard id="brand" class="scroll-mt-4">
              <template #header>
                <div class="flex items-start justify-between gap-3">
                  <div class="flex items-center gap-2">
                    <UIcon name="i-heroicons-swatch-20-solid" class="text-primary text-lg" />
                    <div>
                      <h2 class="font-semibold text-highlighted">
                        Brand
                      </h2>
                      <p class="text-xs text-muted mt-0.5">
                        Name, description, logo, and favicon shown across your storefront.
                      </p>
                    </div>
                  </div>
                  <UButton
                    :icon="showArabicBrand ? 'i-heroicons-language-20-solid' : 'i-heroicons-plus-20-solid'"
                    variant="ghost"
                    color="neutral"
                    size="xs"
                    @click="showArabicBrand = !showArabicBrand"
                  >
                    {{ showArabicBrand ? 'Hide Arabic' : 'Add Arabic' }}
                  </UButton>
                </div>
              </template>

              <div class="flex flex-col gap-4">
                <div class="grid grid-cols-1" :class="showArabicBrand ? 'sm:grid-cols-2 sm:gap-4' : ''">
                  <UFormField label="Display name" required>
                    <UInput v-model="form.name" placeholder="My store" class="w-full" />
                  </UFormField>
                  <UFormField v-if="showArabicBrand" label="Display name (Arabic)">
                    <UInput v-model="form.nameAr" placeholder="اسم المتجر" dir="rtl" class="w-full" />
                  </UFormField>
                </div>

                <div class="grid grid-cols-1" :class="showArabicBrand ? 'sm:grid-cols-2 sm:gap-4' : ''">
                  <UFormField label="Description" help="Shown in your storefront metadata and social previews.">
                    <UTextarea v-model="form.description" :rows="3" placeholder="Tell shoppers what you sell" class="w-full" />
                  </UFormField>
                  <UFormField v-if="showArabicBrand" label="Description (Arabic)">
                    <UTextarea v-model="form.descriptionAr" :rows="3" dir="rtl" class="w-full" />
                  </UFormField>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <!-- Logo -->
                  <UFormField label="Logo" help="PNG, JPG, WebP, or GIF up to 10 MB.">
                    <div class="flex flex-col gap-2">
                      <button
                        type="button"
                        class="relative group w-full aspect-[3/1] rounded-lg border border-dashed border-default bg-elevated flex items-center justify-center overflow-hidden hover:border-primary hover:bg-accented transition cursor-pointer"
                        :disabled="uploadingLogo"
                        @click="logoInput?.click()"
                      >
                        <img v-if="form.logo" :src="form.logo" alt="Logo preview" class="max-w-full max-h-full object-contain p-3">
                        <div v-else class="flex flex-col items-center gap-1 text-muted">
                          <UIcon name="i-heroicons-arrow-up-tray-20-solid" class="text-2xl" />
                          <span class="text-sm">Click to upload</span>
                        </div>
                        <div
                          v-if="uploadingLogo"
                          class="absolute inset-0 bg-default/70 flex items-center justify-center"
                        >
                          <UIcon name="i-heroicons-arrow-path-20-solid" class="animate-spin text-xl" />
                        </div>
                        <div
                          v-else-if="form.logo"
                          class="absolute inset-0 bg-default/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2"
                        >
                          <span class="text-sm font-medium text-highlighted">Replace logo</span>
                        </div>
                      </button>
                      <input
                        ref="logoInput"
                        type="file"
                        class="hidden"
                        :accept="ACCEPTED_MIME.join(',')"
                        @change="handleFile('logo', ($event.target as HTMLInputElement).files)"
                      >
                      <div class="flex items-center justify-between gap-2">
                        <UButton
                          v-if="form.logo"
                          variant="ghost"
                          color="neutral"
                          size="xs"
                          icon="i-heroicons-x-mark-20-solid"
                          @click="form.logo = ''"
                        >
                          Remove
                        </UButton>
                        <UButton
                          variant="ghost"
                          color="neutral"
                          size="xs"
                          :icon="showLogoUrl ? 'i-heroicons-chevron-up-20-solid' : 'i-heroicons-link-20-solid'"
                          class="ml-auto"
                          @click="showLogoUrl = !showLogoUrl"
                        >
                          {{ showLogoUrl ? 'Hide URL' : 'Or paste URL' }}
                        </UButton>
                      </div>
                      <UInput
                        v-if="showLogoUrl"
                        v-model="form.logo"
                        size="sm"
                        placeholder="https://…"
                        icon="i-heroicons-link-20-solid"
                        class="w-full"
                      />
                    </div>
                  </UFormField>

                  <!-- Favicon -->
                  <UFormField label="Favicon" help="Square image, 32×32 or larger. Shown in browser tabs.">
                    <div class="flex flex-col gap-2">
                      <button
                        type="button"
                        class="relative group w-full aspect-[3/1] rounded-lg border border-dashed border-default bg-elevated flex items-center justify-center overflow-hidden hover:border-primary hover:bg-accented transition cursor-pointer"
                        :disabled="uploadingFavicon"
                        @click="faviconInput?.click()"
                      >
                        <img v-if="form.favicon" :src="form.favicon" alt="Favicon preview" class="w-12 h-12 object-contain">
                        <div v-else class="flex flex-col items-center gap-1 text-muted">
                          <UIcon name="i-heroicons-arrow-up-tray-20-solid" class="text-2xl" />
                          <span class="text-sm">Click to upload</span>
                        </div>
                        <div
                          v-if="uploadingFavicon"
                          class="absolute inset-0 bg-default/70 flex items-center justify-center"
                        >
                          <UIcon name="i-heroicons-arrow-path-20-solid" class="animate-spin text-xl" />
                        </div>
                        <div
                          v-else-if="form.favicon"
                          class="absolute inset-0 bg-default/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
                        >
                          <span class="text-sm font-medium text-highlighted">Replace favicon</span>
                        </div>
                      </button>
                      <input
                        ref="faviconInput"
                        type="file"
                        class="hidden"
                        :accept="ACCEPTED_MIME.join(',')"
                        @change="handleFile('favicon', ($event.target as HTMLInputElement).files)"
                      >
                      <div class="flex items-center justify-between gap-2">
                        <UButton
                          v-if="form.favicon"
                          variant="ghost"
                          color="neutral"
                          size="xs"
                          icon="i-heroicons-x-mark-20-solid"
                          @click="form.favicon = ''"
                        >
                          Remove
                        </UButton>
                        <UButton
                          variant="ghost"
                          color="neutral"
                          size="xs"
                          :icon="showFaviconUrl ? 'i-heroicons-chevron-up-20-solid' : 'i-heroicons-link-20-solid'"
                          class="ml-auto"
                          @click="showFaviconUrl = !showFaviconUrl"
                        >
                          {{ showFaviconUrl ? 'Hide URL' : 'Or paste URL' }}
                        </UButton>
                      </div>
                      <UInput
                        v-if="showFaviconUrl"
                        v-model="form.favicon"
                        size="sm"
                        placeholder="https://…"
                        icon="i-heroicons-link-20-solid"
                        class="w-full"
                      />
                    </div>
                  </UFormField>
                </div>
              </div>
            </UCard>

            <!-- Locale & currency ------------------------------------- -->
            <UCard id="locale" class="scroll-mt-4">
              <template #header>
                <div class="flex items-center gap-2">
                  <UIcon name="i-heroicons-globe-alt-20-solid" class="text-primary text-lg" />
                  <div>
                    <h2 class="font-semibold text-highlighted">
                      Locale &amp; currency
                    </h2>
                    <p class="text-xs text-muted mt-0.5">
                      Default currency, language, and timezone for new activity.
                    </p>
                  </div>
                </div>
              </template>

              <div class="flex flex-col gap-4">
                <UAlert
                  color="info"
                  variant="soft"
                  icon="i-heroicons-information-circle-20-solid"
                  title="Changing currency or locale does not convert existing product prices."
                  description="Update your products separately if you change these."
                />

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <UFormField label="Currency">
                    <USelect
                      v-model="form.currency"
                      :items="currencyOptions"
                      placeholder="Select a currency"
                      icon="i-heroicons-banknotes-20-solid"
                      class="w-full"
                    />
                  </UFormField>

                  <UFormField label="Locale">
                    <USelect
                      v-model="form.locale"
                      :items="localeOptions"
                      placeholder="Select a locale"
                      icon="i-heroicons-language-20-solid"
                      class="w-full"
                    />
                  </UFormField>
                </div>

                <UFormField label="Timezone" help="IANA identifier, e.g. Asia/Riyadh or Asia/Bahrain.">
                  <UInput
                    v-model="form.timezone"
                    placeholder="Asia/Riyadh"
                    icon="i-heroicons-clock-20-solid"
                    class="w-full"
                  />
                </UFormField>
              </div>
            </UCard>

            <!-- Contact ----------------------------------------------- -->
            <UCard id="contact" class="scroll-mt-4">
              <template #header>
                <div class="flex items-center gap-2">
                  <UIcon name="i-heroicons-envelope-20-solid" class="text-primary text-lg" />
                  <div>
                    <h2 class="font-semibold text-highlighted">
                      Contact
                    </h2>
                    <p class="text-xs text-muted mt-0.5">
                      Shown in transactional emails and the storefront footer.
                    </p>
                  </div>
                </div>
              </template>

              <div class="flex flex-col gap-4">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <UFormField label="Contact email">
                    <UInput
                      v-model="form.contactEmail"
                      type="email"
                      placeholder="hello@store.com"
                      icon="i-heroicons-envelope-20-solid"
                      class="w-full"
                    />
                  </UFormField>

                  <UFormField label="Contact phone">
                    <UInput
                      v-model="form.contactPhone"
                      placeholder="+973…"
                      icon="i-heroicons-phone-20-solid"
                      class="w-full"
                    />
                  </UFormField>
                </div>

                <UFormField label="Address">
                  <UTextarea v-model="form.address" :rows="3" placeholder="Street, city, country" class="w-full" />
                </UFormField>
              </div>
            </UCard>

            <!-- Social links ------------------------------------------ -->
            <UCard id="social" class="scroll-mt-4">
              <template #header>
                <div class="flex items-center gap-2">
                  <UIcon name="i-heroicons-share-20-solid" class="text-primary text-lg" />
                  <div>
                    <h2 class="font-semibold text-highlighted">
                      Social links
                    </h2>
                    <p class="text-xs text-muted mt-0.5">
                      Paste profile URLs. Empty fields aren't shown to customers.
                    </p>
                  </div>
                </div>
              </template>

              <div class="flex flex-col gap-3">
                <div
                  v-for="p in SOCIAL_PLATFORMS"
                  :key="p.key"
                  class="flex items-center gap-3"
                >
                  <UIcon
                    :name="p.icon"
                    class="text-xl shrink-0"
                    :class="form.social[p.key] ? 'text-highlighted' : 'text-dimmed'"
                  />
                  <div class="w-24 shrink-0 text-sm font-medium" :class="form.social[p.key] ? 'text-highlighted' : 'text-muted'">
                    {{ p.label }}
                  </div>
                  <UInput
                    v-model="form.social[p.key]"
                    :placeholder="p.placeholder"
                    type="url"
                    class="flex-1 min-w-0"
                  />
                  <UButton
                    v-if="form.social[p.key]"
                    icon="i-heroicons-x-mark-20-solid"
                    variant="ghost"
                    color="neutral"
                    size="sm"
                    @click="form.social[p.key] = ''"
                  />
                </div>

                <UDivider v-if="form.customRows.length > 0" class="my-1" />

                <div
                  v-for="(row, index) in form.customRows"
                  :key="`custom-${index}`"
                  class="flex items-center gap-2"
                >
                  <UIcon name="i-heroicons-link-20-solid" class="text-xl shrink-0 text-dimmed" />
                  <UInput
                    v-model="row.key"
                    placeholder="platform"
                    class="w-24 shrink-0"
                  />
                  <UInput
                    v-model="row.value"
                    placeholder="https://…"
                    type="url"
                    class="flex-1 min-w-0"
                  />
                  <UButton
                    icon="i-heroicons-trash-20-solid"
                    variant="ghost"
                    color="neutral"
                    size="sm"
                    @click="removeCustomRow(index)"
                  />
                </div>

                <div>
                  <UButton
                    variant="ghost"
                    color="neutral"
                    size="sm"
                    icon="i-heroicons-plus-20-solid"
                    @click="addCustomRow"
                  >
                    Add custom link
                  </UButton>
                </div>
              </div>
            </UCard>
          </div>
        </div>
      </template>
    </div>

    <!-- Sticky save bar (fixed to viewport, reserves width after sidebar) -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 translate-y-full"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-full"
      >
        <div
          v-if="isDirty"
          class="fixed bottom-0 left-0 lg:left-60 right-0 z-30 border-t border-default bg-default/95 backdrop-blur-md shadow-[0_-4px_16px_rgba(0,0,0,0.06)]"
        >
          <div class="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between gap-3">
            <div class="flex items-center gap-2 text-sm">
              <UIcon name="i-heroicons-exclamation-circle-20-solid" class="text-warning text-lg" />
              <span class="text-highlighted font-medium">Unsaved changes</span>
              <span class="text-muted hidden sm:inline">— don't forget to save</span>
            </div>
            <div class="flex items-center gap-2">
              <UButton
                variant="ghost"
                color="neutral"
                :disabled="submitting"
                @click="onDiscard"
              >
                Discard
              </UButton>
              <UButton
                color="primary"
                :loading="submitting"
                icon="i-heroicons-check-20-solid"
                @click="onSave"
              >
                Save changes
              </UButton>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
