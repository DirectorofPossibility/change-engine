import "jsr:@supabase/functions-js/edge-runtime.d.ts";

/**
 * sync-elections — Fetch real election data from Google Civic API.
 *
 * 1. Discovers active elections via /elections endpoint
 * 2. For each election, queries /voterinfo by Houston-area ZIPs
 *    to get contests (races + candidates) and referendums (ballot items)
 * 3. Upserts to elections, candidates, and ballot_items tables
 * 4. Optionally enriches with Claude for plain-language summaries
 */

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const GOOGLE_CIVIC_API_KEY = Deno.env.get('GOOGLE_CIVIC_API_KEY')!;
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') || '';
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// ─── Supabase REST helper ────────────────────────────────────────────────────

async function db(path: string, method = 'GET', body?: unknown) {
  const url = `${SUPABASE_URL}/rest/v1/${path}`;
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
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  if (!res.ok) {
    const err = await res.text();
    console.error(`DB ${method} ${path}: ${res.status} ${err}`);
    return null;
  }
  return res.json();
}

async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ─── Google Civic API ────────────────────────────────────────────────────────

interface GoogleElection {
  id: string;
  name: string;
  electionDay: string; // YYYY-MM-DD
  ocdDivisionId?: string;
}

interface GoogleContest {
  type: string;
  office?: string;
  district?: { name?: string; scope?: string };
  candidates?: GoogleCandidate[];
  referendumTitle?: string;
  referendumSubtitle?: string;
  referendumText?: string;
  referendumProStatement?: string;
  referendumConStatement?: string;
  referendumPassageThreshold?: string;
  roles?: string[];
  level?: string[];
}

interface GoogleCandidate {
  name: string;
  party?: string;
  candidateUrl?: string;
  email?: string;
  phone?: string;
  photoUrl?: string;
  channels?: { type: string; id: string }[];
}

/** Discover active elections from Google Civic. */
async function fetchGoogleElections(): Promise<GoogleElection[]> {
  try {
    const url = `https://www.googleapis.com/civicinfo/v2/elections?key=${GOOGLE_CIVIC_API_KEY}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) {
      console.error(`Google elections API: ${res.status}`);
      return [];
    }
    const data = await res.json();
    return (data.elections || []).filter((e: GoogleElection) => e.id !== '2000'); // Exclude test election
  } catch (err) {
    console.error('Failed to fetch Google elections:', (err as Error).message);
    return [];
  }
}

/** Fetch voter info (contests, referendums) for a given election + address. */
async function fetchVoterInfo(electionId: string, address: string): Promise<{
  election?: { name: string; electionDay: string };
  contests: GoogleContest[];
}> {
  try {
    const url = `https://www.googleapis.com/civicinfo/v2/voterinfo?address=${encodeURIComponent(address)}&electionId=${electionId}&key=${GOOGLE_CIVIC_API_KEY}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return { contests: [] };
    const data = await res.json();
    return {
      election: data.election,
      contests: data.contests || [],
    };
  } catch {
    return { contests: [] };
  }
}

// ─── Claude enrichment (optional) ────────────────────────────────────────────

async function enrichWithClaude(prompt: string): Promise<string | null> {
  if (!ANTHROPIC_API_KEY) return null;
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
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.content?.[0]?.text?.trim() || null;
  } catch {
    return null;
  }
}

// ─── Election type inference ─────────────────────────────────────────────────

function inferElectionType(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('runoff')) return 'Runoff';
  if (lower.includes('primary')) return 'Primary';
  if (lower.includes('general')) return 'General';
  if (lower.includes('special')) return 'Special';
  if (lower.includes('constitutional')) return 'Constitutional Amendment';
  if (lower.includes('bond')) return 'Bond';
  return 'General';
}

/** Infer jurisdiction from election name or contest data */
function inferJurisdiction(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('houston') || lower.includes('city of houston')) return 'City of Houston';
  if (lower.includes('harris') || lower.includes('harris county')) return 'Harris County';
  if (lower.includes('texas') || lower.includes('tx')) return 'State of Texas';
  if (lower.includes('us ') || lower.includes('united states') || lower.includes('federal')) return 'Federal';
  return 'Harris County'; // default for Houston-area elections
}

