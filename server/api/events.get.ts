import { getDb } from '../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const db = getDb()

  const id = query.id ? Number(query.id) : null

  if (id) {
    const result = await db.query(
      `SELECT cl.*, cs.name AS source_name
       FROM conference_listings cl
       LEFT JOIN conference_sources cs ON cs.id = cl.source_id
       WHERE cl.id = $1
       LIMIT 1`,
      [id]
    )
    return { data: result.rows[0] || null }
  }

  const result = await db.query(
    `SELECT cl.*, cs.name AS source_name
     FROM conference_listings cl
     LEFT JOIN conference_sources cs ON cs.id = cl.source_id
     WHERE cl.is_active = true AND cl.start_date IS NOT NULL
     ORDER BY cl.start_date ASC`
  )

  return { data: result.rows }
})
