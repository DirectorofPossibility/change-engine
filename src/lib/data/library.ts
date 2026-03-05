/**
 * @fileoverview Data fetching layer for the Knowledge Base / Research Library.
 *
 * Uses the typed Supabase server client for server components and
 * provides functions for browsing, searching, and moderating documents.
 */

import { createClient } from '@/lib/supabase/server'
import { generateEmbedding } from '@/lib/embeddings'

// ── Types ──

export interface KBDocument {
  id: string
  title: string
  summary: string
  key_points: string[]
  file_path: string
  file_size: number
  page_count: number
  status: string
  uploaded_by: string | null
  tags: string[]
  theme_ids: string[]
  focus_area_ids: string[]
  center_id: string | null
  created_at: string
  published_at: string | null
}

export interface KBChunk {
  id: string
  document_id: string
  chunk_index: number
  content: string
  page_start: number | null
  page_end: number | null
}

export interface KBDocumentWithChunks extends KBDocument {
  chunks: KBChunk[]
}

export interface KBSearchResult {
  id: string
  title: string
  summary: string
  tags: string[]
  theme_ids: string[]
  page_count: number
  published_at: string | null
}

export interface KBChunkSearchResult {
  id: string
  document_id: string
  chunk_index: number
  content: string
  page_start: number | null
  page_end: number | null
  document_title?: string
}

/** A library nugget — a representative chunk excerpt from a published document. */
export interface LibraryNugget {
  documentId: string
  documentTitle: string
  chunkExcerpt: string
  pageRef: string | null
  link: string
}

// ── Public queries ──

/**
 * Fetch library nuggets matching given theme or focus area IDs.
 * Returns one representative chunk per document, with a 200-char excerpt.
 */
export async function getLibraryNuggets(
  themeIds: string[],
  focusAreaIds: string[],
  limit = 3
): Promise<LibraryNugget[]> {
  if (themeIds.length === 0 && focusAreaIds.length === 0) return []

  const supabase = await createClient()

  // Query published documents that overlap with the given themes or focus areas
  let query = supabase
    .from('kb_documents' as any)
    .select('id, title, focus_area_ids, theme_ids')
    .eq('status', 'published')
    .limit(limit * 2) // fetch extra to ensure we get enough after filtering

  if (themeIds.length > 0) {
    query = query.overlaps('theme_ids', themeIds)
  }

  const { data: docs } = await query
  if (!docs || docs.length === 0) return []

  const typedDocs = docs as unknown as Array<{
    id: string; title: string; focus_area_ids: string[]; theme_ids: string[]
  }>

  // If we also have focus area filters, score by overlap
  let ranked = typedDocs
  if (focusAreaIds.length > 0) {
    ranked = typedDocs
      .map(d => ({
        ...d,
        score: (d.focus_area_ids || []).filter(id => focusAreaIds.includes(id)).length
          + (d.theme_ids || []).filter(id => themeIds.includes(id)).length,
      }))
      .sort((a, b) => b.score - a.score)
  }

  const selected = ranked.slice(0, limit)
  const docIds = selected.map(d => d.id)

  // Get one chunk per document
  const { data: chunks } = await supabase
    .from('kb_chunks' as any)
    .select('document_id, content, page_start, chunk_index')
    .in('document_id', docIds)
    .order('chunk_index', { ascending: true })

  const typedChunks = (chunks ?? []) as unknown as Array<{
    document_id: string; content: string; page_start: number | null; chunk_index: number
  }>

  // Pick first chunk per document
  const chunkMap = new Map<string, typeof typedChunks[0]>()
  for (const c of typedChunks) {
    if (!chunkMap.has(c.document_id)) chunkMap.set(c.document_id, c)
  }

  return selected
    .filter(d => chunkMap.has(d.id))
    .map(d => {
      const chunk = chunkMap.get(d.id)!
      const excerpt = chunk.content.length > 200
        ? chunk.content.slice(0, 197) + '...'
        : chunk.content
      return {
        documentId: d.id,
        documentTitle: d.title,
        chunkExcerpt: excerpt,
        pageRef: chunk.page_start ? 'p. ' + chunk.page_start : null,
        link: '/library/doc/' + d.id,
      }
    })
}

