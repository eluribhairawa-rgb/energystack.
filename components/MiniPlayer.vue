<template>
  <div>
    <Transition name="slide-up">
      <div 
        v-if="newsStore.isPlaying && !hideUi"
        class="fixed bottom-20 sm:bottom-24 md:bottom-6 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 w-[calc(100%-2rem)] md:w-[min(42rem,calc(100%-3rem))] max-w-2xl bg-black text-white rounded-full p-2 flex items-center justify-between z-50 shadow-2xl transition-all duration-300 mobile-landscape-hide"
      >
        <div class="flex items-center gap-3 overflow-hidden">
          <div class="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
            <img :src="newsStore.currentAudio?.banner" class="w-full h-full object-cover" />
          </div>
          <div class="flex flex-col overflow-hidden">
            <p class="text-xs text-gray-400 truncate">Now Playing</p>
            <p class="text-sm font-medium truncate">{{ newsStore.currentAudio?.title }}</p>
          </div>
        </div>

        <div class="flex items-center gap-4 pr-2">
          <button @click="newsStore.togglePlay" class="hover:text-gray-300 cursor-pointer">
            <Pause v-if="newsStore.isPlaying" class="w-6 h-6 fill-current" />
            <Play v-else class="w-6 h-6 fill-current" />
          </button>
          <button @click="newsStore.playNext" class="hover:text-gray-300 cursor-pointer">
            <SkipForward class="w-6 h-6 fill-current" />
          </button>
        </div>
      </div>
    </Transition>

    <!-- Hidden Audio Element -->
    <audio 
      ref="audioRef"
      :src="newsStore.isInterstitiallyPlaying 
        ? config.public.assetsBaseUrl + '/news-assets/audio/next_news.mp3' 
        : newsStore.currentAudio?.audio_url"
      @ended="newsStore.playNext"
      autoplay
    ></audio>
  </div>
</template>

<script setup>
import { Play, Pause, SkipForward } from 'lucide-vue-next'
import { useNewsStore } from '~/stores/news'

const props = defineProps({
  hideUi: {
    type: Boolean,
    default: false
  }
})

const newsStore = useNewsStore()
const config = useRuntimeConfig()
const audioRef = ref(null)

// REACTIVE TITLE: Set "Now Playing" ONLY when actively playing
// When paused, returning null allows the Page title to take over
useHead({
  title: () => (newsStore.isPlaying && newsStore.currentAudio) 
    ? `Now Playing: ${newsStore.currentAudio.title}` 
    : null
})

const updateMediaSession = () => {
  const item = newsStore.currentAudio
  if (!item) return

  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: item.title,
      artist: item.category || 'Energy Stacks News',
      album: 'Energy Stacks',
      artwork: [{ src: item.banner }]
    })

    navigator.mediaSession.setActionHandler('play', () => { newsStore.isPlaying = true })
    navigator.mediaSession.setActionHandler('pause', () => { newsStore.isPlaying = false })
    navigator.mediaSession.setActionHandler('nexttrack', () => { newsStore.playNext() })
  }
}

// Sync metadata whenever track changes
watch(() => newsStore.currentAudio, () => {
  updateMediaSession()
}, { immediate: true })

watch(() => newsStore.isPlaying, (playing) => {
  if (!audioRef.value) return
  if (playing) {
    audioRef.value.play().catch(() => {})
  } else {
    audioRef.value.pause()
  }
})

watch(() => newsStore.currentAudio, (item) => {
  if (audioRef.value && newsStore.isPlaying) {
    nextTick(() => {
      audioRef.value.play().catch(() => {})
    })
  }
})

</script>

<style scoped>
@media (max-width: 768px) and (orientation: landscape) {
  .mobile-landscape-hide {
    display: none !important;
  }
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
