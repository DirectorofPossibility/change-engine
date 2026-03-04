import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/roles'
import { UsersClient } from './UsersClient'

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

  if (usersError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
        <h2 className="font-semibold mb-1">Failed to load users</h2>
        <p className="text-sm">{usersError.message}</p>
      </div>
    )
  }

  return (
    <UsersClient
      initialUsers={(users ?? []) as unknown as UserProfile[]}
      organizations={(orgs ?? []) as Organization[]}
    />
  )
}
