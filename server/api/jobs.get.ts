import { getDb } from '../utils/db'

function sanitizeSearchTerm(term: string) {
  return term.replace(/[%*,()]/g, ' ').replace(/\s+/g, ' ').trim()
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const db = getDb()

  // Single-job lookup by id
  if (query.id) {
    const result = await db.query(`SELECT * FROM job_listings WHERE id = $1`, [Number(query.id)])
    return { data: result.rows[0] || null }
  }

  const limit = Math.min(Number(query.limit) || 10, 50)
  const offset = Number(query.offset) || 0
  const search = typeof query.search === 'string' ? sanitizeSearchTerm(query.search) : ''
  const categories = query.categories ? String(query.categories).split(',').filter(Boolean) : []
  const locations = query.locations ? String(query.locations).split(',').filter(Boolean) : []
  const employmentTypes = query.employmentTypes ? String(query.employmentTypes).split(',').filter(Boolean) : []
  const companies = query.companies ? String(query.companies).split(',').filter(Boolean) : []
  const fromId = query.fromId ? Number(query.fromId) : null

  const conditions: string[] = [`is_active = true`]
  const params: any[] = []
  let paramIndex = 1

  if (categories.length > 0) {
    const hasGeneral = categories.includes('General')
    const others = categories.filter((c) => c !== 'General')
    if (hasGeneral && others.length > 0) {
      conditions.push(`(department = ANY($${paramIndex++}) OR department IS NULL)`)
      params.push(others)
    } else if (hasGeneral) {
      conditions.push(`department IS NULL`)
    } else {
      conditions.push(`department = ANY($${paramIndex++})`)
      params.push(others)
    }
  }
  if (locations.length > 0) {
    conditions.push(`location = ANY($${paramIndex++})`)
    params.push(locations)
  }
  if (employmentTypes.length > 0) {
    conditions.push(`employment_type = ANY($${paramIndex++})`)
    params.push(employmentTypes)
  }
  if (companies.length > 0) {
    conditions.push(`company_slug = ANY($${paramIndex++})`)
    params.push(companies)
  }
  if (search) {
    conditions.push(`(title ILIKE $${paramIndex} OR company_slug ILIKE $${paramIndex} OR location ILIKE $${paramIndex})`)
    params.push(`%${search}%`)
    paramIndex++
  }

  if (fromId) {
    const targetRes = await db.query(`SELECT * FROM job_listings WHERE id = $1`, [fromId])
    const target = targetRes.rows[0]
    if (target) {
      conditions.push(`(posted_date < $${paramIndex} OR (posted_date = $${paramIndex} AND id <= $${paramIndex + 1}))`)
      params.push(target.posted_date, target.id)
      paramIndex += 2
    }
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`
  params.push(limit, offset)

  const sql = `
    SELECT * FROM job_listings
    ${whereClause}
    ORDER BY company_slug ASC NULLS LAST, title ASC NULLS LAST, id ASC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `

  const result = await db.query(sql, params)
  return { data: result.rows }
})
