<template>
  <div class="min-h-screen bg-stone-50 px-4 pb-24 pt-6 text-stone-900">
    <section class="mb-6 overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#111827_0%,#1f2937_55%,#334155_100%)] px-4 py-3 text-white shadow-[0_18px_40px_rgba(152,163,185,0.25)]">
      <div class="flex items-center justify-between gap-3">
        <h1 class="text-lg font-bold tracking-tight text-[#e2f855]">Conference Calendar</h1>
        <p class="text-sm font-medium text-slate-200">{{ currentDateLabel }}</p>
      </div>
    </section>

    <section class="mb-4 rounded-xl bg-white p-2 shadow-[0_14px_30px_rgba(15,23,42,0.08)] ring-1 ring-stone-200/80 md:mb-6 md:rounded-[1.75rem] md:p-4">
      <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between md:mb-6">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.24em] text-gray-400">Month view</p>
          <h2 class="mt-3 text-xl font-bold">{{ monthHeader }}</h2>
        </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="rounded-full border border-[#e2f855]/80 bg-[#e2f855] px-3 py-1 text-sm font-semibold text-black-900 hover:bg-[#d8ef3f]"
            @click="goToToday"
            :disabled="isCurrentMonth"
            :class="isCurrentMonth ? 'cursor-not-allowed opacity-60' : ''"
            aria-label="Go to current month"
          >
            Today
          </button>
          <button
            type="button"
            class="rounded-full border border-stone-200 bg-white px-4 py-1 text-sm font-semibold text-stone-700 hover:bg-stone-50"
            @click="goToPreviousMonth"
            aria-label="Previous month"
          >
            <ChevronLeft class="h-4 w-4" />
          </button>
          <button
            type="button"
            class="rounded-full border border-stone-200 bg-white px-4 py-1 text-sm font-semibold text-stone-700 hover:bg-stone-50"
            @click="goToNextMonth"
            aria-label="Next month"
          >
            <ChevronRight class="h-4 w-4" />
          </button>
        </div>
      </div>

      <div class="grid grid-cols-7 gap-1 text-center md:gap-2">
        <div
          v-for="day in weekDays"
          :key="day"
          class="min-w-0 pb-1 text-[9px] font-semibold uppercase tracking-normal text-gray-400 sm:text-[10px] md:text-[12px] md:tracking-[0.18em]"
        >
          {{ day }}
        </div>

        <div
          v-for="cell in calendarCells"
          :key="cell.key"
          :class="[
            'relative aspect-square min-h-0 min-w-0 overflow-hidden rounded-lg border px-1 py-1 text-left transition-colors md:aspect-auto md:min-h-44 md:rounded-2xl md:px-2 md:py-2',
            selectedDateKey === cell.key ? 'ring-2 ring-blue-500 ring-offset-1 md:ring-0 md:ring-offset-0' : '',
            cell.featured
              ? 'border-lime-300 bg-lime-100/80 text-stone-900'
              : cell.muted
                ? 'border-transparent bg-stone-100 text-gray-300'
                : cell.hasEvent
                  ? 'border-stone-200 bg-white text-stone-900'
                  : 'border-stone-200 bg-white text-black-500'
          ]"
        >
          <button
            v-if="!cell.muted"
            type="button"
            class="absolute inset-0 z-10 md:hidden"
            :aria-label="`Show events for ${cell.key}`"
            @click="selectCalendarCell(cell)"
          ></button>

          <div class="flex items-start justify-between gap-1">
            <span class="text-xs font-semibold md:text-sm">{{ cell.day }}</span>
            <span
              v-if="cell.featured"
              class="mt-0.5 h-2.5 w-2.5 rounded-full bg-lime-500"
            ></span>
          </div>

          <div v-if="cell.events && cell.events.length > 0" class="mt-2 hidden space-y-2 md:block">
            <NuxtLink
              v-for="event in cell.events"
              :key="event.id"
              :to="`/events/${event.id}`"
              class="block rounded-lg border border-stone-200 bg-blue-50 px-2 py-1.5 text-[11px] font-medium leading-4 text-stone-800 shadow-sm hover:border-stone-300 hover:bg-blue-100"
            >
              <p class="line-clamp-2">{{ event.title }}</p>
              <p class="mt-0.5 block max-w-full truncate text-[10px] font-semibold uppercase tracking-[0.06em] text-stone-500">{{ event.type }}</p>
            </NuxtLink>
          </div>

          <div
            v-if="cell.events && cell.events.length > 0"
            class="mt-1 flex items-center justify-center gap-1 md:hidden"
            :aria-label="`${cell.events.length} event${cell.events.length === 1 ? '' : 's'}`"
          >
            <span class="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500"></span>
            <span class="text-[9px] font-semibold leading-none text-stone-600">
              {{ cell.events.length }}
            </span>
          </div>
        </div>
      </div>

      <section
        v-if="selectedDateKey"
        class="mt-4 rounded-xl border border-stone-200 bg-stone-50 p-3 md:hidden"
        aria-live="polite"
      >
        <div class="mb-3 flex items-center justify-between gap-3">
          <div>
            <p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-400">Selected date</p>
            <h3 class="mt-1 text-sm font-bold text-stone-900">{{ selectedDateLabel }}</h3>
          </div>
          <span class="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-stone-500 ring-1 ring-stone-200">
            {{ selectedDayEvents.length }} {{ selectedDayEvents.length === 1 ? 'event' : 'events' }}
          </span>
        </div>

        <div v-if="selectedDayEvents.length > 0" class="space-y-2">
          <NuxtLink
            v-for="event in selectedDayEvents"
            :key="event.id"
            :to="`/events/${event.id}`"
            class="block rounded-xl bg-white p-3 shadow-sm ring-1 ring-stone-200 transition-colors hover:bg-blue-50"
          >
            <div class="flex items-start justify-between gap-3">
              <h4 class="min-w-0 flex-1 text-sm font-bold leading-5 text-stone-900">
                {{ event.title }}
              </h4>
              <span class="max-w-28 shrink-0 truncate rounded-full bg-blue-100 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-stone-700">
                {{ event.type }}
              </span>
            </div>
            <p class="mt-1 text-xs text-stone-500">{{ event.location }}</p>
            <p class="mt-2 text-xs font-semibold text-stone-700">{{ event.dateRange }}</p>
          </NuxtLink>
        </div>

        <p v-else class="rounded-xl bg-white px-3 py-4 text-center text-xs text-stone-400 ring-1 ring-stone-200">
          No events scheduled for this date.
        </p>
      </section>
    </section>

    <section v-if="fetchErrorMessage" class="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      {{ fetchErrorMessage }}
    </section>

    <section>
      <div class="mb-4 flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.24em] text-stone-400">Agenda</p>
          <h2 class="mt-1 text-lg font-bold">Upcoming dates</h2>
        </div>
        <button
          v-if="selectedEventTypes.length > 0 || selectedSourceNames.length > 0 || selectedLocations.length > 0 || eventTypeQuery"
          type="button"
          class="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700"
          @click="clearFilters"
        >
          Clear filters
        </button>
      </div>

      <div class="mb-4 rounded-2xl bg-white p-4 ring-1 ring-stone-200/80">
        <label class="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">Search filters</label>
        <input
          v-model="eventTypeQuery"
          type="text"
          placeholder="Type to search filter options..."
          class="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 outline-none focus:border-stone-400"
        />

        <div ref="filterMenusWrapper" class="relative z-20 mt-3 grid gap-2 md:grid-cols-3">
          <div class="relative">
            <button
              type="button"
              class="flex w-full items-center justify-between rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-semibold text-stone-700"
              @click="toggleFilterMenu('eventType')"
            >
              <span>
                Event type
                <span class="ml-1 text-xs font-medium text-stone-500">({{ selectedEventTypes.length }})</span>
              </span>
              <span class="text-xs text-stone-500">▾</span>
            </button>

            <div
              v-if="openFilterMenu === 'eventType'"
              class="absolute left-0 top-[calc(100%+0.5rem)] z-40 w-full min-w-[220px] rounded-xl border border-stone-200 bg-white p-3 shadow-[0_16px_30px_rgba(15,23,42,0.14)]"
            >
              <div class="max-h-56 space-y-1 overflow-y-auto pr-1">
                <label v-for="eventType in filteredEventTypeOptions" :key="eventType" class="flex items-center gap-2 text-sm text-stone-700">
                  <input
                    type="checkbox"
                    class="h-4 w-4 rounded border-stone-300 text-black focus:ring-black"
                    :checked="selectedEventTypes.includes(eventType)"
                    @change="toggleEventTypeFilter(eventType)"
                  />
                  <span>{{ eventType }}</span>
                </label>
                <p v-if="filteredEventTypeOptions.length === 0" class="text-xs text-stone-400">No event type match found.</p>
              </div>
            </div>
          </div>

          <div class="relative">
            <button
              type="button"
              class="flex w-full items-center justify-between rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-semibold text-stone-700"
              @click="toggleFilterMenu('source')"
            >
              <span>
                Source
                <span class="ml-1 text-xs font-medium text-stone-500">({{ selectedSourceNames.length }})</span>
              </span>
              <span class="text-xs text-stone-500">▾</span>
            </button>

            <div
              v-if="openFilterMenu === 'source'"
              class="absolute left-0 top-[calc(100%+0.5rem)] z-40 w-full min-w-[220px] rounded-xl border border-stone-200 bg-white p-3 shadow-[0_16px_30px_rgba(15,23,42,0.14)]"
            >
              <div class="max-h-56 space-y-1 overflow-y-auto pr-1">
                <label v-for="source in filteredSourceOptions" :key="source" class="flex items-center gap-2 text-sm text-stone-700">
                  <input
                    type="checkbox"
                    class="h-4 w-4 rounded border-stone-300 text-black focus:ring-black"
                    :checked="selectedSourceNames.includes(source)"
                    @change="toggleSourceFilter(source)"
                  />
                  <span>{{ source }}</span>
                </label>
                <p v-if="filteredSourceOptions.length === 0" class="text-xs text-stone-400">No source match found.</p>
              </div>
            </div>
          </div>

          <div class="relative">
            <button
              type="button"
              class="flex w-full items-center justify-between rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-semibold text-stone-700"
              @click="toggleFilterMenu('location')"
            >
              <span>
                Location
                <span class="ml-1 text-xs font-medium text-stone-500">({{ selectedLocations.length }})</span>
              </span>
              <span class="text-xs text-stone-500">▾</span>
            </button>

            <div
              v-if="openFilterMenu === 'location'"
              class="absolute left-0 top-[calc(100%+0.5rem)] z-40 w-full min-w-[220px] rounded-xl border border-stone-200 bg-white p-3 shadow-[0_16px_30px_rgba(15,23,42,0.14)]"
            >
              <div class="max-h-56 space-y-1 overflow-y-auto pr-1">
                <label v-for="location in filteredLocationOptions" :key="location" class="flex items-center gap-2 text-sm text-stone-700">
                  <input
                    type="checkbox"
                    class="h-4 w-4 rounded border-stone-300 text-black focus:ring-black"
                    :checked="selectedLocations.includes(location)"
                    @change="toggleLocationFilter(location)"
                  />
                  <span>{{ location }}</span>
                </label>
                <p v-if="filteredLocationOptions.length === 0" class="text-xs text-stone-400">No location match found.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-3">
        <p
          v-if="events.length === 0"
          class="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-500"
        >
          No events match the selected filters.
        </p>

        <article
          v-for="event in events"
          :key="event.id"
          class="flex gap-4 rounded-[1.5rem] bg-white p-4 shadow-[0_12px_24px_rgba(15,23,42,0.06)] ring-1 ring-stone-200/70"
        >
          <div class="flex w-16 shrink-0 flex-col items-center justify-center rounded-[1.25rem] bg-stone-100 text-stone-900">
            <span class="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">{{ event.month }}</span>
            <span class="text-2xl font-black leading-none">{{ event.day }}</span>
          </div>

          <NuxtLink :to="`/events/${event.id}`" class="min-w-0 flex-1">
            <div class="flex flex-col items-start gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
              <div class="min-w-0">
                <h3 class="text-base font-bold leading-5 break-words [overflow-wrap:anywhere]">{{ event.title }}</h3>
                <p class="mt-1 text-sm text-stone-500">{{ event.location }}</p>
              </div>
              <span class="inline-flex max-w-[10rem] self-start truncate rounded-full bg-blue-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-700 sm:max-w-[14rem]">
                {{ event.type }}
              </span>
            </div>

            <div class="mt-4 flex items-center justify-between gap-3 text-sm">
              <p class="text-stone-600">{{ event.dateRange }}</p>
              <span class="font-semibold text-stone-900 underline decoration-stone-300 underline-offset-4">
                View details
              </span>
            </div>
          </NuxtLink>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

