<template>
  <div class="flex flex-col relative">
    <!-- Play Today Overlay (Mobile User-Gesture Unlock) -->
    <Transition name="fade">
      <div v-if="isDeepLinkLoading && pendingPlayItem" class="fixed inset-0 z-[60] bg-white flex flex-col items-center justify-center px-6 text-center">
        <div class="max-w-sm flex flex-col items-center">
          <div class="w-20 h-20 bg-[#e2f855] rounded-full flex items-center justify-center mb-8 shadow-lg animate-pulse">
            <Play class="w-10 h-10 fill-current text-black ml-1" />
          </div>
          <h2 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Ready to Play</h2>
          <h1 class="text-xl font-bold mb-8 leading-tight">{{ pendingPlayItem.title }}</h1>
          
          <button 
            @click="handleStartListening"
            class="bg-black text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-gray-800 transition-transform active:scale-95 cursor-pointer shadow-xl"
          >
            Start Listening
          </button>
          
          <button @click="isDeepLinkLoading = false" class="mt-6 text-gray-400 text-sm font-medium hover:text-black cursor-pointer">
            Browse news list instead
          </button>
        </div>
      </div>
    </Transition>

    <!-- Subscription Mini Popup -->
    <Transition name="slide-up">
      <div 
        v-if="showSubscribeMini && !newsStore.isPlaying" 
        class="fixed bottom-20 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm bg-black text-white p-4 rounded-2xl shadow-2xl z-50 flex items-center justify-between"
      >
        <div @click="openSubscribe" class="flex items-center gap-3 cursor-pointer flex-grow">
          <div class="bg-[#e2f855] p-2 rounded-full">
            <Mail class="w-5 h-5 text-black" />
          </div>
          <div class="flex flex-col">
            <span class="text-sm font-bold">Subscribe to Daily News</span>
            <span class="text-[10px] text-gray-400">Get summaries in your inbox</span>
          </div>
        </div>
        <button @click="muteSubscribe" class="p-2 text-gray-500 hover:text-white cursor-pointer">
          <X class="w-5 h-5" />
        </button>
      </div>
    </Transition>

    <SubscribeDialog 
      v-model="showSubscribeDialog" 
      @subscribed="muteSubscribe" 
    />

    <!-- Search -->
    <div class="relative mt-4 mb-2">
      <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        v-model="newsStore.searchQuery"
        type="text"
        placeholder="Search news titles..."
        class="w-full pl-9 pr-4 py-2 rounded-full border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
      />
    </div>

    <!-- Tag Filters -->
    <div class="mb-3 space-y-2.5 py-1">
      <div v-for="group in filterGroups" :key="group.key" class="flex flex-wrap gap-2">
        <button
          v-for="option in group.options"
          :key="option.value"
          @click="toggleFilterValue(group.key, option.value)"
          :class="[
            'px-3 py-1 rounded-full border text-sm font-medium whitespace-nowrap cursor-pointer transition-colors',
            group.selected.includes(option.value)
              ? 'bg-black text-white border-black'
              : filterGroupColor(group.key)
          ]"
        >
          {{ option.label }}
        </button>
      </div>

      <div class="flex justify-end">
        <button
          @click="clearAllFilters"
          :disabled="!hasActiveFilters"
          :class="['w-24 px-3 py-1 text-sm font-medium text-center transition-colors', hasActiveFilters ? 'text-gray-600 hover:text-black cursor-pointer' : 'text-gray-300 cursor-default']"
        >
          Clear all
        </button>
      </div>
    </div>

    <!-- News List -->
    <div class="flex flex-col min-h-[50vh]">
      <NewsCard 
        v-for="item in filteredNews" 
        :key="item.id" 
        :item="item" 
        @click-news="goToDetail"
      />
      
      <!-- Error State -->
      <div v-if="newsStore.error" class="py-12 flex flex-col items-center justify-center text-center">
        <p class="text-red-500 mb-4">{{ newsStore.error }}</p>
        <button 
          @click="newsStore.fetchNews()" 
          class="px-6 py-2 bg-black text-white rounded-full font-medium text-sm hover:bg-gray-800 transition-colors"
        >
          Retry Loading
        </button>
      </div>

      <!-- Empty State -->
      <div v-else-if="!newsStore.isLoading && filteredNews.length === 0" class="py-12 text-center text-gray-500">
        {{ newsStore.searchQuery.trim() ? 'No news found for this search.' : 'No news found for selected categories.' }}
      </div>

      <!-- No More News State -->
      <div v-else-if="!newsStore.isLoading && !newsStore.hasMore && filteredNews.length > 0" class="py-8 text-center text-gray-400 text-sm">
        No more news
      </div>
    </div>

    <!-- Loading Sentinel -->
    <div ref="sentinel" class="h-24 flex items-center justify-center">
      <div v-if="newsStore.isLoading" class="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Play, Mail, X, Search } from 'lucide-vue-next'
