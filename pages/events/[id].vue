<template>
  <div class="flex min-h-screen flex-col bg-stone-50 text-stone-900">
    <div class="fixed left-0 right-0 top-0 z-50 mx-auto flex h-16 md:h-20 max-w-6xl items-center justify-between bg-white px-4 sm:px-6 lg:px-8">
      <button @click="handleBack" class="-ml-2 p-2">
        <ChevronLeft class="h-6 w-6" />
      </button>

      <div class="flex items-center gap-2">
        <button
          @click="showSubscribeDialog = true"
          class="flex items-center gap-2 bg-black hover:bg-gray-800 text-[#e2f855] px-3 py-1.5 rounded-full transition-colors cursor-pointer"
        >
          <Mail class="h-5 w-5" />
          <span class="text-xs font-semibold">Subscribe</span>
        </button>

        <button v-if="eventItem" @click="handleShare" class="relative rounded-full p-1 transition-colors hover:bg-gray-100">
          <Share2 class="h-5 w-5 text-gray-600" />
          <Transition name="fade">
            <span v-if="showCopied" class="absolute -bottom-8 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded bg-black px-2 py-1 text-[10px] text-white">
              Link Copied!
            </span>
          </Transition>
        </button>

        <NuxtLink
          to="/profile"
          class="w-10 h-10 rounded-full border border-gray-200 cursor-pointer block relative"
        >
          <div class="w-full h-full rounded-full overflow-hidden">
            <img
              v-if="authStore.user && authStore.profile?.avatar_url"
              :src="authStore.profile.avatar_url"
              alt="User Avatar"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
              <CircleUserRound class="w-6 h-6" />
            </div>
          </div>
        </NuxtLink>
      </div>
    </div>

    <div class="flex-grow px-4 sm:px-6 lg:px-8 pb-24 md:pb-12 pt-16 md:pt-20">
      <div v-if="pending && !eventItem" class="flex h-[70vh] items-center justify-center">
        <div class="h-12 w-12 animate-spin rounded-full border-b-2 border-black"></div>
      </div>

      <div v-else-if="!eventItem && !pending" class="flex h-[70vh] flex-col items-center justify-center px-4 text-center">
        <div class="mb-4 rounded-full bg-gray-100 p-4">
          <SearchX class="h-12 w-12 text-gray-400" />
        </div>
        <h1 class="mb-2 text-2xl font-bold">Event Not Found</h1>
        <p class="mb-8 text-gray-500">This conference event does not exist or is no longer active.</p>
        <button @click="router.push('/events')" class="rounded-full bg-black px-6 py-2.5 font-bold text-white">
          Back to Calendar
        </button>
      </div>

      <div v-else-if="eventItem" class="animate-in fade-in flex flex-col duration-500">
        <h1 class="mb-2 text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">{{ eventItem.title }}</h1>

        <div class="mb-4 flex flex-wrap items-center gap-3 text-sm text-gray-500">
          <div class="flex items-center gap-1">
            <CalendarDays class="h-4 w-4" />
            <span>{{ eventItem.dateRange }}</span>
          </div>
          <div class="flex items-center gap-1" v-if="eventItem.location">
            <MapPin class="h-4 w-4" />
            <span>{{ eventItem.location }}</span>
          </div>
        </div>

        <div class="mb-6 flex flex-wrap gap-2">
          <span class="rounded-full bg-[#e2f855] px-3 py-1 text-sm font-bold">{{ eventItem.type }}</span>
          <span v-if="eventItem.sourceName || eventItem.sourceId" class="rounded-full bg-stone-100 px-3 py-1 text-sm font-bold text-stone-700">
            {{ eventItem.sourceName || eventItem.sourceId }}
          </span>
        </div>

        <div v-if="eventItem.imageUrl" class="mb-7 w-2/5 overflow-hidden rounded-2xl border border-stone-200 bg-white">
          <img
            :src="eventItem.imageUrl"
            :alt="eventItem.title"
            class="aspect-[6/4] w-full object-cover"
            loading="lazy"
          />
        </div>

        <div class="mb-6 flex gap-2 overflow-x-auto no-scrollbar whitespace-nowrap">
          <button
            v-for="tab in detailTabs"
            :key="tab"
            type="button"
            @click="activeTab = tab"
            :class="[
              'px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer border',
              activeTab === tab
                ? 'bg-black text-white border-black'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            ]"
          >
            {{ tab }}
          </button>
        </div>

        <div v-if="activeTab === 'Overview'" class="mb-6 overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#111827_0%,#1f2937_55%,#334155_100%)] p-5 text-white shadow-[0_16px_34px_rgba(15,23,42,0.22)]">
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-lime-300">{{ snapshotLabel }}</p>
          <p class="mt-3 text-sm leading-6 text-slate-100">{{ eventItem.description }}</p>
        </div>

        <div v-else-if="activeTab === 'Details'" class="mb-6 rounded-2xl bg-white p-4 ring-1 ring-stone-200/80">
          <p v-if="eventItem.detailedDescription" class="text-sm leading-6 text-stone-700 whitespace-pre-line">
            {{ eventItem.detailedDescription }}
          </p>
          <p v-else class="text-sm text-stone-500">Details coming soon.</p>
        </div>

        <div v-else-if="activeTab === 'Register'" class="mb-6 rounded-2xl bg-white p-4 ring-1 ring-stone-200/80">
          <p class="mb-4 text-sm text-stone-600">
            Fee: <span class="font-semibold text-stone-900">{{ eventItem.fee_display || 'Not specified' }}</span>
          </p>
          <a
            v-if="eventItem.url"
            :href="eventItem.url"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex w-fit items-center gap-2 rounded-full bg-black px-6 py-3 font-bold text-white transition-colors hover:bg-gray-800"
          >
            Register
            <ExternalLink class="h-4 w-4" />
          </a>
          <p v-else class="text-sm text-stone-500">Registration link not available yet.</p>
        </div>
      </div>
    </div>

    <SubscribeDialog
      v-model="showSubscribeDialog"
      subscriptionType="event"
      :allowTypeSelection="true"
      :availableSubscriptionTypes="['news', 'job', 'event', 'stock']"
      :filterOptions="subscribeFilterOptions"
      :selectedFilters="selectedJobAndEventFilters"
    />
  </div>