export async function getPublishedDocuments(
  page = 1,
  limit = 12,
  themeFilter?: string
): Promise<{ documents: KBDocument[]; total: number }> {
  const supabase = await createClient()
  const offset = (page - 1) * limit

  let query = supabase
    .from('kb_documents' as any)
    .select('*', { count: 'exact' })
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (themeFilter) {
    query = query.contains('theme_ids', [themeFilter])
  }

  const { data, count } = await query
  return {
    documents: (data ?? []) as unknown as KBDocument[],
    total: count ?? 0,
  }
}

export async function getDocumentById(id: string): Promise<KBDocumentWithChunks | null> {
  const supabase = await createClient()

  const { data: doc } = await supabase
    .from('kb_documents' as any)
    .select('*')
    .eq('id', id)
    .eq('status', 'published')
    .single()

  if (!doc) return null

  const { data: chunks } = await supabase
    .from('kb_chunks' as any)
    .select('*')
    .eq('document_id', id)
    .order('chunk_index')

  return {
    ...(doc as unknown as KBDocument),
    chunks: (chunks ?? []) as unknown as KBChunk[],
  }
}

export async function searchDocuments(query: string): Promise<KBSearchResult[]> {
  if (!query || query.trim().length === 0) return []

  const supabase = await createClient()
  const tsQuery = query.trim().split(/\s+/).join(' & ')

  const { data } = await supabase
    .from('kb_documents' as any)
    .select('id, title, summary, tags, theme_ids, page_count, published_at')
    .eq('status', 'published')
    .textSearch('search_vector', tsQuery)
    .limit(20)

  return (data ?? []) as unknown as KBSearchResult[]
}

export async function searchChunks(query: string, limit = 10): Promise<KBChunkSearchResult[]> {
  if (!query || query.trim().length === 0) return []

  const supabase = await createClient()
  const tsQuery = query.trim().split(/\s+/).join(' & ')

  const { data: chunks } = await supabase
    .from('kb_chunks' as any)
    .select('id, document_id, chunk_index, content, page_start, page_end')
    .textSearch('search_vector', tsQuery)
    .limit(limit)

  if (!chunks || chunks.length === 0) return []

  const typedChunks = chunks as unknown as Array<{ id: string; document_id: string; chunk_index: number; content: string; page_start: number | null; page_end: number | null }>

  // Enrich with document titles
  const docIds = Array.from(new Set(typedChunks.map(c => c.document_id)))
  const { data: docs } = await supabase
    .from('kb_documents' as any)
    .select('id, title')
    .in('id', docIds)
    .eq('status', 'published')

  const typedDocs = (docs ?? []) as unknown as Array<{ id: string; title: string }>
  const titleMap = new Map(typedDocs.map(d => [d.id, d.title]))

  return typedChunks
    .filter(c => titleMap.has(c.document_id))
    .map(c => ({
      ...c,
      document_title: titleMap.get(c.document_id),
    })) as KBChunkSearchResult[]
}

// ── Hybrid + Multi-source search ──

export interface HybridSearchResult {
  chunk_id: string
  document_id: string
  content: string
  metadata: { chunk_index?: number; page_start?: number; page_end?: number }
  fts_rank: number
  semantic_score: number
  combined_score: number
  document_title?: string
}

export interface MultiSourceResult {
  source_type: 'kb_document' | 'service' | 'organization' | 'content' | 'official'
  source_id: string
  title: string
  content: string
  score: number
  metadata: Record<string, unknown>
}

/**
 * Hybrid search combining semantic (pgvector) and full-text search on kb_chunks.
 * Falls back to FTS-only if embedding generation fails.
 */
export async function hybridSearch(
  query: string,
  limit = 10,
): Promise<HybridSearchResult[]> {
  if (!query || query.trim().length === 0) return []

  const supabase = await createClient()

  try {
    const queryEmbedding = await generateEmbedding(query)

    const { data, error } = await supabase.rpc('hybrid_search' as any, {
      query_text: query,
      query_embedding: JSON.stringify(queryEmbedding),
      match_count: limit,
      fts_weight: 0.3,
      semantic_weight: 0.7,
    })

    if (error) throw error
    if (!data || data.length === 0) return []

    const results = data as unknown as HybridSearchResult[]

    // Enrich with document titles
    const docIds = Array.from(new Set(results.map(r => r.document_id)))
    const { data: docs } = await supabase
      .from('kb_documents' as any)
      .select('id, title')
      .in('id', docIds)
      .eq('status', 'published')

    const titleMap = new Map(
      ((docs ?? []) as unknown as Array<{ id: string; title: string }>).map(d => [d.id, d.title])
    )

    return results.map(r => ({
      ...r,
      document_title: titleMap.get(r.document_id),
    }))
  } catch (err) {
    console.error('Hybrid search failed, falling back to FTS:', err)
    // Fallback to existing FTS search
    const ftsResults = await searchChunks(query, limit)
    return ftsResults.map(c => ({
      chunk_id: c.id,
      document_id: c.document_id,
      content: c.content,
      metadata: { page_start: c.page_start ?? undefined, page_end: c.page_end ?? undefined },
      fts_rank: 1,
      semantic_score: 0,
      combined_score: 0.3,
      document_title: c.document_title,
    }))
  }
}

