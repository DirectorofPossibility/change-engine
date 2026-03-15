/**
 * @fileoverview Pathway Chapter — a chapter in the field guide.
 *
 * Think: Lonely Planet country chapter. Big photo, narrative intro,
 * featured organizations with stories, layered disclosure,
 * warm editorial voice throughout.
 *
 * @route GET /health, /families, /neighborhood, /voice, /money, /planet, /the-bigger-we
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { THEMES } from '@/lib/constants'
import { getEntitiesByPathways, resolveUserGeo } from '@/lib/data/entity-graph'

const PATHWAY_BY_SLUG: Record<string, { id: string; name: string; color: string; slug: string; description: string }> = {}
for (const [id, t] of Object.entries(THEMES)) {
  PATHWAY_BY_SLUG[t.slug] = { id, name: t.name, color: t.color, slug: t.slug, description: t.description }
}

const VALID_SLUGS: string[] = Object.values(THEMES).map((t) => t.slug)

/** Narrative voice for each pathway — tells a story, not a database dump */
const CHAPTER_VOICE: Record<string, { headline: string; lede: string; photo: string; orgIntro: string; serviceIntro: string }> = {
  THEME_01: {
    headline: "Houston\u2019s health network is one of the largest in the world",
    lede: "Home to the Texas Medical Center \u2014 the largest medical complex on earth \u2014 Greater Houston has a health ecosystem that spans world-class hospitals, neighborhood clinics, mental health centers, and community wellness programs. Whether you need care right now or want to understand the health landscape around you, this chapter is your starting point.",
    photo: "/images/editorial/health-fair.jpg",
    orgIntro: "These organizations are the backbone of Houston\u2019s health community \u2014 from large hospital systems to neighborhood clinics that know your name.",
    serviceIntro: "Free and low-cost health services available near you, from checkups to counseling to food assistance.",
  },
  THEME_02: {
    headline: "Strong families build strong neighborhoods",
    lede: "Houston\u2019s families come in every shape, size, and language. The organizations serving them know that a family that has what it needs \u2014 good schools, reliable childcare, safe after-school programs \u2014 becomes a force for the entire community. This chapter maps the resources that help Houston families thrive at every stage.",
    photo: "/images/editorial/two-people-talking.jpg",
    orgIntro: "Organizations dedicated to families \u2014 from early childhood to eldercare, in every language Houston speaks.",
    serviceIntro: "Family services near you \u2014 childcare, tutoring, parenting support, youth programs, and more.",
  },
  THEME_03: {
    headline: "Every neighborhood has a story worth knowing",
    lede: "Houston is the only major American city without zoning \u2014 which means every block tells its own story. Shotgun houses next to glass towers, taco trucks beside art galleries, bayous threading through it all. This chapter helps you understand the place you live, find the resources that shape it, and connect with the people making it better.",
    photo: "/images/editorial/neighborhood.jpg",
    orgIntro: "The organizations shaping Houston\u2019s neighborhoods \u2014 from housing nonprofits to civic clubs to community land trusts.",
    serviceIntro: "Housing assistance, library programs, park activities, and neighborhood resources near you.",
  },
  THEME_04: {
    headline: "Your voice carries further than you think",
    lede: "Houston has four levels of government, dozens of elected bodies, and a civic infrastructure that responds to the people who show up. Whether you want to find out who represents you, attend a town hall, register to vote, or run for office yourself \u2014 this chapter puts the tools of civic participation in your hands.",
    photo: "/images/editorial/town-hall.jpg",
    orgIntro: "Civic organizations working to make government more responsive, accessible, and representative of all Houstonians.",
    serviceIntro: "Voter registration, civic engagement programs, advocacy training, and government services.",
  },
  THEME_05: {
    headline: "Economic opportunity is everywhere here",
    lede: "Houston\u2019s economy is the most diverse in the nation \u2014 energy, medicine, aerospace, trade, and a small business ecosystem that spans Hillcroft to Midtown. But economic opportunity isn\u2019t automatic. This chapter connects you to the jobs, benefits, training, and financial resources that help every Houstonian build a stable foundation.",
    photo: "/images/editorial/organizing.jpg",
    orgIntro: "Organizations building economic opportunity \u2014 from workforce development to micro-lending to financial coaching.",
    serviceIntro: "Job training, benefits enrollment, small business support, and financial services near you.",
  },
  THEME_06: {
    headline: "The bayous connect everything",
    lede: "Houston\u2019s relationship with its environment is complicated \u2014 sprawling and subtropical, flood-prone and forward-looking. The bayous are both lifelines and flood channels. The organizations in this chapter are working to make Houston more resilient, more sustainable, and more connected to the natural systems that sustain it.",
    photo: "/images/editorial/cleanup.jpg",
    orgIntro: "Environmental organizations \u2014 from bayou conservation to urban farming to climate resilience planning.",
    serviceIntro: "Environmental programs, green jobs, recycling, tree planting, and sustainability resources.",
  },
  THEME_07: {
    headline: "The most diverse city in America, by the numbers",
    lede: "Houston is home to speakers of 145 languages, communities from every continent, and a tradition of quiet neighborliness that sometimes surprises newcomers. This chapter explores the organizations, initiatives, and spaces dedicated to bridging across difference \u2014 because Houston\u2019s diversity isn\u2019t just a fact, it\u2019s an asset.",
    photo: "/images/editorial/community-meeting.jpg",
    orgIntro: "Organizations building bridges \u2014 interfaith groups, cultural centers, dialogue initiatives, and community connectors.",
    serviceIntro: "Cultural programs, language access, immigration services, and community building near you.",
  },
}

