<template>
  <ComponentDemo>
    <div class="flex flex-wrap gap-4">
      <CProductTypeBadge type="physical" :ui="{ root: 'text-sm px-3 py-1.5' }" />
      <CProductTypeBadge type="digital" :ui="{ root: 'text-sm px-3 py-1.5' }" />
      <CProductTypeBadge type="subscription" :ui="{ root: 'text-sm px-3 py-1.5' }" />
      <CProductTypeBadge type="auction" :ui="{ root: 'text-sm px-3 py-1.5' }" />
      <CProductTypeBadge type="rental" :ui="{ root: 'text-sm px-3 py-1.5' }" />
      <CProductTypeBadge type="event" :ui="{ root: 'text-sm px-3 py-1.5' }" />
      <CProductTypeBadge type="gift_card" :ui="{ root: 'text-sm px-3 py-1.5' }" />
      <CProductTypeBadge type="service" :ui="{ root: 'text-sm px-3 py-1.5' }" />
    </div>
  </ComponentDemo>
</template>
