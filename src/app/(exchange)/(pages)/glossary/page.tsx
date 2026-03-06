import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { PageHero } from '@/components/exchange/PageHero'
import { BookOpen } from 'lucide-react'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Civic Glossary — Community Exchange',
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
    <div>
      <PageHero variant="sacred" sacredPattern="vesica" gradientColor="#3182ce" title="Civic Glossary" subtitle="Plain-language definitions for civic, government, and community terms. Built for understanding, not confusion." />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Breadcrumb items={[{ label: 'Glossary' }]} />
        {/* Letter nav */}
        <div className="flex flex-wrap gap-1 mt-4 mb-8">
          {letters.map(function (l) {
            return <a key={l} href={`#letter-${l}`} className="w-8 h-8 flex items-center justify-center text-sm font-medium text-brand-accent hover:bg-brand-accent/10 rounded">{l}</a>
          })}
        </div>
        {letters.map(function (letter) {
          return (
            <div key={letter} id={`letter-${letter}`} className="mb-8">
              <h2 className="text-2xl font-serif font-bold text-brand-text mb-4 border-b border-brand-border pb-2">{letter}</h2>
              <div className="space-y-4">
                {(grouped[letter] || []).map(function (t) {
                  return (
                    <div key={t.term_id} className="bg-white rounded-lg border border-brand-border p-4">
                      <div className="flex items-start gap-3">
                        <BookOpen className="w-4 h-4 text-brand-accent mt-1 flex-shrink-0" />
                        <div>
                          <h3 className="font-semibold text-brand-text">{t.term}</h3>
                          <p className="text-sm text-brand-text mt-1 leading-relaxed">{t.definition_5th_grade || t.definition}</p>
                          {t.category && <span className="inline-block text-xs text-brand-muted bg-brand-bg px-2 py-0.5 rounded mt-2">{t.category}</span>}
                        </div>
                      </div>
                    </div>
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
