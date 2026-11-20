import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useJobsStore = defineStore('jobs', () => {
    const jobItems = ref<any[]>([])
    const currentOffset = ref(0)
    const hasMore = ref(true)
    const isLoading = ref(false)
    const error = ref<string | null>(null)

    const selectedCategories = ref<string[]>([])
    const selectedLocations = ref<string[]>([])
    const selectedEmploymentTypes = ref<string[]>([])
    const selectedCompanies = ref<string[]>([])
    const searchQuery = ref('')

    const availableLocations = ref<string[]>([])
    const availableEmploymentTypes = ref<string[]>([])
    const availableCompanies = ref<{ slug: string; name: string; logo_url: string | null }[]>([])

    const activeTab = ref('For You')
    const selectedTagsByJob = ref<Record<number, string[]>>({})

    function toggleJobTag(jobId: number, tag: string) {
        if (!jobId) return
        const map = selectedTagsByJob.value
        const current = map[jobId] || []
        const idx = current.indexOf(tag)
        if (idx === -1) current.push(tag)
        else current.splice(idx, 1)
        map[jobId] = current
        selectedTagsByJob.value = { ...map }
    }

    function buildQueryParams(limit: number, offset: number, extra: Record<string, string> = {}) {
        const params = new URLSearchParams({
            limit: String(limit),
            offset: String(offset),
            ...extra
        })

        if (searchQuery.value.trim()) params.set('search', searchQuery.value.trim())
        if (selectedCategories.value.length > 0) params.set('categories', selectedCategories.value.join(','))
        if (selectedLocations.value.length > 0) params.set('locations', selectedLocations.value.join(','))
        if (selectedEmploymentTypes.value.length > 0) params.set('employmentTypes', selectedEmploymentTypes.value.join(','))
        if (selectedCompanies.value.length > 0) params.set('companies', selectedCompanies.value.join(','))

        return params
    }

    function mapItem(item: any) {
        return {
            ...item,
            url: item.source_url,
            date: item.posted_date,
            category: item.department || 'General'
        }
    }

    async function fetchFilterOptions() {
        try {
            const data = await $fetch<{
                categories: string[]
                locations: string[]
                employmentTypes: string[]
                companies: { slug: string; name: string; logo_url: string | null }[]
            }>('/api/job-filter-options')

            availableLocations.value = data.locations || []
            availableEmploymentTypes.value = data.employmentTypes || []
            availableCompanies.value = data.companies || []
        } catch (e) {
            console.error('Failed to fetch filter options:', e)
        }
    }

    async function fetchJobsFromId(id: number, limit = 10) {
        isLoading.value = true
        error.value = null

        try {
            const params = buildQueryParams(limit, 0, { fromId: String(id) })
            const { data } = await $fetch<{ data: any[] }>(`/api/jobs?${params}`)

            if (!data || data.length === 0) {
                await fetchJobs(limit)
                return false
            }

            jobItems.value = data.map(mapItem)
            currentOffset.value = limit
            hasMore.value = data.length === limit
            return true
        } catch (e: any) {
            console.error('Failed to fetch jobs from ID:', e)
            await fetchJobs(limit)
            return false
        } finally {
            isLoading.value = false
        }
    }

    async function fetchJobs(limit = 10) {
        if (isLoading.value || !hasMore.value) return

        isLoading.value = true
        error.value = null

        try {
            const params = buildQueryParams(limit, currentOffset.value)
            const { data } = await $fetch<{ data: any[] }>(`/api/jobs?${params}`)

            if (data && data.length > 0) {
                const newItems = data.map(mapItem)
                const uniqueItems = newItems.filter((item: any) =>
                    !jobItems.value.some(existing => existing.id === item.id)
                )

                jobItems.value.push(...uniqueItems)
                currentOffset.value += limit

                if (data.length < limit) hasMore.value = false
            } else {
                hasMore.value = false
            }
        } catch (e: any) {
            console.error('Failed to fetch jobs:', e)
            error.value = e.message || 'Failed to load jobs'
        } finally {
            isLoading.value = false
        }
    }

    async function applyFilters() {
        jobItems.value = []
        currentOffset.value = 0
        hasMore.value = true
        error.value = null
        await fetchJobs()
    }

    return {
        jobItems,
        currentOffset,
        hasMore,
        isLoading,
        error,
        selectedCategories,
        selectedLocations,
        selectedEmploymentTypes,
        selectedCompanies,
        searchQuery,
        availableLocations,
        availableEmploymentTypes,
        availableCompanies,
        activeTab,
        selectedTagsByJob,
        toggleJobTag,
        fetchJobs,
        fetchJobsFromId,
        fetchFilterOptions,
        applyFilters
    }
})
