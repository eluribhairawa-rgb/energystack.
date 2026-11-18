<template>
  <div class="flex flex-col items-center justify-center min-h-[80vh] px-4">
    <div class="w-full max-w-sm">
      <h1 class="text-3xl font-bold mb-8 text-center">Sign Up</h1>
      
      <form @submit.prevent="handleSignup" class="flex flex-col gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input 
            v-model="fullName" 
            type="text" 
            required 
            class="w-full px-4 py-3 rounded-xl bg-gray-100 border-none focus:ring-2 focus:ring-black outline-none"
            placeholder="John Doe"
          />
        </div>

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
        
        <!-- Password is now always required at signup (Cognito has no
             passwordless account-creation path without a custom-auth Lambda
             trigger — see MIGRATION_NOTES.md). The old "skip for now" toggle
             is removed. -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <p class="text-xs text-gray-500 mb-1">At least 6 characters, including numbers and uppercase letters.</p>
          <input
            v-model="password"
            type="password"
            required
            minlength="6"
            class="w-full px-4 py-3 rounded-xl bg-gray-100 border-none focus:ring-2 focus:ring-black outline-none"
            placeholder="••••••••"
          />
        </div>

        <p v-if="error" class="text-red-500 text-sm text-center">{{ error }}</p>

        <button 
          type="submit" 
          :disabled="loading"
          class="w-full bg-black text-white py-3 rounded-xl font-bold text-lg hover:bg-gray-800 transition-colors disabled:opacity-50 mt-4"
        >
          {{ loading ? 'Signing up...' : 'Sign Up' }}
        </button>
      </form>

      <div class="mt-6 text-center text-sm">
        Already have an account? 
        <NuxtLink to="/login" class="font-bold hover:underline">Login</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  middleware: ['guest']
})

const authStore = useAuthStore()
const fullName = ref('')
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const validatePassword = (pwd: string) => {
  const hasUpperCase = /[A-Z]/.test(pwd)
  const hasNumber = /\d/.test(pwd)
  return pwd.length >= 6 && hasUpperCase && hasNumber
}

const handleSignup = async () => {
  if (!authStore.validateEmail(email.value)) {
    error.value = 'Please enter a valid email address.'
    return
  }

  if (!validatePassword(password.value)) {
    error.value = 'Password must be at least 6 characters with an uppercase letter and a number.'
    return
  }

  loading.value = true
  error.value = ''

  const type = await authStore.signUp({
    email: email.value,
    password: password.value,
    fullName: fullName.value
  })
  
  if (type) {
    navigateTo({
      path: '/verify-otp',
      query: { email: email.value, type }
    })
  } else {
    error.value = authStore.error || 'Signup failed'
  }
  loading.value = false
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
