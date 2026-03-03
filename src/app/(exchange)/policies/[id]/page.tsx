import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { OfficialCard } from '@/components/exchange/OfficialCard'
import { PolicyCard } from '@/components/exchange/PolicyCard'
import { getLangId, fetchTranslationsForTable } from '@/lib/data/exchange'

function statusColor(status: string | null): string {
  if (!status) return 'bg-gray-100 text-gray-600'
  var s = status.toLowerCase()
  if (s === 'passed' || s === 'enacted' || s === 'signed') return 'bg-green-100 text-green-700'
  if (s === 'pending' || s === 'introduced' || s === 'in committee' || s === 'active') return 'bg-yellow-100 text-yellow-700'
  if (s === 'failed' || s === 'vetoed' || s === 'dead') return 'bg-red-100 text-red-700'
  return 'bg-blue-100 text-blue-700'
}

export const revalidate = 86400

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  var { id } = await params
  var supabase = await createClient()
  var { data } = await supabase.from('policies').select('policy_name, summary_5th_grade').eq('policy_id', id).single()
  if (!data) return { title: 'Not Found' }
  return {
    title: data.policy_name,
    description: data.summary_5th_grade || 'Details on The Change Engine.',
  }
}

export default async function PolicyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: policy } = await supabase
    .from('policies')
    .select('*')
    .eq('policy_id', id)
    .single()

  if (!policy) notFound()

  // Connected officials
  var officialIds = policy.official_ids ? policy.official_ids.split(',').map(function (s) { return s.trim() }).filter(Boolean) : []
  var officials: Array<{ official_id: string; official_name: string; title: string | null; level: string | null; party: string | null; email: string | null; office_phone: string | null; website: string | null }> = []
  if (officialIds.length > 0) {
    const { data: offData } = await supabase
      .from('elected_officials')
      .select('official_id, official_name, title, level, party, email, office_phone, website')
      .in('official_id', officialIds)
    officials = offData || []
  }

  // Related policies (same level)
  const { data: related } = await supabase
    .from('policies')
    .select('policy_id, policy_name, policy_type, level, status, summary_5th_grade, bill_number, source_url')
    .neq('policy_id', id)
    .eq('level', policy.level || '')
    .limit(4)

  // Fetch translations for non-English
  const langId = await getLangId()
  var translatedName: string | undefined
  var translatedSummary: string | undefined
  var officialTranslations: Record<string, { title?: string; summary?: string }> = {}
  var relatedPolicyTranslations: Record<string, { title?: string; summary?: string }> = {}
  if (langId) {
    const oIds = officials.map(function (o) { return o.official_id })
    const rIds = (related || []).map(function (p) { return p.policy_id })
    var results = await Promise.all([
      fetchTranslationsForTable('policies', [policy.policy_id], langId),
      oIds.length > 0 ? fetchTranslationsForTable('elected_officials', oIds, langId) : {},
      rIds.length > 0 ? fetchTranslationsForTable('policies', rIds, langId) : {},
    ])
    translatedName = results[0][policy.policy_id]?.title
    translatedSummary = results[0][policy.policy_id]?.summary
    officialTranslations = results[1]
    relatedPolicyTranslations = results[2]
  }

  var displayName = translatedName || policy.policy_name
  var displaySummary = translatedSummary || policy.summary_5th_grade

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumb */}
      <div className="text-sm text-brand-muted mb-6">
        <Link href="/policies" className="hover:text-brand-accent">Policies</Link>
        <span className="mx-2">/</span>
        <span>{displayName}</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        {policy.status && (
          <span className={'text-xs px-3 py-1 rounded-full font-medium ' + statusColor(policy.status)}>{policy.status}</span>
        )}
        {policy.policy_type && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-brand-bg text-brand-muted">{policy.policy_type}</span>
        )}
        {policy.level && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-brand-bg text-brand-muted">{policy.level}</span>
        )}
      </div>

      <h1 className="text-3xl font-bold text-brand-text mb-2">{displayName}</h1>
      {policy.bill_number && <p className="text-brand-muted font-mono mb-4">{policy.bill_number}</p>}

      {/* Timeline */}
      <div className="bg-white rounded-xl border border-brand-border p-5 mb-8 space-y-2">
        {policy.introduced_date && (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-brand-muted w-28">Introduced</span>
            <span className="text-brand-text">{new Date(policy.introduced_date).toLocaleDateString()}</span>
          </div>
        )}
        {policy.last_action && (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-brand-muted w-28">Last Action</span>
            <span className="text-brand-text">{policy.last_action}</span>
            {policy.last_action_date && <span className="text-brand-muted">on {new Date(policy.last_action_date).toLocaleDateString()}</span>}
          </div>
        )}
        {policy.source_url && (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-brand-muted w-28">Source</span>
            <a href={policy.source_url} target="_blank" rel="noopener noreferrer" className="text-brand-accent hover:underline">View source &rarr;</a>
          </div>
        )}
      </div>

      {/* Summary */}
      {displaySummary && (
        <section className="mb-8">
          <h2 className="text-xl font-bold text-brand-text mb-3">Summary</h2>
          <p className="text-brand-muted leading-relaxed">{displaySummary}</p>
        </section>
      )}

      {/* Connected Officials */}
      {officials.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold text-brand-text mb-4">Decision Makers on This Policy</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {officials.map(function (o) {
              var ot = officialTranslations[o.official_id]
              return (
                <OfficialCard
                    key={o.official_id}
                    id={o.official_id}
                    name={o.official_name}
                    title={o.title}
                    party={o.party}
                    level={o.level}
                    email={o.email}
                    phone={o.office_phone}
                    website={o.website}
                    translatedTitle={ot?.title}
                  />
              )
            })}
          </div>
        </section>
      )}

      {/* Related Policies */}
      {related && related.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-brand-text mb-4">Related Policies</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {related.map(function (p) {
              var rpt = relatedPolicyTranslations[p.policy_id]
              return (
                <Link key={p.policy_id} href={'/policies/' + p.policy_id}>
                  <PolicyCard
                    name={p.policy_name}
                    summary={p.summary_5th_grade}
                    billNumber={p.bill_number}
                    status={p.status}
                    level={p.level}
                    sourceUrl={null}
                    translatedName={rpt?.title}
                    translatedSummary={rpt?.summary}
                  />
                </Link>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
