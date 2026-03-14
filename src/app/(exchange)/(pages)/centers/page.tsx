/**
 * @fileoverview Centers index — the four doorways into the Exchange.
 *
 * Editorial culture-guide design: parchment palette, Georgia serif,
 * Courier New mono, sacred geometry motifs. Each center is a chapter
 * doorway with guiding question, description, resource count,
 * and top pathways.
 *
 * @route GET /centers
 * @caching ISR with revalidate = 3600 (1 hour)
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { CENTERS, CENTER_COLORS, THEMES } from '@/lib/constants'
import { getCenterEntityCounts } from '@/lib/data/entity-graph'

// ── Design tokens (locked — matches CommunityGuide.tsx) ─────────────────


// ── Center metadata ─────────────────────────────────────────────────────

const CENTER_META: Record<string, {
  motif: string
  tagline: string
  description: string
  bg: string
}> = {
  Learning: {
    motif: '/images/fol/vesica-piscis.svg',
    tagline: 'Knowledge is the first step.',
    description: 'Understand what is happening in your community. Read research, explore data, and learn how issues connect to your daily life.',
    bg: '#f4f5f7',
  },
  Resource: {
    motif: '/images/fol/seed-of-life.svg',
    tagline: 'Your community has resources waiting.',
    description: 'Discover what\u2019s available. Services, benefits, hotlines, and organizations ready to support you.',
    bg: '#f4f5f7',
  },
  Action: {
    motif: '/images/fol/tripod-of-life.svg',
    tagline: 'Your energy can change things.',
    description: 'Put your energy into motion. Volunteer, attend events, sign petitions, join campaigns, and organize with your neighbors.',
    bg: '#F0EBE1',
  },
  Accountability: {
    motif: '/images/fol/metatrons-cube.svg',
    tagline: 'Follow the trail.',
    description: 'Know who makes decisions and how to influence them. Track officials, follow policy, and show up at public meetings.',
    bg: '#f4f5f7',
  },
}

export const metadata: Metadata = {
  title: 'The Four Centers — Community Exchange | The Change Engine',
  description: 'Four doorways into Houston civic life: Learning, Resource, Action, and Accountability. Each center answers a different question about your community.',
}

export const revalidate = 3600

export default async function CentersIndexPage() {
  const supabase = await createClient()

  const centerNames = Object.keys(CENTERS)
  const [{ data: allContent }, entityCounts] = await Promise.all([
    supabase
      .from('content_published')
      .select('center, pathway_primary')
      .eq('is_active', true),
    getCenterEntityCounts(),
  ])

  // Compute pathway breakdown per center
  const pwCountsByCenter: Record<string, Record<string, number>> = {}

  for (const row of (allContent ?? [])) {
    const c = row.center || 'Learning'
    if (row.pathway_primary) {
      if (!pwCountsByCenter[c]) pwCountsByCenter[c] = {}
      pwCountsByCenter[c][row.pathway_primary] = (pwCountsByCenter[c][row.pathway_primary] || 0) + 1
    }
  }

  const topPathways: Record<string, Array<{ id: string; name: string; color: string; count: number }>> = {}
  for (const name of centerNames) {
    const pwCounts = pwCountsByCenter[name] || {}
    topPathways[name] = Object.entries(pwCounts)
      .sort(function (a, b) { return b[1] - a[1] })
      .slice(0, 5)
      .map(function ([id, count]) {
        const theme = (THEMES as Record<string, { name: string; color: string }>)[id]
        return { id, name: theme?.name || id, color: theme?.color || '#8B7E74', count }
      })
  }

  const totalResources = Object.values(entityCounts).reduce(function (sum, c) { return sum + c.total }, 0)

  return (
    <div style={{ background: '#ffffff' }}>

      {/* ═══════════════════════════════════════════════════════════════════
          HERO — Title + philosophy
          ═══════════════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden bg-paper"
      >
        {/* FOL watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
          <Image
            src="/images/fol/flower-full.svg"
            alt=""
            width={500}
            height={500}
            className="opacity-[0.05]"
          />
        </div>

        {/* Top rule */}
        <div style={{ height: 3, background: '#1b5e8a' }} />

        <div className="relative z-10 max-w-[900px] mx-auto px-6 py-16 md:py-20 text-center">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb">
            <p style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              <Link href="/exchange" className="hover:underline" style={{ color: "#5c6474" }}>
                The Exchange
              </Link>
              <span style={{ color: "#5c6474" }}> / </span>
              <span style={{ color: "#1b5e8a" }}>Centers</span>
            </p>
          </nav>

          <h1
            className="mt-8"
            style={{ fontSize: 'clamp(30px, 5vw, 48px)', lineHeight: 1.15 }}
          >
            Four doorways in.
          </h1>

          <p
            className="mt-5 mx-auto"
            style={{ fontSize: 'clamp(15px, 2vw, 18px)', color: "#5c6474", lineHeight: 1.7, maxWidth: 520 }}
          >
            Every piece of content in the Exchange lives in one of four centers.
            Each answers a different question about your community.
          </p>

          <p
            className="mt-5"
            style={{ fontSize: 12, color: "#1b5e8a", letterSpacing: '0.06em' }}
          >
            {totalResources} resources across {centerNames.length} centers
          </p>

          {/* Rule */}
          <div className="mx-auto mt-8" style={{ width: 60, height: 2, background: '#1b5e8a' }} />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          THE FOUR CENTERS — Full-width doorway cards
          ═══════════════════════════════════════════════════════════════ */}
      <section>
        {centerNames.map(function (name, i) {
          const config = CENTERS[name]
          const meta = CENTER_META[name]
          const color = CENTER_COLORS[name] || '#8B7E74'
          const ec = entityCounts[name] || { content: 0, services: 0, orgs: 0, total: 0 }
          const count = ec.total
          const pathways = topPathways[name] || []
          if (!meta) return null

          const isEven = i % 2 === 0

          return (
            <Link
              key={name}
              href={'/centers/' + config.slug}
              className="group block relative overflow-hidden transition-all"
              style={{
                background: meta.bg,
                borderBottom: `1px solid ${'#dde1e8'}`,
              }}
            >
              {/* Color accent bar on left */}
              <div
                className="absolute left-0 top-0 bottom-0 w-1 group-hover:w-1.5 transition-all"
                style={{ background: color }}
              />

              {/* Sacred geometry motif */}
              <div
                className="absolute pointer-events-none opacity-[0.06]"
                aria-hidden="true"
                style={{
                  right: isEven ? -40 : undefined,
                  left: isEven ? undefined : -40,
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              >
                <Image src={meta.motif} alt="" width={320} height={320} />
              </div>

              <div className="relative z-10 max-w-[1000px] mx-auto px-8 md:px-12 py-14 md:py-16">
                <div className={`grid grid-cols-1 md:grid-cols-[1fr_280px] gap-8 items-start ${isEven ? '' : 'md:grid-cols-[280px_1fr]'}`}>
                  {/* Main content */}
                  <div className={isEven ? 'order-1' : 'order-1 md:order-2'}>
                    {/* Label */}
                    <p style={{ fontSize: 11, letterSpacing: '0.12em', color, textTransform: 'uppercase', marginBottom: 12 }}>
                      Chapter {i + 1} &middot; {count} resources
                    </p>

                    {/* Center name as headline */}
                    <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 36px)', lineHeight: 1.15, marginBottom: 8 }}>
                      {name} Center
                    </h2>

                    {/* Guiding question */}
                    <p style={{ fontSize: 18, fontStyle: 'italic', color: "#5c6474", marginBottom: 16 }}>
                      {config.question}
                    </p>

                    {/* Description */}
                    <p style={{ fontSize: 15, lineHeight: 1.7, opacity: 0.85, maxWidth: 480 }}>
                      {meta.description}
                    </p>

                    {/* CTA */}
                    <span
                      className="inline-block mt-6 group-hover:text-[#a8522e] transition-colors"
                      style={{ fontSize: 14, fontStyle: 'italic', color: "#1b5e8a" }}
                    >
                      Turn to chapter &rarr;
                    </span>
                  </div>

                  {/* Pathway breakdown */}
                  <div className={`${isEven ? 'order-2' : 'order-2 md:order-1'} hidden md:block`}>
                    <p style={{ fontSize: 10, letterSpacing: '0.1em', color: "#5c6474", textTransform: 'uppercase', marginBottom: 12 }}>
                      Top pathways
                    </p>

                    <div className="space-y-0">
                      {pathways.map(function (pw) {
                        return (
                          <div
                            key={pw.id}
                            className="flex items-center gap-2 py-2"
                            style={{ borderBottom: `1px solid ${'#dde1e8'}` }}
                          >
                            <span className="w-2 h-2 flex-shrink-0" style={{ background: pw.color }} />
                            <span className="flex-1" style={{ fontSize: 14,  }}>
                              {pw.name}
                            </span>
                            <span style={{ fontSize: 12, color: "#5c6474" }}>
                              {pw.count}
                            </span>
                          </div>
                        )
                      })}
                    </div>

                    {/* Tagline */}
                    <p className="mt-4" style={{ fontSize: 13, fontStyle: 'italic', color: "#5c6474" }}>
                      {meta.tagline}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FOOTER CODA
          ═══════════════════════════════════════════════════════════════ */}
      <div className="text-center py-10 bg-paper">
        <Link
          href="/exchange"
          className="hover:underline"
          style={{ fontSize: 14, fontStyle: 'italic', color: "#1b5e8a" }}
        >
          &larr; Back to The Community Exchange
        </Link>
      </div>
    </div>
  )
}
