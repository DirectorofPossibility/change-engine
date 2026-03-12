import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { THEMES } from '@/lib/constants'
import { getFocusAreas, getSDGs, getSDOHDomains } from '@/lib/data/exchange'
import { getUnifiedKBItems } from '@/lib/data/library'
import { ExploreFilterClient } from './ExploreFilterClient'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { getUIStrings } from '@/lib/i18n'
import { Layers, BookOpen, Sparkles, ArrowRight } from 'lucide-react'
import { IndexWayfinder } from '@/components/exchange/IndexWayfinder'
import { FeaturedPromo } from '@/components/exchange/FeaturedPromo'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Explore — Community Exchange',
  description: 'Your launchpad for learning: browse the Knowledge Base, Research Library, Knowledge Galaxy, and focus area explorer.',
}

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
    <div>
      {/* Compact hero */}
      <div className="bg-white border-b border-brand-border">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Breadcrumb items={[{ label: 'Explore' }]} />
          <div className="flex items-center gap-3 mt-4 mb-2">
            <div className="w-3 h-3 rounded-full bg-brand-accent" />
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-brand-text">Explore</h1>
          </div>
          <p className="text-brand-muted max-w-2xl">
            Your launchpad for learning. Dive into articles, research, interactive visualizations, and focus areas across all seven pathways.
          </p>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10">

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
          <div>
            {/* ── Three feature cards ── */}
            <div className="grid sm:grid-cols-3 gap-5 mb-14">
              <Link
                href="/explore/knowledge-base"
                className="group bg-white border border-brand-border p-6 hover:shadow-lg transition-shadow"
              >
                <div className="w-11 h-11 bg-brand-accent/10 flex items-center justify-center mb-4">
                  <Layers size={20} className="text-brand-accent" />
                </div>
                <h2 className="font-display font-bold text-brand-text text-lg mb-1 group-hover:text-brand-accent transition-colors">
                  Knowledge Base
                </h2>
                <p className="text-sm text-brand-muted leading-relaxed mb-3">
                  {totalItems > 0
                    ? 'Browse ' + totalItems + ' articles, guides, and reports organized by pathway and topic.'
                    : 'Browse articles and research organized by pathway and topic.'}
                </p>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-accent group-hover:gap-2 transition-all">
                  Browse <ArrowRight size={13} />
                </span>
              </Link>

              <Link
                href="/library"
                className="group bg-white border border-brand-border p-6 hover:shadow-lg transition-shadow"
              >
                <div className="w-11 h-11 bg-brand-accent/10 flex items-center justify-center mb-4">
                  <BookOpen size={20} className="text-brand-accent" />
                </div>
                <h2 className="font-display font-bold text-brand-text text-lg mb-1 group-hover:text-brand-accent transition-colors">
                  Research Library
                </h2>
                <p className="text-sm text-brand-muted leading-relaxed mb-3">
                  Curated reports, white papers, and policy documents with key takeaways and reading guides.
                </p>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-accent group-hover:gap-2 transition-all">
                  Read <ArrowRight size={13} />
                </span>
              </Link>

              <Link
                href="/knowledge-graph"
                className="group bg-white border border-brand-border p-6 hover:shadow-lg transition-shadow"
              >
                <div className="w-11 h-11 bg-brand-accent/10 flex items-center justify-center mb-4">
                  <Sparkles size={20} className="text-brand-accent" />
                </div>
                <h2 className="font-display font-bold text-brand-text text-lg mb-1 group-hover:text-brand-accent transition-colors">
                  Knowledge Galaxy
                </h2>
                <p className="text-sm text-brand-muted leading-relaxed mb-3">
                  Interactive visualization of the civic knowledge network — pathways, centers, and 1,500+ connections.
                </p>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-accent group-hover:gap-2 transition-all">
                  Explore <ArrowRight size={13} />
                </span>
              </Link>
            </div>

            {/* ── Quick pathway links ── */}
            <section className="mb-14">
              <h2 className="text-sm font-bold tracking-[0.12em] uppercase text-brand-muted mb-4 font-display">Browse by Pathway</h2>
              <div className="flex flex-wrap gap-3">
                {themes.map(function (theme) {
                  return (
                    <Link
                      key={theme.id}
                      href={'/pathways/' + (THEMES as Record<string, { slug: string }>)[theme.id].slug}
                      className="group flex items-center gap-2 px-4 py-2.5 bg-white border border-brand-border hover:shadow-md transition-shadow"
                    >
                      <div
                        className="w-6 h-6 rounded-md flex items-center justify-center"
                        style={{ backgroundColor: theme.color + '18' }}
                      >
                        <span className="text-sm">{theme.emoji}</span>
                      </div>
                      <span className="text-sm font-medium text-brand-text group-hover:text-brand-accent transition-colors">
                        {theme.name}
                      </span>
                      <span className="text-[10px] text-brand-muted">
                        {theme.focusAreas.length}
                      </span>
                    </Link>
                  )
                })}
              </div>
            </section>

            {/* ── Focus Area Explorer ── */}
            <section>
              <h2 className="text-2xl font-display font-bold text-brand-text mb-6">Focus Areas</h2>
              <ExploreFilterClient
                themes={themes}
                unthemedAreas={unthemed}
                sdgs={sdgs.map(function (s) { return { sdg_id: s.sdg_id, sdg_number: s.sdg_number, sdg_name: s.sdg_name, sdg_color: s.sdg_color } })}
                sdohDomains={sdohDomains.map(function (d) { return { sdoh_code: d.sdoh_code, sdoh_name: d.sdoh_name } })}
              />
            </section>
          </div>
          <div className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              <IndexWayfinder currentPage="explore" related={[{label:'Library',href:'/library'},{label:'Topics',href:'/pathways'},{label:'Knowledge Galaxy',href:'/knowledge-graph'}]} color="#C75B2A" />
              <FeaturedPromo variant="card" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
