<template>
  <div class="flex flex-col min-h-screen">
    <!-- Top Nav Overlay (Always Visible) -->
    <div class="fixed top-0 left-0 right-0 max-w-6xl mx-auto bg-white flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16 md:h-20 z-50">
      <button @click="handleBack" class="p-2 -ml-2 cursor-pointer">
        <ChevronLeft class="w-6 h-6" />
      </button>

      <div v-if="item" class="flex items-center gap-2">
        <button
          @click="showSubscribeDialog = true"
          class="flex items-center gap-2 bg-black hover:bg-gray-800 text-[#e2f855] px-3 py-1.5 rounded-full transition-colors cursor-pointer"
        >
          <Mail class="w-5 h-5" />
          <span class="text-xs font-semibold">Subscribe</span>
        </button>

        <button
            v-if="newsStore.currentAudio || item.audio_url"
            @click="handleTopPlayClick"
            class="flex items-center justify-center w-8 h-8 rounded-full bg-[#e2f855] cursor-pointer"
        >
          <Pause v-if="newsStore.isPlaying" class="w-4 h-4 fill-current" />
          <Play v-else class="w-4 h-4 fill-current ml-0.5" />
        </button>
        
        <!-- Share Button -->
        <button @click="handleShare" class="p-1 hover:bg-gray-100 rounded-full transition-colors cursor-pointer relative">
          <Share2 class="w-5 h-5 text-gray-600" />
          <Transition name="fade">
            <span v-if="showCopied" class="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-50">
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

    <!-- Main Content Area -->
    <div class="flex-grow pt-16 md:pt-20">
      <!-- Loading State -->
      <div v-if="pending && !item" class="flex items-center justify-center h-[70vh]">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>

      <!-- Not Found State -->
      <div v-else-if="!item && !pending" class="flex flex-col items-center justify-center h-[70vh] px-4 text-center">
        <div class="bg-gray-100 p-4 rounded-full mb-4">
          <SearchX class="w-12 h-12 text-gray-400" />
        </div>
        <h1 class="text-2xl font-bold mb-2">Article Not Found</h1>
        <p class="text-gray-500 mb-8">The news article you are looking for doesn't exist or has been removed.</p>
        <button @click="$router.push('/')" class="bg-black text-white px-6 py-2.5 rounded-full font-bold">
          Back to Home
        </button>
      </div>

      <!-- Content State -->
      <div v-else-if="item" class="flex flex-col animate-in fade-in duration-500 px-4 sm:px-6 lg:px-8">
        <h1 class="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight mb-2">
          {{ item.title }}
        </h1>
        <div class="flex items-center gap-3 mb-4 text-sm text-gray-500">
          <span>Published {{ item.date }}</span>
          <div v-if="item.audio_length" class="flex items-center gap-1">
            <Clock class="w-4 h-4" />
            <span>{{ item.audio_length }}</span>
          </div>
        </div>

        <div class="flex flex-wrap gap-2 mb-6">
          <span
            v-for="tag in articleClassificationTags(item)"
            :key="tag"
            class="px-3 py-1 bg-[#e2f855] text-sm font-bold rounded-full"
          >
            {{ tag }}
          </span>
        </div>

        <!-- Media Section -->
        <div class="mb-6">
          <div class="flex items-center justify-between mb-3">
            <span class="font-bold">Media</span>
          </div>
          <div class="flex gap-4 overflow-x-auto no-scrollbar">
            <div class="w-72 aspect-video flex-shrink-0 rounded-xl overflow-hidden relative bg-gray-200">
              <img
                :src="item.banner"
                class="w-full h-full object-cover"
                :alt="item.title"
                @error="handleNewsImageError($event, item.source_url || item.url, config.public.assetsBaseUrl)"
              />
              <div class="absolute inset-0 flex items-center justify-center">
                <button
                    @click="newsStore.playAudio(item)"
                    class="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                >
                  <Pause v-if="newsStore.isPlaying && newsStore.currentAudio?.id === item.id" class="w-5 h-5 fill-current" />
                  <Play v-else class="w-4 h-4 fill-current ml-0.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="flex gap-6 border-b border-gray-100 mb-6 overflow-x-auto no-scrollbar">
          <button
              @click="activeDetailTab = 'Overview'"
              :class="['pb-2 text-sm font-semibold transition-colors relative whitespace-nowrap cursor-pointer', activeDetailTab === 'Overview' ? 'text-black' : 'text-gray-400']"
          >
            Overview
            <div v-if="activeDetailTab === 'Overview'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-black"></div>
          </button>
          <button
              @click="activeDetailTab = 'KeyPoints'"
              :class="['pb-2 text-sm font-semibold transition-colors relative whitespace-nowrap cursor-pointer', activeDetailTab === 'KeyPoints' ? 'text-black' : 'text-gray-400']"
          >
            Key Points
            <div v-if="activeDetailTab === 'KeyPoints'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-black"></div>
          </button>
          <button
              @click="activeDetailTab = 'Source'"
              :class="['pb-2 text-sm font-semibold transition-colors relative whitespace-nowrap cursor-pointer', activeDetailTab === 'Source' ? 'text-black' : 'text-gray-400']"
          >
            Article Source
            <div v-if="activeDetailTab === 'Source'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-black"></div>
          </button>
        </div>

        <!-- Tab Content -->
        <div class="min-h-[300px]">
          <!-- Overview Content -->
          <div v-if="activeDetailTab === 'Overview'" class="prose prose-base max-w-none text-gray-800 leading-relaxed pb-8 animate-in fade-in duration-300" v-html="item.description">
          </div>

          <!-- KeyPoints Content -->
          <div v-if="activeDetailTab === 'KeyPoints'" class="pb-8 animate-in fade-in duration-300">
            <div v-if="item.key_points && Array.isArray(item.key_points) && item.key_points.length > 0">
              <ul class="space-y-4">
                <li v-for="(point, index) in item.key_points" :key="index" class="flex items-start gap-3 text-base text-gray-800 leading-relaxed">
                  <span class="text-black font-bold flex-shrink-0 select-none" style="margin-top: 0.1em">•</span>
                  <span>{{ point }}</span>
                </li>
              </ul>
            </div>
            
            <div v-else class="py-12 text-center text-gray-400 italic text-sm">
              Detailed takeaways are not available for this article.
            </div>
          </div>

          <!-- Article Source Content -->
          <div v-if="activeDetailTab === 'Source'" class="pb-8 animate-in fade-in duration-300">
            <p class="text-sm text-gray-500 mb-6">Read the full story from the original source:</p>

            <a v-if="item.url" :href="item.url" target="_blank" class="inline-block max-w-[288px] w-full cursor-pointer relative z-10">
              <!-- World Oil -->
              <div v-if="isSource(item.url, 'worldoil.com')" class="bg-[#003366] px-8 py-4 rounded-2xl flex items-center justify-center">
                <img :src="config.public.assetsBaseUrl + '/news-assets/media_logos/worldoil.png'" alt="World Oil" class="h-14 object-contain" />
              </div>

              <!-- OilPrice -->
              <div v-else-if="isSource(item.url, 'oilprice.com')" class="bg-white border border-gray-200 px-8 py-4 rounded-2xl flex items-center justify-center shadow-sm">
                <img :src="config.public.assetsBaseUrl + '/news-assets/media_logos/oilprice.png'" alt="OilPrice" class="h-14 object-contain" />
              </div>

              <!-- JPT -->
              <div v-else-if="isSource(item.url, 'jpt.spe.org')" class="bg-white border border-gray-200 px-8 py-4 rounded-2xl flex items-center justify-center shadow-sm">
                <img :src="config.public.assetsBaseUrl + '/news-assets/media_logos/jpt.svg'" alt="JPT" class="h-14 object-contain" />
              </div>

              <div v-else class="bg-white border border-gray-200 px-8 py-6 rounded-2xl text-center font-semibold shadow-sm">
                View original article
              </div>
            </a>
          </div>

          <!-- QA M5: related articles so the article page isn't a dead end -->
          <section v-if="relatedArticles && relatedArticles.length" class="pb-32 pt-6 border-t border-gray-100">
            <h2 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">More {{ item.category !== 'Unclassified' ? item.category : '' }} news</h2>
            <NewsCard
              v-for="related in relatedArticles"
              :key="related.id"
              :item="related"
              @click-news="(r: any) => router.push(`/news/${r.id}`)"
            />
          </section>
          <div v-else class="pb-32"></div>
        </div>
      </div>
    </div>

    <SubscribeDialog
      v-model="showSubscribeDialog"
      subscriptionType="news"
      :allowTypeSelection="true"
      :availableSubscriptionTypes="['news', 'job', 'event', 'stock']"
      :filterOptions="subscribeFilterOptions"
      :selectedFilters="selectedJobAndEventFilters"
    />
  </div>
