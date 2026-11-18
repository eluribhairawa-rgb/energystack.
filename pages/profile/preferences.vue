<template>
  <div class="flex flex-col px-4 pt-6 max-w-md mx-auto">
    <div class="flex items-center mb-6">
      <NuxtLink to="/profile" class="p-2 -ml-2 hover:bg-gray-100 rounded-full">
        <ChevronLeft class="w-5 h-5" />
      </NuxtLink>
      <h1 class="text-xl font-bold ml-2">Content Preferences</h1>
    </div>

    <div v-if="isInitializing" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
    </div>

    <div v-else class="flex flex-col gap-6">
      <div class="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
        <div class="flex flex-col">
          <span class="font-medium">Daily Email Digest</span>
          <span class="text-xs text-gray-500">Receive a summary of the past 24h news</span>
        </div>
        <label class="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            v-model="emailDigest"
            class="sr-only peer"
          />
          <div class="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
        </label>
      </div>

      <div class="flex flex-col gap-2">
        <h2 class="text-sm font-bold text-gray-500 ml-1 uppercase">Topics</h2>
        <label
          v-for="option in options"
          :key="option"
          class="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl shadow-sm cursor-pointer hover:border-gray-300 transition-colors"
        >
          <span class="font-medium">{{ option }}</span>
          <input
            type="checkbox"
            :value="option"
            v-model="selected"
            class="h-6 w-6 rounded-full border-gray-300 text-black focus:ring-black"
          />
        </label>
      </div>

      <div ref="jobAlertsRef" class="mt-2">
        <h3 class="text-sm font-bold mb-2">Job Alerts</h3>
        <div class="flex items-center gap-3 mb-3">
          <label class="flex items-center gap-2">
            <input type="checkbox" v-model="jobPrefsEnabled" />
            <span class="text-sm">Enable job alert emails</span>
          </label>
        </div>

        <div v-if="jobPrefsEnabled" class="space-y-3">
          <div class="relative" v-for="group in groups" :key="group.key">
            <label class="block text-xs font-bold text-gray-400 uppercase mb-1">{{ group.label }}</label>
            <button
              type="button"
              @click="toggleOpen(group.key)"
              class="w-full text-left px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
            >
              <span v-if="selectedByGroup(group.key).length === 0" class="text-gray-500">All</span>
              <span v-else class="truncate block">{{ selectedByGroup(group.key).join(', ') }}</span>
            </button>
            <div v-if="openGroup === group.key" class="absolute z-20 mt-2 w-full max-h-44 overflow-auto bg-white border border-gray-200 rounded-lg p-2 shadow-lg">
              <label class="flex items-center gap-2 px-2 py-1 text-sm">
                <input type="checkbox" :checked="selectedByGroup(group.key).length === 0" @change="clearGroup(group.key)" />
                All
              </label>
              <label v-for="opt in group.options" :key="opt.value" class="flex items-center gap-2 px-2 py-1 text-sm">
                <input
                  type="checkbox"
                  :checked="selectedByGroup(group.key).includes(opt.value)"
                  @change="toggleGroupValue(group.key, opt.value)"
                />
                {{ opt.label }}
              </label>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-2">
        <h3 class="text-sm font-bold mb-2">Calendar / Event Alerts</h3>
        <div class="flex items-center gap-3 mb-3">
          <label class="flex items-center gap-2">
            <input type="checkbox" v-model="eventPrefsEnabled" />
            <span class="text-sm">Enable event alert emails</span>
          </label>
        </div>

        <div v-if="eventPrefsEnabled" class="space-y-3">
          <div class="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
            <label class="block text-xs font-bold text-gray-400 uppercase mb-2">Event Type</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="type in eventTypeOptions"
                :key="type"
                type="button"
                @click="toggleEventType(type)"
                :class="[
                  'px-3 py-1 rounded-full text-xs font-semibold border transition-colors',
                  selectedEventTypes.includes(type)
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                ]"
              >
                {{ type }}
              </button>
            </div>

            <p v-if="eventTypeOptions.length === 0" class="mt-2 text-xs text-gray-400">No event type available.</p>
          </div>
        </div>
      </div>

      <button
        @click="handleSave"
        :disabled="isSaving || isInitializing"
        class="w-full bg-black text-white py-3 rounded-xl font-bold text-lg hover:bg-gray-800 transition-colors disabled:opacity-50 shadow-lg mt-6 mb-24"
      >
        {{ isSaving ? 'Saving...' : 'Save Preferences' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChevronLeft } from 'lucide-vue-next'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useJobsStore } from '~/stores/jobs'

