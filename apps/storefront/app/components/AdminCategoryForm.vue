<script setup lang="ts">
// ---------------------------------------------------------------------------
// AdminCategoryForm — shared create/edit form for /admin/categories/new and
// /admin/categories/[id]/edit. Emits a CreateCategoryInput-shaped payload on
// submit. Image upload reuses T04's presigned-PUT flow (context='category').
//
// `parentId` stores the real domain value (`''` for root). The Select's
// v-model is wrapped with `useSelectSentinel` so the UI sees `'__root__'`
// — Reka's SelectItem reserves `value=''` for "clear selection".
// ---------------------------------------------------------------------------

import type { Category } from '@commercejs/types'

export interface CategoryFormValue {
  name: string
  nameAr: string
  slug: string
  description: string
  descriptionAr: string
  image: string
  /** Empty string means "no parent" (root category). */
  parentId: string
  sortOrder: number | null
}

const props = defineProps<{
  initial?: Category | null
  /** Flat list of existing categories — used to populate the parent dropdown. */
  categories: Category[]
  /** In edit mode, exclude this id from the parent options (self-parent loop). */
  excludeId?: string | null
  submitting?: boolean
  mode: 'create' | 'edit'
}>()

const emit = defineEmits<{
  submit: [value: CategoryFormValue]
  delete: []
}>()

const { t } = useLocalizedString()

const ROOT_SENTINEL = '__root__'

function initialValue(): CategoryFormValue {
  const c = props.initial
  return {
    name: c ? t(c.name) : '',
    nameAr: c?.name?.ar || '',
    slug: c?.slug || '',
    description: c?.description ? t(c.description) : '',
    descriptionAr: c?.description?.ar || '',
    image: c?.image?.url || '',
    parentId: c?.parentId || '',
    sortOrder: c?.sortOrder ?? null,
  }
}

const form = reactive<CategoryFormValue>(initialValue())

watch(() => props.initial, () => {
  Object.assign(form, initialValue())
})

const parentModel = useSelectSentinel(
  toRef(form, 'parentId'),
  { sentinel: ROOT_SENTINEL, empty: '' },
)

const parentOptions = computed(() => {
  const list: { label: string, value: string }[] = [
    { label: '— (root)', value: ROOT_SENTINEL },
  ]
  for (const c of props.categories) {
    if (props.excludeId && c.id === props.excludeId) continue
    list.push({ label: t(c.name), value: c.id })
  }
  return list
})

// ---- Image upload --------------------------------------------------------

interface PresignResponse {
  uploadUrl: string
  publicUrl: string
  key: string
  expiresIn: number
}

const ACCEPTED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const uploadError = ref<string | null>(null)

function openFilePicker() {
  fileInput.value?.click()
}

async function uploadFile(file: File) {
  if (!ACCEPTED_MIME.includes(file.type)) {
    throw new Error(`Unsupported file type (${file.type || 'unknown'})`)
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`Exceeds ${MAX_UPLOAD_BYTES / (1024 * 1024)} MB limit`)
  }

  const signed = await $fetch<PresignResponse>('/api/admin/uploads/presign', {
    method: 'POST',
    credentials: 'include',
    body: {
      filename: file.name,
      mimeType: file.type,
      size: file.size,
      context: 'category',
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

  form.image = signed.publicUrl
}

async function onFileChange(evt: Event) {
  const input = evt.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  uploadError.value = null
  uploading.value = true
  try {
    await uploadFile(file)
  }
  catch (err: any) {
    uploadError.value = err?.data?.message || err?.message || 'Upload failed'
  }
  finally {
    uploading.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}

function clearImage() {
  form.image = ''
}

function onSubmit() {
  emit('submit', { ...form })
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
          <UInput v-model="form.name" required placeholder="e.g. Summer collection" class="w-full" />
        </UFormField>
        <UFormField label="Name (Arabic)" class="md:col-span-2">
          <UInput v-model="form.nameAr" dir="rtl" placeholder="اسم الفئة" class="w-full" />
        </UFormField>
        <UFormField
          label="Slug"
          help="Leave blank to auto-generate from the name."
          class="md:col-span-2"
        >
          <UInput v-model="form.slug" placeholder="summer-collection" class="w-full" />
        </UFormField>
        <UFormField label="Description (English)" class="md:col-span-2">
          <UTextarea v-model="form.description" :rows="3" class="w-full" />
        </UFormField>
        <UFormField label="Description (Arabic)" class="md:col-span-2">
          <UTextarea v-model="form.descriptionAr" :rows="3" dir="rtl" class="w-full" />
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
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <UFormField label="Parent category" help="Select “— (root)” for a top-level category.">
          <USelect
            v-model="parentModel"
            :items="parentOptions"
            value-key="value"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Sort order" help="Lower numbers appear first. Leave blank for 0.">
          <UInput
            v-model.number="form.sortOrder"
            type="number"
            min="0"
            placeholder="0"
            class="w-full"
          />
        </UFormField>
      </div>
    </UCard>

    <!-- Image -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="font-semibold text-highlighted">
            Image
          </h2>
          <div class="flex items-center gap-2">
            <UButton
              v-if="form.image"
              icon="i-heroicons-x-mark-20-solid"
              variant="ghost"
              color="neutral"
              size="xs"
              @click="clearImage"
            >
              Remove
            </UButton>
            <UButton
              icon="i-heroicons-arrow-up-tray-20-solid"
              variant="outline"
              color="neutral"
              size="xs"
              :loading="uploading"
              @click="openFilePicker"
            >
              {{ form.image ? 'Replace' : 'Upload' }}
            </UButton>
          </div>
        </div>
      </template>

      <input
        ref="fileInput"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        class="hidden"
        @change="onFileChange"
      >

      <div v-if="form.image" class="flex items-center gap-3">
        <div class="w-24 h-24 rounded bg-elevated overflow-hidden flex items-center justify-center">
          <img :src="form.image" alt="" class="w-full h-full object-cover">
        </div>
        <p class="text-xs text-muted break-all">
          {{ form.image }}
        </p>
      </div>

      <button
        v-else
        type="button"
        class="w-full flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 text-sm text-muted border-default hover:border-primary hover:bg-primary/5 transition-colors"
        @click="openFilePicker"
      >
        <UIcon name="i-heroicons-photo-20-solid" class="w-6 h-6 mb-2" />
        <p>Click to upload a category image</p>
        <p class="text-xs mt-1">JPEG / PNG / WebP / GIF · up to 10 MB</p>
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
          Delete category
        </UButton>
      </div>
      <UButton
        color="primary"
        :loading="submitting"
        :disabled="submitting"
        @click="onSubmit"
      >
        {{ mode === 'create' ? 'Create category' : 'Save changes' }}
      </UButton>
    </div>
  </form>
</template>
