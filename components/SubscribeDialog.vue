<template>
  <Transition name="fade">
    <div v-if="modelValue" class="fixed inset-0 z-[70] flex items-center justify-center px-4">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="handleClose"></div>
      
      <!-- Modal -->
      <div ref="containerRef" class="relative bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in duration-300">
        <button @click="handleClose" class="absolute top-4 right-4 p-2 text-gray-400 hover:text-black">
          <X class="w-6 h-6" />
        </button>

        <h2 class="text-2xl font-bold mb-2">{{ modalTitle }}</h2>
        <p class="text-sm text-gray-500 mb-6">{{ modalDescription }}</p>

        <div
          v-if="!success && isExistingSubscription"
          class="mb-5 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-xs font-medium text-green-700"
        >
          Your saved preferences are shown below. You can update them at any time.
        </div>

        <div v-if="!success && props.allowTypeSelection" class="mb-5">
          <label class="block text-xs font-bold text-gray-400 uppercase mb-3 ml-1">Subscription</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="type in props.availableSubscriptionTypes"
              :key="type"
              type="button"
              @click="selectSubscriptionType(type)"
              :class="[
                'px-3 py-1.5 rounded-full text-xs font-bold transition-colors border',
                currentSubscriptionType === type
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              ]"
            >
              {{ subscriptionTypeMeta[type].label }}
              <span v-if="subscriptionTypeMeta[type].comingSoon" class="ml-1 text-[10px] opacity-80">(Coming soon)</span>
            </button>
          </div>
        </div>

        <form @submit.prevent="handleSubscribe" class="flex flex-col gap-5">
          <div v-if="!success && !isStockSubscription">
            <label class="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Email Address</label>
            <input 
              v-model="email" 
              type="email" 
              required 
              :readonly="!!authStore.user?.email"
              placeholder="your@email.com"
              :class="[
                'w-full px-4 py-3 rounded-xl bg-gray-100 border-none focus:ring-2 focus:ring-black outline-none',
                authStore.user?.email ? 'text-gray-500 cursor-not-allowed' : ''
              ]"
            />
          </div>

          <div v-if="!success && isNewsSubscription" class="space-y-4">
            <div v-for="group in newsFilterGroups" :key="group.key">
              <label class="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">{{ group.label }}</label>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="option in group.options"
                  :key="option.value"
                  type="button"
                  @click="toggleNewsFilter(group.key, option.value)"
                  :class="['px-3 py-1.5 rounded-full text-xs font-bold border transition-colors', group.selected.includes(option.value) ? 'bg-[#e2f855] text-black border-[#e2f855]' : 'bg-gray-100 text-gray-500 border-gray-100 hover:border-gray-300']"
                >
                  {{ option.label }}
                </button>
              </div>
            </div>
          </div>

          <div v-if="!success && isEventSubscription" class="space-y-4">
            <div class="relative" :ref="(el: any) => setGroupRef('eventTypes', el)">
              <label class="block text-xs font-bold text-gray-400 uppercase mb-3 ml-1">Event Type</label>
              <button type="button" @click.prevent="togglePanel('eventTypes')" class="w-full text-left rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
                <span v-if="selectedEventTypes.length === 0" class="text-gray-500">Select event types</span>
                <span v-else class="truncate">{{ selectedEventTypes.join(', ') }}</span>
              </button>
              <div v-show="openGroup === 'eventTypes'" class="absolute z-50 mt-2 w-full max-h-48 overflow-auto bg-white border border-gray-200 rounded-lg p-2 shadow-lg">
                <label
                  v-for="eventType in props.filterOptions.eventTypes"
                  :key="eventType"
                  class="flex items-center gap-2 px-2 py-1"
                >
                  <input type="checkbox" :checked="selectedEventTypes.includes(eventType)" @change="() => toggleFilterValue('eventTypes', eventType)" />
                  <span class="text-sm">{{ eventType }}</span>
                </label>
                <p v-if="props.filterOptions.eventTypes.length === 0" class="px-2 py-1 text-xs text-gray-400">No event types yet</p>
              </div>
            </div>
          </div>

          <div v-if="!success && isStockSubscription" class="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
            Markets subscription is coming soon. You can subscribe to News, Jobs, or Events today.
          </div>

          <div v-if="!success && isJobSubscription" class="space-y-4">
            <div class="relative" :ref="(el: any) => setGroupRef('categories', el)">
              <label class="block text-xs font-bold text-gray-400 uppercase mb-3 ml-1">Category</label>
              <button type="button" @click.prevent="togglePanel('categories')" class="w-full text-left rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
                <span v-if="selectedCategories.length === 0" class="text-gray-500">All</span>
                <span v-else class="truncate">{{ selectedCategories.join(', ') }}</span>
              </button>
              <div v-show="openGroup === 'categories'" class="absolute z-50 mt-2 w-full max-h-48 overflow-auto bg-white border border-gray-200 rounded-lg p-2 shadow-lg">
                <label class="flex items-center gap-2 px-2 py-1">
                  <input type="checkbox" :checked="selectedCategories.length === 0" @change="() => toggleFilterValue('categories', ALL_OPTION)" />
                  <span class="text-sm">All</span>
                </label>
                <label v-for="category in props.filterOptions.categories" :key="category" class="flex items-center gap-2 px-2 py-1">
                  <input type="checkbox" :checked="selectedCategories.includes(category)" @change="() => toggleFilterValue('categories', category)" />
                  <span class="text-sm">{{ category }}</span>
                </label>
              </div>
            </div>

            <div class="relative" :ref="(el: any) => setGroupRef('locations', el)">
              <label class="block text-xs font-bold text-gray-400 uppercase mb-3 ml-1">Location</label>
              <button type="button" @click.prevent="togglePanel('locations')" class="w-full text-left rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
                <span v-if="selectedLocations.length === 0" class="text-gray-500">All</span>
                <span v-else class="truncate">{{ selectedLocations.join(', ') }}</span>
              </button>
              <div v-show="openGroup === 'locations'" class="absolute z-50 mt-2 w-full max-h-48 overflow-auto bg-white border border-gray-200 rounded-lg p-2 shadow-lg">
                <label class="flex items-center gap-2 px-2 py-1">
                  <input type="checkbox" :checked="selectedLocations.length === 0" @change="() => toggleFilterValue('locations', ALL_OPTION)" />
                  <span class="text-sm">All</span>
                </label>
                <label v-for="location in props.filterOptions.locations" :key="location" class="flex items-center gap-2 px-2 py-1">
                  <input type="checkbox" :checked="selectedLocations.includes(location)" @change="() => toggleFilterValue('locations', location)" />
                  <span class="text-sm">{{ location }}</span>
                </label>
              </div>
            </div>

            <div class="relative" :ref="(el: any) => setGroupRef('employmentTypes', el)">
              <label class="block text-xs font-bold text-gray-400 uppercase mb-3 ml-1">Employment Type</label>
              <button type="button" @click.prevent="togglePanel('employmentTypes')" class="w-full text-left rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
                <span v-if="selectedEmploymentTypes.length === 0" class="text-gray-500">All</span>
                <span v-else class="truncate">{{ selectedEmploymentTypes.join(', ') }}</span>
              </button>
              <div v-show="openGroup === 'employmentTypes'" class="absolute z-50 mt-2 w-full max-h-48 overflow-auto bg-white border border-gray-200 rounded-lg p-2 shadow-lg">
                <label class="flex items-center gap-2 px-2 py-1">
                  <input type="checkbox" :checked="selectedEmploymentTypes.length === 0" @change="() => toggleFilterValue('employmentTypes', ALL_OPTION)" />
                  <span class="text-sm">All</span>
                </label>
                <label v-for="employmentType in props.filterOptions.employmentTypes" :key="employmentType" class="flex items-center gap-2 px-2 py-1">
                  <input type="checkbox" :checked="selectedEmploymentTypes.includes(employmentType)" @change="() => toggleFilterValue('employmentTypes', employmentType)" />
                  <span class="text-sm">{{ employmentType }}</span>
                </label>
              </div>
            </div>

            <div class="relative" :ref="(el: any) => setGroupRef('companies', el)">
              <label class="block text-xs font-bold text-gray-400 uppercase mb-3 ml-1">Companies</label>
              <button type="button" @click.prevent="togglePanel('companies')" class="w-full text-left rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
                <span v-if="selectedCompanies.length === 0" class="text-gray-500">All</span>
                <span v-else class="truncate">{{ selectedCompanies.join(', ') }}</span>
              </button>
              <div v-show="openGroup === 'companies'" class="absolute z-50 mt-2 w-full max-h-48 overflow-auto bg-white border border-gray-200 rounded-lg p-2 shadow-lg">
                <label class="flex items-center gap-2 px-2 py-1">
                  <input type="checkbox" :checked="selectedCompanies.length === 0" @change="() => toggleFilterValue('companies', ALL_OPTION)" />
                  <span class="text-sm">All</span>
                </label>
                <label v-for="company in props.filterOptions.companies" :key="company.slug" class="flex items-center gap-2 px-2 py-1">
                  <input type="checkbox" :checked="selectedCompanies.includes(company.slug)" @change="() => toggleFilterValue('companies', company.slug)" />
                  <span class="text-sm">{{ company.name }}</span>
                </label>
              </div>
            </div>
          </div>

          <p v-if="error" class="text-red-500 text-xs text-center">{{ error }}</p>
          <div v-if="success" class="text-green-600 text-sm text-center font-medium leading-relaxed py-4">
            {{ successMessage }}
          </div>

          <button 
            v-if="!success"
            type="submit" 
            :disabled="loading || loadingPreferences || !canSubmit"
            class="w-full bg-black text-white py-3 rounded-full font-bold hover:bg-gray-800 transition-colors disabled:opacity-50 shadow-lg mt-2 cursor-pointer"
          >
            {{ submitButtonLabel }}
          </button>

          <button 
            v-else
            type="button"
            @click="handleClose"
            class="w-full bg-black text-white py-3 rounded-full font-bold hover:bg-gray-800 transition-colors shadow-lg mt-2 cursor-pointer"
          >
            Close
          </button>
        </form>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { X } from 'lucide-vue-next'
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '~/stores/auth'