definePageMeta({ middleware: ['auth'] })

const authStore = useAuthStore()
const jobsStore = useJobsStore()

const isInitializing = ref(true)
const isSaving = ref(false)
const options = ['Business', 'Technology', 'Geopolitical']
const selected = ref<string[]>([])
const emailDigest = ref(false)

const jobPrefsEnabled = ref(false)
const jobSelections = ref<{ categories: string[]; locations: string[]; employmentTypes: string[]; companies: string[] }>({
  categories: [],
  locations: [],
  employmentTypes: [],
  companies: []
})

const eventPrefsEnabled = ref(false)
const selectedEventTypes = ref<string[]>([])
const eventTypeOptions = ref<string[]>([])

const filterOptions = ref<{ categories: string[]; locations: string[]; employmentTypes: string[]; companies: { slug: string; name: string }[] }>({
  categories: [],
  locations: [],
  employmentTypes: [],
  companies: []
})

const openGroup = ref<string | null>(null)
const jobAlertsRef = ref<HTMLElement | null>(null)

const groups = computed(() => [
  {
    key: 'categories',
    label: 'Category',
    options: filterOptions.value.categories.map((v) => ({ value: v, label: v }))
  },
  {
    key: 'locations',
    label: 'Location',
    options: filterOptions.value.locations.map((v) => ({ value: v, label: v }))
  },
  {
    key: 'employmentTypes',
    label: 'Employment Type',
    options: filterOptions.value.employmentTypes.map((v) => ({ value: v, label: v }))
  },
  {
    key: 'companies',
    label: 'Companies',
    options: filterOptions.value.companies.map((c) => ({ value: c.slug, label: c.name }))
  }
])

function selectedByGroup(groupKey: string): string[] {
  const key = groupKey as keyof typeof jobSelections.value
  return jobSelections.value[key] || []
}

function toggleOpen(groupKey: string) {
  openGroup.value = openGroup.value === groupKey ? null : groupKey
}

function clearGroup(groupKey: string) {
  const key = groupKey as keyof typeof jobSelections.value
  jobSelections.value[key] = []
}

function toggleGroupValue(groupKey: string, value: string) {
  const key = groupKey as keyof typeof jobSelections.value
  const arr = jobSelections.value[key]
  const idx = arr.indexOf(value)
  if (idx === -1) arr.push(value)
  else arr.splice(idx, 1)
}

function handleOutsideClick(event: MouseEvent) {
  if (!openGroup.value) return
  const target = event.target as Node
  if (jobAlertsRef.value && !jobAlertsRef.value.contains(target)) {
    openGroup.value = null
  }
}

function toggleEventType(type: string) {
  const idx = selectedEventTypes.value.indexOf(type)
  if (idx === -1) selectedEventTypes.value.push(type)
  else selectedEventTypes.value.splice(idx, 1)
}

async function loadFilterOptions() {
  const fallbackCategories = ['AI/ML', 'IT', 'Engineer', 'Finance', 'Operations', 'HR', 'Technician', 'Sales', 'General', 'Others']

  try {
    const response = await ($fetch as any)('/api/job-filter-options') as {
      categories?: string[]
      locations?: string[]
      employmentTypes?: string[]
      companies?: { slug: string; name: string }[]
    }

    let locations = response.locations || []
    let employmentTypes = response.employmentTypes || []
    let companies = response.companies || []

    // Fallback to store fetch if endpoint returns sparse data.
    if (locations.length === 0 || employmentTypes.length === 0 || companies.length === 0) {
      await jobsStore.fetchFilterOptions()
      if (locations.length === 0) locations = [...jobsStore.availableLocations]
      if (employmentTypes.length === 0) employmentTypes = [...jobsStore.availableEmploymentTypes]
      if (companies.length === 0) {
        companies = jobsStore.availableCompanies.map((c: any) => ({ slug: c.slug, name: c.name }))
      }
    }

    const saved = (authStore.profile as any).job_subscription_preferences || {}
    const savedLocations = Array.isArray(saved.locations) ? saved.locations : []
    const savedEmploymentTypes = Array.isArray(saved.employmentTypes) ? saved.employmentTypes : []
    const savedCompanies = Array.isArray(saved.companies) ? saved.companies : []

    filterOptions.value.categories = response.categories?.length ? response.categories : fallbackCategories
    filterOptions.value.locations = [...new Set([...locations, ...savedLocations])].sort()
    filterOptions.value.employmentTypes = [...new Set([...employmentTypes, ...savedEmploymentTypes])].sort()
    filterOptions.value.companies = [
      ...companies,
      ...savedCompanies
        .filter((slug: string) => !companies.some((c: { slug: string }) => c.slug === slug))
        .map((slug: string) => ({ slug, name: slug }))
    ]
  } catch (e) {
    console.error('Failed to load filter options:', e)
    const saved = (authStore.profile as any).job_subscription_preferences || {}
    const savedLocations = Array.isArray(saved.locations) ? saved.locations : []
    const savedEmploymentTypes = Array.isArray(saved.employmentTypes) ? saved.employmentTypes : []
    const savedCompanies = Array.isArray(saved.companies) ? saved.companies : []

    filterOptions.value.categories = fallbackCategories
    filterOptions.value.locations = [...savedLocations]
    filterOptions.value.employmentTypes = [...savedEmploymentTypes]
    filterOptions.value.companies = savedCompanies.map((slug: string) => ({ slug, name: slug }))
  }
}

