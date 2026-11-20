<template>
  <div class="flex flex-col relative">

    <!-- Search -->
    <div class="relative mt-4 mb-2">
      <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        v-model="jobsStore.searchQuery"
        type="text"
        placeholder="Search job titles..."
        class="w-full pl-9 pr-4 py-2 rounded-full border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
      />
    </div>

    <Transition name="slide-up">
      <div 
        v-if="showSubscribeMini" 
        class="fixed bottom-20 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm bg-black text-white p-4 rounded-2xl shadow-2xl z-50 flex items-center justify-between"
      >
        <div @click="openSubscribe" class="flex items-center gap-3 cursor-pointer flex-grow">
          <div class="bg-[#e2f855] p-2 rounded-full">
            <Mail class="w-5 h-5 text-black" />
          </div>
          <div class="flex flex-col">
            <span class="text-sm font-bold">Subscribe to Job Alerts</span>
            <span class="text-[10px] text-gray-400">Get custom jobs in your inbox</span>
          </div>
        </div>
        <button @click="muteSubscribe" class="p-2 text-gray-500 hover:text-white cursor-pointer">
          <X class="w-5 h-5" />
        </button>
      </div>
    </Transition>

    <!-- Filter Dropdowns -->
    <div ref="filterBarRef" class="flex gap-2 overflow-x-auto no-scrollbar mb-2 flex-nowrap whitespace-nowrap">
      <div v-for="group in filterGroups" :key="group.key" class="flex-shrink-0">
        <button
          :ref="(el: any) => setButtonRef(group.key, el)"
          @click="toggleDropdown(group.key)"
          :class="['px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap cursor-pointer transition-colors flex items-center gap-1 border', group.selected.length > 0 ? 'bg-black text-white border-black' : 'border-gray-200 text-gray-600 hover:bg-gray-50']"
        >
          {{ group.label }}<span v-if="group.selected.length">&nbsp;({{ group.selected.length }})</span>
          <ChevronDown class="w-3.5 h-3.5" />
        </button>
      </div>

      <button
        v-if="hasActiveFilters"
        @click="clearAllFilters"
        class="px-3 py-1.5 rounded-full text-sm font-medium text-gray-500 hover:text-black flex-shrink-0"
      >
        Clear all
      </button>
    </div>

    <!-- Dropdown panel, teleported so the scroll-clipping bar above can't clip it -->
    <Teleport to="body">
      <div
        v-if="activeGroup"
        ref="panelRef"
        class="fixed z-50 w-56 max-h-64 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg p-2"
        :style="{ top: dropdownPos.top + 'px', left: dropdownPos.left + 'px' }"
      >
        <label
          v-for="opt in activeGroup.options"
          :key="opt.value"
          class="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer text-sm"
        >
          <input
            type="checkbox"
            :checked="activeGroup.selected.includes(opt.value)"
            @change="toggleFilterValue(activeGroup.key, opt.value)"
            class="rounded border-gray-300"
          />
          {{ opt.label }}
        </label>
        <p v-if="activeGroup.options.length === 0" class="px-2 py-1.5 text-sm text-gray-400">No options yet</p>
      </div>
    </Teleport>

    <SubscribeDialog
      v-model="showSubscribeDialog"
      subscriptionType="job"
      :filterOptions="subscribeFilterOptions"
      :selectedFilters="selectedJobFilters"
      @subscribed="muteSubscribe"
    />

    <!-- Jobs List -->
    <div class="flex flex-col min-h-[50vh]">
      <JobCard
        v-for="item in jobsStore.jobItems"
        :key="item.id"
        :item="item"
        @click-job="goToDetail"
      />

      <!-- Error State -->
      <div v-if="jobsStore.error" class="py-12 flex flex-col items-center justify-center text-center">
        <p class="text-red-500 mb-4">{{ jobsStore.error }}</p>
        <button
          @click="jobsStore.fetchJobs()"
          class="px-6 py-2 bg-black text-white rounded-full font-medium text-sm hover:bg-gray-800 transition-colors"
        >
          Retry Loading
        </button>
      </div>

      <!-- Empty State -->
      <div v-else-if="hasLoadedInitialJobs && !jobsStore.isLoading && jobsStore.jobItems.length === 0" class="py-12 text-center text-gray-500">
        {{ hasActiveFilters ? 'No jobs found for selected filters.' : 'No jobs available right now.' }}
      </div>

      <!-- No More Jobs State -->
      <div v-else-if="!jobsStore.isLoading && !jobsStore.hasMore && jobsStore.jobItems.length > 0" class="py-8 text-center text-gray-400 text-sm">
        No more jobs
      </div>
    </div>

    <!-- Loading Sentinel -->
    <div ref="sentinel" class="h-24 flex items-center justify-center">
      <div v-if="jobsStore.isLoading" class="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Search, ChevronDown, Mail, X } from 'lucide-vue-next'
