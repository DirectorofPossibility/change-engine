import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import Link from 'next/link'
import Image from 'next/image'
import { THEMES } from '@/lib/constants'
import { getFocusAreas, getSDGs, getSDOHDomains } from '@/lib/data/exchange'
import { getUnifiedKBItems } from '@/lib/data/library'
import { ExploreFilterClient } from './ExploreFilterClient'
import { getUIStrings } from '@/lib/i18n'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Explore — Change Engine',
  description: 'Your launchpad for learning: browse the Knowledge Base, Research Library, Knowledge Galaxy, and focus area explorer.',
}

// ── Design tokens ─────────────────────────────────────────────────────


const THEME_I18N: Record<string, string> = {
  THEME_01: 'theme.our_health',
  THEME_02: 'theme.our_families',
  THEME_03: 'theme.our_neighborhood',
  THEME_04: 'theme.our_voice',
  THEME_05: 'theme.our_money',
  THEME_06: 'theme.our_planet',
  THEME_07: 'theme.the_bigger_we',
}

export default async function ExplorePage() {
  const [focusAreas, sdgs, sdohDomains, kbItems] = await Promise.all([
    getFocusAreas(),
    getSDGs(),
    getSDOHDomains(),
    getUnifiedKBItems(),
  ])

  const cookieStore = await cookies()
  const lang = cookieStore.get('lang')?.value || 'en'
  const t = getUIStrings(lang)

  const totalItems = kbItems.length

  const themes = Object.entries(THEMES).map(function ([id, theme]) {
    return {
      id,
      name: t(THEME_I18N[id] || '') || theme.name,
      color: theme.color,
      emoji: theme.emoji,
      focusAreas: focusAreas.filter(function (fa) { return fa.theme_id === id }),
    }
  })

  const unthemed = focusAreas.filter(function (fa) { return !fa.theme_id })

  return (
    <div className="bg-paper min-h-screen">
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
            Explore
          </h1>
          <p style={{ fontSize: '1.1rem', color: "#5c6474", lineHeight: 1.7 }} className="mt-4 max-w-xl">
            Your launchpad for learning. Dive into articles, research, interactive visualizations, and focus areas across all seven pathways.
          </p>
        </div>
      </div>

      {/* ── Breadcrumb ── */}
      <div className="max-w-[900px] mx-auto px-6 pt-6 pb-2">
        <nav style={{ fontSize: '0.65rem', letterSpacing: '0.12em', color: "#5c6474" }} className="uppercase">
          <Link href="/" className="hover:underline" style={{ color: "#1b5e8a" }}>Home</Link>
          <span className="mx-2">/</span>
          <span>Explore</span>
        </nav>
      </div>

      <div className="max-w-[900px] mx-auto px-6 py-10">

        {/* ── Three feature links ── */}
        <section>
          <div className="flex items-baseline gap-4 mb-6">
            <h2 style={{ fontSize: '1.5rem',  }}>Start Here</h2>
            <div className="flex-1" style={{ height: 1, borderBottom: '1px dotted', borderColor: '#dde1e8' }} />
            <span style={{ fontSize: '0.6875rem', color: "#5c6474", letterSpacing: '0.1em' }} className="uppercase">3 paths</span>
          </div>

          <div className="grid sm:grid-cols-3 gap-0" style={{ border: '1px solid #dde1e8' }}>
            <Link
              href="/explore/knowledge-base"
              className="group p-6 hover:bg-white/50 transition-colors"
              style={{ borderRight: '1px solid #dde1e8' }}
            >
              <p style={{ fontSize: '0.6875rem', letterSpacing: '0.15em', color: "#1b5e8a" }} className="uppercase mb-3">Knowledge Base</p>
              <h3 style={{ fontSize: '1.05rem', lineHeight: 1.3 }} className="mb-2 group-hover:underline">
                Knowledge Base
              </h3>
              <p style={{ fontSize: '0.85rem', color: "#5c6474", lineHeight: 1.6 }}>
                {totalItems > 0
                  ? 'Browse ' + totalItems + ' articles, guides, and reports organized by pathway and topic.'
                  : 'Browse articles and research organized by pathway and topic.'}
              </p>
            </Link>

            <Link
              href="/library"
              className="group p-6 hover:bg-white/50 transition-colors"
              style={{ borderRight: '1px solid #dde1e8' }}
            >
              <p style={{ fontSize: '0.6875rem', letterSpacing: '0.15em', color: "#1b5e8a" }} className="uppercase mb-3">Library</p>
              <h3 style={{ fontSize: '1.05rem', lineHeight: 1.3 }} className="mb-2 group-hover:underline">
                Research Library
              </h3>
              <p style={{ fontSize: '0.85rem', color: "#5c6474", lineHeight: 1.6 }}>
                Curated reports, white papers, and policy documents with key takeaways and reading guides.
              </p>
            </Link>

            <Link
              href="/knowledge-graph"
              className="group p-6 hover:bg-white/50 transition-colors"
            >
              <p style={{ fontSize: '0.6875rem', letterSpacing: '0.15em', color: "#1b5e8a" }} className="uppercase mb-3">Visualization</p>
              <h3 style={{ fontSize: '1.05rem', lineHeight: 1.3 }} className="mb-2 group-hover:underline">
                Knowledge Galaxy
              </h3>
              <p style={{ fontSize: '0.85rem', color: "#5c6474", lineHeight: 1.6 }}>
                Interactive visualization of the civic knowledge network -- pathways, centers, and 1,500+ connections.
              </p>
            </Link>
          </div>
        </section>

        <div className="my-10" style={{ height: 1, background: '#dde1e8' }} />

        {/* ── Browse by Pathway ── */}
        <section>
          <div className="flex items-baseline gap-4 mb-6">
            <h2 style={{ fontSize: '1.5rem',  }}>Browse by Pathway</h2>
            <div className="flex-1" style={{ height: 1, borderBottom: '1px dotted', borderColor: '#dde1e8' }} />
            <span style={{ fontSize: '0.6875rem', color: "#5c6474", letterSpacing: '0.1em' }} className="uppercase">{themes.length} pathways</span>
          </div>

          <div className="flex flex-wrap gap-3">
            {themes.map(function (theme) {
              return (
                <Link
                  key={theme.id}
                  href={'/pathways/' + (THEMES as Record<string, { slug: string }>)[theme.id].slug}
                  className="group flex items-center gap-2 px-4 py-2.5 hover:bg-white/50 transition-colors"
                  style={{ border: '1px solid #dde1e8' }}
                >
                  <span className="w-2 h-2" style={{ backgroundColor: theme.color }} />
                  <span style={{ fontSize: '0.88rem',  }} className="group-hover:underline">
                    {theme.name}
                  </span>
                  <span style={{ fontSize: '0.6875rem', color: "#5c6474" }}>
                    {theme.focusAreas.length}
                  </span>
                </Link>
              )
            })}
          </div>
        </section>

        <div className="my-10" style={{ height: 1, background: '#dde1e8' }} />

        {/* ── Focus Area Explorer ── */}
        <section>
          <div className="flex items-baseline gap-4 mb-6">
            <h2 style={{ fontSize: '1.5rem',  }}>Focus Areas</h2>
            <div className="flex-1" style={{ height: 1, borderBottom: '1px dotted', borderColor: '#dde1e8' }} />
          </div>
          <ExploreFilterClient
            themes={themes}
            unthemedAreas={unthemed}
            sdgs={sdgs.map(function (s) { return { sdg_id: s.sdg_id, sdg_number: s.sdg_number, sdg_name: s.sdg_name, sdg_color: s.sdg_color } })}
            sdohDomains={sdohDomains.map(function (d) { return { sdoh_code: d.sdoh_code, sdoh_name: d.sdoh_name } })}
          />
        </section>

        <div className="my-10" style={{ height: 1, background: '#dde1e8' }} />

        {/* ── Footer link ── */}
        <div className="text-center py-4">
          <Link href="/" style={{ fontSize: '0.7rem', color: "#1b5e8a", letterSpacing: '0.1em' }} className="uppercase hover:underline">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
