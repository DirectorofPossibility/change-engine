import { Clock, FileText, Video, BookOpen, HelpCircle, ExternalLink, Music, Quote } from 'lucide-react'
import { TranslatedTooltip } from '@/components/exchange/TranslatedTooltip'
import { TOOLTIPS } from '@/lib/tooltips'

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
  videoUrl?: string | null
  videoTitle?: string | null
  videoUrl2?: string | null
  videoTitle2?: string | null
  articleUrl?: string | null
  articleTitle?: string | null
  musicUrl?: string | null
  musicTitle?: string | null
  musicArtist?: string | null
  hookText?: string | null
  hookAttribution?: string | null
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

function youtubeEmbedId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/)
  return match ? match[1] : null
}

export function ModuleTimeline({ modules }: ModuleTimelineProps) {
  if (modules.length === 0) return null

  let mediaPillTooltipShown = false

  return (
    <div className="space-y-0">
      {modules.map(function (mod, index) {
        const embedId = mod.videoUrl ? youtubeEmbedId(mod.videoUrl) : null
        const hasMedia = mod.videoUrl || mod.articleUrl || mod.musicUrl
        const showMediaTooltip = hasMedia && !mediaPillTooltipShown && (mediaPillTooltipShown = true)

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
            <div className="bg-white border border-brand-border p-5">
              {/* Hook / Opening quote */}
              {mod.hookText && (
                <div className="mb-4 pl-4 border-l-3 border-brand-accent/40">
                  <p className="text-sm italic text-brand-text leading-relaxed flex gap-2">
                    <Quote size={14} className="shrink-0 mt-0.5 text-brand-accent/50" />
                    {mod.hookText}
                  </p>
                  {mod.hookAttribution && (
                    <p className="text-xs text-brand-muted mt-1 pl-5">— {mod.hookAttribution}</p>
                  )}
                </div>
              )}

              <h4 className="font-semibold text-brand-text text-lg font-display mb-1">{mod.name}</h4>
              {mod.description && <p className="text-sm text-brand-muted mb-3">{mod.description}</p>}

              {/* Video embed */}
              {embedId && (
                <div className="mb-4 overflow-hidden border border-brand-border">
                  <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                    <iframe
                      className="absolute inset-0 w-full h-full"
                      src={'https://www.youtube-nocookie.com/embed/' + embedId}
                      title={mod.videoTitle || mod.name}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                  {mod.videoTitle && (
                    <p className="text-xs text-brand-muted px-3 py-2 bg-brand-bg">{mod.videoTitle}</p>
                  )}
                </div>
              )}

              {/* Resource links row */}
              {hasMedia && (
                <div className="relative flex flex-wrap gap-2 mb-3">
                  {showMediaTooltip && <TranslatedTooltip tip={TOOLTIPS.module_media_pills} position="bottom" />}
                  {mod.videoUrl && !embedId && (
                    <a href={mod.videoUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors">
                      <Video size={12} /> {mod.videoTitle || 'Watch Video'}
                    </a>
                  )}
                  {mod.videoUrl2 && (
                    <a href={mod.videoUrl2} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors">
                      <Video size={12} /> {mod.videoTitle2 || 'Bonus Video'}
                    </a>
                  )}
                  {mod.articleUrl && (
                    <a href={mod.articleUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors">
                      <ExternalLink size={12} /> {mod.articleTitle || 'Read More'}
                    </a>
                  )}
                  {mod.musicUrl && (
                    <a href={mod.musicUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors">
                      <Music size={12} />
                      {mod.musicTitle
                        ? (mod.musicArtist ? mod.musicTitle + ' — ' + mod.musicArtist : mod.musicTitle)
                        : 'Listen'}
                    </a>
                  )}
                </div>
              )}

              {/* Meta info */}
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
