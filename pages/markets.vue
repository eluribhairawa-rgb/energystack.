<template>
  <div class="min-h-screen bg-stone-50 px-4 pb-28 pt-6 text-stone-900">
    <section class="mb-6 overflow-hidden rounded-3xl bg-[linear-gradient(130deg,#101418_0%,#1f2937_45%,#2f3c4f_100%)] p-5 text-white shadow-[0_22px_46px_rgba(17,24,39,0.3)]">
      <p class="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">Energy Markets Dashboard</p>
      <h1 class="mt-2 text-2xl font-extrabold tracking-tight">Oil, Gas, Indices & Major Players</h1>
      <p class="mt-2 max-w-xl text-sm text-slate-200">
        Upstream activity, commodities pricing, and large-cap sector performance, with the time each figure was last updated.
      </p>
      <div class="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-100 ring-1 ring-white/20">
        <span class="h-2 w-2 rounded-full" :class="statusDotClass"></span>
        {{ dataStatusLabel }}
      </div>
      <p v-if="freshness.asOf" class="mt-2 text-xs text-slate-300">
        Latest quote: {{ formatDisplayDateTime(freshness.asOf) }}
      </p>
    </section>

    <section class="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <div class="mb-1 flex items-center justify-between sm:col-span-2 lg:col-span-3">
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">Rig Counts</p>
        <span class="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600">Source: {{ dataSources.rigCounts }}</span>
      </div>
      <article
        v-for="item in rigCountCards"
        :key="item.region || item.title"
        class="rounded-2xl bg-white p-4 shadow-[0_10px_22px_rgba(15,23,42,0.08)] ring-1 ring-stone-200/70"
      >
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">{{ item.title }}</p>
        <p class="mt-3 text-3xl font-black tracking-tight">{{ item.value }}</p>
        <div class="mt-2 flex items-center gap-2 text-sm">
          <span :class="item.change >= 0 ? 'text-emerald-600' : 'text-rose-600'">
            {{ item.change >= 0 ? '+' : '' }}{{ item.change }} WoW
          </span>
          <span class="text-stone-500">• Baker Hughes</span>
        </div>

        <div class="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-stone-100 pt-3 text-xs">
          <p class="text-stone-500">Last Count Date</p>
          <p class="text-right font-semibold text-stone-700">{{ formatDisplayDate(item.reportDate) }}</p>

          <p class="text-stone-500">Date of Prior Count</p>
          <p class="text-right font-semibold text-stone-700">{{ formatDisplayDate(item.priorDate) }}</p>

          <p class="text-stone-500">Change from Last Year</p>
          <p :class="item.changeFromLastYear >= 0 ? 'text-right font-semibold text-emerald-600' : 'text-right font-semibold text-rose-600'">
            {{ item.changeFromLastYear >= 0 ? '+' : '' }}{{ item.changeFromLastYear }}
          </p>

          <p class="text-stone-500">Date of Last Year's Count</p>
          <p class="text-right font-semibold text-stone-700">{{ formatDisplayDate(item.lastYearDate) }}</p>
        </div>
      </article>
    </section>

    <section class="mb-6 rounded-3xl bg-white p-4 shadow-[0_12px_26px_rgba(15,23,42,0.08)] ring-1 ring-stone-200/70">
      <div class="mb-4 flex items-center justify-between gap-3">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">Commodities</p>
          <h2 class="mt-1 text-lg font-extrabold">Oil, Gas & Refined Products</h2>
        </div>
        <div class="flex flex-col items-end gap-1">
          <span class="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600">Source: {{ dataSources.commodities }}</span>
          <span class="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600">As of {{ formatDisplayDate(asOf.commodities) }}</span>
        </div>
      </div>

      <div ref="commoditiesScrollRef" class="commodities-scroll overflow-x-auto" @scroll="updateCommoditiesScrollIndicator">
        <table class="w-full min-w-[680px] text-left text-sm">
          <thead>
            <tr class="border-b border-stone-200 text-xs uppercase tracking-[0.14em] text-stone-500">
              <th class="py-2 font-semibold">Commodity</th>
              <th class="py-2 font-semibold">Last</th>
              <th class="py-2 font-semibold">Daily</th>
              <th class="py-2 font-semibold">Weekly</th>
              <th class="py-2 font-semibold">As of</th>
              <th class="py-2 font-semibold">History</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in commodities" :key="row.name" class="border-b border-stone-100">
              <td class="py-3">
                <p class="font-semibold text-stone-900">{{ row.name }}</p>
                <p class="text-xs text-stone-500">{{ row.ticker }}</p>
              </td>
              <td class="py-3">
                <span class="font-semibold">{{ row.price }}</span>
                <span class="ml-1 text-xs text-stone-500">{{ row.unit }}</span>
              </td>
              <td class="py-3" :class="row.day >= 0 ? 'text-emerald-600' : 'text-rose-600'">
                {{ row.day >= 0 ? '+' : '' }}{{ row.day.toFixed(2) }}%
              </td>
              <td class="py-3" :class="row.week >= 0 ? 'text-emerald-600' : 'text-rose-600'">
                {{ row.week >= 0 ? '+' : '' }}{{ row.week.toFixed(2) }}%
              </td>
              <td class="py-3 text-xs text-stone-500">{{ formatDisplayDate(row.priceDate) }}</td>
              <td class="py-3">
                <svg viewBox="0 0 120 36" class="h-9 w-28">
                  <polyline
                    fill="none"
                    :stroke="row.day >= 0 ? '#16a34a' : '#dc2626'"
                    stroke-width="2.2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    :points="sparkline(row.history, 120, 36)"
                  />
                </svg>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="showCommoditiesScrollIndicator" class="mt-2 h-1.5 rounded-full bg-stone-200/60">
        <div
          class="h-full rounded-full bg-stone-300 transition-[width,transform] duration-75"
          :style="{
            width: `${commoditiesIndicatorWidthPct}%`,
            transform: `translateX(${commoditiesIndicatorOffsetPct}%)`
          }"
        ></div>
      </div>
    </section>

    <section class="mb-6 grid gap-4 lg:grid-cols-2">
      <article class="rounded-3xl bg-white p-4 shadow-[0_12px_26px_rgba(15,23,42,0.08)] ring-1 ring-stone-200/70">
        <div class="mb-4 flex items-center justify-between">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">Majors</p>
            <h3 class="mt-1 text-base font-extrabold">Largest Oil & Gas Companies</h3>
          </div>
          <div class="flex flex-col items-end gap-1">
            <span class="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600">Source: {{ dataSources.companies }}</span>
            <span class="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">As of {{ formatDisplayDateTime(asOf.companies) }}</span>
          </div>
        </div>

        <div class="space-y-2">
          <div
            v-for="co in oilGasMajors"
            :key="co.name"
            class="flex items-center justify-between rounded-xl border border-stone-100 px-3 py-2"
          >
            <div>
              <p class="font-semibold">{{ co.name }}</p>
              <p class="text-xs text-stone-500">{{ co.ticker }} • {{ co.marketCap }}</p>
            </div>
            <div class="grid grid-cols-2 items-center gap-10 text-right">
              <p class="text-sm font-semibold text-stone-800">{{ co.price }}</p>
              <p :class="co.change >= 0 ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'">
                {{ co.change >= 0 ? '+' : '' }}{{ co.change.toFixed(2) }}%
              </p>
            </div>
          </div>
        </div>
      </article>

      <article class="rounded-3xl bg-white p-4 shadow-[0_12px_26px_rgba(15,23,42,0.08)] ring-1 ring-stone-200/70">
        <div class="mb-4 flex items-center justify-between">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">Services</p>
            <h3 class="mt-1 text-base font-extrabold">Oilfield Service Leaders</h3>
          </div>
          <div class="flex flex-col items-end gap-1">
            <span class="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600">Source: {{ dataSources.companies }}</span>
            <span class="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800">As of {{ formatDisplayDateTime(asOf.companies) }}</span>
          </div>
        </div>

        <div class="space-y-2">
          <div
            v-for="co in serviceCompanies"
            :key="co.name"
            class="flex items-center justify-between rounded-xl border border-stone-100 px-3 py-2"
          >
            <div>
              <p class="font-semibold">{{ co.name }}</p>
              <p class="text-xs text-stone-500">{{ co.ticker }} • {{ co.marketCap }}</p>
            </div>
            <div class="grid grid-cols-2 items-center gap-6 text-right">
              <p class="text-sm font-semibold text-stone-800">{{ co.price }}</p>
              <p :class="co.change >= 0 ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'">
                {{ co.change >= 0 ? '+' : '' }}{{ co.change.toFixed(2) }}%
              </p>
            </div>
          </div>
        </div>
      </article>
    </section>

    <section class="rounded-3xl bg-white p-4 shadow-[0_12px_26px_rgba(15,23,42,0.08)] ring-1 ring-stone-200/70">
      <div class="mb-4 flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">Global Index</p>
          <h3 class="mt-1 text-base font-extrabold">S&P 500, Nasdaq & Macro Benchmarks</h3>
        </div>
        <div class="flex flex-col items-end gap-1">
          <span class="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600">Source: {{ dataSources.indices }}</span>
          <span class="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600">As of {{ formatDisplayDateTime(asOf.indices) }}</span>
        </div>
      </div>

      <div class="grid gap-3 md:grid-cols-2">
        <article v-for="idx in indices" :key="idx.name" class="rounded-2xl border border-stone-100 p-3">
          <div class="mb-2 flex items-center justify-between">
            <p class="font-semibold">{{ idx.name }}</p>
            <p :class="idx.change >= 0 ? 'text-emerald-600 text-sm font-semibold' : 'text-rose-600 text-sm font-semibold'">
              {{ idx.change >= 0 ? '+' : '' }}{{ idx.change.toFixed(2) }}%
            </p>
          </div>
          <p class="text-xl font-black tracking-tight">{{ idx.value }}</p>
          <p class="text-xs text-stone-500">{{ formatDisplayDateTime(idx.quoteTime) }}</p>
          <svg viewBox="0 0 200 56" class="mt-2 h-12 w-full">
            <polyline
              fill="none"
              :stroke="idx.change >= 0 ? '#16a34a' : '#dc2626'"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              :points="sparkline(idx.history, 200, 56)"
            />
          </svg>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
