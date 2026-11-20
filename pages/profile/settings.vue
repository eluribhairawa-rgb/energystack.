<template>
  <div class="flex flex-col px-4 pt-6 max-w-md mx-auto">
    <div class="flex items-center mb-8">
      <NuxtLink to="/profile" class="p-2 -ml-2 hover:bg-gray-100 rounded-full cursor-pointer transition-colors">
        <ChevronLeft class="w-6 h-6" />
      </NuxtLink>
      <h1 class="text-xl font-bold ml-2">Account Security</h1>
    </div>

    <div v-if="authStore.loading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
    </div>

    <div v-else class="flex flex-col gap-8 animate-in fade-in">
      <section>
        <h2 class="text-lg font-bold mb-2">Password</h2>
        <p class="text-sm text-gray-500 mb-6">
          {{ authStore.hasPassword ? 'Update your current password.' : 'Secure your account by adding a password.' }}
        </p>

        <div v-if="successMessage" class="bg-green-50 text-green-700 p-4 rounded-xl text-sm mb-6">
          {{ successMessage }}
        </div>

        <form @submit.prevent="handleUpdatePassword" class="flex flex-col gap-5">
          <!-- Old Password (Only if hasPassword) -->
          <div v-if="authStore.hasPassword">
            <label class="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Current Password</label>
            <input 
              v-model="oldPassword" 
              type="password" 
              required
              class="w-full px-4 py-3 rounded-xl bg-gray-100 border-none focus:ring-2 focus:ring-black outline-none"
              placeholder="••••••••"
            />
          </div>

          <!-- New Password -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5 ml-1">
              {{ authStore.hasPassword ? 'New Password' : 'Set Password' }}
            </label>
            <input 
              v-model="newPassword" 
              type="password" 
              required
              minlength="6"
              class="w-full px-4 py-3 rounded-xl bg-gray-100 border-none focus:ring-2 focus:ring-black outline-none"
              placeholder="••••••••"
            />
            <p class="text-[10px] text-gray-400 mt-2 ml-1">Min 6 characters, must include uppercase and number.</p>
          </div>

          <p v-if="localError" class="text-red-500 text-sm ml-1">{{ localError }}</p>

          <button 
            type="submit" 
            :disabled="isUpdating"
            class="w-full bg-black text-white py-3 rounded-xl font-bold text-lg hover:bg-gray-800 transition-colors disabled:opacity-50 mt-2 cursor-pointer shadow-lg"
          >
            {{ isUpdating ? 'Updating...' : (authStore.hasPassword ? 'Change Password' : 'Create Password') }}
          </button>
        </form>
      </section>

      <!-- Advanced Info -->
      <section class="bg-gray-50 p-4 rounded-2xl">
        <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Login Methods</h3>
        <div class="flex items-center justify-between text-sm">
          <div class="flex items-center gap-2">
            <Mail class="w-4 h-4 text-gray-400" />
            <span class="text-gray-600">Magic Link</span>
          </div>
          <span :class="otpLoginEnabled ? 'text-green-600' : 'text-gray-400'" class="font-bold">
            {{ otpLoginEnabled ? 'Enabled' : 'Coming soon' }}
          </span>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
// NOTE: every Cognito account now has a password from signup (see
// MIGRATION_NOTES.md — passwordless account creation isn't supported), so
// `authStore.hasPassword` should be true for all new users and the
// "Create Password" (no current-password field) branch below is effectively
// legacy — it only still matters for a profile row that was migrated in
// with has_password=false and never had a Cognito password set.
import { ChevronLeft, Mail } from 'lucide-vue-next'
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  middleware: ['auth']
})

const authStore = useAuthStore()
const otpLoginEnabled = useRuntimeConfig().public.enableOtpLogin
const isUpdating = ref(false)
const oldPassword = ref('')
const newPassword = ref('')
const localError = ref('')
const successMessage = ref('')

const validatePassword = (pwd: string) => {
  const hasUpperCase = /[A-Z]/.test(pwd)
  const hasNumber = /\d/.test(pwd)
  return pwd.length >= 6 && hasUpperCase && hasNumber
}

const handleUpdatePassword = async () => {
  localError.value = ''
  successMessage.value = ''

  if (!validatePassword(newPassword.value)) {
    localError.value = 'Password must be at least 6 characters with an uppercase letter and a number.'
    return
  }

  isUpdating.value = true

  // Cognito's ChangePassword takes the current password directly — no need
  // for the old sign-in-to-verify workaround Supabase required.
  const result = await authStore.changePassword(oldPassword.value, newPassword.value)
  if (result) {
    successMessage.value = 'Password updated successfully!'
    oldPassword.value = ''
    newPassword.value = ''
  } else {
    localError.value = authStore.error || 'Failed to update password.'
  }
  
  isUpdating.value = false
}
</script>
