import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getFocusAreasByIds, getRelatedOpportunities, getRelatedPolicies, getSDGMap, getSDOHMap, getLangId, fetchTranslationsForTable } from '@/lib/data/exchange'
import { getUIStrings } from '@/lib/i18n'
import { Clock, BookOpen, Award, ChevronRight } from 'lucide-react'
import { getUserProfile } from '@/lib/auth/roles'
import { SDGBadge } from '@/components/ui/SDGBadge'
import { SDOHBadge } from '@/components/ui/SDOHBadge'
import { FocusAreaPills } from '@/components/exchange/FocusAreaPills'
import { ModuleTimeline } from '@/components/exchange/ModuleTimeline'
import { ModuleProgressTimeline } from '@/components/exchange/ModuleProgressTimeline'
import { BadgeCard } from '@/components/exchange/BadgeCard'

export const revalidate = 3600

export const dynamic = 'force-dynamic'


async function resolvePathByIdOrSlug(supabase: any, idOrSlug: string) {
  const { data: byId } = await supabase.from('learning_paths').select('*').eq('path_id', idOrSlug).single()
  if (byId) return byId
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const res = await fetch(
    url + '/rest/v1/learning_paths?slug=eq.' + encodeURIComponent(idOrSlug) + '&limit=1',
    { headers: { apikey: key, Authorization: 'Bearer ' + key } }
  )
  if (res.ok) {
    const rows = await res.json()
    if (rows.length > 0) return rows[0]
  }
  return null
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const data: any = await resolvePathByIdOrSlug(supabase, id)
  if (!data) return { title: 'Not Found' }
  return {
    title: data.path_name + ' — Change Engine',
    description: data.description_5th_grade || 'A learning path on the Change Engine.',
  }
}