type Series = number[]

type RigCountCard = {
  region: string
  title: string
  value: number | string
  change: number
  reportDate: string | null
  priorDate: string | null
  changeFromLastYear: number
  lastYearDate: string | null
}

type CommodityRow = {
  name: string
  ticker: string
  price: string
  unit: string
  day: number
  week: number
  priceDate?: string | null
  history: Series
}

type CompanyRow = {
  name: string
  ticker: string
  price: string
  marketCap: string
  change: number
  quoteTime?: string | null
}

type IndexRow = {
  name: string
  value: string
  change: number
  quoteTime?: string | null
  history: Series
}

type StockPayload = {
  sources?: {
    rigCounts: string
    commodities: string
    companies: string
    indices: string
  }
  rigCountCards: RigCountCard[]
  commodities: CommodityRow[]
  oilGasMajors: CompanyRow[]
  serviceCompanies: CompanyRow[]
  indices: IndexRow[]
  asOf?: { rigCounts: string | null; commodities: string | null; companies: string | null; indices: string | null }
  fetchedAt?: string
}

const fallbackStockData: StockPayload = {
  sources: {
    rigCounts: 'Baker Hughes',
    commodities: 'Not specified',
    companies: 'Not specified',
    indices: 'Not specified'
  },
  rigCountCards: [
    {
      region: 'US',
      title: 'US Rig Count',
      value: 581,
      change: 1,
      reportDate: '2026-07-10',
      priorDate: '2026-07-02',
      changeFromLastYear: 44,
      lastYearDate: '2025-07-11'
    },
    {
      region: 'Canada',
      title: 'Canada Rig Count',
      value: 179,
      change: -11,
      reportDate: '2026-07-10',
      priorDate: '2026-07-02',
      changeFromLastYear: 17,
      lastYearDate: '2025-07-11'
    },
    {
      region: 'International',
      title: 'International Rig Count',
      value: 1073,
      change: 27,
      reportDate: '2026-06-01',
      priorDate: '2026-05-01',
      changeFromLastYear: -2,
      lastYearDate: '2025-06-01'
    }
  ],
  commodities: [
    {
      name: 'WTI Crude Oil',
      ticker: 'CL1!',
      price: '$82.41',
      unit: '/ bbl',
      day: 1.14,
      week: 2.47,
      history: [71, 69, 70, 74, 76, 79, 82, 81, 83]
    },
    {
      name: 'Brent Crude Oil',
      ticker: 'BZ1!',
      price: '$86.05',
      unit: '/ bbl',
      day: 0.88,
      week: 1.91,
      history: [74, 73, 72, 75, 77, 80, 84, 85, 86]
    },
    {
      name: 'Natural Gas',
      ticker: 'NG1!',
      price: '$2.91',
      unit: '/ MMBtu',
      day: -0.67,
      week: 4.13,
      history: [2.2, 2.3, 2.4, 2.6, 2.5, 2.7, 2.9, 2.85, 2.91]
    },
    {
      name: 'Heating Oil',
      ticker: 'HO1!',
      price: '$2.58',
      unit: '/ gal',
      day: -0.12,
      week: 1.02,
      history: [2.31, 2.33, 2.37, 2.41, 2.45, 2.49, 2.56, 2.6, 2.58]
    }
  ],
  oilGasMajors: [
    { name: 'ExxonMobil', ticker: 'XOM', price: '$114.20', marketCap: '$495B', change: 0.62 },
    { name: 'Shell', ticker: 'SHEL', price: '$72.86', marketCap: '$221B', change: 0.41 },
    { name: 'Chevron', ticker: 'CVX', price: '$159.44', marketCap: '$287B', change: -0.15 },
    { name: 'TotalEnergies', ticker: 'TTE', price: '$71.09', marketCap: '$162B', change: 0.53 },
    { name: 'ConocoPhillips', ticker: 'COP', price: '$123.38', marketCap: '$141B', change: 1.08 }
  ],
  serviceCompanies: [
    { name: 'Schlumberger', ticker: 'SLB', price: '$47.52', marketCap: '$68B', change: 0.84 },
    { name: 'Halliburton', ticker: 'HAL', price: '$34.16', marketCap: '$29B', change: 0.92 },
    { name: 'Baker Hughes', ticker: 'BKR', price: '$37.22', marketCap: '$37B', change: -0.38 },
    { name: 'NOV', ticker: 'NOV', price: '$18.05', marketCap: '$7B', change: -0.56 },
    { name: 'TechnipFMC', ticker: 'FTI', price: '$27.43', marketCap: '$12B', change: 1.21 }
  ],
  indices: [
    { name: 'S&P 500', value: '5,482.11', change: 0.31, history: [5230, 5260, 5295, 5310, 5360, 5410, 5450, 5468, 5482] },
    { name: 'Nasdaq 100', value: '19,441.30', change: 0.44, history: [18440, 18510, 18680, 18820, 18920, 19100, 19330, 19420, 19441] },
    { name: 'STOXX 600', value: '520.88', change: -0.16, history: [528, 526, 525, 523, 522, 521.5, 521.1, 520.9, 520.88] },
    { name: 'Nikkei 225', value: '40,109.51', change: 0.72, history: [38950, 39220, 39380, 39610, 39840, 39910, 40030, 40090, 40109] }
  ]
}

