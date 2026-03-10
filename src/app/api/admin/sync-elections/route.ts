/**
 * POST /api/admin/sync-elections — Manual trigger for election sync.
 *
 * This is a Next.js API route that runs the election sync logic directly
 * (without requiring the Supabase edge function to be deployed).
 * Useful for testing and manual runs from the dashboard.
 *
 * Auth: Requires CRON_SECRET or admin session.
 */

import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY)!
const GOOGLE_CIVIC_API_KEY = process.env.GOOGLE_CIVIC_API_KEY!
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || ''
const CRON_SECRET = process.env.CRON_SECRET

async function dbFetch(path: string, method = 'GET', body?: unknown) {
  const url = `${SUPABASE_URL}/rest/v1/${path}`
  const opts: RequestInit = {
    method,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: method === 'POST'
        ? 'return=representation,resolution=merge-duplicates'
        : method === 'GET' ? '' : 'return=representation',
    },
  }
  if (body) opts.body = JSON.stringify(body)
  const res = await fetch(url, opts)
  if (!res.ok) {
    const err = await res.text()
    console.error(`DB ${method} ${path}: ${res.status} ${err}`)
    return null
  }
  return res.json()
}

async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

interface GoogleContest {
  type: string
  office?: string
  district?: { name?: string; scope?: string }
  candidates?: { name: string; party?: string; candidateUrl?: string; email?: string; phone?: string; photoUrl?: string; channels?: { type: string; id: string }[] }[]
  referendumTitle?: string
  referendumSubtitle?: string
  referendumText?: string
  referendumProStatement?: string
  referendumConStatement?: string
  level?: string[]
  roles?: string[]
}

function inferElectionType(name: string): string {
  const lower = name.toLowerCase()
  if (lower.includes('runoff')) return 'Runoff'
  if (lower.includes('primary')) return 'Primary'
  if (lower.includes('general')) return 'General'
  if (lower.includes('special')) return 'Special'
  return 'General'
}

function inferJurisdiction(name: string): string {
  const lower = name.toLowerCase()
  if (lower.includes('houston')) return 'City of Houston'
  if (lower.includes('harris')) return 'Harris County'
  if (lower.includes('texas') || lower.includes('tx')) return 'State of Texas'
  return 'Harris County'
}

function inferOfficeLevel(contest: GoogleContest): string {
  const levels = contest.level || []
  const scope = contest.district?.scope || ''
  if (levels.includes('country') || scope === 'national') return 'Federal'
  if (levels.includes('administrativeArea1') || scope === 'statewide') return 'State'
  if (levels.includes('administrativeArea2') || scope === 'countywide') return 'County'
  if (levels.includes('locality') || scope === 'citywide') return 'City'
  return 'Other'
}

