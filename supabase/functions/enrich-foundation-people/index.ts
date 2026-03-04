import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

/*
 * enrich-foundation-people
 *
 * Crawls each foundation's website to find current leadership/staff/board,
 * uses Claude to extract structured people data, and reconciles with existing
 * foundation_people records. Designed to run as a scheduled cron job.
 *
 * Endpoints:
 *   POST /  { foundation_id?: string }  — enrich one or all foundations
 *   GET  /                              — returns last sync status
 */

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;
const HD = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };

/* ── Supabase REST helpers ── */
async function sbGet(table: string, query = '') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, { headers: HD });
  if (!res.ok) return [];
  return res.json();
}

async function sbPost(table: string, data: unknown) {
  return fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...HD, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify(data),
  });
}

async function sbPatch(table: string, query: string, data: unknown) {
  return fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    method: 'PATCH',
    headers: { ...HD, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(data),
  });
}

/* ── Scrape a URL with timeout ── */
async function scrapeUrl(url: string, timeoutMs = 10000): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'TheChangeEngine/2.0 (foundation-people-sync)' },
      signal: controller.signal,
      redirect: 'follow',
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

/* ── Strip HTML to readable text ── */
function htmlToText(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/* ── Extract LinkedIn profile URLs from raw HTML ── */
function extractLinkedInUrls(html: string): string[] {
  const pattern = /https?:\/\/(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?/gi;
  const matches = html.match(pattern);
  if (!matches) return [];
  // Deduplicate and normalize (strip trailing slash)
  const unique = new Set(matches.map(u => u.replace(/\/$/, '')));
  return [...unique];
}

/* ── Find leadership/staff/board pages from main site ── */
function findPeopleLinks(html: string, baseUrl: string): string[] {
  const patterns = [
    /href=["']([^"']*(?:team|staff|leadership|board|about|people|our-team|directors|who-we-are)[^"']*)["']/gi,
  ];
  const links = new Set<string>();
  for (const pat of patterns) {
    let match;
    while ((match = pat.exec(html)) !== null) {
      try {
        const resolved = new URL(match[1], baseUrl).href;
        // Only follow same-domain links
        if (new URL(resolved).hostname === new URL(baseUrl).hostname) {
          links.add(resolved);
        }
      } catch { /* ignore malformed URLs */ }
    }
  }
  return [...links].slice(0, 6); // limit to 6 sub-pages
}

/* ── Ask Claude to extract people from page text ── */
async function extractPeopleWithClaude(
  foundationName: string,
  pageTexts: string[],
  linkedInUrls: string[],
): Promise<Array<{ name: string; role: string; role_type: string; linkedin_url?: string }>> {
  const combined = pageTexts.join('\n\n---PAGE BREAK---\n\n').substring(0, 6000);
  const linkedInContext = linkedInUrls.length > 0
    ? `\n\nLinkedIn URLs found on the website:\n${linkedInUrls.join('\n')}`
    : '';

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: `You extract current staff, leadership, and board members from foundation/nonprofit website text. Return ONLY a JSON array. Each element: {"name":"Full Name","role":"Their Title","role_type":"executive|board|grants","linkedin_url":"https://linkedin.com/in/..."}.

role_type mapping: CEO/President/ED/VP/Director/Manager/Coordinator/Officer → "executive"; Board Chair/Trustee/Board Member → "board"; Grants Manager/Program Officer related to grantmaking → "grants".

linkedin_url: If LinkedIn profile URLs were found on the page, match them to the correct person by name. Only include a linkedin_url if you are confident it belongs to that person. Omit the field if no match is found.

Only include people who appear to be CURRENT staff or board. Exclude historical mentions, honorees, or donors unless they are also board/staff. If you cannot find any people, return an empty array []. Return ONLY the JSON array, no markdown, no explanation.`,
      messages: [{
        role: 'user',
        content: `Foundation: ${foundationName}\n\nWebsite text:\n${combined}${linkedInContext}\n\nExtract all current staff, leadership, and board members as JSON array:`,
      }],
    }),
  });

  if (!res.ok) {
    console.error('Claude API error:', res.status, await res.text());
    return [];
  }

  const data = await res.json();
  const rawText = data.content?.[0]?.text || '';

  try {
    // Parse JSON array from response
    let text = rawText.trim();
    if (text.startsWith('```json')) text = text.slice(7);
    else if (text.startsWith('```')) text = text.slice(3);
    if (text.endsWith('```')) text = text.slice(0, -3);
    text = text.trim();
    const start = text.indexOf('[');
    const end = text.lastIndexOf(']');
    if (start === -1 || end === -1) return [];
    const arr = JSON.parse(text.substring(start, end + 1));
    if (!Array.isArray(arr)) return [];
    // Validate each entry
    return arr.filter((p: any) =>
      p.name && typeof p.name === 'string' && p.name.length > 1 &&
      p.role && typeof p.role === 'string' &&
      ['executive', 'board', 'grants'].includes(p.role_type)
    ).map((p: any) => ({
      name: p.name,
      role: p.role,
      role_type: p.role_type,
      ...(p.linkedin_url && typeof p.linkedin_url === 'string' && p.linkedin_url.includes('linkedin.com/in/')
        ? { linkedin_url: p.linkedin_url }
        : {}),
    }));
  } catch {
    console.error('Failed to parse Claude people response:', rawText.substring(0, 300));
    return [];
  }
}

