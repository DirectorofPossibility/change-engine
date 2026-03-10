'use client'

/**
 * CompassClient — The personalized community dashboard.
 *
 * Social psychology principles:
 * - Belonging: "Your neighborhood" framing, personalized welcome
 * - Social proof: live stats, activity counts, "X people are engaged"
 * - Progressive disclosure: important stuff first, pathways expand
 * - Reciprocity: "Your community has X for you" → "Here's how you can help"
 * - Identity: pathway colors, archetype hints
 * - Reduced cognitive load: clear sections, visual hierarchy
 */

import { useState } from 'react'
import Link from 'next/link'
import { MapPin, ChevronRight, Phone, Globe, Users, FileText, Calendar, Heart, Building2, ArrowRight } from 'lucide-react'
import { useNeighborhood } from '@/lib/contexts/NeighborhoodContext'
import { FlowerOfLifeIcon } from '@/components/exchange/FlowerIcons'
import { CompassEntry } from '@/components/exchange/CompassEntry'
import { CompassView } from '@/components/exchange/CompassView'
import { ZipInput } from '@/components/exchange/ZipInput'
import { THEMES } from '@/lib/constants'
import type { CompassPreviewData } from '@/lib/types/exchange'
import { SpiralProgress } from '@/components/exchange/SpiralProgress'
import Image from 'next/image'

interface CompassClientProps {
  zip?: string
  stats: any
  pathwayCounts: Record<string, number>
  centerCounts: Record<string, number>
  bridges: Array<[string, string, number]>
  preview: CompassPreviewData
  recentNews: any[]
  nearbyServices: any[]
  nearbyOrgs: any[]
  zipOfficials: any[]
  upcomingEvents: any[]
  themeColors: string[]
}

const themeEntries = Object.entries(THEMES) as [string, { name: string; color: string; slug: string; description: string }][]

