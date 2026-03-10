const ALLOWED_ORIGINS = [
  'https://www.changeengine.us',
  'https://changeengine.us',
  'https://change-engine.vercel.app',
];

export function getCorsHeaders(request?: Request) {
  const origin = request?.headers.get('origin') ?? '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Vary': 'Origin',
  };
}

/** @deprecated Use getCorsHeaders(request) for origin-aware CORS */
export const CORS = {
  'Access-Control-Allow-Origin': 'https://www.changeengine.us',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

export function corsResponse(body: unknown, status = 200, request?: Request) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' },
  });
}
