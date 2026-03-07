/**
 * @fileoverview Unified content ingestion pipeline for The Change Engine.
 *
 * This is step 1 of the content pipeline. It accepts URLs (single, batch, or
 * pre-scraped items) and drives the full ingestion flow:
 *
 *   1. **Scrape** -- fetch the URL, strip HTML, extract metadata and links.
 *   2. **Classify** -- send full extracted text to Claude with the complete
 *      taxonomy prompt; receive theme, focus-area, SDG, NTEE, AIRS, SDOH,
 *      audience, and action-item classifications.
 *   3. **Review** -- create `content_inbox` and `content_review_queue` rows;
 *      all content goes to `needs_review` / `pending` — nothing is
 *      auto-published. An admin must approve via the review dashboard.
 *   4. **Translate** -- translate the 6th-grade title and summary to Spanish
 *      (LANG-ES) and Vietnamese (LANG-VI) via Claude.
 *   5. **Extract orgs** -- pull organization names/URLs from the Claude
 *      response and upsert them into `organizations` / `org_domains`.
 *
 * Two request shapes are supported:
 *   - **URL mode:** `{ "url": "..." }` or `{ "urls": [...] }` -- the route
 *     fetches and scrapes each URL before classifying.
 *   - **Pre-scraped batch mode:** `{ "items": [...] }` -- callers supply
 *     already-extracted text, skipping the fetch/scrape step.
 *
 * SSRF protection: {@link validateUrl} rejects private/internal IP ranges,
 * localhost, and link-local addresses before any outbound fetch is made.
 *
 * Auth: every request is validated by {@link validateApiRequest} from
 * `@/lib/api-auth`.
 *
 * Environment variables: `ANTHROPIC_API_KEY`, `SUPABASE_SECRET_KEY` (or
 * `NEXT_PUBLIC_SUPABASE_ANON_KEY` as fallback), `NEXT_PUBLIC_SUPABASE_URL`.
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateApiRequest } from '@/lib/api-auth'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY!
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || ''

// ── Supabase REST helpers ──────────────────────────────────────────────

async function supaRest(method: string, path: string, body?: unknown) {
  const headers: Record<string, string> = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
  }
  if (method === 'POST') headers['Prefer'] = 'return=representation'
  if (method === 'PATCH') headers['Prefer'] = 'return=representation'

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Supabase ${method} ${path}: ${res.status} ${text}`)
  }
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

async function supaUpsert(table: string, body: Record<string, unknown>, conflictCol: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?on_conflict=${conflictCol}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation,resolution=merge-duplicates',
    },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

async function supaJunctionInsert(table: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=ignore-duplicates,return=minimal',
      },
      body: JSON.stringify(rows),
    })
    if (!res.ok) {
      const errText = await res.text()
      console.error(`Junction insert ${table} failed: ${res.status} ${errText}`)
    }
  } catch (e) {
    console.error(`Junction insert ${table} error:`, (e as Error).message)
  }
}

/**
 * Populate all junction tables for a newly published content item.
 */
async function populateJunctionTables(contentId: string, classification: any) {
  const focusAreaIds: string[] = classification.focus_area_ids || []
  const sdgIds: string[] = classification.sdg_ids || []
  const lifeSituationIds: string[] = classification.life_situation_ids || []
  const audienceSegmentIds: string[] = classification.audience_segment_ids || []
  const serviceCatIds: string[] = classification.service_cat_ids || []
  const skillIds: string[] = classification.skill_ids || []
  const neighborhoods: string[] = classification.locations?.neighborhoods || []
  const zipCodes: string[] = classification.locations?.zip_codes || []

  const pathwayRows: Record<string, unknown>[] = []
  if (classification.theme_primary) {
    pathwayRows.push({ content_id: contentId, theme_id: classification.theme_primary, is_primary: true })
  }
  for (const themeId of (classification.theme_secondary || [])) {
    pathwayRows.push({ content_id: contentId, theme_id: themeId, is_primary: false })
  }

  await Promise.allSettled([
    supaJunctionInsert('content_focus_areas', focusAreaIds.map(fid => ({ content_id: contentId, focus_id: fid }))),
    supaJunctionInsert('content_sdgs', sdgIds.map(sid => ({ content_id: contentId, sdg_id: sid }))),
    supaJunctionInsert('content_life_situations', lifeSituationIds.map(lid => ({ content_id: contentId, situation_id: lid }))),
    supaJunctionInsert('content_audience_segments', audienceSegmentIds.map(aid => ({ content_id: contentId, segment_id: aid }))),
    supaJunctionInsert('content_pathways', pathwayRows),
    supaJunctionInsert('content_service_categories', serviceCatIds.map(scId => ({ content_id: contentId, service_cat_id: scId }))),
    supaJunctionInsert('content_skills', skillIds.map(skId => ({ content_id: contentId, skill_id: skId }))),
    supaJunctionInsert('content_neighborhoods', neighborhoods.map(n => ({ content_id: contentId, neighborhood: n }))),
    supaJunctionInsert('content_zip_codes', zipCodes.map(z => ({ content_id: contentId, zip_code: z }))),
  ])
}

// ── URL scraping ──────────────────────────────────────────────────────

function stripHtml(html: string): string {
  // Remove script and style tags and their content
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
  text = text.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
  text = text.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
  text = text.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
  // Convert block tags to newlines
  text = text.replace(/<\/?(p|div|br|h[1-6]|li|tr|td|th|blockquote|section|article)[^>]*>/gi, '\n')
  // Remove remaining HTML tags
  text = text.replace(/<[^>]+>/g, ' ')
  // Decode HTML entities
  text = text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
  // Collapse whitespace
  text = text.replace(/[ \t]+/g, ' ')
  text = text.replace(/\n\s*\n/g, '\n\n')
  return text.trim()
}

