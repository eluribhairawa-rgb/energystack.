import { getDb } from '../utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { userId, metadata } = body

  if (!userId || !metadata) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid onboarding data' })
  }

  const db = getDb()

  const fullName = metadata.full_name || 'Energystacks User'
  const contentPreferences = metadata.content_preferences || ['Business', 'Technology', 'Geopolitical']
  const jobSubscriptionPreferences = metadata.job_subscription_filters || null
  const eventAlertPreferences = metadata.event_subscription_types
    ? JSON.stringify({ eventTypes: metadata.event_subscription_types })
    : null

  try {
    await db.query(
      `INSERT INTO profiles (id, full_name, avatar_url, content_preferences, marketing_opt_in, has_password, job_subscription_preferences, event_alert_preferences)
       VALUES ($1, $2, '', $3, true, false, $4, $5)
       ON CONFLICT (id) DO UPDATE SET
         full_name = EXCLUDED.full_name,
         content_preferences = EXCLUDED.content_preferences,
         marketing_opt_in = EXCLUDED.marketing_opt_in,
         job_subscription_preferences = COALESCE(EXCLUDED.job_subscription_preferences, profiles.job_subscription_preferences),
         event_alert_preferences = COALESCE(EXCLUDED.event_alert_preferences, profiles.event_alert_preferences)`,
      [userId, fullName, contentPreferences, jobSubscriptionPreferences, eventAlertPreferences]
    )
  } catch (error: any) {
    console.error('[Onboard API] Error:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to create profile' })
  }

  return { success: true }
})
