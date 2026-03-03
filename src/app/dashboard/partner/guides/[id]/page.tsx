/**
 * @fileoverview Edit guide page for partners.
 *
 * Fetches the existing guide (verifying org ownership) and available
 * focus areas, then renders GuideFormClient in edit mode.
 *
 * @route GET /dashboard/partner/guides/[id]
 */

import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import GuideFormClient from '../GuideFormClient'

interface EditGuidePageProps {
  params: Promise<{ id: string }>
}

export default async function EditGuidePage({ params }: EditGuidePageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirect=/dashboard/partner/guides/' + id)

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, org_id')
    .eq('auth_id', user.id)
    .single()

  if (!profile || profile.role !== 'partner' || !profile.org_id) {
    redirect('/dashboard')
  }

  const orgId = profile.org_id as string

  // Fetch the guide, verifying org ownership
  const { data: guide } = await supabase
    .from('guides')
    .select('*')
    .eq('guide_id', id)
    .eq('org_id', orgId)
    .single()

  if (!guide) {
    notFound()
  }

  // Fetch focus areas for the multi-select
  const { data: focusAreas } = await supabase
    .from('focus_areas')
    .select('focus_id, focus_area_name, theme_id')
    .order('focus_area_name')

  // Normalize guide data for the form
  const guideData = {
    guide_id: (guide as any).guide_id,
    title: (guide as any).title,
    slug: (guide as any).slug,
    description: (guide as any).description,
    content_html: (guide as any).content_html,
    hero_image_url: (guide as any).hero_image_url,
    theme_id: (guide as any).theme_id,
    engagement_level: (guide as any).engagement_level,
    sections: (guide as any).sections,
    focus_area_ids: (guide as any).focus_area_ids,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-text font-serif">Edit Guide</h1>
        <p className="text-brand-muted mt-1">
          Update your guide. Changes will reset the review status to pending.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-brand-border p-6">
        <GuideFormClient guide={guideData} focusAreas={focusAreas || []} />
      </div>
    </div>
  )
}
