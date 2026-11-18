<template>
  <section class="min-h-[65vh] flex items-center justify-center px-4 text-center">
    <div class="flex flex-col items-center">
      <div class="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#e2f855]">
        <Ellipsis class="h-8 w-8 text-black" />
      </div>

      <p class="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
        Quiz / Media / Snap / Blog
      </p>
      <h1 class="mt-3 text-3xl font-bold text-black">Coming Soon</h1>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Ellipsis } from 'lucide-vue-next'

useSeoMeta({
  title: 'More - Energystacks',
  description: 'More Energystacks features are coming soon.'
})
</script>