/* ── Reconcile extracted people with existing records ── */
async function reconcilePeople(
  foundationId: string,
  extracted: Array<{ name: string; role: string; role_type: string; linkedin_url?: string }>,
) {
  const now = new Date().toISOString();

  // Get existing people for this foundation
  const existing: any[] = await sbGet(
    'foundation_people',
    `foundation_id=eq.${encodeURIComponent(foundationId)}&select=id,name,role,role_type,is_current,linkedin_url,linkedin_status`
  );

  // Normalize name for matching
  const norm = (n: string) => n.toLowerCase().replace(/[^a-z\s]/g, '').replace(/\s+/g, ' ').trim();

  const matchedExistingIds = new Set<string>();
  const updates: Array<{ id: string; role: string; role_type: string; linkedin_url?: string; linkedin_status?: string }> = [];
  const inserts: Array<{ foundation_id: string; name: string; role: string; role_type: string; is_current: boolean; last_verified_at: string; linkedin_url?: string; linkedin_status?: string }> = [];

  for (const person of extracted) {
    const normName = norm(person.name);
    const match = existing.find(e => norm(e.name) === normName);

    if (match) {
      matchedExistingIds.add(match.id);
      const needsUpdate = match.role !== person.role || match.role_type !== person.role_type || !match.is_current;
      // Only update LinkedIn if current status is 'none' or 'candidate' (don't overwrite verified/rejected)
      const canUpdateLinkedIn = person.linkedin_url && (!match.linkedin_status || match.linkedin_status === 'none' || match.linkedin_status === 'candidate');
      if (needsUpdate || canUpdateLinkedIn) {
        updates.push({
          id: match.id,
          role: person.role,
          role_type: person.role_type,
          ...(canUpdateLinkedIn ? { linkedin_url: person.linkedin_url, linkedin_status: 'candidate' } : {}),
        });
      }
    } else {
      inserts.push({
        foundation_id: foundationId,
        name: person.name,
        role: person.role,
        role_type: person.role_type,
        is_current: true,
        last_verified_at: now,
        ...(person.linkedin_url ? { linkedin_url: person.linkedin_url, linkedin_status: 'candidate' } : {}),
      });
    }
  }

  // Mark unmatched existing people as potentially stale (is_current = false)
  const staleIds = existing
    .filter(e => !matchedExistingIds.has(e.id) && e.is_current !== false)
    .map(e => e.id);

  let updated = 0;
  let inserted = 0;
  let staled = 0;

  // Apply updates
  for (const u of updates) {
    await sbPatch('foundation_people', `id=eq.${u.id}`, {
      role: u.role,
      role_type: u.role_type,
      is_current: true,
      last_verified_at: now,
      ...(u.linkedin_url ? { linkedin_url: u.linkedin_url, linkedin_status: u.linkedin_status } : {}),
    });
    updated++;
  }

  // Mark verified people that didn't change
  for (const id of matchedExistingIds) {
    if (!updates.find(u => u.id === id)) {
      await sbPatch('foundation_people', `id=eq.${id}`, {
        is_current: true,
        last_verified_at: now,
      });
    }
  }

  // Insert new people
  if (inserts.length > 0) {
    await sbPost('foundation_people', inserts);
    inserted = inserts.length;
  }

  // Mark stale
  for (const id of staleIds) {
    await sbPatch('foundation_people', `id=eq.${id}`, {
      is_current: false,
      last_verified_at: now,
    });
    staled++;
  }

  return { updated, inserted, staled, total: extracted.length };
}

