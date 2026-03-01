import { createClient } from '@/lib/supabase/server'
import { THEMES } from '@/lib/constants'
import type { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  var supabase = await createClient()
  var baseUrl = 'https://www.changeengine.us'

  // Static pages
  var staticPages = [
    '', '/pathways', '/help', '/officials', '/officials/lookup',
    '/elections', '/services', '/learn', '/search', '/policies',
  ].map(function (path) {
    return {
      url: baseUrl + path,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: path === '' ? 1.0 : 0.8,
    }
  })

  // Pathway pages
  var pathwayPages = Object.values(THEMES).map(function (t) {
    return {
      url: baseUrl + '/pathways/' + t.slug,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }
  })

  // Content pages
  var { data: content } = await supabase
    .from('content_published')
    .select('id, published_at')
    .eq('is_active', true)
  var contentPages = (content || []).map(function (c) {
    return {
      url: baseUrl + '/content/' + c.id,
      lastModified: c.published_at ? new Date(c.published_at) : new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }
  })

  // Official pages
  var { data: officials } = await supabase
    .from('elected_officials')
    .select('official_id')
  var officialPages = (officials || []).map(function (o) {
    return {
      url: baseUrl + '/officials/' + o.official_id,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }
  })

  // Life situation pages
  var { data: situations } = await supabase
    .from('life_situations')
    .select('situation_slug')
  var helpPages = (situations || []).map(function (s) {
    return {
      url: baseUrl + '/help/' + s.situation_slug,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }
  })

  // Service pages
  var { data: services } = await supabase
    .from('services_211')
    .select('service_id')
    .eq('is_active', 'Yes')
  var servicePages = (services || []).map(function (s) {
    return {
      url: baseUrl + '/services/' + s.service_id,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    }
  })

  // Policy pages
  var { data: policies } = await supabase
    .from('policies')
    .select('policy_id')
  var policyPages = (policies || []).map(function (p) {
    return {
      url: baseUrl + '/policies/' + p.policy_id,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    }
  })

  return [...staticPages, ...pathwayPages, ...contentPages, ...officialPages, ...helpPages, ...servicePages, ...policyPages]
}
