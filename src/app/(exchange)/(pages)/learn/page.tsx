import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { cookies } from 'next/headers'
import { getLearningPaths, getLangId, fetchTranslationsForTable } from '@/lib/data/exchange'
import { LearningPathCard } from '@/components/exchange/LearningPathCard'
import { getUIStrings } from '@/lib/i18n'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Learning Paths — Change Engine',
  description: 'Free self-guided courses on civic engagement, housing, health, finance, community organizing, and more.',
}

const PARCHMENT = '#F5F0E8'
const PARCHMENT_WARM = '#EDE7D8'
const INK = '#1A1A1A'
const CLAY = '#C4663A'
const MUTED = '#7a7265'
const RULE_COLOR = 'rgba(196,102,58,0.3)'
const SERIF = 'Georgia, "Times New Roman", serif'
const MONO = '"Courier New", Courier, monospace'

const DIFF_ORDER: Record<string, number> = { 'Beginner': 0, 'Intermediate': 1, 'Advanced': 2 }

export default async function LearnPage() {
  const paths = await getLearningPaths()
  const langId = await getLangId()
  const translations = langId
    ? await fetchTranslationsForTable('learning_paths', paths.map(p => p.path_id), langId)
    : {}

  const cookieStore = await cookies()
  const lang = cookieStore.get('lang')?.value || 'en'
  const t = getUIStrings(lang)

  // Group by difficulty
  const grouped = {
    Beginner: paths.filter(p => p.difficulty_level === 'Beginner'),
    Intermediate: paths.filter(p => p.difficulty_level === 'Intermediate'),
    Advanced: paths.filter(p => p.difficulty_level === 'Advanced'),
  }

  const totalModules = paths.reduce((s, p) => s + (p.module_count || 0), 0)
  const totalMinutes = paths.reduce((s, p) => s + (p.estimated_minutes || 0), 0)

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
            {t('learn.title')}
          </h1>
          <p style={{ fontFamily: SERIF, color: MUTED }} className="text-lg leading-relaxed max-w-2xl">
            {t('learn.subtitle')}
          </p>
        </div>
      </section>

      {/* ── BREADCRUMB ── */}
      <div className="max-w-[900px] mx-auto px-6 pt-4 pb-2">
        <nav style={{ fontFamily: MONO, color: MUTED }} className="text-xs tracking-wide">
          <Link href="/" className="hover:underline" style={{ color: CLAY }}>Home</Link>
          <span className="mx-2">/</span>
          <span>{t('learn.title')}</span>
        </nav>
      </div>

      {/* ── STATS ── */}
      <div className="max-w-[900px] mx-auto px-6 py-4">
        <div className="flex items-center gap-6" style={{ borderBottom: '1px dotted ' + RULE_COLOR, paddingBottom: '1rem' }}>
          <span style={{ fontFamily: MONO, color: MUTED }} className="text-xs">
            <strong style={{ color: INK, fontFamily: SERIF, fontSize: '1.25rem' }}>{paths.length}</strong> {t('learn.paths')}
          </span>
          <span style={{ fontFamily: MONO, color: MUTED }} className="text-xs">
            <strong style={{ color: INK, fontFamily: SERIF, fontSize: '1.25rem' }}>{totalModules}</strong> {t('learn.modules')}
          </span>
          <span style={{ fontFamily: MONO, color: MUTED }} className="text-xs">
            <strong style={{ color: INK, fontFamily: SERIF, fontSize: '1.25rem' }}>{totalMinutes}</strong> {t('learn.min_content')}
          </span>
        </div>
      </div>

      {/* ── GROUPED BY DIFFICULTY ── */}
      <div className="max-w-[900px] mx-auto px-6 py-6">
        {(['Beginner', 'Intermediate', 'Advanced'] as const).map(function (level) {
          const group = grouped[level]
          if (group.length === 0) return null
          return (
            <section key={level} className="mb-10">
              <div className="flex items-baseline justify-between mb-4" style={{ borderBottom: '1px dotted ' + RULE_COLOR, paddingBottom: '0.75rem' }}>
                <h2 style={{ fontFamily: SERIF, color: INK, fontSize: '1.5rem' }}>{level}</h2>
                <span style={{ fontFamily: MONO, color: MUTED }} className="text-xs">
                  {group.length} path{group.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.map((path) => (
                  <Link key={path.path_id} href={'/learn/' + ((path as any).slug || path.path_id)}>
                    <LearningPathCard
                      name={path.path_name}
                      description={path.description_5th_grade}
                      themeId={path.theme_id}
                      difficulty={path.difficulty_level}
                      moduleCount={path.module_count}
                      estimatedMinutes={path.estimated_minutes}
                      translatedName={translations[path.path_id]?.title}
                      translatedDescription={translations[path.path_id]?.summary}
                    />
                  </Link>
                ))}
              </div>
            </section>
          )
        })}

        {paths.length === 0 && (
          <p className="text-center py-12" style={{ fontFamily: SERIF, color: MUTED }}>{t('learn.coming_soon')}</p>
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
