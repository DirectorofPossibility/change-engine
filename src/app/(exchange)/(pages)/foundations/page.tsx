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
    <div className="bg-paper min-h-screen">
      <SpiralTracker action="view_foundation" />

      {/* ── Hero ── */}
      <div className="relative overflow-hidden bg-paper">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="relative max-w-[900px] mx-auto px-6 py-16">
          <p style={{ fontSize: '0.65rem', letterSpacing: '0.2em', color: "#5c6474" }} className="uppercase mb-4">
            Change Engine
          </p>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1.1 }}>
            Foundations
          </h1>
          <p style={{ fontSize: '1.1rem', color: "#5c6474", lineHeight: 1.7 }} className="mt-4 max-w-xl">
            The foundations funding Houston -- all in one place. They fund the work. We make it findable.
          </p>
          <div className="flex flex-wrap gap-6 mt-6">
            <div>
              <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>{foundations.length}</span>
              <span style={{ fontSize: '0.6875rem', color: "#5c6474", letterSpacing: '0.1em', marginLeft: '0.5rem' }} className="uppercase">Foundations</span>
            </div>
            <div>
              <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>{assetStr}</span>
              <span style={{ fontSize: '0.6875rem', color: "#5c6474", letterSpacing: '0.1em', marginLeft: '0.5rem' }} className="uppercase">Est. Assets</span>
            </div>
            <div>
              <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>{uniqueFocusAreas}</span>
              <span style={{ fontSize: '0.6875rem', color: "#5c6474", letterSpacing: '0.1em', marginLeft: '0.5rem' }} className="uppercase">Focus Areas</span>
            </div>
            {spotlightCount > 0 && (
              <div>
                <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>{spotlightCount}</span>
                <span style={{ fontSize: '0.6875rem', color: "#5c6474", letterSpacing: '0.1em', marginLeft: '0.5rem' }} className="uppercase">Spotlighted</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Breadcrumb ── */}
      <div className="max-w-[900px] mx-auto px-6 pt-6 pb-2">
        <nav style={{ fontSize: '0.65rem', letterSpacing: '0.12em', color: "#5c6474" }} className="uppercase">
          <Link href="/" className="hover:underline" style={{ color: "#1b5e8a" }}>Home</Link>
          <span className="mx-2">/</span>
          <span>Foundations</span>
        </nav>
      </div>

      <div className="max-w-[900px] mx-auto px-6 py-10">
        {/* What You Can Do */}
        <section className="mb-10">
          <div className="flex items-baseline gap-4 mb-6">
            <h2 style={{ fontSize: '1.5rem',  }}>What You Can Do</h2>
            <div className="flex-1" style={{ height: 1, borderBottom: '1px dotted', borderColor: '#dde1e8' }} />
          </div>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 mt-2 flex-shrink-0" style={{ backgroundColor: '#1b5e8a' }} />
              <span style={{ fontSize: '0.9rem', color: "#5c6474", lineHeight: 1.6 }}>
                <strong style={{  }}>Find foundations working on what you care about.</strong> Browse by issue area.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 mt-2 flex-shrink-0" style={{ backgroundColor: '#1b5e8a' }} />
              <span style={{ fontSize: '0.9rem', color: "#5c6474", lineHeight: 1.6 }}>
                <strong style={{  }}>See who they fund.</strong> Connect the dots between money and mission.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 mt-2 flex-shrink-0" style={{ backgroundColor: '#1b5e8a' }} />
              <span style={{ fontSize: '0.9rem', color: "#5c6474", lineHeight: 1.6 }}>
                <strong style={{  }}>Understand the landscape.</strong> Whether you are a nonprofit, a researcher, or just curious -- start here.
              </span>
            </li>
          </ul>
        </section>

        <div className="my-10" style={{ height: 1, background: '#dde1e8' }} />

        {/* List view */}
        <FoundationsListClient
          foundations={foundations}
          totalCount={foundations.length}
        />

        <div className="my-10" style={{ height: 1, background: '#dde1e8' }} />

        {/* ── Footer links ── */}
        <div className="flex flex-wrap gap-6 py-4">
          <Link href="/organizations" style={{ fontSize: '0.7rem', color: "#1b5e8a", letterSpacing: '0.1em' }} className="uppercase hover:underline">
            Organizations
          </Link>
          <Link href="/services" style={{ fontSize: '0.7rem', color: "#1b5e8a", letterSpacing: '0.1em' }} className="uppercase hover:underline">
            Services
          </Link>
          <Link href="/officials" style={{ fontSize: '0.7rem', color: "#1b5e8a", letterSpacing: '0.1em' }} className="uppercase hover:underline">
            Officials
          </Link>
          <Link href="/" style={{ fontSize: '0.7rem', color: "#1b5e8a", letterSpacing: '0.1em' }} className="uppercase hover:underline ml-auto">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
