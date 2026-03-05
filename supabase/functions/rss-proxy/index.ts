import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getCallerRole, requireRole } from '../_shared/auth.ts';
import { CORS } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Parse RSS 2.0 <item> and Atom <entry> from XML
function parseItems(xml: string): { title: string; link: string; description: string }[] {
  const items: { title: string; link: string; description: string }[] = [];

  // RSS 2.0: <item>...</item>
  const rssItems = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || [];
  for (const item of rssItems) {
    const title = item.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)?.[1]?.trim() || '';
    const link = item.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1]?.trim() || '';
    const desc = item.match(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i)?.[1]?.trim() || '';
    if (link) items.push({ title, link, description: desc.substring(0, 500) });
  }

  // Atom: <entry>...</entry>
  if (items.length === 0) {
    const atomEntries = xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) || [];
    for (const entry of atomEntries) {
      const title = entry.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)?.[1]?.trim() || '';
      const link = entry.match(/<link[^>]*href=["']([^"']+)["']/i)?.[1]?.trim() || '';
      const desc = entry.match(/<summary[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/summary>/i)?.[1]?.trim() || '';
      if (link) items.push({ title, link, description: desc.substring(0, 500) });
    }
  }

  return items.slice(0, 10); // Max 10 per feed
}

async function pollAllFeeds(): Promise<{ feeds_polled: number; new_items: number; errors: string[] }> {
  // Get active feeds
  const feedsRes = await fetch(`${SUPABASE_URL}/rest/v1/rss_feeds?is_active=eq.true&select=*`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  const feeds = await feedsRes.json();

  if (!Array.isArray(feeds) || feeds.length === 0) {
    return { feeds_polled: 0, new_items: 0, errors: ['No active feeds'] };
  }

  // Get existing URLs for dedup
  const inboxRes = await fetch(`${SUPABASE_URL}/rest/v1/content_inbox?select=source_url&limit=5000`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  const inboxRows = await inboxRes.json();
  const existingUrls = new Set((inboxRows || []).map((r: any) => r.source_url));

  let feedsPolled = 0;
  let newItems = 0;
  const errors: string[] = [];

  for (const feed of feeds) {
    try {
      const res = await fetch(feed.feed_url, {
        headers: { 'User-Agent': 'TheChangeEngine/1.0 (rss-proxy)' },
      });

      if (!res.ok) {
        errors.push(`${feed.feed_name}: HTTP ${res.status}`);
        continue;
      }

      const xml = await res.text();
      const items = parseItems(xml);

      // Insert new items directly to content_inbox (skip inline classification
      // to avoid 60s edge function timeout). The classify-pending cron at 11 AM
      // will pick these up, or they can be classified via /api/intake.
      for (const item of items) {
        if (existingUrls.has(item.link)) continue;

        try {
          const inboxRes = await fetch(`${SUPABASE_URL}/rest/v1/content_inbox`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: SUPABASE_KEY,
              Authorization: `Bearer ${SUPABASE_KEY}`,
              Prefer: 'return=minimal,resolution=merge-duplicates',
            },
            body: JSON.stringify({
              source_url: item.link,
              raw_title: item.title,
              raw_description: item.description.substring(0, 1000),
              source_type: 'rss',
              source_name: feed.feed_name || feed.feed_url,
              status: 'pending',
            }),
          });

          if (inboxRes.ok || inboxRes.status === 409) {
            existingUrls.add(item.link);
            newItems++;
          } else {
            const errText = await inboxRes.text().catch(() => '');
            errors.push(`${feed.feed_name}/${item.link}: inbox insert ${inboxRes.status} ${errText.substring(0, 100)}`);
          }
        } catch (e) {
          errors.push(`${feed.feed_name}/${item.link}: ${(e as Error).message}`);
        }
      }

      // Update feed metadata
      await fetch(`${SUPABASE_URL}/rest/v1/rss_feeds?id=eq.${feed.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({
          last_polled: new Date().toISOString(),
          last_item_count: items.length,
        }),
      });

      feedsPolled++;
    } catch (e) {
      errors.push(`${feed.feed_name}: ${(e as Error).message}`);
    }
  }

  // Log
  await fetch(`${SUPABASE_URL}/rest/v1/ingestion_log`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    body: JSON.stringify({
      event_type: 'rss_poll',
      source: 'rss-proxy',
      status: errors.length > 0 ? 'partial' : 'success',
      message: `Polled ${feedsPolled} feeds, ${newItems} new items. ${errors.length} errors.`,
      item_count: newItems,
    }),
  });

  return { feeds_polled: feedsPolled, new_items: newItems, errors };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  // Auth: all modes require at least neighbor; poll_all requires partner/service_role
  const caller = await getCallerRole(req);

  try {
    // Check for poll_all mode
    if (req.method === 'POST') {
      const body = await req.json();

      if (body.mode === 'poll_all') {
        // poll_all writes to content_inbox — require partner or service_role
        const denied = requireRole(caller, ['service_role', 'partner']);
        if (denied) return denied;

        const result = await pollAllFeeds();
        return new Response(JSON.stringify(result), {
          headers: { ...CORS, 'Content-Type': 'application/json' },
        });
      }

      // Proxy mode (POST with url) — require any authenticated user
      const denied = requireRole(caller, ['service_role', 'partner', 'neighbor']);
      if (denied) return denied;

      if (body.url) {
        const res = await fetch(body.url, {
          headers: { 'User-Agent': 'TheChangeEngine/1.0 (rss-proxy)' },
        });
        const contentType = res.headers.get('content-type') || 'application/xml';
        const text = await res.text();
        return new Response(text, {
          headers: { ...CORS, 'Content-Type': contentType.includes('json') ? 'application/json' : 'application/xml' },
        });
      }

      return new Response(JSON.stringify({ error: 'Provide url or mode=poll_all' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // Proxy mode (GET with ?url=) — require any authenticated user
    const proxyDenied = requireRole(caller, ['service_role', 'partner', 'neighbor']);
    if (proxyDenied) return proxyDenied;

    const feedUrl = new URL(req.url).searchParams.get('url');
    if (!feedUrl) {
      return new Response(JSON.stringify({ error: 'Provide ?url= parameter' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const res = await fetch(feedUrl, {
      headers: { 'User-Agent': 'TheChangeEngine/1.0 (rss-proxy)' },
    });
    const contentType = res.headers.get('content-type') || 'application/xml';
    const text = await res.text();
    return new Response(text, {
      headers: { ...CORS, 'Content-Type': contentType.includes('json') ? 'application/json' : 'application/xml' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
