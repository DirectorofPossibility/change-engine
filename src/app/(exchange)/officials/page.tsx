import { getOfficials } from '@/lib/data/exchange'
import { OfficialsClient } from './OfficialsClient'

export default async function OfficialsPage() {
  const { officials, levels } = await getOfficials()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-brand-text mb-2">Elected Officials</h1>
      <p className="text-brand-muted mb-8">
        Find and contact your elected representatives at every level of government.
      </p>

      <OfficialsClient officials={officials} levels={levels} />
    </div>
  )
}
