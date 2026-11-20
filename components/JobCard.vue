<template>
  <div
    @click="$emit('click-job', item)"
    class="JobCard flex gap-4 py-4 border-b border-gray-100 last:border-0 items-center cursor-pointer hover:bg-gray-50/50 transition-colors px-2 -mx-2 rounded-xl"
  >
    <!-- Logo -->
    <div class="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
      <img v-if="item.logo_url" :src="item.logo_url" class="w-full h-full object-cover" :alt="item.title" />
      <Briefcase v-else class="w-6 h-6 text-gray-300" />
    </div>

    <!-- Content -->
    <div class="flex-grow flex flex-col justify-center min-w-0">
      <div class="flex items-center gap-2 mb-1">
        <span class="text-[11px] font-bold text-gray-600 bg-gray-50 px-2 py-0.5 rounded uppercase">
          {{ item.department || item.category }}
        </span>
        <span v-if="item.employment_type" class="text-[11px] font-bold text-gray-600 bg-gray-50 px-2 py-0.5 rounded uppercase">
          {{ item.employment_type }}
        </span>
      </div>
      <h3 class="text-lg font-bold text-gray-900 leading-snug line-clamp-2">
        {{ item.title }}
      </h3>
      <div class="flex items-center gap-3 mt-2 text-sm text-gray-500">
        <span v-if="item.location">{{ item.location }}</span>
        <span v-if="postedLabel" class="text-gray-400">{{ postedLabel }}</span>
        <div v-if="item.experience_level" class="flex items-center gap-1">
          <Briefcase class="w-3.5 h-3.5" />
          <span>{{ item.experience_level }}</span>
        </div>
      </div>
    </div>

    <!-- Arrow -->
    <div class="flex-shrink-0">
      <div class="w-10 h-10 rounded-full flex items-center justify-center bg-black text-white">
        <ChevronRight class="w-5 h-5" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { Briefcase, ChevronRight } from 'lucide-vue-next'

const props = defineProps({
  item: {
    type: Object,
    required: true
  }
})

defineEmits(['click-job'])

// QA M2: show when the job was posted
const postedLabel = computed(() => {
  const raw = props.item.posted_date || props.item.date
  if (!raw) return ''
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return ''
  return 'Posted ' + d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
})
</script>