export default async function LearningPathDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const path = await resolvePathByIdOrSlug(supabase, id)
  if (!path) notFound()
  const pathId = path.path_id

  // Parse focus_area_ids
  const focusAreaIds = path.focus_area_ids
    ? (path.focus_area_ids as string).split(',').map((s: string) => s.trim()).filter(Boolean)
    : []

  // Parallel fetch all related data
  const [modulesRes, badgeRes, focusAreas, opportunities, policies, sdgMap, sdohMap, adjacentRes] = await Promise.all([
    supabase.from('learning_modules').select('*').eq('path_id', pathId).order('module_order', { ascending: true }),
    supabase.from('badges').select('*').eq('path_id', pathId).limit(1),
    focusAreaIds.length > 0 ? getFocusAreasByIds(focusAreaIds) : Promise.resolve([]),
    focusAreaIds.length > 0 ? getRelatedOpportunities(focusAreaIds) : Promise.resolve([]),
    focusAreaIds.length > 0 ? getRelatedPolicies(focusAreaIds) : Promise.resolve([]),
    focusAreaIds.length > 0 ? getSDGMap() : Promise.resolve({} as Record<string, any>),
    focusAreaIds.length > 0 ? getSDOHMap() : Promise.resolve({} as Record<string, any>),
    supabase.from('learning_paths').select('path_id, path_name, display_order').eq('is_active', 'Yes').order('display_order', { ascending: true }),
  ])

  const modules = modulesRes.data || []
  const badge = badgeRes.data && badgeRes.data.length > 0 ? badgeRes.data[0] : null

  // Build adjacent path navigation
  const allPaths = (adjacentRes.data || []) as any[]
  const currentIdx = allPaths.findIndex(function (p: any) { return p.path_id === pathId })
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
  let prerequisitePath: any = null
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
      .eq('path_id', pathId)
    userProgress = progressData || []
  }

  // Translation support
  const langId = await getLangId()
  const pathTranslations = langId
    ? await fetchTranslationsForTable('learning_paths', [pathId], langId)
    : {}
  const cookieStore = await cookies()
  const lang = cookieStore.get('lang')?.value || 'en'
  const t = getUIStrings(lang)

  const pathName = pathTranslations[pathId]?.title || path.path_name
  const pathDescription = pathTranslations[pathId]?.summary || path.description_5th_grade

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
      videoUrl: (m as any).video_url || null,
      videoTitle: (m as any).video_title || null,
      videoUrl2: (m as any).video_url_2 || null,
      videoTitle2: (m as any).video_title_2 || null,
      articleUrl: (m as any).article_url || null,
      articleTitle: (m as any).article_title || null,
      musicUrl: (m as any).music_url || null,
      musicTitle: (m as any).music_title || null,
      musicArtist: (m as any).music_artist || null,
      hookText: (m as any).hook_text || null,
      hookAttribution: (m as any).hook_attribution || null,
    }
  })

  return (
    <div className="bg-paper min-h-screen">
      {/* Hero */}
      <div className="bg-paper relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="max-w-[900px] mx-auto px-6 py-16 relative z-10">
          <p style={{ fontSize: '0.875rem', letterSpacing: '0.15em', color: "#5c6474", textTransform: 'uppercase' }}>
            The Change Engine
          </p>
          <h1 style={{ fontSize: '2.2rem', lineHeight: 1.15, marginTop: '0.75rem' }}>
            {pathName}
          </h1>
          {pathDescription && (
            <p style={{ fontSize: '1rem', color: "#5c6474", marginTop: '0.75rem', maxWidth: '38rem', lineHeight: 1.7 }}>
              {pathDescription}
            </p>
          )}
          {/* Meta */}
          <div className="flex items-center gap-4 flex-wrap mt-4">
            {path.difficulty_level && (
              <span className="flex items-center gap-1.5" style={{ fontSize: '0.875rem', color: "#5c6474" }}>
                {path.difficulty_level}
              </span>
            )}
            {path.estimated_minutes != null && (
              <span className="flex items-center gap-1.5" style={{ fontSize: '0.875rem', color: "#5c6474" }}>
                <Clock size={15} /> {path.estimated_minutes} min
              </span>
            )}
            {path.module_count != null && (
              <span className="flex items-center gap-1.5" style={{ fontSize: '0.875rem', color: "#5c6474" }}>
                <BookOpen size={15} /> {path.module_count} modules
              </span>
            )}
            {badge && (
              <span className="flex items-center gap-1.5" style={{ fontSize: '0.875rem', color: "#1b5e8a", fontWeight: 500 }}>
                <Award size={15} /> Earn: {badge.badge_name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-[900px] mx-auto px-6 pt-6">
        <nav style={{ fontSize: '0.875rem', color: "#5c6474" }}>
          <Link href="/" className="hover:underline" style={{ color: "#1b5e8a" }}>Home</Link>
          <span className="mx-2">/</span>
          <Link href="/learn" className="hover:underline" style={{ color: "#1b5e8a" }}>{t('learn.title')}</Link>
          <span className="mx-2">/</span>
          <span>{pathName}</span>
        </nav>
      </div>

      {/* Content */}
      <div className="max-w-[900px] mx-auto px-6 py-8">
        {/* Prerequisite */}
        {prerequisitePath && (
          <div className="p-4 mb-6" style={{ background: "#f4f5f7", border: '1px solid #dde1e8' }}>
            <p style={{ fontSize: '0.9rem',  }}>
              Before starting this path, complete:{' '}
              <Link href={'/learn/' + ((prerequisitePath as any).slug || prerequisitePath.path_id)} className="font-semibold underline" style={{ color: "#1b5e8a" }}>{prerequisitePath.path_name}</Link>
            </p>
          </div>
        )}

        {/* Sign-up CTA for non-logged-in users */}
        {!user && timelineModules.length > 0 && (
          <div className="p-4 mb-6" style={{ background: "#f4f5f7", border: '1px solid #dde1e8' }}>
            <p style={{ fontSize: '0.9rem',  }}>
              <Link href="/signup" className="font-semibold hover:underline" style={{ color: "#1b5e8a" }}>{t('learn.create_account')}</Link>
              {' '}{t('learn.signup_cta')}
            </p>
          </div>
        )}

        {/* Module Timeline */}
        {timelineModules.length > 0 && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 style={{ fontSize: '1.5rem',  }}>{t('learn.modules_heading')}</h2>
              <span style={{ fontSize: '0.875rem', color: "#5c6474" }}>{timelineModules.length} modules</span>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '1rem' }} />
            {user ? (
              <ModuleProgressTimeline
                modules={timelineModules}
                pathId={pathId}
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
            <div className="flex items-baseline justify-between mb-1">
              <h2 style={{ fontSize: '1.5rem',  }}>{t('learn.badge_earned')}</h2>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '1rem' }} />
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

        <div className="my-10" style={{ height: 1, background: '#dde1e8' }} />

        {/* Focus Areas */}
        {focusAreas.length > 0 && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 style={{ fontSize: '1.25rem',  }}>{t('learn.related_focus')}</h2>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '1rem' }} />
            <FocusAreaPills focusAreas={focusAreas} />
          </section>
        )}

        {/* SDG Badges */}
        {sdgIds.length > 0 && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 style={{ fontSize: '1.25rem',  }}>{t('learn.sdg')}</h2>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '1rem' }} />
            <div className="flex flex-wrap gap-2">
              {sdgIds.map(sid => {
                const sdg = sdgMap[sid as string]
                return sdg ? (
                  <SDGBadge key={sid} sdgNumber={sdg.sdg_number} sdgName={sdg.sdg_name} sdgColor={sdg.sdg_color} linkToExplore />
                ) : null
              })}
            </div>
          </section>
        )}

        {/* SDOH Badges */}
        {sdohCodes.length > 0 && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 style={{ fontSize: '1.25rem',  }}>{t('learn.sdoh')}</h2>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '1rem' }} />
            <div className="flex flex-wrap gap-2">
              {sdohCodes.map(code => {
                const sdoh = sdohMap[code as string]
                return sdoh ? (
                  <SDOHBadge key={code} sdohCode={code as string} sdohName={sdoh.sdoh_name} sdohDescription={sdoh.sdoh_description} linkToExplore />
                ) : null
              })}
            </div>
          </section>
        )}

        {/* Related Opportunities */}
        {opportunities.length > 0 && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 style={{ fontSize: '1.25rem',  }}>{t('learn.related_opportunities')}</h2>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '1rem' }} />
            <div className="space-y-2">
              {opportunities.slice(0, 4).map(o => (
                <div key={o.opportunity_id} className="p-3 bg-paper">
                  <div style={{ fontSize: '0.9rem', fontWeight: 500,  }}>{o.opportunity_name}</div>
                  {o.start_date && (
                    <div style={{ fontSize: '0.875rem', color: "#5c6474", marginTop: '0.25rem' }}>
                      {new Date(o.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {o.city && (' · ' + o.city)}
                    </div>
                  )}
                  {o.registration_url && (
                    <a href={o.registration_url} target="_blank" rel="noopener noreferrer" className="hover:underline mt-1 inline-block" style={{ fontSize: '0.875rem', color: "#1b5e8a" }}>
                      Register
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Related Policies */}
        {policies.length > 0 && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 style={{ fontSize: '1.25rem',  }}>{t('learn.related_policies')}</h2>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '1rem' }} />
            <div className="space-y-2">
              {policies.slice(0, 4).map(p => (
                <Link key={p.policy_id} href={'/policies/' + p.policy_id} className="block p-3 hover:underline bg-paper">
                  <div style={{ fontSize: '0.9rem', fontWeight: 500,  }}>{p.policy_name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    {p.status && <span style={{ fontSize: '0.875rem', color: "#5c6474" }}>{p.status}</span>}
                    {p.level && <span style={{ fontSize: '0.875rem', color: "#5c6474" }}>- {p.level}</span>}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* More Paths */}
        <section className="mb-10">
          <div className="flex items-baseline justify-between mb-1">
            <h2 style={{ fontSize: '1.25rem',  }}>{t('learn.more_paths')}</h2>
          </div>
          <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '1rem' }} />
          <div className="space-y-2">
            {allPaths.filter(p => p.path_id !== pathId).slice(0, 5).map(p => (
              <Link key={p.path_id} href={'/learn/' + (p.slug || p.path_id)} className="block hover:underline" style={{ fontSize: '0.9rem',  }}>
                {p.path_name}
              </Link>
            ))}
          </div>
          <Link href="/learn" className="flex items-center gap-1 hover:underline mt-3" style={{ fontSize: '0.875rem', color: "#1b5e8a" }}>
            {t('learn.view_all')} <ChevronRight size={12} />
          </Link>
        </section>

        {/* Prev/Next Navigation */}
        <div className="flex justify-between mt-12 pt-8" style={{ borderTop: '1px dotted ' + '#dde1e8' }}>
          {prevPath ? (
            <Link href={'/learn/' + (prevPath.slug || prevPath.path_id)} className="group">
              <span className="block mb-1" style={{ fontSize: '0.875rem', color: "#5c6474" }}>{t('learn.previous_path')}</span>
              <span className="group-hover:underline" style={{ fontSize: '0.9rem', fontWeight: 500,  }}>
                {prevPath.path_name}
              </span>
            </Link>
          ) : <div />}
          {nextPath ? (
            <Link href={'/learn/' + (nextPath.slug || nextPath.path_id)} className="text-right group">
              <span className="block mb-1" style={{ fontSize: '0.875rem', color: "#5c6474" }}>{t('learn.next_path')}</span>
              <span className="group-hover:underline" style={{ fontSize: '0.9rem', fontWeight: 500,  }}>
                {nextPath.path_name}
              </span>
            </Link>
          ) : <div />}
        </div>
      </div>

      {/* Footer */}
      <div className="my-10 max-w-[900px] mx-auto px-6" style={{ height: 1, background: '#dde1e8' }} />
      <div className="max-w-[900px] mx-auto px-6 pb-12">
        <Link href="/learn" style={{ fontStyle: 'italic', color: "#1b5e8a", fontSize: '0.95rem' }} className="hover:underline">
          Back to Learning Paths
        </Link>
      </div>
    </div>
  )
}
