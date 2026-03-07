import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { PageHero } from '@/components/exchange/PageHero'
import { Vote, ThumbsUp, ThumbsDown, Scale } from 'lucide-react'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Ballot Items — Community Exchange',
  description: 'Propositions, measures, and ballot items for upcoming Houston-area elections.',
}

export default async function BallotPage() {
  const supabase = await createClient()
  const { data: items } = await supabase
    .from('ballot_items')
    .select('item_id, item_name, item_type, jurisdiction, description_5th_grade, for_argument, against_argument, election_date, passed, vote_for_pct')
    .order('election_date', { ascending: false })

  return (
    <div>
      <PageHero variant="sacred" sacredPattern="metatron" gradientColor="#e53e3e" title="Ballot Items" subtitle="Propositions, bonds, and measures on the ballot. Understand what you are voting on with plain-language explanations." />
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Breadcrumb items={[{ label: 'Elections', href: '/elections' }, { label: 'Ballot' }]} />
        <div className="space-y-4 mt-4">
          {(items || []).map(function (item) {
            return (
              <div key={item.item_id} className="bg-white rounded-lg border-2 border-brand-border p-5">
                <div className="flex items-start gap-3">
                  <Scale className="w-5 h-5 text-theme-voice mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-brand-text">{item.item_name}</h3>
                      {item.item_type && <span className="text-xs bg-brand-bg text-brand-muted px-2 py-0.5 rounded">{item.item_type}</span>}
                      {item.passed !== null && (
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${item.passed === 'true' ? 'bg-brand-success/10 text-brand-success' : 'bg-brand-danger/10 text-brand-danger'}`}>
                          {item.passed === 'true' ? 'Passed' : 'Failed'}
                        </span>
                      )}
                    </div>
                    {item.description_5th_grade && <p className="text-sm text-brand-muted mt-2 leading-relaxed">{item.description_5th_grade}</p>}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      {item.for_argument && (
                        <div className="bg-brand-success/5 rounded-lg p-3">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-brand-success mb-1"><ThumbsUp className="w-3.5 h-3.5" />Arguments For</div>
                          <p className="text-xs text-brand-text leading-relaxed">{item.for_argument}</p>
                        </div>
                      )}
                      {item.against_argument && (
                        <div className="bg-brand-danger/5 rounded-lg p-3">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-brand-danger mb-1"><ThumbsDown className="w-3.5 h-3.5" />Arguments Against</div>
                          <p className="text-xs text-brand-text leading-relaxed">{item.against_argument}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-xs text-brand-muted">
                      {item.jurisdiction && <span>{item.jurisdiction}</span>}
                      {item.election_date && <span>{item.election_date}</span>}
                      {item.vote_for_pct && <span>{item.vote_for_pct}% voted yes</span>}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
