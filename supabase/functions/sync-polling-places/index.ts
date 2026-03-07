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

// ─── Harris County ArcGIS Data Source ───────────────────────────────────────

const ARCGIS_BASE = 'https://services.arcgis.com/su8ic9KbA7PYVxPS/ArcGIS/rest/services';
const EV_LAYER = `${ARCGIS_BASE}/VoteCenters_0324_Act_EV_view/FeatureServer/0`;
const ED_LAYER = `${ARCGIS_BASE}/VoteCenters_0324_Act_ED_view/FeatureServer/0`;

interface ArcGISFeature {
  attributes: Record<string, any>;
  geometry?: { x: number; y: number };
}

async function fetchArcGISLayer(layerUrl: string): Promise<ArcGISFeature[]> {
  const allFeatures: ArcGISFeature[] = [];
  let offset = 0;
  const batchSize = 500;

  while (true) {
    const url = `${layerUrl}/query?where=Active='Active'&outFields=SiteID,Location,Address,Cross_Street,City,Zip,Voting_Room,EV_Voting_Room,ADA_Status,EV_ADA_Status,ADA,Facility_Type,District,Type,PCT,CC,US,SBOE,HD,SD,JP,X,Y&outSR=4326&resultOffset=${offset}&resultRecordCount=${batchSize}&f=json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) {
      console.error(`ArcGIS query failed: ${res.status} ${await res.text()}`);
      break;
    }
    const data = await res.json();
    const features: ArcGISFeature[] = data.features || [];
    allFeatures.push(...features);
    if (features.length < batchSize || !data.exceededTransferLimit) break;
    offset += batchSize;
  }

  return allFeatures;
}

function parseZip5(zip: string | null): number | null {
  if (!zip) return null;
  const clean = zip.replace(/[^0-9]/g, '').slice(0, 5);
  return clean.length === 5 ? parseInt(clean, 10) : null;
}

async function buildArcGISRow(
  feat: ArcGISFeature,
  locationType: 'Early Voting' | 'Election Day',
  electionId: string,
) {
  const a = feat.attributes;
  const name = a.Location || 'Unknown Location';
  const address = a.Address || '';
  const zip = String(a.Zip || '');

  const dedupeKey = `harris_arcgis|${a.SiteID || name}|${address}|${zip}`;
  const hash = await sha256(dedupeKey);
  const locationId = `LOC_HC_${hash.substring(0, 12)}`;

  const row: Record<string, any> = {
    location_id: locationId,
    location_name: name,
    address: address,
    city: a.City || null,
    zip_code: parseZip5(zip),
    location_type: locationType,
    election_id: electionId,
    is_active: 'Yes',
    data_source: 'harris_county_arcgis',
    last_updated: new Date().toISOString(),
  };

  // Coordinates
  const lng = feat.geometry?.x ?? a.X;
  const lat = feat.geometry?.y ?? a.Y;
  if (lat != null && lng != null) {
    row.latitude = lat;
    row.longitude = lng;
  }

  // Accessibility
  if (locationType === 'Early Voting') {
    row.hours_early_voting = 'Mon-Sat 7am-7pm, Sun 12pm-7pm'; // Harris County standard
    if (a.EV_ADA_Status === 'C' || a.ADA === 1) row.is_accessible = 'Yes';
  } else {
    row.hours_election_day = '7am-7pm';
    if (a.ADA_Status === 'C' || a.ADA === 1) row.is_accessible = 'Yes';
  }

  // Facility type as parking hint
  const facilityType = (a.Facility_Type || '').toLowerCase();
  if (facilityType.includes('church') || facilityType.includes('community center') || facilityType.includes('school')) {
    row.has_parking = 'Yes';
  }

  return row;
}

// ─── Google Civic Data Source (fallback) ────────────────────────────────────

async function getGoogleElectionId(): Promise<string | null> {
  try {
    const url = `https://www.googleapis.com/civicinfo/v2/elections?key=${GOOGLE_CIVIC_API_KEY}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const data = await res.json();
    const elections = data.elections || [];
    for (const el of elections) {
      const name = (el.name || '').toLowerCase();
      if (name.includes('texas') || name.includes('tx')) return el.id;
    }
    for (const el of elections) {
      if (el.id !== '2000') return el.id;
    }
    return null;
  } catch {
    return null;
  }
}

