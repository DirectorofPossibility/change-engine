import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  fetchFullTaxonomy,
  buildPromptForEntity,
  callClaude,
  parseClaudeJson,
  validateAndEnrich,
  populateAllJunctions,
} from '../_shared/classifier.ts';

/**
 * sync-state-texas — Ingests Texas Legislature bills and state legislators.
 *
 * Dual data source:
 *   1. Primary: TLO RSS feeds for daily updates (filed + passed bills)
 *   2. Backup: Open States API v3 for bulk/backfill with structured data
 *
 * Request body:
 *   { mode: 'recent'|'full', trigger_classify: boolean, source?: 'rss'|'openstates' }
 */

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;
const OPEN_STATES_API_KEY = Deno.env.get('OPEN_STATES_API_KEY') || '';
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const TLO_FEEDS = [
  { url: 'https://capitol.texas.gov/MyTLO/RSS/RSS.aspx?Type=todaysfiledhouse', chamber: 'house' },
  { url: 'https://capitol.texas.gov/MyTLO/RSS/RSS.aspx?Type=todaysfiledsenate', chamber: 'senate' },
  { url: 'https://capitol.texas.gov/MyTLO/RSS/RSS.aspx?Type=todayspassed', chamber: 'passed' },
];

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

// ── SHA-256 helper ────────────────────────────────────────────────────

async function sha256Short(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const hex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  return hex.substring(0, 12);
}

// ── XML parsing ───────────────────────────────────────────────────────

function parseRssItems(xml: string): { title: string; link: string; description: string }[] {
  const items: { title: string; link: string; description: string }[] = [];
  const rssItems = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || [];
  for (const item of rssItems) {
    const title = item.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)?.[1]?.trim() || '';
    const link = item.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1]?.trim() || '';
    const desc = item.match(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i)?.[1]?.trim() || '';
    if (title || link) items.push({ title, link, description: desc.substring(0, 500) });
  }
  return items;
}

// ── Extract bill info from title ──────────────────────────────────────

function parseBillFromTitle(title: string): { billType: string; billNumber: string; session: string } | null {
  // Matches patterns like "HB 1234", "SB 567", "HJR 12"
  const match = title.match(/\b(HB|SB|HJR|SJR|HCR|SCR|HR|SR)\s+(\d+)/i);
  if (!match) return null;

  // Default to current session (89R)
  const session = '89R';
  return {
    billType: match[1].toUpperCase(),
    billNumber: match[2],
    session,
  };
}

// ── Status mapping ────────────────────────────────────────────────────

function mapTxStatus(description: string, feedType: string): string {
  const d = (description || '').toLowerCase();
  if (feedType === 'passed' || d.includes('passed') || d.includes('adopted') || d.includes('signed by governor')) return 'Passed';
  if (d.includes('vetoed')) return 'Failed';
  if (d.includes('enrolled') || d.includes('sent to governor')) return 'Pending';
  if (d.includes('filed') || d.includes('introduced') || d.includes('referred to')) return 'Introduced';
  if (d.includes('committee') || d.includes('hearing')) return 'Pending';
  return 'Introduced';
}

// ── Build source URL ──────────────────────────────────────────────────

function buildSourceUrl(session: string, billType: string, billNumber: string): string {
  return `https://capitol.texas.gov/BillLookup/History.aspx?LegSess=${session}&Bill=${billType}${billNumber}`;
}

// ── TLO RSS feed sync ─────────────────────────────────────────────────

async function syncFromRss(): Promise<{ policies_upserted: number; errors: number }> {
  let totalUpserted = 0;
  let totalErrors = 0;

  for (const feed of TLO_FEEDS) {
    try {
      const res = await fetch(feed.url, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) {
        console.error(`TLO RSS ${feed.chamber}: ${res.status}`);
        totalErrors++;
        continue;
      }

      const xml = await res.text();
      const items = parseRssItems(xml);

      for (const item of items) {
        const billInfo = parseBillFromTitle(item.title);
        if (!billInfo) continue;

        const policyId = `POL_TX_${billInfo.session}_${billInfo.billType}_${billInfo.billNumber}`;
        const billNumber = `${billInfo.billType} ${billInfo.billNumber}`;

        const record = {
          policy_id: policyId,
          policy_name: item.title,
          bill_number: billNumber,
          level: 'State',
          status: mapTxStatus(item.description, feed.chamber),
          last_action: item.description.substring(0, 500) || null,
          last_action_date: new Date().toISOString().split('T')[0],
          source_url: item.link || buildSourceUrl(billInfo.session, billInfo.billType, billInfo.billNumber),
          data_source: 'texas_legislature',
          is_published: false,
          last_updated: new Date().toISOString(),
        };

        const result = await db('policies?on_conflict=policy_id', 'POST', [record]);
        if (result) {
          totalUpserted++;
          // Bind to Texas geography so state bills show on maps
          await db('policy_geography?on_conflict=policy_id,geo_type,geo_id', 'POST', [{
            policy_id: policyId, geo_id: 'texas', geo_type: 'state',
          }]);
        } else totalErrors++;
      }

      await sleep(1000);
    } catch (err) {
      console.error(`TLO RSS ${feed.chamber} error:`, (err as Error).message);
      totalErrors++;
    }
  }

  return { policies_upserted: totalUpserted, errors: totalErrors };
}