/** Infer office level from contest data */
function inferOfficeLevel(contest: GoogleContest): string {
  const levels = contest.level || [];
  const roles = contest.roles || [];
  const scope = contest.district?.scope || '';
  if (levels.includes('country') || scope === 'national') return 'Federal';
  if (levels.includes('administrativeArea1') || scope === 'statewide' || roles.includes('legislatorUpperBody') || roles.includes('legislatorLowerBody')) return 'State';
  if (levels.includes('administrativeArea2') || scope === 'countywide') return 'County';
  if (levels.includes('locality') || scope === 'citywide') return 'City';
  return 'Other';
}

// ─── Build DB rows ───────────────────────────────────────────────────────────

function buildElectionRow(googleElection: GoogleElection): Record<string, unknown> {
  const electionId = `ELEC_GC_${googleElection.id}`;

  // Texas registration deadline: 30 days before election day
  const electionDate = new Date(googleElection.electionDay + 'T00:00:00');
  const regDeadline = new Date(electionDate.getTime() - 30 * 24 * 60 * 60 * 1000);
  const regDeadlineISO = regDeadline.toISOString().split('T')[0];

  // Early voting in Texas: typically starts 17 days before, ends 4 days before
  const evStart = new Date(electionDate.getTime() - 17 * 24 * 60 * 60 * 1000);
  const evEnd = new Date(electionDate.getTime() - 4 * 24 * 60 * 60 * 1000);

  return {
    election_id: electionId,
    election_name: googleElection.name,
    election_date: googleElection.electionDay,
    election_type: inferElectionType(googleElection.name),
    jurisdiction: inferJurisdiction(googleElection.name),
    is_active: 'Yes',
    registration_deadline: regDeadlineISO,
    early_voting_start: evStart.toISOString().split('T')[0],
    early_voting_end: evEnd.toISOString().split('T')[0],
    polls_open: '7:00 AM',   // Texas standard
    polls_close: '7:00 PM',  // Texas standard
    find_polling_url: 'https://www.harrisvotes.com/Polling-Locations',
    register_url: 'https://www.votetexas.gov/register-to-vote/',
    data_source: 'google_civic',
    last_updated: new Date().toISOString(),
  };
}

async function buildCandidateRow(
  candidate: GoogleCandidate,
  contest: GoogleContest,
  electionId: string,
): Promise<Record<string, unknown>> {
  const hash = await sha256(`${electionId}|${contest.office || ''}|${candidate.name}`);
  const candidateId = `CAND_GC_${hash.substring(0, 12)}`;

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
  };

  // Extract LinkedIn from channels
  if (candidate.channels) {
    for (const ch of candidate.channels) {
      if (ch.type === 'LinkedIn') row.linkedin_url = `https://linkedin.com/in/${ch.id}`;
    }
  }

  return row;
}

async function buildBallotItemRow(
  contest: GoogleContest,
  electionId: string,
  electionDate: string,
): Promise<Record<string, unknown>> {
  const title = contest.referendumTitle || contest.office || 'Unknown';
  const hash = await sha256(`${electionId}|${title}`);
  const itemId = `BALL_GC_${hash.substring(0, 12)}`;

  // Determine item type from title
  const lower = title.toLowerCase();
  let itemType = 'Proposition';
  if (lower.includes('bond')) itemType = 'Bond';
  else if (lower.includes('amendment')) itemType = 'Constitutional Amendment';
  else if (lower.includes('measure')) itemType = 'Measure';

  return {
    item_id: itemId,
    item_name: title,
    election_id: electionId,
    election_date: electionDate,
    item_type: itemType,
    jurisdiction: inferJurisdiction(title),
    description: contest.referendumText || contest.referendumSubtitle || null,
    for_argument: contest.referendumProStatement || null,
    against_argument: contest.referendumConStatement || null,
    is_active: 'Yes',
    data_source: 'google_civic',
    last_updated: new Date().toISOString(),
  };
}

