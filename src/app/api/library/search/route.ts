/**
 * @fileoverview Search API for Knowledge Base documents and chunks.
 *
 * Searches both kb_documents and kb_chunks using full-text search,
 * returning ranked results with snippets.
 */

import { NextRequest, NextResponse } from 'next/server'
import { searchDocuments, searchChunks } from '@/lib/data/library'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q') || ''
    const theme = searchParams.get('theme') || ''

    if (!query.trim()) {
      return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 })
    }

    const [documents, chunks] = await Promise.all([
      searchDocuments(query),
      searchChunks(query, 5),
    ])

    // Filter by theme if provided
    const filteredDocs = theme
      ? documents.filter(d => d.theme_ids.includes(theme))
      : documents

    return NextResponse.json({
      documents: filteredDocs,
      chunks: chunks.map(c => ({
        id: c.id,
        document_id: c.document_id,
        document_title: c.document_title,
        snippet: c.content.slice(0, 300) + (c.content.length > 300 ? '...' : ''),
        page_start: c.page_start,
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