// ── Open States API sync ──────────────────────────────────────────────

async function syncFromOpenStates(mode: string): Promise<{ officials_upserted: number; policies_upserted: number; errors: number }> {
  if (!OPEN_STATES_API_KEY) {
    console.warn('OPEN_STATES_API_KEY not set — skipping Open States sync');
    return { officials_upserted: 0, policies_upserted: 0, errors: 0 };
  }

  let officialsUpserted = 0;
  let policiesUpserted = 0;
  let errors = 0;

  // ── Sync state legislators ──────────────────────────────────────

  try {
    const peopleRes = await fetch('https://v3.openstates.org/people?jurisdiction=tx&current_role=true&per_page=200', {
      headers: { 'X-API-KEY': OPEN_STATES_API_KEY },
      signal: AbortSignal.timeout(20000),
    });

    if (peopleRes.ok) {
      const peopleData = await peopleRes.json();
      const people = peopleData.results || [];

      for (const person of people) {
        const officialId = `OFF_${await sha256Short('open_states|' + person.id)}`;
        const role = person.current_role || {};
        const chamber = role.org_classification || '';
        const districtType = chamber === 'upper' ? 'state_senate'
          : chamber === 'lower' ? 'state_house'
          : 'statewide';
        const districtId = role.district || 'statewide';

        // Determine title based on role
        let title = 'State Representative';
        if (chamber === 'upper') title = 'State Senator';
        else if (role.title) title = role.title;

        const record = {
          official_id: officialId,
          official_name: person.name,
          title,
          level: 'State',
          party: person.party || null,
          district_type: districtType,
          district_id: districtId,
          email: person.email || null,
          website: person.links?.[0]?.url || null,
          data_source: 'open_states',
          last_updated: new Date().toISOString(),
        };

        const result = await db('elected_officials?on_conflict=official_id', 'POST', [record]);
        if (result) officialsUpserted++;
        else errors++;
      }
    }
  } catch (err) {
    console.error('Open States people error:', (err as Error).message);
    errors++;
  }

  // ── Sync statewide executives (Governor, AG, Comptroller, etc.) ──

  const TX_STATEWIDE_OFFICIALS = [
    { name: 'Greg Abbott', title: 'Governor', district_id: 'governor', website: 'https://gov.texas.gov' },
    { name: 'Dan Patrick', title: 'Lieutenant Governor', district_id: 'lt-governor', website: 'https://www.ltgov.texas.gov' },
    { name: 'Ken Paxton', title: 'Attorney General', district_id: 'attorney-general', website: 'https://www.texasattorneygeneral.gov' },
    { name: 'Glenn Hegar', title: 'Comptroller', district_id: 'comptroller', website: 'https://comptroller.texas.gov' },
    { name: 'Dawn Buckingham', title: 'Commissioner of the General Land Office', district_id: 'land-commissioner', website: 'https://www.glo.texas.gov' },
    { name: 'Sid Miller', title: 'Commissioner of Agriculture', district_id: 'agriculture-commissioner', website: 'https://www.texasagriculture.gov' },
  ];

  for (const exec of TX_STATEWIDE_OFFICIALS) {
    try {
      const officialId = `OFF_${await sha256Short('tx_executive|' + exec.district_id)}`;
      const record = {
        official_id: officialId,
        official_name: exec.name,
        title: exec.title,
        level: 'State',
        party: 'Republican',
        district_type: 'statewide',
        district_id: exec.district_id,
        jurisdiction: 'Texas',
        website: exec.website,
        data_source: 'texas_executive',
        last_updated: new Date().toISOString(),
      };
      const result = await db('elected_officials?on_conflict=official_id', 'POST', [record]);
      if (result) officialsUpserted++;
      else errors++;
    } catch (err) {
      console.error(`TX executive ${exec.title} error:`, (err as Error).message);
      errors++;
    }
  }

  await sleep(1000);

  // ── Sync bills from Open States ─────────────────────────────────

  try {
    const lookbackDays = mode === 'recent' ? 7 : 90;
    const since = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    let page = 1;
    let hasMore = true;

    while (hasMore && page <= 5) {
      const billsRes = await fetch(
        `https://v3.openstates.org/bills?jurisdiction=tx&session=89&updated_since=${since}&per_page=50&page=${page}`,
        { headers: { 'X-API-KEY': OPEN_STATES_API_KEY }, signal: AbortSignal.timeout(20000) },
      );

      if (!billsRes.ok) {
        console.error(`Open States bills page ${page}: ${billsRes.status}`);
        errors++;
        break;
      }

      const billsData = await billsRes.json();
      const bills = billsData.results || [];

      for (const bill of bills) {
        const identifier = bill.identifier || '';
        const match = identifier.match(/^(HB|SB|HJR|SJR|HCR|SCR|HR|SR)\s*(\d+)$/i);
        if (!match) continue;

        const billType = match[1].toUpperCase();
        const billNumber = match[2];
        const session = '89R';
        const policyId = `POL_TX_${session}_${billType}_${billNumber}`;

        const latestAction = bill.latest_action || {};
        const record = {
          policy_id: policyId,
          policy_name: bill.title || identifier,
          bill_number: `${billType} ${billNumber}`,
          level: 'State',
          status: mapTxStatus(latestAction.description || '', ''),
          policy_type: bill.classification?.[0] || null,
          introduced_date: bill.first_action_date || null,
          last_action: latestAction.description || null,
          last_action_date: latestAction.date || null,
          source_url: buildSourceUrl(session, billType, billNumber),
          data_source: 'open_states',
          is_published: false,
          last_updated: new Date().toISOString(),
        };

        const result = await db('policies?on_conflict=policy_id', 'POST', [record]);
        if (result) {
          policiesUpserted++;
          await db('policy_geography?on_conflict=policy_id,geo_type,geo_id', 'POST', [{
            policy_id: policyId, geo_id: 'texas', geo_type: 'state',
          }]);
        } else errors++;

        // Match sponsors to officials
        const sponsors = bill.sponsorships || [];
        for (const sponsor of sponsors) {
          if (sponsor.person?.id) {
            const offId = `OFF_${await sha256Short('open_states|' + sponsor.person.id)}`;
            await db('policy_officials?on_conflict=policy_id,official_id', 'POST', [{
              policy_id: policyId,
              official_id: offId,
            }]);
          }
        }
      }

      if (bills.length < 50) hasMore = false;
      else page++;

      await sleep(1000);
    }
  } catch (err) {
    console.error('Open States bills error:', (err as Error).message);
    errors++;
  }

  return { officials_upserted: officialsUpserted, policies_upserted: policiesUpserted, errors };
}

