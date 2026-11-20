import { getDb } from '../utils/db'

type Series = number[]

const HISTORY_POINTS = 9

function asNumber(value: unknown): number {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
}
function formatPrice(value: number): string {
    return `$${value.toFixed(2)}`
}
function formatOptionalPrice(value: unknown): string {
    const parsed = Number(value)
    if (!Number.isFinite(parsed)) return '-'
    return `$${parsed.toFixed(2)}`
}
function formatIndexValue(value: number): string {
    return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function normalizeSourceLabel(value: string): string {
    return value.split(/[_\s-]+/).filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join(' ')
}
function deriveSourceLabel(rows: any[]): string {
    const unique = [...new Set(rows.map((row) => String(row?.source || '').trim()).filter(Boolean))]
    if (unique.length === 0) return 'Not specified'
    if (unique.length === 1) return normalizeSourceLabel(unique[0])
    if (unique.length === 2) return `${normalizeSourceLabel(unique[0])} + ${normalizeSourceLabel(unique[1])}`
    return `${normalizeSourceLabel(unique[0])} + ${unique.length - 1} more`
}
function sortByPreferredOrder<T>(items: T[], getKey: (item: T) => string, preferredOrder: string[]) {
    const rank = new Map(preferredOrder.map((key, index) => [key, index]))
    return items.sort((a, b) => {
        const aRank = rank.get(getKey(a))
        const bRank = rank.get(getKey(b))
        if (aRank !== undefined && bRank !== undefined) return aRank - bRank
        if (aRank !== undefined) return -1
        if (bRank !== undefined) return 1
        return getKey(a).localeCompare(getKey(b))
    })
}

function toIso(value: unknown): string | null {
    if (!value) return null
    const d = value instanceof Date ? value : new Date(String(value))
    return Number.isNaN(d.getTime()) ? null : d.toISOString()
}
// Newest timestamp (ISO string) among rows, or null.
function latestOf(values: unknown[]): string | null {
    let best: string | null = null
    for (const v of values) {
        const iso = typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : toIso(v)
        if (iso && (!best || iso > best)) best = iso
    }
    return best
}

export default defineEventHandler(async () => {
    const db = getDb()

    const [rigRes, commodityRes, companyRes, indexRes] = await Promise.all([
        db.query(`SELECT region, total_count, wow_change, report_date, date_of_prior_count, change_from_last_year, date_of_last_year_count, source
              FROM rig_counts ORDER BY report_date DESC LIMIT 20`),
        db.query(`SELECT cp.symbol, cp.last_price, cp.daily_change_pct, cp.weekly_change_pct, to_char(cp.price_date, 'YYYY-MM-DD') AS price_date, cp.source, c.name, c.unit
              FROM commodity_prices cp LEFT JOIN commodities c ON c.symbol = cp.symbol
              ORDER BY cp.price_date DESC LIMIT 400`),
        db.query(`SELECT cq.ticker, cq.price, cq.change_pct, cq.quote_time, cq.source, co.name, co.category, co.market_cap_display
              FROM company_quotes cq LEFT JOIN companies co ON co.ticker = cq.ticker
              ORDER BY cq.quote_time DESC LIMIT 400`),
        db.query(`SELECT iq.symbol, iq.value, iq.change_pct, iq.quote_time, iq.source, i.name
              FROM index_quotes iq LEFT JOIN indices i ON i.symbol = iq.symbol
              ORDER BY iq.quote_time DESC LIMIT 400`)
    ])

    const rigRows = rigRes.rows
    const commodityRows = commodityRes.rows
    const companyRows = companyRes.rows
    const indexRows = indexRes.rows

    const latestRigByRegion = new Map<string, any>()
    for (const row of rigRows) {
        if (row.region && !latestRigByRegion.has(row.region)) latestRigByRegion.set(row.region, row)
    }
    const rigCountCards = sortByPreferredOrder(
        [...latestRigByRegion.values()].map((row) => ({
            region: String(row.region || ''),
            title: `${row.region} Rig Count`,
            value: asNumber(row.total_count),
            change: asNumber(row.wow_change),
            reportDate: row.report_date || null,
            priorDate: row.date_of_prior_count || null,
            changeFromLastYear: asNumber(row.change_from_last_year),
            lastYearDate: row.date_of_last_year_count || null
        })),
        (item) => item.title,
        ['US Rig Count', 'Canada Rig Count', 'International Rig Count']
    )

    const latestCommodityBySymbol = new Map<string, any>()
    const commodityHistory = new Map<string, number[]>()
    for (const row of commodityRows) {
        if (!row.symbol) continue
        if (!latestCommodityBySymbol.has(row.symbol)) latestCommodityBySymbol.set(row.symbol, row)
        const list = commodityHistory.get(row.symbol) || []
        if (list.length < HISTORY_POINTS) { list.push(asNumber(row.last_price)); commodityHistory.set(row.symbol, list) }
    }
    const commodities = sortByPreferredOrder(
        [...latestCommodityBySymbol.entries()].map(([symbol, row]) => ({
            name: row.name || symbol,
            ticker: symbol,
            price: formatPrice(asNumber(row.last_price)),
            unit: row.unit ? `/ ${String(row.unit).replace(/^\$\//, '')}` : '',
            day: asNumber(row.daily_change_pct),
            week: asNumber(row.weekly_change_pct),
            priceDate: row.price_date || null,
            history: (commodityHistory.get(symbol) || []).slice().reverse()
        })),
        (item) => item.ticker,
        ['CL1!', 'BZ1!', 'NG1!', 'HO1!']
    )

    const latestCompanyByTicker = new Map<string, any>()
    for (const row of companyRows) {
        if (row.ticker && !latestCompanyByTicker.has(row.ticker)) latestCompanyByTicker.set(row.ticker, row)
    }
    const mappedCompanies = [...latestCompanyByTicker.entries()].map(([ticker, row]) => ({
        name: row.name || ticker,
        ticker,
        price: formatOptionalPrice(row.price),
        marketCap: row.market_cap_display || 'N/A',
        change: asNumber(row.change_pct),
        quoteTime: toIso(row.quote_time)
    }))
    const oilGasMajors = sortByPreferredOrder(
        mappedCompanies.filter((row) => latestCompanyByTicker.get(row.ticker)?.category === 'major'),
        (item) => item.ticker, ['XOM', 'SHEL', 'CVX', 'TTE', 'COP']
    )
    const serviceCompanies = sortByPreferredOrder(
        mappedCompanies.filter((row) => latestCompanyByTicker.get(row.ticker)?.category === 'service'),
        (item) => item.ticker, ['SLB', 'HAL', 'BKR', 'NOV', 'FTI']
    )

    const latestIndexBySymbol = new Map<string, any>()
    const indexHistory = new Map<string, number[]>()
    for (const row of indexRows) {
        if (!row.symbol) continue
        if (!latestIndexBySymbol.has(row.symbol)) latestIndexBySymbol.set(row.symbol, row)
        const list = indexHistory.get(row.symbol) || []
        if (list.length < HISTORY_POINTS) { list.push(asNumber(row.value)); indexHistory.set(row.symbol, list) }
    }
    const indices = sortByPreferredOrder(
        [...latestIndexBySymbol.entries()].map(([symbol, row]) => ({
            name: row.name || symbol,
            value: formatIndexValue(asNumber(row.value)),
            change: asNumber(row.change_pct),
            quoteTime: toIso(row.quote_time),
            history: (indexHistory.get(symbol) || []).slice().reverse()
        })),
        (item) => item.name, ['S&P 500', 'Nasdaq 100', 'STOXX 600', 'Nikkei 225']
    )

    return {
        rigCountCards, commodities, oilGasMajors, serviceCompanies, indices,
        sources: {
            rigCounts: deriveSourceLabel(rigRows),
            commodities: deriveSourceLabel(commodityRows),
            companies: deriveSourceLabel(companyRows),
            indices: deriveSourceLabel(indexRows)
        },
        // Newest data timestamp per section. commodities is a plain date
        // (YYYY-MM-DD, no time of day); companies/indices are ISO instants.
        asOf: {
            rigCounts: latestOf(rigRows.map((r) => r.report_date)),
            commodities: latestOf(commodityRows.map((r) => r.price_date)),
            companies: latestOf(companyRows.map((r) => r.quote_time)),
            indices: latestOf(indexRows.map((r) => r.quote_time))
        },
        fetchedAt: new Date().toISOString()
    }
})
