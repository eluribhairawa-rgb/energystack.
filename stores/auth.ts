import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  CognitoUserPool,
  CognitoUser,
  CognitoUserAttribute,
  CognitoUserSession,
  CognitoIdToken,
  CognitoAccessToken,
  CognitoRefreshToken
} from 'amazon-cognito-identity-js'
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  RespondToAuthChallengeCommand
} from '@aws-sdk/client-cognito-identity-provider'

export interface Profile {
  full_name: string
  avatar_url: string
  content_preferences: string[]
  language: string
  marketing_opt_in: boolean
  has_password?: boolean
  job_subscription_preferences?: {
    categories?: string[]
    locations?: string[]
    employmentTypes?: string[]
    companies?: string[]
  } | null
  event_alert_preferences?: {
    eventTypes?: string[]
  } | null
}

const DEFAULT_PROFILE: Profile = {
  full_name: '',
  avatar_url: '',
  content_preferences: ['Business', 'Technology', 'Geopolitical'],
  language: 'English',
  marketing_opt_in: false,
  has_password: false
}

let pool: CognitoUserPool | null = null
let idpClient: CognitoIdentityProviderClient | null = null

// Lazy singletons — created on first use so this module can be imported
// during SSR without touching the Cognito config before runtimeConfig exists.
function getPool(): CognitoUserPool {
  if (!pool) {
    const config = useRuntimeConfig()
    pool = new CognitoUserPool({
      UserPoolId: config.public.cognitoUserPoolId as string,
      ClientId: config.public.cognitoClientId as string
    })
  }
  return pool
}

function getIdpClient(): CognitoIdentityProviderClient {
  if (!idpClient) {
    const config = useRuntimeConfig()
    idpClient = new CognitoIdentityProviderClient({ region: config.public.cognitoRegion as string })
  }
  return idpClient
}

function sessionToUser(session: CognitoUserSession) {
  const payload = session.getIdToken().payload as Record<string, any>
  return {
    id: payload.sub as string,
    sub: payload.sub as string,
    email: payload.email as string,
    idToken: session.getIdToken().getJwtToken(),
    accessToken: session.getAccessToken().getJwtToken(),
    refreshToken: session.getRefreshToken().getToken()
  }
}

