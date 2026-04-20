<script setup lang="ts">
// ---------------------------------------------------------------------------
// AdminProductForm — shared create/edit form for /admin/products/new and
// /admin/products/[id]/edit. Emits a CreateProductInput-shaped payload on
// submit. Two-column on desktop: main column (basics / pricing / media /
// inventory / attributes / danger zone) + sticky sidebar (status /
// organization / edit-mode metadata). A sticky action bar pins Save to the
// viewport bottom. Variants are intentionally deferred; existing variants
// render read-only so edit doesn't nuke variant data. Image upload uses
// presigned S3 PUT — each file goes to /api/admin/uploads/presign →
// direct PUT → publicUrl pushed into form.images. No image body ever
// traverses Fly.
// ---------------------------------------------------------------------------

import type { Category, Product } from '@commercejs/types'
import { onBeforeRouteLeave } from '#imports'

export interface ProductFormImage {
  url: string
  altText: string
  sortOrder: number
  isPrimary: boolean
}

export interface ProductFormValue {
  name: string
  nameAr: string
  slug: string
  description: string
  descriptionAr: string
  shortDescription: string
  sku: string
  status: 'draft' | 'active' | 'archived'
  price: number | null
  compareAtPrice: number | null
  vatIncluded: boolean
  vatRate: number | null
  inStock: boolean
  inventoryQuantity: number | null
  quantityLimit: number | null
  requiresShipping: boolean
  categories: string[]
  tags: string
  attributes: { code: string, name: string, value: string }[]
  images: ProductFormImage[]
}

const props = defineProps<{
  initial?: Product | null
  categories: Category[]
  currency: string
  submitting?: boolean
  mode: 'create' | 'edit'
  storefrontOrigin?: string
}>()

const emit = defineEmits<{
  submit: [value: ProductFormValue, opts: { publish?: boolean }]
  delete: []
}>()

const { t } = useLocalizedString()
const { formatPrice } = usePrice()

// ---- Initial value --------------------------------------------------------

function initialImages(p: Product | null | undefined): ProductFormImage[] {
  if (!p) return []
  const list: ProductFormImage[] = []
  let order = 0
  if (p.primaryImage?.url) {
    list.push({
      url: p.primaryImage.url,
      altText: p.primaryImage.alt || '',
      sortOrder: order++,
      isPrimary: true,
    })
  }
  for (const img of p.gallery ?? []) {
    if (!img?.url) continue
    if (p.primaryImage?.url && img.url === p.primaryImage.url) continue
    list.push({
      url: img.url,
      altText: img.alt || '',
      sortOrder: order++,
      isPrimary: false,
    })
  }
  return list
}

function initialValue(): ProductFormValue {
  const p = props.initial
  return {
    name: p ? t(p.name) : '',
    nameAr: p?.name?.ar || '',
    slug: p?.slug || '',
    description: p ? (typeof p.description === 'string' ? p.description : (p.description?.en || '')) : '',
    descriptionAr: p?.description && typeof p.description !== 'string' ? (p.description.ar || '') : '',
    shortDescription: p ? (typeof p.shortDescription === 'string' ? p.shortDescription : (p.shortDescription?.en || '')) : '',
    sku: p?.sku || '',
    status: (p?.status as any) || 'draft',
    price: p?.price?.amount ?? null,
    compareAtPrice: (p?.price as any)?.originalAmount ?? null,
    vatIncluded: p?.vatIncluded ?? true,
    vatRate: p?.vatRate ?? null,
    inStock: p?.inStock ?? true,
    inventoryQuantity: p?.inventoryQuantity ?? null,
    quantityLimit: p?.quantityLimit ?? null,
    requiresShipping: p?.requiresShipping ?? true,
    categories: (p?.categories ?? []).map(c => c.id),
    tags: (p?.tags ?? []).join(', '),
    attributes: (p?.attributes ?? []).map(a => ({
      code: a.code,
      name: t(a.name),
      value: t(a.value),
    })),
    images: initialImages(p),
  }
}

const form = reactive<ProductFormValue>(initialValue())
const trackInventory = ref<boolean>(props.initial?.inventoryQuantity != null)

// Snapshot used for the dirty check and Discard.
let snapshot = JSON.stringify(form)
let snapshotTrack = trackInventory.value

