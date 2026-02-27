import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const CLASSIFY_URL = `${SUPABASE_URL}/functions/v1/classify-content-v2`;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// DB helper
async function dbQuery(query: string, method = 'GET', body?: any) {
  const url = `${SUPABASE_URL}/rest/v1/${query}`;
  const opts: RequestInit = {
    method,
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', Prefer: method === 'GET' ? '' : 'return=representation' },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  if (!res.ok) return null;
  return res.json();
}

// Lookup org_id from domain
async function lookupOrg(domain: string): Promise<string | null> {
  const rows = await dbQuery(`org_domains?domain=eq.${encodeURIComponent(domain)}&select=org_id`);
  return rows?.[0]?.org_id || null;
}

// Check if URL already classified
async function isAlreadyClassified(url: string): Promise<boolean> {
  const rows = await dbQuery(`content_inbox?source_url=eq.${encodeURIComponent(url)}&select=id,status`);
  return rows && rows.length > 0;
}

// Discover pages from a domain homepage
async function discoverPages(baseUrl: string): Promise<{url: string, title: string, desc: string}[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(baseUrl, {
      headers: { 'User-Agent': 'TheChangeEngine/2.0' },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const html = await res.text();
    const parsed = new URL(baseUrl);
    const baseDomain = parsed.hostname;

    // Extract all internal links
    const linkRegex = /href=["'](https?:\/\/[^"']*?|\/?[^"']*?)["']/gi;
    const seen = new Set<string>();
    const pages: {url: string, title: string, desc: string}[] = [];
    let match;

    while ((match = linkRegex.exec(html)) !== null) {
      let href = match[1];
      // Make absolute
      if (href.startsWith('/')) href = `${parsed.protocol}//${baseDomain}${href}`;
      if (!href.startsWith('http')) continue;

      try {
        const hrefParsed = new URL(href);
        // Only same domain
        if (hrefParsed.hostname !== baseDomain) continue;
        // Clean
        const clean = `${hrefParsed.protocol}//${hrefParsed.hostname}${hrefParsed.pathname}`;
        if (seen.has(clean)) continue;
        seen.add(clean);

        // Filter for useful pages
        const path = hrefParsed.pathname.toLowerCase();
        const isUseful =
          path.includes('program') || path.includes('service') ||
          path.includes('volunt') || path.includes('donat') ||
          path.includes('help') || path.includes('find') ||
          path.includes('ways-to') || path.includes('event') ||
          path.includes('news') || path.includes('blog') ||
          path.includes('about') || path.includes('resource') ||
          path.includes('sign-up') || path.includes('subscribe') ||
          path.includes('partner') || path.includes('campaign');

        // Skip junk
        const isJunk =
          path.includes('/wp-') || path.includes('/feed') ||
          path.includes('.js') || path.includes('.css') ||
          path.includes('/cart') || path.includes('/login') ||
          path.includes('/search') || path === '/' ||
          path.includes('#');

        if (isUseful && !isJunk) {
          pages.push({ url: clean, title: '', desc: '' });
        }
      } catch { /* invalid URL */ }
    }

    return pages;
  } catch (err) {
    console.error('Discovery error:', err);
    return [];
  }
}

// Scrape title + description from a page (lightweight, no body)
async function scrapeMeta(url: string): Promise<{title: string, desc: string}> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      headers: { 'User-Agent': 'TheChangeEngine/2.0' },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    // Read only first 50KB to avoid memory issues with big WordPress pages
    const reader = res.body?.getReader();
    let html = '';
    let bytesRead = 0;
    const MAX_BYTES = 50000;
    if (reader) {
      while (bytesRead < MAX_BYTES) {
        const { done, value } = await reader.read();
        if (done) break;
        html += new TextDecoder().decode(value);
        bytesRead += value.length;
      }
      reader.cancel();
    }

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';

    let desc = '';
    const ogDesc = html.match(/property=["']og:description["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/content=["']([^"']+)["'][^>]*property=["']og:description["']/i);
    if (ogDesc) desc = ogDesc[1].trim();
    if (!desc) {
      const metaDesc = html.match(/name=["']description["'][^>]*content=["']([^"']+)["']/i);
      if (metaDesc) desc = metaDesc[1].trim();
    }

    return { title, desc };
  } catch {
    return { title: '', desc: '' };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const body = await req.json();
    const mode = body.mode || 'urls'; // 'urls' | 'discover' | 'org'
    const delayMs = Math.max(body.delay_ms || 8000, 5000); // min 5s between calls
    const maxItems = Math.min(body.max_items || 20, 50); // max 50 per batch
    const orgId = body.org_id || null;

    let urls: {url: string, title: string, desc: string}[] = [];

    if (mode === 'urls' && body.urls) {
      // Explicit URL list
      urls = body.urls.map((u: any) =>
        typeof u === 'string' ? { url: u, title: '', desc: '' } : u
      );
    } else if (mode === 'discover' && body.homepage) {
      // Auto-discover from homepage
      urls = await discoverPages(body.homepage);
    } else if (mode === 'org' && body.org_id) {
      // Find org website, discover from there
      const orgs = await dbQuery(`organizations?org_id=eq.${body.org_id}&select=website`);
      if (orgs?.[0]?.website) {
        urls = await discoverPages(orgs[0].website);
      }
    } else {
      return new Response(JSON.stringify({ error: 'Provide mode: urls (with urls[]), discover (with homepage), or org (with org_id)' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // Dedup against already-classified URLs
    const toProcess: typeof urls = [];
    const skipped: string[] = [];
    for (const item of urls.slice(0, maxItems)) {
      if (await isAlreadyClassified(item.url)) {
        skipped.push(item.url);
      } else {
        toProcess.push(item);
      }
    }

    // Look up org from domain
    let resolvedOrgId = orgId;
    if (!resolvedOrgId && toProcess.length > 0) {
      try {
        const domain = new URL(toProcess[0].url).hostname;
        resolvedOrgId = await lookupOrg(domain);
      } catch { /* ignore */ }
    }

    // Process with rate limiting
    const results: any[] = [];
    for (let i = 0; i < toProcess.length; i++) {
      const item = toProcess[i];

      // Scrape meta if no title provided
      if (!item.title) {
        const meta = await scrapeMeta(item.url);
        item.title = meta.title;
        item.desc = meta.desc;
      }

      if (!item.title && !item.desc) {
        results.push({ url: item.url, status: 'skipped', reason: 'no content extractable' });
        continue;
      }

      try {
        const classifyRes = await fetch(CLASSIFY_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: item.url, title: item.title, description: item.desc }),
        });

        if (!classifyRes.ok) {
          results.push({ url: item.url, status: 'error', code: classifyRes.status, reason: await classifyRes.text() });
        } else {
          const data = await classifyRes.json();
          const conf = data.classification?.confidence || 0;
          const focusNames = (data.classification?._enriched_focus_areas || []).map((f: any) => f.name);
          const inboxId = data.inbox_id;

          // Link org_id if we have one
          if (inboxId && resolvedOrgId) {
            await dbQuery(`content_inbox?id=eq.${inboxId}`, 'PATCH', { org_id: resolvedOrgId });
            await dbQuery(`content_review_queue?inbox_id=eq.${inboxId}`, 'PATCH', { org_id: resolvedOrgId });
          }

          results.push({
            url: item.url,
            status: 'classified',
            confidence: conf,
            title_6th: data.classification?.title_6th_grade,
            focus_areas: focusNames,
            center: data.classification?.center,
            resource_type: data.classification?.resource_type_id,
            org_id: resolvedOrgId,
            inbox_id: inboxId,
          });
        }
      } catch (err) {
        results.push({ url: item.url, status: 'error', reason: (err as Error).message });
      }

      // Rate limit delay (skip after last item)
      if (i < toProcess.length - 1) {
        await sleep(delayMs);
      }
    }

    // Log batch
    await dbQuery('ingestion_log', 'POST', {
      event_type: 'batch_classify',
      source: resolvedOrgId || 'batch',
      status: 'success',
      message: `Batch: ${results.filter(r => r.status === 'classified').length} classified, ${skipped.length} skipped (already exist), ${results.filter(r => r.status === 'error').length} errors`,
      item_count: results.length,
    });

    return new Response(JSON.stringify({
      success: true,
      org_id: resolvedOrgId,
      processed: results.length,
      classified: results.filter(r => r.status === 'classified').length,
      skipped_dupes: skipped.length,
      errors: results.filter(r => r.status === 'error').length,
      results,
      skipped,
      estimated_time_seconds: toProcess.length * (delayMs / 1000),
    }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
