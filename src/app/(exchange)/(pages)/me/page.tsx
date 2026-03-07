import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { RoleRequestCard } from '@/components/exchange/RoleRequestCard'
import { SubmissionTracker } from '@/components/exchange/SubmissionTracker'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'My Dashboard',
  description: 'Your personal dashboard on the Community Exchange.',
}

export default async function MyDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/me')

  // Fetch profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('auth_id', user.id)
    .single()

  // Fetch learning progress
  const { data: progress } = await supabase
    .from('user_progress')
    .select('progress_id, path_id, module_id, status, started_at, completed_at')
    .eq('user_id', user.id)
    .order('last_updated', { ascending: false })

  // Fetch badges
  const { data: userBadges } = await supabase
    .from('user_badges')
    .select('user_badge_id, badge_id, earned_date, earned_via, points_at_earning')
    .eq('user_id', user.id)
    .order('earned_date', { ascending: false })

  // Fetch badge details
  let badgeDetails: any[] = []
  if (userBadges && userBadges.length > 0) {
    const badgeIds = userBadges.map(function (b) { return b.badge_id }).filter(Boolean) as string[]
    const { data: badges } = await supabase
      .from('badges')
      .select('badge_id, badge_name, description_5th_grade, icon_name, color, points')
      .in('badge_id', badgeIds)
    badgeDetails = badges || []
  }

  // Fetch recent actions
  const { data: actions } = await supabase
    .from('user_actions')
    .select('action_log_id, action_type_id, target_name, action_date, impact_points')
    .eq('user_id', user.id)
    .order('action_date', { ascending: false })
    .limit(10)

  // Get unique path IDs from progress to fetch path names
  const pathNames: Record<string, string> = {}
  if (progress && progress.length > 0) {
    const pathIds = Array.from(new Set(progress.map(function (p) { return p.path_id }).filter(Boolean))) as string[]
    if (pathIds.length > 0) {
      const { data: paths } = await supabase
        .from('learning_paths')
        .select('path_id, path_name')
        .in('path_id', pathIds)
      if (paths) {
        paths.forEach(function (p) { pathNames[p.path_id] = p.path_name })
      }
    }
  }

  // Group progress by path
  const pathProgress: Record<string, { total: number; completed: number; lastActive: string | null }> = {}
  if (progress) {
    progress.forEach(function (p) {
      if (!p.path_id) return
      if (!pathProgress[p.path_id]) {
        pathProgress[p.path_id] = { total: 0, completed: 0, lastActive: null }
      }
      pathProgress[p.path_id].total++
      if (p.status === 'completed') pathProgress[p.path_id].completed++
      if (!pathProgress[p.path_id].lastActive || (p.started_at && p.started_at > pathProgress[p.path_id].lastActive!)) {
        pathProgress[p.path_id].lastActive = p.started_at
      }
    })
  }

  const displayName = profile?.display_name || user.email?.split('@')[0] || 'User'
  const totalPoints = (userBadges || []).reduce(function (sum, b) { return sum + (b.points_at_earning || 0) }, 0)
    + (actions || []).reduce(function (sum, a) { return sum + (a.impact_points || 0) }, 0)

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Welcome header */}
      <div className="bg-white rounded-xl border border-brand-border p-6 mb-8">
        <h1 className="text-2xl font-bold text-brand-text mb-1">Welcome back, {displayName}!</h1>
        <div className="flex flex-wrap gap-4 text-sm text-brand-muted mt-3">
          {(profile as any)?.address && <span>{(profile as any).address}</span>}
          {!(profile as any)?.address && profile?.zip_code && <span>ZIP: {profile.zip_code}</span>}
          {profile?.preferred_language && (
            <span>Language: {profile.preferred_language === 'es' ? 'Español' : profile.preferred_language === 'vi' ? 'Tiếng Việt' : 'English'}</span>
          )}
          <span>Impact Points: <strong className="text-brand-accent">{totalPoints}</strong></span>
        </div>
        <div className="flex items-center gap-4 mt-3">
          <Link href="/me/settings" className="text-sm text-brand-accent hover:underline">Edit settings</Link>
          {profile?.role && ['admin', 'partner', 'neighbor'].includes(profile.role) && (
            <Link href="/dashboard" className="text-sm text-brand-accent hover:underline">Go to Dashboard</Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Learning Progress */}
          <section>
            <h2 className="text-lg font-bold text-brand-text mb-4">My Learning Paths</h2>
            {Object.keys(pathProgress).length === 0 ? (
              <div className="bg-white rounded-xl border border-brand-border p-6 text-center">
                <p className="text-brand-muted mb-3">You haven&apos;t started any learning paths yet.</p>
                <Link href="/learn" className="text-sm text-brand-accent hover:underline">Browse learning paths &rarr;</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(pathProgress).map(function ([pathId, prog]) {
                  const pct = prog.total > 0 ? Math.round((prog.completed / prog.total) * 100) : 0
                  return (
                    <Link key={pathId} href={'/learn/' + pathId} className="block bg-white rounded-xl border border-brand-border p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-brand-text text-sm">{pathNames[pathId] || pathId}</h3>
                        <span className="text-xs text-brand-muted">{prog.completed}/{prog.total} modules</span>
                      </div>
                      <div className="w-full bg-brand-bg rounded-full h-2">
                        <div
                          className="bg-brand-accent rounded-full h-2 transition-all"
                          style={{ width: pct + '%' }}
                        />
                      </div>
                      {prog.lastActive && (
                        <p className="text-xs text-brand-muted mt-2">
                          Last active: {new Date(prog.lastActive).toLocaleDateString()}
                        </p>
                      )}
                    </Link>
                  )
                })}
              </div>
            )}
          </section>

          {/* Recent Activity */}
          <section>
            <h2 className="text-lg font-bold text-brand-text mb-4">Recent Activity</h2>
            {(!actions || actions.length === 0) ? (
              <div className="bg-white rounded-xl border border-brand-border p-6 text-center">
                <p className="text-brand-muted">No activity yet. Start by exploring content and taking action!</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-brand-border divide-y divide-brand-border">
                {actions.map(function (a) {
                  return (
                    <div key={a.action_log_id} className="p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm text-brand-text">{a.target_name || a.action_type_id}</p>
                        {a.action_date && (
                          <p className="text-xs text-brand-muted">{new Date(a.action_date).toLocaleDateString()}</p>
                        )}
                      </div>
                      {a.impact_points != null && a.impact_points > 0 && (
                        <span className="text-xs font-medium text-brand-accent">+{a.impact_points} pts</span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {/* Submission Tracker (neighbors, partners, admins) */}
          {profile?.role && ['neighbor', 'partner', 'admin'].includes(profile.role) && (
            <SubmissionTracker authId={user.id} />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Badges */}
          <section>
            <h2 className="text-lg font-bold text-brand-text mb-4">My Badges</h2>
            {(!userBadges || userBadges.length === 0) ? (
              <div className="bg-white rounded-xl border border-brand-border p-6 text-center">
                <p className="text-sm text-brand-muted">Complete learning paths and take action to earn badges!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {userBadges.map(function (ub) {
                  const detail = badgeDetails.find(function (b) { return b.badge_id === ub.badge_id })
                  return (
                    <div key={ub.user_badge_id} className="bg-white rounded-xl border border-brand-border p-3 text-center">
                      <div
                        className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center text-white text-lg"
                        style={{ backgroundColor: detail?.color || '#E8723A' }}
                      >
                        {detail?.icon_name ? detail.icon_name.charAt(0).toUpperCase() : '★'}
                      </div>
                      <p className="text-xs font-medium text-brand-text">{detail?.badge_name || 'Badge'}</p>
                      {detail?.points && (
                        <p className="text-xs text-brand-muted">{detail.points} pts</p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {/* Role request */}
          <RoleRequestCard currentRole={profile?.role || 'user'} />

          {/* Quick links */}
          <section>
            <h2 className="text-lg font-bold text-brand-text mb-4">Quick Links</h2>
            <div className="space-y-2">
              <Link href="/learn" className="block bg-white rounded-lg border border-brand-border p-3 text-sm text-brand-text hover:bg-brand-bg">
                Browse Learning Paths
              </Link>
              <Link href="/help" className="block bg-white rounded-lg border border-brand-border p-3 text-sm text-brand-text hover:bg-brand-bg">
                Available Resources
              </Link>
              <Link href="/officials/lookup" className="block bg-white rounded-lg border border-brand-border p-3 text-sm text-brand-text hover:bg-brand-bg">
                Find My Representatives
              </Link>
              {profile?.role && ['neighbor', 'partner', 'admin'].includes(profile.role) && (
                <Link href="/me/submit" className="block bg-brand-accent/5 rounded-lg border border-brand-accent/20 p-3 text-sm text-brand-accent hover:bg-brand-accent/10">
                  Share a Resource
                </Link>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
