<template>
    <nav class="fixed bottom-0 left-0 right-0 bg-black text-white z-50" aria-label="Primary navigation">
      <div class="max-w-5xl mx-auto flex items-center px-2 pt-2.5 pb-[max(0.65rem,env(safe-area-inset-bottom))]">
          <NuxtLink
            to="/"
            class="flex min-w-0 flex-1 flex-col items-center gap-1 py-1 cursor-pointer"
            :aria-current="$route.path === '/' || $route.path.startsWith('/news/') ? 'page' : undefined"
          >
            <div :class="['rounded-full', ($route.path === '/' || $route.path.startsWith('/news/')) ? 'text-[#e2f855]' : 'text-white']">
              <Home class="w-7 h-7" />
            </div>
            <span :class="['text-[11px] font-medium leading-none', ($route.path === '/' || $route.path.startsWith('/news/')) ? 'text-[#e2f855]' : 'text-gray-300']">News</span>
          </NuxtLink>
    
          <NuxtLink
            to="/markets"
            class="flex min-w-0 flex-1 flex-col items-center gap-1 py-1 cursor-pointer"
            :aria-current="$route.path === '/markets' || $route.path === '/stock' ? 'page' : undefined"
          >
            <div :class="['rounded-full', ($route.path === '/markets' || $route.path === '/stock') ? 'text-[#e2f855]' : 'text-white']">
              <TrendingUp class="w-7 h-7" />
            </div>
            <span :class="['text-[11px] font-medium leading-none', ($route.path === '/markets' || $route.path === '/stock') ? 'text-[#e2f855]' : 'text-gray-300']">Markets</span>
          </NuxtLink>
    
          <NuxtLink
            to="/jobs"
            class="flex min-w-0 flex-1 flex-col items-center gap-1 py-1 cursor-pointer"
            :aria-current="$route.path.startsWith('/jobs') ? 'page' : undefined"
          >
            <div :class="['rounded-full', $route.path.startsWith('/jobs') ? 'text-[#e2f855]' : 'text-white']">
              <Briefcase class="w-7 h-7" />
            </div>
            <span :class="['text-[11px] font-medium leading-none', $route.path.startsWith('/jobs') ? 'text-[#e2f855]' : 'text-gray-300']">Jobs</span>
          </NuxtLink>
    
          <NuxtLink
            to="/events"
            class="flex min-w-0 flex-1 flex-col items-center gap-1 py-1 cursor-pointer"
            :aria-current="$route.path.startsWith('/events') ? 'page' : undefined"
          >
            <div :class="['rounded-full', $route.path.startsWith('/events') ? 'text-[#e2f855]' : 'text-white']">
              <CalendarDays class="w-7 h-7" />
            </div>
            <span :class="['text-[11px] font-medium leading-none', $route.path.startsWith('/events') ? 'text-[#e2f855]' : 'text-gray-300']">Events</span>
          </NuxtLink>
    
          <NuxtLink
            to="/more"
            class="flex min-w-0 flex-1 flex-col items-center gap-1 py-1 cursor-pointer"
            :aria-current="$route.path.startsWith('/more') ? 'page' : undefined"
          >
            <div :class="['rounded-full', $route.path.startsWith('/more') ? 'text-[#e2f855]' : 'text-white']">
              <Ellipsis class="w-7 h-7" />
            </div>
            <span :class="['text-[11px] font-medium leading-none', $route.path.startsWith('/more') ? 'text-[#e2f855]' : 'text-gray-300']">More</span>
          </NuxtLink>
        </div>
  </nav>
</template>

<script setup>
import { Home, TrendingUp, Briefcase, CalendarDays, Ellipsis } from 'lucide-vue-next'
</script>
