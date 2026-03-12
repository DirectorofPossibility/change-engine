import type { Metadata } from 'next'
import { LibraryChat } from '@/components/exchange/LibraryChat'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { WayfinderTooltipPos } from '@/components/exchange/WayfinderTooltips'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Chat with Chance | Change Engine',
  description: 'Ask Chance about anything in Houston — community resources, services, organizations, elected officials, policies, and more.',
}

export default function ChatPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb items={[{ label: 'Chat with Chance' }]} />

      <div className="relative mb-6">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-brand-text">
          Chat with Chance
        </h1>
        <WayfinderTooltipPos tipKey="chat_with_chance" position="bottom" />
        <p className="text-sm text-brand-muted mt-2">
          Your neighborhood guide to everything Houston. Ask about services, organizations, officials, policies, community research, and more.
        </p>
      </div>

      <LibraryChat />
    </div>
  )
}