</template>

<script setup lang="ts">
import { ChevronLeft, Share2, Play, Pause, SearchX, Clock, Mail, CircleUserRound } from 'lucide-vue-next';
import SubscribeDialog from '~/components/SubscribeDialog.vue'
import { useAuthStore } from '~/stores/auth'
import { useJobsStore } from '~/stores/jobs'
import { useNewsStore } from '~/stores/news';
import { getNewsImage, handleNewsImageError } from '~/utils/newsImage';

const route = useRoute();
const router = useRouter();
const newsStore = useNewsStore();
const authStore = useAuthStore()
const jobsStore = useJobsStore()
const config = useRuntimeConfig();

function isSource(url: string | null | undefined, domain: string) {
  if (!url) return false
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '')
    return hostname === domain || hostname.endsWith(`.${domain}`)
  } catch {
    return false
  }
}

function labelizeTag(value: string) {
  if (value.toLowerCase() === 'lng') return 'LNG'
  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase())
}

function articleClassificationTags(article: any) {
  const tags = [
    article?.category,
    article?.value_chain,
    ...(Array.isArray(article?.energy_topics) ? article.energy_topics : [])
  ].filter((value): value is string => typeof value === 'string' && value.length > 0)

  return [...new Set(tags.map(labelizeTag))]
}

