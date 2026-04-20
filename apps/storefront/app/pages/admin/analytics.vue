<script setup lang="ts">
// ---------------------------------------------------------------------------
// /admin/analytics — merchant analytics dashboard. KPI tiles, revenue
// bar-chart (inline SVG — no extra deps), top products + top customers
// tables. All range-filterable. Conversion rate placeholder tile is
// intentional: it short-circuits the inevitable "where's conversion rate"
// ticket by surfacing the gap inline.
// ---------------------------------------------------------------------------

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
  ssr: false,
})

interface RevenueBucket { bucket: string; revenue: number; orderCount: number }
interface TopProduct {
  productId: string
  name: { en: string; ar: string }
  sku: string | null
  unitsSold: number
  revenue: number
}
interface TopCustomer {
  customerId: string
  email: string
  orderCount: number
  lifetimeValue: number
}
interface DashboardStats {
  totalRevenue: number
  totalOrders: number
  avgOrderValue: number
  refundRate: number
}

const { formatPrice } = usePrice()
const { store } = useStoreInfo()
const { t } = useLocalizedString()

const currency = computed(() => store.value?.locales?.find(l => l.isDefault)?.currency || 'USD')

type PresetRange = '7d' | '30d' | '90d' | 'custom'
type Granularity = 'day' | 'week' | 'month'

const preset = ref<PresetRange>('30d')
const granularity = ref<Granularity>('day')

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - n)
  return toIsoDate(d)
}

const today = toIsoDate(new Date())
const customFrom = ref(daysAgo(30))
const customTo = ref(today)

const effectiveRange = computed(() => {
  switch (preset.value) {
    case '7d': return { from: daysAgo(6), to: today }
    case '30d': return { from: daysAgo(29), to: today }
    case '90d': return { from: daysAgo(89), to: today }
    case 'custom': return { from: customFrom.value, to: customTo.value }
  }
})

const rangeOptions = [
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' },
  { label: 'Custom', value: 'custom' },
]

