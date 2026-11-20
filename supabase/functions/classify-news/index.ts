import { createClient } from 'npm:@supabase/supabase-js@2'

const CATEGORIES = ['Business', 'Technology', 'Geopolitical'] as const
const VALUE_CHAINS = ['upstream', 'midstream', 'downstream'] as const
const ENERGY_TOPICS = [
  'oil',
  'natural_gas',
  'lng',
  'renewables',
  'hydrogen',
  'carbon',
  'nuclear',
] as const

const SYSTEM_PROMPT = `You classify energy-industry news using a fixed taxonomy.

Category definitions:
- Business: prices, supply and demand, trade, finance, investment, M&A, earnings, or commercial developments.
- Technology: engineering, equipment, operational methods, research, innovation, or technical project developments.
- Geopolitical: wars, sanctions, diplomacy, international disputes, political instability, or energy-security actions driven primarily by governments or international relations.

Value-chain definitions:
- upstream: exploration, drilling, wells, oil/gas fields, reserves, extraction, and production.
- midstream: pipelines, gathering, processing, storage, transportation, tankers, LNG liquefaction, and LNG terminals.
- downstream: refining, petrochemicals, fuel distribution, gas stations, and end-product sales.
- null: macro, finance, policy, geopolitical, company-wide, multi-stage, or non-oil-and-gas stories where no single stage is dominant.

Energy-topic definitions:
- oil: crude oil, petroleum, refined fuels, or oil products.
- natural_gas: natural gas excluding stories that are only about LNG.
- lng: liquefied natural gas; include natural_gas too when the broader gas market is material.
- renewables: solar, wind, hydro, geothermal, bioenergy, or renewable projects.
- hydrogen: hydrogen production, transport, or use.
- carbon: emissions, carbon markets, CCS, CCUS, or decarbonization.
- nuclear: nuclear fuel, reactors, or nuclear power.

Rules:
1. Select exactly one category based on the article's dominant angle.
2. Select one value_chain only when a single stage clearly applies; otherwise return null.
3. Select zero or more energy_topics only from the fixed list.
4. Classify the main subject, not incidental keyword mentions.
5. Base the answer only on the supplied article.`

const OUTPUT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    category: { type: 'string', enum: CATEGORIES },
    value_chain: {
      anyOf: [
        { type: 'string', enum: VALUE_CHAINS },
        { type: 'null' },
      ],
    },
    energy_topics: {
      type: 'array',
      items: { type: 'string', enum: ENERGY_TOPICS },
    },
    confidence: { type: 'number' },
    reason: { type: 'string' },
  },
  required: ['category', 'value_chain', 'energy_topics', 'confidence', 'reason'],
}

type Classification = {
  category: typeof CATEGORIES[number]
  value_chain: typeof VALUE_CHAINS[number] | null
  energy_topics: Array<typeof ENERGY_TOPICS[number]>
  confidence: number
  reason: string
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}

