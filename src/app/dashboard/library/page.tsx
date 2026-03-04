import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAllDocumentsAdmin, getDocumentsByUploader } from '@/lib/data/library'
import { LibraryAdmin } from './LibraryAdmin'

export default async function DashboardLibraryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/dashboard/library')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('auth_id', user.id)
    .single()

  const role = (profile?.role as string) || 'user'
  const isPartner = role === 'partner'

  const documents = isPartner
    ? await getDocumentsByUploader(user.id)
    : await getAllDocumentsAdmin()

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Research Library</h1>
        <p className="text-gray-500 mt-1">
          {isPartner
            ? 'Upload and manage your documents in the knowledge base.'
            : 'Manage uploaded documents — review, approve, or reject submissions.'}
        </p>
      </div>

      <LibraryAdmin documents={documents} role={role} />
    </div>
  )
}
