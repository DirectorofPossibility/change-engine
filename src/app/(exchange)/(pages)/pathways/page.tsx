import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { THEMES } from '@/lib/constants'
import { getPathwaysHubData, getRandomQuote } from '@/lib/data/exchange'
import { ScrollReveal, ParallaxSection } from './ScrollReveal'
import { InteractiveFOL } from '@/components/exchange/home/InteractiveFOL'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Seven Doorways Into Community Life | The Change Engine',
  description:
    'Your life is not one thing — it is at least seven. Health, family, neighborhood, voice, money, planet, and the bigger we. Pick a door.',
}

/* ── Evocative copy for each pathway ── */
const PATHWAY_SOUL: Record<string, { tagline: string; invite: string; verb: string }> = {
  THEME_01: {
    tagline: 'Your body. Your mind. Your whole self.',
    invite:
      'Free clinics, mental health support, nutrition programs, insurance navigators — your guide to feeling good and getting the care you deserve.',
    verb: 'Take care',
  },
  THEME_02: {
    tagline: 'The people who shape everything.',
    invite:
      'Schools worth knowing about. Childcare you can actually find. Youth programs, safety nets, and everything that helps Houston families grow stronger.',
    verb: 'Grow together',
  },
  THEME_03: {
    tagline: 'The places we call home.',
    invite:
      'Parks, libraries, housing, local projects — what\'s happening on your block and what your neighbors are building next.',
    verb: 'Explore nearby',
  },
  THEME_04: {
    tagline: 'Your power, out loud.',
    invite:
      'Voting deadlines, town halls, who represents you, how to organize — the tools and moments where your voice actually shapes what happens.',
    verb: 'Speak up',
  },
  THEME_05: {
    tagline: 'What you earn. What you build.',
    invite:
      'Jobs, benefits, credit-building, small business support — real paths to financial strength and opportunity.',
    verb: 'Build wealth',
  },
  THEME_06: {
    tagline: 'The ground beneath all of us.',
    invite:
      'Air quality, flooding, energy programs, green spaces — how Houston is facing the climate crisis and what you can do about it.',
    verb: 'Protect it',
  },
  THEME_07: {
    tagline: 'Across every line that divides us.',
    invite:
      'Bridging, dialogue, inclusion, trust — the hard and beautiful work of building one community out of many.',
    verb: 'Come together',
  },
}

