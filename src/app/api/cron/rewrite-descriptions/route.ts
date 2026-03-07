/**
 * @fileoverview POST /api/cron/rewrite-descriptions — Batch rewrite entity descriptions at 6th grade reading level.
 *
 * Sweeps all entity tables for rows that have a raw description but are missing
 * the plain-language version. Sends each to Claude for a 6th-grade rewrite using
 * asset-based language.
 *
 * Processes up to BATCH_SIZE items per table per run (default 10).
 * Auth: Requires CRON_SECRET bearer token.
 * Schedule: Daily at 12 PM CT (after classify-pending at 11 AM).
 */

import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY!
const CRON_SECRET = process.env.CRON_SECRET
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || ''

const BATCH_SIZE = 10

interface TableConfig {
  table: string
  idCol: string
  nameCol: string
  rawCols: string[]       // columns with raw text to rewrite from
  plainCol: string        // column to write the plain-language version to
  entityLabel: string     // human label for the prompt
}

const TABLES: TableConfig[] = [
  {
    table: 'organizations',
    idCol: 'org_id',
    nameCol: 'org_name',
    rawCols: ['mission_statement', 'description'],
    plainCol: 'description_5th_grade',
    entityLabel: 'community organization',
  },
  {
    table: 'elected_officials',
    idCol: 'official_id',
    nameCol: 'official_name',
    rawCols: ['bio', 'title', 'party', 'level', 'jurisdiction'],
    plainCol: 'description_5th_grade',
    entityLabel: 'elected official',
  },
  {
    table: 'policies',
    idCol: 'policy_id',
    nameCol: 'policy_name',
    rawCols: ['description', 'summary', 'bill_number', 'policy_type', 'status'],
    plainCol: 'summary_5th_grade',
    entityLabel: 'policy or legislation',
  },
  {
    table: 'services_211',
    idCol: 'service_id',
    nameCol: 'service_name',
    rawCols: ['description', 'eligibility'],
    plainCol: 'description_5th_grade',
    entityLabel: 'community service',
  },
  {
    table: 'opportunities',
    idCol: 'opportunity_id',
    nameCol: 'opportunity_name',
    rawCols: ['description'],
    plainCol: 'description_5th_grade',
    entityLabel: 'community opportunity',
  },
  {
    table: 'agencies',
    idCol: 'agency_id',
    nameCol: 'agency_name',
    rawCols: ['description', 'level', 'jurisdiction'],
    plainCol: 'description_5th_grade',
    entityLabel: 'government agency',
  },
  {
    table: 'benefit_programs',
    idCol: 'benefit_id',
    nameCol: 'benefit_name',
    rawCols: ['description', 'eligibility'],
    plainCol: 'description_5th_grade',
    entityLabel: 'benefit program',
  },
  {
    table: 'events',
    idCol: 'event_id',
    nameCol: 'event_name',
    rawCols: ['description'],
    plainCol: 'description_5th_grade',
    entityLabel: 'community event',
  },
  {
    table: 'ballot_items',
    idCol: 'item_id',
    nameCol: 'item_name',
    rawCols: ['description', 'item_type'],
    plainCol: 'description_5th_grade',
    entityLabel: 'ballot item',
  },
]

async function supaRest(method: string, path: string, body?: unknown) {
  const headers: Record<string, string> = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
  }
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

async function rewriteWithClaude(entityLabel: string, name: string, rawText: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    signal: AbortSignal.timeout(30000),
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `You are rewriting a description of a ${entityLabel} for a community website. The audience includes people of all ages and education levels.

RULES:
- Write at a 6th grade reading level (age 11-12)
- Use asset-based language: focus on what is available, what helps people, what opportunities exist
- 2-3 clear sentences maximum
- No jargon, acronyms, or bureaucratic language
- No filler phrases like "This organization..." — get straight to the point
- If this is an elected official, describe their role and what they do for the community

Name: ${name}
Raw text: ${rawText}

Write ONLY the plain-language description, nothing else.`,
      }],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Claude API error: ${res.status} ${err}`)
  }

  const data = await res.json()
  return (data.content?.[0]?.text || '').trim()
}

export async function POST(req: NextRequest) {
  if (!CRON_SECRET || !SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: 'Server configuration missing' }, { status: 500 })
  }

  const authHeader = req.headers.get('authorization') || ''
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!ANTHROPIC_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  // Allow targeting a specific table via body
  const body = await req.json().catch(() => ({}))
  const targetTable: string | undefined = body.table
  const batchSize = Math.min(body.limit || BATCH_SIZE, 50)

  const tablesToProcess = targetTable
    ? TABLES.filter(t => t.table === targetTable)
    : TABLES

  const results: Record<string, unknown> = {}
  let totalRewritten = 0

  for (const config of tablesToProcess) {
    try {
      // Find rows where plainCol is NULL but we have some raw data to work with
      const selectCols = [config.idCol, config.nameCol, ...config.rawCols].join(',')
      const rows = await supaRest(
        'GET',
        `${config.table}?select=${selectCols}&${config.plainCol}=is.null&limit=${batchSize}&order=${config.idCol}.asc`,
      )

      if (!rows || rows.length === 0) {
        results[config.table] = { pending: 0, skipped: true }
        continue
      }

      let succeeded = 0
      let failed = 0

      for (const row of rows) {
        const entityId = row[config.idCol]
        const name = row[config.nameCol] || ''

        // Build raw text from available columns
        const rawParts: string[] = []
        for (const col of config.rawCols) {
          if (row[col]) rawParts.push(row[col])
        }
        const rawText = rawParts.join('. ').trim()

        if (!rawText && !name) {
          failed++
          continue
        }

        try {
          const plain = await rewriteWithClaude(
            config.entityLabel,
            name,
            rawText || name,
          )

          if (plain && plain.length > 10) {
            await supaRest('PATCH', `${config.table}?${config.idCol}=eq.${entityId}`, {
              [config.plainCol]: plain,
            })
            succeeded++
          } else {
            failed++
          }
        } catch (err) {
          console.error(`Rewrite failed for ${config.table}/${entityId}: ${(err as Error).message}`)
          failed++
        }

        // Rate limit: ~1 req/sec to stay within Haiku limits
        await new Promise(r => setTimeout(r, 500))
      }

      results[config.table] = {
        pending: rows.length,
        succeeded,
        failed,
      }
      totalRewritten += succeeded
    } catch (err) {
      results[config.table] = { error: (err as Error).message }
    }
  }

  // Log
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/ingestion_log`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        event_type: 'rewrite_descriptions',
        source: 'cron',
        status: 'success',
        message: `Rewrote ${totalRewritten} descriptions across ${tablesToProcess.length} tables at 6th grade level`,
        item_count: totalRewritten,
      }),
    })
  } catch { /* non-critical */ }

  return NextResponse.json({
    success: true,
    total_rewritten: totalRewritten,
    tables: results,
  })
}
