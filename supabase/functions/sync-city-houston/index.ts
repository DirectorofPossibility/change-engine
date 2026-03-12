import "jsr:@supabase/functions-js/edge-runtime.d.ts";

/**
 * sync-city-houston — Ingests Houston City Council members and ordinances/resolutions
 * from the Legistar Web API.
 *
 * API docs: https://webapi.legistar.com/Help
 * Base URL: https://webapi.legistar.com/v1/houston
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

const LEGISTAR_BASE = 'https://webapi.legistar.com/v1/cityofhouston';

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

// ── Format bill number from matter type + file number ─────────────────

function formatBillNumber(matterType: string | null, matterFile: string | null): string {
  if (!matterType && !matterFile) return '';
  const typePrefix = (matterType || '').replace(/\s+/g, ' ').trim();
  const file = (matterFile || '').trim();
  if (typePrefix && file) return `${typePrefix} ${file}`;
  return file || typePrefix;
}

// ── Main handler ──────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const body = await req.json().catch(() => ({}));
    const mode: string = body.mode || 'recent';
    const batchSize: number = body.batch_size || 50;

    const stats = { officials_upserted: 0, policies_upserted: 0, sponsors_linked: 0, errors: 0 };

    // ── 1. Sync officials (council members) ─────────────────────────

    const persons = (await legistar('Persons?$filter=PersonActiveFlag eq 1&$orderby=PersonLastModifiedUtc desc') as any[]) || [];
    const personIdToOfficialId = new Map<number, string>();

    for (const person of persons) {
      const personId = person.PersonId;
      if (!personId) continue;

      const officialId = `OFF_${await sha256Short('legistar_houston|' + personId)}`;
      personIdToOfficialId.set(personId, officialId);

      // Determine district type and ID from office records or person name
      let districtType = 'council';
      let districtId = 'at-large';

      const fullName = `${person.PersonFirstName || ''} ${person.PersonLastName || ''}`.trim();

      // Houston council: Mayor (At-Large), 5 At-Large, 11 Districts (A-K)
      // We'll refine district from OfficeRecords if available
      const officeRecords = (await legistar(`Persons/${personId}/OfficeRecords?$orderby=OfficeRecordStartDate desc&$top=1`) as any[]) || [];
      if (officeRecords.length > 0) {
        const body = officeRecords[0].OfficeRecordTitle || officeRecords[0].OfficeRecordBodyName || '';
        const districtMatch = body.match(/District\s+([A-K])/i);
        if (districtMatch) {
          districtId = districtMatch[1].toUpperCase();
        } else if (/mayor/i.test(body)) {
          districtId = 'mayor';
        } else if (/at.large/i.test(body)) {
          districtId = 'at-large';
        }
      }

      // Photo URL from Legistar (prefer medium, fallback to small)
      const photoUrl = person.PersonImageMedium || person.PersonImageSmall || null;

      const record: Record<string, unknown> = {
        official_id: officialId,
        official_name: fullName,
        title: 'Council Member',
        level: 'City',
        district_type: districtType === 'council' ? 'Council District' : districtType,
        district_id: districtId,
        email: person.PersonEmail || null,
        phone: person.PersonPhone || null,
        website: person.PersonWWW || null,
        photo_url: photoUrl,
        data_source: 'legistar_houston',
        last_updated: new Date().toISOString(),
      };

      // Mayor title override
      if (districtId === 'mayor') record.title = 'Mayor';

      const res = await db('elected_officials?on_conflict=official_id', 'POST', [record]);
      if (res) stats.officials_upserted++;
      else stats.errors++;

      // Upsert official_profiles with photo + contact info
      await db('official_profiles?on_conflict=official_id', 'POST', [{
        official_id: officialId,
        photo_url: photoUrl,
        phone_office: person.PersonPhone || null,
        email: person.PersonEmail || null,
        data_source: 'houstontx.gov',
        last_updated: new Date().toISOString(),
      }]);

      await sleep(300); // Rate limit Legistar API
    }

    // ── 1b. Sync vote records from Legistar VoteTypes + EventItems ──
    // Pull recent roll call votes
    const voteStats = { synced: 0 };
    try {
      const recentDays = mode === 'recent' ? 14 : 90;
      const voteFrom = new Date(Date.now() - recentDays * 24 * 60 * 60 * 1000);
      const voteFromStr = voteFrom.toISOString().split('.')[0] + 'Z';

      // Get recent events (council meetings)
      const events = (await legistar(`Events?$filter=EventDate gt datetime'${voteFromStr}'&$orderby=EventDate desc&$top=10`) as any[]) || [];

      for (const event of events) {
        const eventId = event.EventId;
        if (!eventId) continue;

        // Get event items (agenda items with votes)
        const eventItems = (await legistar(`Events/${eventId}/EventItems?$filter=EventItemRollCallFlag eq 1`) as any[]) || [];

        for (const item of eventItems) {
          const eventItemId = item.EventItemId;
          if (!eventItemId) continue;

          const matterId = item.EventItemMatterId;
          const policyId = matterId ? `POL_HOU_${matterId}` : null;
          const billNumber = item.EventItemMatterFile || item.EventItemTitle || null;

          // Get votes for this item
          const votes = (await legistar(`Events/${eventId}/EventItems/${eventItemId}/Votes`) as any[]) || [];

          for (const vote of votes) {
            const votePersonId = vote.VotePersonId;
            const officialId = personIdToOfficialId.get(votePersonId);
            if (!officialId) continue;

            const voteValue = (vote.VoteValueId === 11 || /yea|aye|yes/i.test(vote.VoteResult || ''))
              ? 'Yea'
              : (vote.VoteValueId === 12 || /nay|no/i.test(vote.VoteResult || ''))
                ? 'Nay'
                : vote.VoteResult || 'Present';

            await db('vote_records?on_conflict=official_id,bill_number,vote_date', 'POST', [{
              official_id: officialId,
              bill_number: billNumber,
              vote: voteValue,
              vote_date: event.EventDate?.split('T')[0] || null,
              policy_id: policyId,
              chamber: 'Houston City Council',
            }]);
            voteStats.synced++;
          }

          await sleep(300);
        }
      }
    } catch (err) {
      console.error('Vote sync error:', (err as Error).message);
    }

    // ── 2. Sync policies (Matters) ──────────────────────────────────

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

        const policyId = `POL_HOU_${matterId}`;
        const matterType = matter.MatterTypeName || '';
        const matterFile = matter.MatterFile || '';

        const record = {
          policy_id: policyId,
          policy_name: matter.MatterTitle || matter.MatterName || formatBillNumber(matterType, matterFile),
          bill_number: formatBillNumber(matterType, matterFile),
          level: 'City',
          status: mapMatterStatus(matter.MatterStatusName || ''),
          policy_type: matterType || null,
          introduced_date: matter.MatterIntroDate || null,
          last_action: matter.MatterStatusName || null,
          last_action_date: matter.MatterLastModifiedUtc?.split('T')[0] || null,
          source_url: `https://houston.legistar.com/LegislationDetail.aspx?ID=${matterId}`,
          data_source: 'legistar_houston',
          is_published: false,
          last_updated: new Date().toISOString(),
        };

        const res = await db('policies?on_conflict=policy_id', 'POST', [record]);
        if (res) {
          stats.policies_upserted++;
          // Bind to Houston geography so city policies show on maps
          await db('policy_geography?on_conflict=policy_id,geo_type,geo_id', 'POST', [{
            policy_id: policyId, geo_id: 'houston', geo_type: 'city',
          }]);
        } else stats.errors++;

        // ── 3. Fetch sponsors and link to officials ─────────────────

        const sponsors = (await legistar(`Matters/${matterId}/Sponsors`) as any[]) || [];
        for (const sponsor of sponsors) {
          const sponsorPersonId = sponsor.MatterSponsorNameId;
          const officialId = personIdToOfficialId.get(sponsorPersonId);
          if (officialId) {
            const junction = {
              policy_id: policyId,
              official_id: officialId,
            };
            const jRes = await db('policy_officials?on_conflict=policy_id,official_id', 'POST', [junction]);
            if (jRes) stats.sponsors_linked++;
          }
        }

        await sleep(500); // Rate limit
      }

      offset += batchSize;
      if (matters.length < batchSize) hasMore = false;
    }

    // ── 4. Log to ingestion_log ─────────────────────────────────────

    await db('ingestion_log', 'POST', {
      event_type: 'sync_city_houston',
      source: 'legistar_houston',
      status: stats.errors === 0 ? 'success' : 'partial',
      message: `Officials: ${stats.officials_upserted}, Policies: ${stats.policies_upserted}, Sponsors: ${stats.sponsors_linked}, Errors: ${stats.errors}`,
      item_count: stats.officials_upserted + stats.policies_upserted,
    });

    return new Response(JSON.stringify({
      success: true,
      mode,
      ...stats,
      votes_synced: voteStats.synced,
      message: `Houston sync complete: ${stats.officials_upserted} officials, ${stats.policies_upserted} policies, ${voteStats.synced} votes`,
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
