<script setup lang="ts">
// Per-render resolution of merchant locale/direction from useStoreInfo.
// The composable's useFetch is cached per SSR pass (key: commerce:store)
// so we pay a single upstream call on first render, then reuse for the
// life of the process. Reactive computeds flow through useHead so the
// first HTML byte already carries correct lang/dir — no flash of LTR
// before hydration for Arabic merchants.
const { store } = useStoreInfo()

const defaultLocale = computed(() => {
  const locs = store.value?.locales
  return locs?.find(l => l.isDefault) || locs?.[0]
})

const htmlLang = computed(() => defaultLocale.value?.code === 'ar' ? 'ar' : 'en')
const htmlDir = computed(() => defaultLocale.value?.direction === 'rtl' ? 'rtl' : 'ltr')

useHead({
  htmlAttrs: { lang: htmlLang, dir: htmlDir },
})
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
