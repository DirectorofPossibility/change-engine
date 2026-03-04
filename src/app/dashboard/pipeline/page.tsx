import { getIngestionLog, getRssFeeds, getSourceTrust, getPipelineFlowStats, getApiKeys } from '@/lib/data/dashboard'
import { PipelineClient } from './PipelineClient'

export const dynamic = 'force-dynamic'

export default async function PipelinePage() {
  const [logs, feeds, trust, pipelineStats, apiKeys] = await Promise.all([
    getIngestionLog(200),
    getRssFeeds(),
    getSourceTrust(),
    getPipelineFlowStats(),
    getApiKeys(),
  ])

  return (
    <PipelineClient
      ingestionData={{ logs, feeds, trust, pipelineStats }}
      apiKeys={apiKeys}
    />
  )
}
