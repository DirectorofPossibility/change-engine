import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 300

const PARCHMENT = '#F5F0E8'
const PARCHMENT_WARM = '#EDE7D8'
const INK = '#1A1A1A'
const CLAY = '#C4663A'
const MUTED = '#7a7265'
const RULE_COLOR = 'rgba(196,102,58,0.3)'
const SERIF = 'Georgia, "Times New Roman", serif'
const MONO = '"Courier New", Courier, monospace'

export const metadata: Metadata = {
  title: 'Civic Glossary -- Change Engine',
  description: 'Plain-language definitions of civic, government, and community terms.',
}

export default async function GlossaryPage() {
  const supabase = await createClient()
  const { data: terms } = await supabase
    .from('glossary')
    .select('term_id, term, definition_5th_grade, definition, category')
    .order('term')

  // Group by first letter
  const grouped: Record<string, typeof terms> = {}
  for (const t of terms || []) {
    const letter = (t.term || '?')[0].toUpperCase()
    if (!grouped[letter]) grouped[letter] = []
    grouped[letter].push(t)
  }
  const letters = Object.keys(grouped).sort()

  return (
    <div style={{ background: PARCHMENT }} className="min-h-screen">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden" style={{ background: PARCHMENT_WARM }}>
        <div className="absolute right-[-60px] top-[-20px]">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="relative z-10 max-w-[900px] mx-auto px-6 py-10">
          <p style={{ fontFamily: MONO, color: MUTED }} className="text-[11px] uppercase tracking-[0.15em] mb-1">changeengine.us</p>
          <h1 style={{ fontFamily: SERIF, color: INK }} className="text-2xl sm:text-3xl mt-2">Civic Glossary</h1>
          <p style={{ fontFamily: SERIF, color: MUTED }} className="text-base mt-2">
            Plain-language definitions for civic, government, and community terms. Built for understanding, not confusion.
          </p>
        </div>
        <div style={{ height: 1, background: RULE_COLOR }} />
      </section>

      {/* ── Breadcrumb ── */}
      <div className="max-w-[900px] mx-auto px-6 pt-4">
        <nav style={{ fontFamily: MONO, color: MUTED }} className="text-[11px] tracking-wide">
          <Link href="/" className="hover:underline">Home</Link>
          <span className="mx-1">/</span>
          <span style={{ color: INK }}>Glossary</span>
        </nav>
      </div>

      <div className="max-w-[900px] mx-auto px-6 py-8">
        {/* Letter nav */}
        <div className="flex flex-wrap gap-1 mb-8">
          {letters.map(function (l) {
            return (
              <a
                key={l}
                href={'#letter-' + l}
                className="w-8 h-8 flex items-center justify-center text-sm"
                style={{ fontFamily: MONO, color: CLAY }}
              >
                {l}
              </a>
            )
          })}
        </div>

        {letters.map(function (letter, idx) {
          return (
            <div key={letter} id={'letter-' + letter} className="mb-8">
              <div className="flex items-baseline justify-between mb-1">
                <h2 style={{ fontFamily: SERIF, color: INK }} className="text-2xl">{letter}</h2>
                <span style={{ fontFamily: MONO, color: MUTED }} className="text-[11px]">{(grouped[letter] || []).length} terms</span>
              </div>
              <div style={{ borderBottom: '2px dotted ' + RULE_COLOR }} className="mb-4" />
              <div className="space-y-4">
                {(grouped[letter] || []).map(function (t) {
                  return (
                    <div key={t.term_id} className="p-4" style={{ border: '1px solid ' + RULE_COLOR }}>
                      <h3 style={{ fontFamily: SERIF, color: INK }} className="font-semibold">{t.term}</h3>
                      <p style={{ fontFamily: SERIF, color: MUTED }} className="text-sm mt-1 leading-relaxed">{t.definition_5th_grade || t.definition}</p>
                      {t.category && (
                        <span style={{ fontFamily: MONO, color: MUTED, background: PARCHMENT_WARM }} className="inline-block text-xs px-2 py-0.5 mt-2">{t.category}</span>
                      )}
                    </div>
                  )
                })}
              </div>
              {idx < letters.length - 1 && (
                <div style={{ borderTop: '1px solid ' + RULE_COLOR }} className="my-6" />
              )}
            </div>
          )
        })}
      </div>

      {/* ── Footer link ── */}
      <div className="max-w-[900px] mx-auto px-6 pb-10">
        <div style={{ borderTop: '1px solid ' + RULE_COLOR }} className="pt-4">
          <Link href="/" style={{ fontFamily: MONO, color: CLAY }} className="text-sm hover:underline">&larr; Back to Home</Link>
        </div>
      </div>
    </div>
  )
}
