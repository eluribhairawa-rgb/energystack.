<template>
  <div class="flex flex-col px-4 pt-6 max-w-md mx-auto">
    <div class="flex items-center mb-6">
      <NuxtLink to="/profile" class="p-2 -ml-2 hover:bg-gray-100 rounded-full">
        <ChevronLeft class="w-6 h-6" />
      </NuxtLink>
      <h1 class="text-xl font-bold ml-2">Edit Profile</h1>
    </div>

    <div v-if="!authStore.isProfileLoaded" class="flex items-center justify-center py-20">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
    </div>

    <form v-else @submit.prevent="handleSave" class="flex flex-col gap-6 animate-in fade-in">
      <!-- Avatar Upload -->
      <div class="flex flex-col items-center gap-3">
        <div class="w-24 h-24 rounded-full overflow-hidden border border-gray-200 relative bg-gray-100">
          <img 
            v-if="previewUrl || authStore.profile.avatar_url"
            :src="previewUrl || authStore.profile.avatar_url" 
            class="w-full h-full object-cover" 
          />
          <div v-else class="w-full h-full flex items-center justify-center text-gray-400">
            <CircleUserRound class="w-16 h-16" />
          </div>
          <!-- Status Dot (Only for default icon users) -->
          <div v-if="!previewUrl && !authStore.profile.avatar_url" class="absolute top-1 right-1 w-6 h-6 bg-green-500 border-4 border-white rounded-full shadow-sm"></div>
          <div v-if="uploading" class="absolute inset-0 bg-black/30 flex items-center justify-center">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          </div>
        </div>
        <label class="text-sm font-bold text-blue-600 cursor-pointer hover:underline">
          Change Photo
          <input type="file" accept="image/*" class="hidden" @change="handleFileChange" />
        </label>
        <p v-if="formError" class="text-red-500 text-xs mt-2 text-center">{{ formError }}</p>
      </div>

      <!-- Full Name -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
        <input 
          v-model="form.full_name" 
          type="text" 
          class="w-full px-4 py-3 rounded-xl bg-gray-100 border-none focus:ring-2 focus:ring-black outline-none"
        />
      </div>

      <button 
        type="submit" 
        :disabled="loading"
        class="w-full bg-black text-white py-3 rounded-xl font-bold text-lg hover:bg-gray-800 transition-colors disabled:opacity-50 mt-4 cursor-pointer"
      >
        {{ loading ? 'Saving...' : 'Save Changes' }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { ChevronLeft, CircleUserRound } from 'lucide-vue-next'
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  middleware: ['auth']
})

const authStore = useAuthStore()
const loading = ref(false)
const uploading = ref(false)
const previewUrl = ref('')
const formError = ref('')

const form = ref({
  full_name: authStore.profile.full_name
})

// Sync form whenever profile name changes or becomes available
watch(() => authStore.profile.full_name, (newName) => {
  if (newName) {
    form.value.full_name = newName
  }
}, { immediate: true })

const handleFileChange = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  // Validate file type and size
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    formError.value = 'Invalid file type. Please upload a JPG, PNG, or GIF.'
    return
  }
  if (file.size > 100 * 1024) { // 100KB
    formError.value = 'File is too large. Maximum size is 100KB.'
    return
  }

  formError.value = ''
  uploading.value = true
  // Create local preview
  previewUrl.value = URL.createObjectURL(file)
  
  // Upload to Supabase
  await authStore.uploadAvatar(file)
  uploading.value = false
}

const handleSave = async () => {
  loading.value = true
  await authStore.updateProfile({
    full_name: form.value.full_name
  })
  loading.value = false
  navigateTo('/profile')
}
</script>