function queryValues(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string' && item.length > 0)
  return typeof value === 'string' && value.length > 0 ? [value] : []
}

function queryValue(value: unknown): string {
  return queryValues(value)[0] || ''
}

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const eventTypeQuery = ref(queryValue(route.query.filter_search))
const selectedEventTypes = ref<string[]>(queryValues(route.query.event_type))
const selectedSourceNames = ref<string[]>(queryValues(route.query.source))
const selectedLocations = ref<string[]>(queryValues(route.query.location))
const selectedDateKey = ref('')
const openFilterMenu = ref<'eventType' | 'source' | 'location' | null>(null)
const filterMenusWrapper = ref<HTMLElement | null>(null)

const relatedTermsMap: Record<string, string[]> = {
  conference: ['summit', 'forum', 'symposium', 'convention', 'expo'],
  summit: ['conference', 'forum'],
  forum: ['conference', 'summit'],
  webinar: ['online', 'virtual', 'webinar'],
  workshop: ['training', 'bootcamp', 'masterclass'],
  expo: ['exhibition', 'showcase', 'conference'],
  exhibition: ['expo', 'showcase'],
  meetup: ['networking', 'gathering']
}
type ConferenceRow = {
  id: string
  title: string
  description: string | null
  start_date: string
  end_date: string | null
  location: string | null
  venue: string | null
  category: string | null
  source_id: string | null
  source?: { name: string | null } | null
  is_active: boolean | null
}

