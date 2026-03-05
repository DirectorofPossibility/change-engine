/**
 * @fileoverview One-time backfill for KB chunk embeddings.
 *
 * Fetches all kb_chunks where embedding IS NULL, generates embeddings
 * via OpenAI in batches, and updates each chunk's embedding column.
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateApiRequest } from '@/lib/api-auth'
import { generateEmbeddings } from '@/lib/embeddings'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY!

async function supaRest(method: string, path: string, body?: unknown) {
  const headers: Record<string, string> = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
  }
  if (method === 'PATCH') headers['Prefer'] = 'return=minimal'
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Supabase ${method} ${path}: ${res.status} ${text}`)
  }
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

export async function POST(req: NextRequest) {
  const authError = await validateApiRequest(req)
  if (authError) return authError

  try {
    // Fetch all chunks missing embeddings
    const chunks = await supaRest(
      'GET',
      'kb_chunks?embedding=is.null&select=id,content&order=id&limit=1000'
    )

    if (!chunks || chunks.length === 0) {
      return NextResponse.json({ message: 'No chunks need embeddings', updated: 0 })
    }

    const texts = chunks.map((c: { content: string }) => c.content)
    const embeddings = await generateEmbeddings(texts)

    let updated = 0
    for (let i = 0; i < chunks.length && i < embeddings.length; i++) {
      if (embeddings[i]) {
        await supaRest('PATCH', `kb_chunks?id=eq.${chunks[i].id}`, {
          embedding: JSON.stringify(embeddings[i]),
        })
        updated++
      }
    }

    return NextResponse.json({
      message: `Backfill complete`,
      total_null: chunks.length,
      updated,
    })
  } catch (err) {
    console.error('Backfill embeddings error:', err)
    return NextResponse.json(
      { error: 'Backfill failed: ' + (err instanceof Error ? err.message : 'Unknown error') },
      { status: 500 }
    )
  }
}
