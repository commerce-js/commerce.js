<template>
  <UApp
    :toaster="{
      position: 'bottom-right',
    }"
  >
    <NuxtLoadingIndicator color="var(--ui-primary)" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
