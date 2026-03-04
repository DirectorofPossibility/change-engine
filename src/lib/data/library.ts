/**
 * @fileoverview Data fetching layer for the Knowledge Base / Research Library.
 *
 * Uses the typed Supabase server client for server components and
 * provides functions for browsing, searching, and moderating documents.
 */

import { createClient } from '@/lib/supabase/server'

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

// ── Public queries ──

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