const { data: stockData, pending, error } = await useFetch<StockPayload>('/api/stock', {
  default: () => fallbackStockData
})

const rigCountCards = computed(() => {
  return stockData.value?.rigCountCards?.length ? stockData.value.rigCountCards : fallbackStockData.rigCountCards
})

const commodities = computed(() => {
  return stockData.value?.commodities?.length ? stockData.value.commodities : fallbackStockData.commodities
})

const oilGasMajors = computed(() => {
  return stockData.value?.oilGasMajors?.length ? stockData.value.oilGasMajors : fallbackStockData.oilGasMajors
})

const serviceCompanies = computed(() => {
  return stockData.value?.serviceCompanies?.length
    ? stockData.value.serviceCompanies
    : fallbackStockData.serviceCompanies
})

const indices = computed(() => {
  return stockData.value?.indices?.length ? stockData.value.indices : fallbackStockData.indices
})

const dataSources = computed(() => {
  return stockData.value?.sources || fallbackStockData.sources!
})

const asOf = computed(() => stockData.value?.asOf || { rigCounts: null, commodities: null, companies: null, indices: null })

// "Live" is based on the age of the newest intraday quote (companies/indices),
// not on the request succeeding. Commodity prices are daily (date only), so
// they don't drive the label.
const LIVE_MAX_AGE_MIN = 30
const STALE_MAX_AGE_HOURS = 72

