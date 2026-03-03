'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/roles'
import { revalidatePath } from 'next/cache'

export async function assignPartnerRole(userId: string, orgId: string) {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from('user_profiles')
    .update({ role: 'partner', org_id: orgId } as any)
    .eq('id', userId)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/users')
  return { success: true }
}

export async function assignAdminRole(userId: string) {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from('user_profiles')
    .update({ role: 'admin' } as any)
    .eq('id', userId)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/users')
  return { success: true }
}

export async function promoteToNeighbor(userId: string) {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from('user_profiles')
    .update({ role: 'neighbor' } as any)
    .eq('id', userId)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/users')
  return { success: true }
}

export async function revokeToUser(userId: string) {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from('user_profiles')
    .update({ role: 'user', org_id: null } as any)
    .eq('id', userId)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/users')
  return { success: true }
}
