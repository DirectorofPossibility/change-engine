/**
 * POST /api/admin/sync-elections — Multi-source election sync.
 *
 * Sources:
 *   1. TX Secretary of State — election dates + deadlines (scraped)
 *   2. FEC API — federal candidates for TX (House + Senate)
 *   3. Google Civic API — contests, ballot items, additional candidates (when available)
 *   4. Claude — plain-language enrichment
 *
 * Auth: Requires CRON_SECRET or x-api-key header.
 */

import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY)!
const GOOGLE_CIVIC_API_KEY = process.env.GOOGLE_CIVIC_API_KEY!
const FEC_API_KEY = (process.env.DATA_GOV_API_KEY || process.env.FEC_API_KEY)!
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || ''
const CRON_SECRET = process.env.CRON_SECRET

// Harris County congressional districts (Houston area)
const HOUSTON_DISTRICTS = ['02', '07', '08', '09', '10', '18', '22', '29', '36', '38']

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

// ─── Types ───────────────────────────────────────────────────────────────────

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

interface FECCandidate {
  candidate_id: string
  name: string
  party: string
  party_full: string
  office: string      // H or S
  office_full: string  // House or Senate
  state: string
  district: string
  district_number: number
  incumbent_challenge: string      // I, C, O
  incumbent_challenge_full: string // Incumbent, Challenger, Open seat
  candidate_status: string
  candidate_inactive: boolean
  has_raised_funds: boolean
  cycles: number[]
  election_years: number[]
}

interface TXSOSElection {
  name: string
  date: string         // YYYY-MM-DD
  type: string
  deadlines: Record<string, string>  // label → date string
}

// ─── Source 1: TX Secretary of State ─────────────────────────────────────────

async function fetchTXSOSElections(): Promise<TXSOSElection[]> {
  const elections: TXSOSElection[] = []
  try {
    const url = 'https://www.sos.state.tx.us/elections/voter/important-election-dates.shtml'
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ChangeEngine/1.0)' },
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) {
      console.error(`TX SOS fetch failed: ${res.status}`)
      return elections
    }
    const html = await res.text()

    // Parse tables with election data — each table has a caption header like:
    //   "Tuesday, March 3, 2026 - Primary Election"
    const currentYear = new Date().getFullYear()
    const tableRegex = /<table[^>]*summary="([^"]*)"[^>]*>([\s\S]*?)<\/table>/gi
    let match
    while ((match = tableRegex.exec(html)) !== null) {
      const summary = match[1]
      const tableHtml = match[2]

      // Extract election name from the <th> header row
      const thMatch = tableHtml.match(/<th[^>]*>([\s\S]*?)<\/th>/i)
      const headerText = thMatch
        ? thMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
        : summary.replace(/\s+/g, ' ').trim()

      // Extract date from header — e.g., "Tuesday, March 3, 2026 - Primary Election"
      const dateMatch = headerText.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})/i)
      if (!dateMatch) continue

      const electionYear = parseInt(dateMatch[3])
      if (electionYear < currentYear) continue  // skip past elections

      const electionDate = parseDate(dateMatch[0])
      if (!electionDate) continue

      // Determine election type
      const lower = headerText.toLowerCase()
      let electionType = 'General'
      if (lower.includes('primary')) electionType = 'Primary'
      else if (lower.includes('runoff')) electionType = 'Runoff'
      else if (lower.includes('uniform')) electionType = 'General'
      else if (lower.includes('special')) electionType = 'Special'

      // Build clean election name
      const cleanName = lower.includes('primary')
        ? `Texas ${electionYear} Primary Election`
        : lower.includes('runoff')
          ? `Texas ${electionYear} Primary Runoff`
          : lower.includes('uniform')
            ? `Texas ${electionYear} General Election`
            : `Texas ${electionYear} Election`

      // Extract deadlines from table rows
      const deadlines: Record<string, string> = {}
      const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi
      let rowMatch
      while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
        const cells = rowMatch[1].match(/<td[^>]*>([\s\S]*?)<\/td>/gi)
        if (!cells || cells.length < 2) continue

        const label = cells[0].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
        const dateVal = cells[1].replace(/<[^>]+>/g, '').replace(/&[a-z]+;/gi, '').replace(/\s+/g, ' ').trim()

        if (label && dateVal) {
          const parsedDate = parseDate(dateVal)
          if (parsedDate) {
            deadlines[normalizeDeadlineLabel(label)] = parsedDate
          }
        }
      }

      elections.push({
        name: cleanName,
        date: electionDate,
        type: electionType,
        deadlines,
      })
    }
  } catch (err) {
    console.error('TX SOS scrape error:', (err as Error).message)
  }
  return elections
}