import SubscribeDialog from '~/components/SubscribeDialog.vue'
import { useNewsStore } from '~/stores/news'
import { useAuthStore } from '~/stores/auth'
import { getNewsImage } from '~/utils/newsImage'

const newsStore = useNewsStore()
const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()
const config = useRuntimeConfig()

const availableCategories = ['Business', 'Technology', 'Geopolitical']
const availableValueChains = ['upstream', 'midstream', 'downstream']
const availableEnergyTopics = ['oil', 'natural_gas', 'lng', 'renewables', 'hydrogen', 'carbon', 'nuclear']
const sentinel = ref(null)
const isDeepLinkLoading = ref(false)
const pendingPlayItem = ref<any>(null)
const showSubscribeMini = ref(false)
const showSubscribeDialog = ref(false)

// Capture landing state synchronously
const initialSearch = process.client ? window.location.search : ''
const initialHash = process.client ? window.location.hash : ''
const isMagicLandingCaptured = initialSearch.includes('code=') || initialHash.includes('access_token=')
const isErrorLandingCaptured = initialSearch.includes('error=') || initialHash.includes('error=')
const isInviteLandingCaptured = initialSearch.includes('type=invite') || initialHash.includes('type=invite')

const labelize = (value: string) => value === 'lng'
  ? 'LNG'
  : value.replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase())

const filterGroups = computed(() => [
  {
    key: 'value_chain',
    options: availableValueChains.map(value => ({ value, label: labelize(value) })),
    selected: newsStore.selectedValueChains
  },
  {
    key: 'category',
    options: availableCategories.map(value => ({ value, label: value })),
    selected: newsStore.selectedCategories
  },
  {
    key: 'energy_topics',
    options: availableEnergyTopics.map(value => ({ value, label: labelize(value) })),
    selected: newsStore.selectedEnergyTopics
  }
])

const hasActiveFilters = computed(() =>
  newsStore.selectedCategories.length > 0 ||
  newsStore.selectedValueChains.length > 0 ||
  newsStore.selectedEnergyTopics.length > 0
)

function filterGroupColor(groupKey: string) {
  if (groupKey === 'value_chain') {
    return 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100 hover:border-blue-300'
  }
  if (groupKey === 'category') {
    return 'bg-green-50 border-green-200 text-green-800 hover:bg-green-100 hover:border-green-300'
  }
  return 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200 hover:border-gray-300'
}

function toggleFilterValue(groupKey: string, value: string) {
  const selections: Record<string, string[]> = {
    category: newsStore.selectedCategories,
    value_chain: newsStore.selectedValueChains,
    energy_topics: newsStore.selectedEnergyTopics
  }
  const selected = selections[groupKey]
  const index = selected.indexOf(value)
  if (index === -1) selected.push(value)
  else selected.splice(index, 1)
}

function clearAllFilters() {
  newsStore.selectedCategories.splice(0)
  newsStore.selectedValueChains.splice(0)
  newsStore.selectedEnergyTopics.splice(0)
}

function handleClickOutside(event: MouseEvent) {
  const target = event.target as Node
  const insideBar = filterBarRef.value?.contains(target)
  const insidePanel = panelRef.value?.contains(target)

  if (!insideBar && !insidePanel) {
    openDropdown.value = null
  }
}

// 2. SERVER-SIDE DATA FETCHING (Now Deep-Link Aware)
const { data: initialNews } = await useAsyncData('home-news', async () => {
  const playId = route.query.play ? parseInt(route.query.play as string) : null

  let data: any[] = []
  if (playId && !isNaN(playId)) {
    // If deep link, fetch that specific item + 7 others
    const [{ data: deepItem }, { data: others }] = await Promise.all([
      $fetch<{ data: any }>(`/api/news?id=${playId}`),
      $fetch<{ data: any[] }>('/api/news?limit=7&offset=0')
    ])
    const filteredOthers = (others || []).filter((item: any) => item.id !== playId)
    data = deepItem ? [deepItem, ...filteredOthers] : filteredOthers
  } else {
    const { data: normalData } = await $fetch<{ data: any[] }>('/api/news?limit=8&offset=0')
    data = normalData || []
  }

  return data.map((item: any) => ({
    ...item,
    banner: getNewsImage(item, config.public.assetsBaseUrl as string),
    url: item.source_url,
    date: item.published_date,
    category: item.category || 'Unclassified'
  }))
})

// 3. SERVER-SIDE SEO
if (initialNews.value && initialNews.value.length > 0) {
  const latest = initialNews.value[0]
  useServerSeoMeta({
    title: 'Energystacks - Latest Energy News',
    ogTitle: `Energystacks: ${latest.title}`,
    description: `Technical takeaways: ${latest.title} and more petroleum industry insights.`,
    ogDescription: `Daily technical takeaways from the energy industry. Featuring: ${latest.title}`,
    ogImage: latest.banner,
    twitterCard: 'summary_large_image'
  })
}

