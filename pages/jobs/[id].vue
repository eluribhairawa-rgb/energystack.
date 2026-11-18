<template>
  <div class="flex flex-col min-h-screen">
    <!-- Top Nav Overlay (Always Visible) -->
    <div class="fixed top-0 left-0 right-0 max-w-6xl mx-auto bg-white flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16 md:h-20 z-50">
      <button @click="handleBack" class="p-2 -ml-2 cursor-pointer">
        <ChevronLeft class="w-6 h-6" />
      </button>

      <div v-if="item" class="flex items-center gap-2">
        <button
          @click="showSubscribeDialog = true"
          class="flex items-center gap-2 bg-black hover:bg-gray-800 text-[#e2f855] px-3 py-1.5 rounded-full transition-colors cursor-pointer"
        >
          <Mail class="w-5 h-5" />
          <span class="text-xs font-semibold">Subscribe</span>
        </button>

        <!-- Share Button -->
        <button @click="handleShare" class="p-1 hover:bg-gray-100 rounded-full transition-colors cursor-pointer relative">
          <Share2 class="w-5 h-5 text-gray-600" />
          <Transition name="fade">
            <span v-if="showCopied" class="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-50">
              Link Copied!
            </span>
          </Transition>
        </button>

        <NuxtLink
          to="/profile"
          class="w-10 h-10 rounded-full border border-gray-200 cursor-pointer block relative"
        >
          <div class="w-full h-full rounded-full overflow-hidden">
            <img
              v-if="authStore.user && authStore.profile?.avatar_url"
              :src="authStore.profile.avatar_url"
              alt="User Avatar"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
              <CircleUserRound class="w-6 h-6" />
            </div>
          </div>
        </NuxtLink>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="flex-grow pt-16 md:pt-20">
      <!-- Loading State -->
      <div v-if="!hasFinishedLoadingJob && !item" class="flex items-center justify-center h-[70vh]">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>

      <!-- Not Found State -->
      <div v-else-if="!item && hasFinishedLoadingJob" class="flex flex-col items-center justify-center h-[70vh] px-4 text-center">
        <div class="bg-gray-100 p-4 rounded-full mb-4">
          <SearchX class="w-12 h-12 text-gray-400" />
        </div>
        <h1 class="text-2xl font-bold mb-2">Job Not Found</h1>
        <p class="text-gray-500 mb-8">The job listing you are looking for doesn't exist or has been removed.</p>
        <button @click="router.push('/jobs')" class="bg-black text-white px-6 py-2.5 rounded-full font-bold">
          Back to Jobs
        </button>
      </div>

      <!-- Content State -->
      <div v-else-if="item" class="flex flex-col animate-in fade-in duration-500 px-4 sm:px-6 lg:px-8">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
            <img v-if="item.logo_url" :src="item.logo_url" class="w-full h-full object-cover" />
            <Briefcase v-else class="w-6 h-6 text-gray-300" />
          </div>
          <div class="flex flex-col">
            <span class="text-sm text-gray-500">{{ companyDisplayName }}</span>
            <h1 class="text-2xl font-bold leading-tight">
              {{ item.title }}
            </h1>
          </div>
        </div>

        <section class="mb-4 text-sm text-gray-500">
          <div v-if="item.location" class="mb-1">{{ item.location }}</div>
          <div v-if="item.posted_date" class="flex items-center gap-1 mb-2">
            <Calendar class="w-4 h-4" />
            <span>Posted {{ formattedPostedDate }}</span>
          </div>
        </section>

        <section class="mb-6">
          <div class="flex flex-wrap gap-2 text-sm text-black-500">
            <span v-if="item.department" class="px-3 py-1 bg-[#e2f855] text-sm font-bold rounded-full">
              {{ item.department }}
            </span>
            <span v-if="item.employment_type" class="px-3 py-1 bg-gray-100 text-sm font-bold rounded-full">
              {{ item.employment_type }}
            </span>
            <span v-if="item.experience_level" class="px-3 py-1 bg-gray-100 text-sm font-bold rounded-full">
              {{ item.experience_level }}
            </span>
          </div>
        </section>

        <!-- Tabs -->
        <div class="flex gap-6 border-b border-gray-100 mb-6 overflow-x-auto no-scrollbar">
          <button
              @click="activeDetailTab = 'Overview'"
              :class="['pb-2 text-sm font-semibold transition-colors relative whitespace-nowrap cursor-pointer', activeDetailTab === 'Overview' ? 'text-black' : 'text-gray-400']"
          >
            Overview
            <div v-if="activeDetailTab === 'Overview'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-black"></div>
          </button>
          <button
              @click="activeDetailTab = 'Details'"
              :class="['pb-2 text-sm font-semibold transition-colors relative whitespace-nowrap cursor-pointer', activeDetailTab === 'Details' ? 'text-black' : 'text-gray-400']"
          >
            Details
            <div v-if="activeDetailTab === 'Details'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-black"></div>
          </button>
          <button
              @click="activeDetailTab = 'Requirements'"
              :class="['pb-2 text-sm font-semibold transition-colors relative whitespace-nowrap cursor-pointer', activeDetailTab === 'Requirements' ? 'text-black' : 'text-gray-400']"
          >
            Requirements
            <div v-if="activeDetailTab === 'Requirements'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-black"></div>
          </button>
          <button
              @click="activeDetailTab = 'Company'"
              :class="['pb-2 text-sm font-semibold transition-colors relative whitespace-nowrap cursor-pointer', activeDetailTab === 'Company' ? 'text-black' : 'text-gray-400']"
          >
            Company
            <div v-if="activeDetailTab === 'Company'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-black"></div>
          </button>
          <button
              @click="activeDetailTab = 'Source'"
              :class="['pb-2 text-sm font-semibold transition-colors relative whitespace-nowrap cursor-pointer', activeDetailTab === 'Source' ? 'text-black' : 'text-gray-400']"
          >
            Apply
            <div v-if="activeDetailTab === 'Source'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-black"></div>
          </button>
        </div>

        <!-- Tab Content -->
        <div class="min-h-[300px]">
          <!-- Overview Content -->
          <div v-if="activeDetailTab === 'Overview'" class="pb-32 animate-in fade-in duration-300">
            <p v-if="item.summary" class="text-base text-gray-800 leading-relaxed mb-6 font-medium">
              {{ item.summary }}
            </p>
          </div>

          <!-- Details Content -->
          <div v-if="activeDetailTab === 'Details'" class="pb-32 animate-in fade-in duration-300">
            <div class="prose prose-base max-w-none text-gray-800 leading-relaxed font-medium" v-html="detailedDescriptionHtml"></div>
          </div>

          <!-- Requirements Content -->
          <div v-if="activeDetailTab === 'Requirements'" class="pb-32 animate-in fade-in duration-300">
            <div v-if="item.requirements && Array.isArray(item.requirements) && item.requirements.length > 0">
              <ul class="space-y-4">
                <li v-for="(point, index) in item.requirements" :key="index" class="flex items-start gap-3 text-base text-gray-800 leading-relaxed font-medium">
                  <span class="text-black font-bold flex-shrink-0 select-none" style="margin-top: 0.1em">•</span>
                  <span>{{ point }}</span>
                </li>
              </ul>
            </div>

            <div v-else class="py-12 text-center text-gray-400 italic text-sm">
              Detailed requirements are not available for this job.
            </div>
          </div>

          <!-- Company Content -->
          <div v-if="activeDetailTab === 'Company'" class="pb-32 animate-in fade-in duration-300">
            <div v-if="companyProfile || companyRecord" class="space-y-6">
              <section class="flex items-start gap-4">
                <div class="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
                  <img v-if="companyLogo" :src="companyLogo" :alt="companyDisplayName" class="w-full h-full object-cover" />
                  <Building2 v-else class="w-7 h-7 text-gray-300" />
                </div>
                <div class="min-w-0">
                  <h2 class="text-xl font-bold leading-tight">{{ companyDisplayName }}</h2>
                  <p v-if="companyProfile?.headline" class="text-sm text-gray-500 leading-relaxed mt-1">
                    {{ companyProfile.headline }}
                  </p>
                </div>
              </section>

              <section v-if="companyProfile?.description">
                <h3 class="text-sm font-bold mb-2">About</h3>
                <p class="text-base text-gray-800 leading-relaxed font-medium">
                  {{ companyProfile.description }}
                </p>
              </section>

              <section v-if="companyFacts.length" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  v-for="fact in companyFacts"
                  :key="fact.label"
                  class="border border-gray-100 rounded-lg px-4 py-3"
                >
                  <span class="block text-[11px] font-bold text-gray-400 uppercase tracking-wide">{{ fact.label }}</span>
                  <span class="block text-sm font-semibold text-gray-900 mt-1">{{ fact.value }}</span>
                </div>
              </section>

              <section v-if="companyProfile?.specialties?.length">
                <h3 class="text-sm font-bold mb-3">Specialties</h3>
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="specialty in companyProfile.specialties"
                    :key="specialty"
                    class="px-3 py-1 bg-[#e2f855] text-xs font-bold rounded-full"
                  >
                    {{ specialty }}
                  </span>
                </div>
              </section>

              <section v-if="companyProfile?.benefits?.length">
                <h3 class="text-sm font-bold mb-3">Highlights</h3>
                <ul class="space-y-3">
                  <li
                    v-for="benefit in companyProfile.benefits"
                    :key="benefit"
                    class="flex items-start gap-3 text-sm text-gray-800 leading-relaxed font-medium"
                  >
                    <span class="w-1.5 h-1.5 rounded-full bg-black flex-shrink-0 mt-2"></span>
                    <span>{{ benefit }}</span>
                  </li>
                </ul>
              </section>

              <section v-if="companyProfile?.culture || companyProfile?.why_work_here" class="space-y-5">
                <div v-if="companyProfile?.culture">
                  <h3 class="text-sm font-bold mb-2">Culture</h3>
                  <p class="text-base text-gray-800 leading-relaxed font-medium">{{ companyProfile.culture }}</p>
                </div>
                <div v-if="companyProfile?.why_work_here">
                  <h3 class="text-sm font-bold mb-2">Why Work Here</h3>
                  <p class="text-base text-gray-800 leading-relaxed font-medium">{{ companyProfile.why_work_here }}</p>
                </div>
              </section>

              <section class="flex flex-wrap gap-3 pt-2">
                <a
                  v-if="companyWebsiteUrl"
                  :href="companyWebsiteUrl"
                  target="_blank"
                  class="inline-flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-full font-bold text-sm cursor-pointer relative z-10 hover:bg-gray-800 transition-colors"
                >
                  Website
                  <ExternalLink class="w-4 h-4" />
                </a>
                <a
                  v-if="companyCareersUrl"
                  :href="companyCareersUrl"
                  target="_blank"
                  class="inline-flex items-center gap-2 border border-gray-200 text-gray-900 px-5 py-2.5 rounded-full font-bold text-sm cursor-pointer relative z-10 hover:bg-gray-50 transition-colors"
                >
                  Careers
                  <ExternalLink class="w-4 h-4" />
                </a>
              </section>
            </div>

            <div v-else class="py-12 text-center text-gray-400 italic text-sm">
              Company information is not available yet.
            </div>
          </div>

          <!-- Apply / Source Content -->
          <div v-if="activeDetailTab === 'Source'" class="pb-32 animate-in fade-in duration-300">
            <p class="text-sm text-gray-500 mb-6">Apply for this position on the original source:</p>

            <a v-if="item.url" :href="item.url" target="_blank" class="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-full font-bold cursor-pointer relative z-10 hover:bg-gray-800 transition-colors">
              Apply Now
              <ExternalLink class="w-4 h-4" />
            </a>

            <div v-if="applyTags.length" class="mt-8">
              <span class="font-bold text-sm block mb-3">Tags</span>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="(tag, index) in applyTags"
                  :key="tag + index"
                  @click="toggleTag(tag)"
                  :aria-pressed="isTagSelected(tag)"
                  :class="[isTagSelected(tag) ? 'bg-black text-white' : 'bg-gray-100 text-gray-600', 'px-3 py-1 text-xs font-medium rounded-full cursor-pointer']"
                >
                  {{ tag }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <SubscribeDialog
      v-model="showSubscribeDialog"
      subscriptionType="job"
      :allowTypeSelection="true"
      :availableSubscriptionTypes="['news', 'job', 'event', 'stock']"
      :filterOptions="subscribeFilterOptions"
      :selectedFilters="selectedJobAndEventFilters"
    />
  </div>
</template>

<script setup lang="ts">
import { ChevronLeft, Share2, SearchX, Briefcase, Calendar, ExternalLink, Mail, CircleUserRound, Building2 } from 'lucide-vue-next';
import SubscribeDialog from '~/components/SubscribeDialog.vue'
import { useAuthStore } from '~/stores/auth'
import { useJobsStore } from '~/stores/jobs';

const route = useRoute();
const router = useRouter();
const requestUrl = useRequestURL();
const jobsStore = useJobsStore();
const authStore = useAuthStore()

const activeDetailTab = ref('Overview');
const showCopied = ref(false);
const showSubscribeDialog = ref(false)
const eventTypes = ref<string[]>([])

const subscribeFilterOptions = computed(() => ({
  categories: ["AI/ML", "IT", "Engineer", "Finance", "Operations", "HR", "Technician", "Sales", "General", "Others"],
  locations: jobsStore.availableLocations,
  employmentTypes: jobsStore.availableEmploymentTypes,
  companies: jobsStore.availableCompanies,
  eventTypes: eventTypes.value
}))

const selectedJobAndEventFilters = computed(() => ({
  categories: jobsStore.selectedCategories,
  locations: jobsStore.selectedLocations,
  employmentTypes: jobsStore.selectedEmploymentTypes,
  companies: jobsStore.selectedCompanies,
  eventTypes: []
}))

onMounted(async () => {
  await jobsStore.fetchFilterOptions()

  try {
    const { eventTypes: fetchedTypes } = await $fetch<{ eventTypes: string[] }>('/api/event-types')
    eventTypes.value = fetchedTypes
  } catch (e) {
    console.error('Failed to load event types for subscription dialog:', e)
  }
})

function toAbsoluteImageUrl(imageUrl?: string | null): string | undefined {
  if (!imageUrl) return undefined;
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
  return new URL(imageUrl, requestUrl.origin).toString();
}

const detailedDescriptionHtml = computed(() => {
  const raw = item?.value?.detailed_description;
  if (!raw) return '';
  // If it already looks like HTML, return as-is
  if (/<[a-z][\s\S]*>/i.test(raw)) return raw;

  const lines = raw.split(/\r?\n/);
  let html = '';
  let listType: null | 'ul' | 'ol' = null;

  for (let rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      if (listType) { html += `</${listType}>`; listType = null; }
      continue;
    }

    let m;
    if (m = line.match(/^[-*]\s+(.*)/)) {
      if (listType !== 'ul') { if (listType) html += `</${listType}>`; html += '<ul class="list-disc pl-6 space-y-2">'; listType = 'ul'; }
      html += `<li>${m[1]}</li>`;
    } else if (m = line.match(/^\d+\.\s+(.*)/)) {
      if (listType !== 'ol') { if (listType) html += `</${listType}>`; html += '<ol class="list-decimal pl-6 space-y-2">'; listType = 'ol'; }
      html += `<li>${m[1]}</li>`;
    } else {
      if (listType) { html += `</${listType}>`; listType = null; }
      html += `<p>${line}</p>`;
    }
  }

  if (listType) html += `</${listType}>`;
  return html;
});

