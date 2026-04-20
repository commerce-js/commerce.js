<script setup lang="ts">
// ---------------------------------------------------------------------------
// /admin/theme — T12 storefront theming (CSS custom properties v1).
//
// Merchants set six tokens: primary color, accent color, font family, hero
// image, hero heading EN, hero heading AR. The UI hits GET/PATCH on
// /api/admin/settings (shared with /admin/settings — these fields live on
// StoreSettings, not a separate route) and updates are applied on the next
// storefront request via `app.vue`'s useHead-injected :root { --cjs-* }
// style block. v2 would move to per-tenant Tailwind preset compilation; v1
// caps at CSS custom properties.
//
// UX:
// - Native color pickers + paired text input (so hex paste works).
// - Curated font-family dropdown (Inter / Cairo / Tajawal / Noto Kufi
//   Arabic / system-ui) with a "custom" escape for any CSS font-family.
// - Hero image reuses T04's presigned-PUT flow (context='theme').
// - Live preview card renders the chosen palette + headings using the same
//   CSS-var pattern the storefront will use — no round-trip required to
//   see the effect.
// - Dirty-state tracked via JSON snapshot; sticky save bar reuses the
//   T06 settings pattern.
// ---------------------------------------------------------------------------

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
  ssr: false,
})

interface StoreSettings {
  name: string
  primaryColor?: string | null
  accentColor?: string | null
  fontFamily?: string | null
  heroImageUrl?: string | null
  heroHeadingEn?: string | null
  heroHeadingAr?: string | null
}

interface FormState {
  primaryColor: string
  accentColor: string
  fontFamily: string
  heroImageUrl: string
  heroHeadingEn: string
  heroHeadingAr: string
}

const DEFAULT_PRIMARY = '#22c55e'
const DEFAULT_ACCENT = '#f59e0b'

// Reka UI's <SelectItem> reserves the empty string for "clear selection", so
// "System default" (no explicit font) ships as a `__default__` sentinel and
// is translated to '' when persisted on form.fontFamily.
const FONT_OPTIONS = [
  { label: 'System default', value: '__default__' },
  { label: 'Inter', value: 'Inter' },
  { label: 'Cairo', value: 'Cairo' },
  { label: 'Tajawal', value: 'Tajawal' },
  { label: 'Noto Kufi Arabic', value: 'Noto Kufi Arabic' },
  { label: 'system-ui', value: 'system-ui' },
  { label: 'Custom…', value: '__custom__' },
]

const toast = useToast()

const { data: settings, pending, error, refresh } = await useFetch<StoreSettings>(
  '/api/admin/settings',
  {
    credentials: 'include',
    key: 'admin-theme',
    server: false,
  },
)

function blankForm(): FormState {
  return {
    primaryColor: '',
    accentColor: '',
    fontFamily: '',
    heroImageUrl: '',
    heroHeadingEn: '',
    heroHeadingAr: '',
  }
}

const form = reactive<FormState>(blankForm())
const initialSnapshot = ref<string>('')
// Track the "custom" font-family mode independently so users can type a
// free-form value that isn't in FONT_OPTIONS.
const fontMode = ref<'preset' | 'custom'>('preset')