/* ── Process a single foundation ── */
async function enrichFoundation(foundation: any): Promise<{
  id: string; name: string; status: string; message: string;
  people_found: number; inserted: number; updated: number; staled: number;
}> {
  const result = { id: foundation.id, name: foundation.name, status: 'skipped', message: '', people_found: 0, inserted: 0, updated: 0, staled: 0 };

  if (!foundation.website_url) {
    result.message = 'No website_url';
    return result;
  }

  try {
    // Step 1: Fetch main page
    const mainHtml = await scrapeUrl(foundation.website_url);
    const mainText = htmlToText(mainHtml);
    const allLinkedInUrls: string[] = [...extractLinkedInUrls(mainHtml)];

    // Step 2: Find leadership/staff/board sub-pages
    const peopleLinks = findPeopleLinks(mainHtml, foundation.website_url);
    const pageTexts = [mainText.substring(0, 2000)];

    // Step 3: Fetch sub-pages
    for (const link of peopleLinks) {
      try {
        const subHtml = await scrapeUrl(link, 8000);
        const subText = htmlToText(subHtml);
        if (subText.length > 100) {
          pageTexts.push(subText.substring(0, 3000));
        }
        // Extract LinkedIn URLs from sub-pages too
        allLinkedInUrls.push(...extractLinkedInUrls(subHtml));
      } catch (err) {
        console.warn(`Sub-page fetch failed: ${link}`, (err as Error).message);
      }
    }

    // Deduplicate LinkedIn URLs
    const uniqueLinkedInUrls = [...new Set(allLinkedInUrls)];

    // Step 4: Extract people with Claude
    const extracted = await extractPeopleWithClaude(foundation.name, pageTexts, uniqueLinkedInUrls);
    result.people_found = extracted.length;

    if (extracted.length === 0) {
      result.status = 'no_people_found';
      result.message = `Scraped ${pageTexts.length} pages, no people extracted`;
      return result;
    }

    // Step 5: Reconcile with existing data
    const reconciled = await reconcilePeople(foundation.id, extracted);
    result.inserted = reconciled.inserted;
    result.updated = reconciled.updated;
    result.staled = reconciled.staled;

    // Step 6: Update foundation sync timestamp
    await sbPatch('foundations', `id=eq.${encodeURIComponent(foundation.id)}`, {
      last_people_sync: new Date().toISOString(),
    });

    result.status = 'success';
    result.message = `Found ${extracted.length} people from ${pageTexts.length} pages: +${reconciled.inserted} new, ${reconciled.updated} updated, ${reconciled.staled} stale`;

  } catch (err) {
    result.status = 'error';
    result.message = (err as Error).message;
  }

  return result;
}

/* ── Main handler ── */
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  // GET — return last sync status
  if (req.method === 'GET') {
    const foundations = await sbGet(
      'foundations',
      'select=id,name,website_url,last_people_sync&order=name&limit=100'
    );
    const peopleCounts = await sbGet(
      'foundation_people',
      'select=foundation_id,is_current&limit=1000'
    );

    const countMap: Record<string, { current: number; stale: number }> = {};
    for (const p of peopleCounts) {
      if (!countMap[p.foundation_id]) countMap[p.foundation_id] = { current: 0, stale: 0 };
      if (p.is_current === false) countMap[p.foundation_id].stale++;
      else countMap[p.foundation_id].current++;
    }

    const status = foundations.map((f: any) => ({
      id: f.id,
      name: f.name,
      website: f.website_url,
      last_sync: f.last_people_sync,
      current_people: countMap[f.id]?.current || 0,
      stale_people: countMap[f.id]?.stale || 0,
    }));

    return new Response(JSON.stringify({ foundations: status, total: foundations.length }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  // POST — enrich one or all foundations
  try {
    let targetId: string | null = null;
    try {
      const body = await req.json();
      targetId = body.foundation_id || null;
    } catch { /* no body = enrich all */ }

    // Fetch foundations to enrich
    const query = targetId
      ? `id=eq.${encodeURIComponent(targetId)}&select=id,name,website_url`
      : 'select=id,name,website_url&order=last_people_sync.asc.nullsfirst&limit=100';
    const foundations = await sbGet('foundations', query);

    if (foundations.length === 0) {
      return new Response(JSON.stringify({ error: 'No foundations found' }), {
        status: 404, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const results = [];
    for (const foundation of foundations) {
      console.log(`Enriching: ${foundation.name}`);
      const result = await enrichFoundation(foundation);
      results.push(result);
      console.log(`  → ${result.status}: ${result.message}`);
    }

    // Log to ingestion_log
    const successCount = results.filter(r => r.status === 'success').length;
    const totalPeople = results.reduce((s, r) => s + r.people_found, 0);
    const totalInserted = results.reduce((s, r) => s + r.inserted, 0);

    await sbPost('ingestion_log', {
      event_type: 'foundation_people_sync',
      source: 'enrich-foundation-people',
      status: results.some(r => r.status === 'error') ? 'partial' : 'success',
      message: `Synced ${successCount}/${results.length} foundations: ${totalPeople} people found, ${totalInserted} new`,
      item_count: results.length,
    });

    return new Response(JSON.stringify({
      success: true,
      synced_at: new Date().toISOString(),
      foundations_processed: results.length,
      summary: {
        success: successCount,
        no_people: results.filter(r => r.status === 'no_people_found').length,
        skipped: results.filter(r => r.status === 'skipped').length,
        errors: results.filter(r => r.status === 'error').length,
        total_people_found: totalPeople,
        total_inserted: totalInserted,
      },
      results,
    }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