function stripHtml(value: unknown) {
  return String(value ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeField(value: unknown): string {
  if (Array.isArray(value)) return value.map(normalizeField).filter(Boolean).join('; ')
  if (value && typeof value === 'object') return JSON.stringify(value)
  return stripHtml(value)
}

function buildArticleText(article: Record<string, unknown>) {
  const text = [
    ['Title', article.title],
    ['Summary', article.summary],
    ['Description', article.description],
    ['Content', article.content],
    ['Key points', article.key_points],
    ['Technical takeaways', article.technical_takeaways],
    ['Existing category', article.category],
  ]
    .map(([label, value]) => [label, normalizeField(value)])
    .filter(([, value]) => value)
    .map(([label, value]) => `${label}: ${value}`)
    .join('\n')

  return text.length <= 14000 ? text : `${text.slice(0, 14000)}\n[truncated]`
}

function extractOutputText(response: Record<string, unknown>) {
  if (typeof response.output_text === 'string') return response.output_text

  for (const item of (response.output as Array<Record<string, unknown>>) ?? []) {
    for (const content of (item.content as Array<Record<string, unknown>>) ?? []) {
      if (content.type === 'output_text' && typeof content.text === 'string') return content.text
      if (content.type === 'refusal') throw new Error(`Model refused: ${content.refusal}`)
    }
  }
  throw new Error('OpenAI response did not contain output text.')
}

function validateClassification(value: Classification): Classification {
  if (!CATEGORIES.includes(value?.category)) throw new Error('Invalid category returned by model.')
  if (value.value_chain !== null && !VALUE_CHAINS.includes(value.value_chain)) {
    throw new Error('Invalid value_chain returned by model.')
  }
  if (!Array.isArray(value.energy_topics) || value.energy_topics.some((topic) => !ENERGY_TOPICS.includes(topic))) {
    throw new Error('Invalid energy_topics returned by model.')
  }
  if (!Number.isFinite(value.confidence) || value.confidence < 0 || value.confidence > 1) {
    throw new Error('Invalid confidence returned by model.')
  }
  return { ...value, energy_topics: [...new Set(value.energy_topics)] }
}

async function classify(article: Record<string, unknown>, openaiKey: string, model: string) {
  const input = buildArticleText(article)
  if (!input) throw new Error('Article has no classifiable text.')

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${openaiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      instructions: SYSTEM_PROMPT,
      input,
      text: {
        format: {
          type: 'json_schema',
          name: 'news_classification',
          strict: true,
          schema: OUTPUT_SCHEMA,
        },
      },
    }),
  })

  const rawBody = await response.text()
  let body: Record<string, any> = {}
  try {
    body = rawBody ? JSON.parse(rawBody) : {}
  } catch {
    throw new Error(`OpenAI API returned a non-JSON response (${response.status}): ${rawBody.slice(0, 500)}`)
  }

  if (!response.ok) {
    const apiMessage = typeof body?.error?.message === 'string'
      ? body.error.message
      : rawBody.slice(0, 500) || response.statusText || 'Unknown OpenAI API error'
    throw new Error(`OpenAI API ${response.status}: ${apiMessage}`)
  }
  return validateClassification(JSON.parse(extractOutputText(body)))
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const functionSecret = Deno.env.get('CLASSIFY_NEWS_SECRET')
  if (!functionSecret || request.headers.get('x-classify-secret') !== functionSecret) {
    return json({ error: 'Unauthorized' }, 401)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const legacyServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  let platformSecretKey: string | undefined
  try {
    const secretKeys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}')
    platformSecretKey = secretKeys.default
  } catch {
    return json({ error: 'SUPABASE_SECRET_KEYS is not valid JSON.' }, 500)
  }
  const databaseSecretKey = platformSecretKey || legacyServiceRoleKey
  const openaiKey = Deno.env.get('OPENAI_API_KEY')
  const model = Deno.env.get('OPENAI_MODEL') || 'gpt-5-mini'

  const missingSecrets = [
    !supabaseUrl && 'SUPABASE_URL',
    !databaseSecretKey && 'SUPABASE_SECRET_KEYS/SUPABASE_SERVICE_ROLE_KEY',
    !openaiKey && 'OPENAI_API_KEY',
  ].filter(Boolean)
  if (missingSecrets.length) {
    return json({ error: 'Missing required function secrets.', missing: missingSecrets }, 500)
  }

  try {
    const payload = await request.json().catch(() => ({}))
    const articleId = Number.isInteger(payload.article_id) ? payload.article_id : null
    const startAfter = Number.isInteger(payload.start_after) ? payload.start_after : 0
    const requestedLimit = Number.isInteger(payload.limit) ? payload.limit : 10
    const limit = Math.min(Math.max(requestedLimit, 1), 20)
    const minConfidence = typeof payload.min_confidence === 'number'
      ? Math.min(Math.max(payload.min_confidence, 0), 1)
      : 0

    const supabase = createClient(supabaseUrl, databaseSecretKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    let query = supabase.from('news_articles').select('*')
    query = articleId
      ? query.eq('id', articleId).limit(1)
      : query.gt('id', startAfter).order('id', { ascending: true }).limit(limit)

    const { data: articles, error: readError } = await query
    if (readError) throw new Error(`Supabase read failed: ${readError.message}`)

    const results = []
    for (const article of articles ?? []) {
      try {
        const classification = await classify(article, openaiKey, model)
        let status = 'low_confidence'

        if (classification.confidence >= minConfidence) {
          const { error: updateError } = await supabase
            .from('news_articles')
            .update({
              category: classification.category,
              value_chain: classification.value_chain,
              energy_topics: classification.energy_topics,
            })
            .eq('id', article.id)

          if (updateError) throw new Error(`Supabase update failed: ${updateError.message}`)
          status = 'written'
        }

        results.push({
          id: article.id,
          status,
          ...classification,
        })
      } catch (error) {
        results.push({
          id: article.id,
          status: 'failed',
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    const lastId = articles?.length ? articles[articles.length - 1].id : startAfter
    const { count: remaining, error: countError } = await supabase
      .from('news_articles')
      .select('id', { count: 'exact', head: true })
      .gt('id', lastId)

    return json({
      processed: results.length,
      remaining: countError ? null : remaining,
      next_start_after: lastId,
      model,
      results,
    })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : String(error) }, 500)
  }
})
