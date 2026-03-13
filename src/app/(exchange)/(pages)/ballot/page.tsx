import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { ThumbsUp, ThumbsDown } from 'lucide-react'

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
  title: 'Ballot Items — Change Engine',
  description: 'Propositions, measures, and ballot items for upcoming Houston-area elections.',
}

export default async function BallotPage() {
  const supabase = await createClient()
  const { data: items } = await supabase
    .from('ballot_items')
    .select('item_id, item_name, item_type, jurisdiction, description_5th_grade, for_argument, against_argument, election_date, passed, vote_for_pct')
    .order('election_date', { ascending: false })

  const allItems = items || []
  const initialCount = 4
  const hasMore = allItems.length > initialCount

  return (
    <div style={{ background: PARCHMENT }} className="min-h-screen">
      {/* Hero */}
      <div style={{ background: PARCHMENT_WARM }} className="relative overflow-hidden border-b">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="max-w-[900px] mx-auto px-6 py-12 relative">
          <p style={{ fontFamily: MONO, color: MUTED, fontSize: 11, letterSpacing: '0.12em' }} className="uppercase mb-3">
            The Change Engine
          </p>
          <h1 style={{ fontFamily: SERIF, color: INK }} className="text-3xl sm:text-4xl mb-3">
            Ballot Items
          </h1>
          <p style={{ fontFamily: SERIF, color: MUTED, fontSize: 17 }} className="max-w-[600px] leading-relaxed">
            Propositions, bonds, and measures on the ballot. Understand what you are voting on with plain-language explanations.
          </p>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-[900px] mx-auto px-6 pt-4 pb-2">
        <nav style={{ fontFamily: MONO, fontSize: 11, color: MUTED, letterSpacing: '0.06em' }} className="uppercase">
          <Link href="/elections" className="hover:underline" style={{ color: CLAY }}>Elections</Link>
          <span className="mx-2">/</span>
          <span>Ballot</span>
        </nav>
      </div>

      {/* Main Content */}
      <div className="max-w-[900px] mx-auto px-6 py-8">
        <div className="flex items-baseline justify-between mb-1">
          <h2 style={{ fontFamily: SERIF, color: INK, fontSize: 24 }}>All Ballot Items</h2>
        </div>
        <div style={{ height: 1, background: RULE_COLOR }} className="mb-1" />
        <p style={{ fontFamily: MONO, color: MUTED, fontSize: 11 }} className="mb-6">
          {allItems.length} item{allItems.length !== 1 ? 's' : ''}
        </p>

        {renderBallotItems(allItems.slice(0, initialCount))}

        {hasMore && (
          <details className="mt-4">
            <summary style={{ fontFamily: SERIF, fontStyle: 'italic', color: CLAY, cursor: 'pointer', fontSize: 15 }} className="mb-4">
              Show all {allItems.length} ballot items...
            </summary>
            {renderBallotItems(allItems.slice(initialCount))}
          </details>
        )}

        {/* Footer link */}
        <div className="my-10" style={{ height: 1, background: RULE_COLOR }} />
        <div className="text-center pb-12">
          <Link href="/elections" style={{ fontFamily: MONO, color: CLAY, fontSize: 12, letterSpacing: '0.06em' }} className="uppercase hover:underline">
            Back to Elections
          </Link>
        </div>
      </div>
    </div>
  )
}

function renderBallotItems(items: any[]) {
  return (
    <div className="space-y-4">
      {items.map(function (item) {
        return (
          <div key={item.item_id} className="border p-5" style={{ borderColor: RULE_COLOR, background: PARCHMENT_WARM }}>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <h3 style={{ fontFamily: SERIF, color: INK, fontSize: 16 }}>{item.item_name}</h3>
              {item.item_type && <span style={{ fontFamily: MONO, fontSize: 10, color: MUTED, letterSpacing: '0.06em' }} className="uppercase">{item.item_type}</span>}
              {item.passed !== null && (
                <span style={{ fontFamily: MONO, fontSize: 10, color: item.passed === 'true' ? '#2D8659' : '#C53030', letterSpacing: '0.06em' }} className="uppercase font-medium">
                  {item.passed === 'true' ? 'Passed' : 'Failed'}
                </span>
              )}
            </div>
            {item.description_5th_grade && (
              <p style={{ fontFamily: SERIF, color: MUTED, fontSize: 14 }} className="leading-relaxed mb-4">{item.description_5th_grade}</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {item.for_argument && (
                <div className="p-3 border" style={{ borderColor: 'rgba(45,134,89,0.3)', background: 'rgba(45,134,89,0.05)' }}>
                  <div className="flex items-center gap-1.5 mb-1" style={{ fontFamily: MONO, fontSize: 10, color: '#2D8659', letterSpacing: '0.06em' }}>
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span className="uppercase font-bold">Arguments For</span>
                  </div>
                  <p style={{ fontFamily: SERIF, color: INK, fontSize: 13 }} className="leading-relaxed">{item.for_argument}</p>
                </div>
              )}
              {item.against_argument && (
                <div className="p-3 border" style={{ borderColor: 'rgba(197,48,48,0.3)', background: 'rgba(197,48,48,0.05)' }}>
                  <div className="flex items-center gap-1.5 mb-1" style={{ fontFamily: MONO, fontSize: 10, color: '#C53030', letterSpacing: '0.06em' }}>
                    <ThumbsDown className="w-3.5 h-3.5" />
                    <span className="uppercase font-bold">Arguments Against</span>
                  </div>
                  <p style={{ fontFamily: SERIF, color: INK, fontSize: 13 }} className="leading-relaxed">{item.against_argument}</p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4 mt-3" style={{ fontFamily: MONO, fontSize: 11, color: MUTED }}>
              {item.jurisdiction && <span>{item.jurisdiction}</span>}
              {item.election_date && <span>{item.election_date}</span>}
              {item.vote_for_pct && <span>{item.vote_for_pct}% voted yes</span>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
