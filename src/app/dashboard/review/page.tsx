import { getReviewQueue } from '@/lib/data/dashboard'
import { ReviewClient } from './ReviewClient'

export default async function ReviewPage() {
  const items = await getReviewQueue()
  return <ReviewClient initialItems={items} />
}
