/**
 * @fileoverview Processing API for Knowledge Base documents.
 *
 * Downloads PDF from Storage, extracts text with pdf-parse, chunks it,
 * sends to Claude for summarization/tagging, stores chunks, and updates
 * the document with AI results.
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateApiRequest } from '@/lib/api-auth'
import { generateEmbeddings } from '@/lib/embeddings'
import {
  fetchFullTaxonomy,
  buildPromptForEntity,
  buildUserPrompt,
  classifyEntity,
  parseClaudeJson as parseClassificationJson,
  validateAndEnrich,
} from '@/lib/classification'

// Allow up to 120s for PDF parsing + embeddings + 2 Claude calls
export const maxDuration = 120

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY!
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || ''

// ── Supabase REST helper ──

async function supaRest(method: string, path: string, body?: unknown) {
  const headers: Record<string, string> = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
  }
  if (method === 'POST') headers['Prefer'] = 'return=representation'
  if (method === 'PATCH') headers['Prefer'] = 'return=representation'
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

// ── Claude helper ──

async function callClaude(system: string, user: string, maxTokens = 4000): Promise<string> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: maxTokens,
          system,
          messages: [{ role: 'user', content: user }],
        }),
        signal: AbortSignal.timeout(60000),
      })
      const data = await res.json()
      if (data.error) {
        if (attempt < 2) {
          await new Promise(r => setTimeout(r, 2000 * (attempt + 1)))
          continue
        }
        throw new Error(data.error.message || 'Claude API error')
      }
      return data.content?.[0]?.text || ''
    } catch (e) {
      if (attempt < 2) {
        await new Promise(r => setTimeout(r, 2000 * (attempt + 1)))
        continue
      }
      throw e
    }
  }
  throw new Error('Max retries')
}

function parseClaudeJson(raw: string): Record<string, unknown> {
  let text = raw.trim()
  if (text.startsWith('```json')) text = text.slice(7)
  else if (text.startsWith('```')) text = text.slice(3)
  if (text.endsWith('```')) text = text.slice(0, -3)
  text = text.trim()
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('No JSON found')
  return JSON.parse(text.substring(start, end + 1))
}

// ── Text chunking ──

function chunkText(text: string, maxTokens = 1000, overlapTokens = 100): string[] {
  const words = text.split(/\s+/)
  const chunks: string[] = []
  let start = 0

  while (start < words.length) {
    const end = Math.min(start + maxTokens, words.length)
    chunks.push(words.slice(start, end).join(' '))
    if (end >= words.length) break
    start = end - overlapTokens
  }

  return chunks
}

// ── Taxonomy fetch ──

async function fetchThemesAndFocusAreas() {
  const [themes, focusAreas] = await Promise.all([
    supaRest('GET', 'themes?select=theme_id,theme_name&limit=100'),
    supaRest('GET', 'focus_areas?select=focus_id,focus_area_name,theme_id&limit=500'),
  ])
  return { themes: themes ?? [], focusAreas: focusAreas ?? [] }
}

// ── Main handler ──

export async function POST(req: NextRequest) {
  const authError = await validateApiRequest(req)
  if (authError) return authError

  let document_id: string | null = null

  try {
    const body = await req.json()
    document_id = body.document_id

    if (!document_id) {
      return NextResponse.json({ error: 'document_id required' }, { status: 400 })
    }

    // Fetch document
    const docs = await supaRest('GET', `kb_documents?id=eq.${document_id}&select=*`)
    if (!docs || docs.length === 0) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }
    const doc = docs[0]

    // Update status to processing
    await supaRest('PATCH', `kb_documents?id=eq.${document_id}`, {
      status: 'processing',
    })

    // Download PDF from Storage
    const storageRes = await fetch(
      `${SUPABASE_URL}/storage/v1/object/kb-documents/${doc.file_path}`,
      {
        headers: {
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      }
    )
    if (!storageRes.ok) {
      throw new Error('Failed to download PDF from storage')
    }
    const pdfBuffer = Buffer.from(await storageRes.arrayBuffer())

    // Parse PDF — import lib directly to skip pdf-parse's debug test runner
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse/lib/pdf-parse')
    const pdfData = await pdfParse(pdfBuffer)
    const fullText = pdfData.text
    const pageCount = pdfData.numpages

    // Chunk the text
    const textChunks = chunkText(fullText)

    // Delete any existing chunks (in case of reprocessing)
    await supaRest('DELETE', `kb_chunks?document_id=eq.${document_id}`)

    // Insert chunks
    const chunkInserts = textChunks.map(function (content, index) {
      // Estimate page numbers based on position
      const ratio = index / Math.max(textChunks.length, 1)
      const pageStart = Math.floor(ratio * pageCount) + 1
      const pageEnd = Math.min(Math.floor((index + 1) / Math.max(textChunks.length, 1) * pageCount) + 1, pageCount)
      return {
        document_id,
        chunk_index: index,
        content,
        page_start: pageStart,
        page_end: pageEnd,
      }
    })

    // Batch insert chunks (max 50 at a time)
    const insertedChunks: any[] = []
    for (let i = 0; i < chunkInserts.length; i += 50) {
      const batch = chunkInserts.slice(i, i + 50)
      const inserted = await supaRest('POST', 'kb_chunks', batch)
      if (inserted) insertedChunks.push(...inserted)
    }

    // Generate and store embeddings for each chunk
    try {
      const chunkTexts = textChunks.map(t => t.slice(0, 32000))
      const embeddings = await generateEmbeddings(chunkTexts)

      // Match embeddings to inserted chunk IDs and update
      for (let i = 0; i < insertedChunks.length && i < embeddings.length; i++) {
        const chunkId = insertedChunks[i]?.id
        if (chunkId && embeddings[i]) {
          await supaRest('PATCH', `kb_chunks?id=eq.${chunkId}`, {
            embedding: JSON.stringify(embeddings[i]),
          })
        }
      }
      console.log(`Generated embeddings for ${embeddings.length} chunks`)
    } catch (embErr) {
      console.error('Embedding generation failed (non-fatal):', embErr)
      // Continue processing — embeddings are nice-to-have, not blocking
    }

    // ── Step 1: Basic metadata extraction (title, summary, key points, tags) ──
    const basicTaxonomy = await fetchThemesAndFocusAreas()
    const sampleText = fullText.slice(0, 8000)
    const themeList = basicTaxonomy.themes.map((t: { theme_id: string; theme_name: string }) =>
      `${t.theme_id}: ${t.theme_name}`
    ).join('\n')
    const focusAreaList = basicTaxonomy.focusAreas.slice(0, 50).map((f: { focus_id: string; focus_area_name: string }) =>
      `${f.focus_id}: ${f.focus_area_name}`
    ).join('\n')

    const metadataPrompt = `You are a civic research librarian for The Change Engine, a Houston civic platform.
Analyze the provided document text and extract structured metadata.
Use asset-based language — focus on strengths, opportunities, and community resources.
Respond with valid JSON only.`

    const metadataUser = `Analyze this document and return JSON with these fields:
- title: a clear, concise title (if the text suggests one, use it; otherwise create one)
- summary: 2-3 sentence summary at a 6th-grade reading level, asset-based language
- key_points: array of 3-6 key takeaways as short bullet strings
- tags: array of 3-8 relevant topic tags (lowercase)
- theme_ids: array of matching theme IDs from this list:
${themeList}
- focus_area_ids: array of matching focus area IDs from this list:
${focusAreaList}

Document text (first ~8000 chars):
${sampleText}`

    const aiResponse = await callClaude(metadataPrompt, metadataUser)
    const analysis = parseClaudeJson(aiResponse) as {
      title?: string
      summary?: string
      key_points?: string[]
      tags?: string[]
      theme_ids?: string[]
      focus_area_ids?: string[]
    }

    const validThemeIds = new Set(basicTaxonomy.themes.map((t: { theme_id: string }) => t.theme_id))
    const validFocusIds = new Set(basicTaxonomy.focusAreas.map((f: { focus_id: string }) => f.focus_id))
    const filteredThemeIds = (analysis.theme_ids ?? []).filter(id => validThemeIds.has(id))
    const filteredFocusIds = (analysis.focus_area_ids ?? []).filter(id => validFocusIds.has(id))

    // ── Step 2: Full 16-dimension classification ──
    let classificationV2 = null
    let assignedOrgId: string | null = null
    let primaryThemeId: string | null = null
    let classifiedContentType: string | null = null

    try {
      const fullTax = await fetchFullTaxonomy(SUPABASE_URL, SUPABASE_KEY)
      const systemPrompt = buildPromptForEntity(fullTax, 'content')
      const userPromptText = buildUserPrompt('content', {
        name: analysis.title || doc.title || 'Untitled Document',
        description: analysis.summary || '',
        fullText: fullText,
      })

      const classRaw = await classifyEntity(systemPrompt, userPromptText, ANTHROPIC_KEY)
      const classParsed = parseClassificationJson(classRaw)
      const enriched = validateAndEnrich(classParsed, fullTax, 'content')

      classificationV2 = enriched
      primaryThemeId = enriched.theme_primary || filteredThemeIds[0] || null
      classifiedContentType = enriched.content_type || 'report'

      // Auto-assign org_id by matching org names in document text
      try {
        const orgs = await supaRest('GET', 'organizations?select=org_id,org_name&limit=500')
        if (orgs) {
          const textLower = fullText.toLowerCase()
          for (const org of orgs) {
            if (org.org_name && org.org_name.length > 3 && textLower.includes(org.org_name.toLowerCase())) {
              assignedOrgId = org.org_id
              break
            }
          }
        }
      } catch { /* org matching is optional */ }

      console.log(`Full classification completed: theme=${primaryThemeId}, type=${classifiedContentType}`)
    } catch (classErr) {
      console.error('Full classification failed (non-fatal):', classErr)
    }

    // ── Step 3: Update document with all results ──
    await supaRest('PATCH', `kb_documents?id=eq.${document_id}`, {
      title: analysis.title || doc.title,
      summary: analysis.summary || '',
      key_points: analysis.key_points || [],
      tags: Array.from(new Set([...(doc.tags || []), ...(analysis.tags || [])])),
      theme_ids: filteredThemeIds,
      focus_area_ids: filteredFocusIds,
      page_count: pageCount,
      status: 'published',
      published_at: new Date().toISOString(),
      // New v2 classification fields
      classification_v2: classificationV2,
      org_id: assignedOrgId,
      theme_id: primaryThemeId,
      content_type: classifiedContentType,
    })

    return NextResponse.json({
      success: true,
      document_id,
      page_count: pageCount,
      chunk_count: textChunks.length,
      title: analysis.title || doc.title,
      classification: classificationV2 ? 'v2' : 'basic',
      org_id: assignedOrgId,
    })
  } catch (err) {
    console.error('Library process error:', err)

    // Reset status back to pending so admin can retry
    if (document_id) {
      try {
        await supaRest('PATCH', `kb_documents?id=eq.${document_id}`, {
          status: 'pending',
        })
      } catch (resetErr) {
        console.error('Failed to reset document status:', resetErr)
      }
    }

    return NextResponse.json(
      { error: 'Processing failed: ' + (err instanceof Error ? err.message : 'Unknown error') },
      { status: 500 }
    )
  }
}
