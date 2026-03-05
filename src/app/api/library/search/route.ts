/**
 * @fileoverview Search API for Knowledge Base — hybrid semantic + FTS search.
 *
 * Searches kb_documents and kb_chunks using hybrid search (pgvector + FTS),
 * returning ranked results with scores and snippets.
 */

import { NextRequest, NextResponse } from 'next/server'
import { searchDocuments, hybridSearch, multiSourceSearch } from '@/lib/data/library'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q') || ''
    const theme = searchParams.get('theme') || ''
    const mode = searchParams.get('mode') || 'hybrid' // 'hybrid' | 'multi'

    if (!query.trim()) {
      return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 })
    }

    if (mode === 'multi') {
      // Multi-source search across all entity types
      const results = await multiSourceSearch(query, 15)
      return NextResponse.json({ results, total: results.length })
    }

    // Default: hybrid search on KB documents + chunks
    const [documents, chunks] = await Promise.all([
      searchDocuments(query),
      hybridSearch(query, 10),
    ])

    // Filter by theme if provided
    const filteredDocs = theme
      ? documents.filter(d => d.theme_ids.includes(theme))
      : documents

    return NextResponse.json({
      documents: filteredDocs,
      chunks: chunks.map(c => ({
        id: c.chunk_id,
        document_id: c.document_id,
        document_title: c.document_title,
        snippet: c.content.slice(0, 300) + (c.content.length > 300 ? '...' : ''),
        page_start: c.metadata?.page_start,
        score: c.combined_score,
      })),
      total: filteredDocs.length,
    })
  } catch (err) {
    console.error('Library search error:', err)
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    )
  }
}