watch(() => props.initial, () => {
  Object.assign(form, initialValue())
  trackInventory.value = props.initial?.inventoryQuantity != null
  snapshot = JSON.stringify(form)
  snapshotTrack = trackInventory.value
})

const dirty = computed(() => JSON.stringify(form) !== snapshot || trackInventory.value !== snapshotTrack)

function markClean() {
  snapshot = JSON.stringify(form)
  snapshotTrack = trackInventory.value
}

function discard() {
  Object.assign(form, JSON.parse(snapshot))
  trackInventory.value = snapshotTrack
}

defineExpose({ dirty, markClean, discard })

// ---- Unsaved-changes guard ------------------------------------------------

if (import.meta.client) {
  const beforeUnload = (e: BeforeUnloadEvent) => {
    if (!dirty.value) return
    e.preventDefault()
    e.returnValue = ''
  }
  window.addEventListener('beforeunload', beforeUnload)
  onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnload))

  onBeforeRouteLeave(() => {
    if (!dirty.value) return true
    return window.confirm('You have unsaved changes. Leave anyway?')
  })
}

// ---- Derived + helpers ----------------------------------------------------

const categoryOptions = computed(() =>
  props.categories.map(c => ({ label: t(c.name), value: c.id })),
)

const statusOptions = [
  { label: 'Draft', value: 'draft' },
  { label: 'Active', value: 'active' },
  { label: 'Archived', value: 'archived' },
]

const statusChipColor = computed<'success' | 'warning' | 'neutral'>(() => {
  if (form.status === 'active') return 'success'
  if (form.status === 'draft') return 'warning'
  return 'neutral'
})

const hasVariants = computed(() => (props.initial?.variants?.length ?? 0) > 0)

const savingsPercent = computed<number | null>(() => {
  const p = form.price
  const c = form.compareAtPrice
  if (p == null || c == null || c <= p || c <= 0) return null
  return Math.round((1 - p / c) * 100)
})

// VAT rate stored as decimal (0.15); display + input as percent (15).
const vatRatePercent = computed<number | null>({
  get: () => form.vatRate == null ? null : Math.round(form.vatRate * 10000) / 100,
  set: (v: number | null) => {
    form.vatRate = v == null || Number.isNaN(v) ? null : v / 100
  },
})

const viewOnStorefrontUrl = computed(() => {
  if (props.mode !== 'edit' || !props.initial?.slug) return null
  if (props.initial.status && props.initial.status !== 'active') return null
  const base = props.storefrontOrigin ?? (import.meta.client ? window.location.origin : '')
  return `${base}/products/${props.initial.slug}`
})

function formatDate(iso?: string) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString()
  }
  catch {
    return iso
  }
}

function addAttribute() {
  form.attributes.push({ code: '', name: '', value: '' })
}

function removeAttribute(i: number) {
  form.attributes.splice(i, 1)
}

// ---- Image upload ---------------------------------------------------------

interface PresignResponse {
  uploadUrl: string
  publicUrl: string
  key: string
  expiresIn: number
}

const ACCEPTED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

const fileInput = ref<HTMLInputElement | null>(null)
const uploadingCount = ref(0)
const uploadError = ref<string | null>(null)

function openFilePicker() {
  fileInput.value?.click()
}

async function uploadOne(file: File): Promise<void> {
  if (!ACCEPTED_MIME.includes(file.type)) {
    throw new Error(`${file.name}: unsupported file type (${file.type || 'unknown'})`)
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`${file.name}: exceeds 10 MB limit`)
  }

  const signed = await $fetch<PresignResponse>('/api/admin/uploads/presign', {
    method: 'POST',
    body: { filename: file.name, mimeType: file.type, size: file.size, context: 'product' },
  })

  const putRes = await fetch(signed.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  })
  if (!putRes.ok) {
    const body = await putRes.text().catch(() => '')
    throw new Error(`${file.name}: upload failed (${putRes.status}) ${body.slice(0, 200)}`)
  }

  const hasPrimary = form.images.some(i => i.isPrimary)
  form.images.push({
    url: signed.publicUrl,
    altText: '',
    sortOrder: form.images.length,
    isPrimary: !hasPrimary,
  })
}