const props = withDefaults(defineProps<{
  modelValue: boolean
  subscriptionType?: 'news' | 'job' | 'event' | 'stock',
  allowTypeSelection?: boolean,
  availableSubscriptionTypes?: Array<'news' | 'job' | 'event' | 'stock'>,
  filterOptions?: {
    categories: string[]
    locations: string[]
    employmentTypes: string[]
    companies: { slug: string; name: string }[]
    eventTypes: string[]
  }
  selectedFilters?: {
    categories: string[]
    locations: string[]
    employmentTypes: string[]
    companies: string[]
    eventTypes: string[]
  }
}>(), {
  subscriptionType: 'news',
  allowTypeSelection: false,
  availableSubscriptionTypes: () => ['news', 'job', 'event', 'stock'],
  filterOptions: () => ({ categories: [], locations: [], employmentTypes: [], companies: [], eventTypes: [] }),
  selectedFilters: () => ({ categories: [], locations: [], employmentTypes: [], companies: [], eventTypes: [] })
})
const emit = defineEmits(['update:modelValue', 'subscribed'])

const authStore = useAuthStore()
const email = ref('')
const ALL_OPTION = 'ALL'
const availableNewsCategories = ['Business', 'Technology', 'Geopolitical']
const availableNewsValueChains = ['upstream', 'midstream', 'downstream']
const availableNewsEnergyTopics = ['oil', 'natural_gas', 'lng', 'renewables', 'hydrogen', 'carbon', 'nuclear']
const selectedNewsCategories = ref([...availableNewsCategories])
const selectedNewsValueChains = ref([...availableNewsValueChains])
const selectedNewsEnergyTopics = ref([...availableNewsEnergyTopics])
const currentSubscriptionType = ref<'news' | 'job' | 'event' | 'stock'>(props.subscriptionType)
const selectedCategories = ref<string[]>([...(props.selectedFilters.categories || [])])
const selectedLocations = ref<string[]>([...(props.selectedFilters.locations || [])])
const selectedEmploymentTypes = ref<string[]>([...(props.selectedFilters.employmentTypes || [])])
const selectedCompanies = ref<string[]>([...(props.selectedFilters.companies || [])])
const selectedEventTypes = ref<string[]>([...(props.selectedFilters.eventTypes || [])])
const loading = ref(false)
const loadingPreferences = ref(false)
const success = ref(false)
const error = ref('')

