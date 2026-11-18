<template>
  <div class="flex flex-col items-center justify-center min-h-[80vh] px-4">
    <div class="w-full max-w-sm">
      <h1 class="text-3xl font-bold mb-4 text-center">Forgot Password</h1>
      <p class="text-gray-500 mb-8 text-center">Enter your email to receive a reset code.</p>
      
      <form @submit.prevent="handleReset" class="flex flex-col gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input 
            v-model="email" 
            type="email" 
            required 
            class="w-full px-4 py-3 rounded-xl bg-gray-100 border-none focus:ring-2 focus:ring-black outline-none"
            placeholder="Enter your email"
          />
        </div>

        <p v-if="message" class="text-green-600 text-sm text-center">{{ message }}</p>
        <p v-if="error" class="text-red-500 text-sm text-center">{{ error }}</p>

        <button 
          type="submit" 
          :disabled="loading"
          class="w-full bg-black text-white py-3 rounded-xl font-bold text-lg hover:bg-gray-800 transition-colors disabled:opacity-50 mt-4"
        >
          {{ loading ? 'Sending...' : 'Send Code' }}
        </button>
      </form>

      <div class="mt-6 text-center text-sm">
        Remember your password? 
        <NuxtLink to="/login" class="font-bold hover:underline">Login</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
const email = ref('')
const loading = ref(false)
const message = ref('')
const error = ref('')

const handleReset = async () => {
  if (!authStore.validateEmail(email.value)) {
    error.value = 'Please enter a valid email address.'
    return
  }

  loading.value = true
  message.value = ''
  error.value = ''
  
  const success = await authStore.resetPasswordForEmail(email.value)
  
  if (success) {
    navigateTo({ path: '/verify-reset-otp', query: { email: email.value } })
  } else {
    error.value = authStore.error || 'Failed to send reset code'
  }
  loading.value = false
}
</script>
