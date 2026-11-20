import { getDb } from '../utils/db'

// Replaces `useSupabaseClient().rpc('confirm_unsubscribe', ...)`. Assumes the
// `confirm_unsubscribe(token_input)` Postgres function was carried over to
// RDS along with the rest of the schema (same DB this app already reads/
// writes via server/utils/db.ts). Public — gated by the token itself, same
// as before.
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { token } = body

  if (!token) {
    throw createError({ statusCode: 400, statusMessage: 'token is required' })
  }

  const db = getDb()
  try {
    const { rows } = await db.query('SELECT confirm_unsubscribe($1) AS result', [token])
    return { success: !!rows[0]?.result }
  } catch (e: any) {
    console.error('[Unsubscribe API] Error:', e.message)
    return { success: false }
  }
})
