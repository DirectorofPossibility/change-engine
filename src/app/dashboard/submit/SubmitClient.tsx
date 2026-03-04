'use client'

import { useState } from 'react'
import { ThemePill } from '@/components/ui/ThemePill'
import { CenterBadge } from '@/components/ui/CenterBadge'
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge'

interface IngestResult {
  url: string
  success: boolean
  stage?: string
  inbox_id?: string
  published_id?: string
  title?: string
  confidence?: number
  focus_areas?: string[]
  center?: string
  sdgs?: string[]
  keywords?: string[]
  organizations?: string[]
  translations?: Record<string, any>
  downloads?: number
  text_length?: number
  error?: string
}

export function SubmitClient() {
  const [url, setUrl] = useState('')
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<IngestResult | null>(null)
  const [error, setError] = useState('')

  // CSV batch
  const [csvRows, setCsvRows] = useState<Array<{ url: string }>>([])
  const [csvUploading, setCsvUploading] = useState(false)
  const [csvResults, setCsvResults] = useState<IngestResult[]>([])
  const [csvProgress, setCsvProgress] = useState('')

  async function handleIngest(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim()) return
    setProcessing(true)
    setResult(null)
    setError('')
    try {
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })
      const data = await res.json()
      if (data.results && data.results.length > 0) {
        const r = data.results[0]
        if (r.success) {
          setResult(r)
        } else {
          setError(r.error || 'Ingestion failed')
        }
      } else if (data.error) {
        setError(data.error)
      }
    } catch (err: any) {
      setError(err.message || 'Ingestion failed')
    }
    setProcessing(false)
  }

  function handleCsvFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      const text = evt.target?.result as string
      const lines = text.split('\n').filter(Boolean)
      const rows = lines.slice(1).map((line) => {
        const parts = line.split(',').map(s => s.trim().replace(/^"|"$/g, ''))
        return { url: parts[0] }
      }).filter(r => r.url && r.url.startsWith('http'))
      setCsvRows(rows)
    }
    reader.readAsText(file)
  }

  async function handleCsvUpload() {
    if (csvRows.length === 0) return
    setCsvUploading(true)
    setCsvResults([])
    setCsvProgress('Starting...')

    // Process in batches of 5
    const allResults: IngestResult[] = []
    for (let i = 0; i < csvRows.length; i += 5) {
      const batch = csvRows.slice(i, i + 5)
      setCsvProgress(`Processing ${i + 1}-${Math.min(i + 5, csvRows.length)} of ${csvRows.length}...`)

      try {
        const res = await fetch('/api/ingest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ urls: batch.map(r => r.url) }),
        })
        const data = await res.json()
        allResults.push(...(data.results || []))
      } catch (err: any) {
        batch.forEach(r => allResults.push({ url: r.url, success: false, error: err.message }))
      }
    }

    setCsvResults(allResults)
    setCsvProgress('')
    setCsvUploading(false)
  }

  const successCount = csvResults.filter(r => r.success).length
  const failCount = csvResults.filter(r => !r.success).length

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Submit Content</h1>
      <p className="text-sm text-brand-muted">
        Submit a URL to ingest through the full Knowledge Mesh pipeline:
        scrape, classify, enrich, and translate (ES + VI). Content goes to the review queue for approval before publishing.
      </p>

      {/* Single URL */}
      <div className="bg-white rounded-xl border border-brand-border p-6 space-y-4">
        <h2 className="text-lg font-semibold">Ingest a URL</h2>
        <form onSubmit={handleIngest} className="flex gap-3">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.org/article"
            required
            className="flex-1 border border-brand-border rounded-lg px-4 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={processing}
            className="px-6 py-2 bg-brand-accent text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
          >
            {processing ? 'Processing...' : 'Ingest'}
          </button>
        </form>
        {processing && (
          <div className="flex items-center gap-2 text-sm text-brand-muted">
            <div className="w-4 h-4 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
            Running full pipeline: scrape, classify, translate, queue for review...
          </div>
        )}
        {error && (
          <div className="bg-red-50 text-red-700 rounded-lg p-3 text-sm">{error}</div>
        )}
        {result && (
          <div className="border border-brand-border rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded-lg bg-yellow-100 text-yellow-700 font-medium">Queued for Review</span>
              <ConfidenceBadge confidence={result.confidence || 0} />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-brand-muted text-xs block">Title</span>
                <p className="font-medium mt-1">{result.title}</p>
              </div>
              <div>
                <span className="text-brand-muted text-xs block">Center</span>
                <div className="mt-1"><CenterBadge center={result.center || ''} /></div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-brand-muted text-xs block">Focus Areas</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(result.focus_areas || []).map((id) => (
                    <span key={id} className="text-xs bg-brand-bg px-2 py-0.5 rounded-lg">{id}</span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-brand-muted text-xs block">Global Goals</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(result.sdgs || []).map((id) => (
                    <span key={id} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg">{id}</span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-brand-muted text-xs block">Keywords</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(result.keywords || []).slice(0, 5).map((kw) => (
                    <span key={kw} className="text-xs bg-brand-bg px-2 py-0.5 rounded-lg text-brand-muted">{kw}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Pipeline status */}
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div className="bg-green-50 rounded-lg p-2 text-center">
                <span className="block text-green-700 font-medium">Scraped</span>
                <span className="text-green-600">{result.text_length?.toLocaleString()} chars</span>
              </div>
              <div className="bg-green-50 rounded-lg p-2 text-center">
                <span className="block text-green-700 font-medium">Classified</span>
                <span className="text-green-600">{(result.focus_areas || []).length} focus areas</span>
              </div>
              <div className="bg-green-50 rounded-lg p-2 text-center">
                <span className="block text-green-700 font-medium">Translated</span>
                <span className="text-green-600">{result.translations ? Object.keys(result.translations).length : 0} languages</span>
              </div>
              <div className="bg-green-50 rounded-lg p-2 text-center">
                <span className="block text-green-700 font-medium">Orgs</span>
                <span className="text-green-600">{(result.organizations || []).length} found</span>
              </div>
            </div>

            {(result.organizations || []).length > 0 && (
              <div>
                <span className="text-brand-muted text-xs block mb-1">Organizations Extracted</span>
                {result.organizations!.map((org, i) => (
                  <span key={i} className="text-xs bg-brand-bg px-2 py-0.5 rounded-lg mr-1">{org}</span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* CSV Upload */}
      <div className="bg-white rounded-xl border border-brand-border p-6 space-y-4">
        <h2 className="text-lg font-semibold">CSV Batch Ingest</h2>
        <p className="text-sm text-brand-muted">Upload a CSV with a URL column. Each URL goes through the full pipeline.</p>
        <div className="flex gap-3 items-center">
          <input
            type="file"
            accept=".csv"
            onChange={handleCsvFile}
            className="text-sm"
          />
          {csvRows.length > 0 && (
            <span className="text-sm text-brand-muted">{csvRows.length} URLs parsed</span>
          )}
          <button
            onClick={handleCsvUpload}
            disabled={csvRows.length === 0 || csvUploading}
            className="px-4 py-2 bg-brand-accent text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {csvUploading ? 'Processing...' : 'Ingest All'}
          </button>
        </div>

        {csvProgress && (
          <div className="flex items-center gap-2 text-sm text-brand-muted">
            <div className="w-4 h-4 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
            {csvProgress}
          </div>
        )}

        {csvRows.length > 0 && csvResults.length === 0 && !csvUploading && (
          <div className="bg-white rounded-lg border border-brand-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border text-left text-brand-muted bg-brand-bg/50">
                  <th className="px-4 py-2 font-medium">#</th>
                  <th className="px-4 py-2 font-medium">URL</th>
                </tr>
              </thead>
              <tbody>
                {csvRows.slice(0, 20).map((row, i) => (
                  <tr key={i} className="border-b border-brand-border/50">
                    <td className="px-4 py-2 text-brand-muted">{i + 1}</td>
                    <td className="px-4 py-2 text-xs max-w-sm truncate">{row.url}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {csvRows.length > 20 && (
              <div className="text-center py-2 text-xs text-brand-muted">...and {csvRows.length - 20} more</div>
            )}
          </div>
        )}

        {csvResults.length > 0 && (
          <div className="space-y-3">
            <div className="flex gap-3 text-sm">
              <span className="px-3 py-1 rounded-lg bg-green-100 text-green-700 font-medium">{successCount} succeeded</span>
              {failCount > 0 && <span className="px-3 py-1 rounded-lg bg-red-100 text-red-700 font-medium">{failCount} failed</span>}
            </div>
            <div className="bg-white rounded-lg border border-brand-border overflow-hidden max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0">
                  <tr className="border-b border-brand-border text-left text-brand-muted bg-brand-bg/50">
                    <th className="px-4 py-2 font-medium">#</th>
                    <th className="px-4 py-2 font-medium">URL</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                    <th className="px-4 py-2 font-medium">Title</th>
                    <th className="px-4 py-2 font-medium">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {csvResults.map((r, i) => (
                    <tr key={i} className="border-b border-brand-border/50">
                      <td className="px-4 py-2 text-brand-muted">{i + 1}</td>
                      <td className="px-4 py-2 text-xs max-w-xs truncate">{r.url}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${
                          r.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {r.success ? r.stage || 'OK' : 'Error'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-xs max-w-xs truncate">{r.title || r.error || '-'}</td>
                      <td className="px-4 py-2 text-xs">{r.confidence ? `${Math.round(r.confidence * 100)}%` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
