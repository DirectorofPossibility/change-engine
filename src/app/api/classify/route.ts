/**
 * @fileoverview Batch content classification route -- step 2 of the content pipeline.
 *
 * After content enters `content_inbox` via `/api/ingest`, this route picks up
 * pending items and classifies them against the full Change Engine taxonomy
 * using Claude. For each item it:
 *
 *   1. Sends title + description + source metadata to Claude with the taxonomy
 *      prompt.
 *   2. Validates AI-returned focus-area IDs against the database and inherits
 *      parent SDG, NTEE, AIRS, and SDOH codes from matched focus areas.
 *   3. Writes the enriched classification to `content_review_queue`.
 *   4. Updates `content_inbox.status` based on confidence thresholds
 *      (>= 0.8 classified, >= 0.5 needs_review, else flagged).
 *
 * Callers may target specific items via `inbox_ids` or process the next N
 * pending items with `batch_size`. Rate-limited at 1 s between Claude calls.
 *
 * Auth: every request is validated by {@link validateApiRequest} from
 * `@/lib/api-auth`.
 *
 * Environment variables: `ANTHROPIC_API_KEY`, `SUPABASE_SECRET_KEY`,
 * `NEXT_PUBLIC_SUPABASE_URL`.
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateApiRequest } from '@/lib/api-auth'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY!
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || ''

// ── Supabase REST helper ────────────────────────────────────────────────

async function supaRest(method: string, path: string, body?: unknown) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: method === 'POST' ? 'return=representation' : '',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Supabase ${method} ${path}: ${res.status} ${text}`)
  }
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

// ── Taxonomy ────────────────────────────────────────────────────────────

async function fetchTaxonomy() {
  const get = (table: string, select = '*') =>
    supaRest('GET', `${table}?select=${select}&limit=500`)

  const [themes, focusAreas, sdgs, sdoh, ntee, airs, segments, situations, resourceTypes, serviceCats, skills, timeCommitments, actionTypes, govLevels] = await Promise.all([
    get('themes', 'theme_id,theme_name'),
    get('focus_areas', 'focus_id,focus_area_name,theme_id,sdg_id,ntee_code,airs_code,sdoh_code,is_bridging'),
    get('sdgs', 'sdg_id,sdg_number,sdg_name'),
    get('sdoh_domains', 'sdoh_code,sdoh_name'),
    get('ntee_codes', 'ntee_code,ntee_name'),
    get('airs_codes', 'airs_code,airs_name'),
    get('audience_segments', 'segment_id,segment_name,description'),
    get('life_situations', 'situation_id,situation_name,theme_id,urgency_level'),
    get('resource_types', 'resource_type_id,resource_type_name,center'),
    get('service_categories', 'service_cat_id,service_cat_name'),
    get('skills', 'skill_id,skill_name,skill_category'),
    get('time_commitments', 'time_id,time_name,min_minutes,max_minutes'),
    get('action_types', 'action_type_id,action_type_name,category'),
    get('government_levels', 'gov_level_id,gov_level_name'),
  ])

  return { themes, focusAreas, sdgs, sdoh, ntee, airs, segments, situations, resourceTypes, serviceCats, skills, timeCommitments, actionTypes, govLevels }
}

function buildTaxonomyPrompt(tax: Awaited<ReturnType<typeof fetchTaxonomy>>): string {
  const themeList = tax.themes.map((t: any) => `${t.theme_id}: ${t.theme_name}`).join('\n')

  const faByTheme: Record<string, string[]> = {}
  for (const fa of tax.focusAreas) {
    const key = fa.theme_id || 'NONE'
    if (!faByTheme[key]) faByTheme[key] = []
    faByTheme[key].push(`${fa.focus_id}|${fa.focus_area_name}|sdg:${fa.sdg_id}|ntee:${fa.ntee_code}|airs:${fa.airs_code}|sdoh:${fa.sdoh_code}${fa.is_bridging ? '|BRIDGING' : ''}`)
  }
  let faText = ''
  for (const [themeId, fas] of Object.entries(faByTheme)) {
    const themeName = tax.themes.find((t: any) => t.theme_id === themeId)?.theme_name || themeId
    faText += `\n[${themeName}]\n${fas.join('\n')}\n`
  }

  const segList = tax.segments.map((s: any) => `${s.segment_id}: ${s.segment_name}`).join('\n')
  const sitList = tax.situations.map((s: any) => `${s.situation_id}: "${s.situation_name}" [${s.urgency_level}]`).join('\n')
  const rtList = tax.resourceTypes.map((r: any) => `${r.resource_type_id}: ${r.resource_type_name} (${r.center})`).join('\n')
  const scList = tax.serviceCats.map((s: any) => `${s.service_cat_id}: ${s.service_cat_name}`).join('\n')
  const skillList = tax.skills.map((s: any) => `${s.skill_id}: ${s.skill_name}`).join('\n')
  const timeList = tax.timeCommitments.map((t: any) => `${t.time_id}: ${t.time_name} (${t.min_minutes}-${t.max_minutes} min)`).join('\n')
  const actionList = tax.actionTypes.map((a: any) => `${a.action_type_id}: ${a.action_type_name} [${a.category}]`).join('\n')
  const govList = tax.govLevels.map((g: any) => `${g.gov_level_id}: ${g.gov_level_name}`).join('\n')

  return `## OBJECT TYPE MODEL
News is NOT resources. Content flowing through this pipeline is NEWSFEED content (articles, videos, research, reports, DIY activities, courses). Resources are separate entity types (services, organizations, benefits).

## ENGAGEMENT LEVELS (Centers)
Each piece of content serves one engagement level:
- Learning:       "How can I understand?" — news, research, reports, explainers, courses, videos
- Action:         "How can I help?"       — volunteer opportunities, campaigns, calls to action, events
- Resource:       "What's available?"      — services, organizations, benefit programs, tools
- Accountability: "Who makes decisions?"   — officials, policies, agencies, ballot items

## CLASSIFICATION DIMENSIONS
You must identify EVERY applicable dimension for each item:

THEMES / PATHWAYS (pick 1 primary + 0-2 secondary):
${themeList}

FOCUS AREAS (pick 1-4 by ID — the WHAT):
${faText}

CONTENT FORMAT / RESOURCE TYPE (pick 1 — what kind of content is this):
${rtList}

ENGAGEMENT LEVEL / CENTER (pick 1): Learning | Action | Resource | Accountability

AUDIENCE SEGMENTS (pick 1-3 — WHO is this for):
${segList}

LIFE SITUATIONS (pick 0-3 — what life situation does this address):
${sitList}

SERVICE CATEGORIES (pick 0-2 — what service domain):
${scList}

SKILLS (pick 0-3 — skills needed or taught):
${skillList}

TIME COMMITMENTS (pick 0-1 — how long to engage):
${timeList}

ACTION TYPES (pick 0-2 — what actions can someone take):
${actionList}

GOVERNMENT LEVELS (pick 0-1 — if accountability content, which level):
${govList}

GEOGRAPHIC SCOPE: Houston | Harris County | Texas | National | Global`
}

// ── Claude classification ───────────────────────────────────────────────

function parseClaudeJson(raw: string): any {
  let text = raw.trim()
  if (text.startsWith('```json')) text = text.slice(7)
  else if (text.startsWith('```')) text = text.slice(3)
  if (text.endsWith('```')) text = text.slice(0, -3)
  text = text.trim()
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error(`No JSON object found`)
  return JSON.parse(text.substring(start, end + 1))
}

async function classifyItem(
  item: { id: string; source_url: string; source_domain: string | null; title: string | null; description: string | null; image_url: string | null },
  taxonomy: Awaited<ReturnType<typeof fetchTaxonomy>>,
  taxonomyPrompt: string,
) {
  const validFocusIds = new Set(taxonomy.focusAreas.map((f: any) => f.focus_id))

  const pageTitle = item.title || ''
  const pageText = (item.description || '').substring(0, 2500)
  const sourceDomain = item.source_domain || ''

  if (!pageTitle && !pageText) {
    return { success: false, error: 'No content to classify' }
  }

  const systemPrompt = `You are the Change Engine v3 classifier for Houston, Texas civic content.

CRITICAL: You are classifying NEWSFEED content — articles, videos, research, reports, DIY activities, courses. This is NOT community resource classification. Identify EVERY dimension of the content.

For each item, identify:
- The ORGANIZATION(s) mentioned or responsible
- The LOCATION(s) — neighborhood, ZIP, city, district
- The SERVICE(s) referenced (if any)
- The OBJECT TYPE — what format is this content (video, report, article, course, etc.)
- The THEME/PATHWAY — which of the 7 pathways this belongs to
- The FOCUS AREA(s) — specific topics within the pathway
- The ENGAGEMENT LEVEL (center) — Learning, Action, Resource, or Accountability
- The TIME COMMITMENT — how long would it take to engage with this
- The ACTION TYPE(s) — what actions can someone take
- WHO this is for — audience segments
- WHAT life situation this addresses

Classify against the EXACT taxonomy below. Return ONLY valid IDs. Respond with a single JSON object, no markdown, no backticks.

${taxonomyPrompt}`

  const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: `Title: ${pageTitle}\nURL: ${item.source_url || 'N/A'}\nSource: ${sourceDomain || 'manual'}\nContent: ${pageText}\n\nReturn JSON: {"theme_primary":"THEME_XX","theme_secondary":[],"focus_area_ids":["FA_XXX"],"sdg_ids":["SDG_XX"],"sdoh_code":"SDOH_XX","ntee_codes":["X"],"airs_codes":["X"],"center":"Learning|Action|Resource|Accountability","resource_type_id":"RTYPE_XX","audience_segment_ids":["SEG_XX"],"life_situation_ids":["SIT_XXX"],"service_cat_ids":["SCAT_XX"],"skill_ids":["SKILL_XX"],"time_commitment_id":"TIME_XX or null","action_type_ids":["ATYPE_XX"],"gov_level_id":"GOV_XX or null","organizations":[{"name":"...","url":"..."}],"locations":{"neighborhoods":[],"zip_codes":[],"city":"Houston","district":""},"title_6th_grade":"...","summary_6th_grade":"...","action_items":{"donate_url":null,"volunteer_url":null,"signup_url":null,"phone":null,"apply_url":null,"register_url":null,"attend_url":null},"geographic_scope":"Houston","confidence":0.0,"reasoning":"..."}` }],
    }),
    signal: AbortSignal.timeout(30000),
  })

  if (!claudeRes.ok) {
    const errText = await claudeRes.text()
    return { success: false, error: `Claude API ${claudeRes.status}: ${errText.substring(0, 200)}` }
  }

  const claudeData = await claudeRes.json()
  const rawText = claudeData.content?.[0]?.text || ''

  let classification
  try {
    classification = parseClaudeJson(rawText)
  } catch {
    return { success: false, error: 'JSON parse failed', raw: rawText.substring(0, 200) }
  }

  // Validate + enrich
  const validation: Record<string, string[]> = { valid: [], invalid: [], enriched: [] }
  const enrichedFocusAreas: any[] = []
  const inheritedSdgs = new Set<string>()
  const inheritedNtee = new Set<string>()
  const inheritedAirs = new Set<string>()
  let inheritedSdoh = ''

  for (const faId of (classification.focus_area_ids || [])) {
    if (validFocusIds.has(faId)) {
      validation.valid.push(faId)
      const fa = taxonomy.focusAreas.find((f: any) => f.focus_id === faId)
      if (fa) {
        enrichedFocusAreas.push(fa)
        if (fa.sdg_id) inheritedSdgs.add(fa.sdg_id)
        if (fa.ntee_code) inheritedNtee.add(fa.ntee_code)
        if (fa.airs_code) inheritedAirs.add(fa.airs_code)
        if (fa.sdoh_code && !inheritedSdoh) inheritedSdoh = fa.sdoh_code
      }
    } else {
      validation.invalid.push(faId)
    }
  }

  const enriched = {
    ...classification,
    sdg_ids: Array.from(new Set([...Array.from(inheritedSdgs), ...(classification.sdg_ids || [])])),
    ntee_codes: Array.from(new Set([...Array.from(inheritedNtee), ...(classification.ntee_codes || [])])),
    airs_codes: Array.from(new Set([...Array.from(inheritedAirs), ...(classification.airs_codes || [])])),
    sdoh_code: classification.sdoh_code || inheritedSdoh,
    _enriched_focus_areas: enrichedFocusAreas.map((fa: any) => ({
      id: fa.focus_id, name: fa.focus_area_name, theme: fa.theme_id,
      sdg: fa.sdg_id, ntee: fa.ntee_code, airs: fa.airs_code, sdoh: fa.sdoh_code, bridging: fa.is_bridging,
    })),
    _validation: validation,
    _version: 'v2-full-matrix',
  }

  const confidence = enriched.confidence ?? 0
  const status = confidence >= 0.8 ? 'classified' : confidence >= 0.5 ? 'needs_review' : 'flagged'

  // Update content_inbox status
  await supaRest('PATCH', `content_inbox?id=eq.${item.id}`, { status })

  // Write to content_review_queue
  await supaRest('POST', 'content_review_queue', {
    inbox_id: item.id,
    ai_classification: enriched,
    confidence,
    review_status: status,
  })

  // Log
  await supaRest('POST', 'ingestion_log', {
    event_type: 'classify_v2',
    source: sourceDomain || 'manual',
    source_url: item.source_url,
    status: validation.invalid.length > 0 ? 'partial' : 'success',
    message: `v2-api: ${enrichedFocusAreas.length}FA ${enriched.sdg_ids.length}SDG | conf:${confidence}`,
    item_count: 1,
  })

  return {
    success: true,
    inbox_id: item.id,
    status,
    confidence,
    title_6th: enriched.title_6th_grade,
    focus_areas: validation.valid,
    center: enriched.center,
  }
}

// ── Route handler ───────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const authError = await validateApiRequest(req)
  if (authError) return authError

  if (!ANTHROPIC_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  const body = await req.json().catch(() => ({}))
  const batchSize = Math.min(body.batch_size || 10, 50)
  const inboxIds: string[] | undefined = body.inbox_ids

  if (inboxIds !== undefined && !Array.isArray(inboxIds)) {
    return NextResponse.json({ error: 'inbox_ids must be an array' }, { status: 400 })
  }

  // Fetch taxonomy once for the batch
  const taxonomy = await fetchTaxonomy()
  const taxonomyPrompt = buildTaxonomyPrompt(taxonomy)

  // Get items to classify
  let items: any[]
  if (inboxIds && inboxIds.length > 0) {
    const idFilter = inboxIds.map(id => `"${id}"`).join(',')
    items = await supaRest('GET', `content_inbox?id=in.(${idFilter})&select=id,source_url,source_domain,title,description,image_url`)
  } else {
    items = await supaRest('GET', `content_inbox?status=eq.pending&select=id,source_url,source_domain,title,description,image_url&order=created_at.asc&limit=${batchSize}`)
  }

  if (!items || items.length === 0) {
    return NextResponse.json({ message: 'No pending items to classify', processed: 0 })
  }

  const results: any[] = []
  let succeeded = 0
  let failed = 0

  for (const item of items) {
    try {
      const result = await classifyItem(item, taxonomy, taxonomyPrompt)
      results.push({ url: item.source_url, ...result })
      if (result.success) succeeded++
      else failed++
    } catch (err) {
      results.push({ url: item.source_url, success: false, error: (err as Error).message })
      failed++
    }

    // Rate limit: 1s between Claude calls
    if (items.indexOf(item) < items.length - 1) {
      await new Promise(r => setTimeout(r, 1000))
    }
  }

  return NextResponse.json({
    processed: items.length,
    succeeded,
    failed,
    results,
  })
}