const formattedPostedDate = computed(() => {
  const raw = item?.value?.posted_date ?? item?.value?.date;
  if (!raw) return '';
  if (typeof raw === 'string') {
    const tIdx = raw.indexOf('T');
    if (tIdx !== -1) return raw.slice(0, tIdx);
    const parsed = new Date(raw);
    if (!isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
    return raw;
  }
  const parsed = new Date(raw);
  if (!isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return String(raw);
});

// Derive tags from possible fields: skill_tags, skills, or tags. Prioritize first element ordering.
const applyTags = computed<string[]>(() => {
  const raw = item?.value?.skill_tags ?? item?.value?.skills ?? item?.value?.tags ?? [];
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map(r => {
      if (typeof r === 'string') return r;
      if (typeof r === 'object' && r !== null) return (r.tag || r.name || r.value || '') as string;
      return String(r);
    }).filter(Boolean);
  }
  return [];
});

function isTagSelected(tag: string) {
  const id = item?.value?.id;
  if (!id) return false;
  const map = jobsStore.selectedTagsByJob as Record<number, string[]>;
  const sel = map[id] || [];
  return sel.includes(tag);
}

function toggleTag(tag: string) {
  const id = item?.value?.id;
  if (!id) return;
  jobsStore.toggleJobTag(id, tag);
}

// SERVER-SIDE DATA FETCHING
const jobId = computed(() => {
  const raw = Array.isArray(route.params.id) ? route.params.id[0] : route.params.id
  return decodeURIComponent(String(raw || ''))
})

function getCachedJob() {
  return jobsStore.jobItems.find((job: any) => String(job.id) === jobId.value) || null
}

function normalizeJob(data: any, companyRecord: any = null, companyProfile: any = null) {
  const companyName = companyRecord?.name || data.company_name || data.company_slug || ''
  const companyLogoUrl = companyRecord?.logo_url ?? data.company_logo_url ?? data.logo_url ?? null

  return {
    ...data,
    url: data.source_url || data.url,
    date: data.posted_date || data.date,
    category: data.department || data.category || 'General',
    company_name: companyName,
    company_logo_url: companyLogoUrl,
    company_record: companyRecord || data.company_record || null,
    company_profile: companyProfile || data.company_profile || null
  }
}

const { data: item, status } = await useAsyncData(`job-${jobId.value}`, async () => {
  const cachedJob = getCachedJob()

  let data: any = null
  try {
    const result = await $fetch<{ data: any }>(`/api/jobs?id=${jobId.value}`)
    data = result.data
  } catch (e: any) {
    console.error('Failed to fetch job detail:', e.message)
    return cachedJob ? normalizeJob(cachedJob) : null;
  }

  if (!data) return cachedJob ? normalizeJob(cachedJob) : null;

  let companyRecord = null
  let companyProfile = null

  try {
    if (data.company_slug) {
      const { data: company, error: companyError } = await client
        .from('job_companies')
        .select('*')
        .eq('slug', data.company_slug)
        .maybeSingle()

      if (!companyError && company) {
        companyRecord = company

        const { data: profile, error: profileError } = await client
          .from('job_company_profiles')
          .select('*')
          .eq('company_id', company.id)
          .eq('is_published', true)
          .maybeSingle()

        if (profileError) {
          console.error('Failed to fetch company profile:', profileError.message)
        } else {
          companyProfile = profile || null
        }
      }
    }
  } catch {
    // Supabase client unavailable in this runtime context (SSR). The job
    // record's own logo_url is used as the og:image fallback.
  }

  return normalizeJob(data, companyRecord, companyProfile);
}, {
  server: true,
  default: () => {
    const cachedJob = getCachedJob()
    return cachedJob ? normalizeJob(cachedJob) : null
  }
});

const hasFinishedLoadingJob = computed(() => status.value === 'success' || status.value === 'error')

const companyRecord = computed(() => item.value?.company_record || null)
const companyProfile = computed(() => item.value?.company_profile || null)

const companyDisplayName = computed(() =>
  companyRecord.value?.name ||
  item.value?.company_name ||
  item.value?.company_slug ||
  'Company'
)

const companyLogo = computed(() =>
  companyProfile.value?.cover_image_url ||
  companyRecord.value?.logo_url ||
  item.value?.logo_url ||
  null
)

const companyWebsiteUrl = computed(() =>
  companyRecord.value?.website_url ||
  companyProfile.value?.source_url ||
  null
)

const companyCareersUrl = computed(() =>
  companyRecord.value?.careers_url ||
  companyRecord.value?.carrers_url ||
  null
)

const companyFacts = computed(() => {
  const profile = companyProfile.value
  const facts: { label: string; value: string }[] = []

  if (profile?.industry) facts.push({ label: 'Industry', value: profile.industry })
  if (profile?.headquarters) facts.push({ label: 'Headquarters', value: profile.headquarters })
  if (profile?.company_size) facts.push({ label: 'Company Size', value: profile.company_size })
  if (profile?.founded_year) facts.push({ label: 'Founded', value: String(profile.founded_year) })

  return facts
})

// Sync server-fetched data to Pinia store for caching
watch(item, (newItem) => {
  if (newItem && !jobsStore.jobItems.find(i => i.id === newItem.id)) {
    jobsStore.jobItems.push(newItem);
  }
}, { immediate: true });

// Set browser tab title to the job title
useHead({
  title: () => item.value?.title
})

// SERVER-SIDE SEO TAGS (Baked into initial HTML)
if (item.value) {
  const baseDescription =
    item.value.summary ||
    item.value.detailed_description?.replace(/<[^>]*>/g, '') ||
    ''
  const cleanDescription = `${baseDescription.slice(0, 160)}...`;
  // Keep social previews in sync with the image shown on the page. Company
  // details are stored separately for newer jobs, so the legacy job fields
  // alone are not a reliable source for og:image.
  const socialImage = toAbsoluteImageUrl(
    item.value.company_logo_url ||
    item.value.logo_url ||
    item.value.company_profile?.cover_image_url ||
    item.value.company_record?.logo_url ||
    item.value.image_url ||
    '/social-share.png'
  );
  const canonicalUrl = new URL(route.path, requestUrl.origin).toString();

  const seoMeta: Record<string, any> = {
    title: item.value.title,
    ogTitle: item.value.title,
    description: cleanDescription,
    ogDescription: cleanDescription,
    ogType: 'website',
    ogUrl: canonicalUrl,
    ogImage: socialImage,
    twitterImage: socialImage,
    twitterCard: socialImage ? 'summary_large_image' : 'summary',
    author: 'Energystacks',
  };
  if (item.value.posted_date) {
    seoMeta.articlePublishedTime = item.value.posted_date;
  }
  useServerSeoMeta(seoMeta);
}

const handleBack = () => {
  const { $navigationTracker } = useNuxtApp() as any;
  if ($navigationTracker.hasHistory.value) {
    router.back();
  } else {
    router.push('/jobs');
  }
};

const handleShare = async () => {
  if (!item.value) return;
  const shareData = {
    title: item.value.title,
    text: `Job opening: ${item.value.title}`,
    url: window.location.href,
  };
  if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
    try { await navigator.share(shareData); } catch (err) {}
  } else {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showCopied.value = true;
      setTimeout(() => { showCopied.value = false; }, 2000);
    } catch (err) { console.error('Clipboard copy failed:', err); }
  }
};
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
