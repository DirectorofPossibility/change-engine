import { THEMES } from '@/lib/constants'
import { BookOpen, Clock, BarChart3 } from 'lucide-react'

const DIFFICULTY_COLORS: Record<string, string> = {
  Beginner: 'bg-green-100 text-green-700',
  Intermediate: 'bg-yellow-100 text-yellow-700',
  Advanced: 'bg-red-100 text-red-700',
}

interface LearningPathCardProps {
  name: string
  description: string | null
  themeId: string | null
  difficulty: string | null
  moduleCount: number | null
  estimatedMinutes: number | null
  translatedName?: string
  translatedDescription?: string
}

export function LearningPathCard({ name, description, themeId, difficulty, moduleCount, estimatedMinutes, translatedName, translatedDescription }: LearningPathCardProps) {
  const theme = themeId ? THEMES[themeId as keyof typeof THEMES] : null

  return (
    <div className="bg-white rounded-xl border border-brand-border p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 mb-3">
        {theme && (
          <span
            className="inline-block w-3 h-3 rounded-full"
            style={{ backgroundColor: theme.color }}
          />
        )}
        <h3 className="font-semibold text-brand-text">{translatedName || name}</h3>
      </div>
      {(translatedDescription || description) && (
        <p className="text-sm text-brand-muted mb-3 line-clamp-2">{translatedDescription || description}</p>
      )}
      <div className="flex items-center gap-3 flex-wrap">
        {difficulty && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-lg flex items-center gap-1 ${DIFFICULTY_COLORS[difficulty] || 'bg-gray-100 text-gray-700'}`}>
            <BarChart3 size={12} /> {difficulty}
          </span>
        )}
        {moduleCount != null && (
          <span className="text-xs text-brand-muted flex items-center gap-1">
            <BookOpen size={12} /> {moduleCount} modules
          </span>
        )}
        {estimatedMinutes != null && (
          <span className="text-xs text-brand-muted flex items-center gap-1">
            <Clock size={12} /> {estimatedMinutes} min
          </span>
        )}
      </div>
    </div>
  )
}