function extractMeta(html: string, pageUrl?: string): { title: string; description: string; image: string; domain: string } {
  const ogTitle = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"[^>]*>/i)?.[1]
    || html.match(/<meta[^>]*content="([^"]*)"[^>]*property="og:title"[^>]*>/i)?.[1]
  const ogDesc = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"[^>]*>/i)?.[1]
    || html.match(/<meta[^>]*content="([^"]*)"[^>]*property="og:description"[^>]*>/i)?.[1]
    || html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i)?.[1]
    || html.match(/<meta[^>]*content="([^"]*)"[^>]*name="description"[^>]*>/i)?.[1]
  let image = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]*)"[^>]*>/i)?.[1]
    || html.match(/<meta[^>]*content="([^"]*)"[^>]*property="og:image"[^>]*>/i)?.[1]
    || ''
  const titleTag = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]

  // Fallback: scan <img> tags if no og:image found
  if (!image) {
    const skipPattern = /1x1|pixel|track|logo|icon|avatar|favicon|badge|spacer|spinner|button/i
    const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/gi
    let imgMatch
    while ((imgMatch = imgRegex.exec(html)) !== null) {
      const src = imgMatch[0]
      const imgSrc = imgMatch[1]
      // Skip tiny/utility images
      if (skipPattern.test(imgSrc) || skipPattern.test(src)) continue
      // Skip data URIs and SVGs
      if (imgSrc.startsWith('data:') || imgSrc.endsWith('.svg')) continue
      // Skip images with explicit tiny dimensions
      const widthMatch = src.match(/width="(\d+)"/i)
      const heightMatch = src.match(/height="(\d+)"/i)
      if (widthMatch && parseInt(widthMatch[1]) < 50) continue
      if (heightMatch && parseInt(heightMatch[1]) < 50) continue

      // Resolve relative URLs
      try {
        image = pageUrl ? new URL(imgSrc, pageUrl).href : imgSrc
        break
      } catch {
        continue
      }
    }
  }

  return {
    title: ogTitle || titleTag || '',
    description: ogDesc || '',
    image,
    domain: '',
  }
}

function extractLinks(html: string, baseUrl: string): { external: Array<{url: string; anchor: string; domain: string}>; internal: Array<{url: string; anchor: string; slug: string}> } {
  const linkRegex = /<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi
  const external: Array<{url: string; anchor: string; domain: string}> = []
  const internal: Array<{url: string; anchor: string; slug: string}> = []
  const baseDomain = new URL(baseUrl).hostname

  let match
  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1]
    const anchor = match[2].replace(/<[^>]+>/g, '').trim()
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('javascript:')) continue

    try {
      const url = new URL(href, baseUrl)
      const domain = url.hostname
      if (domain === baseDomain || domain.endsWith('.' + baseDomain)) {
        const slug = url.pathname.replace(/\/$/, '').split('/').pop() || ''
        if (slug && anchor) internal.push({ url: url.href, anchor, slug })
      } else if (anchor && url.protocol.startsWith('http')) {
        external.push({ url: url.href, anchor, domain })
      }
    } catch { /* invalid URL, skip */ }
  }

  return { external, internal }
}

/**
 * Validate a URL for safety before fetching.
 *
 * Guards against SSRF by rejecting private/internal IP ranges (RFC 1918),
 * localhost, link-local, and cloud metadata endpoints. Only `http:` and
 * `https:` schemes are permitted.
 *
 * @param url - The raw URL string to validate.
 * @throws {Error} If the URL is malformed, non-HTTP(S), or targets a private address.
 */
function validateUrl(url: string): void {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new Error('Invalid URL')
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Only http/https URLs are allowed')
  }
  const hostname = parsed.hostname.toLowerCase()
  // Block private/internal IPs and localhost
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname === '[::1]' ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    /^10\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
    /^192\.168\./.test(hostname) ||
    /^169\.254\./.test(hostname) ||
    hostname === 'metadata.google.internal'
  ) {
    throw new Error('Internal/private URLs are not allowed')
  }
}

/**
 * Fetch a URL, extract its text content, metadata, and links.
 *
 * Validates the URL via {@link validateUrl} first (SSRF protection), then
 * fetches with a 15-second timeout. The raw HTML is processed to extract:
 *   - Full plain text (HTML stripped, nav/footer removed)
 *   - OpenGraph / meta-tag metadata (title, description, image)
 *   - Internal and external hyperlinks
 *   - Download links (PDFs, docs, spreadsheets, etc.)
 *
 * @param url - A public HTTP(S) URL to scrape.
 * @returns Scraped content including full text, metadata, and categorized links.
 * @throws {Error} On fetch failure, timeout, or SSRF-blocked URL.
 */
async function scrapeUrl(url: string): Promise<{
  fullText: string
  meta: { title: string; description: string; image: string; domain: string }
  externalLinks: Array<{url: string; anchor: string; domain: string}>
  internalLinks: Array<{url: string; anchor: string; slug: string}>
  downloadLinks: Array<{url: string; anchor: string}>
}> {
  validateUrl(url)
  const res = await fetch(url, {
    headers: { 'User-Agent': 'ChangeEngine/1.0 (+https://changeengine.us)' },
    redirect: 'follow',
    signal: AbortSignal.timeout(15000),
  })

  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`)

  const html = await res.text()
  const meta = extractMeta(html, url)
  meta.domain = new URL(url).hostname

  const fullText = stripHtml(html)
  const { external, internal } = extractLinks(html, url)

  // Find download links (PDFs, docs, etc.)
  const downloadLinks = external
    .filter(l => /\.(pdf|doc|docx|xls|xlsx|csv|ppt|pptx|zip)$/i.test(l.url))
    .map(l => ({ url: l.url, anchor: l.anchor }))

  return { fullText, meta, externalLinks: external, internalLinks: internal, downloadLinks }
}

// ── Taxonomy ──────────────────────────────────────────────────────────

/**
 * Load the full classification taxonomy from Supabase.
 *
 * Fetches themes, focus areas, SDGs, SDOH domains, NTEE/AIRS codes,
 * audience segments, life situations, resource types, service categories,
 * and skills in parallel. The result is used to build the Claude
 * classification prompt and to validate AI-returned IDs.
 *
 * @returns An object keyed by taxonomy dimension, each containing an array of rows.
 */
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

/**
 * Serialize the full taxonomy into a text prompt for Claude classification.
 *
 * Encodes the object type model (news vs resources), engagement levels,
 * and every classification dimension: themes, focus areas, audience segments,
 * life situations, resource types (content format), service categories,
 * skills, time commitments, action types, and government levels.
 *
 * @param tax - The taxonomy object returned by {@link fetchTaxonomy}.
 * @returns A multi-line string ready to embed in a Claude system prompt.
 */
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

CONTENT TYPE (pick 1 — REQUIRED): article | event | report | video | opportunity | guide | course | announcement | campaign | tool

GEOGRAPHIC SCOPE: Houston | Harris County | Texas | National | Global`
}

// ── Claude helpers ────────────────────────────────────────────────────