type CalendarCell = {
  key: string
  day: string
  muted?: boolean
  hasEvent?: boolean
  featured?: boolean
  events?: Array<{
    id: string
    title: string
    type: string
  }>
}

type AgendaEvent = {
  id: string
  month: string
  day: string
  title: string
  location: string
  type: string
  dateRange: string
  startDate: Date
}

const { data: conferenceRows, error: conferenceError } = await useAsyncData('conference-listings', async () => {
  const { data } = await $fetch<{ data: any[] }>('/api/events')
  return (data || []).map((row: any) => ({
    ...row,
    source: row.source_name ? { name: row.source_name } : null
  })) as ConferenceRow[]
})

function parseDateOnly(dateString: string): Date {
  const parts = dateString.split('-').map(Number)
  const year = parts[0]
  const month = parts[1]
  const day = parts[2]
  if (year === undefined || month === undefined || day === undefined) {
    return new Date(NaN)
  }
  if (![year, month, day].every(Number.isFinite)) {
    return new Date(NaN)
  }
  return new Date(Date.UTC(year, month - 1, day))
}

function parseMonthQuery(monthQuery: string | string[] | undefined): Date | null {
  const value = Array.isArray(monthQuery) ? monthQuery[0] : monthQuery
  if (!value) return null
  const match = /^(\d{4})-(\d{2})$/.exec(value)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) return null
  return new Date(Date.UTC(year, month - 1, 1))
}

