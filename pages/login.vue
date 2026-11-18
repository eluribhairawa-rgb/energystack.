<template>
  <div class="flex flex-col items-center justify-center min-h-[80vh] px-4">
    <div class="w-full max-w-sm">
      <h1 class="text-3xl font-bold mb-8 text-center">Login</h1>
      
      <form @submit.prevent="handleSubmit" class="flex flex-col gap-4">
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

        <!-- Password Toggle -->
        <!-- Magic-link login is disabled until Cognito has a CUSTOM_CHALLENGE
             Lambda trigger — see MIGRATION_NOTES.md. Toggle stays behind the
             enableOtpLogin flag so it comes back with a one-line change. -->
        <div class="mt-1 flex items-center justify-between">
          <button
            v-if="otpLoginEnabled"
            type="button"
            @click="isPasswordLogin = !isPasswordLogin"
            class="text-xs font-medium text-blue-600 hover:underline cursor-pointer"
          >
            {{ isPasswordLogin ? 'Login with magic link instead' : 'Login with password instead' }}
          </button>
          <span v-else></span>

          <NuxtLink
            v-if="isPasswordLogin"
            to="/forgot-password"
            class="text-xs text-gray-500 hover:text-black hover:underline cursor-pointer"
          >
            Forgot Password?
          </NuxtLink>
        </div>
        
        <Transition name="fade">
          <div v-if="isPasswordLogin">
            <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input 
              v-model="password" 
              type="password" 
              :required="isPasswordLogin"
              class="w-full px-4 py-3 rounded-xl bg-gray-100 border-none focus:ring-2 focus:ring-black outline-none"
              placeholder="••••••••"
            />
          </div>
        </Transition>

        <p v-if="error" class="text-red-500 text-sm text-center">{{ error }}</p>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-black text-white py-3 rounded-xl font-bold text-lg hover:bg-gray-800 transition-colors disabled:opacity-50 mt-4 cursor-pointer"
        >
          <span v-if="loading">Processing...</span>
          <span v-else>{{ isPasswordLogin ? 'Login' : 'Send Magic Link' }}</span>
        </button>
      </form>

      <div class="mt-6 text-center text-sm">
        Don't have an account? 
        <NuxtLink to="/signup" class="font-bold hover:underline cursor-pointer">Sign up</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  middleware: ['guest']
})

const authStore = useAuthStore()
const config = useRuntimeConfig()
const otpLoginEnabled = config.public.enableOtpLogin
const email = ref('')
const password = ref('')
const isPasswordLogin = ref(!otpLoginEnabled)
const loading = ref(false)
const error = ref('')

const handleSubmit = async () => {
  if (!authStore.validateEmail(email.value)) {
    error.value = 'Please enter a valid email address.'
    return
  }

  loading.value = true
  error.value = ''

  if (isPasswordLogin.value) {
    const success = await authStore.signIn({ email: email.value, password: password.value })
    if (success) {
      navigateTo('/profile')
    } else {
      error.value = authStore.error || 'Login failed. Check your email and password.'
    }
  } else {
    // Magic Link — sends a 6-digit code; the code-entry step happens on
    // /verify-login-otp (Cognito's CUSTOM_AUTH flow is code-based, not a
    // clickable link).
    const success = await authStore.signInWithOtp(email.value)
    if (success) {
      navigateTo({ path: '/verify-login-otp', query: { email: email.value } })
    } else {
      error.value = authStore.error || 'Failed to send magic link.'
    }
  }
  loading.value = false
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
