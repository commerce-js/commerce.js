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

// T12 — storefront theming (CSS custom properties v1). The per-merchant
// theme tokens ride in StoreInfo.theme (adapter returns null when the
// merchant hasn't set any). We render them into a :root { --cjs-* }
// <style> tag in <head> via useHead so the first SSR byte already
// carries the merchant's palette — no flash-of-unstyled-content on
// hydration. Missing tokens are simply omitted, letting any CSS using
// the var fall back to its second-argument default.
const themeCss = computed(() => {
  const t = store.value?.theme
  if (!t) return ''
  const decls: string[] = []
  if (t.primaryColor) decls.push(`--cjs-primary: ${t.primaryColor};`)
  if (t.accentColor) decls.push(`--cjs-accent: ${t.accentColor};`)
  if (t.fontFamily) decls.push(`--cjs-font: ${t.fontFamily};`)
  if (decls.length === 0) return ''
  let css = `:root { ${decls.join(' ')} }`
  if (t.fontFamily) {
    css += ` body { font-family: var(--cjs-font), system-ui, sans-serif; }`
  }
  return css
})

useHead({
  htmlAttrs: { lang: htmlLang, dir: htmlDir },
  style: computed(() =>
    themeCss.value
      ? [{ key: 'cjs-theme', innerHTML: themeCss.value, tagPosition: 'head' as const }]
      : [],
  ),
})
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
