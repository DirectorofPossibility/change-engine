import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { cookies } from 'next/headers'
import { getSuperNeighborhoods, getLangId, fetchTranslationsForTable } from '@/lib/data/exchange'
import { THEMES } from '@/lib/constants'
import { SuperNeighborhoodsMap } from './SuperNeighborhoodsMap'
import { getUIStrings } from '@/lib/i18n'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Super Neighborhoods — Change Engine',
  description: 'Explore Houston\'s 88 super neighborhoods. View boundaries, demographics, and community resources.',
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

export default async function SuperNeighborhoodsPage() {
  const superNeighborhoods = await getSuperNeighborhoods()
  const langId = await getLangId()
  const translations = langId
    ? await fetchTranslationsForTable('super_neighborhoods', superNeighborhoods.map(sn => sn.sn_id), langId)
    : {}

  const cookieStore = await cookies()
  const lang = cookieStore.get('lang')?.value || 'en'
  const t = getUIStrings(lang)

  const VISIBLE_COUNT = 12

  return (
    <div style={{ background: PARCHMENT }} className="min-h-screen">
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
            Super Neighborhoods
          </h1>
          <p style={{ fontFamily: SERIF, fontSize: '1.1rem', color: MUTED, lineHeight: 1.7 }} className="mt-4 max-w-xl">
            {t('superNeighborhoods.intro')}
          </p>
        </div>
      </div>

      {/* ── Breadcrumb ── */}
      <div className="max-w-[900px] mx-auto px-6 pt-6 pb-2">
        <nav style={{ fontFamily: MONO, fontSize: '0.65rem', letterSpacing: '0.12em', color: MUTED }} className="uppercase">
          <Link href="/" className="hover:underline" style={{ color: CLAY }}>Home</Link>
          <span className="mx-2">/</span>
          <span>Super Neighborhoods</span>
        </nav>
      </div>

      <div className="max-w-[900px] mx-auto px-6 py-10">
        {/* ── Interactive map ── */}
        <section className="mb-10">
          <div className="flex items-baseline gap-4 mb-4">
            <h2 style={{ fontFamily: SERIF, fontSize: '1.5rem', color: INK }}>Boundary Map</h2>
            <div className="flex-1" style={{ height: 1, borderBottom: '1px dotted', borderColor: RULE_COLOR }} />
          </div>
          <div style={{ border: '1px solid ' + RULE_COLOR }}>
            <SuperNeighborhoodsMap />
          </div>
        </section>

        <div className="my-10" style={{ height: 1, background: RULE_COLOR }} />

        {/* ── Grid of super neighborhoods ── */}
        <section>
          <div className="flex items-baseline gap-4 mb-6">
            <h2 style={{ fontFamily: SERIF, fontSize: '1.5rem', color: INK }}>
              {t('superNeighborhoods.all_heading')}
            </h2>
            <div className="flex-1" style={{ height: 1, borderBottom: '1px dotted', borderColor: RULE_COLOR }} />
            <span style={{ fontFamily: MONO, fontSize: '0.6rem', color: MUTED, letterSpacing: '0.1em' }} className="uppercase">{superNeighborhoods.length} total</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0" style={{ border: '1px solid ' + RULE_COLOR }}>
            {superNeighborhoods.slice(0, VISIBLE_COUNT).map(sn => (
              <Link
                key={sn.sn_id}
                href={'/super-neighborhoods/' + sn.sn_id}
                className="group p-4 transition-colors hover:bg-white/50"
                style={{ borderRight: '1px solid ' + RULE_COLOR, borderBottom: '1px solid ' + RULE_COLOR }}
              >
                <div className="flex items-start gap-3">
                  <span
                    className="w-8 h-8 flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ fontFamily: MONO, backgroundColor: INK }}
                  >
                    {sn.sn_number}
                  </span>
                  <div className="min-w-0">
                    <h3 style={{ fontFamily: SERIF, fontSize: '0.9rem', color: INK }} className="truncate group-hover:underline">
                      {translations[sn.sn_id]?.title || sn.sn_name}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      {sn.population != null && (
                        <span style={{ fontFamily: MONO, fontSize: '0.6rem', color: MUTED }}>
                          Pop. {sn.population.toLocaleString()}
                        </span>
                      )}
                      {sn.median_income != null && (
                        <span style={{ fontFamily: MONO, fontSize: '0.6rem', color: MUTED }}>
                          ${sn.median_income.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {superNeighborhoods.length > VISIBLE_COUNT && (
            <details className="mt-4">
              <summary style={{ fontFamily: MONO, fontSize: '0.65rem', color: CLAY, letterSpacing: '0.1em', cursor: 'pointer' }} className="uppercase hover:underline py-2">
                Show all {superNeighborhoods.length} super neighborhoods
              </summary>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0 mt-2" style={{ border: '1px solid ' + RULE_COLOR }}>
                {superNeighborhoods.slice(VISIBLE_COUNT).map(sn => (
                  <Link
                    key={sn.sn_id}
                    href={'/super-neighborhoods/' + sn.sn_id}
                    className="group p-4 transition-colors hover:bg-white/50"
                    style={{ borderRight: '1px solid ' + RULE_COLOR, borderBottom: '1px solid ' + RULE_COLOR }}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className="w-8 h-8 flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ fontFamily: MONO, backgroundColor: INK }}
                      >
                        {sn.sn_number}
                      </span>
                      <div className="min-w-0">
                        <h3 style={{ fontFamily: SERIF, fontSize: '0.9rem', color: INK }} className="truncate group-hover:underline">
                          {translations[sn.sn_id]?.title || sn.sn_name}
                        </h3>
                        <div className="flex items-center gap-3 mt-1">
                          {sn.population != null && (
                            <span style={{ fontFamily: MONO, fontSize: '0.6rem', color: MUTED }}>
                              Pop. {sn.population.toLocaleString()}
                            </span>
                          )}
                          {sn.median_income != null && (
                            <span style={{ fontFamily: MONO, fontSize: '0.6rem', color: MUTED }}>
                              ${sn.median_income.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </details>
          )}
        </section>

        <div className="my-10" style={{ height: 1, background: RULE_COLOR }} />

        {/* ── Footer link ── */}
        <div className="text-center py-4">
          <Link href="/" style={{ fontFamily: MONO, fontSize: '0.7rem', color: CLAY, letterSpacing: '0.1em' }} className="uppercase hover:underline">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
