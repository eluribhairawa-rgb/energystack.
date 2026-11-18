import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore()

  if (!authStore.user && to.path.startsWith('/profile')) {
    return navigateTo('/login')
  }
})