const subscriptionTypeMeta: Record<'news' | 'job' | 'event' | 'stock', { label: string, comingSoon?: boolean }> = {
  news: { label: 'News' },
  job: { label: 'Jobs' },
  event: { label: 'Events' },
  stock: { label: 'Markets', comingSoon: true }
}

watch(
  () => props.selectedFilters,
  (filters) => {
    if (props.modelValue && authStore.user) return
    selectedCategories.value = [...filters.categories]
    selectedLocations.value = [...filters.locations]
    selectedEmploymentTypes.value = [...filters.employmentTypes]
    selectedCompanies.value = [...filters.companies]
    selectedEventTypes.value = [...(filters.eventTypes || [])]
  },
  { deep: true, immediate: true }
)

watch(
  () => props.subscriptionType,
  (type) => {
    currentSubscriptionType.value = type
  },
  { immediate: true }
)

// Dropdown panels for checkboxes
const openGroup = ref<string | null>(null)
const containerRef = ref<HTMLElement | null>(null)
const groupRefs = ref<Record<string, HTMLElement | null>>({})

function setGroupRef(group: string, el: Element | null) {
  groupRefs.value[group] = el as HTMLElement | null
}

function togglePanel(group: string) {
  openGroup.value = openGroup.value === group ? null : group
}

