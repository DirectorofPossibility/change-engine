import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const CLASSIFY_URL = `${SUPABASE_URL}/functions/v1/classify-content-v2`;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

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

      let classified = 0;
      for (const item of items) {
        if (existingUrls.has(item.link)) continue;

        try {
          const classifyRes = await fetch(CLASSIFY_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${SUPABASE_KEY}`,
            },
            body: JSON.stringify({
              url: item.link,
              title: item.title,
              description: item.description,
            }),
          });

          if (classifyRes.ok) {
            existingUrls.add(item.link);
            classified++;
            newItems++;
          }
        } catch (e) {
          errors.push(`${feed.feed_name}/${item.link}: ${(e as Error).message}`);
        }

        await sleep(2000);
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

  try {
    // Check for poll_all mode
    if (req.method === 'POST') {
      const body = await req.json();

      if (body.mode === 'poll_all') {
        const result = await pollAllFeeds();
        return new Response(JSON.stringify(result), {
          headers: { ...CORS, 'Content-Type': 'application/json' },
        });
      }

      // Original proxy mode (POST with url)
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

    // Original proxy mode (GET with ?url=)
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