</template>

<script setup lang="ts">
import { CalendarDays, ChevronLeft, ExternalLink, MapPin, SearchX, Share2, Mail, CircleUserRound } from 'lucide-vue-next'
import SubscribeDialog from '~/components/SubscribeDialog.vue'
import { useAuthStore } from '~/stores/auth'
import { useJobsStore } from '~/stores/jobs'

const route = useRoute()
const router = useRouter()
const requestUrl = useRequestURL()
const authStore = useAuthStore()
const jobsStore = useJobsStore()
const showCopied = ref(false)
const showSubscribeDialog = ref(false)
const eventTypes = ref<string[]>([])
const detailTabs = ['Overview', 'Details', 'Register'] as const
const activeTab = ref<(typeof detailTabs)[number]>('Overview')

const subscribeFilterOptions = computed(() => ({
  categories: ["AI/ML", "IT", "Engineer", "Finance", "Operations", "HR", "Technician", "Sales", "General", "Others"],
  locations: jobsStore.availableLocations,
  employmentTypes: jobsStore.availableEmploymentTypes,
  companies: jobsStore.availableCompanies,
  eventTypes: eventTypes.value
}))

const selectedJobAndEventFilters = computed(() => ({
  categories: jobsStore.selectedCategories,
  locations: jobsStore.selectedLocations,
  employmentTypes: jobsStore.selectedEmploymentTypes,
  companies: jobsStore.selectedCompanies,
  eventTypes: []
}))