export function generateStaticParams() {
  return VALID_SLUGS.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const pathway = PATHWAY_BY_SLUG[slug]
  if (!pathway) return {}
  return {
    title: `${pathway.name} — Change Engine`,
    description: pathway.description,
  }
}

export const dynamic = 'force-dynamic'

export default async function PathwayChapterPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const pathway = PATHWAY_BY_SLUG[slug]
  if (!pathway) notFound()

  const cookieStore = await cookies()
  const zip = cookieStore.get('zip')?.value || null

  const entities = await getEntitiesByPathways(
    [pathway.id],
    { content: 6, services: 6, orgs: 6, officials: 6, policies: 4, opportunities: 4 },
    zip,
  )

  const geo = entities.geo
  const voice = CHAPTER_VOICE[pathway.id] || CHAPTER_VOICE.THEME_01

  // Related pathways
  const related = Object.entries(THEMES)
    .filter(([id]) => id !== pathway.id)
    .slice(0, 3)
    .map(([id, t]) => ({
      id, name: t.name, slug: t.slug, color: t.color,
      headline: CHAPTER_VOICE[id]?.headline || t.description,
      photo: CHAPTER_VOICE[id]?.photo || '/images/editorial/community-meeting.jpg',
    }))

  const chapterNum = VALID_SLUGS.indexOf(slug) + 1

  return (
    <div>
      {/* ═══════════════════════════════════════════════════════════════════
          CHAPTER COVER — Full-bleed photo + narrative headline
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[60vh] flex items-end overflow-hidden">
        <Image
          src={voice.photo}
          alt={pathway.name}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(13,17,23,0.95) 0%, rgba(13,17,23,0.5) 50%, rgba(13,17,23,0.15) 100%)' }} />

        {/* Color accent bar at top */}
        <div className="absolute top-0 left-0 right-0 h-1" style={{ background: pathway.color }} />

        <div className="relative z-10 w-full max-w-[var(--max-width)] mx-auto px-[var(--content-padding)] pb-12 pt-24">
          <p className="text-xs uppercase tracking-widest text-white/40 mb-3">
            Chapter {chapterNum} of 7
          </p>
          <h1 className="font-display text-white leading-[1.05] tracking-tight" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>
            <span style={{ color: pathway.color }}>{pathway.name}</span>
          </h1>
          <p className="font-display text-white/80 text-xl md:text-2xl mt-3 max-w-[600px] leading-snug">
            {voice.headline}
          </p>

          {/* Geo context */}
          {geo && (
            <p className="mt-4 text-white/40 text-sm">
              Showing resources near <strong className="text-white/60">{geo.neighborhoodName || geo.zip}</strong>
            </p>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          CHAPTER INTRO — The lede, like the opening paragraph of a chapter
          ═══════════════════════════════════════════════════════════════ */}
      <section style={{ background: '#FAF9F6' }}>
        <div className="max-w-[var(--max-width)] mx-auto px-[var(--content-padding)] py-12">
          <div className="max-w-[680px]">
            <p className="text-base md:text-lg text-dim leading-[1.8] italic">
              {voice.lede}
            </p>

            {/* Quick stats — understated, not shouting */}
            <div className="flex flex-wrap gap-6 mt-8 pt-6 border-t border-rule">
              {[
                { n: entities.counts.organizations, label: 'organizations' },
                { n: entities.counts.services, label: 'services' },
                { n: entities.counts.officials, label: 'officials' },
                { n: entities.counts.content, label: 'articles' },
              ].filter(s => s.n > 0).map((s) => (
                <div key={s.label}>
                  <span className="font-display text-2xl font-bold text-ink">{s.n}</span>
                  <span className="text-sm text-dim ml-1.5">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ZIP prompt */}
          {!geo && (
            <p className="mt-6 text-sm text-faint">
              <Link href="/my-plan/settings" className="text-blue underline hover:text-ink">
                Enter your ZIP code
              </Link>
              {' '}to filter everything in this chapter to your area.
            </p>
          )}

          {/* In this chapter — jump links */}
          <nav className="mt-8 flex flex-wrap gap-3">
            {entities.organizations.length > 0 && <a href="#organizations" className="text-sm text-blue hover:underline">Organizations ↓</a>}
            {entities.services.length > 0 && <a href="#services" className="text-sm text-blue hover:underline">Services ↓</a>}
            {entities.officials.length > 0 && <a href="#officials" className="text-sm text-blue hover:underline">Officials ↓</a>}
            {entities.policies.length > 0 && <a href="#policies" className="text-sm text-blue hover:underline">Policies ↓</a>}
            {entities.opportunities.length > 0 && <a href="#opportunities" className="text-sm text-blue hover:underline">Opportunities ↓</a>}
            {entities.content.length > 0 && <a href="#reading" className="text-sm text-blue hover:underline">Reading ↓</a>}
          </nav>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          ORGANIZATIONS — The spine of the guide
          Narrative intro, then cards that tell a story
          ═══════════════════════════════════════════════════════════════ */}
      {entities.organizations.length > 0 && (
        <section className="border-t border-rule" id="organizations">
          <div className="max-w-[var(--max-width)] mx-auto px-[var(--content-padding)] py-12">
            <div className="mb-8">
              <p className="text-xs uppercase tracking-widest text-dim mb-2">Organizations</p>
              <h2 className="font-display text-2xl font-bold text-ink">
                Who's doing the work
              </h2>
              <p className="text-dim mt-2 max-w-[560px] leading-relaxed">
                {voice.orgIntro}
              </p>
            </div>

            {/* Featured org — larger card */}
            {(() => {
              const featured = entities.organizations[0] as any
              return (
                <Link
                  href={`/orgs/${featured.org_id}`}
                  className="group flex flex-col sm:flex-row gap-6 p-6 border border-rule bg-white hover:border-ink transition-colors mb-4"
                >
                  {featured.logo_url ? (
                    <img src={featured.logo_url} alt="" className="w-20 h-20 object-contain flex-shrink-0" />
                  ) : (
                    <div className="w-20 h-20 flex items-center justify-center flex-shrink-0" style={{ background: `${pathway.color}08` }}>
                      <span className="font-display text-3xl font-bold" style={{ color: pathway.color }}>
                        {(featured.org_name || '?')[0]}
                      </span>
                    </div>
                  )}
                  <div>
                    <h3 className="font-display text-lg font-bold text-ink group-hover:text-clay transition-colors">
                      {featured.org_name}
                    </h3>
                    <p className="text-dim mt-2 leading-relaxed">
                      {featured.description_5th_grade || featured.mission_statement || 'Community organization serving Greater Houston.'}
                    </p>
                    {featured.city && (
                      <p className="text-xs text-faint mt-3">{featured.city}, TX {featured.zip_code}</p>
                    )}
                  </div>
                </Link>
              )
            })()}

            {/* Remaining orgs — compact list */}
            <div className="border border-rule divide-y divide-rule">
              {entities.organizations.slice(1).map((org: any) => (
                <Link
                  key={org.org_id}
                  href={`/orgs/${org.org_id}`}
                  className="group flex items-center gap-4 p-4 hover:bg-[#FAF9F6] transition-colors"
                >
                  {org.logo_url ? (
                    <img src={org.logo_url} alt="" className="w-10 h-10 object-contain flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 bg-paper">
                      <span className="font-display font-bold text-dim">{(org.org_name || '?')[0]}</span>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-sm font-bold text-ink group-hover:text-clay transition-colors truncate">
                      {org.org_name}
                    </h3>
                    <p className="text-sm text-dim line-clamp-1 mt-0.5">
                      {org.description_5th_grade || org.mission_statement || 'Community organization'}
                    </p>
                  </div>
                  {org.city && (
                    <span className="text-xs text-faint flex-shrink-0 hidden sm:block">
                      {org.city}
                    </span>
                  )}
                </Link>
              ))}
            </div>

            <div className="mt-4">
              <Link href={`/orgs?pathway=${slug}`} className="text-sm text-blue hover:underline">
                See all {entities.counts.organizations} organizations →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          SERVICES — What's available near you
          ═══════════════════════════════════════════════════════════════ */}
      {entities.services.length > 0 && (
        <section className="border-t border-rule" style={{ background: '#FAF9F6' }} id="services">
          <div className="max-w-[var(--max-width)] mx-auto px-[var(--content-padding)] py-12">
            <div className="mb-8">
              <p className="text-xs uppercase tracking-widest text-dim mb-2">Services</p>
              <h2 className="font-display text-2xl font-bold text-ink">
                What's available{geo ? ` near ${geo.zip}` : ''}
              </h2>
              <p className="text-dim mt-2 max-w-[560px] leading-relaxed">
                {voice.serviceIntro}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-rule border border-rule">
              {entities.services.map((svc: any) => (
                <Link
                  key={svc.service_id}
                  href={`/services/${svc.service_id}`}
                  className="group p-5 bg-white hover:bg-white/80 transition-colors"
                >
                  <p className="text-xs text-faint mb-1">{svc.org_name || 'Service'}</p>
                  <h3 className="font-display text-sm font-bold text-ink group-hover:text-clay transition-colors leading-snug">
                    {svc.service_name}
                  </h3>
                  <p className="text-sm text-dim line-clamp-2 mt-1.5 leading-relaxed">
                    {svc.description_5th_grade || 'Community service'}
                  </p>
                  {svc.city && (
                    <p className="text-xs text-faint mt-2">{svc.city}, {svc.zip_code}</p>
                  )}
                </Link>
              ))}
            </div>

            <div className="mt-4">
              <Link href={`/services?pathway=${slug}`} className="text-sm text-blue hover:underline">
                See all {entities.counts.services} services →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          OFFICIALS — Who represents you
          ═══════════════════════════════════════════════════════════════ */}
      {entities.officials.length > 0 && (
        <section className="border-t border-rule" id="officials">
          <div className="max-w-[var(--max-width)] mx-auto px-[var(--content-padding)] py-12">
            <div className="mb-8">
              <p className="text-xs uppercase tracking-widest text-dim mb-2">Your representatives</p>
              <h2 className="font-display text-2xl font-bold text-ink">
                Who represents you
              </h2>
              {geo && (
                <p className="text-dim mt-2">Officials for {geo.neighborhoodName || geo.zip} working on {pathway.name.toLowerCase()} policy</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-rule border border-rule">
              {entities.officials.map((off: any) => (
                <Link
                  key={off.official_id}
                  href={`/officials/${off.official_id}`}
                  className="group flex items-center gap-4 p-5 bg-white hover:bg-[#FAF9F6] transition-colors"
                >
                  <div className="w-12 h-12 rounded-full border border-rule flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {off.photo_url ? (
                      <img src={off.photo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-display text-lg font-bold text-faint">
                        {(off.official_name || '?')[0]}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display text-sm font-bold text-ink group-hover:text-clay transition-colors truncate">
                      {off.official_name}
                    </h3>
                    <p className="text-xs text-faint truncate">
                      {off.title || off.level || 'Official'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-4 flex gap-4">
              <Link href="/officials" className="text-sm text-blue hover:underline">
                All officials →
              </Link>
              <Link href="/officials/lookup" className="text-sm text-blue hover:underline">
                Look up by address →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          POLICIES — Policy tracker
          ═══════════════════════════════════════════════════════════════ */}
      {entities.policies.length > 0 && (
        <section className="border-t border-rule" style={{ background: '#FAF9F6' }} id="policies">
          <div className="max-w-[var(--max-width)] mx-auto px-[var(--content-padding)] py-12">
            <div className="mb-8">
              <p className="text-xs uppercase tracking-widest text-dim mb-2">Legislation</p>
              <h2 className="font-display text-2xl font-bold text-ink">
                Policy tracker
              </h2>
              <p className="text-dim mt-2">
                Bills and ordinances affecting {pathway.name.toLowerCase()} in Greater Houston
              </p>
            </div>

            <div className="border border-rule divide-y divide-rule bg-white">
              {entities.policies.map((pol: any) => (
                <Link
                  key={pol.policy_id}
                  href={`/policies/${pol.policy_id}`}
                  className="group flex items-start justify-between gap-6 p-5 hover:bg-[#FAF9F6] transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-sm font-bold text-ink group-hover:text-clay transition-colors">
                      {pol.title_6th_grade || pol.policy_name}
                    </h3>
                    {(pol.summary_5th_grade || pol.summary_6th_grade) && (
                      <p className="text-sm text-dim line-clamp-2 mt-1">
                        {pol.summary_5th_grade || pol.summary_6th_grade}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-right">
                    {pol.bill_number && <span className="text-xs text-faint font-mono block">{pol.bill_number}</span>}
                    {pol.status && <span className="text-xs text-faint block mt-0.5">{pol.status}</span>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          OPPORTUNITIES — Get involved
          ═══════════════════════════════════════════════════════════════ */}
      {entities.opportunities.length > 0 && (
        <section className="border-t border-rule" id="opportunities">
          <div className="max-w-[var(--max-width)] mx-auto px-[var(--content-padding)] py-12">
            <div className="mb-8">
              <p className="text-xs uppercase tracking-widest text-dim mb-2">Take action</p>
              <h2 className="font-display text-2xl font-bold text-ink">Get involved</h2>
              <p className="text-dim mt-2">
                Ways to show up, volunteer, and make a difference in {pathway.name.toLowerCase()}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-rule border border-rule">
              {entities.opportunities.map((opp: any) => (
                <div key={opp.opportunity_id} className="p-5 bg-white">
                  <h3 className="font-display text-sm font-bold text-ink">{opp.opportunity_name}</h3>
                  <p className="text-sm text-dim line-clamp-2 mt-1.5">{opp.description_5th_grade || ''}</p>
                  <div className="mt-3 flex items-center gap-4">
                    {opp.registration_url && (
                      <a href={opp.registration_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue hover:underline">
                        Sign up →
                      </a>
                    )}
                    {opp.is_virtual === 'Yes' && <span className="text-xs text-faint">Virtual</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          READING — Articles and content, editorial layout
          ═══════════════════════════════════════════════════════════════ */}
      {entities.content.length > 0 && (
        <section className="border-t border-rule" style={{ background: '#FAF9F6' }} id="reading">
          <div className="max-w-[var(--max-width)] mx-auto px-[var(--content-padding)] py-12">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-xs uppercase tracking-widest text-dim mb-2">Reading</p>
                <h2 className="font-display text-2xl font-bold text-ink">From the guide</h2>
              </div>
              <Link href={`/news?pathway=${slug}`} className="text-sm text-blue hover:underline">
                All articles →
              </Link>
            </div>

            {/* Lead + side stack */}
            <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-px bg-rule border border-rule">
              {(() => {
                const lead = entities.content[0] as any
                return (
                  <Link href={`/content/${lead.id}`} className="group flex flex-col bg-white">
                    <div className="relative h-48 md:h-64 overflow-hidden">
                      {lead.image_url ? (
                        <Image src={lead.image_url} alt="" fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full" style={{ background: pathway.color }} />
                      )}
                    </div>
                    <div className="p-5 flex-1">
                      <h3 className="font-display text-lg font-bold text-ink leading-snug group-hover:text-clay transition-colors">
                        {lead.title_6th_grade || 'Untitled'}
                      </h3>
                      {lead.summary_6th_grade && (
                        <p className="text-dim mt-2 leading-relaxed line-clamp-3">{lead.summary_6th_grade}</p>
                      )}
                      {lead.source_domain && <p className="text-xs text-faint mt-3">{lead.source_domain}</p>}
                    </div>
                  </Link>
                )
              })()}
              <div className="flex flex-col divide-y divide-rule">
                {entities.content.slice(1, 4).map((item: any) => (
                  <Link
                    key={item.id}
                    href={`/content/${item.id}`}
                    className="group flex gap-4 p-4 bg-white hover:bg-white/80 transition-colors flex-1"
                  >
                    {item.image_url && (
                      <div className="relative w-16 h-16 flex-shrink-0 overflow-hidden">
                        <Image src={item.image_url} alt="" fill className="object-cover" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4 className="font-display text-sm font-bold text-ink leading-snug group-hover:text-clay transition-colors line-clamp-2">
                        {item.title_6th_grade || 'Untitled'}
                      </h4>
                      {item.source_domain && <p className="text-xs text-faint mt-1">{item.source_domain}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          MORE CHAPTERS — Cross-navigation
          ═══════════════════════════════════════════════════════════════ */}
      <section className="border-t border-rule">
        <div className="max-w-[var(--max-width)] mx-auto px-[var(--content-padding)] py-12">
          <p className="text-xs uppercase tracking-widest text-dim mb-6">Continue reading</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-rule border border-rule">
            {related.map((r) => (
              <Link
                key={r.slug}
                href={`/${r.slug}`}
                className="group flex flex-col bg-white hover:bg-[#FAF9F6] transition-colors"
              >
                <div className="relative h-32 overflow-hidden">
                  <Image src={r.photo} alt={r.name} fill className="object-cover group-hover:scale-[1.02] transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
                <div className="p-4">
                  <p className="text-xs uppercase tracking-widest mb-1" style={{ color: r.color }}>{r.name}</p>
                  <h3 className="font-display text-sm font-bold text-ink leading-snug group-hover:text-clay transition-colors line-clamp-2">
                    {r.headline}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
