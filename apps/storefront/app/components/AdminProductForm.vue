<script setup lang="ts">
// ---------------------------------------------------------------------------
// AdminProductForm — shared create/edit form for /admin/products/new and
// /admin/products/[id]/edit. Emits a CreateProductInput-shaped payload on
// submit. Variants are intentionally deferred (T03 spec); if the product
// already has variants they are rendered read-only so editing a product
// doesn't nuke variant data. Images are deferred to T04.
// ---------------------------------------------------------------------------

import type { Category, Product } from '@commercejs/types'

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

function onSubmit(publish: boolean) {
  emit('submit', { ...form }, { publish })
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
