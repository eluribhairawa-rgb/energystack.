import { getDb } from '../utils/db'

function sanitizeSearchTerm(term: string) {
  return term.replace(/[%*]/g, ' ').replace(/\s+/g, ' ').trim()
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const db = getDb()

  // Single-article lookup by id
  if (query.id) {
    const result = await db.query(`SELECT * FROM news_articles WHERE id = $1`, [Number(query.id)])
    return { data: result.rows[0] || null }
  }

  const limit = Math.min(Number(query.limit) || 8, 50)
  const offset = Number(query.offset) || 0
  const search = typeof query.search === 'string' ? sanitizeSearchTerm(query.search) : ''
  const categories = query.categories ? String(query.categories).split(',').filter(Boolean) : []
  const valueChains = query.valueChains ? String(query.valueChains).split(',').filter(Boolean) : []
  const energyTopics = query.energyTopics ? String(query.energyTopics).split(',').filter(Boolean) : []
  const fromId = query.fromId ? Number(query.fromId) : null

  const conditions: string[] = []
  const params: any[] = []
  let paramIndex = 1

  if (search) {
    conditions.push(`title ILIKE $${paramIndex++}`)
    params.push(`%${search}%`)
  }
  if (categories.length > 0) {
    conditions.push(`category = ANY($${paramIndex++})`)
    params.push(categories)
  }
  if (valueChains.length > 0) {
    conditions.push(`value_chain = ANY($${paramIndex++})`)
    params.push(valueChains)
  }
  if (energyTopics.length > 0) {
    conditions.push(`energy_topics && $${paramIndex++}`)
    params.push(energyTopics)
  }

  if (fromId) {
    const targetRes = await db.query(`SELECT * FROM news_articles WHERE id = $1`, [fromId])
    const target = targetRes.rows[0]
    if (target) {
      conditions.push(`(published_date < $${paramIndex} OR (published_date = $${paramIndex} AND id <= $${paramIndex + 1}))`)
      params.push(target.published_date, target.id)
      paramIndex += 2
    }
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  params.push(limit, offset)

  const sql = `
    SELECT * FROM news_articles
    ${whereClause}
    ORDER BY published_date DESC, id DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `

  const result = await db.query(sql, params)
  return { data: result.rows }
})
