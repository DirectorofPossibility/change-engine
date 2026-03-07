import { getRssFeeds } from '@/lib/data/dashboard'
import { FeedManagerClient } from './FeedManagerClient'

export const dynamic = 'force-dynamic'

export default async function FeedsPage() {
  const feeds = await getRssFeeds()
  return <FeedManagerClient initialFeeds={feeds} />
}
