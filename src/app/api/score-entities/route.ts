import { NextRequest, NextResponse } from 'next/server'
import { validateApiRequest } from '@/lib/api-auth'
import { runEntityScoring } from '@/lib/data/score-entities'

/**
 * @fileoverview POST /api/score-entities — Compute entity completeness scores.
 *
 * Auth: Requires API key (x-api-key) or cron secret (Bearer token).
 *
 * Body:
 *   { "entity_type": "organization" }  — scores a single type
 *   {}                                  — scores all entity types
 */

export async function POST(req: NextRequest) {
  const authError = await validateApiRequest(req)
  if (authError) return authError

  const body = await req.json().catch(() => ({}))
  const entityType: string | undefined = body.entity_type

  const result = await runEntityScoring(entityType)
  return NextResponse.json(result)
}
