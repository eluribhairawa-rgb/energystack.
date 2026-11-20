<template>
  <div class="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
    <div class="max-w-sm w-full bg-white p-8 rounded-3xl shadow-xl animate-in zoom-in duration-500">
      
      <!-- Icon Header -->
      <div :class="['w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg', isExpired ? 'bg-red-50' : 'bg-[#e2f855]']">
        <MailCheck v-if="!success && !isExpired" class="w-10 h-10 text-black" />
        <Check v-else-if="success" class="w-10 h-10 text-black" />
        <X v-else class="w-10 h-10 text-red-600" />
      </div>

      <!-- Title -->
      <h1 class="text-2xl font-bold mb-3">
        {{ isExpired ? 'Link Expired' : (success ? 'Confirmed!' : 'Confirm Subscription') }}
      </h1>
      
      <!-- Content -->
      <div v-if="!isReady && !isExpired" class="py-4">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
        <p class="text-gray-500 text-sm italic">Synchronizing secure session...</p>
      </div>

      <div v-else>
        <p class="text-gray-500 text-sm mb-8 leading-relaxed">
          <span v-if="isExpired">This invitation link is invalid or has already been used. Please request a new one from the home page.</span>
          <span v-else-if="success">Redirecting you to setup your profile...</span>
          <span v-else>Your link is valid. Click below to activate your Daily News summary and complete your setup.</span>
        </p>

        <!-- Actions -->
        <div v-if="isExpired" class="space-y-4">
          <NuxtLink to="/" class="block w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition-all">
            Return Home
          </NuxtLink>
        </div>

        <button 
          v-else-if="!success"
          @click="handleProceed"
          class="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-lg animate-in fade-in"
        >
          Confirm & Start
        </button>

        <div v-if="success" class="flex flex-col items-center gap-2 text-green-600 font-bold py-4">
          <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
          <span>Activating...</span>
        </div>
      </div>

      <p v-if="error" class="text-red-500 text-xs mt-4 leading-relaxed">{{ error }}</p>
      
      <p class="mt-8 text-[10px] text-gray-400 uppercase tracking-widest font-bold">
        Verified Onboarding
      </p>
    </div>
  </div>
</template>

<script setup>
import { MailCheck, Check, X } from 'lucide-vue-next'
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
const isReady = ref(false)
const isExpired = ref(false)
const success = ref(false)
const error = ref('')

// TODO (flagged, no clean equivalent — see server/api/invite.post.ts): this
// page assumed the user already had an authenticated session by the time
// they landed here, because Supabase's invite email carried a magic sign-in
// link. Cognito's AdminCreateUser invite email instead carries a temporary
// password with no auto-login link, so a user arriving here fresh from that
// email will NOT have a session yet — `authStore.user` will stay null and
// this page will fall through to `isExpired`. Fixing this properly needs
// either a CustomMessage Lambda trigger that embeds a real sign-in link, or
// changing this flow to prompt for the temporary password + NEW_PASSWORD_REQUIRED
// here instead of assuming an existing session.
onMounted(async () => {
  if (process.client) {
    // 1. Check for errors in hash
    const hash = window.location.hash
    if (hash.includes('error=access_denied') || hash.includes('error_description=')) {
      isExpired.value = true
      return
    }

    // 2. Wait briefly for the session-restore check in stores/auth.ts to run.
    let attempts = 0
    while (attempts < 50) {
      if (authStore.user) {
        isReady.value = true
        break
      }
      await new Promise(resolve => setTimeout(resolve, 100))
      attempts++
    }

    if (!isReady.value) isExpired.value = true
  }
})

const handleProceed = async () => {
  error.value = ''
  
  try {
    // 3. SECURE ONBOARDING: Call server API to create the profile record
    const response = await $fetch('/api/onboard', {
      method: 'POST',
      body: {
        // Cognito's user object has no `user_metadata` bag like Supabase's —
        // /api/onboard already defaults full_name etc. when metadata is empty.
        userId: authStore.user.sub,
        metadata: {}
      }
    })

    if (response.success) {
      success.value = true
      // 4. Force store refresh
      await authStore.fetchProfile()
      
      // 5. HARD RELOAD to onboarding page to ensure cookies are sent to server
      setTimeout(() => {
        window.location.href = '/profile/edit'
      }, 1500)
    }
  } catch (e) {
    error.value = 'Onboarding failed. Please try again.'
    console.error(e)
  }
}
</script>
