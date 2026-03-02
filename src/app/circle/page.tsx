import { getCircleData } from '@/lib/data/circle'
import CommunityExchangeV13 from '@/components/CommunityExchangeV13'

export const dynamic = 'force-dynamic'

export default async function CirclePage() {
  const data = await getCircleData()
  return <CommunityExchangeV13 data={data} />
}
