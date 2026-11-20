export default defineNuxtPlugin((nuxtApp) => {
  const navigationCount = ref(0)

  if (process.client) {
    const router = useRouter()
    router.afterEach(() => {
      navigationCount.value++
    })
  }

  return {
    provide: {
      navigationTracker: {
        // We subtract 1 because the first landing always increments to 1
        hasHistory: computed(() => navigationCount.value > 1)
      }
    }
  }
})
