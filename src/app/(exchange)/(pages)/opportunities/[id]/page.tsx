// @ts-nocheck
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Calendar, Clock, MapPin, Globe, Users } from 'lucide-react'
import { DetailWayfinder } from '@/components/exchange/DetailWayfinder'
import { getLangId, fetchTranslationsForTable, getWayfinderContext } from '@/lib/data/exchange'
import { getUserProfile } from '@/lib/auth/roles'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'

export const revalidate = 86400

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('opportunities').select('opportunity_name, description_5th_grade').eq('opportunity_id', id).single()
  if (!data) return { title: 'Not Found' }
  return {
    title: data.opportunity_name,
    description: data.description_5th_grade || 'Opportunity on the Community Exchange.',
  }
}

export default async function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: opportunity } = await supabase
    .from('opportunities')
    .select('*')
    .eq('opportunity_id', id)
    .single()

  if (!opportunity) notFound()

  // Get parent org if linked
  let org: { org_id: string; org_name: string; logo_url: string | null; website: string | null } | null = null
  if (opportunity.org_id) {
    const { data: orgData } = await supabase
      .from('organizations')
      .select('org_id, org_name, logo_url, website')
      .eq('org_id', opportunity.org_id)
      .single()
    org = orgData
  }

  // Focus areas via junction table
  const { data: focusJunctions } = await supabase
    .from('opportunity_focus_areas' as any)
    .select('focus_id')
    .eq('opportunity_id', id)
  const focusAreaIds = (focusJunctions ?? []).map((j: any) => j.focus_id)
  let focusAreas: Array<{ focus_id: string; focus_area_name: string }> = []
  if (focusAreaIds.length > 0) {
    const { data: faData } = await supabase
      .from('focus_areas')
      .select('focus_id, focus_area_name')
      .in('focus_id', focusAreaIds)
    focusAreas = faData ?? []
  }

  // Skills via junction table
  const { data: skillJunctions } = await supabase
    .from('opportunity_skills' as any)
    .select('skill_id')
    .eq('opportunity_id', id)
  const skillIds = (skillJunctions ?? []).map((j: any) => j.skill_id)
  let skills: Array<{ skill_id: string; skill_name: string }> = []
  if (skillIds.length > 0) {
    const { data: skillData } = await supabase
      .from('skills')
      .select('skill_id, skill_name')
      .in('skill_id', skillIds)
    skills = skillData ?? []
  }

  // Translations
  const langId = await getLangId()
  let translation: { title?: string; summary?: string } | undefined
  if (langId) {
    const results = await fetchTranslationsForTable('opportunities', [id], langId)
    translation = results[id]
  }

  const userProfile = await getUserProfile()
  const wayfinderData = await getWayfinderContext('opportunity', id, userProfile?.role)

  const displayName = translation?.title || (opportunity as any).title_6th_grade || opportunity.opportunity_name
  const displayDesc = translation?.summary || (opportunity as any).summary_6th_grade || (opportunity as any).description_5th_grade

  return (
    <div>
      {/* Hero */}
      <div className="bg-brand-bg border-b border-brand-border">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Breadcrumb items={[
            { label: 'Opportunities', href: '/opportunities' },
            { label: displayName }
          ]} />
          <div className="flex items-start gap-4 mt-4">
            {org?.logo_url && (
              <img src={org.logo_url} alt={org.org_name} className="w-16 h-16 rounded-lg object-contain bg-white border border-brand-border" />
            )}
            <div>
              <h1 className="text-3xl font-serif font-bold text-brand-text">{displayName}</h1>
              {org && (
                <Link href={'/organizations/' + org.org_id} className="text-brand-accent hover:underline text-sm mt-1 inline-block">
                  {org.org_name}
                </Link>
              )}
              <div className="flex items-center gap-3 mt-2 text-sm text-brand-muted">
                {(opportunity as any).start_date && (
                  <span className="flex items-center gap-1">
                    <Calendar size={14} /> Starts {new Date((opportunity as any).start_date).toLocaleDateString()}
                  </span>
                )}
                {(opportunity as any).end_date && (
                  <span className="flex items-center gap-1">
                    <Calendar size={14} /> Ends {new Date((opportunity as any).end_date).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick details card */}
        <div className="bg-white rounded-xl border border-brand-border p-5 mb-8 flex flex-wrap gap-4">
          {(opportunity as any).location && (
            <span className="flex items-center gap-2 text-sm text-brand-muted">
              <MapPin size={16} /> {(opportunity as any).location}
            </span>
          )}
          {(opportunity as any).time_commitment && (
            <span className="flex items-center gap-2 text-sm text-brand-muted">
              <Clock size={16} /> {(opportunity as any).time_commitment}
            </span>
          )}
          {(opportunity as any).capacity && (
            <span className="flex items-center gap-2 text-sm text-brand-muted">
              <Users size={16} /> {(opportunity as any).capacity} spots
            </span>
          )}
          {(opportunity as any).website && (
            <a href={(opportunity as any).website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-brand-accent hover:underline">
              <Globe size={16} /> Learn more
            </a>
          )}
          {(opportunity as any).application_url && (
            <a href={(opportunity as any).application_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-medium text-white bg-brand-accent hover:bg-brand-accent/90 px-4 py-2 rounded-lg transition-colors">
              Apply
            </a>
          )}
        </div>

        {/* Description */}
        {displayDesc && (
          <section className="mb-8">
            <h2 className="text-xl font-serif font-bold text-brand-text mb-3">About This Opportunity</h2>
            <p className="text-brand-muted leading-relaxed">{displayDesc}</p>
          </section>
        )}

        {/* Focus Areas */}
        {focusAreas.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-serif font-bold text-brand-text mb-3">Focus Areas</h2>
            <div className="flex flex-wrap gap-2">
              {focusAreas.map(function (fa, i) {
                const colors = [
                  'bg-blue-50 text-blue-700 border-blue-200',
                  'bg-green-50 text-green-700 border-green-200',
                  'bg-purple-50 text-purple-700 border-purple-200',
                  'bg-orange-50 text-orange-700 border-orange-200',
                ]
                return (
                  <Link
                    key={fa.focus_id}
                    href={'/explore/focus/' + fa.focus_id}
                    className={'text-sm px-3 py-1.5 rounded-full border font-medium hover:opacity-80 transition-opacity ' + colors[i % colors.length]}
                  >
                    {fa.focus_area_name}
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-serif font-bold text-brand-text mb-3">Skills Involved</h2>
            <div className="flex flex-wrap gap-2">
              {skills.map(function (s) {
                return (
                  <span key={s.skill_id} className="text-sm px-3 py-1.5 bg-brand-bg rounded-full text-brand-muted font-medium">
                    {s.skill_name}
                  </span>
                )
              })}
            </div>
          </section>
        )}

        {/* Eligibility / requirements */}
        {(opportunity as any).eligibility && (
          <section className="mb-8">
            <h2 className="text-xl font-serif font-bold text-brand-text mb-3">Who Can Participate</h2>
            <p className="text-brand-muted leading-relaxed">{(opportunity as any).eligibility}</p>
          </section>
        )}

        <div className="mt-10">
          <DetailWayfinder data={wayfinderData} currentType="opportunity" currentId={id} userRole={userProfile?.role} />
        </div>
      </div>
    </div>
  )
}
