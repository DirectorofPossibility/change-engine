import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getFocusAreasByIds, getRelatedOpportunities, getRelatedPolicies, getSDGMap, getSDOHMap, getLangId, fetchTranslationsForTable } from '@/lib/data/exchange'
import { getUIStrings } from '@/lib/i18n'
import { Clock, BookOpen, Award, ChevronRight } from 'lucide-react'
import { ThemePill } from '@/components/ui/ThemePill'
import { SDGBadge } from '@/components/ui/SDGBadge'
import { SDOHBadge } from '@/components/ui/SDOHBadge'
import { FocusAreaPills } from '@/components/exchange/FocusAreaPills'
import { ModuleTimeline } from '@/components/exchange/ModuleTimeline'
import { ModuleProgressTimeline } from '@/components/exchange/ModuleProgressTimeline'
import { BadgeCard } from '@/components/exchange/BadgeCard'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('learning_paths').select('path_name, description_5th_grade').eq('path_id', id).single()
  if (!data) return { title: 'Not Found' }
  return {
    title: data.path_name + ' — Community Exchange',
    description: data.description_5th_grade || 'A learning path on the Community Exchange.',
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

  // Parse focus_area_ids (stored as comma-separated string)
  const focusAreaIds = path.focus_area_ids
    ? (path.focus_area_ids as string).split(',').map((s: string) => s.trim()).filter(Boolean)
    : []

  // Parallel fetch all related data
  const [modulesRes, badgeRes, focusAreas, opportunities, policies, sdgMap, sdohMap, adjacentRes] = await Promise.all([
    supabase.from('learning_modules').select('*').eq('path_id', id).order('module_order', { ascending: true }),
    supabase.from('badges').select('*').eq('path_id', id).limit(1),
    focusAreaIds.length > 0 ? getFocusAreasByIds(focusAreaIds) : Promise.resolve([]),
    focusAreaIds.length > 0 ? getRelatedOpportunities(focusAreaIds) : Promise.resolve([]),
    focusAreaIds.length > 0 ? getRelatedPolicies(focusAreaIds) : Promise.resolve([]),
    focusAreaIds.length > 0 ? getSDGMap() : Promise.resolve({} as Record<string, any>),
    focusAreaIds.length > 0 ? getSDOHMap() : Promise.resolve({} as Record<string, any>),
    // Get prev/next paths
    supabase.from('learning_paths').select('path_id, path_name, display_order').eq('is_active', 'Yes').order('display_order', { ascending: true }),
  ])

  const modules = modulesRes.data || []
  const badge = badgeRes.data && badgeRes.data.length > 0 ? badgeRes.data[0] : null

  // Build adjacent path navigation
  const allPaths = adjacentRes.data || []
  const currentIdx = allPaths.findIndex(p => p.path_id === id)
  const prevPath = currentIdx > 0 ? allPaths[currentIdx - 1] : null
  const nextPath = currentIdx < allPaths.length - 1 ? allPaths[currentIdx + 1] : null

  // Get quizzes for modules
  const moduleIds = modules.map(function (m) { return m.module_id })
  const quizMap: Record<string, { quiz_name: string; question_count: number | null; passing_score: number | null }> = {}
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
  let prerequisitePath: { path_id: string; path_name: string } | null = null
  if (path.prerequisite_path_id) {
    const { data: prereq } = await supabase
      .from('learning_paths')
      .select('path_id, path_name')
      .eq('path_id', path.prerequisite_path_id)
      .single()
    prerequisitePath = prereq
  }

  // Check if user is logged in and fetch their progress
  const { data: { user } } = await supabase.auth.getUser()
  let userProgress: any[] = []
  if (user) {
    const { data: progressData } = await supabase
      .from('user_progress')
      .select('progress_id, module_id, status, started_at, completed_at')
      .eq('user_id', user.id)
      .eq('path_id', id)
    userProgress = progressData || []
  }

  // Translation support
  const langId = await getLangId()
  const pathTranslations = langId
    ? await fetchTranslationsForTable('learning_paths', [id], langId)
    : {}
  const cookieStore = await cookies()
  const lang = cookieStore.get('lang')?.value || 'en'
  const t = getUIStrings(lang)

  const pathName = pathTranslations[id]?.title || path.path_name
  const pathDescription = pathTranslations[id]?.summary || path.description_5th_grade

  // Build SDG/SDOH data from focus areas
  const sdgIds = Array.from(new Set(focusAreas.map(fa => fa.sdg_id).filter(Boolean)))
  const sdohCodes = Array.from(new Set(focusAreas.map(fa => fa.sdoh_code).filter(Boolean)))

  // Build module data for timeline
  const timelineModules = modules.map(function (m) {
    const quiz = m.module_id ? quizMap[m.module_id] : undefined
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

  const DIFF_COLORS: Record<string, string> = {
    'Beginner': 'bg-green-100 text-green-800',
    'Intermediate': 'bg-blue-100 text-blue-800',
    'Advanced': 'bg-purple-100 text-purple-800',
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Breadcrumb items={[
        { label: t('learn.title'), href: '/learn' },
        { label: pathName }
      ]} />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 flex-wrap mb-3">
          {path.theme_id && <ThemePill themeId={path.theme_id} size="sm" />}
          {path.difficulty_level && (
            <span className={'text-xs px-2.5 py-1 rounded-full font-medium ' + (DIFF_COLORS[path.difficulty_level] || 'bg-gray-100 text-gray-700')}>
              {path.difficulty_level}
            </span>
          )}
        </div>
        <h1 className="text-3xl font-bold text-brand-text font-serif mb-3">{pathName}</h1>
        {pathDescription && (
          <p className="text-brand-muted mb-4 max-w-2xl text-lg">{pathDescription}</p>
        )}

        <div className="flex items-center gap-5 text-sm text-brand-muted">
          {path.estimated_minutes != null && (
            <span className="flex items-center gap-1.5"><Clock size={15} /> {path.estimated_minutes} min</span>
          )}
          {path.module_count != null && (
            <span className="flex items-center gap-1.5"><BookOpen size={15} /> {path.module_count} modules</span>
          )}
          {badge && (
            <span className="flex items-center gap-1.5 text-brand-accent font-medium"><Award size={15} /> Earn: {badge.badge_name}</span>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Prerequisite */}
          {prerequisitePath && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-yellow-700">
                Before starting this path, complete:{' '}
                <Link href={'/learn/' + prerequisitePath.path_id} className="font-semibold underline">{prerequisitePath.path_name}</Link>
              </p>
            </div>
          )}

          {/* Sign-up CTA for non-logged-in users */}
          {!user && timelineModules.length > 0 && (
            <div className="bg-brand-accent/5 border border-brand-accent/20 rounded-xl p-4 mb-6">
              <p className="text-sm text-brand-text">
                <Link href="/signup" className="text-brand-accent font-semibold hover:underline">{t('learn.create_account')}</Link>
                {' '}{t('learn.signup_cta')}
              </p>
            </div>
          )}

          {/* Module Timeline */}
          {timelineModules.length > 0 && (
            <section className="mb-10">
              <h2 className="text-xl font-bold text-brand-text font-serif mb-6">{t('learn.modules_heading')}</h2>
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
              <h2 className="text-xl font-bold text-brand-text font-serif mb-4">{t('learn.badge_earned')}</h2>
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

          {/* Prev/Next Navigation */}
          <div className="flex justify-between mt-12 pt-8 border-t border-brand-border">
            {prevPath ? (
              <Link href={'/learn/' + prevPath.path_id} className="group">
                <span className="text-xs text-brand-muted block mb-1">{t('learn.previous_path')}</span>
                <span className="font-serif font-medium text-brand-text group-hover:text-brand-accent transition-colors">
                  {prevPath.path_name}
                </span>
              </Link>
            ) : <div />}
            {nextPath ? (
              <Link href={'/learn/' + nextPath.path_id} className="text-right group">
                <span className="text-xs text-brand-muted block mb-1">{t('learn.next_path')}</span>
                <span className="font-serif font-medium text-brand-text group-hover:text-brand-accent transition-colors">
                  {nextPath.path_name}
                </span>
              </Link>
            ) : <div />}
          </div>
        </div>

        {/* Sidebar — Knowledge Mesh Connections */}
        <aside className="lg:w-80 shrink-0 space-y-6">
          {/* Focus Areas */}
          {focusAreas.length > 0 && (
            <div className="bg-white rounded-xl border border-brand-border p-4">
              <h3 className="text-sm font-semibold text-brand-text mb-3 font-serif">{t('learn.related_focus')}</h3>
              <FocusAreaPills focusAreas={focusAreas} />
            </div>
          )}

          {/* SDG Badges */}
          {sdgIds.length > 0 && (
            <div className="bg-white rounded-xl border border-brand-border p-4">
              <h3 className="text-sm font-semibold text-brand-text mb-3 font-serif">{t('learn.sdg')}</h3>
              <div className="flex flex-wrap gap-2">
                {sdgIds.map(sid => {
                  const sdg = sdgMap[sid as string]
                  return sdg ? (
                    <SDGBadge
                      key={sid}
                      sdgNumber={sdg.sdg_number}
                      sdgName={sdg.sdg_name}
                      sdgColor={sdg.sdg_color}
                      linkToExplore
                    />
                  ) : null
                })}
              </div>
            </div>
          )}

          {/* SDOH Badges */}
          {sdohCodes.length > 0 && (
            <div className="bg-white rounded-xl border border-brand-border p-4">
              <h3 className="text-sm font-semibold text-brand-text mb-3 font-serif">{t('learn.sdoh')}</h3>
              <div className="flex flex-wrap gap-2">
                {sdohCodes.map(code => {
                  const sdoh = sdohMap[code as string]
                  return sdoh ? (
                    <SDOHBadge
                      key={code}
                      sdohCode={code as string}
                      sdohName={sdoh.sdoh_name}
                      sdohDescription={sdoh.sdoh_description}
                      linkToExplore
                    />
                  ) : null
                })}
              </div>
            </div>
          )}

          {/* Related Opportunities */}
          {opportunities.length > 0 && (
            <div className="bg-white rounded-xl border border-brand-border p-4">
              <h3 className="text-sm font-semibold text-brand-text mb-3 font-serif">{t('learn.related_opportunities')}</h3>
              <div className="space-y-2">
                {opportunities.slice(0, 4).map(o => (
                  <div key={o.opportunity_id} className="p-3 bg-brand-bg rounded-lg">
                    <div className="font-medium text-sm text-brand-text">{o.opportunity_name}</div>
                    {o.start_date && (
                      <div className="text-xs text-brand-muted mt-1">
                        {new Date(o.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {o.city && (' · ' + o.city)}
                      </div>
                    )}
                    {o.registration_url && (
                      <a href={o.registration_url} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-accent hover:underline mt-1 inline-block">
                        Register →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related Policies */}
          {policies.length > 0 && (
            <div className="bg-white rounded-xl border border-brand-border p-4">
              <h3 className="text-sm font-semibold text-brand-text mb-3 font-serif">{t('learn.related_policies')}</h3>
              <div className="space-y-2">
                {policies.slice(0, 4).map(p => (
                  <Link key={p.policy_id} href={'/policies/' + p.policy_id} className="block p-3 bg-brand-bg rounded-lg hover:shadow-sm transition-shadow">
                    <div className="font-medium text-sm text-brand-text">{p.policy_name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      {p.status && <span className="text-xs text-brand-muted">{p.status}</span>}
                      {p.level && <span className="text-xs text-brand-muted">· {p.level}</span>}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Related Guides */}
          <div className="bg-white rounded-xl border border-brand-border p-4">
            <h3 className="text-sm font-semibold text-brand-text mb-3 font-serif">{t('learn.related_guides')}</h3>
            <Link href="/guides" className="flex items-center gap-2 text-sm text-brand-accent hover:underline">
              <BookOpen size={14} />
              {t('learn.browse_guides')}
              <ChevronRight size={14} />
            </Link>
          </div>

          {/* All Learning Paths */}
          <div className="bg-white rounded-xl border border-brand-border p-4">
            <h3 className="text-sm font-semibold text-brand-text mb-3 font-serif">{t('learn.more_paths')}</h3>
            <div className="space-y-2">
              {allPaths.filter(p => p.path_id !== id).slice(0, 5).map(p => (
                <Link key={p.path_id} href={'/learn/' + p.path_id} className="block text-sm text-brand-text hover:text-brand-accent transition-colors">
                  {p.path_name}
                </Link>
              ))}
            </div>
            <Link href="/learn" className="flex items-center gap-1 text-xs text-brand-accent hover:underline mt-3">
              {t('learn.view_all')} <ChevronRight size={12} />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  )
}
