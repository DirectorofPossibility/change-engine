import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { cookies } from 'next/headers'
import { getGuides, getLangId, fetchTranslationsForTable } from '@/lib/data/exchange'
import { ThemePill } from '@/components/ui/ThemePill'
import { getUIStrings } from '@/lib/i18n'
import { ENGAGEMENT_LEVEL_COLORS } from '@/lib/constants'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Guides — Change Engine',
  description: 'Civic engagement guides for Houston — contacting officials, voting, community organizing, and local resources.',
}

const PARCHMENT = '#F5F0E8'
const PARCHMENT_WARM = '#EDE7D8'
const INK = '#1A1A1A'
const CLAY = '#C4663A'
const MUTED = '#7a7265'
const RULE_COLOR = 'rgba(196,102,58,0.3)'
const SERIF = 'Georgia, "Times New Roman", serif'
const MONO = '"Courier New", Courier, monospace'

export default async function GuidesPage() {
  const guides = await getGuides()
  const langId = await getLangId()
  const translations = langId
    ? await fetchTranslationsForTable('guides', guides.map(g => g.guide_id), langId)
    : {}

  const cookieStore = await cookies()
  const lang = cookieStore.get('lang')?.value || 'en'
  const t = getUIStrings(lang)

  const visible = guides.slice(0, 4)
  const rest = guides.slice(4)

  return (
    <div style={{ background: PARCHMENT }} className="min-h-screen">
      {/* ── HERO ── */}
      <section className="relative overflow-hidden py-16 sm:py-20" style={{ background: PARCHMENT_WARM }}>
        <Image
          src="/images/fol/seed-of-life.svg"
          alt=""
          width={500}
          height={500}
          className="opacity-[0.04] absolute top-1/2 right-8 -translate-y-1/2 pointer-events-none"
        />
        <div className="relative z-10 max-w-[900px] mx-auto px-6">
          <p style={{ fontFamily: MONO, color: MUTED }} className="text-xs tracking-[0.15em] uppercase mb-4">
            Change Engine
          </p>
          <h1 style={{ fontFamily: SERIF, color: INK }} className="text-4xl sm:text-5xl leading-[1.15] mb-4">
            {t('guides.title')}
          </h1>
          <p style={{ fontFamily: SERIF, color: MUTED }} className="text-lg leading-relaxed max-w-2xl">
            {t('guides.subtitle')}
          </p>
        </div>
      </section>

      {/* ── BREADCRUMB ── */}
      <div className="max-w-[900px] mx-auto px-6 pt-4 pb-2">
        <nav style={{ fontFamily: MONO, color: MUTED }} className="text-xs tracking-wide">
          <Link href="/" className="hover:underline" style={{ color: CLAY }}>Home</Link>
          <span className="mx-2">/</span>
          <span>Guides</span>
        </nav>
      </div>

      {/* ── SECTION HEADER ── */}
      <div className="max-w-[900px] mx-auto px-6 pt-6">
        <div className="flex items-baseline justify-between" style={{ borderBottom: '1px dotted ' + RULE_COLOR, paddingBottom: '0.75rem' }}>
          <h2 style={{ fontFamily: SERIF, color: INK, fontSize: '1.5rem' }}>All Guides</h2>
          <span style={{ fontFamily: MONO, color: MUTED }} className="text-xs">{guides.length} guides</span>
        </div>
      </div>

      {/* ── GUIDES LIST ── */}
      <div className="max-w-[900px] mx-auto px-6 py-6">
        {guides.length === 0 && (
          <p className="text-center py-12" style={{ fontFamily: SERIF, color: MUTED }}>{t('guides.coming_soon')}</p>
        )}

        <div className="space-y-4">
          {visible.map(function (guide) {
            const title = translations[guide.guide_id]?.title || guide.title
            const description = translations[guide.guide_id]?.summary || guide.description
            return (
              <Link
                key={guide.guide_id}
                href={'/guides/' + guide.slug}
                className="block border border-transparent hover:border-current transition-colors"
                style={{ borderColor: RULE_COLOR }}
              >
                <div className="flex gap-4">
                  {guide.hero_image_url && (
                    <div className="relative w-40 h-28 flex-shrink-0 overflow-hidden">
                      <Image
                        src={guide.hero_image_url}
                        alt={title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="py-3 pr-4 flex-1 min-w-0">
                    <h3 style={{ fontFamily: SERIF, color: INK }} className="text-lg leading-snug mb-1">{title}</h3>
                    {description && (
                      <p style={{ fontFamily: SERIF, color: MUTED }} className="text-sm line-clamp-2 mb-2">{description}</p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      {guide.theme_id && <ThemePill themeId={guide.theme_id} size="sm" linkable={false} />}
                      {guide.engagement_level && (
                        <span className={'text-xs px-2 py-0.5 font-medium ' + (ENGAGEMENT_LEVEL_COLORS[guide.engagement_level] || 'bg-gray-100 text-gray-700')} style={{ fontFamily: MONO }}>
                          {guide.engagement_level}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {rest.length > 0 && (
          <details className="mt-6">
            <summary style={{ fontFamily: MONO, color: CLAY, cursor: 'pointer' }} className="text-sm hover:underline">
              Show {rest.length} more guide{rest.length !== 1 ? 's' : ''}
            </summary>
            <div className="space-y-4 mt-4">
              {rest.map(function (guide) {
                const title = translations[guide.guide_id]?.title || guide.title
                const description = translations[guide.guide_id]?.summary || guide.description
                return (
                  <Link
                    key={guide.guide_id}
                    href={'/guides/' + guide.slug}
                    className="block border border-transparent hover:border-current transition-colors"
                    style={{ borderColor: RULE_COLOR }}
                  >
                    <div className="flex gap-4">
                      {guide.hero_image_url && (
                        <div className="relative w-40 h-28 flex-shrink-0 overflow-hidden">
                          <Image
                            src={guide.hero_image_url}
                            alt={title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="py-3 pr-4 flex-1 min-w-0">
                        <h3 style={{ fontFamily: SERIF, color: INK }} className="text-lg leading-snug mb-1">{title}</h3>
                        {description && (
                          <p style={{ fontFamily: SERIF, color: MUTED }} className="text-sm line-clamp-2 mb-2">{description}</p>
                        )}
                        <div className="flex items-center gap-2 flex-wrap">
                          {guide.theme_id && <ThemePill themeId={guide.theme_id} size="sm" linkable={false} />}
                          {guide.engagement_level && (
                            <span className={'text-xs px-2 py-0.5 font-medium ' + (ENGAGEMENT_LEVEL_COLORS[guide.engagement_level] || 'bg-gray-100 text-gray-700')} style={{ fontFamily: MONO }}>
                              {guide.engagement_level}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </details>
        )}
      </div>

      {/* ── FOOTER LINK ── */}
      <div className="max-w-[900px] mx-auto px-6 pb-12">
        <div style={{ borderTop: '1px dotted ' + RULE_COLOR, paddingTop: '1.5rem' }}>
          <Link href="/" style={{ fontFamily: MONO, color: CLAY }} className="text-sm hover:underline">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