function parseDate(text: string): string | null {
  const months: Record<string, number> = {
    january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
    july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
  }
  const match = text.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})/i)
  if (!match) return null
  const month = months[match[1].toLowerCase()]
  const day = parseInt(match[2])
  const year = parseInt(match[3])
  if (month === undefined || isNaN(day) || isNaN(year)) return null
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function normalizeDeadlineLabel(label: string): string {
  const lower = label.toLowerCase()
  if (lower.includes('last day to register')) return 'registration_deadline'
  if (lower.includes('first day of early voting')) return 'early_voting_start'
  if (lower.includes('last day of early voting')) return 'early_voting_end'
  if (lower.includes('last day to apply for ballot by mail')) return 'mail_ballot_deadline'
  if (lower.includes('last day to receive ballot by mail')) return 'mail_ballot_received'
  if (lower.includes('filing deadline')) return 'filing_deadline'
  return label.substring(0, 50)
}

// ─── Source 2: FEC API ───────────────────────────────────────────────────────

async function fetchFECCandidates(electionYear: number): Promise<FECCandidate[]> {
  const allCandidates: FECCandidate[] = []
  try {
    let page = 1
    let totalPages = 1

    while (page <= totalPages && page <= 20) { // safety cap at 20 pages
      const url = `https://api.open.fec.gov/v1/candidates/?state=TX&election_year=${electionYear}&sort=name&per_page=100&page=${page}&api_key=${FEC_API_KEY}`
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
      if (!res.ok) {
        console.error(`FEC API page ${page}: ${res.status}`)
        break
      }
      const data = await res.json()
      totalPages = data.pagination?.pages || 1
      const results: FECCandidate[] = data.results || []
      allCandidates.push(...results)
      page++
      if (page <= totalPages) await sleep(200) // rate limit: 1000/hr
    }
  } catch (err) {
    console.error('FEC API error:', (err as Error).message)
  }
  return allCandidates
}

function isHoustonDistrict(district: string): boolean {
  // Pad to 2 digits for comparison
  const padded = district.padStart(2, '0')
  return HOUSTON_DISTRICTS.includes(padded)
}

function formatCandidateName(fecName: string): string {
  // FEC names are "LAST, FIRST MIDDLE" — convert to "First Last"
  const parts = fecName.split(',').map(s => s.trim())
  if (parts.length < 2) return fecName
  const last = parts[0]
  const first = parts[1].split(' ')[0] // just first name, drop middle/suffix
  // Title case
  const tc = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
  return `${tc(first)} ${tc(last)}`
}

// ─── Source 3: Google Civic API ──────────────────────────────────────────────

function inferOfficeLevel(contest: GoogleContest): string {
  const levels = contest.level || []
  const scope = contest.district?.scope || ''
  if (levels.includes('country') || scope === 'national') return 'Federal'
  if (levels.includes('administrativeArea1') || scope === 'statewide') return 'State'
  if (levels.includes('administrativeArea2') || scope === 'countywide') return 'County'
  if (levels.includes('locality') || scope === 'citywide') return 'City'
  return 'Other'
}

function inferJurisdiction(name: string): string {
  const lower = name.toLowerCase()
  if (lower.includes('houston')) return 'City of Houston'
  if (lower.includes('harris')) return 'Harris County'
  if (lower.includes('texas') || lower.includes('tx')) return 'State of Texas'
  return 'Harris County'
}

// ─── Enrichment ──────────────────────────────────────────────────────────────

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

