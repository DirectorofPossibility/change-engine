import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  try {
    let feedUrl: string | null = null;

    if (req.method === 'GET') {
      feedUrl = new URL(req.url).searchParams.get('url');
    } else {
      const body = await req.json();
      feedUrl = body.url;
    }

    if (!feedUrl) {
      return new Response(JSON.stringify({ error: 'Provide ?url= parameter' }), {
        status: 400,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const res = await fetch(feedUrl, {
      headers: { 'User-Agent': 'TheChangeEngine/1.0 (rss-proxy)' },
    });

    const contentType = res.headers.get('content-type') || 'application/xml';
    const text = await res.text();

    return new Response(text, {
      headers: {
        ...CORS,
        'Content-Type': contentType.includes('json') ? 'application/json' : 'application/xml',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
