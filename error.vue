<script setup lang="ts">
import type { NuxtError } from '#app'

// Branded error page (QA H4). Distinguishes a missing page (404) from a
// server failure so users and crawlers get the right message and status.
const props = defineProps<{ error: NuxtError }>()

const isNotFound = computed(() => props.error?.statusCode === 404)

useHead({
  title: () => (isNotFound.value ? 'Page not found | Energystacks' : 'Something went wrong | Energystacks'),
  meta: [{ name: 'robots', content: 'noindex' }]
})

const goHome = () => clearError({ redirect: '/' })
</script>

<template>
  <div class="min-h-screen bg-white font-sans text-gray-900 flex flex-col items-center justify-center px-6 text-center">
    <div class="max-w-md flex flex-col items-center">
      <div class="w-16 h-16 bg-[#e2f855] rounded-full flex items-center justify-center mb-6 text-2xl font-black">
        {{ isNotFound ? '?' : '!' }}
      </div>
      <p class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
        Error {{ error?.statusCode || 500 }}
      </p>
      <h1 class="text-2xl font-bold mb-3">
        {{ isNotFound ? 'Page not found' : 'Something went wrong' }}
      </h1>
      <p class="text-gray-500 mb-8">
        {{ isNotFound
          ? "The page you're looking for doesn't exist or has moved."
          : 'This page is temporarily unavailable. Please try again in a moment.' }}
      </p>
      <button
        type="button"
        class="bg-black text-white px-8 py-3 rounded-full font-bold hover:bg-gray-800 transition-colors cursor-pointer"
        @click="goHome"
      >
        Back to Energystacks news
      </button>
    </div>
  </div>
</template>
