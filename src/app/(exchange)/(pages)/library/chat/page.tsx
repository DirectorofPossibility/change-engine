import type { Metadata } from 'next'
import { LibraryChat } from '@/components/exchange/LibraryChat'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Chat with Chance | Community Exchange',
  description: 'Ask Chance, your neighborhood guide, about Houston community resources, services, organizations, elected officials, and more.',
}

export default function LibraryChatPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb items={[{ label: 'Library', href: '/library' }, { label: 'Chat with Chance' }]} />

      <div className="mb-6">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-brand-text">
          Chat with Chance
        </h1>
        <p className="text-sm text-brand-muted mt-2">
          Your neighborhood guide to Houston&apos;s community resources, services, and opportunities. Ask anything!
        </p>
      </div>

      <LibraryChat />
    </div>
  )
}
