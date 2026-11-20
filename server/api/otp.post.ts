import { ensurePasswordlessUser } from '../utils/cognito'
import { sendMagicLinkCode } from '../utils/otp'

// Passwordless ("magic link") login: kick off Cognito's CUSTOM_AUTH flow
// and email a one-click sign-in link (see server/utils/otp.ts for how the
// code + Session token get embedded in it). Nothing from this call needs
// to reach the browser — the email is the only channel that matters — so
// the response is just a bare success.
//
// Any email can request a link, whether or not it already has an account —
// if Cognito doesn't know this email yet, a passwordless account is created
// for it first (ensurePasswordlessUser, shared with server/api/invite.post.ts)
// so the magic-link field on the login page doubles as a signup form. This
// is a deliberate product decision, not the old Supabase-style privacy
// posture — anyone who types a real email they don't own will just cause an
// account + code email to be sent to that address, same as subscribing.
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  if (!config.public.enableOtpLogin) {
    throw createError({
      statusCode: 501,
      statusMessage: 'Passwordless login is not available yet. Use email + password.'
    })
  }

  const body = await readBody(event)
  const { email } = body

  if (!email) {
    throw createError({ statusCode: 400, statusMessage: 'Email is required' })
  }

  await ensurePasswordlessUser(email)
  await sendMagicLinkCode(event, email)

  return { success: true }
})
