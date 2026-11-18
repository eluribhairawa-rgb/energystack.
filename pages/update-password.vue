<template>
  <div class="flex flex-col items-center justify-center min-h-[80vh] px-4">
    <div class="w-full max-w-sm">
      <h1 class="text-3xl font-bold mb-4 text-center">Update Password</h1>
      
      <form @submit.prevent="handleUpdate" class="flex flex-col gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">New Password</label>
          <input 
            v-model="password" 
            type="password" 
            required 
            minlength="6"
            class="w-full px-4 py-3 rounded-xl bg-gray-100 border-none focus:ring-2 focus:ring-black outline-none"
            placeholder="New Password"
          />
        </div>

        <p v-if="error" class="text-red-500 text-sm text-center">{{ error }}</p>

        <button 
          type="submit" 
          :disabled="loading"
          class="w-full bg-black text-white py-3 rounded-xl font-bold text-lg hover:bg-gray-800 transition-colors disabled:opacity-50 mt-4"
        >
          {{ loading ? 'Updating...' : 'Update Password' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'

// Final step of the forgot-password flow. Cognito's confirmPassword needs
// the emailed code alongside the new password — no separate "recovery
// session" the way Supabase had. The code/email arrive via query params
// from /verify-reset-otp; if they're missing, this page was reached
// directly and can't do anything useful.
definePageMeta({
  middleware: [] // Public — identity is proven by the emailed code, not a session
})

const route = useRoute()
const authStore = useAuthStore()
const email = String(route.query.email || '')
const code = String(route.query.code || '')
const password = ref('')
const loading = ref(false)
const error = ref(email && code ? '' : 'This link is missing information — please restart the password reset.')

const validatePassword = (pwd) => {
  const hasUpperCase = /[A-Z]/.test(pwd)
  const hasNumber = /\d/.test(pwd)
  return pwd.length >= 6 && hasUpperCase && hasNumber
}

const handleUpdate = async () => {
  if (!email || !code) {
    error.value = 'This link is missing information — please restart the password reset.'
    return
  }

  if (!validatePassword(password.value)) {
    error.value = 'Password must be at least 6 characters with an uppercase letter and a number.'
    return
  }

  loading.value = true
  error.value = ''

  const success = await authStore.confirmForgotPassword({ email, code, newPassword: password.value })

  if (success) {
    navigateTo('/login')
  } else {
    error.value = authStore.error || 'Failed to update password'
  }
  loading.value = false
}
</script>
