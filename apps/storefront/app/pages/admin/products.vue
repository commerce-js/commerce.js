<script setup lang="ts">
// ---------------------------------------------------------------------------
// /admin/products — placeholder until T03 wires product CRUD.
// Renders inside the admin shell so direct visits show "Coming in T03"
// without a layout break.
// ---------------------------------------------------------------------------

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
  ssr: false,
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <header>
      <h1 class="text-2xl font-bold text-highlighted">
        Products
      </h1>
    </header>

    <UCard>
      <div class="flex items-center gap-3 text-muted">
        <UIcon name="i-heroicons-wrench-screwdriver-20-solid" class="text-2xl text-primary" />
        <div>
          <p class="font-medium text-highlighted">
            Product management lands in T03.
          </p>
          <p class="text-sm mt-1">
            Coming soon: list, create, edit, and delete products — with category and inventory controls.
          </p>
        </div>
      </div>
    </UCard>
  </div>
</template>
