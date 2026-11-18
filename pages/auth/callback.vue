<template>
  <div class="flex min-h-[75vh] items-center justify-center px-6 text-center">
    <div class="w-full max-w-sm rounded-3xl bg-white p-8 shadow-xl">
      <template v-if="signedIn">
        <div class="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-black"></div>
        <h1 class="text-2xl font-bold text-black">Signing you in</h1>
      </template>

      <template v-else-if="!showError">
        <h1 class="text-2xl font-bold text-black">Sign in to Energystacks</h1>
        <p class="mt-3 text-sm leading-relaxed text-gray-500">{{ email }}</p>

        <!-- Requires an actual click, not just loading this page — a link
             scanner / email-preview bot that GETs this URL never triggers
             sign-in, so it can't silently burn the single-use code before
             the real recipient clicks. -->
        <button
          @click="handleConfirm"
          :disabled="loading"
          class="mt-6 w-full rounded-xl bg-black py-3 font-bold text-white transition-colors hover:bg-gray-800 disabled:opacity-50 cursor-pointer"
        >
          {{ loading ? 'Signing in...' : 'Click to sign in' }}
        </button>
      </template>

      <template v-else>
        <div class="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
          <CircleAlert class="h-7 w-7 text-red-600" />
        </div>
        <h1 class="text-2xl font-bold text-black">Unable to sign in</h1>
        <p class="mt-3 text-sm leading-relaxed text-gray-500">{{ errorMessage }}</p>
        <NuxtLink
          to="/login"
          class="mt-6 block w-full rounded-xl bg-black py-3 font-bold text-white transition-colors hover:bg-gray-800"
        >
          Go to Login
        </NuxtLink>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CircleAlert } from 'lucide-vue-next'
import { useAuthStore } from '~/stores/auth'

const route = useRoute()
const authStore = useAuthStore()

const email = String(route.query.email || '')
const code = String(route.query.code || '')
const session = String(route.query.session || '')

const signedIn = ref(false)
const loading = ref(false)
const showError = ref(!email || !code || !session)
const errorMessage = ref('This sign-in link is invalid or has expired. Please request a new one.')

const handleConfirm = async () => {
  loading.value = true
  const success = await authStore.confirmLoginOtpFromLink({ email, code, session })
  loading.value = false

  if (success) {
    signedIn.value = true
    await navigateTo('/profile', { replace: true })
  } else {
    errorMessage.value = authStore.error || errorMessage.value
    showError.value = true
  }
}

useSeoMeta({
  title: 'Signing In - Energystacks',
  robots: 'noindex, nofollow'
})
</script>
