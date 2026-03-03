import { Clock, FileText, Video, BookOpen, HelpCircle } from 'lucide-react'

interface Module {
  moduleId: string
  name: string
  description: string | null
  estimatedMinutes: number | null
  contentType: string | null
  learningObjectives: string | null
  hasQuiz: string | null
  quizName?: string | null
  questionCount?: number | null
  passingScore?: number | null
}

interface ModuleTimelineProps {
  modules: Module[]
}

function contentIcon(type: string | null) {
  if (!type) return <BookOpen size={14} />
  const t = type.toLowerCase()
  if (t.indexOf('video') !== -1) return <Video size={14} />
  if (t.indexOf('article') !== -1 || t.indexOf('text') !== -1) return <FileText size={14} />
  return <BookOpen size={14} />
}

export function ModuleTimeline({ modules }: ModuleTimelineProps) {
  if (modules.length === 0) return null

  return (
    <div className="space-y-0">
      {modules.map(function (mod, index) {
        return (
          <div key={mod.moduleId} className="relative pl-10 pb-8 last:pb-0">
            {/* Timeline line */}
            {index < modules.length - 1 && (
              <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-brand-border" />
            )}
            {/* Step number */}
            <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-brand-accent text-white text-sm font-bold flex items-center justify-center">
              {index + 1}
            </div>
            {/* Module content */}
            <div className="bg-white rounded-xl border border-brand-border p-4">
              <h4 className="font-semibold text-brand-text mb-1">{mod.name}</h4>
              {mod.description && <p className="text-sm text-brand-muted mb-2">{mod.description}</p>}
              <div className="flex flex-wrap items-center gap-3 text-xs text-brand-muted">
                {mod.estimatedMinutes != null && (
                  <span className="flex items-center gap-1"><Clock size={12} /> {mod.estimatedMinutes} min</span>
                )}
                {mod.contentType && (
                  <span className="flex items-center gap-1">{contentIcon(mod.contentType)} {mod.contentType}</span>
                )}
                {mod.hasQuiz === 'Yes' && (
                  <span className="flex items-center gap-1 text-brand-accent">
                    <HelpCircle size={12} />
                    Quiz{mod.quizName ? ': ' + mod.quizName : ''}
                    {mod.questionCount ? ' (' + mod.questionCount + ' questions)' : ''}
                    {mod.passingScore ? ' — Pass: ' + mod.passingScore + '%' : ''}
                  </span>
                )}
              </div>
              {mod.learningObjectives && (
                <p className="text-xs text-brand-muted mt-2">Objectives: {mod.learningObjectives}</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
