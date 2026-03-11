/**
 * Barrel export for ingestion handler modules.
 *
 * Other API routes that need ingestion primitives (e.g., cron jobs,
 * enrichment routes) can import from here instead of duplicating logic.
 */

export { supaRest, supaUpsert, supaJunctionInsert, populateJunctionTables, junctionErrors } from './supabase-helpers'
export { scrapeUrl, stripHtml, extractMeta, extractLinks, validateUrl } from './scraper'
export { fetchTaxonomy, buildTaxonomyPrompt } from './taxonomy'
export type { Taxonomy } from './taxonomy'
export { callClaude, parseClaudeJson, translateItem } from './claude'
export { extractMultipleEvents, extractMultipleArticles } from './multi-item-extraction'
export { ingestUrl } from './ingest-url'
export { ingestPreScraped } from './ingest-pre-scraped'
