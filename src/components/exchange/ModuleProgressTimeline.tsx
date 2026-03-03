'use client'

import { useState } from 'react'
import { Clock, FileText, Video, BookOpen, HelpCircle, CheckCircle2, Play } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

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

interface ProgressRecord {
  progress_id: string
  module_id: string | null
  status: string | null
  started_at: string | null
  completed_at: string | null
}

interface ModuleProgressTimelineProps {
  modules: Module[]
  pathId: string
  userId: string
  initialProgress: ProgressRecord[]
  badgeId: string | null
  badgeName: string | null
}

function contentIcon(type: string | null) {
  if (!type) return <BookOpen size={14} />
  const t = type.toLowerCase()
  if (t.indexOf('video') !== -1) return <Video size={14} />
  if (t.indexOf('article') !== -1 || t.indexOf('text') !== -1) return <FileText size={14} />
  return <BookOpen size={14} />
}

export function ModuleProgressTimeline({ modules, pathId, userId, initialProgress, badgeId, badgeName }: ModuleProgressTimelineProps) {
  const [progress, setProgress] = useState<Record<string, string>>(function () {
    const map: Record<string, string> = {}
    initialProgress.forEach(function (p) {
      if (p.module_id) map[p.module_id] = p.status || 'not_started'
    })
    return map
  })
  const [updating, setUpdating] = useState<string | null>(null)
  const [pathCompleted, setPathCompleted] = useState(false)

  async function handleStartModule(moduleId: string) {
    setUpdating(moduleId)
    const supabase = createClient()
    const now = new Date().toISOString()
    const progressId = 'PROG-' + userId.substring(0, 8) + '-' + moduleId.substring(0, 8)

    const { error } = await supabase.from('user_progress').upsert({
      progress_id: progressId,
      user_id: userId,
      path_id: pathId,
      module_id: moduleId,
      status: 'in_progress',
      started_at: now,
      last_updated: now,
      is_active: 'Yes',
    }, { onConflict: 'progress_id' })

    if (!error) {
      setProgress(function (prev) {
        const next = Object.assign({}, prev)
        next[moduleId] = 'in_progress'
        return next
      })
    }
    setUpdating(null)
  }

  async function handleCompleteModule(moduleId: string) {
    setUpdating(moduleId)
    const supabase = createClient()
    const now = new Date().toISOString()
    const progressId = 'PROG-' + userId.substring(0, 8) + '-' + moduleId.substring(0, 8)

    const { error } = await supabase.from('user_progress').upsert({
      progress_id: progressId,
      user_id: userId,
      path_id: pathId,
      module_id: moduleId,
      status: 'completed',
      completed_at: now,
      last_updated: now,
      is_active: 'Yes',
    }, { onConflict: 'progress_id' })

    if (!error) {
      const newProgress = Object.assign({}, progress)
      newProgress[moduleId] = 'completed'
      setProgress(newProgress)

      // Check if all modules now completed
      const allComplete = modules.every(function (m) {
        return newProgress[m.moduleId] === 'completed'
      })

      if (allComplete && badgeId) {
        await awardBadge(supabase, now)
        setPathCompleted(true)
      }
    }
    setUpdating(null)
  }

  async function awardBadge(supabase: any, now: string) {
    const userBadgeId = 'UB-' + userId.substring(0, 8) + '-' + (badgeId || '').substring(0, 8)
    await supabase.from('user_badges').upsert({
      user_badge_id: userBadgeId,
      user_id: userId,
      badge_id: badgeId,
      earned_date: now,
      earned_via: pathId,
      is_displayed: 'Yes',
      last_updated: now,
    }, { onConflict: 'user_badge_id' })
  }

  const completedCount = modules.filter(function (m) { return progress[m.moduleId] === 'completed' }).length

  return (
    <div>
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-brand-muted">{completedCount} of {modules.length} modules completed</span>
          {completedCount === modules.length && (
            <span className="text-green-600 font-medium flex items-center gap-1">
              <CheckCircle2 size={16} /> Path Complete!
            </span>
          )}
        </div>
        <div className="w-full bg-brand-bg rounded-full h-2.5">
          <div
            className="bg-brand-accent rounded-full h-2.5 transition-all duration-500"
            style={{ width: (modules.length > 0 ? Math.round((completedCount / modules.length) * 100) : 0) + '%' }}
          />
        </div>
      </div>

      {/* Badge award notification */}
      {pathCompleted && badgeName && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-center">
          <p className="text-green-700 font-semibold">You earned the &ldquo;{badgeName}&rdquo; badge!</p>
          <p className="text-green-600 text-sm mt-1">Check your dashboard to see all your badges.</p>
        </div>
      )}

      {/* Module timeline */}
      <div className="space-y-0">
        {modules.map(function (mod, index) {
          const status = progress[mod.moduleId] || 'not_started'
          const isUpdating = updating === mod.moduleId

          return (
            <div key={mod.moduleId} className="relative pl-10 pb-8 last:pb-0">
              {index < modules.length - 1 && (
                <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-brand-border" />
              )}
              {/* Step indicator */}
              <div className={
                'absolute left-0 top-0 w-8 h-8 rounded-full text-sm font-bold flex items-center justify-center ' +
                (status === 'completed'
                  ? 'bg-green-500 text-white'
                  : status === 'in_progress'
                    ? 'bg-brand-accent text-white'
                    : 'bg-brand-bg text-brand-muted border border-brand-border')
              }>
                {status === 'completed' ? <CheckCircle2 size={18} /> : index + 1}
              </div>
              {/* Module content */}
              <div className={'bg-white rounded-xl border p-4 ' + (status === 'completed' ? 'border-green-200' : 'border-brand-border')}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
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
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Action button */}
                  <div className="shrink-0">
                    {status === 'not_started' && (
                      <button
                        onClick={function () { handleStartModule(mod.moduleId) }}
                        disabled={isUpdating}
                        className="px-3 py-1.5 bg-brand-accent text-white rounded-lg text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1"
                      >
                        <Play size={12} />
                        {isUpdating ? 'Starting...' : 'Start'}
                      </button>
                    )}
                    {status === 'in_progress' && (
                      <button
                        onClick={function () { handleCompleteModule(mod.moduleId) }}
                        disabled={isUpdating}
                        className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1"
                      >
                        <CheckCircle2 size={12} />
                        {isUpdating ? 'Saving...' : 'Complete'}
                      </button>
                    )}
                    {status === 'completed' && (
                      <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                        <CheckCircle2 size={14} /> Done
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
