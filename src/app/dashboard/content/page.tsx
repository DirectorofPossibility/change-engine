import { getPublishedContent } from '@/lib/data/dashboard'
import { ContentClient } from './ContentClient'

export default async function ContentPage() {
  const items = await getPublishedContent()
  return <ContentClient initialItems={items} />
}