const now = ref(Date.now())
let nowTimer: ReturnType<typeof setInterval> | null = null
onMounted(() => { nowTimer = setInterval(() => { now.value = Date.now() }, 60_000) })
onBeforeUnmount(() => { if (nowTimer) clearInterval(nowTimer) })

const freshness = computed(() => {
  const times = [asOf.value.companies, asOf.value.indices]
    .map((v) => (v ? new Date(v).getTime() : NaN))
    .filter((t) => Number.isFinite(t))
  const latest = times.length ? Math.max(...times) : null
  if (latest === null) return { state: 'unknown' as const, asOf: null as string | null, ageMin: null as number | null }
  const ageMin = Math.max(0, (now.value - latest) / 60_000)
  const state = ageMin <= LIVE_MAX_AGE_MIN ? 'live' as const : ageMin <= STALE_MAX_AGE_HOURS * 60 ? 'delayed' as const : 'stale' as const
  return { state, asOf: new Date(latest).toISOString(), ageMin }
})

function formatAge(min: number): string {
  if (min < 60) return `${Math.round(min)} min ago`
  if (min < 48 * 60) return `${Math.round(min / 60)} h ago`
  return `${Math.round(min / 1440)} days ago`
}

const dataStatusLabel = computed(() => {
  if (pending.value) return 'Loading market data'
  if (error.value) return 'Using fallback preview data'
  const f = freshness.value
  if (f.state === 'live') return 'Live'
  if (f.state === 'delayed') return `Delayed · updated ${formatAge(f.ageMin!)}`
  if (f.state === 'stale') return `Stale · last updated ${formatAge(f.ageMin!)}`
  return 'Update time unavailable'
})

