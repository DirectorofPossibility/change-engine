import { getIngestionLog, getRssFeeds, getSourceTrust } from '@/lib/data/dashboard'
import { IngestionClient } from './IngestionClient'

export default async function IngestionPage() {
  const [logs, feeds, trust] = await Promise.all([
    getIngestionLog(200),
    getRssFeeds(),
    getSourceTrust(),
  ])
  return <IngestionClient initialLogs={logs} initialFeeds={feeds} initialTrust={trust} />
}
