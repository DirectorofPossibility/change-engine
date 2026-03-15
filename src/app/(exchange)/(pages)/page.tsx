/**
 * @fileoverview Homepage — Interactive community guide.
 *
 * Not a news feed. Not a listserv. A guide that walks you through
 * what's here and invites you to explore based on what you care about.
 *
 * @route GET /
 * @caching ISR with revalidate = 3600
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { cookies } from 'next/headers'
import { getRandomQuote } from '@/lib/data/homepage'
import { getUpcomingEvents } from '@/lib/data/events'
import { getLatestContent } from '@/lib/data/content'
import { THEMES } from '@/lib/constants'
import { FolFallback } from '@/components/ui/FolFallback'
import { HeroSearch } from '@/components/exchange/home/HeroSearch'
import { ArrowRight, MapPin } from 'lucide-react'

/* ── Design Tokens ── */
const INK = '#0d1117'
const DIM = '#5c6474'
const RULE = '#dde1e8'
const ACCENT = '#C75B2A'
const WARM_BG = '#FAF8F5'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'The Change Engine — Your neighborhood field guide',
  description: 'Discover organizations doing incredible work in your community. Access local resources, get involved, and connect.',
}

const CITY_NAMES: Record<string, string> = {
  houston: 'Houston',
  'san-francisco': 'San Francisco',
  berkeley: 'Berkeley',
}

const THEME_LIST = Object.entries(THEMES).map(function ([id, t]) { return { id, ...t } })

function getGreeting(cityName: string): string {
  const hour = new Date().getUTCHours() - 6
  if (hour < 12) return `Good morning, ${cityName}`
  if (hour < 17) return `Good afternoon, ${cityName}`
  return `Good evening, ${cityName}`
}

