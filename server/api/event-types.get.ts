import { getDb } from '../utils/db'

export default defineEventHandler(async () => {
  const db = getDb()

  const result = await db.query(
    `SELECT category, venue FROM conference_listings WHERE is_active = true`
  )

  const values = result.rows
    .map((row: any) => row.category || row.venue)
    .filter(Boolean)

  const eventTypes = [...new Set(values)].sort((a, b) => a.localeCompare(b))

  return { eventTypes }
})