async function handleFiles(files: FileList | File[] | null) {
  if (!files || files.length === 0) return
  uploadError.value = null
  const list = Array.from(files)
  uploadingCount.value += list.length
  try {
    for (const f of list) {
      try {
        await uploadOne(f)
      }
      catch (err: any) {
        uploadError.value = err?.data?.message || err?.message || 'Upload failed'
      }
    }
  }
  finally {
    uploadingCount.value -= list.length
    if (fileInput.value) fileInput.value.value = ''
  }
}

function onFileChange(evt: Event) {
  const input = evt.target as HTMLInputElement
  handleFiles(input.files)
}

const isDragging = ref(false)

function onDrop(evt: DragEvent) {
  evt.preventDefault()
  isDragging.value = false
  handleFiles(evt.dataTransfer?.files ?? null)
}

function onDragOver(evt: DragEvent) {
  evt.preventDefault()
  isDragging.value = true
}

function onDragLeave() {
  isDragging.value = false
}

function setPrimary(i: number) {
  form.images.forEach((img, idx) => {
    img.isPrimary = idx === i
  })
}

function removeImage(i: number) {
  const wasPrimary = form.images[i]?.isPrimary ?? false
  form.images.splice(i, 1)
  form.images.forEach((img, idx) => {
    img.sortOrder = idx
  })
  if (wasPrimary && form.images.length > 0) {
    form.images[0]!.isPrimary = true
  }
}

function moveImage(i: number, delta: -1 | 1) {
  const target = i + delta
  if (target < 0 || target >= form.images.length) return
  const [moved] = form.images.splice(i, 1)
  form.images.splice(target, 0, moved!)
  form.images.forEach((img, idx) => {
    img.sortOrder = idx
  })
}

// ---- Submit ---------------------------------------------------------------

function onSubmit(publish?: boolean) {
  // Stock-status is derived from inventoryQuantity when the merchant is
  // tracking inventory — keeps the two controls in sync without making the
  // UI show both at once.
  const value: ProductFormValue = { ...form, images: [...form.images] }
  if (trackInventory.value) {
    value.inStock = (value.inventoryQuantity ?? 0) > 0
  }
  else {
    value.inventoryQuantity = null
  }
  emit('submit', value, { publish })
}
</script>

