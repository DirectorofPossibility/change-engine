import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { RoleRequestCard } from '@/components/exchange/RoleRequestCard'
import { SubmissionTracker } from '@/components/exchange/SubmissionTracker'
import { FlowerOfLifeIcon } from '@/components/exchange/FlowerIcons'
import { FOLWatermark } from '@/components/exchange/FOLWatermark'
import { IndexWayfinder } from '@/components/exchange/IndexWayfinder'
import { WayfinderTooltipPos } from '@/components/exchange/WayfinderTooltips'
import { SpiralProgress } from '@/components/exchange/SpiralProgress'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'My Account — Community Exchange',
  description: 'Your personal dashboard on the Community Exchange.',
}

export default async function MyDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/me')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('auth_id', user.id)
    .single()

  const { data: progress } = await supabase
    .from('user_progress')
    .select('progress_id, path_id, module_id, status, started_at, completed_at')
    .eq('user_id', user.id)
    .order('last_updated', { ascending: false })

  const { data: userBadges } = await supabase
    .from('user_badges')
    .select('user_badge_id, badge_id, earned_date, earned_via, points_at_earning')
    .eq('user_id', user.id)
    .order('earned_date', { ascending: false })

  let badgeDetails: any[] = []
  if (userBadges && userBadges.length > 0) {
    const badgeIds = userBadges.map(function (b) { return b.badge_id }).filter(Boolean) as string[]
    const { data: badges } = await supabase
      .from('badges')
      .select('badge_id, badge_name, description_5th_grade, icon_name, color, points')
      .in('badge_id', badgeIds)
    badgeDetails = badges || []
  }

  const { data: actions } = await supabase
    .from('user_actions')
    .select('action_log_id, action_type_id, target_name, action_date, impact_points')
    .eq('user_id', user.id)
    .order('action_date', { ascending: false })
    .limit(10)

  const pathNames: Record<string, string> = {}
  const pathSlugs: Record<string, string> = {}
  if (progress && progress.length > 0) {
    const pathIds = Array.from(new Set(progress.map(function (p) { return p.path_id }).filter(Boolean))) as string[]
    if (pathIds.length > 0) {
      const { data: paths } = await (supabase as any)
        .from('learning_paths')
        .select('path_id, path_name, slug')
        .in('path_id', pathIds)
      if (paths) {
        paths.forEach(function (p: any) {
          pathNames[p.path_id] = p.path_name
          if (p.slug) pathSlugs[p.path_id] = p.slug
        })
      }
    }
  }

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

  // Fetch representatives if user has a ZIP
  let representatives: any[] = []
  if (profile?.zip_code) {
    const userZip = String(profile.zip_code)
    const { data: zipData } = await supabase
      .from('zip_codes')
      .select('*')
      .eq('zip_code', parseInt(userZip))
      .single()

    if (zipData) {
      const districts = [
        zipData.congressional_district,
        zipData.state_senate_district,
        zipData.state_house_district,
        'TX',
      ].filter(Boolean)

      const { data: hoodRows } = await supabase
        .from('neighborhoods')
        .select('council_district')
        .like('zip_codes', '%' + userZip + '%')
        .not('council_district', 'is', null)
        .limit(1)
      const councilDistrict = hoodRows?.[0]?.council_district || null

      let filterParts = districts.map(function (d) { return 'district_id.eq.' + d }).join(',')
      if (councilDistrict) {
        filterParts += ',district_id.eq.' + councilDistrict
      }
      filterParts += ',district_id.like.AL%,and(level.eq.City,district_id.is.null)'
      if (zipData.county_id) {
        filterParts += ',counties_served.like.%' + zipData.county_id + '%'
      }

      const { data: matched } = await supabase
        .from('elected_officials')
        .select('official_id, official_name, title, party, level, photo_url')
        .or(filterParts)
        .order('official_name')

      representatives = matched || []
    }
  }

  const displayName = profile?.display_name || user.email?.split('@')[0] || 'User'
  const totalPoints = (userBadges || []).reduce(function (sum, b) { return sum + (b.points_at_earning || 0) }, 0)
    + (actions || []).reduce(function (sum, a) { return sum + (a.impact_points || 0) }, 0)

  const currentRole = profile?.role || 'neighbor'
  const roleLabel = currentRole === 'admin' ? 'Administrator' : currentRole === 'partner' ? 'Community Partner' : 'Neighbor'

  return (
    <div>
      {/* Welcome hero */}
      <section className="relative bg-brand-bg overflow-hidden">
        <div className="absolute right-[-60px] top-[-20px] opacity-[0.04]">
          <FOLWatermark variant="flower" size="lg" color="#C75B2A" />
        </div>
        <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-xl bg-brand-accent/20 flex items-center justify-center flex-shrink-0">
              <FlowerOfLifeIcon size={36} />
            </div>
            <div>
              <h1 className="text-2xl font-serif font-bold">Welcome back, {displayName}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-brand-muted">
                <span className="relative px-2 py-0.5 rounded-lg bg-brand-bg-alt text-[11px] font-mono font-bold uppercase tracking-wide text-brand-muted">
                  {roleLabel}
                  <WayfinderTooltipPos tipKey="role_badge" position="bottom" />
                </span>
                {profile?.zip_code && <span>ZIP {profile.zip_code}</span>}
                <span className="relative">Impact Points: <strong className="text-brand-accent">{totalPoints}</strong>
                  <WayfinderTooltipPos tipKey="impact_points" position="bottom" />
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <Link href="/me/settings" className="inline-block px-4 py-2 bg-brand-bg-alt border-2 border-brand-border rounded-xl text-sm text-brand-text hover:bg-brand-border/50 transition-all">
                  Edit Settings
                </Link>
                <Link href="/compass" className="inline-block px-4 py-2 bg-brand-accent rounded-xl text-sm text-white font-semibold hover:bg-brand-accent-hover transition-all">
                  My Compass
                </Link>
                {['admin', 'partner', 'neighbor'].includes(currentRole) && (
                  <Link href="/dashboard" className="inline-block px-4 py-2 bg-brand-bg-alt border-2 border-brand-border rounded-xl text-sm text-brand-text hover:bg-brand-border/50 transition-all">
                    Go to Dashboard
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="h-1 bg-gradient-to-r from-brand-accent to-transparent" />
      </section>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Learning Progress */}
            <section>
              <h2 className="font-serif text-lg font-bold text-brand-text mb-4">My Learning Paths</h2>
              {Object.keys(pathProgress).length === 0 ? (
                <div className="bg-white rounded-xl border-2 border-brand-border p-6 text-center" style={{ boxShadow: '3px 3px 0 #D1D5E0' }}>
                  <p className="text-brand-muted mb-3">You haven&apos;t started any learning paths yet.</p>
                  <Link href="/learn" className="text-sm text-brand-accent hover:underline">Browse learning paths &rarr;</Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(pathProgress).map(function ([pathId, prog]) {
                    const pct = prog.total > 0 ? Math.round((prog.completed / prog.total) * 100) : 0
                    return (
                      <Link key={pathId} href={'/learn/' + (pathSlugs[pathId] || pathId)} className="block bg-white rounded-xl border-2 border-brand-border p-4 hover:border-brand-text transition-all" style={{ boxShadow: '2px 2px 0 #D1D5E0' }}>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-brand-text text-sm">{pathNames[pathId] || pathId}</h3>
                          <span className="text-xs text-brand-muted">{prog.completed}/{prog.total} modules</span>
                        </div>
                        <div className="w-full bg-brand-bg rounded-full h-2">
                          <div className="bg-brand-accent rounded-full h-2 transition-all" style={{ width: pct + '%' }} />
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </section>

            {/* Your Representatives */}
            {representatives.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-serif text-lg font-bold text-brand-text">Your Representatives</h2>
                  <Link href="/officials" className="text-xs text-brand-accent hover:underline">View all &rarr;</Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {representatives.map(function (rep: any) {
                    const levelColors: Record<string, string> = {
                      Federal: '#805ad5', State: '#3182ce', County: '#38a169', City: '#dd6b20',
                    }
                    const color = levelColors[rep.level] || '#6B6560'
                    return (
                      <Link
                        key={rep.official_id}
                        href={'/officials/' + rep.official_id}
                        className="group flex items-center gap-3 bg-white rounded-xl border-2 border-brand-border p-3 hover:border-brand-text transition-all"
                        style={{ boxShadow: '2px 2px 0 #D1D5E0' }}
                      >
                        <div className="w-10 h-10 rounded-lg flex-shrink-0 overflow-hidden bg-brand-bg">
                          {rep.photo_url ? (
                            <img src={rep.photo_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: color }}>
                              {rep.official_name?.charAt(0) || '?'}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-brand-text truncate">{rep.official_name}</p>
                          <div className="flex items-center gap-2 text-[11px] text-brand-muted">
                            <span className="inline-block w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                            <span className="truncate">{rep.title || rep.level}</span>
                            {rep.party && <span>({rep.party})</span>}
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Spiral Progress */}
            <section className="mb-6">
              <SpiralProgress variant="full" />
            </section>

            {/* Recent Activity */}
            <section>
              <h2 className="font-serif text-lg font-bold text-brand-text mb-4">Recent Activity</h2>
              {(!actions || actions.length === 0) ? (
                <div className="bg-white rounded-xl border-2 border-brand-border p-6 text-center" style={{ boxShadow: '3px 3px 0 #D1D5E0' }}>
                  <p className="text-brand-muted">No activity yet. Start by exploring content and taking action!</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border-2 border-brand-border divide-y divide-brand-border overflow-hidden" style={{ boxShadow: '2px 2px 0 #D1D5E0' }}>
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

            {/* Submission Tracker */}
            {['neighbor', 'partner', 'admin'].includes(currentRole) && (
              <SubmissionTracker authId={user.id} />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Badges */}
            <section>
              <h2 className="relative font-serif text-lg font-bold text-brand-text mb-4">My Badges
                <WayfinderTooltipPos tipKey="badges" position="bottom" />
              </h2>
              {(!userBadges || userBadges.length === 0) ? (
                <div className="bg-white rounded-xl border-2 border-brand-border p-6 text-center" style={{ boxShadow: '2px 2px 0 #D1D5E0' }}>
                  <p className="text-sm text-brand-muted">Complete learning paths and take action to earn badges!</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {userBadges.map(function (ub) {
                    const detail = badgeDetails.find(function (b) { return b.badge_id === ub.badge_id })
                    return (
                      <div key={ub.user_badge_id} className="bg-white rounded-xl border-2 border-brand-border p-3 text-center" style={{ boxShadow: '2px 2px 0 #D1D5E0' }}>
                        <div
                          className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center text-white text-lg"
                          style={{ backgroundColor: detail?.color || '#C75B2A' }}
                        >
                          {detail?.icon_name ? detail.icon_name.charAt(0).toUpperCase() : 'B'}
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

            {/* Account upgrades */}
            {currentRole === 'neighbor' && (
              <section>
                <h2 className="relative font-serif text-lg font-bold text-brand-text mb-4">Upgrade Your Account
                  <WayfinderTooltipPos tipKey="neighbor_vs_partner" position="bottom" />
                </h2>
                <div className="bg-white rounded-xl border-2 border-brand-accent/30 p-4 relative overflow-hidden" style={{ boxShadow: '2px 2px 0 #D1D5E0' }}>
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-accent" />
                  <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-accent mb-1 pl-2">Community Partner</p>
                  <p className="text-lg font-serif font-bold text-brand-text pl-2">$100<span className="text-sm font-normal text-brand-muted"> - $5,000/yr</span></p>
                  <ul className="mt-2 pl-2 space-y-1 text-[12px] text-brand-muted">
                    <li>Verified organizational profile</li>
                    <li>Post events and guides</li>
                    <li>Partner dashboard and analytics</li>
                    <li>Community partner badge</li>
                    <li>Priority content placement</li>
                  </ul>
                </div>
              </section>
            )}

            {/* Role request */}
            <RoleRequestCard currentRole={currentRole} />

            {/* Donate */}
            <div className="bg-white rounded-xl border-2 border-brand-border p-4 text-center relative overflow-hidden" style={{ boxShadow: '2px 2px 0 #D1D5E0' }}>
              <FlowerOfLifeIcon size={28} className="mx-auto mb-2" />
              <p className="font-serif text-sm font-bold text-brand-text mb-1">Support the Exchange</p>
              <p className="text-[11px] text-brand-muted mb-3">Help keep Houston connected. Every dollar strengthens civic infrastructure for all.</p>
              <Link
                href="/donate"
                className="inline-block px-5 py-2 bg-brand-accent text-white rounded-xl text-sm font-semibold hover:bg-brand-accent-hover transition-colors"
              >
                Make a Donation
              </Link>
            </div>

            {/* Quick links */}
            <section>
              <h2 className="font-serif text-lg font-bold text-brand-text mb-4">Quick Links</h2>
              <div className="space-y-2">
                <Link href="/compass" className="block bg-white rounded-xl border-2 border-brand-border p-3 text-sm text-brand-text hover:border-brand-text transition-all" style={{ boxShadow: '2px 2px 0 #D1D5E0' }}>
                  My Community Compass
                </Link>
                <Link href="/learn" className="block bg-white rounded-xl border-2 border-brand-border p-3 text-sm text-brand-text hover:border-brand-text transition-all" style={{ boxShadow: '2px 2px 0 #D1D5E0' }}>
                  Browse Learning Paths
                </Link>
                <Link href="/officials" className="block bg-white rounded-xl border-2 border-brand-border p-3 text-sm text-brand-text hover:border-brand-text transition-all" style={{ boxShadow: '2px 2px 0 #D1D5E0' }}>
                  Find My Representatives
                </Link>
                {['neighbor', 'partner', 'admin'].includes(currentRole) && (
                  <Link href="/dashboard/tools-guides" className="block bg-white rounded-xl border-2 border-brand-border p-3 text-sm text-brand-text hover:border-brand-text transition-all" style={{ boxShadow: '2px 2px 0 #D1D5E0' }}>
                    Tools &amp; Guides
                  </Link>
                )}
                {['neighbor', 'partner', 'admin'].includes(currentRole) && (
                  <Link href="/me/submit" className="block bg-brand-accent/5 rounded-xl border-2 border-brand-accent/20 p-3 text-sm text-brand-accent hover:bg-brand-accent/10 transition-all">
                    Share a Resource
                  </Link>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