function hydrate(s: StoreSettings) {
  form.primaryColor = s.primaryColor ?? ''
  form.accentColor = s.accentColor ?? ''
  form.fontFamily = s.fontFamily ?? ''
  form.heroImageUrl = s.heroImageUrl ?? ''
  form.heroHeadingEn = s.heroHeadingEn ?? ''
  form.heroHeadingAr = s.heroHeadingAr ?? ''
  const known = new Set(FONT_OPTIONS.map(o => o.value))
  fontMode.value = form.fontFamily && !known.has(form.fontFamily) ? 'custom' : 'preset'
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

// ---- Preview helpers ------------------------------------------------------

const previewPrimary = computed(() => form.primaryColor || DEFAULT_PRIMARY)
const previewAccent = computed(() => form.accentColor || DEFAULT_ACCENT)
const previewFont = computed(() => form.fontFamily || 'system-ui')
const previewHeadingEn = computed(() => form.heroHeadingEn || 'Discover Premium Products')
const previewHeadingAr = computed(() => form.heroHeadingAr || 'اكتشف منتجات متميزة')

const previewStyle = computed(() => ({
  '--cjs-primary': previewPrimary.value,
  '--cjs-accent': previewAccent.value,
  fontFamily: `${previewFont.value}, system-ui, sans-serif`,
}))

// ---- Font-family select ---------------------------------------------------

const fontPresetValue = computed<string>({
  get() {
    if (fontMode.value === 'custom') return '__custom__'
    const known = new Set(FONT_OPTIONS.map(o => o.value))
    return known.has(form.fontFamily) ? form.fontFamily : '__default__'
  },
  set(v: string) {
    if (v === '__custom__') {
      fontMode.value = 'custom'
      if (FONT_OPTIONS.some(o => o.value === form.fontFamily)) {
        form.fontFamily = ''
      }
    }
    else {
      fontMode.value = 'preset'
      form.fontFamily = v === '__default__' ? '' : v
    }
  },
})

// ---- Image upload — reuses T04's presign flow ----------------------------

interface PresignResponse {
  uploadUrl: string
  publicUrl: string
  key: string
  expiresIn: number
}

const ACCEPTED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

const heroInput = ref<HTMLInputElement | null>(null)
const uploadingHero = ref(false)
const showHeroUrl = ref(false)

async function uploadHero(file: File) {
  if (!ACCEPTED_MIME.includes(file.type)) {
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
      context: 'theme',
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

  form.heroImageUrl = signed.publicUrl
}

async function handleFile(files: FileList | null) {
  const file = files?.[0]
  if (!file) return
  uploadingHero.value = true
  try {
    await uploadHero(file)
  }
  catch (err: any) {
    toast.add({ title: 'Could not upload image', description: err?.message, color: 'error' })
  }
  finally {
    uploadingHero.value = false
    if (heroInput.value) heroInput.value.value = ''
  }
}

// ---- Save -----------------------------------------------------------------

const submitting = ref(false)

async function onSave() {
  if (!isDirty.value || submitting.value) return
  submitting.value = true
  try {
    await $fetch('/api/admin/settings', {
      method: 'PATCH',
      credentials: 'include',
      body: {
        primaryColor: form.primaryColor,
        accentColor: form.accentColor,
        fontFamily: form.fontFamily,
        heroImageUrl: form.heroImageUrl,
        heroHeadingEn: form.heroHeadingEn,
        heroHeadingAr: form.heroHeadingAr,
      },
    })
    toast.add({ title: 'Theme saved', color: 'success' })
    await refresh()
  }
  catch (err: any) {
    toast.add({
      title: 'Could not save theme',
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

function onReset() {
  if (!window.confirm('Reset all theme tokens to defaults? This clears primary, accent, font, and hero fields.')) return
  form.primaryColor = ''
  form.accentColor = ''
  form.fontFamily = ''
  form.heroImageUrl = ''
  form.heroHeadingEn = ''
  form.heroHeadingAr = ''
  fontMode.value = 'preset'
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
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', keyHandler)
  window.removeEventListener('beforeunload', beforeUnloadHandler)
})

onBeforeRouteLeave(() => {
  if (!isDirty.value) return true
  return window.confirm('You have unsaved changes. Leave anyway?')
})
</script>

<template>
  <div class="relative min-h-full pb-24">
    <div class="max-w-5xl mx-auto w-full flex flex-col gap-6">
      <!-- Header -->
      <header class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-highlighted">
            Theme
          </h1>
          <p class="text-sm text-muted mt-1">
            Brand your storefront: pick colors, a font, and a hero image.
            Changes apply to <code class="px-1 py-0.5 rounded bg-elevated text-xs">*.commercejs.cloud</code> on the next request — no redeploy needed.
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
        title="Could not load theme"
        :description="error.message"
        icon="i-heroicons-exclamation-triangle-20-solid"
      />

      <div v-if="pending && !settings" class="flex items-center gap-2 text-sm text-muted">
        <UIcon name="i-heroicons-arrow-path-20-solid" class="animate-spin" />
        Loading theme…
      </div>

      <template v-else-if="settings">
        <div class="grid lg:grid-cols-2 gap-6 items-start">
          <!-- Form column -->
          <div class="flex flex-col gap-6 min-w-0">
            <!-- Colors -->
            <UCard>
              <template #header>
                <div class="flex items-center gap-2">
                  <UIcon name="i-heroicons-paint-brush-20-solid" class="text-primary text-lg" />
                  <div>
                    <h2 class="font-semibold text-highlighted">
                      Colors
                    </h2>
                    <p class="text-xs text-muted mt-0.5">
                      Primary drives main CTAs; accent is used for badges and highlights.
                    </p>
                  </div>
                </div>
              </template>

              <div class="flex flex-col gap-4">
                <UFormField label="Primary color" help="Used for primary buttons, links, and interactive accents.">
                  <div class="flex items-center gap-2">
                    <input
                      type="color"
                      :value="form.primaryColor || DEFAULT_PRIMARY"
                      class="w-12 h-10 rounded border border-default cursor-pointer bg-default"
                      @input="(e) => form.primaryColor = (e.target as HTMLInputElement).value"
                    />
                    <UInput
                      v-model="form.primaryColor"
                      :placeholder="DEFAULT_PRIMARY"
                      class="flex-1"
                    />
                    <UButton
                      v-if="form.primaryColor"
                      icon="i-heroicons-x-mark-20-solid"
                      variant="ghost"
                      color="neutral"
                      size="sm"
                      @click="form.primaryColor = ''"
                    />
                  </div>
                </UFormField>

                <UFormField label="Accent color" help="Used for secondary highlights such as badges or icon fills.">
                  <div class="flex items-center gap-2">
                    <input
                      type="color"
                      :value="form.accentColor || DEFAULT_ACCENT"
                      class="w-12 h-10 rounded border border-default cursor-pointer bg-default"
                      @input="(e) => form.accentColor = (e.target as HTMLInputElement).value"
                    />
                    <UInput
                      v-model="form.accentColor"
                      :placeholder="DEFAULT_ACCENT"
                      class="flex-1"
                    />
                    <UButton
                      v-if="form.accentColor"
                      icon="i-heroicons-x-mark-20-solid"
                      variant="ghost"
                      color="neutral"
                      size="sm"
                      @click="form.accentColor = ''"
                    />
                  </div>
                </UFormField>
              </div>
            </UCard>

            <!-- Typography -->
            <UCard>
              <template #header>
                <div class="flex items-center gap-2">
                  <UIcon name="i-heroicons-language-20-solid" class="text-primary text-lg" />
                  <div>
                    <h2 class="font-semibold text-highlighted">
                      Typography
                    </h2>
                    <p class="text-xs text-muted mt-0.5">
                      Body font for your storefront. The storefront loads Inter by default; other fonts need to resolve at the browser.
                    </p>
                  </div>
                </div>
              </template>

              <div class="flex flex-col gap-4">
                <UFormField label="Font family">
                  <USelect
                    v-model="fontPresetValue"
                    :items="FONT_OPTIONS"
                    class="w-full"
                  />
                </UFormField>
                <UFormField
                  v-if="fontMode === 'custom'"
                  label="Custom font-family"
                  help="Any CSS font-family string; fallback chain to system-ui is appended automatically."
                >
                  <UInput
                    v-model="form.fontFamily"
                    placeholder="'Your Custom Font'"
                    class="w-full"
                  />
                </UFormField>
                <p class="text-xs text-muted">
                  Storefront falls back to <code>system-ui</code> when the chosen font isn't available.
                </p>
              </div>
            </UCard>

            <!-- Hero -->
            <UCard>
              <template #header>
                <div class="flex items-center gap-2">
                  <UIcon name="i-heroicons-photo-20-solid" class="text-primary text-lg" />
                  <div>
                    <h2 class="font-semibold text-highlighted">
                      Hero
                    </h2>
                    <p class="text-xs text-muted mt-0.5">
                      Optional hero image + headings rendered on your homepage.
                    </p>
                  </div>
                </div>
              </template>

              <div class="flex flex-col gap-4">
                <UFormField label="Hero image" help="PNG, JPG, WebP, or GIF up to 10 MB. Shown full-width on the homepage.">
                  <div class="flex flex-col gap-2">
                    <button
                      type="button"
                      class="relative group w-full aspect-[3/1] rounded-lg border border-dashed border-default bg-elevated flex items-center justify-center overflow-hidden hover:border-primary hover:bg-accented transition cursor-pointer"
                      :disabled="uploadingHero"
                      @click="heroInput?.click()"
                    >
                      <img v-if="form.heroImageUrl" :src="form.heroImageUrl" alt="Hero preview" class="w-full h-full object-cover">
                      <div v-else class="flex flex-col items-center gap-1 text-muted">
                        <UIcon name="i-heroicons-arrow-up-tray-20-solid" class="text-2xl" />
                        <span class="text-sm">Click to upload</span>
                      </div>
                      <div
                        v-if="uploadingHero"
                        class="absolute inset-0 bg-default/70 flex items-center justify-center"
                      >
                        <UIcon name="i-heroicons-arrow-path-20-solid" class="animate-spin text-xl" />
                      </div>
                      <div
                        v-else-if="form.heroImageUrl"
                        class="absolute inset-0 bg-default/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
                      >
                        <span class="text-sm font-medium text-highlighted">Replace image</span>
                      </div>
                    </button>
                    <input
                      ref="heroInput"
                      type="file"
                      class="hidden"
                      :accept="ACCEPTED_MIME.join(',')"
                      @change="handleFile(($event.target as HTMLInputElement).files)"
                    >
                    <div class="flex items-center justify-between gap-2">
                      <UButton
                        v-if="form.heroImageUrl"
                        variant="ghost"
                        color="neutral"
                        size="xs"
                        icon="i-heroicons-x-mark-20-solid"
                        @click="form.heroImageUrl = ''"
                      >
                        Remove
                      </UButton>
                      <UButton
                        variant="ghost"
                        color="neutral"
                        size="xs"
                        :icon="showHeroUrl ? 'i-heroicons-chevron-up-20-solid' : 'i-heroicons-link-20-solid'"
                        class="ml-auto"
                        @click="showHeroUrl = !showHeroUrl"
                      >
                        {{ showHeroUrl ? 'Hide URL' : 'Or paste URL' }}
                      </UButton>
                    </div>
                    <UInput
                      v-if="showHeroUrl"
                      v-model="form.heroImageUrl"
                      size="sm"
                      placeholder="https://…"
                      icon="i-heroicons-link-20-solid"
                      class="w-full"
                    />
                  </div>
                </UFormField>

                <UFormField label="Hero heading (English)">
                  <UInput
                    v-model="form.heroHeadingEn"
                    placeholder="Discover Premium Products"
                    class="w-full"
                  />
                </UFormField>
                <UFormField label="Hero heading (Arabic)">
                  <UInput
                    v-model="form.heroHeadingAr"
                    placeholder="اكتشف منتجات متميزة"
                    dir="rtl"
                    class="w-full"
                  />
                </UFormField>
              </div>
            </UCard>
          </div>

          <!-- Preview column -->
          <div class="lg:sticky lg:top-6 flex flex-col gap-4">
            <h2 class="text-sm font-medium uppercase tracking-wider text-muted px-1">
              Live preview
            </h2>
            <div
              class="rounded-2xl border border-default overflow-hidden bg-default"
              :style="previewStyle as any"
            >
              <!-- Hero -->
              <div class="relative aspect-[16/9] overflow-hidden bg-elevated">
                <img
                  v-if="form.heroImageUrl"
                  :src="form.heroImageUrl"
                  alt="Hero preview"
                  class="absolute inset-0 w-full h-full object-cover"
                />
                <div
                  v-else
                  class="absolute inset-0"
                  :style="{ background: `linear-gradient(135deg, ${previewPrimary}33 0%, ${previewAccent}33 100%)` }"
                />
                <div class="absolute inset-0 bg-linear-to-t from-black/70 via-black/30 to-transparent" />
                <div class="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                  <h3 class="text-xl sm:text-2xl font-bold text-white drop-shadow">
                    {{ previewHeadingEn }}
                  </h3>
                  <p class="mt-1 text-white/80 text-sm" dir="rtl">
                    {{ previewHeadingAr }}
                  </p>
                </div>
              </div>

              <!-- Card body -->
              <div class="p-5 flex flex-col gap-4">
                <div class="flex items-center gap-2">
                  <span
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
                    :style="{ backgroundColor: previewAccent }"
                  >
                    New
                  </span>
                  <span class="text-sm text-muted">Example product</span>
                </div>
                <div class="text-lg font-semibold text-highlighted">
                  Oud Cologne · 50 ml
                </div>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    class="px-4 py-2 rounded-md text-sm font-medium text-white transition"
                    :style="{ backgroundColor: previewPrimary }"
                  >
                    Add to cart
                  </button>
                  <button
                    type="button"
                    class="px-4 py-2 rounded-md text-sm font-medium border transition"
                    :style="{ color: previewPrimary, borderColor: previewPrimary }"
                  >
                    Details
                  </button>
                </div>
              </div>
            </div>

            <UButton
              variant="ghost"
              color="neutral"
              size="sm"
              icon="i-heroicons-arrow-uturn-left-20-solid"
              class="self-start"
              @click="onReset"
            >
              Reset to defaults
            </UButton>
          </div>
        </div>
      </template>
    </div>

    <!-- Sticky save bar -->
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
                Save theme
              </UButton>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
