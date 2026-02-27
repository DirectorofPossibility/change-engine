const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function callEdgeFunction(name: string, body: Record<string, unknown>) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(body),
  })
  return res.json()
}

export async function classifyUrl(url: string) {
  return callEdgeFunction('classify-content-v2', { url })
}

export async function csvUpload(rows: Array<{ url: string; title?: string; description?: string }>) {
  return callEdgeFunction('csv-upload', { rows })
}

export async function publishContent() {
  return callEdgeFunction('publish-content', {})
}

export async function translateAll() {
  return callEdgeFunction('translate-content', { mode: 'batch', languages: ['es', 'vi'] })
}

export async function pollRssFeeds() {
  return callEdgeFunction('rss-proxy', { mode: 'poll_all' })
}
