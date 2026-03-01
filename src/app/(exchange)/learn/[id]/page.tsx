import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Clock, BookOpen } from 'lucide-react'
import { ThemePill } from '@/components/ui/ThemePill'
import { ModuleTimeline } from '@/components/exchange/ModuleTimeline'
import { ModuleProgressTimeline } from '@/components/exchange/ModuleProgressTimeline'
import { BadgeCard } from '@/components/exchange/BadgeCard'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  var { id } = await params
  var supabase = await createClient()
  var { data } = await supabase.from('learning_paths').select('path_name, description_5th_grade').eq('path_id', id).single()
  if (!data) return { title: 'Not Found' }
  return {
    title: data.path_name,
    description: data.description_5th_grade || 'Details on The Change Engine.',
  }
}

export default async function LearningPathDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: path } = await supabase
    .from('learning_paths')
    .select('*')
    .eq('path_id', id)
    .single()

  if (!path) notFound()

  const [modulesRes, badgeRes] = await Promise.all([
    supabase.from('learning_modules').select('*').eq('path_id', id).order('module_order', { ascending: true }),
    supabase.from('badges').select('*').eq('path_id', id).limit(1),
  ])

  var modules = modulesRes.data || []
  var badge = badgeRes.data && badgeRes.data.length > 0 ? badgeRes.data[0] : null

  // Get quizzes for modules
  var moduleIds = modules.map(function (m) { return m.module_id })
  var quizMap: Record<string, { quiz_name: string; question_count: number | null; passing_score: number | null }> = {}
  if (moduleIds.length > 0) {
    const { data: quizzes } = await supabase
      .from('quizzes')
      .select('*')
      .in('module_id', moduleIds)
    if (quizzes) {
      quizzes.forEach(function (q) {
        if (q.module_id) {
          quizMap[q.module_id] = { quiz_name: q.quiz_name, question_count: q.question_count, passing_score: q.passing_score }
        }
      })
    }
  }

  // Check for prerequisite
  var prerequisitePath: { path_id: string; path_name: string } | null = null
  if (path.prerequisite_path_id) {
    const { data: prereq } = await supabase
      .from('learning_paths')
      .select('path_id, path_name')
      .eq('path_id', path.prerequisite_path_id)
      .single()
    prerequisitePath = prereq
  }

  // Check if user is logged in and fetch their progress
  var { data: { user } } = await supabase.auth.getUser()
  var userProgress: any[] = []
  if (user) {
    var { data: progressData } = await supabase
      .from('user_progress')
      .select('progress_id, module_id, status, started_at, completed_at')
      .eq('user_id', user.id)
      .eq('path_id', id)
    userProgress = progressData || []
  }

  // Build module data for timeline
  var timelineModules = modules.map(function (m) {
    var quiz = m.module_id ? quizMap[m.module_id] : undefined
    return {
      moduleId: m.module_id,
      name: m.module_name,
      description: m.description_5th_grade,
      estimatedMinutes: m.estimated_minutes,
      contentType: m.content_type,
      learningObjectives: m.learning_objectives,
      hasQuiz: m.has_quiz,
      quizName: quiz?.quiz_name || null,
      questionCount: quiz?.question_count || null,
      passingScore: quiz?.passing_score || null,
    }
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumb */}
      <div className="text-sm text-brand-muted mb-6">
        <Link href="/learn" className="hover:text-brand-accent">Learning Paths</Link>
        <span className="mx-2">/</span>
        <span>{path.path_name}</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <ThemePill themeId={path.theme_id} size="sm" />
        <h1 className="text-3xl font-bold text-brand-text mt-3 mb-2">{path.path_name}</h1>
        {path.description_5th_grade && <p className="text-brand-muted mb-4 max-w-2xl">{path.description_5th_grade}</p>}

        <div className="flex items-center gap-4 text-sm text-brand-muted">
          {path.estimated_minutes != null && (
            <span className="flex items-center gap-1"><Clock size={14} /> {path.estimated_minutes} min</span>
          )}
          {path.module_count != null && (
            <span className="flex items-center gap-1"><BookOpen size={14} /> {path.module_count} modules</span>
          )}
          {path.difficulty_level && (
            <span className="px-2 py-0.5 rounded-full bg-brand-bg text-xs">{path.difficulty_level}</span>
          )}
        </div>

        {badge && (
          <p className="text-sm text-brand-accent mt-3 font-medium">Complete this path to earn: {badge.badge_name}</p>
        )}
      </div>

      {/* Prerequisite */}
      {prerequisitePath && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-8">
          <p className="text-sm text-yellow-700">
            Before starting this path, complete:{' '}
            <Link href={'/learn/' + prerequisitePath.path_id} className="font-semibold underline">{prerequisitePath.path_name}</Link>
          </p>
        </div>
      )}

      {/* Sign-up CTA for non-logged-in users */}
      {!user && timelineModules.length > 0 && (
        <div className="bg-brand-bg/60 border border-brand-border rounded-xl p-4 mb-8">
          <p className="text-sm text-brand-text">
            <Link href={'/signup'} className="text-brand-accent font-semibold hover:underline">Create a free account</Link>
            {' '}to track your progress and earn badges as you learn.
          </p>
        </div>
      )}

      {/* Module Timeline */}
      {timelineModules.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold text-brand-text mb-6">Modules</h2>
          {user ? (
            <ModuleProgressTimeline
              modules={timelineModules}
              pathId={id}
              userId={user.id}
              initialProgress={userProgress}
              badgeId={badge?.badge_id || null}
              badgeName={badge?.badge_name || null}
            />
          ) : (
            <ModuleTimeline modules={timelineModules} />
          )}
        </section>
      )}

      {/* Badge */}
      {badge && (
        <section className="mb-10">
          <h2 className="text-xl font-bold text-brand-text mb-4">Badge Earned</h2>
          <div className="max-w-md">
            <BadgeCard
              name={badge.badge_name}
              description={badge.description_5th_grade}
              points={badge.points}
              color={badge.color}
              iconName={badge.icon_name}
            />
          </div>
        </section>
      )}
    </div>
  )
}