<template>
  <!-- pb-24 reserves clearance for the fixed action bar so the last card
       isn't hidden behind it when fully scrolled. -->
  <form class="flex flex-col pb-24" @submit.prevent>
    <div class="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
      <!-- ================================================================ -->
      <!-- Main column                                                       -->
      <!-- ================================================================ -->
      <div class="flex flex-col gap-6 min-w-0">
        <!-- Basics -->
        <UCard>
          <template #header>
            <h2 class="font-semibold text-highlighted">
              Basics
            </h2>
          </template>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UFormField label="Name" required class="md:col-span-2">
              <UInput v-model="form.name" required placeholder="Product name" autofocus />
            </UFormField>
            <UFormField label="Name (Arabic)" class="md:col-span-2">
              <UInput v-model="form.nameAr" dir="rtl" placeholder="اسم المنتج" />
            </UFormField>
            <UFormField label="SKU" class="md:col-span-2">
              <UInput v-model="form.sku" placeholder="e.g. SHIRT-001" />
            </UFormField>
            <UFormField label="Short description" class="md:col-span-2" help="One line shown in product cards.">
              <UInput v-model="form.shortDescription" />
            </UFormField>
            <UFormField label="Description" class="md:col-span-2">
              <UTextarea v-model="form.description" :rows="5" />
            </UFormField>
            <UFormField label="Description (Arabic)" class="md:col-span-2">
              <UTextarea v-model="form.descriptionAr" :rows="5" dir="rtl" />
            </UFormField>
          </div>
        </UCard>

        <!-- Pricing -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="font-semibold text-highlighted">
                Pricing
              </h2>
              <UBadge v-if="savingsPercent != null" color="success" variant="subtle" size="sm">
                {{ savingsPercent }}% off
              </UBadge>
            </div>
          </template>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UFormField label="Price">
              <UInput
                v-model.number="form.price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
              >
                <template #trailing>
                  <span class="text-xs text-muted">{{ currency }}</span>
                </template>
              </UInput>
            </UFormField>
            <UFormField label="Compare at price" help="Shown struck-through to highlight the discount.">
              <UInput
                v-model.number="form.compareAtPrice"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
              >
                <template #trailing>
                  <span class="text-xs text-muted">{{ currency }}</span>
                </template>
              </UInput>
            </UFormField>
            <UFormField label="VAT rate" help="Percentage (e.g. 15 for 15%).">
              <UInput
                v-model.number="vatRatePercent"
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="0"
              >
                <template #trailing>
                  <span class="text-xs text-muted">%</span>
                </template>
              </UInput>
            </UFormField>
            <UFormField label="VAT included in price">
              <USwitch v-model="form.vatIncluded" />
            </UFormField>
          </div>
        </UCard>

        <!-- Images -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="font-semibold text-highlighted">
                Images
              </h2>
              <UButton
                icon="i-heroicons-arrow-up-tray-20-solid"
                variant="outline"
                color="neutral"
                size="xs"
                :loading="uploadingCount > 0"
                @click="openFilePicker"
              >
                Add images
              </UButton>
            </div>
          </template>

          <input
            ref="fileInput"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            class="sr-only"
            aria-label="Upload product images"
            @change="onFileChange"
          >

          <button
            type="button"
            class="w-full flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 text-sm text-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            :class="isDragging ? 'border-primary bg-primary/5' : 'border-default hover:border-inverted/20'"
            @click="openFilePicker"
            @dragover="onDragOver"
            @dragleave="onDragLeave"
            @drop="onDrop"
          >
            <UIcon name="i-heroicons-photo-20-solid" class="w-6 h-6 mb-2" />
            <p>Drop images here or <span class="text-primary underline">choose files</span></p>
            <p class="text-xs mt-1">JPEG / PNG / WebP / GIF · up to 10 MB each</p>
            <p v-if="uploadingCount > 0" class="text-xs mt-2 text-info">
              Uploading {{ uploadingCount }}…
            </p>
          </button>

          <UAlert
            v-if="uploadError"
            color="error"
            variant="subtle"
            icon="i-heroicons-exclamation-triangle-20-solid"
            title="Upload error"
            :description="uploadError"
            class="mt-3"
            :close-button="{ icon: 'i-heroicons-x-mark-20-solid' }"
            @close="uploadError = null"
          />

          <div v-if="form.images.length > 0" class="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <div
              v-for="(img, i) in form.images"
              :key="img.url"
              class="relative flex flex-col gap-2 border rounded-lg p-2"
              :class="img.isPrimary ? 'border-primary ring-1 ring-primary/30' : 'border-default'"
            >
              <div class="relative aspect-square overflow-hidden rounded bg-elevated">
                <img :src="img.url" :alt="img.altText" class="w-full h-full object-cover">
                <UBadge
                  v-if="img.isPrimary"
                  color="primary"
                  variant="solid"
                  size="xs"
                  class="absolute top-1 left-1"
                >
                  Primary
                </UBadge>
              </div>
              <UInput
                v-model="img.altText"
                size="xs"
                placeholder="Alt text (optional)"
              />
              <div class="flex items-center justify-between gap-1">
                <UButton
                  :icon="img.isPrimary ? 'i-heroicons-star-solid' : 'i-heroicons-star'"
                  :variant="img.isPrimary ? 'soft' : 'ghost'"
                  :color="img.isPrimary ? 'primary' : 'neutral'"
                  size="xs"
                  :disabled="img.isPrimary"
                  @click="setPrimary(i)"
                >
                  {{ img.isPrimary ? 'Primary' : 'Set primary' }}
                </UButton>
                <div class="flex items-center gap-0.5">
                  <UButton
                    icon="i-heroicons-arrow-up-20-solid"
                    variant="ghost"
                    color="neutral"
                    size="xs"
                    :disabled="i === 0"
                    aria-label="Move up"
                    @click="moveImage(i, -1)"
                  />
                  <UButton
                    icon="i-heroicons-arrow-down-20-solid"
                    variant="ghost"
                    color="neutral"
                    size="xs"
                    :disabled="i === form.images.length - 1"
                    aria-label="Move down"
                    @click="moveImage(i, 1)"
                  />
                  <UButton
                    icon="i-heroicons-trash-20-solid"
                    variant="ghost"
                    color="error"
                    size="xs"
                    aria-label="Remove image"
                    @click="removeImage(i)"
                  />
                </div>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Inventory -->
        <UCard>
          <template #header>
            <h2 class="font-semibold text-highlighted">
              Inventory
            </h2>
          </template>
          <div class="flex flex-col gap-4">
            <UFormField label="Track inventory" help="Turn on to keep a stock count — stock status is derived automatically.">
              <USwitch v-model="trackInventory" />
            </UFormField>

            <div v-if="trackInventory">
              <UFormField label="Quantity on hand">
                <UInput v-model.number="form.inventoryQuantity" type="number" min="0" placeholder="0" />
              </UFormField>
              <p class="text-xs text-muted mt-2">
                Sets "in stock" automatically: <strong>{{ (form.inventoryQuantity ?? 0) > 0 ? 'yes' : 'no' }}</strong>.
              </p>
            </div>
            <UFormField v-else label="In stock">
              <USwitch v-model="form.inStock" />
            </UFormField>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-default">
              <UFormField label="Requires shipping">
                <USwitch v-model="form.requiresShipping" />
              </UFormField>
              <UFormField label="Purchase limit per order" help="Blank = unlimited.">
                <UInput v-model.number="form.quantityLimit" type="number" min="1" />
              </UFormField>
            </div>
          </div>
        </UCard>

        <!-- Attributes -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="font-semibold text-highlighted">
                Attributes
              </h2>
              <UButton
                icon="i-heroicons-plus-20-solid"
                variant="outline"
                color="neutral"
                size="xs"
                @click="addAttribute"
              >
                Add attribute
              </UButton>
            </div>
          </template>

          <div v-if="form.attributes.length === 0" class="text-sm text-muted">
            Arbitrary key/value pairs (e.g. "Material: Cotton"). Useful for filtering + display.
          </div>

          <div v-else class="flex flex-col gap-2">
            <div
              v-for="(attr, i) in form.attributes"
              :key="i"
              class="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-2"
            >
              <UInput v-model="attr.code" placeholder="code (e.g. material)" />
              <UInput v-model="attr.name" placeholder="Name (Material)" />
              <UInput v-model="attr.value" placeholder="Value (Cotton)" />
              <UButton
                icon="i-heroicons-x-mark-20-solid"
                variant="ghost"
                color="neutral"
                size="sm"
                aria-label="Remove attribute"
                @click="removeAttribute(i)"
              />
            </div>
          </div>
        </UCard>

        <!-- Variants (read-only if present) -->
        <UCard v-if="hasVariants">
          <template #header>
            <h2 class="font-semibold text-highlighted">
              Variants
            </h2>
          </template>
          <UAlert
            color="info"
            variant="subtle"
            icon="i-heroicons-information-circle-20-solid"
            title="Variant editor coming soon"
            description="Variants already on this product are preserved — edits here won't touch them."
          />
          <ul class="mt-3 flex flex-col gap-1 text-sm text-muted">
            <li v-for="v in props.initial?.variants ?? []" :key="v.id">
              {{ v.name ? t(v.name) : v.sku || v.id }} — {{ v.price ? `${v.price.currency} ${v.price.amount.toFixed(2)}` : '—' }}
            </li>
          </ul>
        </UCard>

        <!-- Danger zone (edit-only) -->
        <UCard v-if="mode === 'edit'" class="border-error/30">
          <template #header>
            <h2 class="font-semibold text-error">
              Danger zone
            </h2>
          </template>
          <div class="flex items-center justify-between gap-4">
            <div class="text-sm text-muted">
              Deleting a product removes it from the catalog and from the storefront. This cannot be undone.
            </div>
            <UButton
              icon="i-heroicons-trash-20-solid"
              variant="outline"
              color="error"
              size="sm"
              @click="emit('delete')"
            >
              Delete product
            </UButton>
          </div>
        </UCard>
      </div>

      <!-- ================================================================ -->
      <!-- Sidebar                                                           -->
      <!-- ================================================================ -->
      <aside class="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
        <!-- Status / publishing -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="font-semibold text-highlighted">
                Status
              </h2>
              <UBadge :color="statusChipColor" variant="subtle" size="sm">
                {{ form.status }}
              </UBadge>
            </div>
          </template>
          <div class="flex flex-col gap-3">
            <UFormField label="Publish status">
              <USelect v-model="form.status" :items="statusOptions" value-key="value" />
            </UFormField>

            <UFormField v-if="mode === 'edit'" label="URL slug" help="Used in the storefront product URL.">
              <UInput v-model="form.slug" placeholder="auto-generated from name" />
            </UFormField>

            <div v-if="viewOnStorefrontUrl" class="pt-1">
              <UButton
                :to="viewOnStorefrontUrl"
                target="_blank"
                rel="noopener"
                variant="ghost"
                color="primary"
                size="xs"
                icon="i-heroicons-arrow-top-right-on-square-20-solid"
                trailing
              >
                View on storefront
              </UButton>
            </div>
          </div>
        </UCard>

        <!-- Organization -->
        <UCard>
          <template #header>
            <h2 class="font-semibold text-highlighted">
              Organization
            </h2>
          </template>
          <div class="flex flex-col gap-3">
            <UFormField label="Categories">
              <USelectMenu
                v-model="form.categories"
                :items="categoryOptions"
                value-key="value"
                multiple
                placeholder="Choose categories"
              />
            </UFormField>
            <UFormField label="Tags" help="Comma-separated.">
              <UInput v-model="form.tags" placeholder="summer, sale, t-shirt" />
            </UFormField>
          </div>
        </UCard>

        <!-- Metadata (edit only) -->
        <UCard v-if="mode === 'edit' && props.initial">
          <template #header>
            <h2 class="font-semibold text-highlighted">
              Details
            </h2>
          </template>
          <dl class="flex flex-col gap-2 text-xs">
            <div class="flex items-center justify-between">
              <dt class="text-muted">
                Price
              </dt>
              <dd class="text-highlighted font-medium">
                {{ formatPrice(props.initial.price) || '—' }}
              </dd>
            </div>
            <div class="flex items-center justify-between">
              <dt class="text-muted">
                Created
              </dt>
              <dd>{{ formatDate(props.initial.createdAt) }}</dd>
            </div>
            <div class="flex items-center justify-between">
              <dt class="text-muted">
                Updated
              </dt>
              <dd>{{ formatDate(props.initial.updatedAt) }}</dd>
            </div>
          </dl>
        </UCard>
      </aside>
    </div>

    <!-- ================================================================== -->
    <!-- Fixed action bar — anchored to the admin layout's main area.         -->
    <!-- left-60 matches the admin layout's sidebar width (w-60 shrink-0).   -->
    <!-- ================================================================== -->
    <div class="fixed bottom-0 left-60 right-0 z-20 border-t border-default bg-default/95 backdrop-blur supports-[backdrop-filter]:bg-default/80 shadow-[0_-2px_8px_rgb(0_0_0/0.04)]">
      <div class="max-w-6xl px-6 py-3 flex items-center justify-between gap-3">
        <div class="flex items-center gap-2 text-xs text-muted min-w-0">
          <span
            class="inline-block w-2 h-2 rounded-full"
            :class="dirty ? 'bg-warning' : 'bg-success'"
          />
          <span class="truncate">{{ dirty ? 'Unsaved changes' : 'All changes saved' }}</span>
        </div>

        <div v-if="mode === 'create'" class="flex items-center gap-2">
          <UButton
            variant="outline"
            color="neutral"
            :loading="submitting"
            :disabled="submitting"
            @click="onSubmit(false)"
          >
            Save draft
          </UButton>
          <UButton
            color="primary"
            :loading="submitting"
            :disabled="submitting"
            @click="onSubmit(true)"
          >
            Save & publish
          </UButton>
        </div>

        <div v-else class="flex items-center gap-2">
          <UButton
            variant="ghost"
            color="neutral"
            :disabled="!dirty || submitting"
            @click="discard"
          >
            Discard
          </UButton>
          <UButton
            color="primary"
            :loading="submitting"
            :disabled="submitting || !dirty"
            @click="onSubmit()"
          >
            Save
          </UButton>
        </div>
      </div>
    </div>
  </form>
</template>