// ── Main handler ──────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const body = await req.json().catch(() => ({}));
    const mode: string = body.mode || 'recent';
    const triggerClassify: boolean = body.trigger_classify === true;
    const source: string = body.source || 'both';

    const stats = { officials_upserted: 0, policies_upserted: 0, errors: 0 };

    // RSS sync (primary for daily updates)
    if (source === 'rss' || source === 'both') {
      const rssResult = await syncFromRss();
      stats.policies_upserted += rssResult.policies_upserted;
      stats.errors += rssResult.errors;
    }

    // Open States sync (structured data + officials)
    if (source === 'openstates' || source === 'both') {
      const osResult = await syncFromOpenStates(mode);
      stats.officials_upserted += osResult.officials_upserted;
      stats.policies_upserted += osResult.policies_upserted;
      stats.errors += osResult.errors;
    }

    // Log to ingestion_log
    await db('ingestion_log', 'POST', {
      event_type: 'sync_state_texas',
      source: source === 'both' ? 'texas_legislature+open_states' : source,
      status: stats.errors === 0 ? 'success' : 'partial',
      message: `TX sync: ${stats.officials_upserted} officials, ${stats.policies_upserted} policies, ${stats.errors} errors (${mode} mode)`,
      item_count: stats.officials_upserted + stats.policies_upserted,
    });

    // Inline classification for new policies
    let classified = 0;
    if (triggerClassify && ANTHROPIC_KEY && stats.policies_upserted > 0) {
      try {
        const taxonomy = await fetchFullTaxonomy(SUPABASE_URL, SUPABASE_KEY);
        const policyPrompt = buildPromptForEntity(taxonomy, 'policy');
        const unclassified = await db(`policies?select=policy_id,policy_name,summary_5th_grade,policy_type,level,status,bill_number&classification_v2=is.null&limit=5`);
        if (unclassified && unclassified.length > 0) {
          for (const pol of unclassified) {
            try {
              const userContent = `Name: ${pol.policy_name}\nDescription: ${pol.summary_5th_grade || ''}\npolicy_type: ${pol.policy_type || ''}\nlevel: ${pol.level || ''}\nstatus: ${pol.status || ''}\nbill_number: ${pol.bill_number || ''}\nIMPORTANT: Write title_6th_grade, summary_6th_grade, and impact_statement.\n\nReturn JSON with all classification fields.`;
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
      } catch (err) { console.error('Inline classification error:', (err as Error).message); }
    }

    return new Response(JSON.stringify({
      success: true,
      mode,
      source,
      ...stats,
      classified,
      message: `Texas sync complete: ${stats.officials_upserted} officials, ${stats.policies_upserted} policies, ${classified} classified`,
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