function parseClaudeJson(raw: string): any {
  let text = raw.trim()
  if (text.startsWith('```json')) text = text.slice(7)
  else if (text.startsWith('```')) text = text.slice(3)
  if (text.endsWith('```')) text = text.slice(0, -3)
  text = text.trim()
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('No JSON object found')
  return JSON.parse(text.substring(start, end + 1))
}

async function callClaude(system: string, user: string, maxTokens = 3000): Promise<string> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: maxTokens,
          system,
          messages: [{ role: 'user', content: user }],
        }),
        signal: AbortSignal.timeout(30000),
      })
      const data = await res.json()
      if (data.error) {
        if (attempt < 2) { await new Promise(r => setTimeout(r, 2000 * (attempt + 1))); continue }
        throw new Error(data.error.message || 'Claude API error')
      }
      return data.content?.[0]?.text || ''
    } catch (e) {
      if (attempt < 2) { await new Promise(r => setTimeout(r, 2000 * (attempt + 1))); continue }
      throw e
    }
  }
  throw new Error('Max retries exceeded')
}

// ── Translation helper ────────────────────────────────────────────────

const TRANSLATE_SYSTEM = `You are a professional translator for The Change Engine, a civic engagement platform in Houston, Texas.
Translate civic content simplified to a 5th/6th-grade reading level.
CRITICAL: Maintain reading level, keep proper nouns in original form, use Southern Vietnamese dialect for Vietnamese.
Respond with JSON only. No markdown, no backticks.`

async function translateItem(
  title: string,
  summary: string,
  langCode: string,
  langName: string,
): Promise<{ title: string; summary: string }> {
  const raw = await callClaude(
    TRANSLATE_SYSTEM,
    `Translate to ${langName}. Return JSON with "title" and "summary" keys only.\n\nTitle: ${title}\nSummary: ${summary}`,
    2000,
  )
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim()
  return JSON.parse(cleaned)
}

// ── Multi-event extraction ────────────────────────────────────────────

/**
 * Detect if a page contains multiple distinct events and extract each one.
 *
 * Makes a second Claude call asking specifically about multiple events on the page.
 * If 2+ events are found, creates separate inbox + review queue entries for each.
 * Returns null if the page contains only a single event (handled normally).
 */
async function extractMultipleEvents(
  fullText: string,
  meta: { title: string; description: string; image: string; domain: string },
  sourceUrl: string,
  taxonomy: Awaited<ReturnType<typeof fetchTaxonomy>>,
  taxonomyPrompt: string,
  parentInboxId: string,
  validFocusIds: Set<any>,
  orgId?: string | null,
): Promise<Array<{ inbox_id: string; title: string }> | null> {
  const extractPrompt = `You are analyzing a web page that may contain MULTIPLE distinct events (like a calendar, event listing, or events page).

Look at the text and determine:
1. Does this page list MULTIPLE separate events with their own names/dates/details?
2. If yes, extract EACH individual event.

If this page describes only ONE event, return: {"single_event": true}

If this page lists MULTIPLE events, return:
{
  "single_event": false,
  "events": [
    {
      "title_6th_grade": "Clear, simple event title (max 80 chars)",
      "summary_6th_grade": "What this event is about in 2-3 sentences at 6th grade level",
      "event_start_date": "ISO 8601 datetime or null",
      "event_end_date": "ISO 8601 datetime or null",
      "location": "Event location or null",
      "registration_url": "Registration/RSVP URL or null",
      "is_virtual": false
    }
  ]
}

Extract up to 20 events. Return JSON only.`

  const userMsg = `Page title: ${meta.title}
URL: ${sourceUrl}
Source: ${meta.domain}

PAGE TEXT:
${fullText.substring(0, 8000)}`

  const rawResponse = await callClaude(extractPrompt, userMsg, 4000)
  const parsed = parseClaudeJson(rawResponse)

  if (parsed.single_event || !parsed.events || !Array.isArray(parsed.events) || parsed.events.length < 2) {
    return null
  }

  // Multiple events found — create separate inbox entries for each
  const results: Array<{ inbox_id: string; title: string }> = []

  for (const event of parsed.events) {
    const eventInboxId = crypto.randomUUID()
    const eventTitle = event.title_6th_grade || 'Untitled Event'
    const eventSummary = event.summary_6th_grade || ''

    // Create inbox entry for this event
    await supaRest('POST', 'content_inbox', {
      id: eventInboxId,
      source_url: sourceUrl,
      source_domain: meta.domain,
      title: eventTitle,
      description: eventSummary,
      image_url: meta.image || null,
      extracted_text: JSON.stringify({
        full_text: `${eventTitle}\n\n${eventSummary}\n\nLocation: ${event.location || 'TBD'}\nDate: ${event.event_start_date || 'TBD'}`,
        tags: [],
        external_links: [],
        internal_links: [],
        download_links: [],
        parent_inbox_id: parentInboxId,
      }),
      status: 'needs_review',
      content_type: 'event',
      ...(orgId ? { org_id: orgId } : {}),
    })

    // Build a basic classification for each event
    const eventClassification: any = {
      title_6th_grade: eventTitle,
      summary_6th_grade: eventSummary,
      content_type: 'event',
      event_start_date: event.event_start_date || null,
      event_end_date: event.event_end_date || null,
      action_items: {
        attend_url: event.registration_url || null,
        register_url: event.registration_url || null,
      },
      geographic_scope: 'Houston',
      confidence: 0.75,
      reasoning: `Extracted from multi-event page: ${meta.title}`,
      _version: 'v3-multi-event',
    }

    // Create review queue entry
    await supaRest('POST', 'content_review_queue', {
      inbox_id: eventInboxId,
      ai_classification: eventClassification,
      confidence: 0.75,
      review_status: 'pending',
      ...(orgId ? { org_id: orgId } : {}),
    })

    results.push({ inbox_id: eventInboxId, title: eventTitle })

    // Small delay between events
    if (results.length < parsed.events.length) {
      await new Promise(r => setTimeout(r, 300))
    }
  }

  // Log the multi-event extraction
  await supaRest('POST', 'ingestion_log', {
    event_type: 'multi_event_extract',
    source: meta.domain,
    source_url: sourceUrl,
    status: 'success',
    message: `Extracted ${results.length} events from listing page: ${meta.title}`,
    item_count: results.length,
  })

  return results
}

/**
 * Detect if a page contains multiple distinct news articles and extract each one.
 *
 * Works the same as extractMultipleEvents but for news listing / roundup pages.
 * Each article gets its own inbox + review queue entry with content_type = 'article'.
 * Returns null if the page contains only a single article.
 */
