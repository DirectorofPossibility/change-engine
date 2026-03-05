'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/roles'
import { revalidatePath } from 'next/cache'

export async function approveRoleRequest(requestId: string) {
  const admin = await requireAdmin()
  const supabase = await createClient()

  // Fetch the request
  const { data: request, error: fetchErr } = await supabase
    .from('role_requests' as any)
    .select('id, user_id, requested_role, org_name, status')
    .eq('id', requestId)
    .single()

  if (fetchErr || !request) return { error: 'Request not found' }
  if ((request as any).status !== 'pending') return { error: 'Request already processed' }

  const req = request as any

  // For partner requests, find or note the org
  let orgId: string | null = null
  if (req.requested_role === 'partner' && req.org_name) {
    // Try to find matching org
    const { data: org } = await supabase
      .from('organizations')
      .select('org_id')
      .ilike('org_name', req.org_name)
      .limit(1)

    if (org && org.length > 0) {
      orgId = (org[0] as any).org_id
    }
  }

  // Update user role
  const updateData: any = { role: req.requested_role }
  if (orgId) updateData.org_id = orgId

  const { error: roleErr } = await supabase
    .from('user_profiles')
    .update(updateData)
    .eq('id', req.user_id)

  if (roleErr) return { error: 'Failed to update user role: ' + roleErr.message }

  // Mark request as approved
  const { error: reqErr } = await supabase
    .from('role_requests' as any)
    .update({
      status: 'approved',
      reviewed_by: admin.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', requestId)

  if (reqErr) return { error: 'Role updated but failed to mark request: ' + reqErr.message }

  revalidatePath('/dashboard/users')
  return { success: true }
}

export async function denyRoleRequest(requestId: string, reviewNote?: string) {
  const admin = await requireAdmin()
  const supabase = await createClient()

  const { data: request } = await supabase
    .from('role_requests' as any)
    .select('id, status')
    .eq('id', requestId)
    .single()

  if (!request) return { error: 'Request not found' }
  if ((request as any).status !== 'pending') return { error: 'Request already processed' }

  const { error } = await supabase
    .from('role_requests' as any)
    .update({
      status: 'denied',
      reviewed_by: admin.id,
      review_note: reviewNote || null,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', requestId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/users')
  return { success: true }
}