async function buildGoogleCivicRow(
  loc: any,
  locationType: 'Early Voting' | 'Election Day' | 'Drop-off',
  electionId: string,
) {
  const addr = loc.address || {};
  const name = addr.locationName || 'Unknown Location';
  const line1 = addr.line1 || '';
  const zip = addr.zip || '';

  const dedupeKey = `google_civic|${name}|${line1}|${zip}`;
  const hash = await sha256(dedupeKey);
  const locationId = `LOC_GC_${hash.substring(0, 12)}`;

  const row: Record<string, any> = {
    location_id: locationId,
    location_name: name,
    address: line1,
    city: addr.city || null,
    zip_code: parseZip5(zip),
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

  if (loc.notes) {
    const notesLower = loc.notes.toLowerCase();
    if (notesLower.includes('accessible') || notesLower.includes('wheelchair')) row.is_accessible = 'Yes';
    if (notesLower.includes('curbside')) row.has_curbside = 'Yes';
    if (notesLower.includes('parking')) row.has_parking = 'Yes';
  }

  return row;
}

// ─── Get active election ────────────────────────────────────────────────────

async function getActiveElection(): Promise<{ election_id: string; election_date: string } | null> {
  const rows = await db('elections?select=election_id,election_date&is_active=eq.Yes&order=election_date.asc&limit=1');
  if (rows && rows.length > 0) return rows[0];
  return null;
}

// ─── Main handler ───────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const body = await req.json().catch(() => ({}));
    const mode: string = body.mode || 'full';
    const source: string = body.source || 'harris_arcgis'; // 'harris_arcgis' | 'google_civic' | 'both'

    // Get our internal active election
    const activeElection = await getActiveElection();
    if (!activeElection) {
      return new Response(JSON.stringify({ success: false, error: 'No active election in DB' }), {
        status: 200, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }
    const electionId = activeElection.election_id;

    const allLocations: Record<string, any>[] = [];
    const stats: Record<string, any> = { election_id: electionId, source };

    // ── Source 1: Harris County ArcGIS ──
    if (source === 'harris_arcgis' || source === 'both') {
      console.log('Fetching Harris County ArcGIS vote centers...');

      const [evFeatures, edFeatures] = await Promise.all([
        fetchArcGISLayer(EV_LAYER),
        fetchArcGISLayer(ED_LAYER),
      ]);

      stats.arcgis_ev_raw = evFeatures.length;
      stats.arcgis_ed_raw = edFeatures.length;

      for (const feat of evFeatures) {
        allLocations.push(await buildArcGISRow(feat, 'Early Voting', electionId));
      }
      for (const feat of edFeatures) {
        allLocations.push(await buildArcGISRow(feat, 'Election Day', electionId));
      }

      console.log(`ArcGIS: ${evFeatures.length} EV + ${edFeatures.length} ED = ${allLocations.length} total`);
    }

    // ── Source 2: Google Civic (ZIP-based, for non-Harris County) ──
    if (source === 'google_civic' || source === 'both') {
      const googleElectionId = await getGoogleElectionId();
      stats.google_election_id = googleElectionId;

      if (googleElectionId) {
        const offset: number = body.offset || 0;
        const batchSize: number = Math.min(body.batch_size || 250, 250);
        const limit = mode === 'sample' ? 5 : batchSize;

        const zips = await db(`zip_codes?select=zip_code&order=zip_code.asc&offset=${offset}&limit=${limit}`);
        stats.google_zips_queried = zips?.length || 0;

        let apiCalls = 0;
        let apiErrors = 0;

        for (const zipRow of (zips || [])) {
          const zip = String(zipRow.zip_code);
          try {
            const url = `https://www.googleapis.com/civicinfo/v2/voterinfo?address=${zip},TX&electionId=${googleElectionId}&key=${GOOGLE_CIVIC_API_KEY}`;
            const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
            apiCalls++;
            if (!res.ok) { apiErrors++; if (apiCalls < (zips?.length || 0)) await sleep(200); continue; }

            const data = await res.json();
            for (const loc of (data.pollingLocations || [])) {
              allLocations.push(await buildGoogleCivicRow(loc, 'Election Day', electionId));
            }
            for (const loc of (data.earlyVoteSites || [])) {
              allLocations.push(await buildGoogleCivicRow(loc, 'Early Voting', electionId));
            }
            for (const loc of (data.dropOffLocations || [])) {
              allLocations.push(await buildGoogleCivicRow(loc, 'Drop-off', electionId));
            }
          } catch (err) {
            console.error(`Error processing ZIP ${zip}:`, (err as Error).message);
            apiErrors++;
          }
          if (apiCalls < (zips?.length || 0)) await sleep(200);
        }

        stats.google_api_calls = apiCalls;
        stats.google_api_errors = apiErrors;
      } else {
        stats.google_message = 'No Texas election found in Google Civic API';
      }
    }

    // ── Deduplicate by location_id ──
    const locationMap = new Map<string, Record<string, any>>();
    for (const loc of allLocations) {
      locationMap.set(loc.location_id, loc);
    }
    const uniqueLocations = Array.from(locationMap.values());
    stats.total_raw = allLocations.length;
    stats.unique_locations = uniqueLocations.length;

    // ── Batch upsert to voting_locations (50 per batch) ──
    let upserted = 0;
    let upsertErrors = 0;
    for (let i = 0; i < uniqueLocations.length; i += 50) {
      const batch = uniqueLocations.slice(i, i + 50);
      const result = await db('voting_locations?on_conflict=location_id', 'POST', batch);
      if (result) { upserted += batch.length; } else { upsertErrors += batch.length; }
    }
    stats.upserted = upserted;
    stats.upsert_errors = upsertErrors;

    // ── Log to ingestion_log ──
    await db('ingestion_log', 'POST', {
      event_type: 'sync_polling_places',
      source: source,
      status: upsertErrors === 0 ? 'success' : 'partial',
      message: `Synced ${upserted} locations from ${source} for election ${electionId}.`,
      item_count: upserted,
    });

    return new Response(JSON.stringify({ success: true, ...stats }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
