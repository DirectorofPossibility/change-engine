import { createClient } from '@/lib/supabase/server'

export type UserRole = 'user' | 'neighbor' | 'partner' | 'admin'

export interface UserProfile {
  id: string
  auth_id: string | null
  role: UserRole
  org_id: string | null
  display_name: string | null
  email: string | null
}

/** Fetch the current user's profile including role. Returns null if not authenticated. */
export async function getUserProfile(): Promise<UserProfile | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('user_profiles')
    .select('id, auth_id, display_name, email, role, org_id')
    .eq('auth_id', user.id)
    .single()

  if (!data) return null
  return data as UserProfile
}

/** Require authentication and one of the allowed roles. Throws if not authorized. */
export async function requireRole(...allowedRoles: UserRole[]): Promise<UserProfile> {
  const profile = await getUserProfile()
  if (!profile) throw new Error('Unauthorized')
  if (!allowedRoles.includes(profile.role)) throw new Error('Forbidden: insufficient role')
  return profile
}

/** Require partner role with a valid org_id. */
export async function requirePartner(): Promise<UserProfile & { org_id: string }> {
  const profile = await requireRole('partner', 'admin')
  if (!profile.org_id) throw new Error('Forbidden: no organization assigned')
  return profile as UserProfile & { org_id: string }
}

/** Require admin role. */
export async function requireAdmin(): Promise<UserProfile> {
  return requireRole('admin')
}
