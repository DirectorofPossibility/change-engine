import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { THEMES } from '@/lib/constants'
import { Geo } from '@/components/geo/sacred'
import {
  Heart, Building2, HandHeart, LifeBuoy, Phone,
  ArrowRight, ChevronRight, Sparkles, MapPin, Users,
  AlertTriangle,
} from 'lucide-react'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Resource Center — Change Engine',
  description: 'Services, opportunities, and support systems ready for Houston families. Everything here already exists — we just made it findable.',
}

const THEME_LIST = Object.entries(THEMES).map(([id, t]) => ({ id, ...t }))

export default async function ResourceCenterPage() {
  const supabase = await createClient()

  const [
    servicesResult,
    opportunitiesResult,
    situationsResult,
    orgsResult,
    featuredServices,
    featuredOpps,
    lifeSituations,
  ] = await Promise.all([
    supabase.from('services_211').select('service_id', { count: 'exact', head: true }).eq('is_active', 'Yes'),
    supabase.from('opportunities').select('opportunity_id', { count: 'exact', head: true }).eq('is_active', 'Yes' as any),
    supabase.from('life_situations').select('situation_id', { count: 'exact', head: true }),
    supabase.from('organizations').select('org_id', { count: 'exact', head: true }),
    supabase
      .from('services_211')
      .select('service_id, service_name, description_5th_grade, phone, city, org_id')
      .eq('is_active', 'Yes')
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('opportunities')
      .select('opportunity_id, opportunity_name, description_5th_grade, city, is_virtual, start_date')
      .eq('is_active', 'Yes' as any)
      .order('start_date', { ascending: true })
      .limit(4),
    supabase
      .from('life_situations')
      .select('situation_id, situation_name, description, icon_name, urgency_level, slug')
      .order('urgency_level', { ascending: true })
      .limit(8),
  ])

  const servicesCount = servicesResult.count || 0
  const oppsCount = opportunitiesResult.count || 0
  const situationsCount = situationsResult.count || 0
  const orgsCount = orgsResult.count || 0
  const services = featuredServices.data || []
  const opportunities = featuredOpps.data || []
  const situations = lifeSituations.data || []

  const urgencyColors: Record<number, string> = {
    1: '#dc2626',
    2: '#ea580c',
    3: '#ca8a04',
    4: '#16a34a',
    5: '#2563eb',
  }

  return (
    <div className="min-h-screen" style={{ background: '#FAF9F6' }}>

      {/* ── HERO — Epic FOL ── */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(170deg, #F0EDE6 0%, #E8E4DB 40%, #DDD8CE 100%)' }}>

        {/* Giant Seed of Life FOL */}
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
            <span style={{ color: '#3A3A35' }}>Resource Center</span>
          </nav>

          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 flex items-center justify-center" style={{ background: '#16a34a' }}>
                <Heart size={20} color="white" />
              </div>
              <p className="text-[11px] uppercase tracking-[0.2em] font-semibold" style={{ color: '#16a34a' }}>
                Resource Center
              </p>
            </div>

            <h1 className="font-serif text-[clamp(2.2rem,5vw,3.5rem)] leading-[1.08] mb-5" style={{ color: '#2D2D2A' }}>
              What&rsquo;s available to you &mdash; <span style={{ color: '#6B6560' }}>and how to access it.</span>
            </h1>
            <p className="text-[17px] leading-relaxed max-w-xl" style={{ color: '#6B6560' }}>
              Services, organizations, opportunities, and support systems already in place across Houston. Everything here exists — we just made it findable.
            </p>

            <div className="flex items-center gap-5 mt-8 flex-wrap">
              {[
                { n: servicesCount.toLocaleString(), label: 'services' },
                { n: orgsCount.toLocaleString(), label: 'organizations' },
                { n: oppsCount.toLocaleString(), label: 'opportunities' },
                { n: situationsCount.toLocaleString(), label: 'life situations' },
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

        {/* ═══ LIFE SITUATIONS — urgency-organized ═══ */}
        <section className="py-12">
          <div className="flex items-end justify-between mb-6">
            <div className="flex items-center gap-3">
              <LifeBuoy size={20} style={{ color: '#16a34a' }} />
              <div>
                <h2 className="font-serif text-2xl" style={{ color: '#2D2D2A' }}>Start From Your Situation</h2>
                <p className="text-[13px]" style={{ color: '#9B9590' }}>Every situation has resources ready &mdash; here is what exists for yours</p>
              </div>
            </div>
            <Link href="/help" className="hidden sm:inline-flex items-center gap-1 text-[13px] font-semibold" style={{ color: '#16a34a' }}>
              All situations <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {situations.map(function (s: any) {
              const color = urgencyColors[s.urgency_level] || '#16a34a'
              return (
                <Link
                  key={s.situation_id}
                  href={'/help/' + (s.slug || s.situation_id)}
                  className="relative bg-white border overflow-hidden transition-all hover:shadow-lg hover:translate-y-[-2px] group"
                  style={{ borderColor: '#E2DDD5' }}
                >
                  <div className="h-1" style={{ background: color }} />
                  <div className="p-4">
                    <div className="w-10 h-10 mb-3 flex items-center justify-center" style={{ background: `${color}10` }}>
                      {s.urgency_level === 1 ? (
                        <AlertTriangle size={20} style={{ color }} />
                      ) : (
                        <HandHeart size={20} style={{ color }} />
                      )}
                    </div>
                    <h4 className="text-[13px] font-bold leading-tight line-clamp-2 group-hover:underline" style={{ color: '#2D2D2A' }}>
                      {s.situation_name}
                    </h4>
                    {s.description && (
                      <p className="text-[11px] mt-1.5 line-clamp-2 leading-relaxed" style={{ color: '#9B9590' }}>
                        {s.description.length > 80 ? s.description.slice(0, 80) + '...' : s.description}
                      </p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Crisis bar */}
          <div className="mt-4 p-4 flex items-center justify-between flex-wrap gap-3" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
            <div className="flex items-center gap-2">
              <Phone size={14} style={{ color: '#dc2626' }} />
              <span className="text-[12px] font-semibold" style={{ color: '#dc2626' }}>Always Available</span>
            </div>
            <div className="flex items-center gap-5 text-[12px]" style={{ color: '#6B6560' }}>
              <span>24/7 Support: <strong style={{ color: '#2D2D2A' }}>988</strong></span>
              <span>City: <strong style={{ color: '#2D2D2A' }}>311</strong></span>
              <span>Social: <strong style={{ color: '#2D2D2A' }}>211</strong></span>
              <span>DV: <strong style={{ color: '#2D2D2A' }}>713-528-2121</strong></span>
            </div>
          </div>
        </section>

        <hr className="border-0 h-px" style={{ background: 'linear-gradient(to right, #E2DDD5, rgba(226,221,213,0.3))' }} />

        {/* ═══ SERVICES — featured ═══ */}
        <section className="py-12">
          <div className="flex items-end justify-between mb-6">
            <div className="flex items-center gap-3">
              <Building2 size={20} style={{ color: '#16a34a' }} />
              <div>
                <h2 className="font-serif text-2xl" style={{ color: '#2D2D2A' }}>Services Directory</h2>
                <p className="text-[13px]" style={{ color: '#9B9590' }}>{servicesCount.toLocaleString()} services &middot; food, housing, healthcare, legal aid, and more</p>
              </div>
            </div>
            <Link href="/services" className="hidden sm:inline-flex items-center gap-1 text-[13px] font-semibold" style={{ color: '#16a34a' }}>
              All services <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {services.map(function (svc: any) {
              return (
                <Link
                  key={svc.service_id}
                  href={'/services/' + svc.service_id}
                  className="bg-white border p-4 transition-all hover:shadow-md group"
                  style={{ borderColor: '#E2DDD5', borderLeft: '3px solid #16a34a' }}
                >
                  <h4 className="text-[14px] font-bold leading-snug line-clamp-2 group-hover:underline" style={{ color: '#2D2D2A' }}>
                    {svc.service_name}
                  </h4>
                  {svc.description_5th_grade && (
                    <p className="text-[12px] mt-1.5 line-clamp-2 leading-relaxed" style={{ color: '#6B6560' }}>
                      {svc.description_5th_grade.length > 120 ? svc.description_5th_grade.slice(0, 120) + '...' : svc.description_5th_grade}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-[11px]" style={{ color: '#9B9590' }}>
                    {svc.city && <span className="flex items-center gap-1"><MapPin size={10} /> {svc.city}</span>}
                    {svc.phone && <span className="flex items-center gap-1"><Phone size={10} /> {svc.phone}</span>}
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Search CTA */}
          <Link
            href="/services"
            className="mt-4 flex items-center justify-center gap-3 p-4 border-2 transition-all hover:shadow-md"
            style={{ borderColor: '#16a34a', background: '#f0fdf4' }}
          >
            <MapPin size={18} style={{ color: '#16a34a' }} />
            <span className="text-[14px] font-bold" style={{ color: '#16a34a' }}>Search All Services</span>
            <span className="text-[12px]" style={{ color: '#6B6560' }}>Explore what is available near you by ZIP code</span>
            <ArrowRight size={14} style={{ color: '#16a34a' }} className="ml-auto" />
          </Link>
        </section>

        <hr className="border-0 h-px" style={{ background: 'linear-gradient(to right, #E2DDD5, rgba(226,221,213,0.3))' }} />

        {/* ═══ OPPORTUNITIES + TOOLS ═══ */}
        <section className="py-12">
          <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-8">

            {/* Opportunities */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <Users size={18} style={{ color: '#16a34a' }} />
                  <h2 className="font-serif text-xl" style={{ color: '#2D2D2A' }}>Opportunities</h2>
                </div>
                <Link href="/opportunities" className="text-[12px] font-semibold" style={{ color: '#16a34a' }}>All opportunities <ChevronRight size={12} className="inline" /></Link>
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
                      <div className="w-14 h-14 flex-shrink-0 flex items-center justify-center" style={{ background: '#f0fdf4' }}>
                        <Geo type="seed_of_life" color="#16a34a" opacity={0.4} />
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

            {/* Quick tools */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <Sparkles size={18} style={{ color: '#16a34a' }} />
                <h2 className="font-serif text-xl" style={{ color: '#2D2D2A' }}>Explore More</h2>
              </div>
              <div className="space-y-3">
                <Link href="/organizations" className="block bg-white border p-4 transition-all hover:shadow-md group" style={{ borderColor: '#E2DDD5' }}>
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 flex items-center justify-center flex-shrink-0" style={{ background: '#f0fdf4' }}>
                      <Building2 size={24} style={{ color: '#16a34a' }} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-[15px] font-bold group-hover:underline" style={{ color: '#2D2D2A' }}>Organizations</h3>
                      <p className="text-[12px] mt-1 leading-relaxed" style={{ color: '#6B6560' }}>
                        {orgsCount.toLocaleString()} nonprofits, agencies, and community groups serving Houston.
                      </p>
                    </div>
                  </div>
                </Link>

                <Link href="/geography" className="block bg-white border p-4 transition-all hover:shadow-md group" style={{ borderColor: '#E2DDD5' }}>
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 flex items-center justify-center flex-shrink-0" style={{ background: '#eff6ff' }}>
                      <MapPin size={24} style={{ color: '#2563eb' }} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-[15px] font-bold group-hover:underline" style={{ color: '#2D2D2A' }}>Geography Explorer</h3>
                      <p className="text-[12px] mt-1 leading-relaxed" style={{ color: '#6B6560' }}>
                        Interactive maps of neighborhoods, districts, and boundaries. See what is around you.
                      </p>
                    </div>
                  </div>
                </Link>

                <Link href="/chat" className="block bg-white border p-4 transition-all hover:shadow-md group" style={{ borderColor: '#E2DDD5' }}>
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 flex items-center justify-center flex-shrink-0" style={{ background: '#fef3c7' }}>
                      <HandHeart size={24} style={{ color: '#92400e' }} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-[15px] font-bold group-hover:underline" style={{ color: '#2D2D2A' }}>Ask Chance</h3>
                      <p className="text-[12px] mt-1 leading-relaxed" style={{ color: '#6B6560' }}>
                        Share your situation with our AI guide — discover services, organizations, and next steps already available to you.
                      </p>
                      <span className="inline-flex items-center gap-1.5 mt-2 text-[11px] font-semibold" style={{ color: '#16a34a' }}>
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full rounded-full opacity-40 animate-ping" style={{ background: '#16a34a' }} />
                          <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: '#16a34a' }} />
                        </span>
                        Online now
                      </span>
                    </div>
                  </div>
                </Link>

                <Link href="/compass" className="block border-2 p-4 transition-all hover:shadow-md group" style={{ borderColor: '#16a34a', background: '#f0fdf8' }}>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 flex items-center justify-center flex-shrink-0" style={{ background: '#16a34a' }}>
                      <Sparkles size={24} color="white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-[15px] font-bold group-hover:underline" style={{ color: '#16a34a' }}>Use the Compass</h3>
                      <p className="text-[12px] mt-1 leading-relaxed" style={{ color: '#6B6560' }}>
                        Pick your topics, enter your ZIP — get a personalized guide to everything available to you.
                      </p>
                    </div>
                    <ArrowRight size={18} style={{ color: '#16a34a' }} className="flex-shrink-0" />
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
              Everything here already exists. We just made it findable.
            </p>
            <p className="text-[13px] mt-2 relative z-10 max-w-md mx-auto" style={{ color: '#6B6560' }}>
              Houston has a deep network of services and organizations dedicated to your well-being. Start from your situation, or explore by topic.
            </p>
            <div className="flex items-center justify-center gap-3 mt-6 relative z-10 flex-wrap">
              <Link href="/help" className="inline-flex items-center gap-2 px-6 py-2.5 text-[13px] font-semibold text-white transition-all hover:shadow-md" style={{ background: '#16a34a' }}>
                Find Resources <ArrowRight size={14} />
              </Link>
              <Link href="/services" className="inline-flex items-center gap-2 px-6 py-2.5 text-[13px] font-semibold border transition-all hover:shadow-md bg-white" style={{ color: '#2D2D2A', borderColor: '#E2DDD5' }}>
                Browse services <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
