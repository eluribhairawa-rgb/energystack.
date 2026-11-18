import { AdminGetUserCommand } from '@aws-sdk/client-cognito-identity-provider'
import { getDb } from '../utils/db'
import { getCognitoClient, ensurePasswordlessUser } from '../utils/cognito'
import { sendMagicLinkCode } from '../utils/otp'

// Replaces `supabase.auth.admin.inviteUserByEmail` + `getUserById` + the
// `get_user_id_by_email` RPC. Users are created with `Username = email`, so
// AdminGetUser(Username: email) plays the role both of the old RPC lookup
// and of `getUserById`. Uses the ECS task's default AWS credentials (the
// task role) — no static keys.
//
// Passwordless by design: subscribing via email creates a Cognito account
// with a random password nobody knows (ensurePasswordlessUser, shared with
// server/api/otp.post.ts). The user never sees or sets a password unless
// they choose to later (via the existing forgot-password flow) — the
// intended path is always logging in via the magic-link code, which this
// endpoint also triggers immediately below so their very first login is a
// magic-link email, matching how returning users log in.

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)
  const { email, subscriptionType = 'news', topics, filters, eventTypes } = body

  if (!email) {
    throw createError({ statusCode: 400, statusMessage: 'Email is required' })
  }

  if (subscriptionType === 'news' && !topics) {
    throw createError({ statusCode: 400, statusMessage: 'Topics are required for news subscriptions' })
  }

  if (subscriptionType === 'job' && !filters) {
    throw createError({ statusCode: 400, statusMessage: 'Filters are required for job subscriptions' })
  }

  if (subscriptionType === 'event' && !eventTypes) {
    throw createError({ statusCode: 400, statusMessage: 'Event types are required for event subscriptions' })
  }

  const cognito = getCognitoClient()
  const userPoolId = config.public.cognitoUserPoolId

  // 1. User lookup (replaces get_user_id_by_email + auth.admin.getUserById).
  let existingSub: string | null = null
  let userExists = false
  try {
    const { UserAttributes } = await cognito.send(new AdminGetUserCommand({ UserPoolId: userPoolId, Username: email }))
    userExists = true
    const attrs = Object.fromEntries((UserAttributes || []).map((a) => [a.Name, a.Value]))
    existingSub = attrs.sub || null
  } catch (e: any) {
    if (e.name !== 'UserNotFoundException') {
      console.error('[Invite API] AdminGetUser failed:', e.message)
    }
  }

  // Persist job subscription preferences immediately for an already-known
  // user, same as the original Supabase upsert — via the existing RDS data
  // layer, not Supabase.
  if (existingSub && subscriptionType === 'job') {
    try {
      const db = getDb()
      await db.query(
        `INSERT INTO profiles (id, job_subscription_preferences)
         VALUES ($1, $2)
         ON CONFLICT (id) DO UPDATE SET job_subscription_preferences = EXCLUDED.job_subscription_preferences`,
        [existingSub, JSON.stringify(filters || [])]
      )
    } catch (e: any) {
      console.error('Failed to upsert job_subscription_preferences for profile:', e.message || e)
    }
  }

  // 2. New user: create passwordless + confirmed.
  if (!userExists) {
    try {
      await ensurePasswordlessUser(email)
    } catch (e: any) {
      console.error('Invite Error:', e.message)
      return { success: true }
    }
  }

  // 3. Send the magic-link sign-in link for their first (or next) login —
  // same helper as server/api/otp.post.ts.
  try {
    await sendMagicLinkCode(event, email)
  } catch (e: any) {
    console.error('[Invite API] Failed to send magic-link code:', e.message)
  }

  return { success: true }
})