export default async function ExchangeHomePage() {
  const cookieStore = await cookies()
  const citySlug = cookieStore.get('ce_city')?.value || 'houston'
  const cityName = CITY_NAMES[citySlug] || 'Houston'

  const [latestContent, upcomingEvents, quote] = await Promise.all([
    getLatestContent(6),
    getUpcomingEvents(4),
    getRandomQuote(),
  ])

  const greeting = getGreeting(cityName)
  const featured = (latestContent || []).slice(0, 3) as any[]

  return (
    <div>
      {/* ══════════════════════════════════════════════════════════════════
          HERO — The invitation
         ══════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden" style={{ minHeight: 520 }}>
        <Image src="/images/hero/houston-skyline.jpg" alt="City skyline" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        <div className="relative z-10 max-w-[1200px] mx-auto px-6 py-20 md:py-28 flex flex-col justify-end" style={{ minHeight: 520 }}>
          <p className="font-mono text-sm uppercase tracking-[0.15em] text-white/50 mb-3">The Change Engine</p>
          <h1 className="font-display font-black text-white leading-[1.08] tracking-[-0.02em] mb-5"
            style={{ fontSize: 'clamp(2.4rem, 5.5vw, 3.8rem)' }}
          >
            {greeting}.
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl leading-relaxed">
            We got tired of doomscrolling and binge-watching while the world felt like it was falling apart — so we turned off the screens and walked outside. We started showing up to community meetings, finding mutual aid groups, learning who actually represents us at City Hall. Turns out, there are thousands of people and organizations already doing incredible work in {cityName}. We built this so you can find them too — whether you want to volunteer, learn something new, get help, or just figure out what&apos;s happening in your neighborhood.
          </p>

          <div className="flex flex-col sm:flex-row items-start gap-4 mb-6">
            <div className="max-w-lg flex-1 w-full">
              <HeroSearch />
            </div>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg text-base font-bold text-white transition-all hover:scale-105 flex-shrink-0"
              style={{ background: ACCENT }}
            >
              Explore Your Community
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-10 flex h-[3px]">
          {THEME_LIST.map(function (t) {
            return <div key={t.id} className="flex-1" style={{ background: t.color }} />
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          WHAT BRINGS YOU HERE? — Scenario-based entry points
         ══════════════════════════════════════════════════════════════════ */}
      <section style={{ background: WARM_BG }}>
        <div className="max-w-[1200px] mx-auto px-6 py-14">
          <h2 className="font-display text-3xl md:text-4xl font-black mb-3" style={{ color: INK }}>
            What brings you here?
          </h2>
          <p className="text-lg mb-10 max-w-xl" style={{ color: DIM }}>
            There&apos;s no wrong answer. Pick whatever feels right and start exploring.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* I want to connect */}
            <Link
              href="/calendar"
              className="group relative overflow-hidden rounded-2xl transition-all hover:shadow-xl hover:translate-y-[-3px]"
              style={{ background: 'linear-gradient(135deg, #1a6b56 0%, #2d8f73 100%)', minHeight: 220 }}
            >
              <div className="absolute top-4 right-4 w-24 h-24 rounded-full opacity-10" style={{ background: 'white' }} />
              <div className="absolute bottom-[-20px] right-[-10px] w-40 h-40 rounded-full opacity-5" style={{ background: 'white' }} />
              <div className="relative p-8 flex flex-col justify-between h-full">
                <div>
                  <span className="font-mono text-sm uppercase tracking-[0.15em] text-white/50">Connect</span>
                  <h3 className="font-display text-2xl md:text-3xl font-black text-white mt-2 mb-3 leading-tight">
                    I want to meet people<br />doing good work
                  </h3>
                </div>
                <p className="text-base text-white/70 max-w-sm">
                  Events, workshops, community meetings, and organizations near you. Show up, say hi, find your people.
                </p>
                <div className="flex items-center gap-2 mt-4 text-white/60 group-hover:text-white transition-colors">
                  <span className="text-sm font-semibold">Browse events & organizations</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>

            {/* Access resources */}
            <Link
              href="/services"
              className="group relative overflow-hidden rounded-2xl transition-all hover:shadow-xl hover:translate-y-[-3px]"
              style={{ background: 'linear-gradient(135deg, #0369a1 0%, #0891b2 100%)', minHeight: 220 }}
            >
              <div className="absolute top-4 right-4 w-24 h-24 rounded-full opacity-10" style={{ background: 'white' }} />
              <div className="absolute bottom-[-20px] right-[-10px] w-40 h-40 rounded-full opacity-5" style={{ background: 'white' }} />
              <div className="relative p-8 flex flex-col justify-between h-full">
                <div>
                  <span className="font-mono text-sm uppercase tracking-[0.15em] text-white/50">Explore</span>
                  <h3 className="font-display text-2xl md:text-3xl font-black text-white mt-2 mb-3 leading-tight">
                    Access community<br />resources
                  </h3>
                </div>
                <p className="text-base text-white/70 max-w-sm">
                  Food pantries, legal services, housing programs, counseling, healthcare — local organizations ready to serve your community.
                </p>
                <div className="flex items-center gap-2 mt-4 text-white/60 group-hover:text-white transition-colors">
                  <span className="text-sm font-semibold">Search services near you</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>

            {/* I want to learn */}
            <Link
              href="/resources"
              className="group relative overflow-hidden rounded-2xl transition-all hover:shadow-xl hover:translate-y-[-3px]"
              style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)', minHeight: 220 }}
            >
              <div className="absolute top-4 right-4 w-24 h-24 rounded-full opacity-10" style={{ background: 'white' }} />
              <div className="absolute bottom-[-20px] right-[-10px] w-40 h-40 rounded-full opacity-5" style={{ background: 'white' }} />
              <div className="relative p-8 flex flex-col justify-between h-full">
                <div>
                  <span className="font-mono text-sm uppercase tracking-[0.15em] text-white/50">Learn</span>
                  <h3 className="font-display text-2xl md:text-3xl font-black text-white mt-2 mb-3 leading-tight">
                    I want to learn<br />something new
                  </h3>
                </div>
                <p className="text-base text-white/70 max-w-sm">
                  Toolkits, guides, videos, podcasts, and stories from people doing the work. Go at your own pace.
                </p>
                <div className="flex items-center gap-2 mt-4 text-white/60 group-hover:text-white transition-colors">
                  <span className="text-sm font-semibold">Explore the library</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>

            {/* I want to act */}
            <Link
              href="/action"
              className="group relative overflow-hidden rounded-2xl transition-all hover:shadow-xl hover:translate-y-[-3px]"
              style={{ background: 'linear-gradient(135deg, #b45309 0%, #C75B2A 100%)', minHeight: 220 }}
            >
              <div className="absolute top-4 right-4 w-24 h-24 rounded-full opacity-10" style={{ background: 'white' }} />
              <div className="absolute bottom-[-20px] right-[-10px] w-40 h-40 rounded-full opacity-5" style={{ background: 'white' }} />
              <div className="relative p-8 flex flex-col justify-between h-full">
                <div>
                  <span className="font-mono text-sm uppercase tracking-[0.15em] text-white/50">Take action</span>
                  <h3 className="font-display text-2xl md:text-3xl font-black text-white mt-2 mb-3 leading-tight">
                    I want to make<br />something happen
                  </h3>
                </div>
                <p className="text-base text-white/70 max-w-sm">
                  Know who represents you, track what they&apos;re deciding, volunteer, advocate, or run for something.
                </p>
                <div className="flex items-center gap-2 mt-4 text-white/60 group-hover:text-white transition-colors">
                  <span className="text-sm font-semibold">See your officials & policies</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          THE PULL QUOTE — Breathing room
         ══════════════════════════════════════════════════════════════════ */}
      {quote && (
        <section style={{ background: INK }}>
          <div className="max-w-[800px] mx-auto px-6 py-14 text-center">
            <blockquote className="font-display text-2xl md:text-3xl leading-relaxed italic text-white/90 mb-4">
              &ldquo;{quote.quote_text}&rdquo;
            </blockquote>
            {quote.attribution && (
              <p className="text-base text-white/40">— {quote.attribution}</p>
            )}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          FRESH FROM THE COMMUNITY — A few curated picks, not a feed
         ══════════════════════════════════════════════════════════════════ */}
      {featured.length > 0 && (
        <section className="max-w-[1200px] mx-auto px-6 py-14">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="font-display text-3xl font-black" style={{ color: INK }}>Fresh from the community</h2>
              <p className="text-base mt-1" style={{ color: DIM }}>A few things worth your time this week.</p>
            </div>
            <Link href="/news" className="text-sm font-semibold hover:underline hidden sm:block" style={{ color: ACCENT }}>
              See everything <ArrowRight size={13} className="inline ml-0.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featured.map(function (item: any) {
              const t = THEME_LIST.find(function (th) { return th.id === item.pathway_primary })
              return (
                <Link
                  key={item.id}
                  href={'/content/' + item.id}
                  className="group block rounded-2xl overflow-hidden bg-white transition-all hover:shadow-lg hover:translate-y-[-3px]"
                  style={{ border: `1px solid ${RULE}` }}
                >
                  <div className="relative overflow-hidden" style={{ aspectRatio: '16/10' }}>
                    {item.image_url ? (
                      <Image src={item.image_url} alt="" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                      <FolFallback pathway={item.pathway_primary} size="hero" />
                    )}
                    {t && (
                      <div className="absolute top-3 left-3">
                        <span className="inline-block px-3 py-1 rounded-lg font-mono text-xs uppercase tracking-[0.1em] font-bold text-white"
                          style={{ background: t.color }}
                        >
                          {t.name}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-display text-lg font-black leading-snug mb-2 group-hover:underline" style={{ color: INK }}>
                      {item.title_6th_grade || item.title}
                    </h3>
                    {item.summary_6th_grade && (
                      <p className="text-sm leading-relaxed" style={{ color: DIM }}>
                        {item.summary_6th_grade.length > 75 ? item.summary_6th_grade.slice(0, 75) + '…' : item.summary_6th_grade}
                      </p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>

          <div className="text-center mt-6 sm:hidden">
            <Link href="/news" className="text-sm font-semibold hover:underline" style={{ color: ACCENT }}>
              See everything <ArrowRight size={13} className="inline ml-0.5" />
            </Link>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          THIS WEEK — Upcoming events as timeline
         ══════════════════════════════════════════════════════════════════ */}
      {upcomingEvents && upcomingEvents.length > 0 && (
        <section style={{ background: WARM_BG, borderTop: `1px solid ${RULE}`, borderBottom: `1px solid ${RULE}` }}>
          <div className="max-w-[1200px] mx-auto px-6 py-14">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="font-display text-3xl font-black" style={{ color: INK }}>Coming up this week</h2>
                <p className="text-base mt-1" style={{ color: DIM }}>Show up. That&apos;s the hardest part — and the best part.</p>
              </div>
              <Link href="/calendar" className="text-sm font-semibold hover:underline hidden sm:block" style={{ color: ACCENT }}>
                Full calendar <ArrowRight size={13} className="inline ml-0.5" />
              </Link>
            </div>

            <div className="space-y-4">
              {upcomingEvents.map(function (event: any) {
                const eventDate = new Date(event.date)
                const month = eventDate.toLocaleDateString('en-US', { month: 'short' })
                const day = eventDate.getDate()
                const weekday = eventDate.toLocaleDateString('en-US', { weekday: 'long' })
                return (
                  <Link
                    key={event.id}
                    href={event.href}
                    className="flex items-stretch gap-0 bg-white rounded-2xl overflow-hidden transition-all hover:shadow-lg hover:translate-y-[-2px] group"
                    style={{ border: `1px solid ${RULE}` }}
                  >
                    <div className="w-24 flex-shrink-0 flex flex-col items-center justify-center py-5" style={{ background: INK }}>
                      <span className="font-mono text-xs uppercase tracking-wider font-bold text-white/50">{month}</span>
                      <span className="font-display text-3xl font-black text-white leading-none">{day}</span>
                      <span className="font-mono text-xs text-white/40 mt-0.5">{weekday}</span>
                    </div>
                    <div className="flex-1 py-5 px-6">
                      <h3 className="font-display text-lg font-bold leading-snug group-hover:underline" style={{ color: INK }}>
                        {event.title}
                      </h3>
                      {event.location && (
                        <div className="flex items-center gap-1.5 text-sm mt-2" style={{ color: DIM }}>
                          <MapPin size={14} />
                          <span>{event.location}</span>
                        </div>
                      )}
                    </div>
                    <div className="hidden md:flex items-center pr-6">
                      <ArrowRight size={18} style={{ color: RULE }} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                )
              })}
            </div>

            <div className="text-center mt-6 sm:hidden">
              <Link href="/calendar" className="text-sm font-semibold hover:underline" style={{ color: ACCENT }}>
                Full calendar <ArrowRight size={13} className="inline ml-0.5" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          THE CLOSER — Conversational sign-off
         ══════════════════════════════════════════════════════════════════ */}
      <section style={{ background: INK }}>
        <div className="max-w-[800px] mx-auto px-6 py-16 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-black text-white mb-4 leading-tight">
            You don&apos;t have to do everything.<br />
            Just start somewhere.
          </h2>
          <p className="text-lg text-white/60 mb-8 max-w-lg mx-auto">
            Pick one event. Read one guide. Look up one official. That&apos;s how it starts — and it&apos;s more than enough.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/search"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-base font-bold text-white transition-all hover:scale-105"
              style={{ background: ACCENT }}
            >
              Search everything
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-base font-semibold text-white/60 hover:text-white transition-colors border border-white/20"
            >
              About The Change Engine
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
