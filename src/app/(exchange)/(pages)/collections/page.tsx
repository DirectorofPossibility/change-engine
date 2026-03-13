import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { THEMES } from '@/lib/constants'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Curated Collections — Change Engine',
  description: 'Hand-curated collections of resources, guides, and content for Houston community members.',
}

const PARCHMENT = '#F5F0E8'
const PARCHMENT_WARM = '#EDE7D8'
const INK = '#1A1A1A'
const CLAY = '#C4663A'
const MUTED = '#7a7265'
const RULE_COLOR = 'rgba(196,102,58,0.3)'
const SERIF = 'Georgia, "Times New Roman", serif'
const MONO = '"Courier New", Courier, monospace'

export default async function CollectionsPage() {
  const supabase = await createClient()
  const { data: collections } = await supabase
    .from('featured_collections')
    .select('*')
    .order('display_order, title')

  const items = collections || []
  const visible = items.slice(0, 4)
  const rest = items.slice(4)

  return (
    <div style={{ background: PARCHMENT }} className="min-h-screen">
      {/* Hero */}
      <div style={{ background: PARCHMENT_WARM }} className="relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="max-w-[900px] mx-auto px-6 py-16 relative z-10">
          <p style={{ fontFamily: MONO, fontSize: '0.7rem', letterSpacing: '0.15em', color: MUTED, textTransform: 'uppercase' }}>
            The Change Engine
          </p>
          <h1 style={{ fontFamily: SERIF, fontSize: '2.5rem', color: INK, lineHeight: 1.15, marginTop: '0.75rem' }}>
            Curated Collections
          </h1>
          <p style={{ fontFamily: SERIF, fontSize: '1.1rem', color: MUTED, marginTop: '0.75rem', maxWidth: '38rem', lineHeight: 1.7 }}>
            Thoughtfully assembled collections of resources, guides, and content to help you navigate what matters most.
          </p>
          {items.length > 0 && (
            <div className="flex flex-wrap gap-8 mt-8">
              <div>
                <span style={{ fontFamily: SERIF, fontSize: '2rem', color: INK }}>{items.length}</span>
                <span style={{ fontFamily: MONO, fontSize: '0.65rem', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block' }}>Collections</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-[900px] mx-auto px-6 pt-6">
        <nav style={{ fontFamily: MONO, fontSize: '0.7rem', color: MUTED }}>
          <Link href="/" className="hover:underline" style={{ color: CLAY }}>Home</Link>
          <span className="mx-2">/</span>
          <span>Collections</span>
        </nav>
      </div>

      {/* Main content */}
      <div className="max-w-[900px] mx-auto px-6 py-8">
        <div className="flex items-baseline justify-between mb-1">
          <h2 style={{ fontFamily: SERIF, fontSize: '1.5rem', color: INK }}>All Collections</h2>
          <span style={{ fontFamily: MONO, fontSize: '0.7rem', color: MUTED }}>{items.length}</span>
        </div>
        <div style={{ height: 1, borderBottom: '1px dotted ' + RULE_COLOR, marginBottom: '1.5rem' }} />

        {items.length === 0 ? (
          <div className="text-center py-16" style={{ border: '1px dashed ' + RULE_COLOR }}>
            <p style={{ fontFamily: SERIF, fontSize: '1.1rem', color: MUTED }}>Collections are being curated. Check back soon.</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {visible.map(function (c: any) {
                const color = c.color || (c.theme_id && (THEMES as any)[c.theme_id]?.color) || CLAY
                const itemCount = c.item_ids ? c.item_ids.split(',').filter(Boolean).length : null

                return (
                  <Link
                    key={c.collection_id || c.id}
                    href={'/collections/' + (c.collection_id || c.id)}
                    className="block group py-4 hover:opacity-80"
                    style={{ borderBottom: '1px solid ' + RULE_COLOR }}
                  >
                    <div className="flex gap-4">
                      <div className="w-1 flex-shrink-0 self-stretch" style={{ backgroundColor: color }} />
                      <div className="flex-1 min-w-0">
                        <h3 style={{ fontFamily: SERIF, color: INK, fontSize: '1rem', fontWeight: 600 }} className="group-hover:underline">
                          {c.collection_name || c.title}
                        </h3>
                        {(c.description_5th_grade || c.description || c.summary) && (
                          <p style={{ fontFamily: SERIF, color: MUTED, fontSize: '0.85rem' }} className="mt-1 line-clamp-3">
                            {c.description_5th_grade || c.description || c.summary}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          {itemCount && (
                            <span style={{ fontFamily: MONO, color: MUTED, fontSize: '0.65rem' }}>{itemCount} resources</span>
                          )}
                          {c.theme_id && (THEMES as any)[c.theme_id] && (
                            <span className="flex items-center gap-1" style={{ fontFamily: MONO, color: MUTED, fontSize: '0.65rem' }}>
                              <span className="w-2 h-2 inline-block" style={{ backgroundColor: (THEMES as any)[c.theme_id].color }} />
                              {(THEMES as any)[c.theme_id].label}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>

            {rest.length > 0 && (
              <details className="mt-4">
                <summary style={{ fontFamily: SERIF, fontStyle: 'italic', color: CLAY, fontSize: '0.9rem', cursor: 'pointer' }}>
                  See {rest.length} more collection{rest.length !== 1 ? 's' : ''}
                </summary>
                <div className="space-y-4 mt-4">
                  {rest.map(function (c: any) {
                    const color = c.color || (c.theme_id && (THEMES as any)[c.theme_id]?.color) || CLAY
                    const itemCount = c.item_ids ? c.item_ids.split(',').filter(Boolean).length : null

                    return (
                      <Link
                        key={c.collection_id || c.id}
                        href={'/collections/' + (c.collection_id || c.id)}
                        className="block group py-4 hover:opacity-80"
                        style={{ borderBottom: '1px solid ' + RULE_COLOR }}
                      >
                        <div className="flex gap-4">
                          <div className="w-1 flex-shrink-0 self-stretch" style={{ backgroundColor: color }} />
                          <div className="flex-1 min-w-0">
                            <h3 style={{ fontFamily: SERIF, color: INK, fontSize: '1rem', fontWeight: 600 }} className="group-hover:underline">
                              {c.collection_name || c.title}
                            </h3>
                            {(c.description_5th_grade || c.description || c.summary) && (
                              <p style={{ fontFamily: SERIF, color: MUTED, fontSize: '0.85rem' }} className="mt-1 line-clamp-3">
                                {c.description_5th_grade || c.description || c.summary}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-2">
                              {itemCount && (
                                <span style={{ fontFamily: MONO, color: MUTED, fontSize: '0.65rem' }}>{itemCount} resources</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </details>
            )}
          </>
        )}
      </div>

      {/* Footer rule + link */}
      <div className="my-10 max-w-[900px] mx-auto px-6" style={{ height: 1, background: RULE_COLOR }} />
      <div className="max-w-[900px] mx-auto px-6 pb-12">
        <Link href="/" style={{ fontFamily: SERIF, fontStyle: 'italic', color: CLAY, fontSize: '0.95rem' }} className="hover:underline">
          Back to the Guide
        </Link>
      </div>
    </div>
  )
}
