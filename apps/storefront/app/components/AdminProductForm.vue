<script setup lang="ts">
// ---------------------------------------------------------------------------
// AdminProductForm — shared create/edit form for /admin/products/new and
// /admin/products/[id]/edit. Emits a CreateProductInput-shaped payload on
// submit. Variants are intentionally deferred (T03 spec); if the product
// already has variants they are rendered read-only so editing a product
// doesn't nuke variant data. Image upload (T04) uses presigned S3 PUT —
// each selected file goes to /api/admin/uploads/presign → direct PUT to
// the bucket → publicUrl pushed into form.images. No image body ever
// traverses Fly.
// ---------------------------------------------------------------------------

import type { Category, Product } from '@commercejs/types'

export interface ProductFormImage {
  url: string
  altText: string
  sortOrder: number
  isPrimary: boolean
}

export interface ProductFormValue {
  name: string
  nameAr: string
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
}>()

const emit = defineEmits<{
  submit: [value: ProductFormValue, opts: { publish?: boolean }]
  delete: []
}>()

const { t } = useLocalizedString()

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

watch(() => props.initial, () => {
  Object.assign(form, initialValue())
})

const categoryOptions = computed(() =>
  props.categories.map(c => ({ label: t(c.name), value: c.id })),
)

const statusOptions = [
  { label: 'Draft', value: 'draft' },
  { label: 'Active', value: 'active' },
  { label: 'Archived', value: 'archived' },
]

const hasVariants = computed(() => (props.initial?.variants?.length ?? 0) > 0)

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

function onSubmit(publish: boolean) {
  emit('submit', { ...form, images: [...form.images] }, { publish })
}
</script>

<template>
  <form class="flex flex-col gap-6" @submit.prevent>
    <!-- Basics -->
    <UCard>
      <template #header>
        <h2 class="font-semibold text-highlighted">
          Basics
        </h2>
      </template>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <UFormField label="Name (English)" required class="md:col-span-2">
          <UInput v-model="form.name" required placeholder="Product name" />
        </UFormField>
        <UFormField label="Name (Arabic)" class="md:col-span-2">
          <UInput v-model="form.nameAr" dir="rtl" placeholder="اسم المنتج" />
        </UFormField>
        <UFormField label="SKU">
          <UInput v-model="form.sku" placeholder="e.g. SHIRT-001" />
        </UFormField>
        <UFormField label="Status">
          <USelect v-model="form.status" :items="statusOptions" value-key="value" />
        </UFormField>
        <UFormField label="Short description" class="md:col-span-2">
          <UInput v-model="form.shortDescription" />
        </UFormField>
        <UFormField label="Description (English)" class="md:col-span-2">
          <UTextarea v-model="form.description" :rows="4" />
        </UFormField>
        <UFormField label="Description (Arabic)" class="md:col-span-2">
          <UTextarea v-model="form.descriptionAr" :rows="4" dir="rtl" />
        </UFormField>
      </div>
    </UCard>

    <!-- Pricing -->
    <UCard>
      <template #header>
        <h2 class="font-semibold text-highlighted">
          Pricing
        </h2>
      </template>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <UFormField :label="`Price (${currency})`">
          <UInput
            v-model.number="form.price"
            type="number"
            step="0.01"
            min="0"
            :placeholder="`0.00 ${currency}`"
          />
        </UFormField>
        <UFormField :label="`Compare at price (${currency})`" help="Original price — shown as struck-through.">
          <UInput
            v-model.number="form.compareAtPrice"
            type="number"
            step="0.01"
            min="0"
          />
        </UFormField>
        <UFormField label="VAT rate (e.g. 0.15 for 15%)">
          <UInput
            v-model.number="form.vatRate"
            type="number"
            step="0.01"
            min="0"
            max="1"
          />
        </UFormField>
        <UFormField label="VAT included in price">
          <USwitch v-model="form.vatIncluded" />
        </UFormField>
      </div>
    </UCard>

    <!-- Inventory -->
    <UCard>
      <template #header>
        <h2 class="font-semibold text-highlighted">
          Inventory
        </h2>
      </template>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <UFormField label="In stock">
          <USwitch v-model="form.inStock" />
        </UFormField>
        <UFormField label="Requires shipping">
          <USwitch v-model="form.requiresShipping" />
        </UFormField>
        <UFormField label="Inventory quantity" help="Leave blank to not track.">
          <UInput v-model.number="form.inventoryQuantity" type="number" min="0" />
        </UFormField>
        <UFormField label="Purchase limit per order" help="Max units per checkout. Blank = unlimited.">
          <UInput v-model.number="form.quantityLimit" type="number" min="1" />
        </UFormField>
      </div>
    </UCard>

    <!-- Organization -->
    <UCard>
      <template #header>
        <h2 class="font-semibold text-highlighted">
          Organization
        </h2>
      </template>
      <div class="flex flex-col gap-4">
        <UFormField label="Categories" help="Select one or more.">
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
        No attributes yet. Attributes are arbitrary key/value pairs (e.g. "Material: Cotton").
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
            @click="removeAttribute(i)"
          />
        </div>
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
        class="hidden"
        @change="onFileChange"
      >

      <div
        class="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 text-sm text-muted transition-colors"
        :class="isDragging ? 'border-primary bg-primary/5' : 'border-default'"
        @dragover="onDragOver"
        @dragleave="onDragLeave"
        @drop="onDrop"
      >
        <UIcon name="i-heroicons-photo-20-solid" class="w-6 h-6 mb-2" />
        <p>Drop images here or
          <button type="button" class="text-primary underline" @click="openFilePicker">choose files</button>
        </p>
        <p class="text-xs mt-1">JPEG / PNG / WebP / GIF · up to 10 MB each</p>
        <p v-if="uploadingCount > 0" class="text-xs mt-2 text-info">Uploading {{ uploadingCount }}…</p>
      </div>

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
          class="relative flex flex-col gap-2 border rounded-lg p-2 border-default"
        >
          <div class="aspect-square overflow-hidden rounded bg-elevated">
            <img :src="img.url" :alt="img.altText" class="w-full h-full object-cover">
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
                @click="moveImage(i, -1)"
              />
              <UButton
                icon="i-heroicons-arrow-down-20-solid"
                variant="ghost"
                color="neutral"
                size="xs"
                :disabled="i === form.images.length - 1"
                @click="moveImage(i, 1)"
              />
              <UButton
                icon="i-heroicons-trash-20-solid"
                variant="ghost"
                color="error"
                size="xs"
                @click="removeImage(i)"
              />
            </div>
          </div>
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

    <!-- Actions -->
    <div class="flex items-center justify-between">
      <div>
        <UButton
          v-if="mode === 'edit'"
          icon="i-heroicons-trash-20-solid"
          variant="ghost"
          color="error"
          @click="emit('delete')"
        >
          Delete product
        </UButton>
      </div>
      <div class="flex items-center gap-2">
        <UButton
          variant="outline"
          color="neutral"
          :loading="submitting"
          :disabled="submitting"
          @click="onSubmit(false)"
        >
          Save as draft
        </UButton>
        <UButton
          color="primary"
          :loading="submitting"
          :disabled="submitting"
          @click="onSubmit(true)"
        >
          {{ mode === 'create' ? 'Save and publish' : 'Save changes' }}
        </UButton>
      </div>
    </div>
  </form>
</template>