function toMonthQuery(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

function toDateKey(date: Date): string {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    timeZone: 'UTC'
  })
}

function formatDayMonth(date: Date): { day: string, month: string } {
  return {
    day: String(date.getUTCDate()).padStart(2, '0'),
    month: date.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' })
  }
}

function formatDateRange(start: Date, end: Date | null): string {
  if (!end || toDateKey(start) === toDateKey(end)) return formatShortDate(start)
  return `${formatShortDate(start)} - ${formatShortDate(end)}`
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
}

function baseWord(word: string): string {
  if (word.endsWith('ies') && word.length > 4) return `${word.slice(0, -3)}y`
  if (word.endsWith('es') && word.length > 3) return word.slice(0, -2)
  if (word.endsWith('s') && word.length > 3) return word.slice(0, -1)
  if (word.endsWith('ing') && word.length > 5) return word.slice(0, -3)
  if (word.endsWith('ed') && word.length > 4) return word.slice(0, -2)
  return word
}

function tokenize(value: string): string[] {
  return normalizeText(value)
    .split(' ')
    .map(baseWord)
    .filter(token => token.length >= 3)
}

function expandRelatedTerms(value: string): string[] {
  const directTokens = tokenize(value)
  const expanded = new Set<string>(directTokens)

  for (const token of directTokens) {
    const related = relatedTermsMap[token] || []
    for (const term of related) {
      expanded.add(baseWord(normalizeText(term)))
    }
  }

  return [...expanded].filter(Boolean)
}