function handleDocClick(e: MouseEvent) {
  const target = e.target as Node

  if (openGroup.value) {
    const activeGroupEl = groupRefs.value[openGroup.value]
    if (activeGroupEl && !activeGroupEl.contains(target)) {
      openGroup.value = null
      return
    }
  }

  if (containerRef.value && !containerRef.value.contains(target)) {
    openGroup.value = null
  }
}

onMounted(() => document.addEventListener('click', handleDocClick))
onUnmounted(() => document.removeEventListener('click', handleDocClick))

const isJobSubscription = computed(() => currentSubscriptionType.value === 'job')
const isNewsSubscription = computed(() => currentSubscriptionType.value === 'news')
const isEventSubscription = computed(() => currentSubscriptionType.value === 'event')
const isStockSubscription = computed(() => currentSubscriptionType.value === 'stock')

const labelizeNewsValue = (value: string) => value === 'lng'
  ? 'LNG'
  : value.replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase())

const newsFilterGroups = computed(() => [
  {
    key: 'category',
    label: 'News Category',
    options: availableNewsCategories.map(value => ({ value, label: value })),
    selected: selectedNewsCategories.value
  },
  {
    key: 'value_chain',
    label: 'Value Chain',
    options: availableNewsValueChains.map(value => ({ value, label: labelizeNewsValue(value) })),
    selected: selectedNewsValueChains.value
  },
  {
    key: 'energy_topic',
    label: 'Energy Topic',
    options: availableNewsEnergyTopics.map(value => ({ value, label: labelizeNewsValue(value) })),
    selected: selectedNewsEnergyTopics.value
  }
])

const modalTitle = computed(() => {
  if (isJobSubscription.value) return 'Job Alerts'
  if (isEventSubscription.value) return 'Event Alerts'
  if (isStockSubscription.value) return 'Markets Alerts'
  return 'Daily Digest'
})

const modalDescription = computed(() => {
  if (isJobSubscription.value) return 'Stay updated when matching jobs arrive in your inbox.'
  if (isEventSubscription.value) return 'Get notified about events based on your selected event types.'
  if (isStockSubscription.value) return 'Markets alerts are coming soon. Stay tuned.'
  return 'Stay updated with the latest petroleum news delivered to your inbox.'
})

const canSubmit = computed(() => {
  if (isStockSubscription.value) return false
  if (isNewsSubscription.value) {
    return selectedNewsCategories.value.length > 0 &&
      selectedNewsValueChains.value.length > 0 &&
      selectedNewsEnergyTopics.value.length > 0
  }
  if (isEventSubscription.value && props.filterOptions.eventTypes.length > 0) {
    return selectedEventTypes.value.length > 0
  }
  return true
})

