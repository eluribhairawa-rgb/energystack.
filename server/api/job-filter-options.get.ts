import { getDb } from '../utils/db'

export default defineEventHandler(async () => {
  const db = getDb()

  const [attrsRes, companiesRes] = await Promise.all([
    db.query(`SELECT department, location, employment_type, company_slug FROM job_listings WHERE is_active = true`),
    db.query(`SELECT slug, name, logo_url FROM job_companies`)
  ])

  const rows = attrsRes.rows
  const companyRows = companiesRes.rows
  const companyMap = new Map(companyRows.map((c: any) => [c.slug, c]))

  const categories = [...new Set(rows.map((r: any) => r.department).filter(Boolean))].sort()
  const locations = [...new Set(rows.map((r: any) => r.location).filter(Boolean))].sort()
  const employmentTypes = [...new Set(rows.map((r: any) => r.employment_type).filter(Boolean))].sort()

  const activeCompanySlugs = [...new Set(rows.map((r: any) => r.company_slug).filter(Boolean))]
  const companies = activeCompanySlugs.map((slug: any) => {
    const c = companyMap.get(slug)
    return {
      slug,
      name: c?.name || slug,
      logo_url: c?.logo_url ?? null
    }
  })

  return { categories, locations, employmentTypes, companies }
})
