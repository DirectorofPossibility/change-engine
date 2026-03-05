import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/roles'
import { UsersClient } from './UsersClient'
import { RoleRequestQueue } from './RoleRequestQueue'

export interface UserProfile {
  id: string
  auth_id: string | null
  display_name: string | null
  email: string | null
  role: string
  org_id: string | null
  created_at: string | null
  account_status: string
}

export interface Organization {
  org_id: string
  org_name: string
}

export default async function UsersPage() {
  await requireAdmin()

  const supabase = await createClient()

  const { data: users, error: usersError } = await supabase
    .from('user_profiles')
    .select('id, auth_id, display_name, email, role, org_id, created_at, account_status')
    .order('created_at', { ascending: false })

  const { data: orgs } = await supabase
    .from('organizations')
    .select('org_id, org_name')
    .order('org_name', { ascending: true })

  // Fetch pending role requests with user info
  const { data: roleRequests } = await supabase
    .from('role_requests' as any)
    .select('id, user_id, requested_role, org_name, reason, status, created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  // Enrich role requests with user display info
  const enrichedRequests = (roleRequests || []).map(function (rr: any) {
    const user = (users || []).find(function (u: any) { return u.id === rr.user_id })
    return {
      ...rr,
      user_display_name: user?.display_name || null,
      user_email: user?.email || null,
      user_role: user?.role || 'user',
    }
  })

  if (usersError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
        <h2 className="font-semibold mb-1">Failed to load users</h2>
        <p className="text-sm">{usersError.message}</p>
      </div>
    )
  }

  return (
    <>
      <RoleRequestQueue initialRequests={enrichedRequests} />
      <UsersClient
        initialUsers={(users ?? []) as unknown as UserProfile[]}
        organizations={(orgs ?? []) as Organization[]}
      />
    </>
  )
}
