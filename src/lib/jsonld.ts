/**
 * JSON-LD structured data builders for SEO rich snippets.
 * Each function returns a schema.org object ready for serialization.
 */

const SITE_URL = 'https://www.changeengine.us'

export function articleJsonLd(item: {
  id: string
  title_6th_grade: string | null
  summary_6th_grade: string | null
  published_at: string | null
  image_url: string | null
  source_org_name: string | null
  source_url: string | null
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: item.title_6th_grade,
    description: item.summary_6th_grade,
    url: `${SITE_URL}/content/${item.id}`,
    datePublished: item.published_at,
    image: item.image_url || undefined,
    author: item.source_org_name ? { '@type': 'Organization', name: item.source_org_name } : undefined,
    publisher: {
      '@type': 'Organization',
      name: 'Community Exchange',
      url: SITE_URL,
    },
  }
}

export function personJsonLd(official: {
  official_id: string
  official_name: string
  title: string | null
  party: string | null
  level: string | null
  email: string | null
  website: string | null
  photo_url: string | null
  bio_short: string | null
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: official.official_name,
    jobTitle: official.title,
    description: official.bio_short,
    url: `${SITE_URL}/officials/${official.official_id}`,
    image: official.photo_url || undefined,
    email: official.email || undefined,
    affiliation: official.party ? { '@type': 'Organization', name: official.party } : undefined,
    worksFor: {
      '@type': 'GovernmentOrganization',
      name: official.level ? `${official.level} Government` : 'Government',
    },
  }
}

export function serviceJsonLd(service: {
  service_id: string
  service_name: string
  description_5th_grade: string | null
  phone: string | null
  website: string | null
  address: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  hours: string | null
  languages: string | null
}, orgName?: string | null) {
  return {
    '@context': 'https://schema.org',
    '@type': 'GovernmentService',
    name: service.service_name,
    description: service.description_5th_grade,
    url: `${SITE_URL}/services/${service.service_id}`,
    telephone: service.phone || undefined,
    serviceUrl: service.website || undefined,
    availableLanguage: service.languages ? service.languages.split(',').map(function (l) { return l.trim() }) : undefined,
    provider: orgName ? { '@type': 'Organization', name: orgName } : undefined,
    areaServed: {
      '@type': 'City',
      name: 'Houston',
      addressRegion: 'TX',
    },
    address: service.address ? {
      '@type': 'PostalAddress',
      streetAddress: service.address,
      addressLocality: service.city,
      addressRegion: service.state,
      postalCode: service.zip_code,
    } : undefined,
  }
}

export function eventJsonLd(event: {
  event_id: string
  event_name: string
  description_5th_grade: string | null
  start_datetime: string | null
  end_datetime: string | null
  address: string | null
  city: string | null
  state: string | null
  is_virtual: string | null
  is_free: string | null
  cost: string | null
  registration_url: string | null
}, orgName?: string | null) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.event_name,
    description: event.description_5th_grade,
    url: `${SITE_URL}/events/${event.event_id}`,
    startDate: event.start_datetime,
    endDate: event.end_datetime || undefined,
    eventAttendanceMode: event.is_virtual === 'true'
      ? 'https://schema.org/OnlineEventAttendanceMode'
      : 'https://schema.org/OfflineEventAttendanceMode',
    location: event.is_virtual === 'true'
      ? { '@type': 'VirtualLocation', url: event.registration_url }
      : event.address ? {
          '@type': 'Place',
          address: {
            '@type': 'PostalAddress',
            streetAddress: event.address,
            addressLocality: event.city,
            addressRegion: event.state,
          },
        } : undefined,
    organizer: orgName ? { '@type': 'Organization', name: orgName } : undefined,
    offers: {
      '@type': 'Offer',
      price: event.is_free === 'true' ? '0' : (event.cost || '0'),
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: event.registration_url || undefined,
    },
  }
}

export function organizationJsonLd(org: {
  org_id: string
  org_name: string
  description_5th_grade: string | null
  mission_statement: string | null
  phone: string | null
  email: string | null
  website: string | null
  address: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  logo_url: string | null
  year_founded: string | null
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: org.org_name,
    description: org.description_5th_grade || org.mission_statement,
    url: org.website || `${SITE_URL}/organizations/${org.org_id}`,
    telephone: org.phone || undefined,
    email: org.email || undefined,
    logo: org.logo_url || undefined,
    foundingDate: org.year_founded || undefined,
    address: org.address ? {
      '@type': 'PostalAddress',
      streetAddress: org.address,
      addressLocality: org.city,
      addressRegion: org.state,
      postalCode: org.zip_code,
    } : undefined,
  }
}

export function faqJsonLd(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(function (f) {
      return {
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: f.answer,
        },
      }
    }),
  }
}

export function policyJsonLd(policy: {
  policy_id: string
  policy_name: string | null
  title_6th_grade: string | null
  summary_5th_grade: string | null
  bill_number: string | null
  status: string | null
  level: string | null
  source_url: string | null
  introduced_date: string | null
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Legislation',
    name: policy.title_6th_grade || policy.policy_name,
    description: policy.summary_5th_grade,
    url: `${SITE_URL}/policies/${policy.policy_id}`,
    legislationIdentifier: policy.bill_number || undefined,
    legislationDate: policy.introduced_date || undefined,
    legislationPassedBy: policy.level ? { '@type': 'GovernmentOrganization', name: `${policy.level} Government` } : undefined,
    sourceUrl: policy.source_url || undefined,
  }
}
