import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAllDocumentsAdmin } from '@/lib/data/library'
import { LibraryAdmin } from './LibraryAdmin'

export default async function DashboardLibraryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/dashboard/library')

  const documents = await getAllDocumentsAdmin()

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Research Library</h1>
        <p className="text-gray-500 mt-1">Manage uploaded documents — review, approve, or reject submissions.</p>
      </div>

      <LibraryAdmin documents={documents} />
    </div>
  )
}
