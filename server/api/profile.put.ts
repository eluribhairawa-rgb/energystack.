import { getDb } from '../utils/db'
import { getAuthenticatedUser } from '../utils/cognito'

// Replaces the direct `useSupabaseClient().from('profiles').update(...)` /
// `.upsert(...)` calls that used to run from the browser. Keyed by EMAIL,
// not the Cognito `sub` — a migrated user's profile row already exists
// (found by email); a brand-new user's row is created here with BOTH
// id = sub and email = <email> set. `profiles.email` has no unique
// constraint (see the kit's sql/01-add-profiles-email.sql), so this is an
// explicit update-then-insert rather than an ON CONFLICT upsert.
const ALLOWED_COLUMNS = [
  'full_name',
  'avatar_url',
  'content_preferences',
  'language',
  'marketing_opt_in',
  'has_password',
  'job_subscription_preferences',
  'event_alert_preferences'
] as const

export default defineEventHandler(async (event) => {
  const { sub, email } = await getAuthenticatedUser(event)
  const body = await readBody(event)

  const columns = ALLOWED_COLUMNS.filter((col) => col in body)
  if (columns.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No valid profile fields provided' })
  }

  const jsonColumns = new Set(['job_subscription_preferences', 'event_alert_preferences'])
  const values = columns.map((col) => (jsonColumns.has(col) ? JSON.stringify(body[col]) : body[col]))

  const db = getDb()
  const setClause = columns.map((col, i) => `${col} = $${i + 2}`).join(', ')

  const updated = await db.query(
    `UPDATE profiles SET ${setClause} WHERE lower(email) = lower($1) RETURNING *`,
    [email, ...values]
  )

  if (updated.rows[0]) {
    return { profile: updated.rows[0] }
  }

  const insertColumns = ['id', 'email', ...columns].join(', ')
  const insertPlaceholders = ['$1', '$2', ...columns.map((_, i) => `$${i + 3}`)].join(', ')

  const inserted = await db.query(
    `INSERT INTO profiles (${insertColumns}) VALUES (${insertPlaceholders}) RETURNING *`,
    [sub, email, ...values]
  )

  return { profile: inserted.rows[0] }
})
