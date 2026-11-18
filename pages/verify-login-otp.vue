<template>
  <div class="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
    <div class="w-full max-w-sm">
      <h1 class="text-3xl font-bold mb-4">Check Your Email</h1>
      <p class="text-gray-500 mb-8">
        We sent a sign-in link to <span class="font-medium text-black">{{ email }}</span>.
        Click the link in that email to continue.
      </p>

      <div class="mt-6 text-center text-sm">
        <NuxtLink to="/login" class="font-bold hover:underline cursor-pointer">Back to login</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['guest']
})

const route = useRoute()
const email = String(route.query.email || '')
</script>
