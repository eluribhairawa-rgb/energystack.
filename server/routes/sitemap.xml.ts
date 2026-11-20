// sitemap.xml (QA H2). Built from the public API endpoints so it uses the same
// data access as the pages; cached for an hour to keep load on the DB low.
const SITE = 'https://energystacks.ai'
const PAGE = 50
const MAX_PAGES = 200 // safety cap: 10k URLs per list

type Entry = { loc: string, lastmod?: string | null }

async function collect(path: string, dateField: string) {
  const out: any[] = []
  for (let page = 0; page < MAX_PAGES; page++) {
    const { data } = await $fetch<{ data: any[] }>(`${path}?limit=${PAGE}&offset=${page * PAGE}`)
    out.push(...(data || []))
    if (!data || data.length < PAGE) break
  }
  return out.map((r) => ({ id: r.id, date: r[dateField] }))
}

const xmlEscape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const toDate = (v: any) => {
  if (!v) return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10)
}

export default defineCachedEventHandler(async (event) => {
  const entries: Entry[] = ['/', '/markets', '/jobs', '/events'].map((p) => ({ loc: `${SITE}${p}` }))

  const [news, jobs, events] = await Promise.allSettled([
    collect('/api/news', 'published_date'),
    collect('/api/jobs', 'posted_date'),
    $fetch<{ data: any[] }>('/api/events').then(({ data }) => (data || []).map((r) => ({ id: r.id, date: r.updated_at || r.start_date })))
  ])

  for (const [result, prefix] of [[news, 'news'], [jobs, 'jobs'], [events, 'events']] as const) {
    if (result.status !== 'fulfilled') {
      console.error(`[sitemap] failed to load ${prefix}:`, result.reason?.message || result.reason)
      continue
    }
    for (const r of result.value) entries.push({ loc: `${SITE}/${prefix}/${r.id}`, lastmod: toDate(r.date) })
  }

  const body = entries
    .map((e) => `  <url><loc>${xmlEscape(e.loc)}</loc>${e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : ''}</url>`)
    .join('\n')

  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
}, { maxAge: 60 * 60, name: 'sitemap' })
