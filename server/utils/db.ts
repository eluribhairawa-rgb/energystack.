import { Pool, types } from 'pg'

// Postgres DATE (OID 1082) -> return as 'YYYY-MM-DD' string, not a JS Date.
// Matches the previous Supabase-client behavior; without this, node-postgres
// serializes date-only columns (e.g. published_date) as '...T00:00:00.000Z'.
types.setTypeParser(1082, (val) => val)

let pool: Pool | null = null

export function getDb() {
  if (!pool) {
    pool = new Pool({
      host: process.env.DB_HOST,
      port: 5432,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'openpetro',
      ssl: { rejectUnauthorized: false },
      max: 5,
    })
  }
  return pool
}