async function extractMultipleArticles(
  fullText: string,
  meta: { title: string; description: string; image: string; domain: string },
  sourceUrl: string,
  taxonomy: Awaited<ReturnType<typeof fetchTaxonomy>>,
  taxonomyPrompt: string,
  parentInboxId: string,
  validFocusIds: Set<any>,
  orgId?: string | null,
): Promise<Array<{ inbox_id: string; title: string }> | null> {
  const extractPrompt = `You are analyzing a web page that may contain MULTIPLE distinct news articles or stories (like a news feed, blog listing, roundup, or newsletter).

Look at the text and determine:
1. Does this page list MULTIPLE separate news articles/stories with their own headlines and content?
2. If yes, extract EACH individual article.

If this page describes only ONE article or story, return: {"single_article": true}

If this page lists MULTIPLE articles/stories, return:
{
  "single_article": false,
  "articles": [
    {
      "title_6th_grade": "Clear, simple headline (max 80 chars, 6th grade reading level)",
      "summary_6th_grade": "Summary of this article in 2-4 sentences at 6th grade level, capturing all key information",
      "source_url": "Direct URL to the individual article if available, null otherwise",
      "image_url": "Image URL if mentioned, null otherwise",
      "published_date": "ISO 8601 date if mentioned, null otherwise"
    }
  ]
}

Extract up to 25 articles. Return JSON only.`

  const userMsg = `Page title: ${meta.title}
URL: ${sourceUrl}
Source: ${meta.domain}

PAGE TEXT:
${fullText.substring(0, 8000)}`

  const rawResponse = await callClaude(extractPrompt, userMsg, 4000)
  const parsed = parseClaudeJson(rawResponse)

  if (parsed.single_article || !parsed.articles || !Array.isArray(parsed.articles) || parsed.articles.length < 2) {
    return null
  }

  const results: Array<{ inbox_id: string; title: string }> = []

  for (const article of parsed.articles) {
    const articleInboxId = crypto.randomUUID()
    const articleTitle = article.title_6th_grade || 'Untitled Article'
    const articleSummary = article.summary_6th_grade || ''

    // Create inbox entry
    await supaRest('POST', 'content_inbox', {
      id: articleInboxId,
      source_url: article.source_url || sourceUrl,
      source_domain: meta.domain,
      title: articleTitle,
      description: articleSummary,
      image_url: article.image_url || meta.image || null,
      extracted_text: JSON.stringify({
        full_text: `${articleTitle}\n\n${articleSummary}`,
        tags: [],
        external_links: [],
        internal_links: [],
        download_links: [],
        parent_inbox_id: parentInboxId,
      }),
      status: 'needs_review',
      content_type: 'article',
      ...(orgId ? { org_id: orgId } : {}),
    })

    const articleClassification: any = {
      title_6th_grade: articleTitle,
      summary_6th_grade: articleSummary,
      content_type: 'article',
      geographic_scope: 'Houston',
      confidence: 0.70,
      reasoning: `Extracted from multi-article page: ${meta.title}`,
      _version: 'v3-multi-article',
    }

    await supaRest('POST', 'content_review_queue', {
      inbox_id: articleInboxId,
      ai_classification: articleClassification,
      confidence: 0.70,
      review_status: 'pending',
      ...(orgId ? { org_id: orgId } : {}),
    })

    results.push({ inbox_id: articleInboxId, title: articleTitle })

    if (results.length < parsed.articles.length) {
      await new Promise(r => setTimeout(r, 300))
    }
  }

  await supaRest('POST', 'ingestion_log', {
    event_type: 'multi_article_extract',
    source: meta.domain,
    source_url: sourceUrl,
    status: 'success',
    message: `Extracted ${results.length} articles from listing page: ${meta.title}`,
    item_count: results.length,
  })

  return results
}

// ── Main ingest pipeline ──────────────────────────────────────────────

/**
 * Run the full ingestion pipeline for a single URL.
 *
 * Orchestrates every stage: dedup check, scrape, inbox creation, Claude
 * classification, focus-area validation and taxonomy inheritance, review
 * queue insertion, Spanish + Vietnamese translation, organization
 * extraction, and ingestion logging.
 *
 * @param url - The public URL to ingest.
 * @param taxonomy - Pre-fetched taxonomy (shared across a batch).
 * @param taxonomyPrompt - Pre-built taxonomy prompt string for Claude.
 * @returns A result object with `success`, classification metadata, and
 *   counts of translations/orgs created.
 */
