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
    '/organizations', '/opportunities', '/news', '/calendar', '/bookshelf', '/about',
    '/teens', '/compass', '/faq', '/glossary',
    '/accessibility', '/privacy', '/terms', '/contact', '/donate',
    '/community', '/governance', '/resources', '/polling-places',
    '/districts', '/neighborhoods', '/super-neighborhoods', '/tirz',
    '/candidates', '/campaigns', '/centers', '/collections',
    '/foundations', '/guides', '/learning-paths', '/benefits',
    '/agencies', '/municipal-services', '/events', '/stories', '/explore',
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
    .select('id, slug, published_at')
    .eq('is_active', true)
  const contentPages = (content || []).map(function (c: any) {
    return {
      url: baseUrl + '/content/' + (c.slug || c.id),
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

  // Organization pages
  const { data: orgs } = await supabase
    .from('organizations')
    .select('org_id')
  const orgPages = (orgs || []).map(function (o) {
    return {
      url: baseUrl + '/organizations/' + o.org_id,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    }
  })

  // Event pages
  const { data: events } = await supabase
    .from('events')
    .select('event_id')
    .eq('is_active', 'Yes')
  const eventPages = (events || []).map(function (e) {
    return {
      url: baseUrl + '/events/' + e.event_id,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    }
  })

  // Candidate pages
  const { data: candidates } = await supabase
    .from('candidates')
    .select('candidate_id')
  const candidatePages = (candidates || []).map(function (c) {
    return {
      url: baseUrl + '/candidates/' + c.candidate_id,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    }
  })

  // Campaign pages
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('campaign_id')
  const campaignPages = (campaigns || []).map(function (c) {
    return {
      url: baseUrl + '/campaigns/' + c.campaign_id,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    }
  })

  // Collection pages
  const { data: collections } = await supabase
    .from('featured_collections')
    .select('collection_id')
  const collectionPages = (collections || []).map(function (c) {
    return {
      url: baseUrl + '/collections/' + c.collection_id,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    }
  })

  // Foundation pages
  const { data: foundations } = await supabase
    .from('foundations')
    .select('id')
  const foundationPages = (foundations || []).map(function (f) {
    return {
      url: baseUrl + '/foundations/' + f.id,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    }
  })

  // Guide pages
  const { data: guides } = await supabase
    .from('guides')
    .select('slug')
  const guidePages = (guides || []).map(function (g) {
    return {
      url: baseUrl + '/guides/' + g.slug,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }
  })

  // Learning path pages
  const { data: learningPaths } = await supabase
    .from('learning_paths')
    .select('path_id')
  const learningPathPages = (learningPaths || []).map(function (lp) {
    return {
      url: baseUrl + '/learning-paths/' + lp.path_id,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    }
  })

  // Benefit pages
  const { data: benefits } = await supabase
    .from('benefit_programs')
    .select('benefit_id')
  const benefitPages = (benefits || []).map(function (b) {
    return {
      url: baseUrl + '/benefits/' + b.benefit_id,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    }
  })

  // Agency pages
  const { data: agencies } = await supabase
    .from('agencies')
    .select('agency_id')
  const agencyPages = (agencies || []).map(function (a) {
    return {
      url: baseUrl + '/agencies/' + a.agency_id,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    }
  })

  // Municipal service pages
  const { data: municipalServices } = await supabase
    .from('municipal_services')
    .select('id')
  const municipalServicePages = (municipalServices || []).map(function (ms) {
    return {
      url: baseUrl + '/municipal-services/' + ms.id,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    }
  })

  // Neighborhood pages
  const { data: neighborhoods } = await supabase
    .from('neighborhoods')
    .select('neighborhood_id')
  const neighborhoodPages = (neighborhoods || []).map(function (n) {
    return {
      url: baseUrl + '/neighborhoods/' + n.neighborhood_id,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.4,
    }
  })

  // Super neighborhood pages
  const { data: superNeighborhoods } = await supabase
    .from('super_neighborhoods')
    .select('sn_id')
  const superNeighborhoodPages = (superNeighborhoods || []).map(function (sn) {
    return {
      url: baseUrl + '/super-neighborhoods/' + sn.sn_id,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.4,
    }
  })

  // TIRZ pages
  const { data: tirzZones } = await supabase
    .from('tirz_zones')
    .select('tirz_id')
  const tirzPages = (tirzZones || []).map(function (t) {
    return {
      url: baseUrl + '/tirz/' + t.tirz_id,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.4,
    }
  })

  // Story pages
  const { data: stories } = await supabase
    .from('success_stories')
    .select('story_id')
  const storyPages = (stories || []).map(function (s) {
    return {
      url: baseUrl + '/stories/' + s.story_id,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    }
  })

  // Focus area pages
  const { data: focusAreas } = await supabase
    .from('focus_areas')
    .select('focus_id')
  const focusAreaPages = (focusAreas || []).map(function (fa) {
    return {
      url: baseUrl + '/explore/focus/' + fa.focus_id,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    }
  })

  // Election pages
  const { data: elections } = await supabase
    .from('elections')
    .select('election_id')
  const electionPages = (elections || []).map(function (el) {
    return {
      url: baseUrl + '/elections/' + el.election_id,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }
  })

  return [
    ...staticPages, ...pathwayPages, ...contentPages, ...officialPages,
    ...helpPages, ...servicePages, ...policyPages, ...libraryCategoryPages,
    ...libraryDocPages, ...orgPages, ...eventPages, ...candidatePages,
    ...campaignPages, ...collectionPages, ...foundationPages, ...guidePages,
    ...learningPathPages, ...benefitPages, ...agencyPages, ...municipalServicePages,
    ...neighborhoodPages, ...superNeighborhoodPages, ...tirzPages, ...storyPages,
    ...focusAreaPages, ...electionPages,
  ]
}
