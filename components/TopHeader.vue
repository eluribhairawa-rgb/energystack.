<template>
  <header class="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16 sm:h-20 bg-white sticky top-0 z-40">
    <div class="flex flex-col">
      <h1 class="GreetingText text-2xl sm:text-3xl font-bold leading-tight">
        <ClientOnly>
          {{ greeting }}
        </ClientOnly>
      </h1>
    </div>
    
    <div v-if="!authStore.loading" class="flex items-center gap-2 sm:gap-3 animate-in fade-in">
      <div ref="textSizeMenuRef" class="relative">
        <button
          type="button"
          aria-label="Adjust text size"
          :aria-expanded="showTextSizeMenu"
          @click="showTextSizeMenu = !showTextSizeMenu"
          class="flex h-9 min-w-9 items-center justify-center rounded-full border border-gray-200 bg-white px-2 text-sm font-bold text-gray-700 transition-colors hover:border-gray-400 hover:text-black cursor-pointer"
        >
          Aa
        </button>

        <Transition name="text-size-menu">
          <div
            v-if="showTextSizeMenu"
            class="absolute right-0 top-full z-50 mt-2 w-44 rounded-2xl border border-gray-100 bg-white p-2 shadow-xl"
          >
            <p class="px-2 pb-2 pt-1 text-xs font-semibold text-gray-500">Text size</p>
            <button
              v-for="option in textSizeOptions"
              :key="option.value"
              type="button"
              @click="selectTextSize(option.value)"
              :class="[
                'flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors cursor-pointer',
                textSize === option.value
                  ? 'bg-black text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              ]"
            >
              <span>{{ option.label }}</span>
              <span :class="option.previewClass">A</span>
            </button>
          </div>
        </Transition>
      </div>

      <button
        @click="showSubscribeDialog = true"
        class="flex items-center gap-2 bg-black hover:bg-gray-800 text-[#e2f855] px-2.5 sm:px-3 py-1.5 rounded-full transition-colors cursor-pointer"
      >
        <Mail class="w-5 h-5" />
        <span class="hidden sm:inline text-xs font-semibold">Subscribe</span>
      </button>

      <button 
        v-if="newsStore.audioList.length > 0"
        @click="handleTopPlay"
        class="flex items-center gap-2 bg-[#e2f855] hover:bg-[#d4ed42] px-3 py-1.5 rounded-full transition-colors cursor-pointer"
      >
        <div class="flex gap-0.5 items-center">
          <div class="w-0.5 h-3 bg-black"></div>
          <div class="w-0.5 h-4 bg-black"></div>
          <div class="w-0.5 h-2 bg-black"></div>
        </div>
        <Play v-if="!newsStore.isPlaying" class="w-5 h-5 fill-current" />
        <Pause v-else class="w-5 h-5 fill-current" />
      </button>

      <NuxtLink 
        v-if="!$route.path.startsWith('/profile')"
        to="/profile" 
        class="w-12 h-12 rounded-full border border-gray-200 cursor-pointer block relative"
      >
        <div class="w-full h-full rounded-full overflow-hidden">
          <img 
            v-if="authStore.user && authStore.profile.avatar_url"
            :src="authStore.profile.avatar_url" 
            alt="User Avatar" 
            class="w-full h-full object-cover" 
          />
          <div v-else class="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
            <CircleUserRound class="w-8 h-8" />
          </div>
        </div>
        <!-- Status Dot (Only for default icon users) -->
        <div v-if="authStore.user && !authStore.profile.avatar_url" class="absolute top-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
      </NuxtLink>
    </div>
    <div v-else class="flex items-center gap-3">
      <!-- Placeholder for width calculation -->
      <div class="w-12 h-12"></div>
    </div>
  </header>

  <SubscribeDialog
    v-model="showSubscribeDialog"
    :subscriptionType="defaultSubscriptionType"
    :allowTypeSelection="true"
    :availableSubscriptionTypes="['news', 'job', 'event', 'stock']"
    :filterOptions="subscribeFilterOptions"
    :selectedFilters="selectedJobAndEventFilters"
  />
</template>

<script setup>
import { Play, Pause, CircleUserRound, Mail } from 'lucide-vue-next'
import SubscribeDialog from '~/components/SubscribeDialog.vue'
import { useNewsStore } from '~/stores/news'
import { useAuthStore } from '~/stores/auth'
import { useJobsStore } from '~/stores/jobs'

const newsStore = useNewsStore()
const authStore = useAuthStore()
const jobsStore = useJobsStore()
const route = useRoute()
const { textSize, applyTextSize } = useTextSize()

const showSubscribeDialog = ref(false)
const showTextSizeMenu = ref(false)
const textSizeMenuRef = ref(null)
const eventTypes = ref([])

const textSizeOptions = [
  { value: 'small', label: 'Small', previewClass: 'text-xs' },
  { value: 'default', label: 'Default', previewClass: 'text-base' },
  { value: 'large', label: 'Large', previewClass: 'text-xl' }
]

function selectTextSize(size) {
  applyTextSize(size)
  showTextSizeMenu.value = false
}

function closeTextSizeMenu(event) {
  if (!textSizeMenuRef.value?.contains(event.target)) {
    showTextSizeMenu.value = false
  }
}

const defaultSubscriptionType = computed(() => {
  if (route.path.startsWith('/jobs')) return 'job'
  if (route.path.startsWith('/events')) return 'event'
  return 'news'
})

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

onMounted(async () => {
  document.addEventListener('click', closeTextSizeMenu)
  await jobsStore.fetchFilterOptions()

  try {
    const { eventTypes: fetchedTypes } = await $fetch('/api/event-types')
    eventTypes.value = fetchedTypes
  } catch (e) {
    console.error('Failed to load event types for subscription dialog:', e)
  }
})

onUnmounted(() => document.removeEventListener('click', closeTextSizeMenu))

const handleTopPlay = async () => {
  if (newsStore.currentAudio) {
    newsStore.togglePlay()
  } else if (newsStore.audioList.length > 0) {
    newsStore.playAudio(newsStore.audioList[0])
  } else if (!newsStore.isLoading && newsStore.newsItems.length === 0) {
    await newsStore.fetchNews()
    if (newsStore.audioList.length > 0) {
      newsStore.playAudio(newsStore.audioList[0])
    }
  }
}

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good Morning'
  if (hour < 18) return 'Good Afternoon'
  return 'Good Evening'
})
</script>

<style scoped>
.text-size-menu-enter-active,
.text-size-menu-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.text-size-menu-enter-from,
.text-size-menu-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
}
</style>