const statusDotClass = computed(() => {
  if (pending.value) return 'bg-amber-300 animate-pulse'
  if (error.value) return 'bg-rose-400'
  const f = freshness.value
  if (f.state === 'live') return 'bg-lime-400'
  if (f.state === 'delayed') return 'bg-amber-300'
  return 'bg-rose-400'
})

const commoditiesScrollRef = ref<HTMLElement | null>(null)
const showCommoditiesScrollIndicator = ref(false)
const commoditiesIndicatorWidthPct = ref(35)
const commoditiesIndicatorOffsetPct = ref(0)

function updateCommoditiesScrollIndicator() {
  const el = commoditiesScrollRef.value
  if (!el) return

  const { scrollLeft, scrollWidth, clientWidth } = el
  if (scrollWidth <= clientWidth + 1) {
    showCommoditiesScrollIndicator.value = false
    commoditiesIndicatorWidthPct.value = 100
    commoditiesIndicatorOffsetPct.value = 0
    return
  }

  showCommoditiesScrollIndicator.value = true
  const widthPct = Math.max((clientWidth / scrollWidth) * 100, 16)
  const maxScrollable = scrollWidth - clientWidth
  const progress = maxScrollable > 0 ? scrollLeft / maxScrollable : 0
  const maxOffsetPct = 100 - widthPct

  commoditiesIndicatorWidthPct.value = widthPct
  commoditiesIndicatorOffsetPct.value = progress * maxOffsetPct
}

onMounted(() => {
  updateCommoditiesScrollIndicator()
  window.addEventListener('resize', updateCommoditiesScrollIndicator)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateCommoditiesScrollIndicator)
})

function formatDisplayDate(dateInput: string | null | undefined): string {
  if (!dateInput) return '-'
  const date = new Date(dateInput)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('en-US', {
    timeZone: 'UTC',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

function formatDisplayDateTime(input: string | null | undefined): string {
  if (!input) return '-'
  const date = new Date(input)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('en-US', { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })
}

function sparkline(data: Series, width: number, height: number): string {
  if (!data.length) return ''
  const min = Math.min(...data)
  const max = Math.max(...data)
  const spread = max - min || 1

  return data
    .map((value, index) => {
      const x = (index / (data.length - 1 || 1)) * (width - 2) + 1
      const y = height - ((value - min) / spread) * (height - 6) - 3
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')
}
</script>

<style scoped>
.commodities-scroll {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.commodities-scroll::-webkit-scrollbar {
  display: none;
}
</style>
