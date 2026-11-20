<template>
  <footer class="px-4 sm:px-6 lg:px-8 pb-28 md:pb-8 pt-6 border-t border-gray-100 text-sm text-gray-500">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <p>&copy; {{ year }} Energystacks. All rights reserved.</p>
      <nav aria-label="Footer" class="flex flex-wrap gap-x-5 gap-y-2">
        <NuxtLink v-for="l in links" :key="l.to" :to="l.to" class="hover:text-black hover:underline">{{ l.label }}</NuxtLink>
      </nav>
    </div>
  </footer>
</template>

<script setup lang="ts">
const year = new Date().getFullYear()
const links = [
  { to: '/about', label: 'About' },
  { to: '/privacy', label: 'Privacy' },
  { to: '/terms', label: 'Terms' },
  { to: '/contact', label: 'Contact' }
]
</script>
