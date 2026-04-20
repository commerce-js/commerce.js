<script setup lang="ts">
// ---------------------------------------------------------------------------
// /admin/activity — merchant activity / audit log timeline
// ---------------------------------------------------------------------------
//
// Append-only feed of who did what, rendered grouped by day. Filters: actor
// (from admin.auth.listAdmins), entityType, and a from/to date range
// (matches T11 analytics UX). Pagination through a UPagination. Rows
// flagged as "deleted" fall into two cases: a null actorId (system action
// against a now-deleted admin) OR an actorId that no longer appears in the
// live admin list (orphaned after delete). In both cases the snapshotted
// actorEmail still renders for context.
// ---------------------------------------------------------------------------

import type { AdminUserSafe } from '@commercejs/platform'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
  ssr: false,
})

interface ActivityEvent {
  id: string
  actorId: string | null
  actorEmail: string
  action: string
  entityType: string
  entityId: string | null
  diff: Record<string, unknown> | null
  createdAt: string
}

interface PaginatedActivity {
  items: ActivityEvent[]
  total: number
  page: number
  perPage: number
  hasMore: boolean
}

const { label: actionLabel } = useActivityLabel()

const page = ref(1)
const perPage = 50

// Underlying storage uses '' for "all" (the real domain value). The
// `useSelectSentinel` wrappers expose `'all'` to Reka's SelectItem, which
// reserves `value=''` for "clear selection".
const actorIdValue = ref<string>('')
const entityTypeValue = ref<string>('')
const actorId = useSelectSentinel(actorIdValue, { sentinel: 'all', empty: '' })
const entityType = useSelectSentinel(entityTypeValue, { sentinel: 'all', empty: '' })

function daysAgo(n: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - n)
  return d.toISOString().slice(0, 10)
}
const today = new Date().toISOString().slice(0, 10)

type PresetRange = '7d' | '30d' | '90d' | 'all' | 'custom'
const preset = ref<PresetRange>('30d')
const customFrom = ref(daysAgo(30))
const customTo = ref(today)

const rangeOptions = [
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' },
  { label: 'All time', value: 'all' },
  { label: 'Custom', value: 'custom' },
]

const effectiveRange = computed<{ from?: string, to?: string }>(() => {
  switch (preset.value) {
    case '7d': return { from: daysAgo(6), to: today }
    case '30d': return { from: daysAgo(29), to: today }
    case '90d': return { from: daysAgo(89), to: today }
    case 'custom': return { from: customFrom.value, to: customTo.value }
    case 'all': return {}
  }
})

const entityOptions = [
  { label: 'All types', value: 'all' },
  { label: 'Product', value: 'product' },
  { label: 'Category', value: 'category' },
  { label: 'Order', value: 'order' },
  { label: 'Customer', value: 'customer' },
  { label: 'Settings', value: 'settings' },
  { label: 'Staff', value: 'staff' },
]

// Reset to page 1 when filters change
watch([actorIdValue, entityTypeValue, preset, customFrom, customTo], () => {
  page.value = 1
})

const queryParams = computed(() => {
  const q: Record<string, string | number> = { page: page.value, perPage }
  if (actorIdValue.value) q.actorId = actorIdValue.value
  if (entityTypeValue.value) q.entityType = entityTypeValue.value
  const r = effectiveRange.value
  if (r.from) q.from = r.from
  if (r.to) q.to = r.to
  return q
})

const { data: admins } = await useFetch<AdminUserSafe[]>('/api/admin/staff', {
  credentials: 'include',
  key: 'admin-activity-staff',
  server: false,
})

const actorOptions = computed(() => [
  { label: 'All actors', value: 'all' },
  ...((admins.value ?? []).map(a => ({ label: a.email, value: a.id }))),
])

// Set of currently-live admin ids, derived from the already-fetched staff
// list. An event whose actorId isn't in this set is an orphan — the admin
// was deleted after the row was written. The snapshotted actorEmail still
// renders for context; the "deleted" chip tags the row so staff can tell
// the actor is gone.
const liveAdminIds = computed(() => new Set((admins.value ?? []).map(a => a.id)))

function isOrphanActor(ev: ActivityEvent): boolean {
  return !!ev.actorId && !liveAdminIds.value.has(ev.actorId)
}

const { data, pending, error } = await useFetch<PaginatedActivity>('/api/admin/activity', {
  credentials: 'include',
  key: 'admin-activity-list',
  server: false,
  query: queryParams,
})

const items = computed(() => data.value?.items ?? [])
const total = computed(() => data.value?.total ?? 0)

// Group the current page's items by calendar day (YYYY-MM-DD, UTC).
interface DayGroup { day: string; label: string; events: ActivityEvent[] }