/**
 * Multi-source search across ALL entity types: KB docs, services, orgs,
 * published content, and elected officials.
 * Falls back to KB-only search if multi-source RPC fails.
 */
export async function multiSourceSearch(
  query: string,
  limit = 15,
): Promise<MultiSourceResult[]> {
  if (!query || query.trim().length === 0) return []

  const supabase = await createClient()

  try {
    const queryEmbedding = await generateEmbedding(query)

    const { data, error } = await supabase.rpc('multi_source_search' as any, {
      query_text: query,
      query_embedding: JSON.stringify(queryEmbedding),
      match_count: limit,
    })

    if (error) throw error
    return (data ?? []) as unknown as MultiSourceResult[]
  } catch (err) {
    console.error('Multi-source search failed, falling back to KB search:', err)
    // Fallback: search KB chunks only
    const chunks = await hybridSearch(query, limit)
    return chunks.map(c => ({
      source_type: 'kb_document' as const,
      source_id: c.document_id,
      title: c.document_title || 'Untitled',
      content: c.content,
      score: c.combined_score,
      metadata: { page_start: c.metadata?.page_start, chunk_id: c.chunk_id },
    }))
  }
}

// ── Knowledge Base queries ──

/** Count published documents per theme for homepage category cards. */
export async function getDocumentCountsByTheme(): Promise<Record<string, number>> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('kb_documents' as any)
    .select('theme_ids')
    .eq('status', 'published')

  const counts: Record<string, number> = {}
  for (const doc of (data ?? []) as unknown as Array<{ theme_ids: string[] }>) {
    for (const tid of doc.theme_ids ?? []) {
      counts[tid] = (counts[tid] || 0) + 1
    }
  }
  return counts
}

/** Fetch published documents for a given theme, optionally filtered by center. */
export async function getDocumentsByTheme(
  themeId: string,
  center?: string,
  limit = 50
): Promise<KBDocument[]> {
  const supabase = await createClient()
  let query = supabase
    .from('kb_documents' as any)
    .select('*')
    .eq('status', 'published')
    .contains('theme_ids', [themeId])
    .order('published_at', { ascending: false })
    .limit(limit)

  if (center) {
    query = query.eq('center_id', center)
  }

  const { data } = await query
  return (data ?? []) as unknown as KBDocument[]
}

/** Count documents per center for a given theme. */
export async function getCenterCountsForTheme(
  themeId: string
): Promise<Record<string, number>> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('kb_documents' as any)
    .select('center_id')
    .eq('status', 'published')
    .contains('theme_ids', [themeId])

  const counts: Record<string, number> = {}
  for (const doc of (data ?? []) as unknown as Array<{ center_id: string | null }>) {
    const key = doc.center_id || '_other'
    counts[key] = (counts[key] || 0) + 1
  }
  return counts
}

/** Fetch sibling documents in the same theme/center for sidebar navigation. */
export async function getSiblingDocuments(
  docId: string,
  themeIds: string[],
  centerId: string | null,
  limit = 10
): Promise<KBSearchResult[]> {
  if (themeIds.length === 0) return []
  const supabase = await createClient()

  let query = supabase
    .from('kb_documents' as any)
    .select('id, title, summary, tags, theme_ids, page_count, published_at')
    .eq('status', 'published')
    .neq('id', docId)
    .overlaps('theme_ids', themeIds)
    .order('published_at', { ascending: false })
    .limit(limit)

  if (centerId) {
    query = query.eq('center_id', centerId)
  }

  const { data } = await query
  return (data ?? []) as unknown as KBSearchResult[]
}