const activeDetailTab = ref('Overview');
const showCopied = ref(false);
const showSubscribeDialog = ref(false)
const eventTypes = ref<string[]>([])

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
  await jobsStore.fetchFilterOptions()

  try {
    const { eventTypes: fetchedTypes } = await $fetch<{ eventTypes: string[] }>('/api/event-types')
    eventTypes.value = fetchedTypes
  } catch (e) {
    console.error('Failed to load event types for subscription dialog:', e)
  }
})

// SERVER-SIDE DATA FETCHING
const articleId = parseInt(route.params.id as string);
const { data: item, pending } = await useAsyncData(`article-${articleId}`, async () => {
  const { data } = await $fetch<{ data: any }>(`/api/news?id=${articleId}`);

  if (!data) return null;

  return {
    ...data,
    banner: getNewsImage(data, config.public.assetsBaseUrl as string),
    url: data.source_url,
    date: data.published_date,
    category: data.category || 'Unclassified'
  };
});

// QA M5: related articles (same category, newest first, excluding this one)
const { data: relatedArticles } = await useAsyncData(`article-${articleId}-related`, async () => {
  if (!item.value) return []
  const params = new URLSearchParams({ limit: '5', offset: '0' })
  if (item.value.category && item.value.category !== 'Unclassified') params.set('categories', item.value.category)
  try {
    const { data } = await $fetch<{ data: any[] }>(`/api/news?${params}`)
    return (data || [])
      .filter((r: any) => r.id !== articleId)
      .slice(0, 4)
      .map((r: any) => ({
        ...r,
        banner: getNewsImage(r, config.public.assetsBaseUrl as string),
        url: r.source_url,
        date: r.published_date,
        category: r.category || 'Unclassified'
      }))
  } catch (e) {
    console.error('Failed to load related articles:', e)
    return []
  }
}, { lazy: true, default: () => [] })

// Sync server-fetched data to Pinia store for player/caching
watch(item, (newItem) => {
  if (newItem && !newsStore.newsItems.find(i => i.id === newItem.id)) {
    newsStore.newsItems.push(newItem);
  }
}, { immediate: true });

// Set browser tab title to the article headline
useHead({
  title: () => item.value?.title
})

// SERVER-SIDE SEO TAGS (Baked into initial HTML)
if (item.value) {
  const cleanDescription = item.value.description?.replace(/<[^>]*>/g, '').slice(0, 160) + '...';
  
  useServerSeoMeta({
    title: item.value.title,
    ogTitle: item.value.title,
    description: cleanDescription,
    ogDescription: cleanDescription,
    ogImage: item.value.banner,
    ogType: 'article',
    twitterCard: 'summary_large_image',
    author: 'Energystacks',
    articlePublishedTime: item.value.published_date
  });
}

const handleBack = () => {
  const { $navigationTracker } = useNuxtApp() as any;
  if ($navigationTracker.hasHistory.value) {
    router.back();
  } else {
    router.push('/');
  }
};

const handleShare = async () => {
  if (!item.value) return;
  const shareData = {
    title: item.value.title,
    text: `Check out this energy news: ${item.value.title}`,
    url: window.location.href,
  };
  if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
    try { await navigator.share(shareData); } catch (err) {}
  } else {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showCopied.value = true;
      setTimeout(() => { showCopied.value = false; }, 2000);
    } catch (err) { console.error('Clipboard copy failed:', err); }
  }
};

const handleTopPlayClick = () => {
  if (newsStore.isPlaying) {
    newsStore.togglePlay();
  } else {
    if (newsStore.currentAudio) {
      newsStore.togglePlay();
    } else if (item.value?.audio_url) {
      newsStore.playAudio(item.value);
    }
  }
};
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
