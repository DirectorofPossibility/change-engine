import { getIngestionLog, getRssFeeds, getSourceTrust, getPipelineFlowStats, getApiKeys } from '@/lib/data/dashboard'
import { IngestionClient } from './IngestionClient'

export const dynamic = 'force-dynamic'

export default async function IngestionPage() {
  const [logs, feeds, trust, pipelineStats, apiKeys] = await Promise.all([
    getIngestionLog(200),
    getRssFeeds(),
    getSourceTrust(),
    getPipelineFlowStats(),
    getApiKeys(),
  ])
  return <IngestionClient initialLogs={logs} initialFeeds={feeds} initialTrust={trust} pipelineStats={pipelineStats} apiKeys={apiKeys} />
}
