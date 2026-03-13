import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/auth/roles'
import { getSiteConfigRows } from '@/lib/data/site-config'
import { SiteConfigClient } from './SiteConfigClient'

export const metadata: Metadata = {
  title: 'Site Config — Pipeline Admin',
  description: 'Toggle website features, pages, and homepage sections on or off.',
}

export const dynamic = 'force-dynamic'

export default async function SiteConfigPage() {
  await requireAdmin()
  const items = await getSiteConfigRows()

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Site Configuration</h1>
        <p className="text-sm text-gray-500 mt-1">
          Toggle website elements on or off. Changes take effect immediately on the next page load.
        </p>
      </div>
      <SiteConfigClient items={items} />
    </div>
  )
}
