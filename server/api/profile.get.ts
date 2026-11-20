import { getDb } from '../utils/db'
import { getAuthenticatedUser } from '../utils/cognito'

// Replaces the direct `useSupabaseClient().from('profiles').select(...)` call
// that used to run from the browser. Profile rows are looked up by EMAIL
// (not the Cognito `sub`) so users migrated from Supabase — whose profiles
// row already exists, keyed by their original Supabase id, with email
// backfilled — are found without any primary-key remap. See
// MIGRATION_NOTES.md.
export default defineEventHandler(async (event) => {
  const { email } = await getAuthenticatedUser(event)
  const db = getDb()

  const { rows } = await db.query('SELECT * FROM profiles WHERE lower(email) = lower($1)', [email])
  return { profile: rows[0] || null }
})
