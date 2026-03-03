import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getGuideBySlug, getFocusAreasByIds } from '@/lib/data/exchange'
import { ThemePill } from '@/components/ui/ThemePill'
import { FocusAreaPills } from '@/components/exchange/FocusAreaPills'
import { ExternalLink } from 'lucide-react'

/** Strip dangerous HTML tags and attributes to prevent XSS. */
function sanitizeHtml(html: string): string {
  return html
    // Remove script tags and their content
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    // Remove event handler attributes (onclick, onerror, onload, etc.)
    .replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/\s+on\w+\s*=\s*\S+/gi, '')
    // Remove javascript: protocol in href/src
    .replace(/(?:href|src)\s*=\s*["']?\s*javascript:/gi, 'data-blocked=')
    // Remove iframe, object, embed tags
    .replace(/<(iframe|object|embed|form)[\s\S]*?<\/\1>/gi, '')
    .replace(/<(iframe|object|embed|form)[^>]*\/?>/gi, '')
}

export const revalidate = 3600

interface GuideSection {
  id: string
  title: string
  content: string
  icon?: string
}

const LEVEL_COLORS: Record<string, string> = {
  'On the Couch': 'bg-green-100 text-green-800',
  'Off the Couch': 'bg-blue-100 text-blue-800',
  'Use Your Superpower': 'bg-purple-100 text-purple-800',
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const guide = await getGuideBySlug(slug)
  if (!guide) return { title: 'Not Found' }
  return {
    title: guide.title + ' — The Change Engine',
    description: guide.description || 'A guide on The Change Engine.',
  }
}

export default async function GuideDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const guide = await getGuideBySlug(slug)

  if (!guide) notFound()

  const sections: GuideSection[] = Array.isArray(guide.sections) ? (guide.sections as unknown as GuideSection[]) : []
  const focusAreaIds = guide.focus_area_ids ?? []
  const focusAreas = focusAreaIds.length > 0 ? await getFocusAreasByIds(focusAreaIds) : []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumb */}
      <div className="text-sm text-brand-muted mb-6">
        <Link href="/guides" className="hover:text-brand-accent">Guides</Link>
        <span className="mx-2">/</span>
        <span>{guide.title}</span>
      </div>

      {/* Hero */}
      {guide.hero_image_url && (
        <div className="relative w-full h-56 sm:h-72 md:h-80 rounded-xl overflow-hidden mb-8">
          <Image
            src={guide.hero_image_url}
            alt={guide.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <h1 className="absolute bottom-4 left-4 right-4 text-2xl sm:text-3xl font-bold text-white">
            {guide.title}
          </h1>
        </div>
      )}

      {!guide.hero_image_url && (
        <h1 className="text-3xl font-bold text-brand-text mb-4">{guide.title}</h1>
      )}

      {/* Metadata row */}
      <div className="flex items-center gap-3 flex-wrap mb-6">
        {guide.theme_id && <ThemePill themeId={guide.theme_id} size="sm" />}
        {guide.engagement_level && (
          <span className={'text-xs px-2 py-0.5 rounded-full font-medium ' + (LEVEL_COLORS[guide.engagement_level] || 'bg-gray-100 text-gray-700')}>
            {guide.engagement_level}
          </span>
        )}
        {guide.source_url && (
          <a
            href={guide.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-brand-accent hover:underline flex items-center gap-1"
          >
            <ExternalLink size={12} />
            Original source
          </a>
        )}
      </div>

      {guide.description && (
        <p className="text-brand-muted mb-8 max-w-3xl">{guide.description}</p>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Sections */}
          {sections.length > 0 && (
            <div className="space-y-8">
              {sections.map(function (section) {
                return (
                  <section key={section.id} className="bg-white rounded-xl border border-brand-border p-6">
                    <h2 className="text-xl font-bold text-brand-text mb-3">
                      {section.icon && <span className="mr-2">{section.icon}</span>}
                      {section.title}
                    </h2>
                    <div
                      className="prose prose-sm max-w-none text-brand-text"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(section.content) }}
                    />
                  </section>
                )
              })}
            </div>
          )}

          {/* content_html */}
          {guide.content_html && (
            <div
              className="prose prose-sm max-w-none text-brand-text mt-8 bg-white rounded-xl border border-brand-border p-6"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(guide.content_html) }}
            />
          )}
        </div>

        {/* Sidebar */}
        {(focusAreas.length > 0 || guide.source_url) && (
          <aside className="lg:w-72 shrink-0 space-y-6">
            {focusAreas.length > 0 && (
              <div className="bg-white rounded-xl border border-brand-border p-4">
                <h3 className="text-sm font-semibold text-brand-text mb-3">Related Focus Areas</h3>
                <FocusAreaPills focusAreas={focusAreas} />
              </div>
            )}
            {guide.source_url && (
              <div className="bg-white rounded-xl border border-brand-border p-4">
                <h3 className="text-sm font-semibold text-brand-text mb-2">Source</h3>
                <a
                  href={guide.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-brand-accent hover:underline flex items-center gap-1"
                >
                  <ExternalLink size={14} />
                  View on The Change Lab
                </a>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  )
}
