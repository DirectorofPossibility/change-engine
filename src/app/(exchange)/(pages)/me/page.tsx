import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { RoleRequestCard } from '@/components/exchange/RoleRequestCard'
import { SubmissionTracker } from '@/components/exchange/SubmissionTracker'
import { SpiralProgress } from '@/components/exchange/SpiralProgress'
import { RedoOnboarding } from '@/components/exchange/RedoOnboarding'

export const dynamic = 'force-dynamic'


export const metadata: Metadata = {
  title: 'My Account -- Change Engine',
  description: 'Your personal dashboard on the Change Engine.',
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
    <div className="bg-paper min-h-screen">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-paper">
        <div className="absolute right-[-60px] top-[-20px]">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="relative z-10 max-w-[900px] mx-auto px-6 py-10">
          <p style={{ color: "#5c6474" }} className="text-[11px] uppercase tracking-[0.15em] mb-1">changeengine.us</p>
          <div className="flex items-center gap-5 mt-4">
            <div className="w-16 h-16 flex items-center justify-center flex-shrink-0 text-xl font-bold" style={{ background: '#1b5e8a' + '20', color: "#1b5e8a" }}>
              {displayName?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <h1 style={{  }} className="text-2xl sm:text-3xl">
                Welcome back, {displayName}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm" style={{ color: "#5c6474" }}>
                <span style={{ color: "#5c6474", borderBottom: '1px dotted ' + '#dde1e8' }} className="text-[11px] uppercase tracking-wide pb-0.5">
                  {roleLabel}
                </span>
                {profile?.zip_code && <span>ZIP {profile.zip_code}</span>}
                <span>Impact Points: <strong style={{ color: "#1b5e8a" }}>{totalPoints}</strong></span>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-4">
                <Link href="/me/settings" className="inline-block px-4 py-2 text-sm" style={{ border: '1px solid #dde1e8' }}>
                  Edit Settings
                </Link>
                <Link href="/compass" className="inline-block px-4 py-2 text-sm text-white" style={{ background: '#1b5e8a' }}>
                  My Compass
                </Link>
                {['admin', 'partner', 'neighbor'].includes(currentRole) && (
                  <Link href="/dashboard" className="inline-block px-4 py-2 text-sm" style={{ border: '1px solid #dde1e8' }}>
                    Go to Dashboard
                  </Link>
                )}
              </div>
              <div className="mt-3">
                <RedoOnboarding />
              </div>
            </div>
          </div>
        </div>
        <div style={{ height: 1, background: '#dde1e8' }} />
      </section>

      {/* ── Breadcrumb ── */}
      <div className="max-w-[900px] mx-auto px-6 pt-4">
        <nav style={{ color: "#5c6474" }} className="text-[11px] tracking-wide">
          <Link href="/" className="hover:underline">Home</Link>
          <span className="mx-1">/</span>
          <span style={{  }}>My Account</span>
        </nav>
      </div>

      <div className="max-w-[900px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Learning Progress */}
            <section>
              <div className="flex items-baseline justify-between mb-1">
                <h2 style={{  }} className="text-xl">My Learning Paths</h2>
                <span style={{ color: "#5c6474" }} className="text-[11px]">{Object.keys(pathProgress).length} paths</span>
              </div>
              <div style={{ borderBottom: '2px dotted ' + '#dde1e8' }} className="mb-4" />
              {Object.keys(pathProgress).length === 0 ? (
                <div style={{ border: '1px solid #dde1e8' }} className="p-6 text-center">
                  <p style={{ color: "#5c6474" }} className="mb-3">You haven&apos;t started any learning paths yet.</p>
                  <Link href="/learn" style={{ color: "#1b5e8a",  }} className="text-sm hover:underline">Browse learning paths &rarr;</Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(pathProgress).map(function ([pathId, prog]) {
                    const pct = prog.total > 0 ? Math.round((prog.completed / prog.total) * 100) : 0
                    return (
                      <Link key={pathId} href={'/learn/' + (pathSlugs[pathId] || pathId)} className="block p-4 hover:opacity-80 transition-opacity" style={{ border: '1px solid #dde1e8' }}>
                        <div className="flex items-center justify-between mb-2">
                          <h3 style={{  }} className="text-sm font-semibold">{pathNames[pathId] || pathId}</h3>
                          <span style={{ color: "#5c6474" }} className="text-xs">{prog.completed}/{prog.total} modules</span>
                        </div>
                        <div className="w-full h-2 bg-paper">
                          <div className="h-2 transition-all" style={{ width: pct + '%', background: '#1b5e8a' }} />
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
                <div className="flex items-baseline justify-between mb-1">
                  <h2 style={{  }} className="text-xl">Your Representatives</h2>
                  <Link href="/officials" style={{ color: "#1b5e8a" }} className="text-xs hover:underline">View all &rarr;</Link>
                </div>
                <div style={{ borderBottom: '2px dotted ' + '#dde1e8' }} className="mb-4" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {representatives.map(function (rep: any) {
                    const levelColors: Record<string, string> = {
                      Federal: '#1b5e8a', State: '#6a4e10', County: '#7a2018', City: '#1e4d7a',
                    }
                    const color = levelColors[rep.level] || '#6B6560'
                    return (
                      <Link
                        key={rep.official_id}
                        href={'/officials/' + rep.official_id}
                        className="group flex items-center gap-3 p-3 hover:opacity-80 transition-opacity"
                        style={{ border: '1px solid #dde1e8' }}
                      >
                        <div className="w-10 h-10 flex-shrink-0 overflow-hidden bg-paper">
                          {rep.photo_url ? (
                            <Image src={rep.photo_url} alt="" className="w-full h-full object-cover" width={40} height={40} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: color }}>
                              {rep.official_name?.charAt(0) || '?'}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p style={{  }} className="text-sm truncate">{rep.official_name}</p>
                          <div className="flex items-center gap-2 text-[11px]" style={{ color: "#5c6474" }}>
                            <span className="inline-block w-2 h-2 flex-shrink-0" style={{ backgroundColor: color }} />
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
              <div className="flex items-baseline justify-between mb-1">
                <h2 style={{  }} className="text-xl">Recent Activity</h2>
                <span style={{ color: "#5c6474" }} className="text-[11px]">{actions?.length || 0} actions</span>
              </div>
              <div style={{ borderBottom: '2px dotted ' + '#dde1e8' }} className="mb-4" />
              {(!actions || actions.length === 0) ? (
                <div style={{ border: '1px solid #dde1e8' }} className="p-6 text-center">
                  <p style={{ color: "#5c6474" }}>No activity yet. Start by exploring content and taking action!</p>
                </div>
              ) : (
                <div style={{ border: '1px solid #dde1e8' }}>
                  {actions.map(function (a, i) {
                    return (
                      <div key={a.action_log_id} className="p-3 flex items-center justify-between" style={i > 0 ? { borderTop: '1px solid #dde1e8' } : {}}>
                        <div>
                          <p style={{  }} className="text-sm">{a.target_name || a.action_type_id}</p>
                          {a.action_date && (
                            <p style={{ color: "#5c6474" }} className="text-xs">{new Date(a.action_date).toLocaleDateString()}</p>
                          )}
                        </div>
                        {a.impact_points != null && a.impact_points > 0 && (
                          <span style={{ color: "#1b5e8a" }} className="text-xs font-medium">+{a.impact_points} pts</span>
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
              <div className="flex items-baseline justify-between mb-1">
                <h2 style={{  }} className="text-lg">My Badges</h2>
                <span style={{ color: "#5c6474" }} className="text-[11px]">{userBadges?.length || 0} earned</span>
              </div>
              <div style={{ borderBottom: '2px dotted ' + '#dde1e8' }} className="mb-4" />
              {(!userBadges || userBadges.length === 0) ? (
                <div style={{ border: '1px solid #dde1e8' }} className="p-6 text-center">
                  <p style={{ color: "#5c6474" }} className="text-sm">Complete learning paths and take action to earn badges!</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {userBadges.map(function (ub) {
                    const detail = badgeDetails.find(function (b) { return b.badge_id === ub.badge_id })
                    return (
                      <div key={ub.user_badge_id} className="p-3 text-center" style={{ border: '1px solid #dde1e8' }}>
                        <div
                          className="w-10 h-10 mx-auto mb-2 flex items-center justify-center text-white text-lg"
                          style={{ backgroundColor: detail?.color || '#1b5e8a' }}
                        >
                          {detail?.icon_name ? detail.icon_name.charAt(0).toUpperCase() : 'B'}
                        </div>
                        <p style={{  }} className="text-xs">{detail?.badge_name || 'Badge'}</p>
                        {detail?.points && (
                          <p style={{ color: "#5c6474" }} className="text-xs">{detail.points} pts</p>
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
                <h2 style={{  }} className="text-lg mb-1">Upgrade Your Account</h2>
                <div style={{ borderBottom: '2px dotted ' + '#dde1e8' }} className="mb-4" />
                <div className="p-4 relative overflow-hidden" style={{ border: '2px solid ' + '#dde1e8' }}>
                  <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: '#1b5e8a' }} />
                  <p style={{ color: "#1b5e8a" }} className="text-[10px] uppercase tracking-wider mb-1 pl-2">Community Partner</p>
                  <p style={{  }} className="text-lg pl-2">$100<span className="text-sm" style={{ color: "#5c6474" }}> - $5,000/yr</span></p>
                  <ul className="mt-2 pl-2 space-y-1 text-[12px]" style={{ color: "#5c6474" }}>
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
            <div className="p-4 text-center relative overflow-hidden" style={{ border: '1px solid #dde1e8' }}>
              <Image src="/images/fol/seed-of-life.svg" alt="" width={28} height={28} className="mx-auto mb-2 opacity-30" />
              <p style={{  }} className="text-sm mb-1">Support the Exchange</p>
              <p style={{ color: "#5c6474" }} className="text-[11px] mb-3">Help keep Houston connected. Every dollar strengthens civic infrastructure for all.</p>
              <Link
                href="/donate"
                className="inline-block px-5 py-2 text-white text-sm"
                style={{ background: '#1b5e8a' }}
              >
                Make a Donation
              </Link>
            </div>

            {/* Quick links */}
            <section>
              <h2 style={{  }} className="text-lg mb-1">Quick Links</h2>
              <div style={{ borderBottom: '2px dotted ' + '#dde1e8' }} className="mb-4" />
              <div className="space-y-2">
                <Link href="/compass" className="block p-3 text-sm hover:opacity-80 transition-opacity" style={{ border: '1px solid #dde1e8' }}>
                  My Community Compass
                </Link>
                <Link href="/learn" className="block p-3 text-sm hover:opacity-80 transition-opacity" style={{ border: '1px solid #dde1e8' }}>
                  Browse Learning Paths
                </Link>
                <Link href="/officials" className="block p-3 text-sm hover:opacity-80 transition-opacity" style={{ border: '1px solid #dde1e8' }}>
                  Find My Representatives
                </Link>
                {['neighbor', 'partner', 'admin'].includes(currentRole) && (
                  <Link href="/dashboard/tools-guides" className="block p-3 text-sm hover:opacity-80 transition-opacity" style={{ border: '1px solid #dde1e8' }}>
                    Tools &amp; Guides
                  </Link>
                )}
                {['neighbor', 'partner', 'admin'].includes(currentRole) && (
                  <Link href="/me/submit" className="block p-3 text-sm hover:opacity-80 transition-opacity" style={{ color: "#1b5e8a", border: '2px solid ' + '#dde1e8' }}>
                    Share a Resource
                  </Link>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* ── Footer link ── */}
      <div className="max-w-[900px] mx-auto px-6 pb-10">
        <div style={{ borderTop: '1px solid #dde1e8' }} className="pt-4">
          <Link href="/" style={{ color: "#1b5e8a" }} className="text-sm hover:underline">&larr; Back to Home</Link>
        </div>
      </div>
    </div>
  )
}
