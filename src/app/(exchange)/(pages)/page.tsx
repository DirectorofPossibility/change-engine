/**
 * @fileoverview Homepage — The Cover of the Field Guide
 *
 * Think: Lonely Planet destination page meets Eater city guide.
 * Big photography, narrative voice, warm invitation, layered disclosure.
 * NOT a database. NOT a dashboard. A guide you want to pick up.
 *
 * @route GET /
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { THEMES } from '@/lib/constants'
import { resolveUserGeo, getPathwayCounts } from '@/lib/data/entity-graph'

export const metadata: Metadata = {
  title: 'Change Engine — A Field Guide to Greater Houston',
  description: 'Discover 10,000+ free civic resources from 1,800+ organizations across Greater Houston.',
}

export const dynamic = 'force-dynamic'

const PATHWAYS = Object.entries(THEMES).map(([id, t]) => ({
  id, name: t.name, slug: t.slug, color: t.color, description: t.description,
}))

/** Narrative descriptions for pathways — asset-based, warm, human */
const PATHWAY_VOICE: Record<string, { headline: string; teaser: string; photo: string }> = {
  THEME_01: {
    headline: "Houston's health network is one of the largest in the world",
    teaser: 'From the Texas Medical Center to community clinics in every ward, explore the organizations and services keeping Houston healthy.',
    photo: '/images/editorial/health-fair.jpg',
  },
  THEME_02: {
    headline: 'Strong families build strong neighborhoods',
    teaser: 'Schools, childcare, youth programs, and support for every stage of family life across Greater Houston.',
    photo: '/images/editorial/two-people-talking.jpg',
  },
  THEME_03: {
    headline: 'Every neighborhood has a story worth knowing',
    teaser: "Housing, parks, libraries, and the people making Houston's 88 super neighborhoods places worth calling home.",
    photo: '/images/editorial/neighborhood.jpg',
  },
  THEME_04: {
    headline: 'Your voice carries further than you think',
    teaser: 'Voting, town halls, advocacy, and the officials who represent you — at every level of government.',
    photo: '/images/editorial/town-hall.jpg',
  },
  THEME_05: {
    headline: 'Economic opportunity is everywhere here',
    teaser: 'Jobs, benefits, credit-building, and small business resources across the most economically diverse metro in America.',
    photo: '/images/editorial/organizing.jpg',
  },
  THEME_06: {
    headline: 'The bayous connect everything',
    teaser: 'Climate, flooding, green spaces, and the organizations working to make Houston more resilient and sustainable.',
    photo: '/images/editorial/cleanup.jpg',
  },
  THEME_07: {
    headline: 'The most diverse city in America, by the numbers',
    teaser: "Bridging, dialogue, inclusion, and the work of building trust across Houston's extraordinary tapestry of cultures.",
    photo: '/images/editorial/community-meeting.jpg',
  },
}

/** What brings you here? — warm, human entry points */
const ENTRY_POINTS = [
  { question: 'I want to learn about my community', href: '/start', label: 'Start exploring' },
  { question: 'I need help with something specific', href: '/start', label: 'Find resources' },
  { question: 'I want to get involved', href: '/start', label: 'See opportunities' },
  { question: 'I want to know who represents me', href: '/officials/lookup', label: 'Look up officials' },
]

