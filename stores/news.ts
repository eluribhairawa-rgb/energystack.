import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getNewsImage } from '~/utils/newsImage'

export const useNewsStore = defineStore('news', () => {
  const config = useRuntimeConfig()
  const newsItems = ref<any[]>([])
  const currentOffset = ref(0)
  const hasMore = ref(true)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const currentAudio = ref<any>(null)
  const isPlaying = ref(false)
  const isInterstitiallyPlaying = ref(false)
  const audioList = computed(() => newsItems.value.filter(item => item.audio_url))

  const selectedCategories = ref<string[]>([])
  const selectedValueChains = ref<string[]>([])
  const selectedEnergyTopics = ref<string[]>([])
  const activeTab = ref('For You')
  const searchQuery = ref('')

  function buildQueryParams(limit: number, offset: number, extra: Record<string, string> = {}) {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
      ...extra
    })

    if (searchQuery.value.trim()) params.set('search', searchQuery.value.trim())
    if (selectedCategories.value.length > 0) params.set('categories', selectedCategories.value.join(','))
    if (selectedValueChains.value.length > 0) params.set('valueChains', selectedValueChains.value.join(','))
    if (selectedEnergyTopics.value.length > 0) params.set('energyTopics', selectedEnergyTopics.value.join(','))

    return params
  }

  function mapItem(item: any) {
    return {
      ...item,
      banner: getNewsImage(item, config.public.assetsBaseUrl as string),
      url: item.source_url,
      date: item.published_date,
      category: item.category || 'Unclassified'
    }
  }

  async function fetchNewsFromId(id: number, limit = 8) {
    isLoading.value = true
    error.value = null

    try {
      const params = buildQueryParams(limit, 0, { fromId: String(id) })
      const { data } = await $fetch<{ data: any[] }>(`/api/news?${params}`)

      if (!data || data.length === 0) {
        await fetchNews(limit)
        return false
      }

      newsItems.value = data.map(mapItem)
      currentOffset.value = limit
      hasMore.value = data.length === limit
      return true
    } catch (e: any) {
      console.error('Failed to fetch news from ID:', e)
      await fetchNews(limit)
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function fetchNews(limit = 8) {
    if (isLoading.value || !hasMore.value) return

    isLoading.value = true
    error.value = null

    try {
      const params = buildQueryParams(limit, currentOffset.value)
      const { data } = await $fetch<{ data: any[] }>(`/api/news?${params}`)

      if (data && data.length > 0) {
        const newItems = data.map(mapItem)
        const uniqueItems = newItems.filter((item: any) =>
          !newsItems.value.some(existing => existing.id === item.id)
        )

        newsItems.value.push(...uniqueItems)
        currentOffset.value += limit

        if (data.length < limit) hasMore.value = false
      } else {
        hasMore.value = false
      }
    } catch (e: any) {
      console.error('Failed to fetch news:', e)
      error.value = e.message || 'Failed to load news'
    } finally {
      isLoading.value = false
    }
  }

  async function applyFilters() {
    newsItems.value = []
    currentOffset.value = 0
    hasMore.value = true
    error.value = null
    await fetchNews()
  }

  function playAudio(item: any) {
    isInterstitiallyPlaying.value = false

    if (currentAudio.value?.id === item.id) {
      isPlaying.value = !isPlaying.value
    } else {
      currentAudio.value = item
      isPlaying.value = true
    }
  }

  function togglePlay() {
    isPlaying.value = !isPlaying.value
  }

  function playNext() {
    if (!currentAudio.value) return

    isInterstitiallyPlaying.value = false

    const currentIndex = audioList.value.findIndex(a => a.id === currentAudio.value.id)
    if (currentIndex < audioList.value.length - 1) {
      currentAudio.value = audioList.value[currentIndex + 1]
    } else {
      isPlaying.value = false
    }
  }

  return {
    newsItems,
    currentOffset,
    hasMore,
    isLoading,
    error,
    currentAudio,
    isPlaying,
    isInterstitiallyPlaying,
    audioList,
    selectedCategories,
    selectedValueChains,
    selectedEnergyTopics,
    activeTab,
    searchQuery,
    fetchNews,
    fetchNewsFromId,
    applyFilters,
    playAudio,
    togglePlay,
    playNext
  }
})
