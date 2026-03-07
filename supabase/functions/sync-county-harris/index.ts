import "jsr:@supabase/functions-js/edge-runtime.d.ts";

/**
 * sync-county-harris — Ingests Harris County Commissioners Court members,
 * county-elected officials, and county legislation from the Legistar Web API.
 *
 * API docs: https://webapi.legistar.com/Help
 * Base URL: https://webapi.legistar.com/v1/harriscounty
 *
 * Also populates policy_geography so policies show on maps.
 *
 * Request body:
 *   { mode: 'recent'|'full', batch_size?: number }
 */

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const LEGISTAR_TOKEN = Deno.env.get('LEGISTAR_TOKEN') || '';
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const LEGISTAR_BASE = 'https://webapi.legistar.com/v1/harriscounty';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// ── DB helper ─────────────────────────────────────────────────────────

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

// ── Legistar fetch helper ─────────────────────────────────────────────

async function legistar(endpoint: string): Promise<unknown | null> {
  const separator = endpoint.includes('?') ? '&' : '?';
  const tokenParam = LEGISTAR_TOKEN ? `${separator}token=${LEGISTAR_TOKEN}` : '';
  const url = `${LEGISTAR_BASE}/${endpoint}${tokenParam}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) {
      console.error(`Legistar ${endpoint}: ${res.status} ${await res.text()}`);
      return null;
    }
    return res.json();
  } catch (err) {
    console.error(`Legistar ${endpoint} error:`, (err as Error).message);
    return null;
  }
}

// ── SHA-256 helper ────────────────────────────────────────────────────

async function sha256Short(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const hex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  return hex.substring(0, 12);
}

// ── Status mapping ────────────────────────────────────────────────────

function mapMatterStatus(statusName: string): string {
  const s = (statusName || '').toLowerCase();
  if (s.includes('adopted') || s.includes('passed') || s.includes('approved') || s.includes('enacted')) return 'Passed';
  if (s.includes('introduced') || s.includes('read') || s.includes('filed')) return 'Introduced';
  if (s.includes('failed') || s.includes('defeated') || s.includes('withdrawn') || s.includes('tabled')) return 'Failed';
  if (s.includes('signed') || s.includes('effective')) return 'Enacted';
  if (s.includes('pending') || s.includes('committee') || s.includes('hearing')) return 'Pending';
  return 'Pending';
}

// ── Format bill number ───────────────────────────────────────────────

function formatBillNumber(matterType: string | null, matterFile: string | null): string {
  if (!matterType && !matterFile) return '';
  const typePrefix = (matterType || '').replace(/\s+/g, ' ').trim();
  const file = (matterFile || '').trim();
  if (typePrefix && file) return `${typePrefix} ${file}`;
  return file || typePrefix;
}

// ── Map official title from body name ─────────────────────────────────

function parseCountyTitle(bodyName: string, personTitle?: string): { title: string; districtType: string; districtId: string } {
  const b = (bodyName || '').toLowerCase();
  const p = (personTitle || '').toLowerCase();

  if (b.includes('judge') || p.includes('judge')) {
    return { title: 'County Judge', districtType: 'county', districtId: 'county-judge' };
  }
  const precinctMatch = b.match(/precinct\s*(\d+)/i) || p.match(/precinct\s*(\d+)/i);
  if (precinctMatch) {
    return { title: 'County Commissioner', districtType: 'commissioner_precinct', districtId: precinctMatch[1] };
  }
  if (b.includes('commissioner') || p.includes('commissioner')) {
    return { title: 'County Commissioner', districtType: 'commissioner_precinct', districtId: 'at-large' };
  }
  if (b.includes('clerk') || p.includes('clerk')) {
    return { title: 'County Clerk', districtType: 'county', districtId: 'county-clerk' };
  }
  if (b.includes('sheriff') || p.includes('sheriff')) {
    return { title: 'County Sheriff', districtType: 'county', districtId: 'county-sheriff' };
  }
  if (b.includes('attorney') || p.includes('attorney') || b.includes('da ') || p.includes('district attorney')) {
    return { title: 'District Attorney', districtType: 'county', districtId: 'county-da' };
  }
  if (b.includes('treasurer') || p.includes('treasurer')) {
    return { title: 'County Treasurer', districtType: 'county', districtId: 'county-treasurer' };
  }
  if (b.includes('tax') || p.includes('tax')) {
    return { title: 'Tax Assessor-Collector', districtType: 'county', districtId: 'county-tax' };
  }
  return { title: personTitle || 'County Official', districtType: 'county', districtId: 'county' };
}

// ── Populate policy_geography for county policies ─────────────────────

async function bindPolicyGeography(policyId: string) {
  await db('policy_geography?on_conflict=policy_id,geo_type,geo_id', 'POST', [{
    policy_id: policyId,
    geo_id: 'harris-county',
    geo_type: 'county',
  }]);
}

// ── Main handler ──────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const body = await req.json().catch(() => ({}));
    const mode: string = body.mode || 'recent';
    const batchSize: number = body.batch_size || 50;

    const stats = { officials_upserted: 0, policies_upserted: 0, sponsors_linked: 0, geo_bindings: 0, errors: 0 };

    // ── 1. Sync officials (Commissioners Court + county elected) ────

    const persons = (await legistar('Persons?$filter=PersonActiveFlag eq 1&$orderby=PersonLastModifiedUtc desc') as any[]) || [];
    const personIdToOfficialId = new Map<number, string>();

    for (const person of persons) {
      const personId = person.PersonId;
      if (!personId) continue;

      const officialId = `OFF_${await sha256Short('legistar_harris|' + personId)}`;
      personIdToOfficialId.set(personId, officialId);

      const fullName = `${person.PersonFirstName || ''} ${person.PersonLastName || ''}`.trim();

      // Get office records to determine role
      const officeRecords = (await legistar(`Persons/${personId}/OfficeRecords?$orderby=OfficeRecordStartDate desc&$top=1`) as any[]) || [];
      const bodyName = officeRecords?.[0]?.OfficeRecordTitle || officeRecords?.[0]?.OfficeRecordBodyName || '';
      const { title, districtType, districtId } = parseCountyTitle(bodyName, person.PersonTitle);

      const record = {
        official_id: officialId,
        official_name: fullName,
        title,
        level: 'County',
        jurisdiction: 'Harris County',
        district_type: districtType,
        district_id: districtId,
        email: person.PersonEmail || null,
        phone: person.PersonPhone || null,
        website: person.PersonWWW || null,
        data_source: 'legistar_harris',
        last_updated: new Date().toISOString(),
      };

      const res = await db('elected_officials?on_conflict=official_id', 'POST', [record]);
      if (res) stats.officials_upserted++;
      else stats.errors++;

      await sleep(300);
    }

    // ── 2. Sync policies (Commissioners Court agenda items) ─────────

    const now = new Date();
    const lookbackDays = mode === 'recent' ? 7 : 180;
    const fromDate = new Date(now.getTime() - lookbackDays * 24 * 60 * 60 * 1000);
    const fromDateStr = fromDate.toISOString().split('.')[0] + 'Z';

    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const filter = mode === 'recent'
        ? `$filter=MatterLastModifiedUtc gt datetime'${fromDateStr}'`
        : '';
      const endpoint = `Matters?${filter}&$top=${batchSize}&$skip=${offset}&$orderby=MatterLastModifiedUtc desc`;
      const matters = (await legistar(endpoint) as any[]) || [];

      if (matters.length === 0) {
        hasMore = false;
        break;
      }

      for (const matter of matters) {
        const matterId = matter.MatterId;
        if (!matterId) continue;

        const policyId = `POL_HC_${matterId}`;
        const matterType = matter.MatterTypeName || '';
        const matterFile = matter.MatterFile || '';

        const record = {
          policy_id: policyId,
          policy_name: matter.MatterTitle || matter.MatterName || formatBillNumber(matterType, matterFile),
          bill_number: formatBillNumber(matterType, matterFile),
          level: 'County',
          status: mapMatterStatus(matter.MatterStatusName || ''),
          policy_type: matterType || null,
          introduced_date: matter.MatterIntroDate || null,
          last_action: matter.MatterStatusName || null,
          last_action_date: matter.MatterLastModifiedUtc?.split('T')[0] || null,
          source_url: `https://harriscounty.legistar.com/LegislationDetail.aspx?ID=${matterId}`,
          data_source: 'legistar_harris',
          is_published: false,
          last_updated: new Date().toISOString(),
        };

        const res = await db('policies?on_conflict=policy_id', 'POST', [record]);
        if (res) {
          stats.policies_upserted++;
          // Bind to Harris County geography so it shows on maps
          await bindPolicyGeography(policyId);
          stats.geo_bindings++;
        } else {
          stats.errors++;
        }

        // Fetch sponsors and link to officials
        const sponsors = (await legistar(`Matters/${matterId}/Sponsors`) as any[]) || [];
        for (const sponsor of sponsors) {
          const sponsorPersonId = sponsor.MatterSponsorNameId;
          const officialId = personIdToOfficialId.get(sponsorPersonId);
          if (officialId) {
            const jRes = await db('policy_officials?on_conflict=policy_id,official_id', 'POST', [{
              policy_id: policyId,
              official_id: officialId,
            }]);
            if (jRes) stats.sponsors_linked++;
          }
        }

        await sleep(500);
      }

      offset += batchSize;
      if (matters.length < batchSize) hasMore = false;
    }

    // ── 3. Log to ingestion_log ─────────────────────────────────────

    await db('ingestion_log', 'POST', {
      event_type: 'sync_county_harris',
      source: 'legistar_harris',
      status: stats.errors === 0 ? 'success' : 'partial',
      message: `Officials: ${stats.officials_upserted}, Policies: ${stats.policies_upserted}, Sponsors: ${stats.sponsors_linked}, Geo: ${stats.geo_bindings}, Errors: ${stats.errors}`,
      item_count: stats.officials_upserted + stats.policies_upserted,
    });

    // ── 4. Inline classification ────────────────────────────────────

    let classified = 0;
    if (triggerClassify && ANTHROPIC_KEY) {
      try {
        const taxonomy = await fetchFullTaxonomy(SUPABASE_URL, SUPABASE_KEY);

        // Classify unclassified county policies (up to 5)
        if (stats.policies_upserted > 0) {
          const policyPrompt = buildPromptForEntity(taxonomy, 'policy');
          const unclassifiedPolicies = await db(`policies?select=policy_id,policy_name,summary_5th_grade,policy_type,level,status,bill_number&classification_v2=is.null&data_source=eq.legistar_harris&limit=5`);
          if (unclassifiedPolicies && unclassifiedPolicies.length > 0) {
            for (const pol of unclassifiedPolicies) {
              try {
                const userContent = `Name: ${pol.policy_name}\nDescription: ${pol.summary_5th_grade || ''}\npolicy_type: ${pol.policy_type || ''}\nlevel: County (Harris County, Texas)\nstatus: ${pol.status || ''}\nbill_number: ${pol.bill_number || ''}\nIMPORTANT: Write title_6th_grade, summary_6th_grade, and impact_statement.\n\nReturn JSON with all classification fields.`;
                const rawText = await callClaude(policyPrompt, userContent, ANTHROPIC_KEY, 1200);
                const raw = parseClaudeJson(rawText);
                const enriched = validateAndEnrich(raw, taxonomy);
                await db(`policies?policy_id=eq.${pol.policy_id}`, 'PATCH', {
                  classification_v2: enriched, focus_area_ids: (enriched.focus_area_ids || []).join(','),
                  ...(enriched.title_6th_grade ? { title_6th_grade: enriched.title_6th_grade } : {}),
                  ...(enriched.summary_6th_grade ? { summary_6th_grade: enriched.summary_6th_grade } : {}),
                  ...(enriched.impact_statement ? { impact_statement: enriched.impact_statement } : {}),
                });
                await populateAllJunctions('policy', pol.policy_id, enriched, SUPABASE_URL, SUPABASE_KEY);
                classified++;
                await sleep(1000);
              } catch (err) { console.error(`Classify policy error ${pol.policy_id}:`, (err as Error).message); }
            }
          }
        }

        // Classify unclassified county officials (up to 3)
        if (stats.officials_upserted > 0) {
          const officialPrompt = buildPromptForEntity(taxonomy, 'elected_official');
          const unclassifiedOfficials = await db(`elected_officials?select=official_id,official_name,title,party,level,jurisdiction,description_5th_grade&classification_v2=is.null&data_source=eq.legistar_harris&limit=3`);
          if (unclassifiedOfficials && unclassifiedOfficials.length > 0) {
            for (const off of unclassifiedOfficials) {
              try {
                const userContent = `Name: ${off.official_name}\nTitle: ${off.title || ''}\nParty: ${off.party || ''}\nLevel: County\nJurisdiction: Harris County, Texas\nDescription: ${off.description_5th_grade || ''}\n\nReturn JSON with all classification fields.`;
                const rawText = await callClaude(officialPrompt, userContent, ANTHROPIC_KEY, 1000);
                const raw = parseClaudeJson(rawText);
                const enriched = validateAndEnrich(raw, taxonomy);
                await db(`elected_officials?official_id=eq.${off.official_id}`, 'PATCH', {
                  classification_v2: enriched, focus_area_ids: (enriched.focus_area_ids || []).join(','),
                });
                await populateAllJunctions('elected_official', off.official_id, enriched, SUPABASE_URL, SUPABASE_KEY);
                classified++;
                await sleep(1000);
              } catch (err) { console.error(`Classify official error ${off.official_id}:`, (err as Error).message); }
            }
          }
        }
      } catch (err) { console.error('Inline classification error:', (err as Error).message); }
    }

    return new Response(JSON.stringify({
      success: true,
      mode,
      ...stats,
      classified,
      message: `Harris County sync complete: ${stats.officials_upserted} officials, ${stats.policies_upserted} policies, ${stats.geo_bindings} geo bindings, ${classified} classified`,
    }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