function timeAgo(dateStr: string | null) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return 'Just now'
  if (hours < 24) return hours + 'h ago'
  const days = Math.floor(hours / 24)
  if (days < 7) return days + 'd ago'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function CompassClient({
  zip, stats, pathwayCounts, centerCounts, bridges, preview,
  recentNews, nearbyServices, nearbyOrgs, zipOfficials, upcomingEvents, themeColors,
}: CompassClientProps) {
  const { neighborhood, councilDistrict, districtOfficials } = useNeighborhood()
  const [showAllPathways, setShowAllPathways] = useState(false)

  const hasZip = !!zip
  const neighborhoodName = neighborhood?.neighborhood_name || (hasZip ? 'Your Area' : null)
  const totalItems = Object.values(pathwayCounts).reduce(function (sum, n) { return sum + n }, 0)

  return (
    <div>
      {/* ─── HERO ─── */}
      <section className="relative bg-brand-bg overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="flex-1">
              {/* Spectrum bar */}
              <div className="flex h-1 rounded-full overflow-hidden mb-6 max-w-[200px]">
                {themeColors.map(function (color, i) {
                  return <div key={i} className="flex-1" style={{ backgroundColor: color }} />
                })}
              </div>

              {neighborhoodName ? (
                <>
                  <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-brand-muted-light mb-2">Your Community Dashboard</p>
                  <h1 className="text-xl sm:text-2xl font-serif font-bold leading-tight">
                    Welcome to{' '}
                    <span className="text-brand-accent">{neighborhoodName}</span>
                  </h1>
                  <p className="text-base text-brand-muted mt-2 font-serif italic">
                    ZIP {zip}{councilDistrict ? ' — District ' + councilDistrict : ''}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-brand-muted-light mb-2">Community Exchange</p>
                  <h1 className="text-xl sm:text-2xl font-serif font-bold leading-tight">
                    The Compass
                  </h1>
                  <p className="text-sm text-brand-muted mt-2 max-w-xl leading-relaxed">
                    Most people don&rsquo;t know who represents them. That&rsquo;s not their fault. It&rsquo;s a design problem. Enter your address to see every elected official — from City Council to Congress.
                  </p>
                </>
              )}
            </div>

            {/* ZIP input — always visible */}
            <div className="lg:flex-shrink-0 lg:w-[300px]">
              <div className="bg-white rounded-xl border border-brand-border p-4 backdrop-blur-sm">
                <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-muted-light mb-2">
                  {hasZip ? 'Change location' : 'Enter your address — street, city, zip'}
                </p>
                <ZipInput />
                {!hasZip && (
                  <p className="text-[11px] text-brand-muted mt-2">Enter your address above to find your representatives.</p>
                )}
                {hasZip && zipOfficials.length === 0 && nearbyServices.length === 0 && (
                  <p className="text-[11px] text-red-600 mt-2">We couldn&rsquo;t find that address. Try adding your zip code.</p>
                )}
              </div>
            </div>
          </div>

          {/* Stats bar */}
          <div className="mt-5 pt-4 border-t border-brand-border flex flex-wrap items-center gap-6 sm:gap-10">
            <div className="text-center">
              <p className="text-xl sm:text-2xl font-serif font-bold text-brand-accent">{totalItems}</p>
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-muted-light mt-0.5">Resources</p>
            </div>
            {hasZip && zipOfficials.length > 0 && (
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-serif font-bold text-[#805ad5]">{zipOfficials.length}</p>
                <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-muted-light mt-0.5">Your Officials</p>
              </div>
            )}
            {hasZip && nearbyServices.length > 0 && (
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-serif font-bold text-[#38a169]">{nearbyServices.length}</p>
                <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-muted-light mt-0.5">Nearby Services</p>
              </div>
            )}
            <div className="text-center">
              <p className="text-xl sm:text-2xl font-serif font-bold text-[#3182ce]">7</p>
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-muted-light mt-0.5">Topics</p>
            </div>
          </div>
        </div>

        {/* Bottom color bar */}
        <div className="flex h-1">
          {themeColors.map(function (color, i) {
            return <div key={i} className="flex-1" style={{ backgroundColor: color }} />
          })}
        </div>
      </section>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ─── YOUR REPRESENTATIVES ─── */}
        {hasZip && zipOfficials.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-xl font-bold text-brand-text flex items-center gap-2">
                <Building2 size={20} className="text-[#805ad5]" />
                Your Representatives
              </h2>
              <Link href="/officials" className="text-sm text-brand-accent hover:underline flex items-center gap-1">
                View all <ChevronRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {zipOfficials.slice(0, 8).map(function (o: any) {
                const levelColors: Record<string, string> = { Federal: '#805ad5', State: '#3182ce', County: '#38a169', City: '#dd6b20' }
                const ringColor = levelColors[o.level] || '#5A6178'
                return (
                  <Link
                    key={o.official_id}
                    href={'/officials/' + o.official_id}
                    className="bg-white rounded-xl border border-brand-border p-3 hover:border-brand-text transition-all group relative overflow-hidden"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 group-hover:w-1.5 transition-all" style={{ backgroundColor: ringColor }} />
                    <div className="flex items-center gap-2.5 pl-2">
                      <div className="w-10 h-10 rounded-full flex-shrink-0 p-[2px]" style={{ backgroundColor: ringColor }}>
                        {o.photo_url ? (
                          <Image src={o.photo_url} alt="" className="w-full h-full rounded-full object-cover ring-2 ring-white"  width={80} height={80} />
                        ) : (
                          <div className="w-full h-full rounded-full bg-brand-bg flex items-center justify-center ring-2 ring-white">
                            <span className="text-sm font-bold text-brand-muted">{o.official_name?.charAt(0)}</span>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-brand-text group-hover:text-brand-accent transition-colors truncate">{o.official_name}</p>
                        <p className="text-[10px] text-brand-muted truncate">{o.title}</p>
                        <p className="text-[10px] font-mono font-bold uppercase" style={{ color: ringColor }}>{o.level}</p>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* ─── COMMUNITY NEWS ─── */}
        {recentNews.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-xl font-bold text-brand-text flex items-center gap-2">
                <FileText size={20} className="text-[#319795]" />
                Community Pulse
              </h2>
              <Link href="/news" className="text-sm text-brand-accent hover:underline flex items-center gap-1">
                All news <ChevronRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentNews.slice(0, 6).map(function (item: any) {
                const theme = item.pathway_primary ? (THEMES as any)[item.pathway_primary] : null
                return (
                  <Link
                    key={item.id}
                    href={'/content/' + item.id}
                    className="bg-white rounded-xl border border-brand-border overflow-hidden hover:border-brand-text transition-all group"
                  >
                    {item.image_url && (
                      <div className="aspect-[16/9] overflow-hidden">
                        <Image src={item.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"  width={800} height={400} />
                      </div>
                    )}
                    <div className="p-3">
                      <div className="flex items-center gap-2 mb-1">
                        {theme && <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: theme.color }} />}
                        <span className="text-[10px] font-mono text-brand-muted">{timeAgo(item.published_at)}</span>
                        {item.source_domain && <span className="text-[10px] font-mono text-brand-muted">{item.source_domain}</span>}
                      </div>
                      <h3 className="text-sm font-semibold text-brand-text group-hover:text-brand-accent transition-colors line-clamp-2">
                        {item.title_6th_grade}
                      </h3>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* ─── MAIN COLUMN ─── */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* Nearby Services */}
            {hasZip && nearbyServices.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-serif text-xl font-bold text-brand-text flex items-center gap-2">
                    <Heart size={20} className="text-[#38a169]" />
                    Services Near You
                  </h2>
                  <Link href="/services" className="text-sm text-brand-accent hover:underline flex items-center gap-1">
                    All services <ChevronRight size={14} />
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {nearbyServices.map(function (s: any) {
                    return (
                      <Link
                        key={s.service_id}
                        href={'/services/' + s.service_id}
                        className="bg-white rounded-xl border border-brand-border p-4 hover:border-brand-text transition-all group relative overflow-hidden"
                          >
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#38a169] group-hover:w-1.5 transition-all" />
                        <div className="pl-3">
                          <h3 className="font-semibold text-sm text-brand-text group-hover:text-brand-accent transition-colors">{s.service_name}</h3>
                          {s.org_name && <p className="text-[11px] text-brand-muted mt-0.5">{s.org_name}</p>}
                          <div className="flex items-center gap-3 mt-2 text-[11px] text-brand-muted">
                            {s.phone && (
                              <span className="flex items-center gap-1">
                                <Phone size={10} /> {s.phone}
                              </span>
                            )}
                            {s.address && (
                              <span className="flex items-center gap-1">
                                <MapPin size={10} /> {s.city || s.address}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Center entry cards */}
            <section>
              <h2 className="font-serif text-xl font-bold text-brand-text mb-2">
                What brings you here?
              </h2>
              <p className="text-sm text-brand-muted mb-4">Choose your starting point. Every door leads to a full spectrum of resources.</p>
              <CompassEntry centerCounts={centerCounts} />
            </section>

            {/* Pathway visualization */}
            <section>
              <h2 className="font-serif text-xl font-bold text-brand-text mb-2">
                Explore by Pathway
              </h2>
              <p className="text-sm text-brand-muted mb-4">Seven lenses on community life. Each pathway connects resources, services, officials, and news.</p>
              <CompassView pathwayCounts={pathwayCounts} bridges={bridges} preview={preview} />
            </section>

            {/* Opportunities */}
            {upcomingEvents.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-serif text-xl font-bold text-brand-text flex items-center gap-2">
                    <Calendar size={20} className="text-[#3182ce]" />
                    What You Can Do
                  </h2>
                  <Link href="/opportunities" className="text-sm text-brand-accent hover:underline flex items-center gap-1">
                    All opportunities <ChevronRight size={14} />
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {upcomingEvents.map(function (opp: any) {
                    return (
                      <Link
                        key={opp.opportunity_id}
                        href={'/opportunities/' + opp.opportunity_id}
                        className="bg-white rounded-xl border border-brand-border p-4 hover:border-brand-text transition-all group relative overflow-hidden"
                          >
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#3182ce] group-hover:w-1.5 transition-all" />
                        <div className="pl-3">
                          <h3 className="font-semibold text-sm text-brand-text group-hover:text-brand-accent transition-colors">{opp.opportunity_name}</h3>
                          {opp.description_5th_grade && (
                            <p className="text-[11px] text-brand-muted mt-1 line-clamp-2">{opp.description_5th_grade}</p>
                          )}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </section>
            )}
          </div>

          {/* ─── SIDEBAR ─── */}
          <div className="lg:w-[300px] flex-shrink-0 space-y-6">
            {/* Organizations near you */}
            {hasZip && nearbyOrgs.length > 0 && (
              <div className="bg-white rounded-xl border border-brand-border overflow-hidden">
                <div className="p-4 border-b border-brand-border">
                  <h3 className="font-serif text-base font-semibold text-brand-text flex items-center gap-2">
                    <Users size={16} className="text-[#dd6b20]" />
                    Organizations Near You
                  </h3>
                </div>
                <div className="divide-y divide-brand-border">
                  {nearbyOrgs.slice(0, 5).map(function (org: any) {
                    return (
                      <Link
                        key={org.org_id}
                        href={'/organizations/' + org.org_id}
                        className="flex items-center gap-3 p-3 hover:bg-brand-bg/50 transition-colors group"
                      >
                        {org.logo_url ? (
                          <Image src={org.logo_url} alt="" className="w-8 h-8 rounded object-contain bg-brand-bg flex-shrink-0"  width={48} height={32} />
                        ) : (
                          <div className="w-8 h-8 rounded bg-brand-bg flex items-center justify-center flex-shrink-0">
                            <Users size={14} className="text-brand-muted" />
                          </div>
                        )}
                        <p className="text-sm text-brand-text group-hover:text-brand-accent transition-colors line-clamp-1">{org.org_name}</p>
                      </Link>
                    )
                  })}
                </div>
                <div className="p-3 bg-brand-bg/50">
                  <Link href="/organizations" className="text-[12px] font-medium text-brand-accent hover:underline flex items-center gap-1">
                    View all organizations <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            )}

            {/* Quick actions */}
            <div className="bg-white rounded-xl border border-brand-border overflow-hidden">
              <div className="p-4 border-b border-brand-border">
                <h3 className="font-serif text-base font-semibold text-brand-text">Quick Actions</h3>
              </div>
              <div className="p-3 space-y-1.5">
                <Link href="/services" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-brand-text hover:bg-brand-bg hover:text-brand-accent transition-colors">
                  <span className="w-2 h-2 rounded-sm bg-[#38a169]" /> Find Services
                </Link>
                <Link href="/officials" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-brand-text hover:bg-brand-bg hover:text-brand-accent transition-colors">
                  <span className="w-2 h-2 rounded-sm bg-[#805ad5]" /> Your Representatives
                </Link>
                <Link href="/elections" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-brand-text hover:bg-brand-bg hover:text-brand-accent transition-colors">
                  <span className="w-2 h-2 rounded-sm bg-[#e53e3e]" /> Elections & Voting
                </Link>
                <Link href="/library" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-brand-text hover:bg-brand-bg hover:text-brand-accent transition-colors">
                  <span className="w-2 h-2 rounded-sm bg-[#3182ce]" /> Research Library
                </Link>
                <Link href="/chat" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-brand-text hover:bg-brand-bg hover:text-brand-accent transition-colors">
                  <span className="w-2 h-2 rounded-sm bg-[#319795]" /> Ask Chance
                </Link>
                <Link href="/call-your-senators" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-brand-text hover:bg-brand-bg hover:text-brand-accent transition-colors">
                  <span className="w-2 h-2 rounded-sm bg-[#dd6b20]" /> Call Your Senators
                </Link>
              </div>
            </div>

            {/* Spiral Progress */}
            <SpiralProgress variant="full" />

            {/* Pathways at a glance */}
            <div className="bg-white rounded-xl border border-brand-border overflow-hidden">
              <div className="p-4 border-b border-brand-border">
                <h3 className="font-serif text-base font-semibold text-brand-text">Topics</h3>
              </div>
              <div className="p-3 space-y-0.5">
                {themeEntries.map(function ([id, theme]) {
                  const count = pathwayCounts[id] || 0
                  return (
                    <Link
                      key={id}
                      href={'/pathways/' + theme.slug}
                      className="flex items-center justify-between px-2 py-1.5 rounded-md text-[13px] font-medium text-brand-text hover:bg-brand-bg hover:text-brand-accent transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: theme.color }} />
                        {theme.name}
                      </span>
                      {count > 0 && (
                        <span className="text-[10px] font-mono text-brand-muted">{count}</span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Support */}
            <div className="bg-brand-bg/50 rounded-xl border border-brand-border p-4">
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-muted mb-2">Need Help Now?</p>
              <div className="space-y-1 font-mono text-[12px] text-brand-muted">
                <p>Mental Health Crisis: <strong className="text-brand-text">988</strong></p>
                <p>City Services: <strong className="text-brand-text">311</strong></p>
                <p>Social Services: <strong className="text-brand-text">211</strong></p>
                <p>DV Hotline: <strong className="text-brand-text">713-528-2121</strong></p>
              </div>
            </div>

            {/* Donate */}
            <div className="bg-white rounded-xl border border-brand-border p-4 text-center">
              <FlowerOfLifeIcon size={24} className="mx-auto mb-2" />
              <p className="font-serif text-sm font-bold text-brand-text mb-1">Support the Exchange</p>
              <p className="text-[11px] text-brand-muted mb-3">Help us keep Houston connected. Every dollar strengthens civic infrastructure.</p>
              <Link
                href="/donate"
                className="inline-block px-5 py-2 bg-brand-accent text-white rounded-xl text-sm font-semibold hover:bg-brand-accent-hover transition-colors"
              >
                Donate
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
