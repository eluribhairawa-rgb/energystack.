<script setup lang="ts">
import { Check, X } from 'lucide-vue-next'
import { useAuthStore } from '~/stores/auth'
import { useNewsStore } from '~/stores/news'
import { useJobsStore } from '~/stores/jobs'

const authStore = useAuthStore()
const newsStore = useNewsStore()
const jobsStore = useJobsStore()
const route = useRoute()
const { initializeTextSize } = useTextSize()

onMounted(initializeTextSize)

const isDetailPage = computed(() =>
  route.path.startsWith('/news/') ||
  route.path.startsWith('/jobs/') ||
  route.path.startsWith('/events/')
)

const clearToasts = () => {
  authStore.error = null
  authStore.successMessage = null
}
</script>

<template>
  <div class="min-h-screen bg-white font-sans text-gray-900 flex flex-col relative">
    <NuxtLoadingIndicator color="#e2f855" :height="3" />

    <!-- Centered Content Wrapper (Yesterday's Style) -->
    <div class="mx-auto w-full max-w-6xl flex flex-col flex-grow relative px-0 sm:px-4 lg:px-6">
      <TopHeader v-if="!isDetailPage" />

      <main class="flex-grow px-4 sm:px-6 lg:px-8 pb-32 md:pb-10 relative">
        <!-- Global Auth Inserting Toasts -->
        <div class="overflow-hidden">
          <!-- Success Toast -->
          <Transition name="toast-slide">
            <div v-if="authStore.successMessage" class="mb-6 w-full max-w-sm mx-auto">
              <div class="p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-3 text-green-700 shadow-sm">
                <div class="bg-green-100 p-2 rounded-full flex-shrink-0">
                  <Check class="w-4 h-4 text-green-600" />
                </div>
                <div class="flex flex-col flex-grow text-left">
                  <span class="text-sm font-bold leading-tight">Success</span>
                  <span class="text-[10px] text-green-600/80 leading-tight">{{ authStore.successMessage }}</span>
                </div>
                <button @click="authStore.successMessage = null" class="p-1 hover:bg-green-100 rounded-full cursor-pointer">
                  <X class="w-4 h-4" text-green-600 />
                </button>
              </div>
            </div>
          </Transition>

          <!-- Error Toast -->
          <Transition name="toast-slide">
            <div v-if="authStore.error" class="mb-6 w-full max-w-sm mx-auto">
              <div class="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-700 shadow-sm">
                <div class="bg-red-100 p-2 rounded-full flex-shrink-0">
                  <X class="w-4 h-4 text-red-600" />
                </div>
                <div class="flex flex-col flex-grow text-left">
                  <span class="text-sm font-bold leading-tight">Link Problem</span>
                  <span class="text-[10px] text-red-600/80 leading-tight">{{ authStore.error }}</span>
                </div>
                <button @click="authStore.error = null" class="p-1 hover:bg-red-100 rounded-full cursor-pointer">
                  <X class="w-4 h-4" />
                </button>
              </div>
            </div>
          </Transition>
        </div>

        <slot />
      </main>

      <AppFooter />
    </div>

    <BottomNav />
    <MiniPlayer :hide-ui="$route.path !== '/'" />

    <!-- Global Loading Overlay -->
    <Transition name="fade">
      <div v-if="authStore.loading" class="fixed inset-0 bg-white/80 backdrop-blur-sm z-[110] flex items-center justify-center">
        <div class="flex flex-col items-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-black mb-4"></div>
          <p class="text-sm font-bold animate-pulse uppercase tracking-widest">Processing...</p>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style>
/* Global Transitions */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-up-enter-active, .slide-up-leave-active { transition: transform 0.3s ease, opacity 0.3s ease; }
.slide-up-enter-from, .slide-up-leave-to { transform: translateY(100%); opacity: 0; }

/* Toast Inserting Animation */
.toast-slide-enter-active, .toast-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  max-height: 200px;
}
.toast-slide-enter-from, .toast-slide-leave-to {
  opacity: 0;
  max-height: 0;
  margin-bottom: 0;
  transform: translateY(-20px);
}
</style>
