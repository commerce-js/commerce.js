import { computed, type Ref, type WritableComputedRef } from 'vue'

/**
 * Bridges Reka UI `<SelectItem>`'s empty-string ban to real values
 * (including `''` and `null`). Returns a v-model that swaps a sentinel
 * string for the underlying `empty` value.
 *
 * Reka reserves `value=''` for "clear selection", so passing `''` crashes
 * the select at render. This composable keeps storage on the real domain
 * value (empty string, null, `undefined`) and exposes a sentinel to the UI.
 *
 * @example
 *   const status = ref<'' | 'draft' | 'active' | 'archived'>('')
 *   const model = useSelectSentinel(status, { sentinel: 'all', empty: '' })
 *   // model.value === 'all' when status === ''
 *   // setting model.value to 'all' writes '' to status
 *
 * Intentionally a local composable rather than a `@commercejs/ui` export —
 * see .plans/eaas-launch/tasks/T01.md §Out of Scope. No Vue test harness
 * exists in `apps/storefront`; the sentinel↔value round-trip is covered
 * by live acceptance (no SelectItem console error across admin pages).
 */
export function useSelectSentinel<T>(
  source: Ref<T>,
  opts: { sentinel: string, empty: T },
): WritableComputedRef<string | T> {
  return computed<string | T>({
    get() {
      return source.value === opts.empty ? opts.sentinel : (source.value as string | T)
    },
    set(v) {
      source.value = v === opts.sentinel ? opts.empty : (v as T)
    },
  })
}