const isExistingSubscription = computed(() => {
  if (!authStore.user) return false
  if (isJobSubscription.value) return authStore.profile.job_subscription_preferences != null
  if (isEventSubscription.value) return authStore.profile.event_alert_preferences != null
  if (isNewsSubscription.value) {
    return authStore.profile.marketing_opt_in && Array.isArray(authStore.profile.content_preferences)
  }
  return false
})

const submitButtonLabel = computed(() => {
  if (isStockSubscription.value) return 'Coming Soon'
  if (loadingPreferences.value) return 'Loading preferences...'
  if (loading.value) return isExistingSubscription.value ? 'Updating...' : 'Sending...'
  return isExistingSubscription.value ? 'Update Preferences' : 'Subscribe'
})

const successMessage = computed(() => authStore.user
  ? 'Your subscription preferences have been saved.'
  : 'Subscription confirmed! New users, please check your email to finalize registration.'
)

function resetSelectionsFromProps() {
  selectedNewsCategories.value = [...availableNewsCategories]
  selectedNewsValueChains.value = [...availableNewsValueChains]
  selectedNewsEnergyTopics.value = [...availableNewsEnergyTopics]
  selectedCategories.value = [...props.selectedFilters.categories]
  selectedLocations.value = [...props.selectedFilters.locations]
  selectedEmploymentTypes.value = [...props.selectedFilters.employmentTypes]
  selectedCompanies.value = [...props.selectedFilters.companies]
  selectedEventTypes.value = [...(props.selectedFilters.eventTypes || [])]
}

function applyProfilePreferences() {
  if (!authStore.user) return

  email.value = authStore.user.email || ''

  const savedTopics = authStore.profile.content_preferences
  if (Array.isArray(savedTopics) && savedTopics.length > 0) {
    const savedCategories = availableNewsCategories.filter(value => savedTopics.includes(value))
    const savedValueChains = availableNewsValueChains.filter(value => savedTopics.includes(`value_chain:${value}`))
    const savedEnergyTopics = availableNewsEnergyTopics.filter(value => savedTopics.includes(`energy_topic:${value}`))

    if (savedCategories.length > 0) selectedNewsCategories.value = savedCategories
    if (savedValueChains.length > 0) selectedNewsValueChains.value = savedValueChains
    if (savedEnergyTopics.length > 0) selectedNewsEnergyTopics.value = savedEnergyTopics
  }

  const jobPreferences = authStore.profile.job_subscription_preferences
  if (jobPreferences && !Array.isArray(jobPreferences)) {
    selectedCategories.value = [...(jobPreferences.categories || [])]
    selectedLocations.value = [...(jobPreferences.locations || [])]
    selectedEmploymentTypes.value = [...(jobPreferences.employmentTypes || [])]
    selectedCompanies.value = [...(jobPreferences.companies || [])]
  }

  const eventPreferences = authStore.profile.event_alert_preferences
  if (eventPreferences && !Array.isArray(eventPreferences)) {
    selectedEventTypes.value = [...(eventPreferences.eventTypes || [])]
  }
}

async function initializeDialog() {
  success.value = false
  error.value = ''
  openGroup.value = null
  currentSubscriptionType.value = props.subscriptionType
  resetSelectionsFromProps()

  if (!authStore.user) {
    email.value = ''
    return
  }

  applyProfilePreferences()
  loadingPreferences.value = true
  try {
    await authStore.fetchProfile()
    applyProfilePreferences()
  } finally {
    loadingPreferences.value = false
  }
}

watch(
  () => props.modelValue,
  async (isOpen) => {
    if (!isOpen) return
    await initializeDialog()
  },
  { immediate: true }
)

function selectSubscriptionType(type: 'news' | 'job' | 'event' | 'stock') {
  currentSubscriptionType.value = type
  error.value = ''
}