async function ingestUrl(
  url: string,
  taxonomy: Awaited<ReturnType<typeof fetchTaxonomy>>,
  taxonomyPrompt: string,
): Promise<any> {
  const validFocusIds = new Set(taxonomy.focusAreas.map((f: any) => f.focus_id))

  // Step 1: Check for duplicates
  const existing = await supaRest('GET', `content_inbox?source_url=eq.${encodeURIComponent(url)}&select=id,status&limit=1`)
  if (existing && existing.length > 0) {
    return { success: false, stage: 'dedup', error: 'URL already ingested', inbox_id: existing[0].id }
  }

  // Step 2: Scrape the URL
  let scraped
  try {
    scraped = await scrapeUrl(url)
  } catch (e) {
    return { success: false, stage: 'scrape', error: `Failed to fetch URL: ${(e as Error).message}` }
  }

  const { fullText, meta, externalLinks, internalLinks, downloadLinks } = scraped
  if (fullText.length < 100) {
    return { success: false, stage: 'scrape', error: 'Insufficient content extracted (< 100 chars)' }
  }

  // Step 3: Create inbox entry
  const inboxId = crypto.randomUUID()
  await supaRest('POST', 'content_inbox', {
    id: inboxId,
    source_url: url,
    source_domain: meta.domain,
    title: meta.title,
    description: meta.description,
    image_url: meta.image || null,
    extracted_text: JSON.stringify({
      full_text: fullText,
      tags: [],
      external_links: externalLinks.map(l => ({ url: l.url, anchor_text: l.anchor, domain: l.domain })),
      internal_links: internalLinks.map(l => ({ url: l.url, anchor_text: l.anchor, slug: l.slug })),
      download_links: downloadLinks.map(l => ({ url: l.url, anchor_text: l.anchor })),
    }),
    status: 'pending',
  })

  // Step 4: Classify + enrich with full text (single Claude call)
  const systemPrompt = `You are the Change Engine v3 knowledge graph enricher for Houston, Texas civic content.

CRITICAL: You are classifying NEWSFEED content — articles, videos, research, reports, DIY activities, courses. This is NOT community resource classification. News flows as a per-pathway feed. Resources are separate entity types (services, organizations, benefits).

You have the FULL article text. Your job is to identify EVERY dimension:
1. Write a clear, engaging title at 6th-grade reading level (max 80 chars)
2. Write a comprehensive summary at 6th-grade reading level (150-300 words) capturing ALL key information
3. Identify the ORGANIZATION(s) responsible — who published or is featured
4. Identify the LOCATION(s) — neighborhoods, ZIP codes, districts
5. Identify the SERVICE(s) referenced — what civic services are mentioned
6. Classify the OBJECT TYPE — what format is this (video, report, article, course, etc.)
7. Classify the THEME/PATHWAY — which of the 7 pathways
8. Classify the FOCUS AREA(s) — specific topics within the pathway
9. Classify the ENGAGEMENT LEVEL — Learning, Action, Resource, or Accountability
10. Identify TIME COMMITMENT — how long to engage with this
11. Identify ACTION TYPE(s) — what actions can someone take
12. Identify WHO this is for — audience segments
13. Identify WHAT LIFE SITUATION this addresses
14. Extract action items (donate, volunteer, sign up, etc.)
15. Extract keywords

The summary should be detailed enough that if the original source disappears, a reader would still understand everything.

${taxonomyPrompt}`

  const userPrompt = `Title: ${meta.title}
URL: ${url}
Source: ${meta.domain}

FULL TEXT (${fullText.length} chars):
${fullText.substring(0, 6000)}

EXTERNAL LINKS:
${externalLinks.slice(0, 30).map(l => `[${l.anchor}] → ${l.url}`).join('\n')}

DOWNLOADS:
${downloadLinks.map(l => `[${l.anchor}] → ${l.url}`).join('\n')}

Return JSON:
{
  "title_6th_grade": "...",
  "summary_6th_grade": "...",
  "theme_primary": "THEME_XX",
  "theme_secondary": [],
  "focus_area_ids": ["FA_XXX"],
  "sdg_ids": ["SDG_XX"],
  "sdoh_code": "SDOH_XX",
  "ntee_codes": ["X"],
  "airs_codes": ["X"],
  "center": "Learning|Action|Resource|Accountability",
  "resource_type_id": "RTYPE_XX",
  "audience_segment_ids": ["SEG_XX"],
  "life_situation_ids": ["SIT_XXX"],
  "service_cat_ids": ["SCAT_XX"],
  "skill_ids": ["SKILL_XX"],
  "time_commitment_id": "TIME_XX or null",
  "action_type_ids": ["ATYPE_XX"],
  "gov_level_id": "GOV_XX or null",
  "content_type": "article|event|report|video|opportunity|guide|course|announcement|campaign|tool",
  "action_items": {"donate_url":null,"volunteer_url":null,"signup_url":null,"phone":null,"apply_url":null,"register_url":null,"attend_url":null},
  "event_start_date": "ISO 8601 datetime if this is an event, null otherwise",
  "event_end_date": "ISO 8601 datetime if event has end date, null otherwise",
  "organizations": [{"name":"...","url":"https://...","description":"..."}],
  "locations": {"neighborhoods":[],"zip_codes":[],"city":"Houston","district":""},
  "keywords": ["keyword1","keyword2"],
  "geographic_scope": "Houston|Harris County|Texas|National|Global",
  "confidence": 0.0,
  "reasoning": "..."
}`

  let classification: any
  try {
    const rawResponse = await callClaude(systemPrompt, userPrompt, 3000)
    classification = parseClaudeJson(rawResponse)
  } catch (e) {
    await supaRest('PATCH', `content_inbox?id=eq.${inboxId}`, { status: 'flagged' })
    return { success: false, stage: 'classify', error: `Classification failed: ${(e as Error).message}`, inbox_id: inboxId }
  }

  // Step 4b: Multi-item extraction — split listing pages into individual items
  // Resolve source org early so child items inherit it
  let earlyOrgId: string | null = null
  const earlyDomainMatch = await supaRest('GET', `org_domains?domain=eq.${encodeURIComponent(meta.domain)}&select=org_id`).catch(() => [])
  if (earlyDomainMatch && earlyDomainMatch.length > 0) {
    earlyOrgId = earlyDomainMatch[0].org_id
  }

  const isEventListing = classification.content_type === 'event'
  const isNewsListing = classification.content_type === 'article' && fullText.length > 3000
  if (isEventListing || isNewsListing) {
    try {
      const multiResult = isEventListing
        ? await extractMultipleEvents(fullText, meta, url, taxonomy, taxonomyPrompt, inboxId, validFocusIds, earlyOrgId)
        : await extractMultipleArticles(fullText, meta, url, taxonomy, taxonomyPrompt, inboxId, validFocusIds, earlyOrgId)
      if (multiResult) {
        const listingType = isEventListing ? 'event_listing' : 'news_listing'
        await supaRest('PATCH', `content_inbox?id=eq.${inboxId}`, { status: 'processed', content_type: listingType })
        return {
          success: true,
          inbox_id: inboxId,
          stage: isEventListing ? 'multi_event' : 'multi_article',
          title: meta.title,
          items_extracted: multiResult.length,
          items: multiResult,
        }
      }
    } catch (e) {
      console.error('Multi-item extraction failed, continuing with single item:', (e as Error).message)
    }
  }

  // Step 5: Validate + enrich focus areas
  const enrichedFocusAreas: any[] = []
  const inheritedSdgs = new Set<string>()
  const inheritedNtee = new Set<string>()
  const inheritedAirs = new Set<string>()
  let inheritedSdoh = ''

  for (const faId of (classification.focus_area_ids || [])) {
    if (validFocusIds.has(faId)) {
      const fa = taxonomy.focusAreas.find((f: any) => f.focus_id === faId)
      if (fa) {
        enrichedFocusAreas.push(fa)
        if (fa.sdg_id) inheritedSdgs.add(fa.sdg_id)
        if (fa.ntee_code) inheritedNtee.add(fa.ntee_code)
        if (fa.airs_code) inheritedAirs.add(fa.airs_code)
        if (fa.sdoh_code && !inheritedSdoh) inheritedSdoh = fa.sdoh_code
      }
    }
  }

  const validFocusAreaIds = enrichedFocusAreas.map((fa: any) => fa.focus_id)
  const allSdgIds = Array.from(new Set([...Array.from(inheritedSdgs), ...(classification.sdg_ids || [])]))
  const allNteeCodes = Array.from(new Set([...Array.from(inheritedNtee), ...(classification.ntee_codes || [])]))
  const allAirsCodes = Array.from(new Set([...Array.from(inheritedAirs), ...(classification.airs_codes || [])]))
  const sdohCode = classification.sdoh_code || inheritedSdoh
  const confidence = classification.confidence ?? 0.85

  // All content goes to review — no auto-publish bypass
  const status = 'needs_review'
  const reviewStatus = 'pending'

  // Step 6: Update inbox + create review queue entry
  await supaRest('PATCH', `content_inbox?id=eq.${inboxId}`, { status, content_type: classification.content_type || null })

  const enrichedClassification = {
    ...classification,
    sdg_ids: allSdgIds,
    ntee_codes: allNteeCodes,
    airs_codes: allAirsCodes,
    sdoh_code: sdohCode,
    _enriched_focus_areas: enrichedFocusAreas.map((fa: any) => ({
      id: fa.focus_id, name: fa.focus_area_name, theme: fa.theme_id,
      sdg: fa.sdg_id, ntee: fa.ntee_code, airs: fa.airs_code, sdoh: fa.sdoh_code, bridging: fa.is_bridging,
    })),
    _keywords: classification.keywords || [],
    _external_orgs: classification.organizations || [],
    _download_links: downloadLinks.map(l => ({ url: l.url, anchor_text: l.anchor })),
    _version: 'v3-deep-enrich',
  }

  await supaRest('POST', 'content_review_queue', {
    inbox_id: inboxId,
    ai_classification: enrichedClassification,
    confidence,
    review_status: reviewStatus,
  })

  // Step 7b: Populate junction tables for this content
  await populateJunctionTables(inboxId, enrichedClassification)

  // Step 8: Translate to Spanish + Vietnamese
  const translations: Record<string, any> = {}
  const title6 = classification.title_6th_grade || meta.title
  const summary6 = classification.summary_6th_grade || meta.description

  if (title6) {
    const langs = [
      { code: 'es', name: 'Spanish', id: 'LANG-ES' },
      { code: 'vi', name: 'Vietnamese', id: 'LANG-VI' },
    ]

    for (const lang of langs) {
      try {
        const result = await translateItem(title6, summary6, lang.code, lang.name)
        const idPrefix = inboxId.substring(0, 8)

        await supaUpsert('translations', {
          translation_id: `TR-${idPrefix}-${lang.code}-title`,
          content_type: 'content_published',
          content_id: inboxId,
          field_name: 'title_6th_grade',
          language_id: lang.id,
          translated_text: result.title,
          is_verified: 'No',
          machine_translated: 'Yes',
          data_source: 'Claude API',
          last_updated: new Date().toISOString(),
        }, 'translation_id')

        if (result.summary) {
          await supaUpsert('translations', {
            translation_id: `TR-${idPrefix}-${lang.code}-summary`,
            content_type: 'content_published',
            content_id: inboxId,
            field_name: 'summary_6th_grade',
            language_id: lang.id,
            translated_text: result.summary,
            is_verified: 'No',
            machine_translated: 'Yes',
            data_source: 'Claude API',
            last_updated: new Date().toISOString(),
          }, 'translation_id')
        }

        translations[lang.code] = { title: result.title, summary: result.summary }
        await new Promise(r => setTimeout(r, 500))
      } catch (e) {
        translations[lang.code] = { error: (e as Error).message }
      }
    }
  }

  // Step 9: Create organization entries + resolve org_id for this content
  const orgsCreated: string[] = []
  let resolvedOrgId: string | null = null

  // First, try to match the source domain to an existing org
  const sourceDomainMatch = await supaRest('GET', `org_domains?domain=eq.${encodeURIComponent(meta.domain)}&select=org_id`).catch(() => [])
  if (sourceDomainMatch && sourceDomainMatch.length > 0) {
    resolvedOrgId = sourceDomainMatch[0].org_id
  }

  for (const org of (classification.organizations || [])) {
    if (!org.name) continue
    const orgUrl = org.url || ''
    const domain = orgUrl.match(/https?:\/\/([^/]+)/)?.[1] || ''
    if (!domain) continue

    const domainCheck = await supaRest('GET', `org_domains?domain=eq.${encodeURIComponent(domain)}&select=org_id`).catch(() => [])
    if (domainCheck && domainCheck.length > 0) {
      orgsCreated.push(`${org.name} (exists)`)
      // If this org's domain matches the source domain, use it
      if (!resolvedOrgId && domain === meta.domain) {
        resolvedOrgId = domainCheck[0].org_id
      }
      continue
    }

    const orgId = 'ORG_ING_' + domain.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30).toUpperCase()
    try {
      await supaRest('POST', 'organizations', {
        org_id: orgId,
        org_name: org.name,
        website: orgUrl,
        description_5th_grade: org.description || '',
        focus_area_ids: validFocusAreaIds.join(','),
        data_source: meta.domain,
      })
      await supaRest('POST', 'org_domains', { org_id: orgId, domain }).catch(() => {})

      // Write to organization_focus_areas junction table
      for (const focusId of validFocusAreaIds) {
        await supaRest('POST', 'organization_focus_areas', {
          org_id: orgId,
          focus_id: focusId,
        }).catch(() => {}) // Ignore duplicates
      }

      orgsCreated.push(`${org.name} (NEW: ${orgId})`)

      // If this is the first org or matches source domain, assign it
      if (!resolvedOrgId) {
        resolvedOrgId = orgId
      }
    } catch (e) {
      const msg = (e as Error).message || ''
      if (msg.includes('duplicate') || msg.includes('23505')) {
        orgsCreated.push(`${org.name} (exists)`)
      }
    }
  }

  // Step 9b: Link resolved org to this content
  if (resolvedOrgId) {
    await supaRest('PATCH', `content_inbox?id=eq.${inboxId}`, { org_id: resolvedOrgId }).catch(() => {})
    await supaRest('PATCH', `content_review_queue?inbox_id=eq.${inboxId}`, { org_id: resolvedOrgId }).catch(() => {})
  }

  // Step 10: Log
  await supaRest('POST', 'ingestion_log', {
    event_type: 'unified_ingest',
    source: meta.domain,
    source_url: url,
    status: 'success',
    message: `Full pipeline: ${validFocusAreaIds.length}FA ${allSdgIds.length}SDG | conf:${confidence} | ${Object.keys(translations).length} translations | ${orgsCreated.length} orgs`,
    item_count: 1,
  })

  return {
    success: true,
    inbox_id: inboxId,
    stage: status,
    title: classification.title_6th_grade,
    confidence,
    focus_areas: validFocusAreaIds,
    center: classification.center,
    sdgs: allSdgIds,
    keywords: classification.keywords || [],
    organizations: orgsCreated,
    translations,
    downloads: downloadLinks.length,
    text_length: fullText.length,
  }
}

