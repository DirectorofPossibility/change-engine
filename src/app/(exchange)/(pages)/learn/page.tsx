import type { Metadata } from 'next'
import { getLearningPaths, getLangId, fetchTranslationsForTable } from '@/lib/data/exchange'
import { LearningPathCard } from '@/components/exchange/LearningPathCard'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Start Learning',
  description: 'Free courses on civic engagement, housing, health, finance, and community building.',
}

export default async function LearnPage() {
  const paths = await getLearningPaths()
  const langId = await getLangId()
  const translations = langId
    ? await fetchTranslationsForTable('learning_paths', paths.map(p => p.path_id), langId)
    : {}

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-brand-text mb-2">Learning Paths</h1>
      <p className="text-brand-muted mb-8">
        Self-guided learning journeys to deepen your understanding of community issues.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {paths.map((path) => (
          <LearningPathCard
            key={path.path_id}
            name={path.path_name}
            description={path.description_5th_grade}
            themeId={path.theme_id}
            difficulty={path.difficulty_level}
            moduleCount={path.module_count}
            estimatedMinutes={path.estimated_minutes}
            translatedName={translations[path.path_id]?.title}
            translatedDescription={translations[path.path_id]?.summary}
          />
        ))}
      </div>

      {paths.length === 0 && (
        <p className="text-center text-brand-muted py-12">Learning paths coming soon.</p>
      )}
    </div>
  )
}
