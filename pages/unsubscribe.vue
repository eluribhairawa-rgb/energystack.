<template>
  <div class="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
    <div v-if="loading" class="animate-spin rounded-full h-12 w-12 border-b-2 border-black mb-4"></div>
    
    <div v-else-if="success" class="max-w-md">
      <div class="bg-green-50 p-4 rounded-full mb-4 inline-block">
        <Check class="w-12 h-12 text-green-500" />
      </div>
      <h1 class="text-2xl font-bold mb-2">Unsubscribed</h1>
      <p class="text-gray-500 mb-8">
        You have successfully unsubscribed from the Daily Email Digest. You can re-subscribe at any time in your profile settings.
      </p>
      <NuxtLink to="/" class="bg-black text-white px-6 py-2.5 rounded-full font-bold inline-block">
        Return Home
      </NuxtLink>
    </div>

    <div v-else-if="error" class="max-w-md">
      <div class="bg-red-50 p-4 rounded-full mb-4 inline-block">
        <XCircle class="w-12 h-12 text-red-500" />
      </div>
      <h1 class="text-2xl font-bold mb-2">Unsubscribe Failed</h1>
      <p class="text-gray-500 mb-8">{{ error }}</p>
      <NuxtLink to="/" class="bg-black text-white px-6 py-2.5 rounded-full font-bold inline-block">
        Return Home
      </NuxtLink>
    </div>

    <div v-else class="max-w-md">
      <h1 class="text-2xl font-bold mb-4">Confirm Unsubscribe</h1>
      <p class="text-gray-500 mb-8">
        Are you sure you want to stop receiving the Daily Email Digest?
      </p>
      <div class="flex flex-col gap-3">
        <button 
          @click="handleUnsubscribe"
          class="bg-red-600 text-white px-6 py-3 rounded-full font-bold hover:bg-red-700 transition-colors"
        >
          Yes, Unsubscribe Me
        </button>
        <NuxtLink to="/" class="text-gray-500 font-medium hover:text-black mt-2">
          Cancel
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Check, XCircle } from 'lucide-vue-next'
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  middleware: [] // Public page
})

const route = useRoute()
const authStore = useAuthStore()
const token = route.query.token
const loading = ref(false)
const success = ref(false)
const error = ref('')

if (!token) {
  error.value = 'Invalid or missing unsubscribe token.'
}

const handleUnsubscribe = async () => {
  if (!token) return
  
  loading.value = true
  const result = await authStore.confirmUnsubscribe(token)
  loading.value = false
  
  if (result) {
    success.value = true
  } else {
    error.value = 'This link is invalid or expired, or you have already unsubscribed.'
  }
}
</script>
