/**
 * @fileoverview Content preferences page.
 *
 * Lets users select which pathways and focus areas they care about.
 * Saves selections to user_profiles.focus_area_interests.
 *
 * @route GET /dashboard/preferences
 */

import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { PreferencesClient } from './PreferencesClient'

export const metadata: Metadata = {
  title: 'Content Preferences — Dashboard',
  description: 'Choose which pathways and focus areas matter to you.',
}

export const dynamic = 'force-dynamic'

export default async function PreferencesPage() {
  const supabase = await createClient()

  // Get user profile
  const { data: { user } } = await supabase.auth.getUser()
  let currentInterests: string[] = []
  if (user) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('focus_area_interests')
      .eq('auth_id', user.id)
      .single()
    currentInterests = (profile as any)?.focus_area_interests || []
  }

  // Fetch all focus areas grouped by theme
  const { data: focusAreas } = await supabase
    .from('focus_areas')
    .select('focus_id, focus_area_name, theme_id, description')
    .order('focus_area_name')

  return (
    <PreferencesClient
      focusAreas={focusAreas || []}
      currentInterests={currentInterests}
    />
  )
}
