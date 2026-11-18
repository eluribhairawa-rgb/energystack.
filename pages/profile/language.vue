<template>
  <div class="flex flex-col px-4 pt-6 max-w-md mx-auto">
    <div class="flex items-center mb-6">
      <NuxtLink to="/profile" class="p-2 -ml-2 hover:bg-gray-100 rounded-full">
        <ChevronLeft class="w-6 h-6" />
      </NuxtLink>
      <h1 class="text-xl font-bold ml-2">Language</h1>
    </div>

    <div class="flex flex-col gap-2">
      <button 
        v-for="lang in languages" 
        :key="lang"
        @click="handleSelect(lang)"
        class="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl shadow-sm cursor-pointer hover:border-gray-300 transition-colors"
      >
        <span class="font-medium">{{ lang }}</span>
        <div v-if="currentLang === lang" class="bg-black text-white rounded-full p-1">
          <Check class="w-4 h-4" />
        </div>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ChevronLeft, Check } from 'lucide-vue-next'
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  middleware: ['auth']
})

const authStore = useAuthStore()
const languages = ['English'] // Only English supported for now
const currentLang = ref(authStore.profile.language || 'English')

const handleSelect = async (lang) => {
  currentLang.value = lang
  await authStore.updateProfile({ language: lang })
  navigateTo('/profile')
}
</script>
