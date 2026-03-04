import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  fetchFullTaxonomy,
  buildPromptForEntity,
  callClaude,
  parseClaudeJson,
  validateAndEnrich,
  populateAllJunctions,
} from '../_shared/classifier.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;
const GOOGLE_CIVIC_API_KEY = Deno.env.get('GOOGLE_CIVIC_API_KEY')!;
const CONGRESS_API_KEY = Deno.env.get('CONGRESS_API_KEY')!;
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

// ============================================
// PHASE 1: Google divisionsByAddress → ZIP district mapping
// ============================================
async function syncZipDistricts(zips: any[]) {
  const zipDistricts = new Map<string, { congressional?: string; state_senate?: string; state_house?: string }>();
  let apiCalls = 0;
  let apiErrors = 0;

  for (const zipRow of zips) {
    const zip = String(zipRow.zip_code);
    try {
      const url = `https://www.googleapis.com/civicinfo/v2/divisionsByAddress?address=${zip}&key=${GOOGLE_CIVIC_API_KEY}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      apiCalls++;

      if (!res.ok) {
        const errText = await res.text();
        console.error(`Divisions API error for ZIP ${zip}: ${res.status} ${errText}`);
        apiErrors++;
        continue;
      }

      const data = await res.json();
      const divisions = data.divisions || {};
      const zipDist: any = {};

      for (const ocdId of Object.keys(divisions)) {
        const cdMatch = ocdId.match(/\/cd:(\d+)/);
        if (cdMatch) zipDist.congressional = cdMatch[1];
        const slduMatch = ocdId.match(/\/sldu:(\d+)/);
        if (slduMatch) zipDist.state_senate = slduMatch[1];
        const sldlMatch = ocdId.match(/\/sldl:(\d+)/);
        if (sldlMatch) zipDist.state_house = sldlMatch[1];
      }

      if (Object.keys(zipDist).length > 0) {
        zipDistricts.set(zip, zipDist);
      }
    } catch (err) {
      console.error(`Error processing ZIP ${zip}:`, (err as Error).message);
      apiErrors++;
    }
    if (apiCalls < zips.length) await sleep(200);
  }

  // Update zip_codes table
  let zipsUpdated = 0;
  for (const [zip, dist] of zipDistricts) {
    const updates: any = {};
    if (dist.congressional) updates.congressional_district = dist.congressional;
    if (dist.state_senate) updates.state_senate_district = dist.state_senate;
    if (dist.state_house) updates.state_house_district = dist.state_house;
    if (Object.keys(updates).length > 0) {
      const result = await db(`zip_codes?zip_code=eq.${zip}`, 'PATCH', updates);
      if (result) zipsUpdated++;
    }
  }

  return { zipDistricts, apiCalls, apiErrors, zipsUpdated };
}

// ============================================
// PHASE 2: Congress.gov Member API → federal officials
// ============================================
async function syncCongressMembers(govLevelMap: Map<string, string>) {
  const officialMap = new Map<string, any>();
  let memberApiCalls = 0;
  let memberApiErrors = 0;

  // Fetch TX members from Congress.gov (current congress)
  const url = `https://api.congress.gov/v3/member?stateCode=TX&currentMember=true&limit=100&api_key=${CONGRESS_API_KEY}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    memberApiCalls++;

    if (!res.ok) {
      const errText = await res.text();
      console.error(`Congress member API error: ${res.status} ${errText}`);
      memberApiErrors++;
      return { officialMap, memberApiCalls, memberApiErrors };
    }

    const data = await res.json();
    const members = data.members || [];
    const govLevelId = govLevelMap.get('federal') || null;

    for (const member of members) {
      const name = member.name || '';
      // Congress.gov returns name as "LastName, FirstName"
      const nameParts = name.split(', ');
      const displayName = nameParts.length === 2 ? `${nameParts[1]} ${nameParts[0]}` : name;

      const chamber = (member.terms?.item?.[0]?.chamber || member.chamber || '').toLowerCase();
      const title = chamber === 'senate' ? 'U.S. Senator' : 'U.S. Representative';
      const district = member.district?.toString() || null;

      const dedupeKey = `congress_gov|${member.bioguideId || name}`;
      const hash = await sha256(dedupeKey);
      const officialId = `OFF_${hash.substring(0, 12)}`;

      const party = member.partyName || member.party || null;
      const depiction = member.depiction?.imageUrl || null;
      const officialUrl = member.url || (member.bioguideId ? `https://bioguide.congress.gov/search/bio/${member.bioguideId}` : null);

      officialMap.set(dedupeKey, {
        official_id: officialId,
        official_name: displayName,
        title,
        party,
        level: 'Federal',
        gov_level_id: govLevelId,
        district_id: district,
        district_type: chamber === 'senate' ? 'state' : 'congressional',
        website: officialUrl,
        data_source: 'congress_gov',
        last_updated: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error('Congress member API fetch error:', (err as Error).message);
    memberApiErrors++;
  }

  return { officialMap, memberApiCalls, memberApiErrors };
}

// ============================================
// MAIN HANDLER
// ============================================
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const body = await req.json().catch(() => ({}));
    const mode: string = body.mode || 'sample';
    const offset: number = body.offset || 0;
    const batchSize: number = Math.min(body.batch_size || 50, 250);
    const triggerClassify: boolean = body.trigger_classify === true;

    // Fetch government_levels for level mapping
    const govLevels = await db('government_levels?select=gov_level_id,level_name&limit=50') || [];
    const govLevelMap = new Map<string, string>();
    for (const gl of govLevels) { govLevelMap.set((gl.level_name || '').toLowerCase(), gl.gov_level_id); }

    // PHASE 1: ZIP district mapping via Google Divisions API
    let districtResult = { zipDistricts: new Map(), apiCalls: 0, apiErrors: 0, zipsUpdated: 0 };
    let zipsProcessed = 0;
    if (GOOGLE_CIVIC_API_KEY) {
      const limit = mode === 'sample' ? 5 : batchSize;
      const zips = await db(`zip_codes?select=zip_code&order=zip_code.asc&offset=${offset}&limit=${limit}`);
      if (zips && zips.length > 0) {
        zipsProcessed = zips.length;
        districtResult = await syncZipDistricts(zips);
      }
    }

    // PHASE 2: Federal officials via Congress.gov Member API
    let memberResult = { officialMap: new Map<string, any>(), memberApiCalls: 0, memberApiErrors: 0 };
    if (CONGRESS_API_KEY) {
      memberResult = await syncCongressMembers(govLevelMap);
    }

    // Upsert officials
    const officialsList = Array.from(memberResult.officialMap.values());
    let upserted = 0;
    let upsertErrors = 0;
    for (let i = 0; i < officialsList.length; i += 50) {
      const batch = officialsList.slice(i, i + 50);
      const result = await db('elected_officials?on_conflict=official_id', 'POST', batch);
      if (result) { upserted += batch.length; } else { upsertErrors += batch.length; }
    }

    // Log to ingestion_log
    await db('ingestion_log', 'POST', {
      event_type: 'sync_officials',
      source: 'congress_gov+google_divisions',
      status: upsertErrors === 0 ? 'success' : 'partial',
      message: `Synced ${upserted} officials, ${districtResult.zipsUpdated} ZIP districts updated (${zipsProcessed} ZIPs, offset ${offset}).`,
      item_count: upserted,
    });

    // Inline classification for newly upserted officials
    let classified = 0;
    if (triggerClassify && upserted > 0 && ANTHROPIC_KEY) {
      try {
        const taxonomy = await fetchFullTaxonomy(SUPABASE_URL, SUPABASE_KEY);
        const systemPrompt = buildPromptForEntity(taxonomy, 'elected_official');

        // Classify officials that don't have v4-unified classification yet
        const unclassified = await db(`elected_officials?select=official_id,official_name,title,party,level,jurisdiction,description_5th_grade&classification_v2=is.null&limit=5`);
        if (unclassified && unclassified.length > 0) {
          for (const official of unclassified) {
            try {
              const userContent = `Name: ${official.official_name}\nTitle: ${official.title || ''}\nParty: ${official.party || ''}\nLevel: ${official.level || ''}\nJurisdiction: ${official.jurisdiction || ''}\nDescription: ${official.description_5th_grade || ''}\n\nReturn JSON with: theme_primary, theme_secondary, focus_area_ids, sdg_ids, sdoh_code, ntee_codes, airs_codes, center, audience_segment_ids, life_situation_ids, gov_level_id, keywords, geographic_scope, title_6th_grade, summary_6th_grade, confidence, reasoning`;
              const rawText = await callClaude(systemPrompt, userContent, ANTHROPIC_KEY, 1000);
              const raw = parseClaudeJson(rawText);
              const enriched = validateAndEnrich(raw, taxonomy);

              await db(`elected_officials?official_id=eq.${official.official_id}`, 'PATCH', {
                classification_v2: enriched,
                focus_area_ids: (enriched.focus_area_ids || []).join(','),
              });
              await populateAllJunctions('elected_official', official.official_id, enriched, SUPABASE_URL, SUPABASE_KEY);
              classified++;
              await sleep(1000);
            } catch (err) { console.error(`Classify error for ${official.official_id}:`, (err as Error).message); }
          }
        }
      } catch (err) { console.error('Inline classification error:', (err as Error).message); }
    }

    return new Response(JSON.stringify({
      success: true, mode, offset,
      zips_processed: zipsProcessed,
      zips_districts_updated: districtResult.zipsUpdated,
      division_api_calls: districtResult.apiCalls,
      division_api_errors: districtResult.apiErrors,
      unique_officials: officialsList.length,
      upserted, upsert_errors: upsertErrors,
      member_api_calls: memberResult.memberApiCalls,
      member_api_errors: memberResult.memberApiErrors,
      next_offset: offset + zipsProcessed,
      classified,
      message: `Synced ${upserted} officials, ${districtResult.zipsUpdated} ZIP districts updated, ${classified} classified inline`,
    }), { headers: { ...CORS, 'Content-Type': 'application/json' } });

  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