function toggleNewsFilter(groupKey: string, value: string) {
  const selections: Record<string, string[]> = {
    category: selectedNewsCategories.value,
    value_chain: selectedNewsValueChains.value,
    energy_topic: selectedNewsEnergyTopics.value
  }
  const selected = selections[groupKey]
  const index = selected.indexOf(value)
  if (index === -1) selected.push(value)
  else if (selected.length > 1) selected.splice(index, 1)
}

function serializedNewsPreferences() {
  return [
    ...selectedNewsCategories.value,
    ...selectedNewsValueChains.value.map(value => `value_chain:${value}`),
    ...selectedNewsEnergyTopics.value.map(value => `energy_topic:${value}`)
  ]
}

function toggleFilterValue(group: 'categories' | 'locations' | 'employmentTypes' | 'companies' | 'eventTypes', value: string) {
  const map: Record<'categories' | 'locations' | 'employmentTypes' | 'companies' | 'eventTypes', string[]> = {
    categories: selectedCategories.value,
    locations: selectedLocations.value,
    employmentTypes: selectedEmploymentTypes.value,
    companies: selectedCompanies.value,
    eventTypes: selectedEventTypes.value
  }

  const arr = map[group]
  if (value === ALL_OPTION) {
    arr.splice(0, arr.length)
    return
  }

  const idx = arr.indexOf(value)
  if (idx === -1) arr.push(value)
  else arr.splice(idx, 1)
}

function handleSelectChange(event: Event, group: 'categories' | 'locations' | 'employmentTypes' | 'companies') {
  const target = event.target as HTMLSelectElement
  const values = Array.from(target.selectedOptions).map(option => option.value)

  if (values.includes(ALL_OPTION)) {
    if (group === 'categories') selectedCategories.value = []
    if (group === 'locations') selectedLocations.value = []
    if (group === 'employmentTypes') selectedEmploymentTypes.value = []
    if (group === 'companies') selectedCompanies.value = []
    return
  }

  if (group === 'categories') selectedCategories.value = values
  if (group === 'locations') selectedLocations.value = values
  if (group === 'employmentTypes') selectedEmploymentTypes.value = values
  if (group === 'companies') selectedCompanies.value = values
}

const handleSubscribe = async () => {
  if (!authStore.validateEmail(email.value)) {
    error.value = 'Please enter a valid email address.'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const payload: any = {
      email: email.value,
        subscriptionType: currentSubscriptionType.value
    }

    if (isJobSubscription.value) {
      payload.filters = {
        categories: selectedCategories.value,
        locations: selectedLocations.value,
        employmentTypes: selectedEmploymentTypes.value,
        companies: selectedCompanies.value
      }
      } else if (isEventSubscription.value) {
        payload.eventTypes = selectedEventTypes.value
    } else {
      payload.topics = serializedNewsPreferences()
    }

    const response = await $fetch('/api/invite', {
      method: 'POST',
      body: payload
    })
    
    if (response.success) {
      if (authStore.user?.email?.toLowerCase() === email.value.trim().toLowerCase()) {
        let profileUpdates: Record<string, any> = { marketing_opt_in: true }

        if (isJobSubscription.value) {
          profileUpdates.job_subscription_preferences = {
              categories: [...selectedCategories.value],
              locations: [...selectedLocations.value],
              employmentTypes: [...selectedEmploymentTypes.value],
              companies: [...selectedCompanies.value]
          }
        } else if (isEventSubscription.value) {
          profileUpdates.event_alert_preferences = {
            eventTypes: [...selectedEventTypes.value]
          }
        } else if (isNewsSubscription.value) {
          profileUpdates.content_preferences = serializedNewsPreferences()
        }

        const updated = await authStore.updateProfile(profileUpdates)
        if (!updated) {
          throw new Error(authStore.error || 'Failed to update your saved preferences.')
        }
      }

      success.value = true
    }
  } catch (e: any) {
    error.value = e.statusMessage || e.message || 'Failed to save your subscription. Please try again.'
  } finally {
    loading.value = false
  }
}

const handleClose = () => {
  emit('update:modelValue', false)
  if (success.value) {
    emit('subscribed')
  }

  setTimeout(() => {
    success.value = false
    email.value = ''
    error.value = ''
    currentSubscriptionType.value = props.subscriptionType
    resetSelectionsFromProps()
  }, 300)
}
</script>