async function loadEventTypeOptions() {
  const normalizeStringArray = (value: unknown): string[] =>
    Array.isArray(value)
      ? value.filter((v): v is string => typeof v === 'string')
      : []

  try {
    const { eventTypes: fetchedTypes } = await $fetch<{ eventTypes: string[] }>('/api/event-types')

    const saved = (authStore.profile as any).event_alert_preferences
    const savedTypes = Array.isArray(saved)
      ? normalizeStringArray(saved)
      : normalizeStringArray(saved?.eventTypes)

    eventTypeOptions.value = [...new Set([...fetchedTypes, ...savedTypes])].sort((a, b) => a.localeCompare(b))
  } catch (e) {
    console.error('Failed to load event types:', e)
    const saved = (authStore.profile as any).event_alert_preferences
    const savedTypes = Array.isArray(saved)
      ? normalizeStringArray(saved)
      : normalizeStringArray(saved?.eventTypes)
    eventTypeOptions.value = [...new Set(savedTypes)].sort((a, b) => a.localeCompare(b))
  }
}

onMounted(async () => {
  document.addEventListener('click', handleOutsideClick)
  try {
    if (!authStore.isProfileLoaded && typeof authStore.fetchProfile === 'function') {
      await authStore.fetchProfile()
    }

    await loadFilterOptions()
    await loadEventTypeOptions()

    const prefs = authStore.profile.content_preferences
    selected.value = Array.isArray(prefs) && prefs.length > 0 ? [...prefs] : [...options]
    emailDigest.value = !!authStore.profile.marketing_opt_in

    const job = (authStore.profile as any).job_subscription_preferences
    if (job) {
      jobPrefsEnabled.value = true
      jobSelections.value = {
        categories: [...(job.categories || [])],
        locations: [...(job.locations || [])],
        employmentTypes: [...(job.employmentTypes || [])],
        companies: [...(job.companies || [])]
      }
    }

    const eventPrefs = (authStore.profile as any).event_alert_preferences
    if (eventPrefs) {
      eventPrefsEnabled.value = true
      selectedEventTypes.value = Array.isArray(eventPrefs)
        ? [...eventPrefs]
        : [...(eventPrefs.eventTypes || [])]
    }
  } catch (e) {
    console.error('Error loading preferences:', e)
  } finally {
    isInitializing.value = false
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick)
})

watch(
  () => authStore.profile,
  (newProfile: any) => {
    if (Array.isArray(newProfile.content_preferences)) {
      selected.value = [...newProfile.content_preferences]
    }
    emailDigest.value = !!newProfile.marketing_opt_in

    const eventPrefs = newProfile.event_alert_preferences
    if (eventPrefs) {
      eventPrefsEnabled.value = true
      selectedEventTypes.value = Array.isArray(eventPrefs)
        ? [...eventPrefs]
        : [...(eventPrefs.eventTypes || [])]
    }
  },
  { immediate: true, deep: true }
)

const handleSave = async () => {
  isSaving.value = true
  try {
    await authStore.updateProfile({
      content_preferences: selected.value,
      marketing_opt_in: emailDigest.value,
      job_subscription_preferences: jobPrefsEnabled.value ? { ...jobSelections.value } : null,
      event_alert_preferences: eventPrefsEnabled.value ? { eventTypes: [...selectedEventTypes.value] } : null
    })

    navigateTo('/profile')
  } catch (e) {
    console.error('Failed to save preferences:', e)
  } finally {
    isSaving.value = false
  }
}
</script>

