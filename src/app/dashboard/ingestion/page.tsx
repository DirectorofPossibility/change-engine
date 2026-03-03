import { getIngestionLog, getRssFeeds, getSourceTrust, getPipelineFlowStats } from '@/lib/data/dashboard'
import { IngestionClient } from './IngestionClient'

export const dynamic = 'force-dynamic'

export default async function IngestionPage() {
  const [logs, feeds, trust, pipelineStats] = await Promise.all([
    getIngestionLog(200),
    getRssFeeds(),
    getSourceTrust(),
    getPipelineFlowStats(),
  ])
  return <IngestionClient initialLogs={logs} initialFeeds={feeds} initialTrust={trust} pipelineStats={pipelineStats} />
}
