import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const GOOGLE_CIVIC_API_KEY = Deno.env.get('GOOGLE_CIVIC_API_KEY')!;
const CORS = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS'};

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function db(path: string, method = 'GET', body?: any) {
  const url = `${SUPABASE_URL}/rest/v1/${path}`;
  const opts: RequestInit = {
    method,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: method === 'POST' ? 'return=representation,resolution=merge-duplicates' : method === 'GET' ? '' : 'return=representation',
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

// Fetch the Google election ID for the upcoming Texas election
async function getGoogleElectionId(): Promise<string | null> {
  try {
    const url = `https://www.googleapis.com/civicinfo/v2/elections?key=${GOOGLE_CIVIC_API_KEY}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) {
      console.error(`Elections API error: ${res.status} ${await res.text()}`);
      return null;
    }
    const data = await res.json();
    const elections = data.elections || [];
    // Find a Texas or general US election, prefer the most recent upcoming one
    for (const el of elections) {
      const name = (el.name || '').toLowerCase();
      if (name.includes('texas') || name.includes('tx')) {
        return el.id;
      }
    }
    // Fallback: use the first non-test election (id !== "2000")
    for (const el of elections) {
      if (el.id !== '2000') return el.id;
    }
    return null;
  } catch (err) {
    console.error('Failed to fetch Google elections:', (err as Error).message);
    return null;
  }
}

// Get our internal active election
async function getActiveElection(): Promise<{ election_id: string; election_date: string } | null> {
  const rows = await db('elections?select=election_id,election_date&is_active=eq.Yes&order=election_date.asc&limit=1');
  if (rows && rows.length > 0) return rows[0];
  return null;
}

interface CivicAddress {
  locationName?: string;
  line1?: string;
  city?: string;
  state?: string;
  zip?: string;
}

interface CivicLocation {
  address?: CivicAddress;
  pollingHours?: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
}

async function buildLocationRow(
  loc: CivicLocation,
  locationType: 'Early Voting' | 'Election Day' | 'Drop-off',
  electionId: string,
) {
  const addr = loc.address || {};
  const name = addr.locationName || 'Unknown Location';
  const line1 = addr.line1 || '';
  const zip = addr.zip || '';

  const dedupeKey = `google_civic|${name}|${line1}|${zip}`;
  const hash = await sha256(dedupeKey);
  const locationId = `LOC_${hash.substring(0, 12)}`;

  const row: Record<string, any> = {
    location_id: locationId,
    location_name: name,
    address: line1,
    city: addr.city || null,
    zip_code: zip ? parseInt(zip, 10) : null,
    location_type: locationType,
    election_id: electionId,
    is_active: 'Yes',
    data_source: 'google_civic',
    last_updated: new Date().toISOString(),
  };

  if (locationType === 'Early Voting') {
    row.hours_early_voting = loc.pollingHours || null;
  } else if (locationType === 'Election Day') {
    row.hours_election_day = loc.pollingHours || null;
  }

  if (loc.latitude != null) row.latitude = loc.latitude;
  if (loc.longitude != null) row.longitude = loc.longitude;

  // Parse notes for accessibility info
  if (loc.notes) {
    const notesLower = loc.notes.toLowerCase();
    if (notesLower.includes('accessible') || notesLower.includes('wheelchair')) {
      row.is_accessible = 'Yes';
    }
    if (notesLower.includes('curbside')) {
      row.has_curbside = 'Yes';
    }
    if (notesLower.includes('parking')) {
      row.has_parking = 'Yes';
    }
  }

  return row;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const body = await req.json().catch(() => ({}));
    const mode: string = body.mode || 'sample';
    const offset: number = body.offset || 0;
    const batchSize: number = Math.min(body.batch_size || 250, 250);

    // Step 1: Get Google election ID
    const googleElectionId = await getGoogleElectionId();
    if (!googleElectionId) {
      return new Response(JSON.stringify({ success: false, error: 'No Google election found' }), {
        status: 200, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // Step 2: Get our internal active election
    const activeElection = await getActiveElection();
    if (!activeElection) {
      return new Response(JSON.stringify({ success: false, error: 'No active election in DB' }), {
        status: 200, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }
    const electionId = activeElection.election_id;

    // Step 3: Fetch ZIP codes
    const limit = mode === 'sample' ? 5 : batchSize;
    const zips = await db(`zip_codes?select=zip_code&order=zip_code.asc&offset=${offset}&limit=${limit}`);
    if (!zips || zips.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No ZIPs to process', zips_processed: 0 }), {
        status: 200, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // Step 4: For each ZIP, call voterinfo API
    const allLocations: Record<string, any>[] = [];
    let apiCalls = 0;
    let apiErrors = 0;
    let zipsWithData = 0;

    for (const zipRow of zips) {
      const zip = String(zipRow.zip_code);
      try {
        const url = `https://www.googleapis.com/civicinfo/v2/voterinfo?address=${zip},TX&electionId=${googleElectionId}&key=${GOOGLE_CIVIC_API_KEY}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
        apiCalls++;

        if (!res.ok) {
          const errText = await res.text();
          // 400 with "Election unknown" or "No voter info" is expected for some ZIPs
          if (res.status !== 400) {
            console.error(`VoterInfo API error for ZIP ${zip}: ${res.status} ${errText}`);
          }
          apiErrors++;
          if (apiCalls < zips.length) await sleep(200);
          continue;
        }

        const data = await res.json();
        let zipHasData = false;

        // Parse pollingLocations (Election Day)
        for (const loc of (data.pollingLocations || [])) {
          allLocations.push(await buildLocationRow(loc, 'Election Day', electionId));
          zipHasData = true;
        }

        // Parse earlyVoteSites (Early Voting)
        for (const loc of (data.earlyVoteSites || [])) {
          allLocations.push(await buildLocationRow(loc, 'Early Voting', electionId));
          zipHasData = true;
        }

        // Parse dropOffLocations (Drop-off)
        for (const loc of (data.dropOffLocations || [])) {
          allLocations.push(await buildLocationRow(loc, 'Drop-off', electionId));
          zipHasData = true;
        }

        if (zipHasData) zipsWithData++;
      } catch (err) {
        console.error(`Error processing ZIP ${zip}:`, (err as Error).message);
        apiErrors++;
      }

      if (apiCalls < zips.length) await sleep(200);
    }

    // Step 5: Deduplicate by location_id (same location may appear for multiple ZIPs)
    const locationMap = new Map<string, Record<string, any>>();
    for (const loc of allLocations) {
      locationMap.set(loc.location_id, loc);
    }
    const uniqueLocations = Array.from(locationMap.values());

    // Step 6: Batch upsert to voting_locations (50 per batch)
    let upserted = 0;
    let upsertErrors = 0;
    for (let i = 0; i < uniqueLocations.length; i += 50) {
      const batch = uniqueLocations.slice(i, i + 50);
      const result = await db('voting_locations?on_conflict=location_id', 'POST', batch);
      if (result) { upserted += batch.length; } else { upsertErrors += batch.length; }
    }

    // Step 7: Log to ingestion_log
    await db('ingestion_log', 'POST', {
      event_type: 'sync_polling_places',
      source: 'google_civic',
      status: upsertErrors === 0 ? 'success' : 'partial',
      message: `Synced ${upserted} locations from ${zips.length} ZIPs (${zipsWithData} had data, offset ${offset}).`,
      item_count: upserted,
    });

    return new Response(JSON.stringify({
      success: true,
      mode,
      offset,
      google_election_id: googleElectionId,
      internal_election_id: electionId,
      zips_processed: zips.length,
      zips_with_data: zipsWithData,
      api_calls: apiCalls,
      api_errors: apiErrors,
      total_locations_found: allLocations.length,
      unique_locations: uniqueLocations.length,
      upserted,
      upsert_errors: upsertErrors,
      next_offset: offset + zips.length,
      message: `Synced ${upserted} polling places from ${zips.length} ZIPs`,
    }), { headers: { ...CORS, 'Content-Type': 'application/json' } });

  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
