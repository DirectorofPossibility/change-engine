import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { THEMES } from '@/lib/constants'
import { getSuperNeighborhood, getNeighborhoodsBySuperNeighborhood, getMapMarkersForSuperNeighborhood, getLangId, fetchTranslationsForTable, getPoliciesForNeighborhood, getWayfinderContext } from '@/lib/data/exchange'
import { SuperNeighborhoodDetailMap } from './SuperNeighborhoodDetailMap'
import { getUIStrings } from '@/lib/i18n'
import { getUserProfile } from '@/lib/auth/roles'

export const revalidate = 300

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const sn = await getSuperNeighborhood(id)
  if (!sn) return { title: 'Not Found' }
  return {
    title: sn.sn_name + ' — Super Neighborhood',
    description: 'Community resources, services, and information for the ' + sn.sn_name + ' super neighborhood in Houston.',
  }
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

export default async function SuperNeighborhoodDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const userProfile = await getUserProfile()
  const [sn, neighborhoods, mapData, snPolicies, wayfinderData] = await Promise.all([
    getSuperNeighborhood(id),
    getNeighborhoodsBySuperNeighborhood(id),
    getMapMarkersForSuperNeighborhood(id),
    getPoliciesForNeighborhood(id),
    getWayfinderContext('super_neighborhood' as any, id, userProfile?.role),
  ])

  if (!sn) notFound()

  const langId = await getLangId()
  const snTranslations = langId
    ? await fetchTranslationsForTable('super_neighborhoods', [sn.sn_id], langId)
    : {}
  const serviceIds = mapData.services.map(s => s.service_id)
  const serviceTranslations = langId && serviceIds.length > 0
    ? await fetchTranslationsForTable('services_211', serviceIds, langId)
    : {}

  const cookieStore = await cookies()
  const lang = cookieStore.get('lang')?.value || 'en'
  const t = getUIStrings(lang)

  const snName = snTranslations[sn.sn_id]?.title || sn.sn_name
  const snDescription = snTranslations[sn.sn_id]?.summary || sn.description

  const markers = [
    ...mapData.services
      .filter(s => s.latitude != null && s.longitude != null)
      .slice(0, 30)
      .map(s => ({
        id: 'svc-' + s.service_id,
        lat: s.latitude as number,
        lng: s.longitude as number,
        title: serviceTranslations[s.service_id]?.title || s.service_name,
        type: 'service' as const,
        address: [s.address, s.city].filter(Boolean).join(', '),
        link: '/services/' + s.service_id,
      })),
    ...mapData.votingLocations
      .filter(v => v.latitude != null && v.longitude != null)
      .slice(0, 20)
      .map(v => ({
        id: 'vote-' + v.location_id,
        lat: v.latitude as number,
        lng: v.longitude as number,
        title: v.location_name,
        type: 'voting' as const,
        address: [v.address, v.city].filter(Boolean).join(', '),
      })),
    ...mapData.organizations
      .filter(o => o.latitude != null && o.longitude != null)
      .slice(0, 20)
      .map(o => ({
        id: 'org-' + o.org_id,
        lat: o.latitude as number,
        lng: o.longitude as number,
        title: o.org_name,
        type: 'organization' as const,
        link: '/organizations/' + o.org_id,
      })),
    ...(mapData.municipalServices ?? []).map(m => ({
      id: 'muni-' + m.id,
      lat: m.lat,
      lng: m.lng,
      title: m.title,
      type: (m.type || 'service') as 'service',
      address: m.address,
      phone: m.phone,
      link: m.link,
    })),
  ]

  const supabase = await createClient()
  const { data: childHoods } = await supabase
    .from('neighborhoods')
    .select('neighborhood_id')
    .eq('super_neighborhood_id', sn.sn_id)
  const hoodIds = (childHoods ?? []).map(h => h.neighborhood_id)
  let zips: string[] = []
  if (hoodIds.length > 0) {
    const { data: zipJunctions } = await supabase
      .from('neighborhood_zip_codes')
      .select('zip_code')
      .in('neighborhood_id', hoodIds)
    zips = Array.from(new Set((zipJunctions ?? []).map(j => j.zip_code)))
  }

  return (
    <div style={{ background: PARCHMENT }} className="min-h-screen">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden" style={{ background: PARCHMENT_WARM }}>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="relative max-w-[900px] mx-auto px-6 py-16">
          <p style={{ fontFamily: MONO, fontSize: '0.65rem', letterSpacing: '0.2em', color: MUTED }} className="uppercase mb-4">
            Change Engine -- Super Neighborhoods
          </p>
          <div className="flex items-center gap-3 mb-3">
            <span
              className="w-10 h-10 flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{ fontFamily: MONO, backgroundColor: INK }}
            >
              {sn.sn_number}
            </span>
            <p style={{ fontFamily: MONO, fontSize: '0.55rem', letterSpacing: '0.15em', color: CLAY }} className="uppercase">Super Neighborhood</p>
          </div>
          <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(2rem, 4vw, 2.8rem)', color: INK, lineHeight: 1.1 }}>
            {snName}
          </h1>
          {snDescription && (
            <p style={{ fontFamily: SERIF, fontSize: '1.05rem', color: MUTED, lineHeight: 1.7 }} className="mt-4 max-w-xl">
              {snDescription}
            </p>
          )}

          {/* Stats */}
          <div className="flex flex-wrap gap-6 mt-6">
            {sn.population != null && (
              <div>
                <span style={{ fontFamily: SERIF, fontSize: '1.5rem', color: INK, fontWeight: 700 }}>{sn.population.toLocaleString()}</span>
                <span style={{ fontFamily: MONO, fontSize: '0.6rem', color: MUTED, letterSpacing: '0.1em', marginLeft: '0.5rem' }} className="uppercase">{t('superNeighborhoods.population')}</span>
              </div>
            )}
            {sn.median_income != null && (
              <div>
                <span style={{ fontFamily: SERIF, fontSize: '1.5rem', color: INK, fontWeight: 700 }}>${sn.median_income.toLocaleString()}</span>
                <span style={{ fontFamily: MONO, fontSize: '0.6rem', color: MUTED, letterSpacing: '0.1em', marginLeft: '0.5rem' }} className="uppercase">{t('superNeighborhoods.median_income')}</span>
              </div>
            )}
            {neighborhoods.length > 0 && (
              <div>
                <span style={{ fontFamily: SERIF, fontSize: '1.5rem', color: INK, fontWeight: 700 }}>{neighborhoods.length}</span>
                <span style={{ fontFamily: MONO, fontSize: '0.6rem', color: MUTED, letterSpacing: '0.1em', marginLeft: '0.5rem' }} className="uppercase">{t('superNeighborhoods.neighborhoods')}</span>
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
          <Link href="/super-neighborhoods" className="hover:underline" style={{ color: CLAY }}>{t('superNeighborhoods.breadcrumb')}</Link>
          <span className="mx-2">/</span>
          <span>{snName}</span>
        </nav>
      </div>

      <div className="max-w-[900px] mx-auto px-6 py-10">
        {/* ── Map ── */}
        <section className="mb-10">
          <div className="flex items-baseline gap-4 mb-4">
            <h2 style={{ fontFamily: SERIF, fontSize: '1.5rem', color: INK }}>{t('superNeighborhoods.map')}</h2>
            <div className="flex-1" style={{ height: 1, borderBottom: '1px dotted', borderColor: RULE_COLOR }} />
          </div>
          <div style={{ border: '1px solid ' + RULE_COLOR }}>
            <SuperNeighborhoodDetailMap markers={markers} snId={sn.sn_id} />
          </div>
        </section>

        {/* ── ZIP Codes ── */}
        {zips.length > 0 && (
          <div className="p-4 mb-8" style={{ background: PARCHMENT_WARM, border: '1px solid ' + RULE_COLOR }}>
            <p style={{ fontFamily: MONO, fontSize: '0.75rem', color: INK }}>
              ZIP codes: {zips.join(', ')} --{' '}
              <Link href="/officials/lookup" className="hover:underline" style={{ color: CLAY, fontWeight: 600 }}>
                {t('superNeighborhoods.find_reps')}
              </Link>
            </p>
          </div>
        )}

        {/* ── Child Neighborhoods ── */}
        {neighborhoods.length > 0 && (
          <section className="mb-10">
            <div className="flex items-baseline gap-4 mb-6">
              <h2 style={{ fontFamily: SERIF, fontSize: '1.5rem', color: INK }}>{t('superNeighborhoods.neighborhoods')}</h2>
              <div className="flex-1" style={{ height: 1, borderBottom: '1px dotted', borderColor: RULE_COLOR }} />
              <span style={{ fontFamily: MONO, fontSize: '0.6rem', color: MUTED, letterSpacing: '0.1em' }} className="uppercase">{neighborhoods.length} areas</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0" style={{ border: '1px solid ' + RULE_COLOR }}>
              {neighborhoods.map(hood => (
                <Link
                  key={hood.neighborhood_id}
                  href={'/neighborhoods/' + hood.neighborhood_id}
                  className="group block p-4 transition-colors hover:bg-white/50"
                  style={{ borderRight: '1px solid ' + RULE_COLOR, borderBottom: '1px solid ' + RULE_COLOR }}
                >
                  <h3 style={{ fontFamily: SERIF, fontSize: '0.9rem', color: INK, fontWeight: 700 }} className="group-hover:underline">{hood.neighborhood_name}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    {hood.neighborhood_type && <span style={{ fontFamily: MONO, fontSize: '0.58rem', color: MUTED }}>{hood.neighborhood_type}</span>}
                    {hood.population != null && (
                      <span style={{ fontFamily: MONO, fontSize: '0.58rem', color: MUTED }}>
                        Pop. {hood.population.toLocaleString()}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Policies ── */}
        {snPolicies.length > 0 && (
          <section className="mb-10">
            <div className="flex items-baseline gap-4 mb-6">
              <h2 style={{ fontFamily: SERIF, fontSize: '1.5rem', color: INK }}>Policy Watch</h2>
              <div className="flex-1" style={{ height: 1, borderBottom: '1px dotted', borderColor: RULE_COLOR }} />
              <span style={{ fontFamily: MONO, fontSize: '0.6rem', color: MUTED, letterSpacing: '0.1em' }} className="uppercase">{snPolicies.length} policies</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-0" style={{ border: '1px solid ' + RULE_COLOR }}>
              {snPolicies.slice(0, 6).map(function (p: any) {
                const isActive = ['pending', 'introduced', 'in committee', 'active'].includes((p.status || '').toLowerCase())
                return (
                  <Link
                    key={p.policy_id}
                    href={'/policies/' + p.policy_id}
                    className="group block p-4 transition-colors hover:bg-white/50"
                    style={{
                      borderRight: '1px solid ' + RULE_COLOR,
                      borderBottom: '1px solid ' + RULE_COLOR,
                      borderLeft: isActive ? '3px solid ' + CLAY : undefined,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {p.level && (
                        <span style={{ fontFamily: MONO, fontSize: '0.55rem', letterSpacing: '0.12em', color: '#fff', background: INK, padding: '2px 6px' }} className="uppercase">
                          {p.level}
                        </span>
                      )}
                      {p.status && <span style={{ fontFamily: MONO, fontSize: '0.55rem', color: MUTED }} className="uppercase">{p.status}</span>}
                    </div>
                    <h3 style={{ fontFamily: SERIF, fontSize: '0.9rem', color: INK, fontWeight: 700, lineHeight: 1.3 }} className="line-clamp-2 group-hover:underline">
                      {p.title_6th_grade || p.policy_name}
                    </h3>
                    {p.bill_number && <p style={{ fontFamily: MONO, fontSize: '0.6rem', color: MUTED, marginTop: '0.25rem' }}>{p.bill_number}</p>}
                    {p.impact_statement && (
                      <p style={{ fontFamily: SERIF, fontSize: '0.78rem', color: CLAY, marginTop: '0.5rem', lineHeight: 1.5 }} className="line-clamp-2">
                        {p.impact_statement}
                      </p>
                    )}
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* ── Services ── */}
        {mapData.services.length > 0 && (
          <section>
            <div className="flex items-baseline gap-4 mb-6">
              <h2 style={{ fontFamily: SERIF, fontSize: '1.5rem', color: INK }}>{t('superNeighborhoods.services_area')}</h2>
              <div className="flex-1" style={{ height: 1, borderBottom: '1px dotted', borderColor: RULE_COLOR }} />
              <span style={{ fontFamily: MONO, fontSize: '0.6rem', color: MUTED, letterSpacing: '0.1em' }} className="uppercase">{mapData.services.length} services</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-0" style={{ border: '1px solid ' + RULE_COLOR }}>
              {mapData.services.slice(0, 4).map(svc => (
                <Link
                  key={svc.service_id}
                  href={'/services/' + svc.service_id}
                  className="block p-4 transition-colors hover:bg-white/50"
                  style={{ borderRight: '1px solid ' + RULE_COLOR, borderBottom: '1px solid ' + RULE_COLOR }}
                >
                  <h4 style={{ fontFamily: SERIF, fontSize: '0.88rem', color: INK, fontWeight: 700, lineHeight: 1.3 }} className="line-clamp-2 mb-1">
                    {serviceTranslations[svc.service_id]?.title || svc.service_name}
                  </h4>
                  {(serviceTranslations[svc.service_id]?.summary || svc.description_5th_grade) && (
                    <p style={{ fontFamily: SERIF, fontSize: '0.78rem', color: MUTED, lineHeight: 1.5 }} className="line-clamp-2">
                      {serviceTranslations[svc.service_id]?.summary || svc.description_5th_grade}
                    </p>
                  )}
                </Link>
              ))}
            </div>
            {mapData.services.length > 4 && (
              <details className="mt-2">
                <summary style={{ fontFamily: MONO, fontSize: '0.65rem', color: CLAY, letterSpacing: '0.1em', cursor: 'pointer' }} className="uppercase hover:underline py-2">
                  Show all {mapData.services.length} services
                </summary>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 mt-2" style={{ border: '1px solid ' + RULE_COLOR }}>
                  {mapData.services.slice(4, 12).map(svc => (
                    <Link
                      key={svc.service_id}
                      href={'/services/' + svc.service_id}
                      className="block p-4 transition-colors hover:bg-white/50"
                      style={{ borderRight: '1px solid ' + RULE_COLOR, borderBottom: '1px solid ' + RULE_COLOR }}
                    >
                      <h4 style={{ fontFamily: SERIF, fontSize: '0.88rem', color: INK, fontWeight: 700, lineHeight: 1.3 }} className="line-clamp-2 mb-1">
                        {serviceTranslations[svc.service_id]?.title || svc.service_name}
                      </h4>
                      {(serviceTranslations[svc.service_id]?.summary || svc.description_5th_grade) && (
                        <p style={{ fontFamily: SERIF, fontSize: '0.78rem', color: MUTED, lineHeight: 1.5 }} className="line-clamp-2">
                          {serviceTranslations[svc.service_id]?.summary || svc.description_5th_grade}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              </details>
            )}
          </section>
        )}

        <div className="my-10" style={{ height: 1, background: RULE_COLOR }} />

        {/* ── Footer link ── */}
        <div className="text-center py-4">
          <Link href="/super-neighborhoods" style={{ fontFamily: MONO, fontSize: '0.7rem', color: CLAY, letterSpacing: '0.1em' }} className="uppercase hover:underline">
            Back to Super Neighborhoods
          </Link>
        </div>
      </div>
    </div>
  )
}