import SubscribeDialog from '~/components/SubscribeDialog.vue'
import JobCard from '~/components/JobCard.vue'
import { useJobsStore } from '~/stores/jobs'
import { useAuthStore } from '~/stores/auth'

const jobsStore = useJobsStore()
const authStore = useAuthStore()
const router = useRouter()

const availableCategories = ["AI/ML", "IT", "Engineer", "Finance", "Operations", "HR", "Technician", "Sales", "General", "Others"]
const sentinel = ref(null)
const filterBarRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const openDropdown = ref<string | null>(null)
const buttonRefs = ref<Record<string, HTMLElement | null>>({})
const dropdownPos = ref({ top: 0, left: 0 })
const showSubscribeMini = ref(false)
const showSubscribeDialog = ref(false)
const hasLoadedInitialJobs = ref(jobsStore.jobItems.length > 0)
const INITIAL_JOBS_BATCH = 20

const subscribeFilterOptions = computed(() => ({
  categories: availableCategories,
  locations: jobsStore.availableLocations,
  employmentTypes: jobsStore.availableEmploymentTypes,
  companies: jobsStore.availableCompanies,
  eventTypes: []
}))

const selectedJobFilters = computed(() => ({
  categories: jobsStore.selectedCategories,
  locations: jobsStore.selectedLocations,
  employmentTypes: jobsStore.selectedEmploymentTypes,
  companies: jobsStore.selectedCompanies,
  eventTypes: []
}))

const hasActiveFilters = computed(() =>
  jobsStore.selectedCategories.length > 0 ||
  jobsStore.selectedLocations.length > 0 ||
  jobsStore.selectedEmploymentTypes.length > 0 ||
  jobsStore.selectedCompanies.length > 0 ||
  jobsStore.searchQuery.trim().length > 0
)

const filterGroups = computed(() => [
  {
    key: 'category',
    label: 'Category',
    options: availableCategories.map(c => ({ value: c, label: c })),
    selected: jobsStore.selectedCategories
  },
  {
    key: 'location',
    label: 'Location',
    options: jobsStore.availableLocations.map(l => ({ value: l, label: l })),
    selected: jobsStore.selectedLocations
  },
  {
    key: 'employment_type',
    label: 'Employment Type',
    options: jobsStore.availableEmploymentTypes.map(t => ({ value: t, label: t })),
    selected: jobsStore.selectedEmploymentTypes
  },
  {
    key: 'company',
    label: 'Company',
    options: jobsStore.availableCompanies.map(c => ({ value: c.slug, label: c.name })),
    selected: jobsStore.selectedCompanies
  }
])

const activeGroup = computed(() => filterGroups.value.find(g => g.key === openDropdown.value) || null)

function setButtonRef(key: string, el: any) {
  buttonRefs.value[key] = el
}

function toggleDropdown(key: string) {
  if (openDropdown.value === key) {
    openDropdown.value = null
    return
  }
  const btn = buttonRefs.value[key]
  if (btn) {
    const rect = btn.getBoundingClientRect()
    const panelWidth = 224 // w-56
    dropdownPos.value = {
      top: rect.bottom + 8,
      left: Math.min(rect.left, window.innerWidth - panelWidth - 16)
    }
  }
  openDropdown.value = key
}

function toggleFilterValue(groupKey: string, value: string) {
  const map: Record<string, any> = {
    category: jobsStore.selectedCategories,
    location: jobsStore.selectedLocations,
    employment_type: jobsStore.selectedEmploymentTypes,
    company: jobsStore.selectedCompanies
  }
  const arr = map[groupKey]
  const idx = arr.indexOf(value)
  if (idx === -1) arr.push(value)
  else arr.splice(idx, 1)
}

function clearAllFilters() {
  jobsStore.selectedCategories = []
  jobsStore.selectedLocations = []
  jobsStore.selectedEmploymentTypes = []
  jobsStore.selectedCompanies = []
  jobsStore.searchQuery = ''
}

function handleClickOutside(e: MouseEvent) {
  const target = e.target as Node
  const insideBar = filterBarRef.value?.contains(target)
  const insidePanel = panelRef.value?.contains(target)
  if (!insideBar && !insidePanel) {
    openDropdown.value = null
  }
}

function handleScroll(e: Event) {
  if (!openDropdown.value) return
  const target = e.target as Node
  if (panelRef.value && panelRef.value.contains(target)) {
    return // scrolling inside the dropdown's own list — don't close
  }
  openDropdown.value = null
}

// SERVER-SIDE DATA FETCHING (unfiltered initial page — filters start empty)
const { data: initialJobs } = await useAsyncData('home-jobs', async () => {
  try {
    const { data } = await $fetch<{ data: any[] }>(`/api/jobs?limit=${INITIAL_JOBS_BATCH}&offset=0`)

    return (data || []).map((item: any) => ({
      ...item,
      url: item.source_url,
      date: item.posted_date,
      category: item.department || 'General'
    }))
  } catch (e: any) {
    console.error('Failed to fetch initial jobs:', e.message)
    return []
  }
}, {
  default: () => []
})