const conferences = computed(() => {
  return (conferenceRows.value || []).map((row) => {
    const startDate = parseDateOnly(row.start_date)
    const endDate = row.end_date ? parseDateOnly(row.end_date) : null
    return {
      ...row,
      startDate,
      endDate,
      type: row.category || row.venue || 'Conference',
      sourceId: row.source_id,
      sourceName: row.source?.name || null
    }
  })
})

const now = new Date()
const currentUtcDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))

const upcomingConferences = computed(() => {
  const upcoming = conferences.value.filter(item => item.startDate >= currentUtcDate)
  return upcoming.length > 0 ? upcoming : conferences.value
})

const initialMonthDate = computed(() => {
  const base = upcomingConferences.value[0]?.startDate || currentUtcDate
  return new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), 1))
})

const selectedMonthDate = ref<Date | null>(parseMonthQuery(route.query.month as string | string[] | undefined))

watchEffect(() => {
  if (!selectedMonthDate.value) {
    selectedMonthDate.value = initialMonthDate.value
  }
})

const calendarMonthDate = computed(() => selectedMonthDate.value || initialMonthDate.value)

watch([
  calendarMonthDate,
  eventTypeQuery,
  selectedEventTypes,
  selectedSourceNames,
  selectedLocations
], () => {
  if (!import.meta.client) return
  const month = toMonthQuery(calendarMonthDate.value)
  const filterSearch = eventTypeQuery.value.trim()
  const currentTypes = queryValues(route.query.event_type)
  const currentSources = queryValues(route.query.source)
  const currentLocations = queryValues(route.query.location)
  const arraysMatch = (left: string[], right: string[]) => (
    left.length === right.length && left.every((value, index) => value === right[index])
  )

  if (
    queryValue(route.query.month) === month &&
    queryValue(route.query.filter_search) === filterSearch &&
    arraysMatch(currentTypes, selectedEventTypes.value) &&
    arraysMatch(currentSources, selectedSourceNames.value) &&
    arraysMatch(currentLocations, selectedLocations.value)
  ) return

  const nextQuery: Record<string, string | string[]> = {
    ...Object.fromEntries(
      Object.entries(route.query).filter(([, value]) => value !== null)
    ) as Record<string, string | string[]>,
    month
  }

  if (filterSearch) nextQuery.filter_search = filterSearch
  else delete nextQuery.filter_search

  if (selectedEventTypes.value.length > 0) nextQuery.event_type = [...selectedEventTypes.value]
  else delete nextQuery.event_type

  if (selectedSourceNames.value.length > 0) nextQuery.source = [...selectedSourceNames.value]
  else delete nextQuery.source

  if (selectedLocations.value.length > 0) nextQuery.location = [...selectedLocations.value]
  else delete nextQuery.location

  router.replace({
    query: nextQuery
  })
}, { immediate: true, deep: true })

function goToPreviousMonth() {
  const base = calendarMonthDate.value
  selectedMonthDate.value = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() - 1, 1))
}

function goToNextMonth() {
  const base = calendarMonthDate.value
  selectedMonthDate.value = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 1))
}

function goToToday() {
  selectedMonthDate.value = new Date(Date.UTC(currentUtcDate.getUTCFullYear(), currentUtcDate.getUTCMonth(), 1))
}