export default async function HomePage() {
  const cookieStore = await cookies()
  const zip = cookieStore.get('zip')?.value || null

  const supabase = await createClient()

  const [
    geo,
    pathwayCounts,
    { count: orgCount },
    { count: serviceCount },
    { data: latestContent },
    { data: featuredOrgs },
  ] = await Promise.all([
    zip ? resolveUserGeo(zip) : Promise.resolve(null),
    getPathwayCounts(),
    supabase.from('organizations').select('org_id', { count: 'exact', head: true }),
    supabase.from('services_211').select('service_id', { count: 'exact', head: true }).eq('is_active', 'Yes'),
    supabase
      .from('content_published')
      .select('id, title_6th_grade, summary_6th_grade, source_domain, published_at, image_url, classification_v2')
      .eq('is_active', true)
      .order('published_at', { ascending: false })
      .limit(3),
    supabase
      .from('organizations')
      .select('org_id, org_name, description_5th_grade, logo_url, city, zip_code, website_url')
      .not('description_5th_grade', 'is', null)
      .not('logo_url', 'is', null)
      .limit(4),
  ])

  const totalResources = (orgCount || 0) + (serviceCount || 0)

  return (
    <div>
      {/* ═══════════════════════════════════════════════════════════════════
          COVER — The first thing you see when you pick up the guide
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[85vh] flex items-end overflow-hidden">
        {/* Full-bleed editorial photo */}
        <Image
          src="/images/editorial/community-meeting.jpg"
          alt="Community gathering in Houston"
          fill
          className="object-cover"
          priority
        />
        {/* Warm gradient overlay — not pure black, has clay warmth */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(13,17,23,0.95) 0%, rgba(13,17,23,0.6) 40%, rgba(13,17,23,0.2) 70%, rgba(13,17,23,0.1) 100%)' }} />

        <div className="relative z-10 w-full max-w-[var(--max-width)] mx-auto px-[var(--content-padding)] pb-16 pt-32">
          <h1 className="font-display text-white leading-[1.05] tracking-tight" style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)' }}>
            A Field Guide to
            <br />
            <span style={{ color: '#C4663A' }}>Greater Houston</span>
          </h1>

          <p className="mt-6 text-white/70 text-lg leading-relaxed max-w-[520px]">
            {totalResources.toLocaleString()} free resources from {(orgCount || 0).toLocaleString()} organizations.
            Everything you need to learn, connect, and take action — sorted by what matters to you.
          </p>

          {/* ZIP context — warm, not clinical */}
          {geo ? (
            <p className="mt-6 text-white/50 text-sm">
              Personalized for <strong className="text-white/80">{geo.neighborhoodName || geo.zip}</strong>
              {' · '}
              <Link href="/my-plan/settings" className="text-white/50 underline hover:text-white/70">change</Link>
            </p>
          ) : (
            <p className="mt-6 text-white/50 text-sm">
              <Link href="/my-plan/settings" className="text-white/60 underline hover:text-white/80">
                Enter your ZIP code
              </Link>
              {' '}to see what's near you
            </p>
          )}

          {/* Two simple CTAs */}
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/start"
              className="inline-block px-7 py-3.5 text-sm font-semibold tracking-wide"
              style={{ background: '#C4663A', color: 'white' }}
            >
              What do you need?
            </Link>
            <Link
              href="#chapters"
              className="inline-block px-7 py-3.5 text-sm font-semibold tracking-wide border border-white/25 text-white/80 hover:bg-white/5 transition-colors"
            >
              Browse the guide
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          WHAT BRINGS YOU HERE — warm human questions, not trail levels
          ═══════════════════════════════════════════════════════════════ */}
      <section style={{ background: '#FAF9F6' }}>
        <div className="max-w-[var(--max-width)] mx-auto px-[var(--content-padding)] py-16">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-ink mb-10">
            What brings you here?
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ENTRY_POINTS.map((ep) => (
              <Link
                key={ep.question}
                href={ep.href}
                className="group flex items-center justify-between p-6 border border-rule bg-white hover:border-ink transition-colors"
              >
                <div>
                  <p className="font-display text-lg font-bold text-ink group-hover:text-clay transition-colors">
                    {ep.question}
                  </p>
                  <p className="text-sm text-dim mt-1">{ep.label} →</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          CHAPTERS — The seven pathways as magazine-style chapter cards
          Each one is an editorial photo + narrative teaser
          ═══════════════════════════════════════════════════════════════ */}
      <section id="chapters" className="border-t border-rule">
        <div className="max-w-[var(--max-width)] mx-auto px-[var(--content-padding)] py-16">
          <div className="mb-12">
            <p className="text-sm uppercase tracking-widest text-dim mb-2">Table of contents</p>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-ink">
              Seven chapters, one city
            </h2>
            <p className="text-dim mt-3 max-w-[520px] leading-relaxed">
              Each chapter connects you to the organizations, services, officials, and
              opportunities that make Houston work. Start anywhere.
            </p>
          </div>

          {/* Featured pathway — big editorial card */}
          {(() => {
            const featured = PATHWAYS[0]
            const voice = PATHWAY_VOICE[featured.id]
            const counts = pathwayCounts[featured.id] || { total: 0, orgs: 0 }
            return (
              <Link href={`/${featured.slug}`} className="group block mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 border border-rule overflow-hidden">
                  <div className="relative h-64 md:h-auto">
                    <Image
                      src={voice.photo}
                      alt={featured.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-8 md:p-10 flex flex-col justify-center" style={{ background: '#FAF9F6' }}>
                    <p className="text-xs uppercase tracking-widest mb-3" style={{ color: featured.color }}>
                      Chapter 1 · {featured.name}
                    </p>
                    <h3 className="font-display text-xl md:text-2xl font-bold text-ink leading-snug group-hover:text-clay transition-colors">
                      {voice.headline}
                    </h3>
                    <p className="text-dim mt-3 leading-relaxed">
                      {voice.teaser}
                    </p>
                    <p className="text-sm text-faint mt-4">
                      {counts.total.toLocaleString()} resources · {counts.orgs.toLocaleString()} organizations
                    </p>
                  </div>
                </div>
              </Link>
            )
          })()}

          {/* Remaining pathways — 3-column grid with photos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-rule border border-rule">
            {PATHWAYS.slice(1).map((p, i) => {
              const voice = PATHWAY_VOICE[p.id]
              const counts = pathwayCounts[p.id] || { total: 0, orgs: 0 }
              return (
                <Link
                  key={p.slug}
                  href={`/${p.slug}`}
                  className="group flex flex-col bg-white hover:bg-[#FAF9F6] transition-colors"
                >
                  {/* Photo */}
                  <div className="relative h-40 overflow-hidden">
                    <Image
                      src={voice.photo}
                      alt={p.name}
                      fill
                      className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <p className="absolute bottom-3 left-4 text-xs uppercase tracking-widest text-white/70">
                      Chapter {i + 2}
                    </p>
                  </div>

                  {/* Copy */}
                  <div className="p-5 flex-1 flex flex-col">
                    <p className="text-xs uppercase tracking-widest mb-1" style={{ color: p.color }}>
                      {p.name}
                    </p>
                    <h3 className="font-display text-base font-bold text-ink leading-snug group-hover:text-clay transition-colors">
                      {voice.headline}
                    </h3>
                    <p className="text-sm text-dim mt-2 leading-relaxed line-clamp-2 flex-1">
                      {voice.teaser}
                    </p>
                    <p className="text-xs text-faint mt-3">
                      {counts.total.toLocaleString()} resources
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FEATURED ORGANIZATIONS — The spine of the guide
          Show a few well, not many poorly
          ═══════════════════════════════════════════════════════════════ */}
      {featuredOrgs && featuredOrgs.length > 0 && (
        <section style={{ background: '#FAF9F6' }} className="border-t border-rule">
          <div className="max-w-[var(--max-width)] mx-auto px-[var(--content-padding)] py-16">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-sm uppercase tracking-widest text-dim mb-2">Organizations</p>
                <h2 className="font-display text-2xl md:text-3xl font-bold text-ink">
                  Who's doing the work
                </h2>
                <p className="text-dim mt-2">
                  {(orgCount || 0).toLocaleString()} organizations across Greater Houston
                </p>
              </div>
              <Link href="/orgs" className="text-sm text-blue hover:underline">
                Browse all →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-rule border border-rule">
              {featuredOrgs.map((org: any) => (
                <Link
                  key={org.org_id}
                  href={`/orgs/${org.org_id}`}
                  className="group flex gap-5 p-6 bg-white hover:bg-white/80 transition-colors"
                >
                  {org.logo_url ? (
                    <img src={org.logo_url} alt="" className="w-14 h-14 object-contain flex-shrink-0" />
                  ) : (
                    <div className="w-14 h-14 bg-paper flex items-center justify-center flex-shrink-0">
                      <span className="font-display text-xl font-bold text-dim">
                        {(org.org_name || '?')[0]}
                      </span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="font-display font-bold text-ink group-hover:text-clay transition-colors">
                      {org.org_name}
                    </h3>
                    <p className="text-sm text-dim line-clamp-2 mt-1 leading-relaxed">
                      {org.description_5th_grade}
                    </p>
                    {org.city && (
                      <p className="text-xs text-faint mt-2">{org.city}, TX {org.zip_code}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          LATEST FROM THE GUIDE — Editorial content, not a feed
          ═══════════════════════════════════════════════════════════════ */}
      {latestContent && latestContent.length > 0 && (
        <section className="border-t border-rule">
          <div className="max-w-[var(--max-width)] mx-auto px-[var(--content-padding)] py-16">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-sm uppercase tracking-widest text-dim mb-2">Latest</p>
                <h2 className="font-display text-2xl font-bold text-ink">From the guide</h2>
              </div>
              <Link href="/news" className="text-sm text-blue hover:underline">
                All updates →
              </Link>
            </div>

            {/* Featured article + side stack */}
            <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-px bg-rule border border-rule">
              {/* Lead story */}
              {(() => {
                const lead = latestContent[0] as any
                const theme = lead.classification_v2?.theme_primary
                  ? (THEMES as any)[lead.classification_v2.theme_primary]
                  : null
                return (
                  <Link
                    href={`/content/${lead.id}`}
                    className="group flex flex-col bg-white"
                  >
                    <div className="relative h-56 md:h-72 overflow-hidden">
                      {lead.image_url ? (
                        <Image src={lead.image_url} alt="" fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full" style={{ background: theme?.color || '#1b5e8a' }} />
                      )}
                    </div>
                    <div className="p-6 flex-1">
                      {theme && (
                        <p className="text-xs uppercase tracking-widest mb-2" style={{ color: theme.color }}>
                          {theme.name}
                        </p>
                      )}
                      <h3 className="font-display text-xl font-bold text-ink leading-snug group-hover:text-clay transition-colors">
                        {lead.title_6th_grade || 'Untitled'}
                      </h3>
                      {lead.summary_6th_grade && (
                        <p className="text-dim mt-2 leading-relaxed line-clamp-3">
                          {lead.summary_6th_grade}
                        </p>
                      )}
                      {lead.source_domain && (
                        <p className="text-xs text-faint mt-3">{lead.source_domain}</p>
                      )}
                    </div>
                  </Link>
                )
              })()}

              {/* Side stack */}
              <div className="flex flex-col divide-y divide-rule">
                {latestContent.slice(1).map((item: any) => {
                  const theme = item.classification_v2?.theme_primary
                    ? (THEMES as any)[item.classification_v2.theme_primary]
                    : null
                  return (
                    <Link
                      key={item.id}
                      href={`/content/${item.id}`}
                      className="group flex gap-4 p-5 bg-white hover:bg-[#FAF9F6] transition-colors flex-1"
                    >
                      {item.image_url && (
                        <div className="relative w-20 h-20 flex-shrink-0 overflow-hidden">
                          <Image src={item.image_url} alt="" fill className="object-cover" />
                        </div>
                      )}
                      <div className="min-w-0">
                        {theme && (
                          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: theme.color }}>
                            {theme.name}
                          </p>
                        )}
                        <h4 className="font-display text-sm font-bold text-ink leading-snug group-hover:text-clay transition-colors line-clamp-2">
                          {item.title_6th_grade || 'Untitled'}
                        </h4>
                        {item.source_domain && (
                          <p className="text-xs text-faint mt-1">{item.source_domain}</p>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          YOUR NEIGHBORHOOD — Geographic warmth
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden border-t border-rule">
        <div className="absolute inset-0">
          <Image
            src="/images/editorial/neighborhood.jpg"
            alt=""
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-ink/80" />
        </div>

        <div className="relative z-10 max-w-[var(--max-width)] mx-auto px-[var(--content-padding)] py-16 text-white">
          <p className="text-xs uppercase tracking-widest text-white/40 mb-3">You are here</p>
          <h2 className="font-display text-2xl md:text-3xl font-bold">
            {geo ? geo.neighborhoodName || `Near ${geo.zip}` : 'Greater Houston'}
          </h2>
          <p className="text-white/60 mt-3 max-w-[480px] leading-relaxed">
            {geo
              ? 'Resources, services, and officials filtered to your area. Everything in this guide can be personalized to where you live.'
              : "Eight counties, 88 super neighborhoods, 4 levels of government. Enter your ZIP code to see what\u2019s near you."}
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link
              href="/map"
              className="inline-block px-6 py-3 text-sm font-semibold"
              style={{ background: '#C4663A', color: 'white' }}
            >
              Open the map
            </Link>
            {!geo && (
              <Link
                href="/my-plan/settings"
                className="inline-block px-6 py-3 text-sm font-semibold border border-white/25 text-white/80 hover:bg-white/5 transition-colors"
              >
                Set your ZIP
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          CREDIBILITY — woven naturally, not a stats row
          ═══════════════════════════════════════════════════════════════ */}
      <section className="border-t border-rule" style={{ background: '#FAF9F6' }}>
        <div className="max-w-[var(--max-width)] mx-auto px-[var(--content-padding)] py-10">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-dim text-center">
            <span>{totalResources.toLocaleString()} resources</span>
            <span className="text-rule">·</span>
            <span>{(orgCount || 0).toLocaleString()} organizations</span>
            <span className="text-rule">·</span>
            <span>4 levels of government</span>
            <span className="text-rule">·</span>
            <span>English, Spanish, Vietnamese</span>
            <span className="text-rule">·</span>
            <span>Updated daily</span>
            <span className="text-rule">·</span>
            <span>Free forever</span>
          </div>
        </div>
      </section>
    </div>
  )
}
