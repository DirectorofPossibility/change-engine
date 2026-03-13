import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { faqJsonLd } from '@/lib/jsonld'

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
  title: 'Frequently Asked Questions -- Change Engine',
  description: 'Answers to common questions about civic participation, services, and the Change Engine.',
}

export default async function FAQPage() {
  const supabase = await createClient()
  const { data: faqs } = await supabase
    .from('faqs')
    .select('faq_id, question, answer, category, is_featured')
    .eq('is_active', 'true')
    .order('display_order, category, question')

  // Group by category
  const grouped: Record<string, typeof faqs> = {}
  for (const f of faqs || []) {
    const cat = f.category || 'General'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(f)
  }

  const jsonLd = faqJsonLd((faqs || []).filter(function (f) { return f.answer }).map(function (f) { return { question: f.question, answer: f.answer! } }))

  const totalFaqs = (faqs || []).length

  return (
    <div style={{ background: PARCHMENT }} className="min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden" style={{ background: PARCHMENT_WARM }}>
        <div className="absolute right-[-60px] top-[-20px]">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="relative z-10 max-w-[900px] mx-auto px-6 py-10">
          <p style={{ fontFamily: MONO, color: MUTED }} className="text-[11px] uppercase tracking-[0.15em] mb-1">changeengine.us</p>
          <h1 style={{ fontFamily: SERIF, color: INK }} className="text-2xl sm:text-3xl mt-2">Frequently Asked Questions</h1>
          <p style={{ fontFamily: SERIF, color: MUTED }} className="text-base mt-2">
            Quick answers to the most common questions about civic participation, services, and how to use the Change Engine.
          </p>
        </div>
        <div style={{ height: 1, background: RULE_COLOR }} />
      </section>

      {/* ── Breadcrumb ── */}
      <div className="max-w-[900px] mx-auto px-6 pt-4">
        <nav style={{ fontFamily: MONO, color: MUTED }} className="text-[11px] tracking-wide">
          <Link href="/" className="hover:underline">Home</Link>
          <span className="mx-1">/</span>
          <span style={{ color: INK }}>FAQ</span>
        </nav>
      </div>

      <div className="max-w-[900px] mx-auto px-6 py-8">
        {Object.entries(grouped).map(function ([category, items], catIdx) {
          return (
            <div key={category} className="mb-10">
              <div className="flex items-baseline justify-between mb-1">
                <h2 style={{ fontFamily: SERIF, color: INK }} className="text-xl">{category}</h2>
                <span style={{ fontFamily: MONO, color: MUTED }} className="text-[11px]">{(items || []).length} questions</span>
              </div>
              <div style={{ borderBottom: '2px dotted ' + RULE_COLOR }} className="mb-4" />
              <div className="space-y-3">
                {(items || []).map(function (f) {
                  return (
                    <details key={f.faq_id} className="group" style={{ border: '1px solid ' + RULE_COLOR }}>
                      <summary className="px-5 py-4 cursor-pointer list-none flex items-center justify-between" style={{ fontFamily: SERIF, color: INK }}>
                        <span>{f.question}</span>
                        <span className="group-open:rotate-180 transition-transform ml-3 flex-shrink-0" style={{ color: MUTED }}>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </span>
                      </summary>
                      <div className="px-5 pb-4 text-sm leading-relaxed pt-3" style={{ fontFamily: SERIF, color: MUTED, borderTop: '1px solid ' + RULE_COLOR }}>
                        {f.answer}
                      </div>
                    </details>
                  )
                })}
              </div>
              {catIdx < Object.entries(grouped).length - 1 && (
                <div style={{ borderTop: '1px solid ' + RULE_COLOR }} className="my-8" />
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
