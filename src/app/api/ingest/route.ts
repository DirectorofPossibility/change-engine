/**
 * @fileoverview POST /api/ingest — Unified content ingestion pipeline.
 *
 * Accepts URLs (single, batch, or pre-scraped items) and drives the full
 * ingestion flow: scrape → classify → review → translate → extract orgs.
 *
 * Two request shapes:
 *   - URL mode: `{ "url": "..." }` or `{ "urls": [...] }`
 *   - Pre-scraped batch: `{ "items": [...] }`
 *
 * All business logic lives in ./handlers/ modules. This file is the
 * route handler only.
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateApiRequest } from '@/lib/api-auth'
import { fetchTaxonomy, buildTaxonomyPrompt } from './handlers/taxonomy'
import { ingestUrl } from './handlers/ingest-url'
import { ingestPreScraped } from './handlers/ingest-pre-scraped'

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || ''

export async function POST(req: NextRequest) {
  const authError = await validateApiRequest(req)
  if (authError) return authError

  if (!ANTHROPIC_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  const body = await req.json().catch(() => ({}))

  // Pre-scraped batch mode
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