const isCurrentMonth = computed(() => {
  return (
    calendarMonthDate.value.getUTCFullYear() === currentUtcDate.getUTCFullYear() &&
    calendarMonthDate.value.getUTCMonth() === currentUtcDate.getUTCMonth()
  )
})

const monthHeader = computed(() => {
  return calendarMonthDate.value.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC'
  })
})

const currentDateLabel = computed(() => {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: '2-digit',
    year: 'numeric'
  })
})

const monthEvents = computed(() => {
  const year = calendarMonthDate.value.getUTCFullYear()
  const month = calendarMonthDate.value.getUTCMonth()
  return conferences.value.filter(item => item.startDate.getUTCFullYear() === year && item.startDate.getUTCMonth() === month)
})

const eventTypeOptions = computed(() => {
  return [...new Set(conferences.value.map(item => item.type).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b))
})

const filteredEventTypeOptions = computed(() => {
  const query = normalizeText(eventTypeQuery.value)
  if (!query) return eventTypeOptions.value
  const expandedQueryTerms = expandRelatedTerms(query)
  return eventTypeOptions.value.filter((type) => {
    const searchable = normalizeText(type)
    if (searchable.includes(query)) return true
    return expandedQueryTerms.some(term => searchable.includes(term))
  })
})

const sourceOptions = computed(() => {
  return [...new Set(
    conferences.value
      .map(item => item.sourceName || item.sourceId)
      .filter((value): value is string => Boolean(value))
  )].sort((a, b) => a.localeCompare(b))
})

const filteredSourceOptions = computed(() => {
  const query = normalizeText(eventTypeQuery.value)
  if (!query) return sourceOptions.value
  return sourceOptions.value.filter(source => normalizeText(source).includes(query))
})

const locationOptions = computed(() => {
  return [...new Set(
    conferences.value
      .map(item => item.location)
      .filter((value): value is string => Boolean(value))
  )].sort((a, b) => a.localeCompare(b))
})

const filteredLocationOptions = computed(() => {
  const query = normalizeText(eventTypeQuery.value)
  if (!query) return locationOptions.value
  return locationOptions.value.filter(location => normalizeText(location).includes(query))
})

const filteredMonthEvents = computed(() => {
  const hasTypeFilters = selectedEventTypes.value.length > 0
  const hasSourceFilters = selectedSourceNames.value.length > 0
  const hasLocationFilters = selectedLocations.value.length > 0
  if (!hasTypeFilters && !hasSourceFilters && !hasLocationFilters) return monthEvents.value

  const selectedTypes = [...new Set(
    selectedEventTypes.value.map(normalizeText).filter(Boolean)
  )]

  const selectedSources = [...new Set(
    selectedSourceNames.value.map(normalizeText).filter(Boolean)
  )]

  const selectedLocationValues = [...new Set(
    selectedLocations.value.map(normalizeText).filter(Boolean)
  )]

  return monthEvents.value.filter((item) => {
    const itemType = normalizeText(item.type)
    const itemSource = normalizeText(item.sourceName || item.sourceId || '')
    const itemLocation = normalizeText(item.location || '')

    const typeMatched = selectedTypes.length === 0 || selectedTypes.includes(itemType)
    const sourceMatched = selectedSources.length === 0 || selectedSources.includes(itemSource)
    const locationMatched = selectedLocationValues.length === 0 || selectedLocationValues.includes(itemLocation)

    return typeMatched && sourceMatched && locationMatched
  })
})

function toggleEventTypeFilter(eventType: string) {
  const idx = selectedEventTypes.value.indexOf(eventType)
  if (idx === -1) {
    selectedEventTypes.value.push(eventType)
  } else {
    selectedEventTypes.value.splice(idx, 1)
  }
}

function toggleFilterMenu(menu: 'eventType' | 'source' | 'location') {
  openFilterMenu.value = openFilterMenu.value === menu ? null : menu
}

function handleFilterMenuOutsideClick(event: MouseEvent) {
  if (!openFilterMenu.value) return
  const targetNode = event.target as Node | null
  if (!targetNode) return
  if (filterMenusWrapper.value?.contains(targetNode)) return
  openFilterMenu.value = null
}

onMounted(() => {
  if (!import.meta.client) return
  document.addEventListener('click', handleFilterMenuOutsideClick)
})