/** Record a helpful/not_helpful vote (upsert by session). */
export async function recordArticleVote(
  documentId: string,
  vote: 'helpful' | 'not_helpful',
  sessionId: string
): Promise<{ success: boolean }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('kb_article_votes' as any)
    .upsert(
      { document_id: documentId, vote, session_id: sessionId },
      { onConflict: 'document_id,session_id' }
    )

  return { success: !error }
}

/** Get aggregate vote counts for a document. */
export async function getArticleVotes(
  documentId: string
): Promise<{ helpful: number; not_helpful: number }> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('kb_article_votes' as any)
    .select('vote')
    .eq('document_id', documentId)

  const votes = (data ?? []) as unknown as Array<{ vote: string }>
  return {
    helpful: votes.filter(v => v.vote === 'helpful').length,
    not_helpful: votes.filter(v => v.vote === 'not_helpful').length,
  }
}

// ── Admin queries ──

export async function getPendingDocuments(): Promise<KBDocument[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('kb_documents' as any)
    .select('*')
    .in('status', ['pending', 'processing'])
    .order('created_at', { ascending: false })

  return (data ?? []) as unknown as KBDocument[]
}

export async function getAllDocumentsAdmin(): Promise<KBDocument[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('kb_documents' as any)
    .select('*')
    .order('created_at', { ascending: false })

  return (data ?? []) as unknown as KBDocument[]
}

export async function getDocumentsByUploader(userId: string): Promise<KBDocument[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('kb_documents' as any)
    .select('*')
    .eq('uploaded_by', userId)
    .order('created_at', { ascending: false })

  return (data ?? []) as unknown as KBDocument[]
}

export async function getRelatedDocuments(
  documentId: string,
  themeIds: string[],
  tags: string[],
  limit = 4
): Promise<KBSearchResult[]> {
  if (themeIds.length === 0 && tags.length === 0) return []

  const supabase = await createClient()

  const { data } = await supabase
    .from('kb_documents' as any)
    .select('id, title, summary, tags, theme_ids, page_count, published_at')
    .eq('status', 'published')
    .neq('id', documentId)
    .overlaps('theme_ids', themeIds.length > 0 ? themeIds : ['__none__'])
    .limit(limit)

  return (data ?? []) as unknown as KBSearchResult[]
}

// ── Unified Knowledge Base (kb_documents + content_published) ──

export interface UnifiedKBItem {
  id: string
  title: string
  summary: string
  tags: string[]
  theme_ids: string[]
  focus_area_ids: string[]
  content_type: string
  center: string | null
  source: 'kb_document' | 'content'
  image_url: string | null
  source_url: string | null
  published_at: string | null
}

export async function getUnifiedKBItems(): Promise<UnifiedKBItem[]> {
  const supabase = await createClient()

  const [kbRes, cpRes] = await Promise.all([
    supabase
      .from('kb_documents' as any)
      .select('id, title, summary, tags, theme_ids, focus_area_ids, content_type, center_id, published_at')
      .eq('status', 'published'),
    supabase
      .from('content_published')
      .select('id, title_6th_grade, summary_6th_grade, keywords, pathway_primary, pathway_secondary, focus_area_ids, content_type, center, image_url, source_url, published_at')
      .eq('is_active', true),
  ])

  const items: UnifiedKBItem[] = []

  for (const d of (kbRes.data ?? []) as any[]) {
    items.push({
      id: d.id,
      title: d.title,
      summary: d.summary || '',
      tags: d.tags || [],
      theme_ids: d.theme_ids || [],
      focus_area_ids: d.focus_area_ids || [],
      content_type: d.content_type || 'document',
      center: d.center_id || null,
      source: 'kb_document',
      image_url: null,
      source_url: null,
      published_at: d.published_at,
    })
  }

  for (const c of (cpRes.data ?? []) as any[]) {
    const themeIds = [c.pathway_primary, ...(c.pathway_secondary || [])].filter(Boolean)
    items.push({
      id: c.id,
      title: c.title_6th_grade || '',
      summary: c.summary_6th_grade || '',
      tags: c.keywords || [],
      theme_ids: themeIds,
      focus_area_ids: c.focus_area_ids || [],
      content_type: c.content_type || 'article',
      center: c.center || null,
      source: 'content',
      image_url: c.image_url || null,
      source_url: c.source_url || null,
      published_at: c.published_at,
    })
  }

  items.sort(function (a, b) {
    return a.title.localeCompare(b.title, 'en', { sensitivity: 'base' })
  })

  return items
}