// Sync initial data to store
if (initialNews.value && newsStore.newsItems.length === 0 && !newsStore.searchQuery.trim()) {
  newsStore.newsItems = [...initialNews.value]
  newsStore.currentOffset = 8
}

let isCheckingVisibleNews = false

function isSentinelNearViewport() {
  if (!sentinel.value) return false
  const el = sentinel.value as HTMLElement
  const rect = el.getBoundingClientRect()
  return rect.top <= window.innerHeight + 200
}

const checkAndFetchMore = async () => {
  if (isCheckingVisibleNews) return
  isCheckingVisibleNews = true

  try {
    await nextTick()
    while (
      (
        filteredNews.value.length < 8 ||
        isSentinelNearViewport()
      ) &&
      !newsStore.isLoading &&
      newsStore.hasMore &&
      !newsStore.error
    ) {
      const previousCount = newsStore.newsItems.length
      await newsStore.fetchNews()
      await nextTick()

      if (newsStore.newsItems.length === previousCount) {
        break
      }
    }
  } finally {
    isCheckingVisibleNews = false
  }
}

let applyTimeout: ReturnType<typeof setTimeout> | null = null
function scheduleApplyFilters() {
  if (applyTimeout) {
    clearTimeout(applyTimeout)
    applyTimeout = null
  }

  applyTimeout = setTimeout(async () => {
    await newsStore.applyFilters()
    await checkAndFetchMore()
  }, 400)
}

onMounted(async () => {
  // 4. Handle "Play Today" Client-Side UI
  const playId = route.query.play ? parseInt(String(route.query.play)) : null
  if (playId && !isMagicLandingCaptured && initialNews.value?.length) {
    // If the play ID matches our first item (which it should due to SSR)
    if (initialNews.value[0].id === playId) {
      pendingPlayItem.value = initialNews.value[0]
      isDeepLinkLoading.value = true
    }
  }

  // 5. BACKGROUND: Auth detection & Toast logic
  setTimeout(() => {
    if (isErrorLandingCaptured) {
      authStore.error = 'This login link has expired or was already used.'
      authStore.successMessage = null
      window.history.replaceState({}, document.title, window.location.pathname)
      setTimeout(() => { authStore.error = null }, 3000)
      return
    } else if (isMagicLandingCaptured) {
      if (isInviteLandingCaptured) {
        router.replace('/confirm-subscription' + initialHash)
      } else {
        authStore.successMessage = 'Welcome back! You have successfully signed in.'
        authStore.error = null
        window.history.replaceState({}, document.title, window.location.pathname)
        setTimeout(() => { authStore.successMessage = null }, 3000)
      }
    }
  }, 500)

  // 6. Setup Infinite Scroll
  if (sentinel.value) {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !newsStore.isLoading && newsStore.hasMore && !newsStore.error) {
        checkAndFetchMore()
      }
    }, { threshold: 0.1, rootMargin: '200px' })
    observer.observe(sentinel.value)
  }

  // 7. Subscription Popup Logic
  if (!authStore.user) {
    const isMuted = sessionStorage.getItem('subscribe_muted') === 'true'
    setTimeout(() => {
      if (!authStore.user && !newsStore.isPlaying && !isMuted) {
        showSubscribeMini.value = true
      }
    }, 3000)
  }

  checkAndFetchMore()
})

onUnmounted(() => {
  if (applyTimeout) clearTimeout(applyTimeout)
})

watch([
  () => newsStore.selectedCategories,
  () => newsStore.selectedValueChains,
  () => newsStore.selectedEnergyTopics
], () => scheduleApplyFilters(), { deep: true })

watch(() => newsStore.searchQuery, () => scheduleApplyFilters())

const filteredNews = computed(() => {
  return newsStore.newsItems.filter(item => {
    const matchesCategory = newsStore.selectedCategories.length === 0 ||
      newsStore.selectedCategories.includes(item.category)
    const matchesValueChain = newsStore.selectedValueChains.length === 0 ||
      newsStore.selectedValueChains.includes(item.value_chain)
    const itemTopics = Array.isArray(item.energy_topics) ? item.energy_topics : []
    const matchesEnergyTopic = newsStore.selectedEnergyTopics.length === 0 ||
      newsStore.selectedEnergyTopics.some(topic => itemTopics.includes(topic))
    return matchesCategory && matchesValueChain && matchesEnergyTopic
  })
})

function goToDetail(item: any) { router.push(`/news/${item.id}`) }
function handleStartListening() {
  if (pendingPlayItem.value) {
    newsStore.playAudio(pendingPlayItem.value)
    pendingPlayItem.value = null
    isDeepLinkLoading.value = false
  }
}
function muteSubscribe() {
  showSubscribeMini.value = false
  sessionStorage.setItem('subscribe_muted', 'true')
}
function openSubscribe() {
  showSubscribeMini.value = false
  showSubscribeDialog.value = true
}
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
