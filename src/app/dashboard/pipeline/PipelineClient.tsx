'use client'

import { useState } from 'react'
import { IngestionClient } from '../ingestion/IngestionClient'
import { SubmitClient } from '../submit/SubmitClient'
import { ApiKeysClient } from '../api-keys/ApiKeysClient'
import type { RssFeed, ApiKey } from '@/lib/types/dashboard'

const TABS = ['Ingestion', 'Submit', 'API Keys'] as const

interface Props {
  ingestionData: {
    logs: any[]
    feeds: RssFeed[]
    trust: any[]
    pipelineStats: {
      inbox: { pending: number; classified: number; flagged: number; needs_review: number }
      review: { pending: number; auto_approved: number; approved: number; flagged: number; rejected: number }
      published: number
    }
  }
  apiKeys: ApiKey[]
}

export function PipelineClient({ ingestionData, apiKeys }: Props) {
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('Ingestion')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-brand-text">Pipeline</h1>
        <p className="text-sm text-brand-muted mt-1">
          Ingestion, content submission, and API key management
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-brand-border">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? 'border-brand-accent text-brand-accent'
                : 'border-transparent text-brand-muted hover:text-brand-text hover:border-brand-border'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'Ingestion' && (
        <IngestionClient
          initialLogs={ingestionData.logs}
          initialFeeds={ingestionData.feeds}
          initialTrust={ingestionData.trust}
          pipelineStats={ingestionData.pipelineStats}
        />
      )}
      {activeTab === 'Submit' && <SubmitClient />}
      {activeTab === 'API Keys' && <ApiKeysClient initialKeys={apiKeys} />}
    </div>
  )
}