useAsyncData('job-filter-options', async () => {
  await jobsStore.fetchFilterOptions()
  return true
})

// SERVER-SIDE SEO
if (initialJobs.value && initialJobs.value.length > 0) {
  const latest = initialJobs.value[0]
  useServerSeoMeta({
    title: 'Energystacks - Job Listings',
    ogTitle: `Energystacks Jobs: ${latest.title}`,
    description: `Latest energy industry job openings, including: ${latest.title} and more.`,
    ogDescription: `Browse the latest job openings in the energy industry. Featuring: ${latest.title}`,
    twitterCard: 'summary'
  })
}

let applyTimeout: ReturnType<typeof setTimeout> | null = null
let isCheckingVisibleJobs = false

function isSentinelNearViewport() {
    if (!sentinel.value) return false
    const el = sentinel.value as HTMLElement
    const rect = el.getBoundingClientRect()
    return rect.top <= window.innerHeight + 200
}

async function loadMoreVisibleJobs() {
    if (isCheckingVisibleJobs) return
    isCheckingVisibleJobs = true

    try {
        await nextTick()
        while (
            isSentinelNearViewport() &&
            !jobsStore.isLoading &&
            jobsStore.hasMore &&
            !jobsStore.error
        ) {
            const previousCount = jobsStore.jobItems.length
            await jobsStore.fetchJobs()
            await nextTick()

            if (jobsStore.jobItems.length === previousCount) {
                break
            }
        }
    } finally {
        isCheckingVisibleJobs = false
    }
}

// Sync initial data to store
if (initialJobs.value && jobsStore.jobItems.length === 0) {
    jobsStore.jobItems = [...initialJobs.value]
    jobsStore.currentOffset = initialJobs.value.length
    jobsStore.hasMore = initialJobs.value.length === INITIAL_JOBS_BATCH
    hasLoadedInitialJobs.value = true
}

watch(initialJobs, (items) => {
    if (!items || jobsStore.jobItems.length > 0) return

    jobsStore.jobItems = [...items]
    jobsStore.currentOffset = items.length
    jobsStore.hasMore = items.length === INITIAL_JOBS_BATCH
    hasLoadedInitialJobs.value = true
    loadMoreVisibleJobs()
}, { immediate: true })

function scheduleApplyFilters(immediate = false) {
  if (applyTimeout) {
    clearTimeout(applyTimeout)
    applyTimeout = null
  }
  if (immediate) {
    hasLoadedInitialJobs.value = false
    jobsStore.applyFilters().then(() => {
      hasLoadedInitialJobs.value = true
      loadMoreVisibleJobs()
    })
  } else {
    applyTimeout = setTimeout(() => {
      hasLoadedInitialJobs.value = false
      jobsStore.applyFilters().then(() => {
        hasLoadedInitialJobs.value = true
        loadMoreVisibleJobs()
      })
    }, 400)
  }
}

watch([
  () => jobsStore.selectedCategories,
  () => jobsStore.selectedLocations,
  () => jobsStore.selectedEmploymentTypes,
  () => jobsStore.selectedCompanies
], () => scheduleApplyFilters(true), { deep: true })

watch(() => jobsStore.searchQuery, () => scheduleApplyFilters(false))

async function ensureJobsLoaded() {
  if (jobsStore.jobItems.length === 0) {
    await jobsStore.applyFilters()
  }

  hasLoadedInitialJobs.value = true
  await loadMoreVisibleJobs()
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('scroll', handleScroll, true)

  if (!authStore.user) {
    const isMuted = sessionStorage.getItem('job_subscribe_muted') === 'true'
    setTimeout(() => {
      if (!authStore.user && !isMuted) {
        showSubscribeMini.value = true
      }
    }, 3000)
  }

  if (sentinel.value) {
  const observer = new IntersectionObserver((entries) => {
    if (entries[0]?.isIntersecting && !jobsStore.isLoading && jobsStore.hasMore && !jobsStore.error) {
      loadMoreVisibleJobs()
    }
  }, {
    root: getScrollParent(sentinel.value),
    threshold: 0.1,
    rootMargin: '200px'
  })
  observer.observe(sentinel.value)
}
  ensureJobsLoaded()
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('scroll', handleScroll, true)
})

function openSubscribe() {
  showSubscribeMini.value = false
  showSubscribeDialog.value = true
}

function muteSubscribe() {
  showSubscribeMini.value = false
  sessionStorage.setItem('job_subscribe_muted', 'true')
}

function getScrollParent(el: HTMLElement | null): HTMLElement | null {
  let parent = el?.parentElement
  while (parent) {
    const style = window.getComputedStyle(parent)
    if (/(auto|scroll)/.test(style.overflowY)) {
      return parent
    }
    parent = parent.parentElement
  }
  return null // no scrollable ancestor found, falls back to viewport
}

function goToDetail(item: any) {
  if (!item?.id) return
  router.push(`/jobs/${encodeURIComponent(String(item.id))}`)
}
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