// ── Route handler ────────────────────────────────────────────────────

// ── Pre-scraped ingest (skip fetch, go straight to classify) ─────────

/**
 * Ingest a single pre-scraped item (skip the fetch/scrape stage).
 *
 * Used by the batch `items` mode where the caller has already extracted
 * text externally (e.g., government RSS feeds). The pipeline picks up
 * at inbox creation and continues through classification, review,
 * translation, and logging -- identical to {@link ingestUrl} minus the
 * scrape step.
 *
 * @param item - Pre-scraped content including URL, title, full text, and source metadata.
 * @param taxonomy - Pre-fetched taxonomy (shared across a batch).
 * @param taxonomyPrompt - Pre-built taxonomy prompt string for Claude.
 * @returns A result object with `success`, classification metadata, and translation counts.
 */
async function ingestPreScraped(
  item: { url: string; title: string; description: string; image_url: string; full_text: string; source: string; domain: string },
  taxonomy: Awaited<ReturnType<typeof fetchTaxonomy>>,
  taxonomyPrompt: string,
): Promise<any> {
  const validFocusIds = new Set(taxonomy.focusAreas.map((f: any) => f.focus_id))

  // Dedup
  const existing = await supaRest('GET', `content_inbox?source_url=eq.${encodeURIComponent(item.url)}&select=id,status&limit=1`)
  if (existing && existing.length > 0) {
    return { success: false, stage: 'dedup', error: 'Already ingested', inbox_id: existing[0].id }
  }

  if (!item.full_text || item.full_text.length < 100) {
    return { success: false, stage: 'scrape', error: 'Insufficient content (< 100 chars)' }
  }

  // Create inbox entry
  const inboxId = crypto.randomUUID()
  await supaRest('POST', 'content_inbox', {
    id: inboxId,
    source_url: item.url,
    source_domain: item.domain || new URL(item.url).hostname,
    title: item.title,
    description: item.description,
    image_url: item.image_url || null,
    extracted_text: JSON.stringify({ full_text: item.full_text, tags: [], external_links: [], internal_links: [], download_links: [] }),
    status: 'pending',
  })

  // Classify
  const systemPrompt = `You are the Change Engine v2 knowledge graph enricher for Houston, Texas civic content.
You have the FULL article text. Your job is to:
1. Write a clear, engaging title at 6th-grade reading level (max 80 chars)
2. Write a comprehensive summary at 6th-grade reading level (150-300 words) capturing ALL key information
3. Classify against the EXACT taxonomy below using valid IDs only
4. Extract ALL organizations mentioned with their URLs
5. Identify action items (donate, volunteer, sign up, etc.)
6. Extract keywords

The summary should be detailed enough that if the original source disappears, a reader would still understand everything.

${taxonomyPrompt}`

  const userPrompt = `Title: ${item.title}
URL: ${item.url}
Source: ${item.source}

FULL TEXT (${item.full_text.length} chars):
${item.full_text.substring(0, 6000)}

Return JSON:
{
  "title_6th_grade": "...",
  "summary_6th_grade": "...",
  "theme_primary": "THEME_XX",
  "theme_secondary": [],
  "focus_area_ids": ["FA_XXX"],
  "sdg_ids": ["SDG_XX"],
  "sdoh_code": "SDOH_XX",
  "ntee_codes": ["X"],
  "airs_codes": ["X"],
  "center": "Learning|Action|Resource|Accountability",
  "resource_type_id": "RTYPE_XX",
  "audience_segment_ids": ["SEG_XX"],
  "life_situation_ids": ["SIT_XXX"],
  "service_cat_ids": ["SCAT_XX"],
  "skill_ids": ["SKILL_XX"],
  "content_type": "article|event|report|video|opportunity|guide|course|announcement|campaign|tool",
  "action_items": {"donate_url":null,"volunteer_url":null,"signup_url":null,"phone":null,"apply_url":null,"register_url":null,"attend_url":null},
  "event_start_date": "ISO 8601 datetime if this is an event, null otherwise",
  "event_end_date": "ISO 8601 datetime if event has end date, null otherwise",
  "organizations": [{"name":"...","url":"https://...","description":"..."}],
  "keywords": ["keyword1","keyword2"],
  "geographic_scope": "Houston|National|Texas|Global",
  "confidence": 0.0,
  "reasoning": "..."
}`

  let classification: any
  try {
    const rawResponse = await callClaude(systemPrompt, userPrompt, 3000)
    classification = parseClaudeJson(rawResponse)
  } catch (e) {
    await supaRest('PATCH', `content_inbox?id=eq.${inboxId}`, { status: 'flagged' })
    return { success: false, stage: 'classify', error: `Classification failed: ${(e as Error).message}`, inbox_id: inboxId }
  }

  // Validate focus areas + inherit taxonomy
  const enrichedFocusAreas: any[] = []
  const inheritedSdgs = new Set<string>()
  const inheritedNtee = new Set<string>()
  const inheritedAirs = new Set<string>()
  let inheritedSdoh = ''

  for (const faId of (classification.focus_area_ids || [])) {
    if (validFocusIds.has(faId)) {
      const fa = taxonomy.focusAreas.find((f: any) => f.focus_id === faId)
      if (fa) {
        enrichedFocusAreas.push(fa)
        if (fa.sdg_id) inheritedSdgs.add(fa.sdg_id)
        if (fa.ntee_code) inheritedNtee.add(fa.ntee_code)
        if (fa.airs_code) inheritedAirs.add(fa.airs_code)
        if (fa.sdoh_code && !inheritedSdoh) inheritedSdoh = fa.sdoh_code
      }
    }
  }

  const validFocusAreaIds = enrichedFocusAreas.map((fa: any) => fa.focus_id)
  const allSdgIds = Array.from(new Set([...Array.from(inheritedSdgs), ...(classification.sdg_ids || [])]))
  const allNteeCodes = Array.from(new Set([...Array.from(inheritedNtee), ...(classification.ntee_codes || [])]))
  const allAirsCodes = Array.from(new Set([...Array.from(inheritedAirs), ...(classification.airs_codes || [])]))
  const sdohCode = classification.sdoh_code || inheritedSdoh
  const confidence = classification.confidence ?? 0.85

  // All content goes to review — no auto-publish bypass
  const preScrapedStatus = 'needs_review'
  const preScrapedReviewStatus = 'pending'

  await supaRest('PATCH', `content_inbox?id=eq.${inboxId}`, { status: preScrapedStatus, content_type: classification.content_type || null })

  const enrichedClassification = {
    ...classification,
    sdg_ids: allSdgIds,
    ntee_codes: allNteeCodes,
    airs_codes: allAirsCodes,
    sdoh_code: sdohCode,
    _enriched_focus_areas: enrichedFocusAreas.map((fa: any) => ({
      id: fa.focus_id, name: fa.focus_area_name, theme: fa.theme_id,
      sdg: fa.sdg_id, ntee: fa.ntee_code, airs: fa.airs_code, sdoh: fa.sdoh_code, bridging: fa.is_bridging,
    })),
    _keywords: classification.keywords || [],
    _external_orgs: classification.organizations || [],
    _version: 'v3-deep-enrich',
  }

  await supaRest('POST', 'content_review_queue', {
    inbox_id: inboxId,
    ai_classification: enrichedClassification,
    confidence,
    review_status: preScrapedReviewStatus,
  })

  // Populate junction tables for this content
  await populateJunctionTables(inboxId, enrichedClassification)

  // Translate
  const translations: Record<string, any> = {}
  const title6 = classification.title_6th_grade || item.title
  const summary6 = classification.summary_6th_grade || item.description

  if (title6) {
    const langs = [
      { code: 'es', name: 'Spanish', id: 'LANG-ES' },
      { code: 'vi', name: 'Vietnamese', id: 'LANG-VI' },
    ]
    for (const lang of langs) {
      try {
        const result = await translateItem(title6, summary6, lang.code, lang.name)
        const idPrefix = inboxId.substring(0, 8)
        await supaUpsert('translations', {
          translation_id: `TR-${idPrefix}-${lang.code}-title`,
          content_type: 'content_published',
          content_id: inboxId,
          field_name: 'title_6th_grade',
          language_id: lang.id,
          translated_text: result.title,
          is_verified: 'No',
          machine_translated: 'Yes',
          data_source: 'Claude API',
          last_updated: new Date().toISOString(),
        }, 'translation_id')
        if (result.summary) {
          await supaUpsert('translations', {
            translation_id: `TR-${idPrefix}-${lang.code}-summary`,
            content_type: 'content_published',
            content_id: inboxId,
            field_name: 'summary_6th_grade',
            language_id: lang.id,
            translated_text: result.summary,
            is_verified: 'No',
            machine_translated: 'Yes',
            data_source: 'Claude API',
            last_updated: new Date().toISOString(),
          }, 'translation_id')
        }
        translations[lang.code] = { title: result.title, summary: result.summary }
        await new Promise(r => setTimeout(r, 500))
      } catch (e) {
        translations[lang.code] = { error: (e as Error).message }
      }
    }
  }

  // Log
  await supaRest('POST', 'ingestion_log', {
    event_type: 'gov_ingest',
    source: item.source,
    source_url: item.url,
    status: 'success',
    message: `Gov pipeline: ${validFocusAreaIds.length}FA ${allSdgIds.length}SDG | conf:${confidence} | ${Object.keys(translations).length} translations`,
    item_count: 1,
  })

  return {
    success: true,
    inbox_id: inboxId,
    stage: preScrapedStatus,
    title: classification.title_6th_grade,
    confidence,
    focus_areas: validFocusAreaIds,
    translations: Object.keys(translations).length,
  }
}

