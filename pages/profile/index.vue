<template>
  <div v-if="authStore.loading || !authStore.isProfileLoaded" class="flex items-center justify-center min-h-[70vh]">
    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
  </div>
  <div v-else class="flex flex-col items-center pt-8 px-4 pb-24 animate-in fade-in">
    <!-- Avatar Section -->
    <NuxtLink to="/profile/edit" class="relative mb-4 cursor-pointer hover:opacity-90 transition-opacity block">
      <div class="w-24 h-24 rounded-full border-2 border-gray-100 shadow-sm relative">
        <div class="w-full h-full rounded-full overflow-hidden">
          <img 
            v-if="authStore.profile.avatar_url"
            :src="authStore.profile.avatar_url" 
            alt="Profile" 
            class="w-full h-full object-cover"
          />
          <div v-else class="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
            <CircleUserRound class="w-16 h-16" />
          </div>
        </div>
        <!-- Status Dot (Only for default icon users) -->
        <div v-if="!authStore.profile.avatar_url" class="absolute top-1 right-1 w-6 h-6 bg-green-500 border-4 border-white rounded-full shadow-sm"></div>
      </div>
    </NuxtLink>

    <!-- Name & Plan -->
    <h1 class="text-2xl font-bold flex items-center gap-2 mb-1">
      {{ authStore.profile.full_name}}
      <span class="bg-[#e2f855] text-xs font-bold px-2 py-0.5 rounded text-black">PRO</span>
    </h1>
    <p class="text-sm text-gray-500 mb-6">Your plan auto-renews on Sep 30, 2026</p>

    <!-- Manage Plan Button (Placeholder) -->
    <NuxtLink to="/placeholder" class="bg-black text-white px-6 py-2.5 rounded-full font-medium text-sm mb-8 hover:bg-gray-800 transition-colors cursor-pointer inline-block">
      Manage Plan
    </NuxtLink>

    <!-- Menu List -->
    <div class="w-full max-w-md flex flex-col gap-4">
      
      <!-- Group 1 -->
      <div class="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
        <NuxtLink to="/profile/preferences" class="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0">
          <div class="flex items-center gap-3">
            <SlidersHorizontal class="w-5 h-5" />
            <span class="font-medium">Content Preferences</span>
          </div>
          <ChevronRight class="w-5 h-5 text-gray-400" />
        </NuxtLink>

        <NuxtLink to="/profile/language" class="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0">
          <div class="flex items-center gap-3">
            <Globe class="w-5 h-5" />
            <span class="font-medium">Language</span>
          </div>
          <div class="flex items-center gap-2 text-gray-500">
            <span class="text-sm">{{ authStore.profile.language }}</span>
            <ChevronRight class="w-5 h-5 text-gray-400" />
          </div>
        </NuxtLink>

        <NuxtLink to="/profile/edit" class="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer">
          <div class="flex items-center gap-3">
            <User class="w-5 h-5" />
            <span class="font-medium">Edit Profile</span>
          </div>
          <ChevronRight class="w-5 h-5 text-gray-400" />
        </NuxtLink>
      </div>

      <!-- Group 2 -->
      <div class="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
        <NuxtLink to="/profile/settings" class="w-full flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer">
          <div class="flex items-center gap-3">
            <Settings class="w-5 h-5" />
            <span class="font-medium">Settings</span>
          </div>
          <ChevronRight class="w-5 h-5 text-gray-400" />
        </NuxtLink>
      </div>

      <!-- Group 3 -->
      <div class="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
        <NuxtLink to="/placeholder" class="w-full flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0">
          <div class="flex items-center gap-3">
            <HelpCircle class="w-5 h-5" />
            <span class="font-medium">Help Center</span>
          </div>
          <ChevronRight class="w-5 h-5 text-gray-400" />
        </NuxtLink>

        <NuxtLink to="/placeholder" class="w-full flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer">
          <div class="flex items-center gap-3">
            <MessageSquare class="w-5 h-5" />
            <span class="font-medium">Contact Us</span>
          </div>
          <ChevronRight class="w-5 h-5 text-gray-400" />
        </NuxtLink>
      </div>

      <!-- Group 4 -->
      <div class="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
        <button @click="handleLogout" class="w-full flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer group">
          <div class="flex items-center gap-3 text-red-600 group-hover:text-red-700">
            <LogOut class="w-5 h-5" />
            <span class="font-medium">Log Out</span>
          </div>
          <ChevronRight class="w-5 h-5 text-gray-400" />
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { 
  ChevronRight, SlidersHorizontal, Globe, User, 
  Settings, HelpCircle, MessageSquare, LogOut, CircleUserRound, UserCheck
} from 'lucide-vue-next'
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  middleware: ['auth']
})

const authStore = useAuthStore()

const handleLogout = async () => {
  await authStore.signOut()
}

onMounted(async () => {
  if (!authStore.isProfileLoaded) {
    await authStore.fetchProfile()
  }
})
</script>
