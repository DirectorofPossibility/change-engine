'use client'

import { ContentShelf, type ShelfItem } from './ContentShelf'
import { CENTER_COLORS } from '@/lib/constants'
import type { ContentPublished, TranslationMap } from '@/lib/types/exchange'

/* SVG icon paths for each center */
const CENTER_ICONS: Record<string, string> = {
  Learning: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
  Action: 'M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z',
  Resource: 'M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z',
  Accountability: 'M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z',
}

const CENTER_QUESTIONS: Record<string, string> = {
  Learning: 'How can I understand?',
  Action: 'How can I help?',
  Resource: "What's available to me?",
  Accountability: 'Who makes decisions?',
}

interface ShelfBraidProps {
  /** All content for this pathway, will be grouped by center */
  content: ContentPublished[]
  /** Translations keyed by inbox_id */
  contentTranslations?: TranslationMap
  /** Related services from focus area junctions */
  services?: Array<{ service_id: string; service_name: string; description_5th_grade?: string | null; service_category?: string | null }>
  /** Related officials from focus area junctions */
  officials?: Array<{ official_id: string; official_name: string; title?: string | null }>
  /** Related policies from focus area junctions */
  policies?: Array<{ policy_id: string; policy_name: string; title_6th_grade?: string | null; summary_6th_grade?: string | null; bill_number?: string | null; status?: string | null }>
  /** Related opportunities from focus area junctions */
  opportunities?: Array<{ opportunity_id: string; opportunity_name: string; description_5th_grade?: string | null; start_date?: string | null }>
  /** Theme color for fallback styling */
  themeColor: string
  /** Center slug base for "see all" links */
  centerBaseHref?: string
}

function contentToShelfItem(item: ContentPublished): ShelfItem {
  return {
    type: 'content',
    id: item.inbox_id || item.id,
    title: item.title_6th_grade,
    summary: item.summary_6th_grade,
    pathway: item.pathway_primary,
    center: item.center,
    sourceUrl: item.source_url,
    publishedAt: item.published_at,
    imageUrl: item.image_url,
    href: '/content/' + item.id,
  }
}

export function ShelfBraid({
  content,
  contentTranslations = {},
  services = [],
  officials = [],
  policies = [],
  opportunities = [],
  themeColor,
}: ShelfBraidProps) {
  // Group content by center
  const contentByCenter: Record<string, ContentPublished[]> = {
    Learning: [],
    Action: [],
    Resource: [],
    Accountability: [],
  }
  content.forEach((item) => {
    const c = item.center || 'Learning'
    if (contentByCenter[c]) contentByCenter[c].push(item)
  })

  // Build shelf items for each center, mixing in related entities
  const learningItems: ShelfItem[] = contentByCenter.Learning.map(contentToShelfItem)

  const actionItems: ShelfItem[] = [
    ...contentByCenter.Action.map(contentToShelfItem),
    ...opportunities.slice(0, 6).map((o) => ({
      type: 'opportunity' as const,
      id: o.opportunity_id,
      title: o.opportunity_name,
      summary: o.description_5th_grade,
      subtitle: o.start_date ? 'Starts ' + new Date(o.start_date).toLocaleDateString() : null,
      href: '/opportunities/' + o.opportunity_id,
      color: CENTER_COLORS.Action,
    })),
  ]

  const resourceItems: ShelfItem[] = [
    ...contentByCenter.Resource.map(contentToShelfItem),
    ...services.slice(0, 6).map((s) => ({
      type: 'service' as const,
      id: s.service_id,
      title: s.service_name,
      summary: s.description_5th_grade,
      subtitle: s.service_category,
      href: '/services/' + s.service_id,
      color: CENTER_COLORS.Resource,
    })),
  ]

  const accountabilityItems: ShelfItem[] = [
    ...contentByCenter.Accountability.map(contentToShelfItem),
    ...officials.slice(0, 4).map((o) => ({
      type: 'official' as const,
      id: o.official_id,
      title: o.official_name,
      subtitle: o.title,
      href: '/officials/' + o.official_id,
      color: CENTER_COLORS.Accountability,
    })),
    ...policies.slice(0, 4).map((p) => ({
      type: 'policy' as const,
      id: p.policy_id,
      title: p.title_6th_grade || p.policy_name,
      summary: p.summary_6th_grade,
      subtitle: p.bill_number ? p.bill_number + (p.status ? ' · ' + p.status : '') : null,
      href: '/policies/' + p.policy_id,
      color: CENTER_COLORS.Accountability,
    })),
  ]

  const shelves = [
    { key: 'Learning', items: learningItems },
    { key: 'Action', items: actionItems },
    { key: 'Resource', items: resourceItems },
    { key: 'Accountability', items: accountabilityItems },
  ]

  return (
    <div className="space-y-2">
      {shelves.map(({ key, items }) => (
        <ContentShelf
          key={key}
          title={key}
          question={CENTER_QUESTIONS[key]}
          iconPath={CENTER_ICONS[key]}
          color={CENTER_COLORS[key] || themeColor}
          items={items}
          translations={contentTranslations}
          hideIfEmpty
        />
      ))}
    </div>
  )
}