// ─── Main Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Auth
  const authHeader = req.headers.get('authorization') || ''
  const isCron = CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`
  const apiKey = req.headers.get('x-api-key')
  if (!isCron && !apiKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const mode: string = body.mode || 'sample'
  const enrich: boolean = body.enrich !== false
  const sources: string[] = body.sources || ['txsos', 'fec', 'google_civic']

  const stats = {
    elections_found: 0,
    elections_upserted: 0,
    candidates_upserted: 0,
    ballot_items_upserted: 0,
    enriched: 0,
    errors: 0,
    details: [] as string[],
    sources_used: [] as string[],
  }

  try {
    const now = new Date().toISOString()
    const currentYear = new Date().getFullYear()
    const nextYear = currentYear + 1

    const allElectionRows: Record<string, unknown>[] = []
    const allCandidates = new Map<string, Record<string, unknown>>()
    const allBallotItems = new Map<string, Record<string, unknown>>()

    // ═══ SOURCE 1: TX Secretary of State ═══
    if (sources.includes('txsos')) {
      stats.sources_used.push('txsos')
      const txElections = await fetchTXSOSElections()
      stats.details.push(`TX SOS: found ${txElections.length} upcoming elections`)

      for (const txe of txElections) {
        const electionId = `ELEC_TXSOS_${txe.date.replace(/-/g, '')}`
        allElectionRows.push({
          election_id: electionId,
          election_name: txe.name,
          election_date: txe.date,
          election_type: txe.type,
          jurisdiction: 'State of Texas',
          is_active: 'Yes',
          registration_deadline: txe.deadlines.registration_deadline || null,
          early_voting_start: txe.deadlines.early_voting_start || null,
          early_voting_end: txe.deadlines.early_voting_end || null,
          polls_open: '7:00 AM',
          polls_close: '7:00 PM',
          find_polling_url: 'https://www.harrisvotes.com/Polling-Locations',
          register_url: 'https://www.votetexas.gov/register-to-vote/',
          data_source: 'tx_sos',
          last_updated: now,
        })
      }
    }

    // ═══ SOURCE 2: FEC API — Federal TX candidates ═══
    if (sources.includes('fec') && FEC_API_KEY) {
      stats.sources_used.push('fec')

      // Fetch for current and next election year
      const yearsToFetch = [currentYear]
      if (currentYear % 2 === 0) yearsToFetch.push(currentYear) // even years have federal elections
      else yearsToFetch.push(currentYear + 1) // odd years, look ahead to next even year
      const electionYear = yearsToFetch.find(y => y % 2 === 0) || currentYear

      const fecCandidates = await fetchFECCandidates(electionYear)
      stats.details.push(`FEC: found ${fecCandidates.length} TX candidates for ${electionYear}`)

      // Filter to Houston-area districts + statewide (Senate)
      const houstonCandidates = fecCandidates.filter(c =>
        !c.candidate_inactive &&
        (c.office === 'S' || isHoustonDistrict(c.district))
      )
      stats.details.push(`FEC: ${houstonCandidates.length} Houston-area candidates (${fecCandidates.filter(c => c.office === 'S' && !c.candidate_inactive).length} Senate + ${houstonCandidates.filter(c => c.office === 'H').length} House)`)

      // Find or create the election record these candidates belong to
      // Federal elections are on the first Tuesday after the first Monday in November
      const federalElectionDate = getFederalElectionDate(electionYear)
      const federalElectionId = `ELEC_FED_${electionYear}`

      // Check if we already have a TX SOS general election for this date
      const existingGeneral = allElectionRows.find(r => r.election_date === federalElectionDate)
      if (!existingGeneral) {
        allElectionRows.push({
          election_id: federalElectionId,
          election_name: `${electionYear} Federal Election`,
          election_date: federalElectionDate,
          election_type: 'General',
          jurisdiction: 'Federal',
          is_active: 'Yes',
          polls_open: '7:00 AM',
          polls_close: '7:00 PM',
          find_polling_url: 'https://www.harrisvotes.com/Polling-Locations',
          register_url: 'https://www.votetexas.gov/register-to-vote/',
          data_source: 'fec',
          last_updated: now,
        })
      }
      const targetElectionId = existingGeneral
        ? existingGeneral.election_id as string
        : federalElectionId

      for (const fc of houstonCandidates) {
        const candidateId = `CAND_FEC_${fc.candidate_id}`
        const officeName = fc.office === 'S'
          ? 'U.S. Senator'
          : `U.S. Representative, District ${parseInt(fc.district)}`

        allCandidates.set(candidateId, {
          candidate_id: candidateId,
          candidate_name: formatCandidateName(fc.name),
          election_id: targetElectionId,
          office_sought: officeName,
          district: fc.office === 'S' ? 'Texas' : `TX-${parseInt(fc.district)}`,
          office_level: 'Federal',
          party: fc.party_full || fc.party || null,
          incumbent_status: fc.incumbent_challenge_full || null,
          is_active: 'Yes',
          has_raised_funds: fc.has_raised_funds || false,
          data_source: 'fec',
          fec_candidate_id: fc.candidate_id,
          last_updated: now,
        })
      }
    }

    // ═══ SOURCE 3: Google Civic API ═══
    if (sources.includes('google_civic') && GOOGLE_CIVIC_API_KEY) {
      stats.sources_used.push('google_civic')

      const electionsUrl = `https://www.googleapis.com/civicinfo/v2/elections?key=${GOOGLE_CIVIC_API_KEY}`
      const electionsRes = await fetch(electionsUrl, { signal: AbortSignal.timeout(10000) })

      if (electionsRes.ok) {
        const electionsData = await electionsRes.json()
        const googleElections = (electionsData.elections || []).filter((e: { id: string }) => e.id !== '2000')
        stats.details.push(`Google Civic: found ${googleElections.length} elections`)

        // Filter to TX-relevant
        const relevant = googleElections.filter((e: { name: string }) => {
          const lower = e.name.toLowerCase()
          return lower.includes('texas') || lower.includes('tx') ||
                 lower.includes('houston') || lower.includes('harris') ||
                 lower.includes('general') || lower.includes('primary')
        })

        const electionsToProcess = relevant.length > 0 ? relevant : googleElections.slice(0, 3)

        for (const election of electionsToProcess) {
          const ge = election as { id: string; name: string; electionDay: string }
          const electionId = `ELEC_GC_${ge.id}`

          // Only add if we don't already have this date from TX SOS
          const existingForDate = allElectionRows.find(r => r.election_date === ge.electionDay)
          if (!existingForDate) {
            allElectionRows.push({
              election_id: electionId,
              election_name: ge.name,
              election_date: ge.electionDay,
              election_type: inferElectionType(ge.name),
              jurisdiction: inferJurisdiction(ge.name),
              is_active: 'Yes',
              polls_open: '7:00 AM',
              polls_close: '7:00 PM',
              find_polling_url: 'https://www.harrisvotes.com/Polling-Locations',
              register_url: 'https://www.votetexas.gov/register-to-vote/',
              data_source: 'google_civic',
              last_updated: now,
            })
          }

          // Query ZIP codes for contests
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
          const targetId = existingForDate ? existingForDate.election_id as string : electionId
          const seenContests = new Set<string>()

          for (const zip of zipsToQuery) {
            try {
              const url = `https://www.googleapis.com/civicinfo/v2/voterinfo?address=${zip},TX&electionId=${ge.id}&key=${GOOGLE_CIVIC_API_KEY}`
              const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
              if (!res.ok) continue

              const data = await res.json()
              const contests: GoogleContest[] = data.contests || []

              for (const contest of contests) {
                const contestKey = contest.referendumTitle || contest.office || ''
                if (seenContests.has(contestKey)) continue
                seenContests.add(contestKey)

                if (contest.referendumTitle) {
                  const title = contest.referendumTitle
                  const hash = await sha256(`${targetId}|${title}`)
                  const itemId = `BALL_GC_${hash.substring(0, 12)}`
                  const lower = title.toLowerCase()
                  let itemType = 'Proposition'
                  if (lower.includes('bond')) itemType = 'Bond'
                  else if (lower.includes('amendment')) itemType = 'Constitutional Amendment'
                  else if (lower.includes('measure')) itemType = 'Measure'

                  allBallotItems.set(itemId, {
                    item_id: itemId,
                    item_name: title,
                    election_id: targetId,
                    election_date: ge.electionDay,
                    item_type: itemType,
                    jurisdiction: inferJurisdiction(title),
                    description: contest.referendumText || contest.referendumSubtitle || null,
                    for_argument: contest.referendumProStatement || null,
                    against_argument: contest.referendumConStatement || null,
                    is_active: 'Yes',
                    data_source: 'google_civic',
                    last_updated: now,
                  })
                } else if (contest.candidates) {
                  for (const candidate of contest.candidates) {
                    const hash = await sha256(`${targetId}|${contest.office || ''}|${candidate.name}`)
                    const candidateId = `CAND_GC_${hash.substring(0, 12)}`
                    // Don't overwrite FEC data for federal candidates
                    if (allCandidates.has(candidateId)) continue
                    const row: Record<string, unknown> = {
                      candidate_id: candidateId,
                      candidate_name: candidate.name,
                      election_id: targetId,
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
                      last_updated: now,
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
      } else {
        stats.details.push(`Google Civic: API returned ${electionsRes.status}`)
      }
    }

    // ═══ UPSERT ELECTIONS ═══
    stats.elections_found = allElectionRows.length
    if (allElectionRows.length > 0) {
      const result = await dbFetch('elections?on_conflict=election_id', 'POST', allElectionRows)
      if (result) stats.elections_upserted = allElectionRows.length
      else stats.errors++
    }

    stats.details.push(`Total: ${allCandidates.size} candidates, ${allBallotItems.size} ballot items`)

    // ═══ UPSERT CANDIDATES ═══
    const candidateRows = Array.from(allCandidates.values())
    if (candidateRows.length > 0) {
      for (let i = 0; i < candidateRows.length; i += 50) {
        const batch = candidateRows.slice(i, i + 50)
        const result = await dbFetch('candidates?on_conflict=candidate_id', 'POST', batch)
        if (result) stats.candidates_upserted += batch.length
        else stats.errors++
      }
    }

    // ═══ UPSERT BALLOT ITEMS ═══
    const ballotItemRows = Array.from(allBallotItems.values())
    if (ballotItemRows.length > 0) {
      for (let i = 0; i < ballotItemRows.length; i += 50) {
        const batch = ballotItemRows.slice(i, i + 50)
        const result = await dbFetch('ballot_items?on_conflict=item_id', 'POST', batch)
        if (result) stats.ballot_items_upserted += batch.length
        else stats.errors++
      }
    }

    // ═══ ENRICH WITH CLAUDE ═══
    if (enrich && ANTHROPIC_API_KEY) {
      for (const row of allElectionRows) {
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

      for (const row of ballotItemRows.slice(0, 20)) {
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

    // ═══ LOG ═══
    await dbFetch('ingestion_log', 'POST', {
      event_type: 'sync_elections',
      source: stats.sources_used.join('+'),
      status: stats.errors === 0 ? 'success' : 'partial',
      message: `Synced ${stats.elections_upserted} elections, ${stats.candidates_upserted} candidates, ${stats.ballot_items_upserted} ballot items from ${stats.sources_used.join(', ')}. Enriched ${stats.enriched}.`,
      item_count: stats.elections_upserted + stats.candidates_upserted + stats.ballot_items_upserted,
    })

    return NextResponse.json({ success: true, ...stats })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message, ...stats }, { status: 500 })
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function inferElectionType(name: string): string {
  const lower = name.toLowerCase()
  if (lower.includes('runoff')) return 'Runoff'
  if (lower.includes('primary')) return 'Primary'
  if (lower.includes('general')) return 'General'
  if (lower.includes('special')) return 'Special'
  return 'General'
}

/** First Tuesday after the first Monday in November */
function getFederalElectionDate(year: number): string {
  const nov1 = new Date(year, 10, 1) // Nov 1
  const dayOfWeek = nov1.getDay() // 0=Sun, 1=Mon
  // First Monday: if Nov 1 is Mon, that's it. Otherwise, next Monday.
  const firstMonday = dayOfWeek <= 1
    ? 1 + (1 - dayOfWeek)
    : 1 + (8 - dayOfWeek)
  const electionDay = firstMonday + 1 // Tuesday after first Monday
  return `${year}-11-${String(electionDay).padStart(2, '0')}`
}
