<template>
  <div class="flex flex-col items-center justify-center min-h-[80vh] px-4">
    <div class="w-full max-w-sm text-center">
      <h1 class="text-3xl font-bold mb-4">Verify Email</h1>
      <p class="text-gray-500 mb-8">We sent a 6-digit code to {{ email }}</p>
      
      <form @submit.prevent="handleVerify" class="flex flex-col gap-4">
        <div>
          <input 
            v-model="otp" 
            type="text" 
            required 
            maxlength="6"
            class="w-full px-4 py-3 rounded-xl bg-gray-100 border-none focus:ring-2 focus:ring-black outline-none text-center text-2xl tracking-widest"
            placeholder="000000"
          />
        </div>

        <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>

        <button 
          type="submit" 
          :disabled="loading"
          class="w-full bg-black text-white py-3 rounded-xl font-bold text-lg hover:bg-gray-800 transition-colors disabled:opacity-50 mt-4"
        >
          {{ loading ? 'Verifying...' : 'Verify Code' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'

const route = useRoute()
const authStore = useAuthStore()
const email = route.query.email || ''
const type = route.query.type || 'signup'
const otp = ref('')
const loading = ref(false)
const error = ref('')

const handleVerify = async () => {
  loading.value = true
  error.value = ''
  
  const success = await authStore.verifyOtp({ 
    email, 
    token: otp.value,
    type: type
  })
  
  if (success) {
    navigateTo('/profile')
  } else {
    error.value = authStore.error || 'Invalid code'
  }
  loading.value = false
}
</script>
