<template>
  <div class="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
    <div class="bg-gray-100 p-4 rounded-full mb-4">
      <Construction class="w-12 h-12 text-gray-400" />
    </div>
    <h1 class="text-2xl font-bold mb-2">Coming Soon</h1>
    <p class="text-gray-500 mb-8 max-w-xs">This feature is currently under development. Please check back later!</p>
    
    <button @click="$router.back()" class="text-blue-600 font-medium hover:underline">
      Go Back
    </button>
  </div>
</template>

<script setup>
import { Construction } from 'lucide-vue-next'
</script>
