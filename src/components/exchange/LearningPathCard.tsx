import Link from 'next/link'
import { THEMES } from '@/lib/constants'
import { BookOpen, Clock, BarChart3 } from 'lucide-react'

const DIFFICULTY_DOTS: Record<string, string> = {
  Beginner: 'bg-green-500',
  Intermediate: 'bg-yellow-500',
  Advanced: 'bg-red-500',
}

const DIFFICULTY_TEXT: Record<string, string> = {
  Beginner: 'text-green-700',
  Intermediate: 'text-yellow-700',
  Advanced: 'text-red-700',
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
  onSelect?: () => void
}

export function LearningPathCard({ name, description, themeId, difficulty, moduleCount, estimatedMinutes, translatedName, translatedDescription, onSelect }: LearningPathCardProps) {
  const theme = themeId ? THEMES[themeId as keyof typeof THEMES] : null

  return (
    <div
      className="bg-white rounded-xl border-2 border-brand-border p-5 hover:shadow-md transition-shadow"
      {...(onSelect ? { role: 'button', tabIndex: 0, onClick: onSelect, onKeyDown: function (e: React.KeyboardEvent<HTMLDivElement>) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect() } }, style: { cursor: 'pointer' } } : {})}
    >
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
          <Link href={'/search?q=' + encodeURIComponent(difficulty)} className={`inline-flex items-center gap-1.5 text-xs font-medium hover:opacity-80 transition-opacity ${DIFFICULTY_TEXT[difficulty] || 'text-gray-700'}`} onClick={function (e) { e.stopPropagation() }}>
            <span className={`w-1.5 h-1.5 rounded-full ${DIFFICULTY_DOTS[difficulty] || 'bg-gray-400'}`} />
            <BarChart3 size={12} /> {difficulty}
          </Link>
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
