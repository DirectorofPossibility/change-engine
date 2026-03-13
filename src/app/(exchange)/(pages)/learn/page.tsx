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
    <div className="bg-paper min-h-screen">
      {/* ── HERO ── */}
      <section className="relative overflow-hidden py-16 sm:py-20 bg-paper">
        <Image
          src="/images/fol/seed-of-life.svg"
          alt=""
          width={500}
          height={500}
          className="opacity-[0.04] absolute top-1/2 right-8 -translate-y-1/2 pointer-events-none"
        />
        <div className="relative z-10 max-w-[900px] mx-auto px-6">
          <p style={{ color: "#5c6474" }} className="text-xs tracking-[0.15em] uppercase mb-4">
            Change Engine
          </p>
          <h1 style={{  }} className="text-4xl sm:text-5xl leading-[1.15] mb-4">
            {t('learn.title')}
          </h1>
          <p style={{ color: "#5c6474" }} className="text-lg leading-relaxed max-w-2xl">
            {t('learn.subtitle')}
          </p>
        </div>
      </section>

      {/* ── BREADCRUMB ── */}
      <div className="max-w-[900px] mx-auto px-6 pt-4 pb-2">
        <nav style={{ color: "#5c6474" }} className="text-xs tracking-wide">
          <Link href="/" className="hover:underline" style={{ color: "#1b5e8a" }}>Home</Link>
          <span className="mx-2">/</span>
          <span>{t('learn.title')}</span>
        </nav>
      </div>

      {/* ── STATS ── */}
      <div className="max-w-[900px] mx-auto px-6 py-4">
        <div className="flex items-center gap-6" style={{ borderBottom: '1px dotted ' + '#dde1e8', paddingBottom: '1rem' }}>
          <span style={{ color: "#5c6474" }} className="text-xs">
            <strong style={{ fontSize: '1.25rem' }}>{paths.length}</strong> {t('learn.paths')}
          </span>
          <span style={{ color: "#5c6474" }} className="text-xs">
            <strong style={{ fontSize: '1.25rem' }}>{totalModules}</strong> {t('learn.modules')}
          </span>
          <span style={{ color: "#5c6474" }} className="text-xs">
            <strong style={{ fontSize: '1.25rem' }}>{totalMinutes}</strong> {t('learn.min_content')}
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
              <div className="flex items-baseline justify-between mb-4" style={{ borderBottom: '1px dotted ' + '#dde1e8', paddingBottom: '0.75rem' }}>
                <h2 style={{ fontSize: '1.5rem' }}>{level}</h2>
                <span style={{ color: "#5c6474" }} className="text-xs">
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
          <p className="text-center py-12" style={{ color: "#5c6474" }}>{t('learn.coming_soon')}</p>
        )}
      </div>

      {/* ── FOOTER LINK ── */}
      <div className="max-w-[900px] mx-auto px-6 pb-12">
        <div style={{ borderTop: '1px dotted ' + '#dde1e8', paddingTop: '1.5rem' }}>
          <Link href="/" style={{ color: "#1b5e8a" }} className="text-sm hover:underline">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
