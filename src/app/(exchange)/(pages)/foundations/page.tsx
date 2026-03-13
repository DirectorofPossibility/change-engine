import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { SpiralTracker } from '@/components/exchange/SpiralTracker'
import { getFoundationsIndex, getFoundationPathways, getFoundationFocusAreas } from '@/lib/data/exchange'
import FoundationsListClient from './FoundationsListClient'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Foundations | Change Engine',
  description: 'Explore Houston-area foundations — discover funding, focus areas, and connections across seven community pathways.',
}

// ── Design tokens ─────────────────────────────────────────────────────

const PARCHMENT = '#F5F0E8'
const PARCHMENT_WARM = '#EDE7D8'
const INK = '#1A1A1A'
const CLAY = '#C4663A'
const MUTED = '#7a7265'
const RULE_COLOR = 'rgba(196,102,58,0.3)'
const SERIF = 'Georgia, "Times New Roman", serif'
const MONO = '"Courier New", Courier, monospace'

export default async function FoundationsPage() {
  const raw = await getFoundationsIndex()
  const ids = raw.map((f: any) => f.id)

  const [pwLinks, faLinks] = await Promise.all([
    getFoundationPathways(ids),
    getFoundationFocusAreas(ids),
  ])

  const foundations = raw.map((f: any) => ({
    ...f,
    pathways: pwLinks.filter(p => p.foundation_id === f.id).map(p => p.pathway_id),
    focusAreas: faLinks
      .filter(a => a.foundation_id === f.id)
      .map(a => ({ name: a.focus_area, id: a.focus_id })),
  }))

  const spotlightCount = foundations.filter(f => f.is_spotlight).length
  const totalAssets = foundations.reduce((sum, f) => {
    if (!f.assets) return sum
    const m = f.assets.match(/([\d.]+)/)
    if (!m) return sum
    const n = parseFloat(m[1])
    return sum + (f.assets.includes('B') ? n * 1000 : n)
  }, 0)
  const assetStr = totalAssets >= 1000
    ? '$' + (totalAssets / 1000).toFixed(0) + 'B+'
    : '$' + totalAssets.toFixed(0) + 'M+'

  const uniqueFocusAreas = new Set(foundations.flatMap(f => f.focusAreas.map((fa: any) => fa.name))).size

  return (
    <div style={{ background: PARCHMENT }} className="min-h-screen">
      <SpiralTracker action="view_foundation" />

      {/* ── Hero ── */}
      <div className="relative overflow-hidden" style={{ background: PARCHMENT_WARM }}>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="relative max-w-[900px] mx-auto px-6 py-16">
          <p style={{ fontFamily: MONO, fontSize: '0.65rem', letterSpacing: '0.2em', color: MUTED }} className="uppercase mb-4">
            Change Engine
          </p>
          <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(2rem, 4vw, 3rem)', color: INK, lineHeight: 1.1 }}>
            Foundations
          </h1>
          <p style={{ fontFamily: SERIF, fontSize: '1.1rem', color: MUTED, lineHeight: 1.7 }} className="mt-4 max-w-xl">
            The foundations funding Houston -- all in one place. They fund the work. We make it findable.
          </p>
          <div className="flex flex-wrap gap-6 mt-6">
            <div>
              <span style={{ fontFamily: SERIF, fontSize: '1.5rem', color: INK, fontWeight: 700 }}>{foundations.length}</span>
              <span style={{ fontFamily: MONO, fontSize: '0.6875rem', color: MUTED, letterSpacing: '0.1em', marginLeft: '0.5rem' }} className="uppercase">Foundations</span>
            </div>
            <div>
              <span style={{ fontFamily: SERIF, fontSize: '1.5rem', color: INK, fontWeight: 700 }}>{assetStr}</span>
              <span style={{ fontFamily: MONO, fontSize: '0.6875rem', color: MUTED, letterSpacing: '0.1em', marginLeft: '0.5rem' }} className="uppercase">Est. Assets</span>
            </div>
            <div>
              <span style={{ fontFamily: SERIF, fontSize: '1.5rem', color: INK, fontWeight: 700 }}>{uniqueFocusAreas}</span>
              <span style={{ fontFamily: MONO, fontSize: '0.6875rem', color: MUTED, letterSpacing: '0.1em', marginLeft: '0.5rem' }} className="uppercase">Focus Areas</span>
            </div>
            {spotlightCount > 0 && (
              <div>
                <span style={{ fontFamily: SERIF, fontSize: '1.5rem', color: INK, fontWeight: 700 }}>{spotlightCount}</span>
                <span style={{ fontFamily: MONO, fontSize: '0.6875rem', color: MUTED, letterSpacing: '0.1em', marginLeft: '0.5rem' }} className="uppercase">Spotlighted</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Breadcrumb ── */}
      <div className="max-w-[900px] mx-auto px-6 pt-6 pb-2">
        <nav style={{ fontFamily: MONO, fontSize: '0.65rem', letterSpacing: '0.12em', color: MUTED }} className="uppercase">
          <Link href="/" className="hover:underline" style={{ color: CLAY }}>Home</Link>
          <span className="mx-2">/</span>
          <span>Foundations</span>
        </nav>
      </div>

      <div className="max-w-[900px] mx-auto px-6 py-10">
        {/* What You Can Do */}
        <section className="mb-10">
          <div className="flex items-baseline gap-4 mb-6">
            <h2 style={{ fontFamily: SERIF, fontSize: '1.5rem', color: INK }}>What You Can Do</h2>
            <div className="flex-1" style={{ height: 1, borderBottom: '1px dotted', borderColor: RULE_COLOR }} />
          </div>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 mt-2 flex-shrink-0" style={{ backgroundColor: CLAY }} />
              <span style={{ fontFamily: SERIF, fontSize: '0.9rem', color: MUTED, lineHeight: 1.6 }}>
                <strong style={{ color: INK }}>Find foundations working on what you care about.</strong> Browse by issue area.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 mt-2 flex-shrink-0" style={{ backgroundColor: CLAY }} />
              <span style={{ fontFamily: SERIF, fontSize: '0.9rem', color: MUTED, lineHeight: 1.6 }}>
                <strong style={{ color: INK }}>See who they fund.</strong> Connect the dots between money and mission.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 mt-2 flex-shrink-0" style={{ backgroundColor: CLAY }} />
              <span style={{ fontFamily: SERIF, fontSize: '0.9rem', color: MUTED, lineHeight: 1.6 }}>
                <strong style={{ color: INK }}>Understand the landscape.</strong> Whether you are a nonprofit, a researcher, or just curious -- start here.
              </span>
            </li>
          </ul>
        </section>

        <div className="my-10" style={{ height: 1, background: RULE_COLOR }} />

        {/* List view */}
        <FoundationsListClient
          foundations={foundations}
          totalCount={foundations.length}
        />

        <div className="my-10" style={{ height: 1, background: RULE_COLOR }} />

        {/* ── Footer links ── */}
        <div className="flex flex-wrap gap-6 py-4">
          <Link href="/organizations" style={{ fontFamily: MONO, fontSize: '0.7rem', color: CLAY, letterSpacing: '0.1em' }} className="uppercase hover:underline">
            Organizations
          </Link>
          <Link href="/services" style={{ fontFamily: MONO, fontSize: '0.7rem', color: CLAY, letterSpacing: '0.1em' }} className="uppercase hover:underline">
            Services
          </Link>
          <Link href="/officials" style={{ fontFamily: MONO, fontSize: '0.7rem', color: CLAY, letterSpacing: '0.1em' }} className="uppercase hover:underline">
            Officials
          </Link>
          <Link href="/" style={{ fontFamily: MONO, fontSize: '0.7rem', color: CLAY, letterSpacing: '0.1em' }} className="uppercase hover:underline ml-auto">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
