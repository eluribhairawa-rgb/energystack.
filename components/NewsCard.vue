<template>
  <div 
    @click="$emit('click-news', item)"
    class="NewsCard flex gap-4 py-4 border-b border-gray-100 last:border-0 items-center cursor-pointer hover:bg-gray-50/50 transition-colors px-2 -mx-2 rounded-xl"
  >
    <!-- Image -->
    <div class="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
      <img
        :src="item.banner"
        class="w-full h-full object-cover"
        :alt="item.title"
        @error="handleNewsImageError($event, item.source_url || item.url, config.public.assetsBaseUrl)"
      />
    </div>

    <!-- Content -->
    <div class="flex-grow flex flex-col justify-center min-w-0">
      <div class="flex flex-wrap items-center gap-2 mb-1">
        <span
          v-if="item.value_chain"
          class="text-[11px] font-bold text-gray-600 bg-gray-50 px-2 py-0.5 rounded uppercase"
        >
          {{ labelize(item.value_chain) }}
        </span>
        <span
          v-if="item.category"
          class="text-[11px] font-bold text-gray-600 bg-gray-50 px-2 py-0.5 rounded uppercase"
        >
          {{ item.category }}
        </span>
      </div>
      <h3 class="text-lg font-bold text-gray-900 leading-snug line-clamp-2">
        {{ item.title }}
      </h3>
      <div class="flex items-center gap-3 mt-2 text-sm text-gray-500">
        <span>{{ item.date }}</span>
        <div v-if="item.audio_length" class="flex items-center gap-1">
          <Clock class="w-3.5 h-3.5" />
          <span>{{ item.audio_length }}</span>
        </div>
      </div>
    </div>

    <!-- Play Button -->
    <div v-if="item.audio_url" class="flex-shrink-0">
      <button 
        @click.stop="newsStore.playAudio(item)"
        :class="[
          'w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer',
          newsStore.isPlaying && newsStore.currentAudio?.id === item.id 
            ? 'bg-[#e2f855] text-black' 
            : 'bg-black text-white hover:bg-gray-800'
        ]"
      >
        <Pause v-if="newsStore.isPlaying && newsStore.currentAudio?.id === item.id" class="w-5 h-5 fill-current" />
        <Play v-else class="w-4 h-4 fill-current ml-0.5" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { Play, Pause, Clock } from 'lucide-vue-next'
import { useNewsStore } from '~/stores/news'
import { handleNewsImageError } from '~/utils/newsImage'

const props = defineProps({
  item: {
    type: Object,
    required: true
  }
})

defineEmits(['click-news'])

const newsStore = useNewsStore()
const config = useRuntimeConfig()

const labelize = (value) => value
  .replaceAll('_', ' ')
  .replace(/\b\w/g, letter => letter.toUpperCase())
</script>
