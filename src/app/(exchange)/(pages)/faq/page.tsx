import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { PageHero } from '@/components/exchange/PageHero'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Frequently Asked Questions — Community Exchange',
  description: 'Answers to common questions about civic participation, services, and the Community Exchange.',
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

  return (
    <div>
      <PageHero variant="sacred" sacredPattern="seed" gradientColor="#d69e2e" title="Frequently Asked Questions" subtitle="Quick answers to the most common questions about civic participation, services, and how to use the Community Exchange." />
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Breadcrumb items={[{ label: 'FAQ' }]} />
        {Object.entries(grouped).map(function ([category, items]) {
          return (
            <div key={category} className="mb-10">
              <h2 className="text-lg font-serif font-bold text-brand-text mb-4 border-b border-brand-border pb-2">{category}</h2>
              <div className="space-y-3">
                {(items || []).map(function (f) {
                  return (
                    <details key={f.faq_id} className="bg-white rounded-lg border-2 border-brand-border group">
                      <summary className="px-5 py-4 cursor-pointer font-semibold text-brand-text hover:text-brand-accent transition-colors list-none flex items-center justify-between">
                        <span>{f.question}</span>
                        <span className="text-brand-muted group-open:rotate-180 transition-transform ml-3 flex-shrink-0">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </span>
                      </summary>
                      <div className="px-5 pb-4 text-sm text-brand-text leading-relaxed border-t border-brand-border pt-3">
                        {f.answer}
                      </div>
                    </details>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