const granularityOptions = [
  { label: 'Day', value: 'day' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
]

const revenueQuery = computed(() => ({
  granularity: granularity.value,
  from: effectiveRange.value.from,
  to: effectiveRange.value.to,
}))

const topQuery = computed(() => ({
  limit: 10,
  from: effectiveRange.value.from,
  to: effectiveRange.value.to,
}))

const { data: stats, pending: statsPending } = await useFetch<DashboardStats>('/api/admin/stats', {
  credentials: 'include',
  key: 'admin-analytics-stats',
  server: false,
})

const { data: series, pending: seriesPending, error: seriesError } = await useFetch<RevenueBucket[]>(
  '/api/admin/analytics/revenue',
  {
    credentials: 'include',
    key: 'admin-analytics-revenue',
    server: false,
    query: revenueQuery,
  },
)

const { data: topProducts, pending: productsPending } = await useFetch<TopProduct[]>(
  '/api/admin/analytics/top-products',
  {
    credentials: 'include',
    key: 'admin-analytics-top-products',
    server: false,
    query: topQuery,
  },
)

const { data: topCustomers, pending: customersPending } = await useFetch<TopCustomer[]>(
  '/api/admin/analytics/top-customers',
  {
    credentials: 'include',
    key: 'admin-analytics-top-customers',
    server: false,
    query: topQuery,
  },
)

const buckets = computed<RevenueBucket[]>(() => series.value ?? [])
const maxRevenue = computed(() => Math.max(1, ...buckets.value.map(b => b.revenue)))

// Chart geometry — fixed 560x200 viewBox, 20px outer padding.
const chartW = 560
const chartH = 200
const chartPad = 20
const innerW = chartW - chartPad * 2
const innerH = chartH - chartPad * 2

const bars = computed(() => {
  const n = buckets.value.length
  if (n === 0) return []
  const gap = 4
  const barW = Math.max(2, (innerW - gap * (n - 1)) / n)
  return buckets.value.map((b, i) => {
    const h = (b.revenue / maxRevenue.value) * innerH
    return {
      x: chartPad + i * (barW + gap),
      y: chartPad + innerH - h,
      w: barW,
      h,
      bucket: b.bucket,
      revenue: b.revenue,
      orderCount: b.orderCount,
    }
  })
})

function formatBucket(iso: string): string {
  try {
    const d = new Date(iso)
    if (granularity.value === 'month') {
      return d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' })
    }
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }
  catch {
    return iso
  }
}

const productColumns = [
  { accessorKey: 'name', header: 'Product' },
  { accessorKey: 'sku', header: 'SKU' },
  { accessorKey: 'unitsSold', header: 'Units' },
  { accessorKey: 'revenue', header: 'Revenue' },
]

const customerColumns = [
  { accessorKey: 'email', header: 'Customer' },
  { accessorKey: 'orderCount', header: 'Orders' },
  { accessorKey: 'lifetimeValue', header: 'Lifetime value' },
]
</script>

<template>
  <div class="flex flex-col gap-6">
    <header class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 class="text-2xl font-bold text-highlighted">
          Analytics
        </h1>
        <p class="text-sm text-muted mt-1">
          Revenue, top products, and top customers over time.
        </p>
      </div>
    </header>

    <!-- Range controls -->
    <UCard>
      <div class="flex flex-col sm:flex-row sm:flex-wrap gap-3 items-end">
        <div class="flex flex-col gap-1">
          <label class="text-xs font-medium text-muted">Range</label>
          <USelect
            v-model="preset"
            :items="rangeOptions"
            value-key="value"
            class="sm:w-48"
          />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs font-medium text-muted">Granularity</label>
          <USelect
            v-model="granularity"
            :items="granularityOptions"
            value-key="value"
            class="sm:w-36"
          />
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

    <!-- KPI tiles -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <UCard>
        <p class="text-sm text-muted">Revenue (all-time)</p>
        <p class="text-2xl font-bold text-highlighted mt-1">
          {{ formatPrice({ amount: stats?.totalRevenue ?? 0, currency }) }}
        </p>
      </UCard>
      <UCard>
        <p class="text-sm text-muted">Avg order value</p>
        <p class="text-2xl font-bold text-highlighted mt-1">
          {{ formatPrice({ amount: stats?.avgOrderValue ?? 0, currency }) }}
        </p>
      </UCard>
      <UCard>
        <p class="text-sm text-muted">Orders (all-time)</p>
        <p class="text-2xl font-bold text-highlighted mt-1">
          {{ stats?.totalOrders ?? 0 }}
        </p>
      </UCard>
      <UCard>
        <p class="text-sm text-muted">Refund rate</p>
        <p class="text-2xl font-bold text-highlighted mt-1">
          {{ Math.round((stats?.refundRate ?? 0) * 1000) / 10 }}%
        </p>
      </UCard>
    </div>

    <!-- Revenue chart -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="font-semibold text-highlighted">Revenue over time</h2>
          <span class="text-xs text-muted">
            {{ effectiveRange.from }} → {{ effectiveRange.to }} · {{ granularity }}
          </span>
        </div>
      </template>

      <UAlert
        v-if="seriesError"
        color="error"
        variant="subtle"
        title="Could not load revenue series"
        :description="seriesError.message"
        icon="i-heroicons-exclamation-triangle-20-solid"
      />

      <div v-else-if="seriesPending" class="h-[200px] flex items-center justify-center text-sm text-muted">
        Loading…
      </div>

      <div v-else-if="buckets.length === 0" class="h-[200px] flex items-center justify-center text-sm text-muted">
        No orders in this range.
      </div>

      <svg
        v-else
        :viewBox="`0 0 ${chartW} ${chartH}`"
        class="w-full h-[200px]"
        preserveAspectRatio="none"
      >
        <g>
          <rect
            v-for="b in bars"
            :key="b.bucket"
            :x="b.x"
            :y="b.y"
            :width="b.w"
            :height="b.h"
            class="fill-primary-500/80 hover:fill-primary-500 transition-colors"
          >
            <title>{{ formatBucket(b.bucket) }} — {{ formatPrice({ amount: b.revenue, currency }) }} ({{ b.orderCount }} orders)</title>
          </rect>
        </g>
      </svg>

      <div v-if="buckets.length > 0" class="flex justify-between text-xs text-muted mt-2 px-5">
        <span>{{ formatBucket(buckets[0].bucket) }}</span>
        <span v-if="buckets.length > 2">{{ formatBucket(buckets[Math.floor(buckets.length / 2)].bucket) }}</span>
        <span v-if="buckets.length > 1">{{ formatBucket(buckets[buckets.length - 1].bucket) }}</span>
      </div>
    </UCard>

    <!-- Top products + Top customers -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <UCard>
        <template #header>
          <h2 class="font-semibold text-highlighted">Top products</h2>
        </template>

        <div v-if="!productsPending && (!topProducts || topProducts.length === 0)" class="text-sm text-muted py-6 text-center">
          No product sales in this range.
        </div>

        <UTable
          v-else
          :data="topProducts ?? []"
          :columns="productColumns"
          :loading="productsPending"
        >
          <template #name-cell="{ row }">
            <NuxtLink
              :to="`/admin/products/${row.original.productId}/edit`"
              class="font-medium text-highlighted hover:text-primary"
              dir="auto"
            >
              {{ t(row.original.name) || row.original.name.en }}
            </NuxtLink>
          </template>
          <template #sku-cell="{ row }">
            <span class="font-mono text-xs text-muted">{{ row.original.sku || '—' }}</span>
          </template>
          <template #unitsSold-cell="{ row }">
            {{ row.original.unitsSold }}
          </template>
          <template #revenue-cell="{ row }">
            {{ formatPrice({ amount: row.original.revenue, currency }) }}
          </template>
        </UTable>
      </UCard>

      <UCard>
        <template #header>
          <h2 class="font-semibold text-highlighted">Top customers</h2>
        </template>

        <div v-if="!customersPending && (!topCustomers || topCustomers.length === 0)" class="text-sm text-muted py-6 text-center">
          No customer orders in this range.
        </div>

        <UTable
          v-else
          :data="topCustomers ?? []"
          :columns="customerColumns"
          :loading="customersPending"
        >
          <template #email-cell="{ row }">
            <NuxtLink
              :to="`/admin/customers/${row.original.customerId}`"
              class="font-medium text-highlighted hover:text-primary"
            >
              {{ row.original.email }}
            </NuxtLink>
          </template>
          <template #orderCount-cell="{ row }">
            {{ row.original.orderCount }}
          </template>
          <template #lifetimeValue-cell="{ row }">
            {{ formatPrice({ amount: row.original.lifetimeValue, currency }) }}
          </template>
        </UTable>
      </UCard>
    </div>

    <!-- Conversion rate placeholder — surfaces the gap so merchants don't file tickets -->
    <UCard class="opacity-70">
      <div class="flex items-start gap-3">
        <UIcon name="i-heroicons-cursor-arrow-rays-20-solid" class="text-2xl text-muted mt-0.5" />
        <div>
          <p class="font-medium text-highlighted">Conversion rate</p>
          <p class="text-sm text-muted mt-1">
            Not yet tracked — requires session tracking, coming soon.
          </p>
        </div>
      </div>
    </UCard>
  </div>
</template>
