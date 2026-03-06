import type { Metadata } from 'next'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { getLearningPaths, getLangId, fetchTranslationsForTable } from '@/lib/data/exchange'
import { LearningPathCard } from '@/components/exchange/LearningPathCard'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { getUIStrings } from '@/lib/i18n'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Learning Paths — Community Exchange',
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

  const DIFF_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    Beginner: { bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-200' },
    Intermediate: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
    Advanced: { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200' },
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Breadcrumb items={[{ label: t('learn.title') }]} />
      <h1 className="text-3xl font-bold text-brand-text font-serif mb-2">{t('learn.title')}</h1>
      <p className="text-brand-muted mb-8 max-w-2xl">
        {t('learn.subtitle')}
      </p>

      {/* Stats */}
      <div className="flex items-center gap-6 mb-8 text-sm text-brand-muted">
        <span><strong className="text-brand-text">{paths.length}</strong> {t('learn.paths')}</span>
        <span><strong className="text-brand-text">{paths.reduce((s, p) => s + (p.module_count || 0), 0)}</strong> {t('learn.modules')}</span>
        <span><strong className="text-brand-text">{paths.reduce((s, p) => s + (p.estimated_minutes || 0), 0)}</strong> {t('learn.min_content')}</span>
      </div>

      {/* Grouped by difficulty */}
      {(['Beginner', 'Intermediate', 'Advanced'] as const).map(level => {
        const group = grouped[level]
        if (group.length === 0) return null
        const colors = DIFF_COLORS[level]
        return (
          <section key={level} className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${colors.bg} ${colors.text} ${colors.border} border`}>
                {level}
              </span>
              <span className="text-sm text-brand-muted">{group.length} path{group.length !== 1 ? 's' : ''}</span>
              <div className="flex-1 h-px bg-brand-border" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.map((path) => (
                <Link key={path.path_id} href={'/learn/' + path.path_id}>
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
        <p className="text-center text-brand-muted py-12">{t('learn.coming_soon')}</p>
      )}
    </div>
  )
}
