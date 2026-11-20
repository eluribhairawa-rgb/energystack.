<template>
  <div class="flex flex-col items-center justify-center min-h-[80vh] px-4">
    <div class="w-full max-w-sm text-center">
      <h1 class="text-3xl font-bold mb-4">Reset Password</h1>
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
// Cognito's confirmPassword needs the code and the new password in the SAME
// call (unlike Supabase, where verifying the recovery code established a
// session that a later, separate updateUser({password}) call could use).
// So this page no longer verifies the code on its own — it just carries the
// code forward to /update-password, which submits code + newPassword
// together. An invalid/expired code will only surface as an error on that
// final step.
const route = useRoute()
const email = route.query.email || ''
const otp = ref('')
const loading = ref(false)
const error = ref('')

const handleVerify = async () => {
  if (!otp.value) {
    error.value = 'Please enter the code.'
    return
  }
  navigateTo({ path: '/update-password', query: { email, code: otp.value } })
}
</script>