onBeforeUnmount(() => {
  if (!import.meta.client) return
  document.removeEventListener('click', handleFilterMenuOutsideClick)
})

function toggleSourceFilter(source: string) {
  const idx = selectedSourceNames.value.indexOf(source)
  if (idx === -1) {
    selectedSourceNames.value.push(source)
  } else {
    selectedSourceNames.value.splice(idx, 1)
  }
}

function toggleLocationFilter(location: string) {
  const idx = selectedLocations.value.indexOf(location)
  if (idx === -1) {
    selectedLocations.value.push(location)
  } else {
    selectedLocations.value.splice(idx, 1)
  }
}

function clearFilters() {
  selectedEventTypes.value = []
  selectedSourceNames.value = []
  selectedLocations.value = []
  eventTypeQuery.value = ''
  openFilterMenu.value = null
}

const eventsByDate = computed(() => {
  const grouped = new Map<string, typeof conferences.value>()
  for (const event of filteredMonthEvents.value) {
    const key = toDateKey(event.startDate)
    const bucket = grouped.get(key) || []
    bucket.push(event)
    grouped.set(key, bucket)
  }
  return grouped
})

const currentDateKey = computed(() => {
  const sameMonth =
    currentUtcDate.getUTCFullYear() === calendarMonthDate.value.getUTCFullYear() &&
    currentUtcDate.getUTCMonth() === calendarMonthDate.value.getUTCMonth()

  return sameMonth ? toDateKey(currentUtcDate) : ''
})

const calendarCells = computed<CalendarCell[]>(() => {
  const year = calendarMonthDate.value.getUTCFullYear()
  const month = calendarMonthDate.value.getUTCMonth()
  const firstDay = new Date(Date.UTC(year, month, 1))
  const lastDay = new Date(Date.UTC(year, month + 1, 0))

  const mondayStartOffset = (firstDay.getUTCDay() + 6) % 7
  const prevMonthLastDay = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const cells: CalendarCell[] = []

  for (let i = mondayStartOffset; i > 0; i--) {
    const day = prevMonthLastDay - i + 1
    cells.push({ key: `prev-${day}`, day: String(day), muted: true })
  }

  for (let day = 1; day <= lastDay.getUTCDate(); day++) {
    const date = new Date(Date.UTC(year, month, day))
    const key = toDateKey(date)
    const dayEvents = eventsByDate.value.get(key) || []
    cells.push({
      key,
      day: String(day),
      hasEvent: dayEvents.length > 0,
      featured: key === currentDateKey.value,
      events: dayEvents.map(event => ({
        id: event.id,
        title: event.title,
        type: event.type
      }))
    })
  }

  while (cells.length % 7 !== 0) {
    const day = cells.length - (mondayStartOffset + lastDay.getUTCDate()) + 1
    cells.push({ key: `next-${day}`, day: String(day), muted: true })
  }

  return cells
})

const events = computed<AgendaEvent[]>(() => {
  // QA L2: the "Upcoming dates" agenda hides events that have already ended
  // (the calendar grid above still shows them).
  return filteredMonthEvents.value
    .filter((event) => (event.endDate || event.startDate) >= currentUtcDate)
    .map((event) => ({
    id: event.id,
    ...formatDayMonth(event.startDate),
    title: event.title,
    location: event.location || 'Location not listed',
    type: event.type,
    dateRange: formatDateRange(event.startDate, event.endDate),
    startDate: event.startDate
  }))
})

function selectCalendarCell(cell: CalendarCell) {
  if (cell.muted || !/^\d{4}-\d{2}-\d{2}$/.test(cell.key)) return
  selectedDateKey.value = cell.key
}

const selectedDateLabel = computed(() => {
  if (!selectedDateKey.value) return ''
  const date = parseDateOnly(selectedDateKey.value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC'
  })
})

const selectedDayEvents = computed<AgendaEvent[]>(() => {
  if (!selectedDateKey.value) return []
  return events.value.filter(event => toDateKey(event.startDate) === selectedDateKey.value)
})

const fetchErrorMessage = computed(() => conferenceError.value?.message ? `Failed to load conferences: ${conferenceError.value.message}` : '')
</script>
