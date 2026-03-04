import { getFidelityOverview } from '@/lib/data/dashboard'
import { FidelityClient } from './FidelityClient'

export const dynamic = 'force-dynamic'

export default async function FidelityPage() {
  let overview: Awaited<ReturnType<typeof getFidelityOverview>> = []
  try {
    overview = await getFidelityOverview()
  } catch (err) {
    console.error('getFidelityOverview error:', err)
  }
  return <FidelityClient overview={overview} />
}