type ConferenceDetailRow = {
  id: string
  title: string
  description: string | null
  detailed_description: string | null
  start_date: string
  end_date: string | null
  location: string | null
  venue: string | null
  image_url: string | null
  fee_display: string | null
  url: string | null
  category: string | null
  source_id: string | null
  source?: { name: string | null } | null
  external_id: string | null
  is_active: boolean | null
}
function parseDateOnly(dateString: string): Date {
  const parts = dateString.split('-').map(Number)
  const year = parts[0]
  const month = parts[1]
  const day = parts[2]
  if (year === undefined || month === undefined || day === undefined) {
    return new Date(NaN)
  }
  return new Date(Date.UTC(year, month - 1, day))
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    timeZone: 'UTC'
  })
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    timeZone: 'UTC'
  })
}

function toAbsoluteImageUrl(imageUrl: string | null | undefined): string | undefined {
  if (!imageUrl) return undefined
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl
  return new URL(imageUrl, requestUrl.origin).toString()
}

const eventId = String(route.params.id || '')


onMounted(async () => {
  await jobsStore.fetchFilterOptions()

  try {
    const { eventTypes: fetchedTypes } = await $fetch<{ eventTypes: string[] }>('/api/event-types')
    eventTypes.value = fetchedTypes
  } catch (e) {
    console.error('Failed to load event types for subscription dialog:', e)
  }
})

const { data: eventItem, pending } = await useAsyncData(`conference-${eventId}`, async () => {
  if (!eventId) return null

  const { data } = await $fetch<{ data: any }>(`/api/events?id=${eventId}`)
  if (!data || !data.start_date || !data.is_active) return null


  const startDate = parseDateOnly(data.start_date)
  const endDate = data.end_date ? parseDateOnly(data.end_date) : null

  return {
    id: data.id,
    title: data.title,
    description: data.description || 'No description provided.',
    detailedDescription: data.detailed_description || '',
    startDateText: formatDate(startDate),
    endDateText: endDate ? formatDate(endDate) : formatDate(startDate),
    dateRange: endDate ? `${formatShortDate(startDate)} - ${formatShortDate(endDate)}` : formatShortDate(startDate),
    location: data.location || 'Location not listed',
    venue: data.venue,
    imageUrl: data.image_url || null,
    fee_display: data.fee_display || null,
    url: data.url,
    type: data.category || data.venue || 'Conference',
    sourceId: data.source_id,
    sourceName: data.source_name || null,
    externalId: data.external_id
  }
})

const snapshotLabel = computed(() => {
  const baseType = eventItem.value?.type?.trim() || 'Event'
  return `${baseType} Snapshot`
})

useHead({
  title: () => eventItem.value?.title || 'Conference Event'
})

if (eventItem.value) {
  const socialImage = toAbsoluteImageUrl(eventItem.value.imageUrl)
  useServerSeoMeta({
    title: eventItem.value.title,
    ogTitle: eventItem.value.title,
    description: eventItem.value.description.slice(0, 160),
    ogDescription: eventItem.value.description.slice(0, 160),
    ogType: 'website',
    ogImage: socialImage,
    twitterImage: socialImage,
    twitterCard: socialImage ? 'summary_large_image' : 'summary'
  })
}

function handleBack() {
  const { $navigationTracker } = useNuxtApp() as any
  if ($navigationTracker.hasHistory.value) {
    router.back()
  } else {
    router.push('/events')
  }
}

async function handleShare() {
  if (!eventItem.value) return
  const shareData = {
    title: eventItem.value.title,
    text: `Check out this conference: ${eventItem.value.title}`,
    url: window.location.href
  }

  if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
    try {
      await navigator.share(shareData)
    } catch {
      // User cancelled share dialog.
    }
  } else {
    try {
      await navigator.clipboard.writeText(window.location.href)
      showCopied.value = true
      setTimeout(() => {
        showCopied.value = false
      }, 2000)
    } catch (error) {
      console.error('Clipboard copy failed:', error)
    }
  }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