// ── Route handler ────────────────────────────────────────────────────

/**
 * POST /api/ingest -- Next.js route handler.
 *
 * Authenticates the request via {@link validateApiRequest}, then dispatches
 * to either pre-scraped batch mode (`items` array) or standard URL mode
 * (`url` / `urls`). Taxonomy is fetched once and shared across the batch.
 */
export async function POST(req: NextRequest) {
  const authError = await validateApiRequest(req)
  if (authError) return authError

  if (!ANTHROPIC_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  const body = await req.json().catch(() => ({}))

  // Pre-scraped batch mode: { items: [{ url, title, description, image_url, full_text, source, domain }] }
  if (body.items && Array.isArray(body.items)) {
    if (body.items.length > 10) {
      return NextResponse.json({ error: 'Maximum 10 pre-scraped items per request' }, { status: 400 })
    }

    const taxonomy = await fetchTaxonomy()
    const taxonomyPrompt = buildTaxonomyPrompt(taxonomy)

    const results: any[] = []
    let succeeded = 0
    let failed = 0

    for (const item of body.items) {
      try {
        const result = await ingestPreScraped(item, taxonomy, taxonomyPrompt)
        results.push({ url: item.url, ...result })
        if (result.success) succeeded++
        else failed++
      } catch (err) {
        results.push({ url: item.url, success: false, error: (err as Error).message })
        failed++
      }
      if (results.length < body.items.length) {
        await new Promise(r => setTimeout(r, 1000))
      }
    }

    return NextResponse.json({ processed: body.items.length, succeeded, failed, results })
  }

  // Standard URL mode
  const urls: string[] = body.urls || (body.url ? [body.url] : [])

  if (urls.length === 0) {
    return NextResponse.json({ error: 'Provide "url", "urls", or "items" in request body' }, { status: 400 })
  }

  if (urls.length > 25) {
    return NextResponse.json({ error: 'Maximum 25 URLs per request' }, { status: 400 })
  }

  // Fetch taxonomy once for all URLs
  const taxonomy = await fetchTaxonomy()
  const taxonomyPrompt = buildTaxonomyPrompt(taxonomy)

  const results: any[] = []
  let succeeded = 0
  let failed = 0

  for (const url of urls) {
    try {
      const result = await ingestUrl(url, taxonomy, taxonomyPrompt)
      results.push({ url, ...result })
      if (result.success) succeeded++
      else failed++
    } catch (err) {
      results.push({ url, success: false, error: (err as Error).message })
      failed++
    }

    // Rate limit between URLs
    if (results.length < urls.length) {
      await new Promise(r => setTimeout(r, 1000))
    }
  }

  return NextResponse.json({
    processed: urls.length,
    succeeded,
    failed,
    results,
  })
}
