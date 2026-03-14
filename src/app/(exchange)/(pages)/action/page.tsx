import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { THEMES } from '@/lib/constants'
import { Geo } from '@/components/geo/sacred'
import { FolFallback } from '@/components/ui/FolFallback'
import {
  Shield, Users, Vote, Landmark, Scale, Phone,
  ArrowRight, ChevronRight, Sparkles, Calendar, MapPin,
} from 'lucide-react'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Action Center — Change Engine',
  description: 'Know who represents you, what policies affect you, and when to show up. Democracy works when people show up.',
}

const THEME_LIST = Object.entries(THEMES).map(([id, t]) => ({ id, ...t }))

export default async function ActionCenterPage() {
  const supabase = await createClient()

  const [
    officialsResult,
    policiesResult,
    electionsResult,
    featuredOfficials,
    recentPolicies,
    upcomingOpps,
  ] = await Promise.all([
    supabase.from('elected_officials').select('official_id', { count: 'exact', head: true }),
    supabase.from('policies').select('policy_id', { count: 'exact', head: true }).eq('is_published', true),
    supabase.from('elections').select('election_id', { count: 'exact', head: true }).eq('is_active', 'Yes' as any),
    supabase
      .from('elected_officials')
      .select('official_id, official_name, title, party, level, photo_url')
      .order('level', { ascending: true })
      .limit(8),
    supabase
      .from('policies')
      .select('policy_id, policy_name, title_6th_grade, level, status, bill_number')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('opportunities')
      .select('opportunity_id, opportunity_name, description_5th_grade, city, is_virtual, start_date, org_id')
      .eq('is_active', 'Yes' as any)
      .order('start_date', { ascending: true })
      .limit(4),
  ])

  const officialsCount = officialsResult.count || 0
  const policiesCount = policiesResult.count || 0
  const electionsCount = electionsResult.count || 0
  const officials = featuredOfficials.data || []
  const policies = recentPolicies.data || []
  const opportunities = upcomingOpps.data || []

  const levelColors: Record<string, string> = {
    Federal: '#1e3a5f',
    State: '#4a2870',
    County: '#7a2018',
    City: '#16a34a',
  }

  return (
    <div className="min-h-screen" style={{ background: '#FAF9F6' }}>

      {/* ── HERO — Epic FOL ── */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(170deg, #F0EDE6 0%, #E8E4DB 40%, #DDD8CE 100%)' }}>

        {/* Giant Compass Rose FOL */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
          <svg viewBox="0 0 800 800" className="w-[900px] h-[900px]" style={{ opacity: 0.06 }}>
            {Array.from({ length: 12 }, (_, i) => {
              const angle = (i * 30 - 90) * Math.PI / 180
              const cx = 400 + 116 * Math.sqrt(3) * Math.cos(angle)
              const cy = 400 + 116 * Math.sqrt(3) * Math.sin(angle)
              return <circle key={'L3-' + i} cx={cx} cy={cy} r={116} stroke="#6B6560" strokeWidth="1.5" fill="none" />
            })}
            {Array.from({ length: 6 }, (_, i) => {
              const angle = (i * 60 - 90) * Math.PI / 180
              const cx = 400 + 116 * Math.cos(angle)
              const cy = 400 + 116 * Math.sin(angle)
              return <circle key={'L2-' + i} cx={cx} cy={cy} r={116} stroke="#6B6560" strokeWidth="2" fill="none" />
            })}
            <circle cx={400} cy={400} r={116} stroke="#6B6560" strokeWidth="2" fill="none" />
            <circle cx={400} cy={400} r={350} stroke="#6B6560" strokeWidth="1" fill="none" opacity="0.5" />
          </svg>
        </div>

        {/* Pathway-colored accent dots */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
          <svg viewBox="0 0 800 800" className="w-[900px] h-[900px]">
            {THEME_LIST.slice(0, 6).map((t, i) => {
              const angle = (i * 60 - 90) * Math.PI / 180
              return <circle key={'dot-' + i} cx={400 + 95 * Math.cos(angle)} cy={400 + 95 * Math.sin(angle)} r={6} fill={t.color} opacity="0.25" />
            })}
            <circle cx={400} cy={400} r={6} fill={THEME_LIST[6]?.color || '#1a3460'} opacity="0.25" />
          </svg>
        </div>

        <div className="relative z-10 max-w-[1060px] mx-auto px-6 pt-10 pb-14 sm:pt-14 sm:pb-20">
          <nav className="text-[11px] tracking-wide mb-8" style={{ color: '#9B9590' }}>
            <Link href="/" className="hover:underline" style={{ color: '#6B6560' }}>Home</Link>
            <span className="mx-2">/</span>
            <span style={{ color: '#3A3A35' }}>Action Center</span>
          </nav>

          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 flex items-center justify-center" style={{ background: '#dc2626' }}>
                <Shield size={20} color="white" />
              </div>
              <p className="text-[11px] uppercase tracking-[0.2em] font-semibold" style={{ color: '#dc2626' }}>
                Action Center
              </p>
            </div>

            <h1 className="font-serif text-[clamp(2.2rem,5vw,3.5rem)] leading-[1.08] mb-5" style={{ color: '#2D2D2A' }}>
              Your government, <span style={{ color: '#6B6560' }}>organized and accountable.</span>
            </h1>
            <p className="text-[17px] leading-relaxed max-w-xl" style={{ color: '#6B6560' }}>
              Every elected official, every policy, every election — tracked from City Hall to Congress. Know who represents you and what they&apos;re deciding.
            </p>

            <div className="flex items-center gap-5 mt-8 flex-wrap">
              {[
                { n: officialsCount.toLocaleString(), label: 'officials' },
                { n: policiesCount.toLocaleString(), label: 'policies tracked' },
                { n: electionsCount.toLocaleString(), label: 'elections' },
                { n: '4', label: 'levels of gov' },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  {i > 0 && <div className="w-px h-5" style={{ background: '#D5D0CA' }} />}
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-serif text-2xl font-bold" style={{ color: '#2D2D2A' }}>{s.n}</span>
                    <span className="text-[12px]" style={{ color: '#9B9590' }}>{s.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex h-1">
          {THEME_LIST.map(t => <div key={t.id} className="flex-1" style={{ background: t.color }} />)}
        </div>
      </section>

      <div className="max-w-[1060px] mx-auto px-6">

        {/* ═══ WHO REPRESENTS YOU — officials grid ═══ */}
        <section className="py-12">
          <div className="flex items-end justify-between mb-6">
            <div className="flex items-center gap-3">
              <Users size={20} style={{ color: '#dc2626' }} />
              <div>
                <h2 className="font-serif text-2xl" style={{ color: '#2D2D2A' }}>Who Represents You</h2>
                <p className="text-[13px]" style={{ color: '#9B9590' }}>{officialsCount.toLocaleString()} elected officials &middot; city to Congress</p>
              </div>
            </div>
            <Link href="/officials" className="hidden sm:inline-flex items-center gap-1 text-[13px] font-semibold" style={{ color: '#dc2626' }}>
              All officials <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {officials.map(function (o: any) {
              const color = levelColors[o.level] || '#1b5e8a'
              return (
                <Link
                  key={o.official_id}
                  href={'/officials/' + o.official_id}
                  className="bg-white border overflow-hidden transition-all hover:shadow-lg hover:translate-y-[-2px] group"
                  style={{ borderColor: '#E2DDD5' }}
                >
                  <div className="h-1" style={{ background: color }} />
                  <div className="p-4 text-center">
                    {o.photo_url ? (
                      <Image src={o.photo_url} alt="" width={64} height={64} className="w-16 h-16 mx-auto object-cover border border-rule mb-3" />
                    ) : (
                      <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center" style={{ background: `${color}15` }}>
                        <span className="font-serif text-xl font-bold" style={{ color }}>{o.official_name?.[0]}</span>
                      </div>
                    )}
                    <h4 className="text-[13px] font-bold leading-tight line-clamp-2 group-hover:underline" style={{ color: '#2D2D2A' }}>
                      {o.official_name}
                    </h4>
                    <p className="text-[11px] mt-1 line-clamp-1" style={{ color: '#9B9590' }}>{o.title}</p>
                    <span className="inline-block mt-2 text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5" style={{ color, background: `${color}10` }}>
                      {o.level}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Quick action: Find my reps */}
          <Link
            href="/officials/lookup"
            className="mt-4 flex items-center justify-center gap-3 p-4 border-2 transition-all hover:shadow-md group"
            style={{ borderColor: '#dc2626', background: '#fef2f2' }}
          >
            <MapPin size={18} style={{ color: '#dc2626' }} />
            <span className="text-[14px] font-bold" style={{ color: '#dc2626' }}>Find My Representatives</span>
            <span className="text-[12px]" style={{ color: '#6B6560' }}>Enter your address to see who represents you</span>
            <ArrowRight size={14} style={{ color: '#dc2626' }} className="ml-auto" />
          </Link>
        </section>

        <hr className="border-0 h-px" style={{ background: 'linear-gradient(to right, #E2DDD5, rgba(226,221,213,0.3))' }} />

        {/* ═══ POLICIES — latest tracked ═══ */}
        <section className="py-12">
          <div className="flex items-end justify-between mb-6">
            <div className="flex items-center gap-3">
              <Scale size={20} style={{ color: '#dc2626' }} />
              <div>
                <h2 className="font-serif text-2xl" style={{ color: '#2D2D2A' }}>Policy Tracker</h2>
                <p className="text-[13px]" style={{ color: '#9B9590' }}>{policiesCount.toLocaleString()} policies &middot; explained at 6th-grade reading level</p>
              </div>
            </div>
            <Link href="/policies" className="hidden sm:inline-flex items-center gap-1 text-[13px] font-semibold" style={{ color: '#dc2626' }}>
              All policies <ArrowRight size={14} />
            </Link>
          </div>

          <div className="space-y-0">
            {policies.map(function (p: any, i: number) {
              const color = levelColors[p.level] || '#1b5e8a'
              return (
                <Link
                  key={p.policy_id}
                  href={'/policies/' + p.policy_id}
                  className="flex items-start gap-4 p-4 bg-white border-b transition-colors hover:bg-gray-50 group"
                  style={{ borderColor: '#E2DDD5', borderLeft: `3px solid ${color}` }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {p.bill_number && <span className="text-[10px] font-mono font-semibold" style={{ color }}>{p.bill_number}</span>}
                      <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5" style={{ color, background: `${color}10` }}>{p.level}</span>
                      {p.status && <span className="text-[10px]" style={{ color: '#9B9590' }}>&middot; {p.status}</span>}
                    </div>
                    <h4 className="text-[14px] font-bold leading-snug line-clamp-2 group-hover:underline" style={{ color: '#2D2D2A' }}>
                      {p.title_6th_grade || p.policy_name}
                    </h4>
                  </div>
                  <ChevronRight size={16} className="flex-shrink-0 mt-2 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#9B9590' }} />
                </Link>
              )
            })}
          </div>
        </section>

        <hr className="border-0 h-px" style={{ background: 'linear-gradient(to right, #E2DDD5, rgba(226,221,213,0.3))' }} />

        {/* ═══ ELECTIONS + QUICK ACTIONS ═══ */}
        <section className="py-12">
          <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-8">

            {/* Upcoming opportunities to participate */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <Calendar size={18} style={{ color: '#dc2626' }} />
                  <h2 className="font-serif text-xl" style={{ color: '#2D2D2A' }}>Ways to Participate</h2>
                </div>
                <Link href="/opportunities" className="text-[12px] font-semibold" style={{ color: '#dc2626' }}>All opportunities <ChevronRight size={12} className="inline" /></Link>
              </div>
              <div className="space-y-3">
                {opportunities.length > 0 ? opportunities.map(function (opp: any) {
                  return (
                    <Link
                      key={opp.opportunity_id}
                      href={'/opportunities/' + opp.opportunity_id}
                      className="flex gap-4 bg-white border p-4 transition-all hover:shadow-md group"
                      style={{ borderColor: '#E2DDD5' }}
                    >
                      <div className="w-14 h-14 flex-shrink-0 flex items-center justify-center" style={{ background: '#fef2f2' }}>
                        <Geo type="compass_rose" color="#dc2626" opacity={0.4} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[14px] font-bold leading-snug line-clamp-2 group-hover:underline" style={{ color: '#2D2D2A' }}>{opp.opportunity_name}</h4>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          {opp.city && <span className="text-[11px]" style={{ color: '#9B9590' }}>{opp.city}</span>}
                          {opp.is_virtual && <span className="text-[10px] font-mono px-1.5 py-0.5 border border-rule">Virtual</span>}
                          {opp.start_date && <span className="text-[11px]" style={{ color: '#9B9590' }}>{new Date(opp.start_date).toLocaleDateString()}</span>}
                        </div>
                      </div>
                      <ChevronRight size={16} className="flex-shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#9B9590' }} />
                    </Link>
                  )
                }) : (
                  <div className="bg-white border p-6 text-center" style={{ borderColor: '#E2DDD5' }}>
                    <p className="text-[14px]" style={{ color: '#6B6560' }}>Upcoming opportunities coming soon.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick action tools */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <Sparkles size={18} style={{ color: '#dc2626' }} />
                <h2 className="font-serif text-xl" style={{ color: '#2D2D2A' }}>Quick Actions</h2>
              </div>
              <div className="space-y-3">
                <Link href="/elections" className="block bg-white border p-4 transition-all hover:shadow-md group" style={{ borderColor: '#E2DDD5' }}>
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 flex items-center justify-center flex-shrink-0" style={{ background: '#fef2f2' }}>
                      <Vote size={24} style={{ color: '#dc2626' }} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-[15px] font-bold group-hover:underline" style={{ color: '#2D2D2A' }}>Elections &amp; Voting</h3>
                      <p className="text-[12px] mt-1 leading-relaxed" style={{ color: '#6B6560' }}>
                        Upcoming elections, ballot info, polling locations, and registration deadlines.
                      </p>
                      {electionsCount > 0 && <span className="text-[11px] font-mono mt-1.5 block" style={{ color: '#9B9590' }}>{electionsCount} active</span>}
                    </div>
                  </div>
                </Link>

                <Link href="/call-your-senators" className="block bg-white border p-4 transition-all hover:shadow-md group" style={{ borderColor: '#E2DDD5' }}>
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 flex items-center justify-center flex-shrink-0" style={{ background: '#f0fdf4' }}>
                      <Phone size={24} style={{ color: '#16a34a' }} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-[15px] font-bold group-hover:underline" style={{ color: '#2D2D2A' }}>Call Your Senators</h3>
                      <p className="text-[12px] mt-1 leading-relaxed" style={{ color: '#6B6560' }}>
                        Script and contact info ready to go. Make your voice heard in under 5 minutes.
                      </p>
                    </div>
                  </div>
                </Link>

                <Link href="/governance" className="block bg-white border p-4 transition-all hover:shadow-md group" style={{ borderColor: '#E2DDD5' }}>
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 flex items-center justify-center flex-shrink-0" style={{ background: '#eff6ff' }}>
                      <Landmark size={24} style={{ color: '#2563eb' }} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-[15px] font-bold group-hover:underline" style={{ color: '#2D2D2A' }}>Governance Explorer</h3>
                      <p className="text-[12px] mt-1 leading-relaxed" style={{ color: '#6B6560' }}>
                        How Houston is governed — from city council to federal agencies. Interactive maps and org charts.
                      </p>
                    </div>
                  </div>
                </Link>

                <Link href="/compass" className="block border-2 p-4 transition-all hover:shadow-md group" style={{ borderColor: '#dc2626', background: '#fef8f8' }}>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 flex items-center justify-center flex-shrink-0" style={{ background: '#dc2626' }}>
                      <Sparkles size={24} color="white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-[15px] font-bold group-hover:underline" style={{ color: '#dc2626' }}>Use the Compass</h3>
                      <p className="text-[12px] mt-1 leading-relaxed" style={{ color: '#6B6560' }}>
                        Find your representatives, policies, and civic opportunities — personalized to your ZIP.
                      </p>
                    </div>
                    <ArrowRight size={18} style={{ color: '#dc2626' }} className="flex-shrink-0" />
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ CLOSING ═══ */}
        <section className="py-8 mb-10">
          <div className="relative overflow-hidden p-8 sm:p-10 text-center" style={{ background: 'linear-gradient(135deg, #F0EDE6, #E8E4DB)', border: '1px solid #E2DDD5' }}>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
              <svg viewBox="0 0 200 200" className="w-[280px] h-[280px]" style={{ opacity: 0.04 }}>
                {Array.from({ length: 7 }, (_, i) => {
                  const angle = (i * 60 - 90) * Math.PI / 180
                  const cx = 100 + (i === 6 ? 0 : 30 * Math.cos(angle))
                  const cy = 100 + (i === 6 ? 0 : 30 * Math.sin(angle))
                  return <circle key={i} cx={cx} cy={cy} r={30} stroke="#6B6560" strokeWidth="1.5" fill="none" />
                })}
              </svg>
            </div>
            <p className="font-serif text-xl relative z-10" style={{ color: '#2D2D2A' }}>
              Democracy works when people show up.
            </p>
            <p className="text-[13px] mt-2 relative z-10 max-w-md mx-auto" style={{ color: '#6B6560' }}>
              Every official tracked, every policy explained, every election covered — because civic power belongs to you.
            </p>
            <div className="flex items-center justify-center gap-3 mt-6 relative z-10 flex-wrap">
              <Link href="/officials/lookup" className="inline-flex items-center gap-2 px-6 py-2.5 text-[13px] font-semibold text-white transition-all hover:shadow-md" style={{ background: '#dc2626' }}>
                Find My Reps <ArrowRight size={14} />
              </Link>
              <Link href="/policies" className="inline-flex items-center gap-2 px-6 py-2.5 text-[13px] font-semibold border transition-all hover:shadow-md bg-white" style={{ color: '#2D2D2A', borderColor: '#E2DDD5' }}>
                Browse policies <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
