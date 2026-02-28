import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Mail, Phone, Globe } from 'lucide-react'
import { PolicyCard } from '@/components/exchange/PolicyCard'
import { RelatedContent } from '@/components/exchange/RelatedContent'
import { getLangId, fetchTranslationsForTable } from '@/lib/data/exchange'

function levelColor(level: string | null): string {
  if (level === 'Federal') return 'bg-blue-100 text-blue-700'
  if (level === 'State') return 'bg-green-100 text-green-700'
  if (level === 'County') return 'bg-orange-100 text-orange-700'
  if (level === 'City') return 'bg-teal-100 text-teal-700'
  return 'bg-gray-100 text-gray-700'
}

export const revalidate = 86400

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  var { id } = await params
  var supabase = await createClient()
  var { data } = await supabase.from('elected_officials').select('official_name, title').eq('official_id', id).single()
  if (!data) return { title: 'Not Found' }
  return {
    title: data.official_name,
    description: data.title || 'Details on The Change Engine.',
  }
}

export default async function OfficialDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: official } = await supabase
    .from('elected_officials')
    .select('*')
    .eq('official_id', id)
    .single()

  if (!official) notFound()

  // Policies connected to this official
  const { data: policies } = await supabase
    .from('policies')
    .select('*')
    .like('official_ids', '%' + id + '%')

  // Related content via focus areas
  var focusAreas = official.focus_area_ids ? official.focus_area_ids.split(',').map(function (s) { return s.trim() }).filter(Boolean) : []
  var related: Array<{ id: string; title_6th_grade: string; summary_6th_grade: string; pathway_primary: string | null; center: string | null; source_url: string; published_at: string | null }> = []
  if (focusAreas.length > 0) {
    var filters = focusAreas.map(function (fa) { return 'focus_area_ids.cs.{' + fa + '}' }).join(',')
    var { data: contentData } = await supabase
      .from('content_published')
      .select('id, title_6th_grade, summary_6th_grade, pathway_primary, center, source_url, published_at')
      .eq('is_active', true)
      .or(filters)
      .limit(4)
    related = contentData || []
  }

  // Fetch translations for non-English
  const langId = await getLangId()
  var officialTranslation: { title?: string; summary?: string } | undefined
  var policyTranslations: Record<string, { title?: string; summary?: string }> = {}
  if (langId) {
    const pIds = (policies || []).map(function (p) { return p.policy_id })
    var results = await Promise.all([
      fetchTranslationsForTable('elected_officials', [official.official_id], langId),
      pIds.length > 0 ? fetchTranslationsForTable('policies', pIds, langId) : {},
    ])
    officialTranslation = results[0][official.official_id]
    policyTranslations = results[1]
  }

  var displayTitle = officialTranslation?.title || official.title

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumb */}
      <div className="text-sm text-brand-muted mb-6">
        <Link href="/officials" className="hover:text-brand-accent">Officials</Link>
        <span className="mx-2">/</span>
        <span>{official.official_name}</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          {official.level && (
            <span className={'text-xs px-3 py-1 rounded-full font-medium ' + levelColor(official.level)}>{official.level}</span>
          )}
        </div>
        <h1 className="text-3xl font-bold text-brand-text mb-1">{official.official_name}</h1>
        {displayTitle && <p className="text-lg text-brand-muted mb-2">{displayTitle}</p>}
        <div className="flex items-center gap-2 text-sm text-brand-muted">
          {official.party && <span>{official.party}</span>}
          {official.party && official.jurisdiction && <span>&bull;</span>}
          {official.jurisdiction && <span>{official.jurisdiction}</span>}
        </div>
        {official.term_end && (
          <p className="text-sm text-brand-muted mt-1">Term ends: {new Date(official.term_end).toLocaleDateString()}</p>
        )}
      </div>

      {/* Contact card */}
      <div className="bg-white rounded-xl border border-brand-border p-5 mb-8 flex flex-wrap gap-4">
        {official.office_phone && (
          <a href={'tel:' + official.office_phone} className="flex items-center gap-2 text-sm text-brand-accent hover:underline">
            <Phone size={16} /> {official.office_phone}
          </a>
        )}
        {official.email && (
          <a href={'mailto:' + official.email} className="flex items-center gap-2 text-sm text-brand-accent hover:underline">
            <Mail size={16} /> {official.email}
          </a>
        )}
        {official.website && (
          <a href={official.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-brand-accent hover:underline">
            <Globe size={16} /> Website
          </a>
        )}
      </div>

      {/* About */}
      {official.description_5th_grade && (
        <section className="mb-8">
          <h2 className="text-xl font-bold text-brand-text mb-3">About</h2>
          <p className="text-brand-muted">{official.description_5th_grade}</p>
        </section>
      )}

      {/* District info */}
      {(official.district_type || official.district_id) && (
        <section className="mb-8">
          <h2 className="text-xl font-bold text-brand-text mb-3">District</h2>
          <div className="flex items-center gap-2 text-sm text-brand-muted">
            {official.district_type && <span>{official.district_type}:</span>}
            {official.district_id && <span className="font-medium">{official.district_id}</span>}
          </div>
        </section>
      )}

      {/* Policies */}
      {policies && policies.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold text-brand-text mb-4">Policies &amp; Legislation</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {policies.map(function (p) {
              var pt = policyTranslations[p.policy_id]
              return (
                <Link key={p.policy_id} href={'/policies/' + p.policy_id}>
                  <PolicyCard
                    name={p.policy_name}
                    summary={p.summary_5th_grade}
                    billNumber={p.bill_number}
                    status={p.status}
                    level={p.level}
                    sourceUrl={null}
                    translatedName={pt?.title}
                    translatedSummary={pt?.summary}
                  />
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Related Content */}
      {related.length > 0 && (
        <div className="mt-10">
          <RelatedContent title="Related Content" items={related} />
        </div>
      )}
    </div>
  )
}