export async function POST(req: NextRequest) {
  // Auth: accept CRON_SECRET or admin cookie
  const authHeader = req.headers.get('authorization') || ''
  const isCron = CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`
  const apiKey = req.headers.get('x-api-key')
  if (!isCron && !apiKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const mode: string = body.mode || 'sample'
  const enrich: boolean = body.enrich !== false

  const stats = {
    elections_found: 0,
    elections_upserted: 0,
    candidates_upserted: 0,
    ballot_items_upserted: 0,
    enriched: 0,
    errors: 0,
    zips_queried: 0,
    details: [] as string[],
  }

  try {
    // Step 1: Discover elections
    const electionsUrl = `https://www.googleapis.com/civicinfo/v2/elections?key=${GOOGLE_CIVIC_API_KEY}`
    const electionsRes = await fetch(electionsUrl, { signal: AbortSignal.timeout(10000) })
    if (!electionsRes.ok) {
      return NextResponse.json({ error: `Google elections API: ${electionsRes.status}` }, { status: 502 })
    }
    const electionsData = await electionsRes.json()
    const googleElections = (electionsData.elections || []).filter((e: { id: string }) => e.id !== '2000')
    stats.elections_found = googleElections.length
    stats.details.push(`Found ${googleElections.length} elections: ${googleElections.map((e: { name: string }) => e.name).join(', ')}`)

    if (googleElections.length === 0) {
      return NextResponse.json({ success: true, message: 'No active elections found', ...stats })
    }

    // Filter to relevant elections
    const relevant = googleElections.filter((e: { name: string }) => {
      const lower = e.name.toLowerCase()
      return lower.includes('texas') || lower.includes('tx') ||
             lower.includes('houston') || lower.includes('harris') ||
             lower.includes('general') || lower.includes('primary')
    })
    const electionsToProcess = relevant.length > 0 ? relevant : googleElections.slice(0, 3)

    // Step 2: Upsert elections
    const electionRows = electionsToProcess.map((e: { id: string; name: string; electionDay: string }) => ({
      election_id: `ELEC_GC_${e.id}`,
      election_name: e.name,
      election_date: e.electionDay,
      election_type: inferElectionType(e.name),
      jurisdiction: inferJurisdiction(e.name),
      is_active: 'Yes',
      polls_open: '7:00 AM',
      polls_close: '7:00 PM',
      find_polling_url: 'https://www.harrisvotes.com/Polling-Locations',
      register_url: 'https://www.votetexas.gov/register-to-vote/',
      data_source: 'google_civic',
      last_updated: new Date().toISOString(),
    }))

    const upsertResult = await dbFetch('elections?on_conflict=election_id', 'POST', electionRows)
    if (upsertResult) {
      stats.elections_upserted = electionRows.length
    } else {
      stats.errors++
      stats.details.push('Failed to upsert elections')
    }

    // Step 3: Fetch contests per election via sample ZIPs
    const SAMPLE_ZIPS = ['77002', '77024', '77045', '77084', '77058']
    const FULL_ZIPS = [
      '77001', '77002', '77003', '77004', '77005', '77006', '77007', '77008', '77009', '77010',
      '77011', '77012', '77013', '77014', '77015', '77016', '77017', '77018', '77019', '77020',
      '77021', '77022', '77023', '77024', '77025', '77026', '77027', '77028', '77029', '77030',
      '77031', '77032', '77033', '77034', '77035', '77036', '77037', '77038', '77039', '77040',
      '77041', '77042', '77043', '77044', '77045', '77046', '77047', '77048', '77049', '77050',
      '77051', '77053', '77054', '77055', '77056', '77057', '77058', '77059', '77060', '77061',
      '77062', '77063', '77064', '77065', '77066', '77067', '77068', '77069', '77070',
    ]
    const zipsToQuery = mode === 'sample' ? SAMPLE_ZIPS : FULL_ZIPS

    const allCandidates = new Map<string, Record<string, unknown>>()
    const allBallotItems = new Map<string, Record<string, unknown>>()

    for (const election of electionsToProcess) {
      const electionId = `ELEC_GC_${(election as { id: string }).id}`
      const electionDay = (election as { electionDay: string }).electionDay
      const seenContests = new Set<string>()

      for (const zip of zipsToQuery) {
        try {
          const url = `https://www.googleapis.com/civicinfo/v2/voterinfo?address=${zip},TX&electionId=${(election as { id: string }).id}&key=${GOOGLE_CIVIC_API_KEY}`
          const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
          stats.zips_queried++
          if (!res.ok) continue

          const data = await res.json()
          const contests: GoogleContest[] = data.contests || []

          for (const contest of contests) {
            const contestKey = contest.referendumTitle || contest.office || ''
            if (seenContests.has(contestKey)) continue
            seenContests.add(contestKey)

            if (contest.referendumTitle) {
              const title = contest.referendumTitle
              const hash = await sha256(`${electionId}|${title}`)
              const itemId = `BALL_GC_${hash.substring(0, 12)}`
              const lower = title.toLowerCase()
              let itemType = 'Proposition'
              if (lower.includes('bond')) itemType = 'Bond'
              else if (lower.includes('amendment')) itemType = 'Constitutional Amendment'
              else if (lower.includes('measure')) itemType = 'Measure'

              allBallotItems.set(itemId, {
                item_id: itemId,
                item_name: title,
                election_id: electionId,
                election_date: electionDay,
                item_type: itemType,
                jurisdiction: inferJurisdiction(title),
                description: contest.referendumText || contest.referendumSubtitle || null,
                for_argument: contest.referendumProStatement || null,
                against_argument: contest.referendumConStatement || null,
                is_active: 'Yes',
                data_source: 'google_civic',
                last_updated: new Date().toISOString(),
              })
            } else if (contest.candidates) {
              for (const candidate of contest.candidates) {
                const hash = await sha256(`${electionId}|${contest.office || ''}|${candidate.name}`)
                const candidateId = `CAND_GC_${hash.substring(0, 12)}`
                const row: Record<string, unknown> = {
                  candidate_id: candidateId,
                  candidate_name: candidate.name,
                  election_id: electionId,
                  office_sought: contest.office || null,
                  district: contest.district?.name || null,
                  office_level: inferOfficeLevel(contest),
                  party: candidate.party || null,
                  campaign_website: candidate.candidateUrl || null,
                  campaign_email: candidate.email || null,
                  campaign_phone: candidate.phone || null,
                  photo_url: candidate.photoUrl || null,
                  is_active: 'Yes',
                  data_source: 'google_civic',
                  last_updated: new Date().toISOString(),
                }
                if (candidate.channels) {
                  for (const ch of candidate.channels) {
                    if (ch.type === 'LinkedIn') row.linkedin_url = `https://linkedin.com/in/${ch.id}`
                  }
                }
                allCandidates.set(candidateId, row)
              }
            }
          }
        } catch (err) {
          stats.details.push(`ZIP ${zip}: ${(err as Error).message}`)
        }
        await sleep(200)
      }
    }

    stats.details.push(`Found ${allCandidates.size} candidates, ${allBallotItems.size} ballot items`)

    // Step 4: Upsert candidates
    const candidateRows = Array.from(allCandidates.values())
    if (candidateRows.length > 0) {
      for (let i = 0; i < candidateRows.length; i += 50) {
        const batch = candidateRows.slice(i, i + 50)
        const result = await dbFetch('candidates?on_conflict=candidate_id', 'POST', batch)
        if (result) stats.candidates_upserted += batch.length
        else stats.errors++
      }
    }

    // Step 5: Upsert ballot items
    const ballotItemRows = Array.from(allBallotItems.values())
    if (ballotItemRows.length > 0) {
      for (let i = 0; i < ballotItemRows.length; i += 50) {
        const batch = ballotItemRows.slice(i, i + 50)
        const result = await dbFetch('ballot_items?on_conflict=item_id', 'POST', batch)
        if (result) stats.ballot_items_upserted += batch.length
        else stats.errors++
      }
    }

    // Step 6: Enrich with Claude
    if (enrich && ANTHROPIC_API_KEY) {
      for (const row of electionRows) {
        const summary = await enrichWithClaude(
          `Write a 2-sentence plain-language summary of what this election means for Houston residents. ` +
          `Use simple language (6th grade reading level). ` +
          `Election: ${row.election_name}, Date: ${row.election_date}, Type: ${row.election_type}. ` +
          `Just return the summary text.`
        )
        if (summary) {
          await dbFetch(`elections?election_id=eq.${row.election_id}`, 'PATCH', {
            community_impact_summary: summary,
            description: summary,
          })
          stats.enriched++
        }
        await sleep(500)
      }

      for (const row of ballotItemRows.slice(0, 20)) { // limit enrichment to first 20
        if (!row.description) continue
        const simplified = await enrichWithClaude(
          `Rewrite this ballot measure in plain language a 5th grader could understand. 2-3 sentences. ` +
          `Title: ${row.item_name}. Description: ${row.description}. Just return the text.`
        )
        if (simplified) {
          await dbFetch(`ballot_items?item_id=eq.${row.item_id}`, 'PATCH', { description_5th_grade: simplified })
          stats.enriched++
        }
        await sleep(500)
      }
    }

    // Log
    await dbFetch('ingestion_log', 'POST', {
      event_type: 'sync_elections',
      source: 'google_civic',
      status: stats.errors === 0 ? 'success' : 'partial',
      message: `Synced ${stats.elections_upserted} elections, ${stats.candidates_upserted} candidates, ${stats.ballot_items_upserted} ballot items. Enriched ${stats.enriched}.`,
      item_count: stats.elections_upserted + stats.candidates_upserted + stats.ballot_items_upserted,
    })

    return NextResponse.json({ success: true, ...stats })

  } catch (err) {
    return NextResponse.json({ error: (err as Error).message, ...stats }, { status: 500 })
  }
}

async function enrichWithClaude(prompt: string): Promise<string | null> {
  if (!ANTHROPIC_API_KEY) return null
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.content?.[0]?.text?.trim() || null
  } catch {
    return null
  }
}