export default async function PathwaysPage() {
  const [hubData, quote] = await Promise.all([
    getPathwaysHubData(),
    getRandomQuote(),
  ])

  // Build pathway counts for the FOL
  const pathwayCounts: Record<string, number> = {}
  for (const [id, data] of Object.entries(hubData)) {
    pathwayCounts[id] = data.totalContent + data.entityCounts.services
  }

  const themeEntries = Object.entries(THEMES)

  return (
    <div>
      {/* ══════════════════════════════════════════
          HERO — Dark, immersive, the Flower of Life
          ══════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden"
        style={{ background: '#0d1117', minHeight: '90vh' }}
      >
        {/* Subtle radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 50% 60%, rgba(26,52,96,0.3) 0%, transparent 70%)',
          }}
        />

        <div className="relative max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-12">
          {/* Headline */}
          <ScrollReveal className="text-center mb-4">
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl leading-[1.1] mb-6"
              style={{ color: '#ffffff' }}
            >
              Life is not one thing.
            </h1>
            <p
              className="text-2xl sm:text-3xl lg:text-4xl"
              style={{ color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}
            >
              It&rsquo;s at least seven.
            </p>
          </ScrollReveal>

          {/* Flower of Life — interactive navigation */}
          <ScrollReveal delay={200} className="mt-8 sm:mt-12 max-w-[480px] mx-auto">
            <InteractiveFOL pathwayCounts={pathwayCounts} />
          </ScrollReveal>

          {/* Invitation */}
          <ScrollReveal delay={400} className="text-center mt-8 sm:mt-12">
            <p
              className="text-lg sm:text-xl max-w-lg mx-auto leading-relaxed mb-8"
              style={{ color: 'rgba(255,255,255,0.6)' }}
            >
              Each one is a doorway into your city, your community, your own life.
              <br className="hidden sm:block" />
              Pick one. Go deep. See where it leads.
            </p>
          </ScrollReveal>

          {/* Scroll indicator */}
          <ScrollReveal delay={600} className="text-center">
            <div className="animate-bounce-slow inline-block">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 5v14M5 12l7 7 7-7" />
              </svg>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          THE SEVEN DOORWAYS
          ══════════════════════════════════════════ */}
      {themeEntries.map(function ([themeId, theme], idx) {
        const data = hubData[themeId]
        if (!data) return null

        const soul = PATHWAY_SOUL[themeId]
        if (!soul) return null

        const hero = data.heroContent[0]
        const secondary = data.heroContent.slice(1, 4)
        const isReversed = idx % 2 === 1

        return (
          <ParallaxSection key={themeId} color={theme.color}>
            <div className="max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
              <div
                className={`grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start ${
                  isReversed ? 'lg:[direction:rtl]' : ''
                }`}
              >
                {/* ── Text side ── */}
                <div className={isReversed ? 'lg:[direction:ltr]' : ''}>
                  <ScrollReveal direction={isReversed ? 'right' : 'left'}>
                    {/* Pathway number whisper */}
                    <p
                      className="text-[11px] uppercase tracking-[0.25em] mb-6 font-mono"
                      style={{ color: theme.color }}
                    >
                      {String(idx + 1).padStart(2, '0')}
                    </p>

                    {/* Tagline — big serif */}
                    <h2
                      className="text-3xl sm:text-4xl lg:text-[2.75rem] leading-[1.15] mb-6"
                      style={{ color: theme.color }}
                    >
                      {soul.tagline}
                    </h2>

                    {/* The invitation */}
                    <p
                      className="text-lg leading-relaxed mb-8 max-w-md"
                      style={{ color: '#5c6474' }}
                    >
                      {soul.invite}
                    </p>

                    {/* Pathway SVG icon */}
                    <div className="mb-8 opacity-20">
                      <Image
                        src={`/images/pathways/${theme.slug}.svg`}
                        alt=""
                        width={64}
                        height={64}
                        className="w-16 h-16"
                      />
                    </div>

                    {/* CTA */}
                    <Link
                      href={'/pathways/' + theme.slug}
                      className="group inline-flex items-center gap-3 text-base font-bold transition-all"
                      style={{ color: theme.color }}
                    >
                      <span className="border-b-2 group-hover:border-current pb-0.5" style={{ borderColor: theme.color }}>
                        {soul.verb}
                      </span>
                      <svg
                        className="w-5 h-5 transition-transform group-hover:translate-x-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </Link>
                  </ScrollReveal>
                </div>

                {/* ── Content side ── */}
                <div className={isReversed ? 'lg:[direction:ltr]' : ''}>
                  {/* Hero card */}
                  {hero && (
                    <ScrollReveal
                      direction={isReversed ? 'left' : 'right'}
                      delay={150}
                    >
                      <Link
                        href={'/content/' + hero.id}
                        className="group block border mb-4 transition-colors"
                        style={{ borderColor: '#dde1e8' }}
                      >
                        {hero.image_url && (
                          <div className="aspect-[16/9] overflow-hidden">
                            <Image
                              src={hero.image_url}
                              alt=""
                              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
                              width={800}
                              height={450}
                            />
                          </div>
                        )}
                        <div className="p-5">
                          <h3 className="text-lg leading-snug group-hover:underline" style={{ textDecorationColor: theme.color }}>
                            {hero.title}
                          </h3>
                          {hero.summary && (
                            <p className="text-sm mt-2 line-clamp-2 leading-relaxed" style={{ color: '#5c6474' }}>
                              {hero.summary}
                            </p>
                          )}
                        </div>
                      </Link>
                    </ScrollReveal>
                  )}

                  {/* Secondary cards — compact row */}
                  {secondary.length > 0 && (
                    <ScrollReveal
                      direction={isReversed ? 'left' : 'right'}
                      delay={300}
                    >
                      <div className="grid grid-cols-3 gap-3">
                        {secondary.map(function (item) {
                          return (
                            <Link
                              key={item.id}
                              href={'/content/' + item.id}
                              className="group block border transition-colors"
                              style={{ borderColor: '#dde1e8' }}
                            >
                              {item.image_url && (
                                <div className="aspect-[4/3] overflow-hidden">
                                  <Image
                                    src={item.image_url}
                                    alt=""
                                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                                    width={400}
                                    height={300}
                                  />
                                </div>
                              )}
                              <div className="p-2.5">
                                <h4 className="text-xs leading-snug line-clamp-2 group-hover:underline" style={{ textDecorationColor: theme.color }}>
                                  {item.title}
                                </h4>
                              </div>
                            </Link>
                          )
                        })}
                      </div>
                    </ScrollReveal>
                  )}
                </div>
              </div>
            </div>
          </ParallaxSection>
        )
      })}

      {/* ══════════════════════════════════════════
          SPECTRUM BAR — the seven together
          ══════════════════════════════════════════ */}
      <div className="flex h-2 overflow-hidden">
        {Object.values(THEMES).map(function (theme) {
          return <div key={theme.slug} className="flex-1" style={{ backgroundColor: theme.color }} />
        })}
      </div>

      {/* ══════════════════════════════════════════
          CLOSING QUOTE
          ══════════════════════════════════════════ */}
      {quote && (
        <section className="py-16 sm:py-20" style={{ backgroundColor: '#0d1117' }}>
          <div className="max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <blockquote className="max-w-2xl mx-auto text-center">
                <p
                  className="text-xl sm:text-2xl lg:text-3xl leading-relaxed mb-6"
                  style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.85)' }}
                >
                  &ldquo;{quote.quote_text}&rdquo;
                </p>
                {quote.attribution && (
                  <cite
                    className="text-xs uppercase tracking-[0.15em] not-italic font-mono"
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                  >
                    {quote.attribution}
                  </cite>
                )}
              </blockquote>
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════
          FOOTER RETURN
          ══════════════════════════════════════════ */}
      <div className="py-10 text-center" style={{ backgroundColor: '#f4f5f7' }}>
        <Link
          href="/explore"
          className="hover:underline"
          style={{ fontStyle: 'italic', color: '#1b5e8a', fontSize: '1rem' }}
        >
          &larr; Back to The Exchange
        </Link>
      </div>
    </div>
  )
}