const groups = computed<DayGroup[]>(() => {
  const map = new Map<string, ActivityEvent[]>()
  for (const ev of items.value) {
    const d = ev.createdAt.slice(0, 10)
    const arr = map.get(d) ?? []
    arr.push(ev)
    map.set(d, arr)
  }
  const todayKey = today
  const yesterdayKey = daysAgo(1)
  return [...map.entries()].map(([day, events]) => {
    let label: string
    if (day === todayKey) label = 'Today'
    else if (day === yesterdayKey) label = 'Yesterday'
    else label = new Date(`${day}T00:00:00Z`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
    return { day, label, events }
  })
})

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  const now = Date.now()
  const diff = Math.max(0, now - then)
  const s = Math.floor(diff / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d ago`
  return new Date(iso).toLocaleDateString()
}

function entityLink(ev: ActivityEvent): string | null {
  if (!ev.entityId) return null
  switch (ev.entityType) {
    case 'product': return `/admin/products/${ev.entityId}/edit`
    case 'order': return `/admin/orders/${ev.entityId}`
    case 'customer': return `/admin/customers/${ev.entityId}`
    case 'category': return `/admin/categories/${ev.entityId}/edit`
    case 'staff': return `/admin/staff/${ev.entityId}/edit`
    default: return null
  }
}

function entityColor(type: string) {
  switch (type) {
    case 'product': return 'primary'
    case 'order': return 'success'
    case 'customer': return 'info'
    case 'category': return 'warning'
    case 'staff': return 'error'
    case 'settings': return 'neutral'
    default: return 'neutral'
  }
}

function diffSummary(diff: Record<string, unknown> | null): string {
  if (!diff) return ''
  const keys = Object.keys(diff)
  if (keys.length === 0) return ''
  if ('changedKeys' in diff && Array.isArray((diff as any).changedKeys)) {
    return `(${(diff as any).changedKeys.join(', ')})`
  }
  if (keys.length <= 3) {
    return `(${keys.join(', ')})`
  }
  return `(${keys.length} fields)`
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <header>
      <h1 class="text-2xl font-bold text-highlighted">
        Activity
      </h1>
      <p class="text-sm text-muted mt-1">
        {{ total }} events — who did what across your store.
      </p>
    </header>

    <!-- Filters -->
    <UCard>
      <div class="flex flex-col sm:flex-row sm:flex-wrap gap-3 items-end">
        <div class="flex flex-col gap-1">
          <label class="text-xs font-medium text-muted">Actor</label>
          <USelect v-model="actorId" :items="actorOptions" value-key="value" class="sm:w-56" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs font-medium text-muted">Entity</label>
          <USelect v-model="entityType" :items="entityOptions" value-key="value" class="sm:w-44" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs font-medium text-muted">Range</label>
          <USelect v-model="preset" :items="rangeOptions" value-key="value" class="sm:w-44" />
        </div>
        <template v-if="preset === 'custom'">
          <div class="flex flex-col gap-1">
            <label class="text-xs font-medium text-muted">From</label>
            <UInput v-model="customFrom" type="date" class="sm:w-44" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-xs font-medium text-muted">To</label>
            <UInput v-model="customTo" type="date" class="sm:w-44" />
          </div>
        </template>
      </div>
    </UCard>

    <UAlert
      v-if="error"
      color="error"
      variant="subtle"
      title="Could not load activity"
      :description="error.message"
      icon="i-heroicons-exclamation-triangle-20-solid"
    />

    <!-- Empty state -->
    <UCard v-if="!pending && items.length === 0">
      <div class="flex flex-col items-center text-center py-10 gap-3">
        <UIcon name="i-heroicons-clock-20-solid" class="text-4xl text-dimmed" />
        <div>
          <p class="font-medium text-highlighted">No activity yet</p>
          <p class="text-sm text-muted mt-1">
            Changes made by staff show up here automatically.
          </p>
        </div>
      </div>
    </UCard>

    <!-- Timeline -->
    <div v-else class="flex flex-col gap-6">
      <section v-for="group in groups" :key="group.day" class="flex flex-col gap-2">
        <h2 class="text-xs font-semibold uppercase tracking-wider text-muted">
          {{ group.label }}
        </h2>
        <UCard>
          <ul class="divide-y divide-default">
            <li v-for="ev in group.events" :key="ev.id" class="py-3 first:pt-0 last:pb-0 flex items-start gap-3">
              <UIcon
                name="i-heroicons-user-circle-20-solid"
                class="text-xl shrink-0 mt-0.5"
                :class="`text-${entityColor(ev.entityType)}-500`"
              />
              <div class="flex-1 min-w-0 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span class="font-medium text-highlighted truncate max-w-[16rem]">
                  {{ ev.actorEmail }}
                </span>
                <UBadge
                  v-if="!ev.actorId || isOrphanActor(ev)"
                  color="neutral"
                  variant="subtle"
                  size="sm"
                >
                  deleted
                </UBadge>
                <span class="text-sm text-muted">
                  {{ actionLabel(ev.action) }}
                </span>
                <NuxtLink
                  v-if="entityLink(ev)"
                  :to="entityLink(ev)!"
                  class="text-sm font-mono text-primary hover:underline truncate max-w-[14rem]"
                >
                  {{ ev.entityId }}
                </NuxtLink>
                <span v-else-if="ev.entityId" class="text-sm font-mono text-muted truncate max-w-[14rem]">
                  {{ ev.entityId }}
                </span>
                <span v-if="ev.diff" class="text-xs text-muted">
                  {{ diffSummary(ev.diff) }}
                </span>
                <span class="text-xs text-muted ms-auto shrink-0" :title="ev.createdAt">
                  {{ relativeTime(ev.createdAt) }}
                </span>
              </div>
            </li>
          </ul>
        </UCard>
      </section>

      <div v-if="total > perPage" class="flex justify-center">
        <UPagination
          v-model:page="page"
          :total="total"
          :items-per-page="perPage"
          :sibling-count="1"
          show-edges
        />
      </div>
    </div>
  </div>
</template>
