import { createClient } from '@/lib/supabase/server'
import { THEMES } from '@/lib/constants'
import type { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()
  const baseUrl = 'https://www.changeengine.us'

  // Static pages
  const staticPages = [
    '', '/pathways', '/help', '/officials', '/officials/lookup',
    '/elections', '/services', '/learn', '/search', '/policies', '/geography', '/library',
  ].map(function (path) {
    return {
      url: baseUrl + path,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: path === '' ? 1.0 : 0.8,
    }
  })

  // Pathway pages
  const pathwayPages = Object.values(THEMES).map(function (t) {
    return {
      url: baseUrl + '/pathways/' + t.slug,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }
  })

  // Content pages
  const { data: content } = await supabase
    .from('content_published')
    .select('id, published_at')
    .eq('is_active', true)
  const contentPages = (content || []).map(function (c) {
    return {
      url: baseUrl + '/content/' + c.id,
      lastModified: c.published_at ? new Date(c.published_at) : new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }
  })

  // Official pages
  const { data: officials } = await supabase
    .from('elected_officials')
    .select('official_id')
  const officialPages = (officials || []).map(function (o) {
    return {
      url: baseUrl + '/officials/' + o.official_id,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }
  })

  // Life situation pages
  const { data: situations } = await supabase
    .from('life_situations')
    .select('situation_slug')
  const helpPages = (situations || []).map(function (s) {
    return {
      url: baseUrl + '/help/' + s.situation_slug,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }
  })

  // Service pages
  const { data: services } = await supabase
    .from('services_211')
    .select('service_id')
    .eq('is_active', 'Yes')
  const servicePages = (services || []).map(function (s) {
    return {
      url: baseUrl + '/services/' + s.service_id,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    }
  })

  // Policy pages
  const { data: policies } = await supabase
    .from('policies')
    .select('policy_id')
  const policyPages = (policies || []).map(function (p) {
    return {
      url: baseUrl + '/policies/' + p.policy_id,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    }
  })

  // Library category pages
  const libraryCategoryPages = Object.values(THEMES).map(function (t) {
    return {
      url: baseUrl + '/library/category/' + t.slug,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }
  })

  // Library document pages
  const { data: kbDocs } = await supabase
    .from('kb_documents')
    .select('id, published_at')
    .eq('status', 'published')
  const libraryDocPages = (kbDocs || []).map(function (d: { id: string; published_at: string | null }) {
    return {
      url: baseUrl + '/library/doc/' + d.id,
      lastModified: d.published_at ? new Date(d.published_at) : new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }
  })

  return [...staticPages, ...pathwayPages, ...contentPages, ...officialPages, ...helpPages, ...servicePages, ...policyPages, ...libraryCategoryPages, ...libraryDocPages]
}