// ─── Main handler ────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const body = await req.json().catch(() => ({}));
    const mode: string = body.mode || 'full';
    const enrich: boolean = body.enrich !== false; // enrichment on by default

    const stats = {
      elections_found: 0,
      elections_upserted: 0,
      candidates_upserted: 0,
      ballot_items_upserted: 0,
      enriched: 0,
      errors: 0,
      zips_queried: 0,
    };

    // ── Step 1: Discover elections ──
    console.log('Fetching elections from Google Civic API...');
    const googleElections = await fetchGoogleElections();
    stats.elections_found = googleElections.length;

    if (googleElections.length === 0) {
      await db('ingestion_log', 'POST', {
        event_type: 'sync_elections',
        source: 'google_civic',
        status: 'success',
        message: 'No active elections found in Google Civic API',
        item_count: 0,
      });
      return new Response(JSON.stringify({ success: true, message: 'No active elections found', ...stats }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // Filter to Texas/Houston-relevant elections
    const relevantElections = googleElections.filter(e => {
      const lower = (e.name || '').toLowerCase();
      // Include Texas elections + any US-wide general elections
      return lower.includes('texas') || lower.includes('tx') ||
             lower.includes('houston') || lower.includes('harris') ||
             lower.includes('general election') || lower.includes('primary election');
    });

    // If no Texas-specific match, take the first non-test election (national elections apply)
    const electionsToProcess = relevantElections.length > 0
      ? relevantElections
      : googleElections.slice(0, 3);

    console.log(`Processing ${electionsToProcess.length} elections`);

    // ── Step 2: Upsert elections ──
    const electionRows = electionsToProcess.map(buildElectionRow);
    const upsertResult = await db('elections?on_conflict=election_id', 'POST', electionRows);
    if (upsertResult) {
      stats.elections_upserted = electionRows.length;
    } else {
      stats.errors++;
    }

    // ── Step 3: Fetch contests + candidates + ballot items per election ──
    // Use a set of Houston-area ZIP codes to get comprehensive contest coverage
    const HOUSTON_ZIPS = [
      '77001', '77002', '77003', '77004', '77005', '77006', '77007', '77008',
      '77009', '77010', '77011', '77012', '77013', '77014', '77015', '77016',
      '77017', '77018', '77019', '77020', '77021', '77022', '77023', '77024',
      '77025', '77026', '77027', '77028', '77029', '77030', '77031', '77032',
      '77033', '77034', '77035', '77036', '77037', '77038', '77039', '77040',
      '77041', '77042', '77043', '77044', '77045', '77046', '77047', '77048',
      '77049', '77050', '77051', '77053', '77054', '77055', '77056', '77057',
      '77058', '77059', '77060', '77061', '77062', '77063', '77064', '77065',
      '77066', '77067', '77068', '77069', '77070', '77071', '77072', '77073',
      '77074', '77075', '77076', '77077', '77078', '77079', '77080', '77081',
      '77082', '77083', '77084', '77085', '77086', '77087', '77088', '77089',
      '77090', '77091', '77092', '77093', '77094', '77095', '77096', '77098',
      '77099',
    ];

    // In sample mode, just use a few representative ZIPs across Houston
    const zipsToQuery = mode === 'sample'
      ? ['77002', '77024', '77045', '77084', '77058'] // downtown, memorial, south, west, clear lake
      : HOUSTON_ZIPS;

    const allCandidates = new Map<string, Record<string, unknown>>();
    const allBallotItems = new Map<string, Record<string, unknown>>();

    for (const election of electionsToProcess) {
      const electionId = `ELEC_GC_${election.id}`;
      const seenContests = new Set<string>(); // dedupe contests across ZIPs

      for (const zip of zipsToQuery) {
        const info = await fetchVoterInfo(election.id, `${zip}, TX`);
        stats.zips_queried++;

        for (const contest of info.contests) {
          // Dedupe by office/referendum title
          const contestKey = contest.referendumTitle || contest.office || '';
          if (seenContests.has(contestKey)) continue;
          seenContests.add(contestKey);

          if (contest.referendumTitle) {
            // It's a ballot item (referendum/proposition)
            const row = await buildBallotItemRow(contest, electionId, election.electionDay);
            allBallotItems.set(row.item_id as string, row);
          } else if (contest.candidates && contest.candidates.length > 0) {
            // It's a race with candidates
            for (const candidate of contest.candidates) {
              const row = await buildCandidateRow(candidate, contest, electionId);
              allCandidates.set(row.candidate_id as string, row);
            }
          }
        }

        // Throttle API calls
        if (stats.zips_queried < zipsToQuery.length * electionsToProcess.length) {
          await sleep(200);
        }
      }
    }

    // ── Step 4: Batch upsert candidates ──
    const candidateRows = Array.from(allCandidates.values());
    if (candidateRows.length > 0) {
      for (let i = 0; i < candidateRows.length; i += 50) {
        const batch = candidateRows.slice(i, i + 50);
        const result = await db('candidates?on_conflict=candidate_id', 'POST', batch);
        if (result) {
          stats.candidates_upserted += batch.length;
        } else {
          stats.errors++;
        }
      }
    }

    // ── Step 5: Batch upsert ballot items ──
    const ballotItemRows = Array.from(allBallotItems.values());
    if (ballotItemRows.length > 0) {
      for (let i = 0; i < ballotItemRows.length; i += 50) {
        const batch = ballotItemRows.slice(i, i + 50);
        const result = await db('ballot_items?on_conflict=item_id', 'POST', batch);
        if (result) {
          stats.ballot_items_upserted += batch.length;
        } else {
          stats.errors++;
        }
      }
    }

    // ── Step 6: Enrich with Claude (plain-language summaries) ──
    if (enrich && ANTHROPIC_API_KEY) {
      // Enrich elections with community_impact_summary
      for (const row of electionRows) {
        if (row.community_impact_summary) continue;
        const summary = await enrichWithClaude(
          `Write a 2-sentence plain-language summary of what this election means for Houston residents. ` +
          `Use simple language (6th grade reading level). Be specific to Houston/Harris County where possible. ` +
          `Election: ${row.election_name}, Date: ${row.election_date}, Type: ${row.election_type}. ` +
          `Just return the summary text, no labels or formatting.`
        );
        if (summary) {
          await db(`elections?election_id=eq.${row.election_id}`, 'PATCH', {
            community_impact_summary: summary,
            description: summary,
          });
          stats.enriched++;
        }
        await sleep(500);
      }

      // Enrich ballot items with description_5th_grade
      for (const row of ballotItemRows) {
        if (!row.description || (row as Record<string, unknown>).description_5th_grade) continue;
        const simplified = await enrichWithClaude(
          `Rewrite this ballot measure description in plain language a 5th grader could understand. ` +
          `Keep it to 2-3 sentences. Be accurate but simple. ` +
          `Title: ${row.item_name}. Description: ${row.description}. ` +
          `Just return the simplified text, no labels or formatting.`
        );
        if (simplified) {
          await db(`ballot_items?item_id=eq.${row.item_id}`, 'PATCH', {
            description_5th_grade: simplified,
          });
          stats.enriched++;
        }
        await sleep(500);
      }
    }

    // ── Step 7: Log ──
    await db('ingestion_log', 'POST', {
      event_type: 'sync_elections',
      source: 'google_civic',
      status: stats.errors === 0 ? 'success' : 'partial',
      message: `Synced ${stats.elections_upserted} elections, ${stats.candidates_upserted} candidates, ${stats.ballot_items_upserted} ballot items. Enriched ${stats.enriched} items.`,
      item_count: stats.elections_upserted + stats.candidates_upserted + stats.ballot_items_upserted,
    });

    console.log('Sync complete:', stats);

    return new Response(JSON.stringify({ success: true, ...stats }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('sync-elections error:', (err as Error).message);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