export const useAuthStore = defineStore('auth', () => {
  const router = useRouter()

  // State
  const user = ref<any>(null)
  const profile = ref<Profile>({ ...DEFAULT_PROFILE })
  const loading = ref(false)
  const isProfileLoaded = ref(false)
  const error = ref<string | null>(null)
  const successMessage = ref<string | null>(null)

  // Held only in memory between signUp() and verifyOtp() so the signup
  // confirmation step can silently sign the user in afterward (Cognito's
  // confirmRegistration does not itself return a session, unlike Supabase's
  // verifyOtp). Never persisted.
  const _pendingSignup = ref<{ email: string; password: string } | null>(null)

  const hasPassword = computed(() => !!profile.value.has_password)

  function authHeaders() {
    return user.value?.accessToken ? { Authorization: `Bearer ${user.value.accessToken}` } : {}
  }

  function resetLocalState() {
    user.value = null
    isProfileLoaded.value = false
    profile.value = { ...DEFAULT_PROFILE }
  }

  // --- Session restore on app load (replaces onAuthStateChange) -----------
  if (process.client) {
    const cognitoUser = getPool().getCurrentUser()
    if (cognitoUser) {
      cognitoUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
        if (err || !session) return
        user.value = sessionToUser(session)
        fetchProfile()
      })
    }
  }

  async function fetchProfile() {
    if (!user.value) {
      isProfileLoaded.value = true
      return
    }

    try {
      const { profile: data } = await $fetch<{ profile: Profile | null }>('/api/profile', {
        headers: authHeaders()
      })
      if (data) {
        profile.value = data
      }
    } catch (e: any) {
      console.error('Profile fetch failed:', e.message)
    } finally {
      isProfileLoaded.value = true
    }
  }

  // --- ACTIONS ---

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  // NOTE (OTP decision — see MIGRATION_NOTES.md): Cognito has no passwordless
  // signup equivalent without a CUSTOM_CHALLENGE Lambda trigger, which does
  // not exist yet. Password is now always required at signup.
  async function signUp({ email, password, fullName }: { email: string; password: string; fullName: string }) {
    loading.value = true
    error.value = null
    try {
      if (!password) {
        throw new Error('A password is required to sign up.')
      }

      await new Promise<void>((resolve, reject) => {
        getPool().signUp(
          email,
          password,
          [new CognitoUserAttribute({ Name: 'email', Value: email }), new CognitoUserAttribute({ Name: 'name', Value: fullName })],
          [],
          (err) => (err ? reject(err) : resolve())
        )
      })

      _pendingSignup.value = { email, password }
      return 'signup'
    } catch (e: any) {
      error.value = e.message
      return null
    } finally {
      loading.value = false
    }
  }

  // type is kept for call-site compatibility with the old Supabase-shaped
  // callers (pages/verify-otp.vue) — Cognito signup confirmation is the only
  // supported type now (see OTP decision above).
  async function verifyOtp({ email, token }: { email: string; token: string; type?: string }) {
    loading.value = true
    error.value = null
    try {
      const cognitoUser = new CognitoUser({ Username: email, Pool: getPool() })

      await new Promise<void>((resolve, reject) => {
        cognitoUser.confirmRegistration(token, true, (err) => (err ? reject(err) : resolve()))
      })

      // Silently sign the user in — mirrors Supabase's verifyOtp, which
      // authenticated in the same call.
      const pending = _pendingSignup.value
      if (pending && pending.email === email) {
        await signIn({ email: pending.email, password: pending.password })
        _pendingSignup.value = null
      }

      if (user.value) {
        await $fetch('/api/profile', {
          method: 'PUT',
          headers: authHeaders(),
          body: {
            full_name: '',
            avatar_url: '',
            content_preferences: DEFAULT_PROFILE.content_preferences,
            marketing_opt_in: false,
            has_password: true
          }
        })
        await fetchProfile()
      }

      return true
    } catch (e: any) {
      error.value = e.message
      return false
    } finally {
      loading.value = false
    }
  }

  // Deliberately NOT using CognitoUser#authenticateUser() here — that method
  // always performs the SRP protocol, and Cognito's UserMigration Lambda
  // trigger (which lets pre-existing Supabase users log in with their
  // current password on first login) only fires for USER_PASSWORD_AUTH /
  // ADMIN_USER_PASSWORD_AUTH flows, never SRP — SRP needs a password
  // verifier that only exists for users Cognito already knows about, so a
  // not-yet-migrated user's login would just fail outright under SRP
  // without ever invoking the migration Lambda. So the password is sent
  // via a direct InitiateAuth(USER_PASSWORD_AUTH) call instead, and the
  // resulting tokens are then handed to a CognitoUser via the library's own
  // public setSignInUserSession()/cacheTokens() APIs, so session restore,
  // changePassword, signOut etc. all keep working exactly as before.
  async function signIn({ email, password }: { email: string; password: string }) {
    loading.value = true
    error.value = null
    try {
      const config = useRuntimeConfig()
      const result = await getIdpClient().send(new InitiateAuthCommand({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: config.public.cognitoClientId as string,
        AuthParameters: { USERNAME: email, PASSWORD: password }
      }))

      const tokens = result.AuthenticationResult
      if (!tokens?.IdToken || !tokens.AccessToken || !tokens.RefreshToken) {
        throw new Error(
          result.ChallengeName
            ? 'Additional verification is required for this account. Please contact support.'
            : 'Login failed. Please try again.'
        )
      }

      const session = new CognitoUserSession({
        IdToken: new CognitoIdToken({ IdToken: tokens.IdToken }),
        AccessToken: new CognitoAccessToken({ AccessToken: tokens.AccessToken }),
        RefreshToken: new CognitoRefreshToken({ RefreshToken: tokens.RefreshToken })
      })

      const cognitoUser = new CognitoUser({ Username: email, Pool: getPool() })
      cognitoUser.setSignInUserSession(session)
      cognitoUser.cacheTokens()

      user.value = sessionToUser(session)
      await fetchProfile()
      return true
    } catch (e: any) {
      error.value = e.message
      return false
    } finally {
      loading.value = false
    }
  }

  // Passwordless login: request a one-click sign-in link by email. The
  // actual CUSTOM_AUTH InitiateAuth call happens server-side
  // (server/api/otp.post.ts) so a nonexistent email can't be distinguished
  // from a real one, and so the code + Session token never pass through the
  // browser at all — the emailed link is the only thing that carries them,
  // straight to pages/auth/callback.vue.
  async function signInWithOtp(email: string) {
    loading.value = true
    error.value = null
    try {
      const config = useRuntimeConfig()
      if (!config.public.enableOtpLogin) {
        error.value = 'Magic-link login is not available yet. Please use your password.'
        return false
      }

      await $fetch('/api/otp', { method: 'POST', body: { email } })
      return true
    } catch (e: any) {
      error.value = 'Failed to process request. Please try again later.'
      return false
    } finally {
      loading.value = false
    }
  }

  // Used by confirmLoginOtpFromLink (the one-click email link). RespondToAuthChallenge
  // for CUSTOM_AUTH is a public, unauthenticated-app-client operation (same
  // as InitiateAuth), so this runs directly against Cognito — no server hop.
  async function respondToCustomAuthChallenge({ email, code, session }: { email: string; code: string; session: string }) {
    const config = useRuntimeConfig()
    const result = await getIdpClient().send(new RespondToAuthChallengeCommand({
      ChallengeName: 'CUSTOM_CHALLENGE',
      ClientId: config.public.cognitoClientId as string,
      Session: session,
      ChallengeResponses: { USERNAME: email, ANSWER: code }
    }))

    const tokens = result.AuthenticationResult
    if (!tokens?.IdToken || !tokens.AccessToken || !tokens.RefreshToken) {
      throw new Error('Invalid or expired code')
    }

    const cognitoSession = new CognitoUserSession({
      IdToken: new CognitoIdToken({ IdToken: tokens.IdToken }),
      AccessToken: new CognitoAccessToken({ AccessToken: tokens.AccessToken }),
      RefreshToken: new CognitoRefreshToken({ RefreshToken: tokens.RefreshToken })
    })

    const cognitoUser = new CognitoUser({ Username: email, Pool: getPool() })
    cognitoUser.setSignInUserSession(cognitoSession)
    cognitoUser.cacheTokens()

    user.value = sessionToUser(cognitoSession)
    await fetchProfile()
  }

  // Passwordless login, step 2: the emailed link to /auth/callback carries
  // the code + session itself (there's no manual code-entry UI).
  async function confirmLoginOtpFromLink({ email, code, session }: { email: string; code: string; session: string }) {
    loading.value = true
    error.value = null
    try {
      await respondToCustomAuthChallenge({ email, code, session })
      return true
    } catch (e: any) {
      error.value = 'This sign-in link is invalid or has expired.'
      return false
    } finally {
      loading.value = false
    }
  }

  async function signOut() {
    try {
      if (process.client) {
        const cognitoUser = getPool().getCurrentUser()
        cognitoUser?.signOut()

        // SCORCHED EARTH: wipe all client storage (kept from the previous
        // implementation — Cognito's own tokens live in localStorage too).
        localStorage.clear()
        sessionStorage.clear()
        const cookies = document.cookie.split(';')
        for (const cookie of cookies) {
          const name = cookie.split('=')[0].trim()
          document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;`
          document.cookie = `${name}=; path=/; domain=${window.location.hostname}; expires=Thu, 01 Jan 1970 00:00:00 GMT;`
        }
      }

      resetLocalState()

      if (process.client) {
        window.location.href = '/login'
      }
    } catch (e) {
      if (process.client) window.location.href = '/login'
    }
  }

  async function updateProfile(updates: Partial<Profile>) {
    if (!user.value) return false
    loading.value = true
    try {
      const { profile: data } = await $fetch<{ profile: Profile }>('/api/profile', {
        method: 'PUT',
        headers: authHeaders(),
        body: updates
      })
      profile.value = data
      return true
    } catch (e: any) {
      error.value = e.data?.statusMessage || e.message
      return false
    } finally {
      loading.value = false
    }
  }

  async function uploadAvatar(file: File) {
    if (!user.value) return false
    loading.value = true
    try {
      const dataBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve((reader.result as string).split(',')[1])
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      const { url } = await $fetch<{ url: string }>('/api/avatar', {
        method: 'POST',
        headers: authHeaders(),
        body: { fileName: file.name, contentType: file.type, dataBase64 }
      })

      await updateProfile({ avatar_url: url })
      return true
    } catch (e: any) {
      error.value = e.data?.statusMessage || e.message
      return false
    } finally {
      loading.value = false
    }
  }

  // Voluntary password change while authenticated — requires the current
  // password, unlike Supabase's updateUser({password}). This is the correct
  // Cognito shape (ChangePassword), not a workaround.
  async function changePassword(oldPassword: string, newPassword: string) {
    loading.value = true
    error.value = null
    try {
      const cognitoUser = getPool().getCurrentUser()
      if (!cognitoUser) throw new Error('Not signed in')

      await new Promise<void>((resolve, reject) => {
        cognitoUser.getSession((err: Error | null) => {
          if (err) return reject(err)
          cognitoUser.changePassword(oldPassword, newPassword, (changeErr) => (changeErr ? reject(changeErr) : resolve()))
        })
      })

      await updateProfile({ has_password: true })
      return true
    } catch (e: any) {
      error.value = e.message
      return false
    } finally {
      loading.value = false
    }
  }

  // Step 1 of the forgotPassword flow — sends the reset code by email.
  async function resetPasswordForEmail(email: string) {
    loading.value = true
    error.value = null
    try {
      const cognitoUser = new CognitoUser({ Username: email, Pool: getPool() })
      await new Promise<void>((resolve) => {
        cognitoUser.forgotPassword({
          onSuccess: () => resolve(),
          // Same privacy posture as before: never reveal whether the email
          // exists, always resolve as if it worked.
          onFailure: (e) => {
            console.log('[forgotPassword] suppressed error for privacy:', e?.message)
            resolve()
          }
        })
      })
      return true
    } catch (e: any) {
      return true
    } finally {
      loading.value = false
    }
  }

  // Step 2 of the forgotPassword flow — the code + new password are
  // submitted together (Cognito's confirmPassword shape), unlike Supabase
  // where verifying the code and setting the password were two separate
  // calls against an established recovery session.
  async function confirmForgotPassword({ email, code, newPassword }: { email: string; code: string; newPassword: string }) {
    loading.value = true
    error.value = null
    try {
      const cognitoUser = new CognitoUser({ Username: email, Pool: getPool() })
      await new Promise<void>((resolve, reject) => {
        cognitoUser.confirmPassword(code, newPassword, {
          onSuccess: () => resolve(),
          onFailure: (e) => reject(e)
        })
      })
      return true
    } catch (e: any) {
      error.value = e.message || 'Invalid or expired code'
      return false
    } finally {
      loading.value = false
    }
  }

  async function confirmUnsubscribe(token: string) {
    loading.value = true
    error.value = null
    try {
      const { success } = await $fetch<{ success: boolean }>('/api/unsubscribe', {
        method: 'POST',
        body: { token }
      })
      return success
    } catch (e: any) {
      error.value = e.message
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    user, profile, loading, error, successMessage, isProfileLoaded, hasPassword,
    fetchProfile, validateEmail, signUp, verifyOtp, signIn, signInWithOtp, confirmLoginOtpFromLink, signOut,
    updateProfile, uploadAvatar, changePassword, resetPasswordForEmail, confirmForgotPassword,
    confirmUnsubscribe,
    initializeInvitedProfile: async () => {
      await fetchProfile()
      return isProfileLoaded.value && !!profile.value.full_name
    }
  }
})
