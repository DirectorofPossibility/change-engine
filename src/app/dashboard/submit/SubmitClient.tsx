'use client'

import { useState } from 'react'
import { ThemePill } from '@/components/ui/ThemePill'
import { CenterBadge } from '@/components/ui/CenterBadge'
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge'
import { classifyUrlAction, csvUploadAction, uploadDocumentAction } from './actions'
import type { AiClassification } from '@/lib/types/dashboard'

export function SubmitClient() {
  const [url, setUrl] = useState('')
  const [classifying, setClassifying] = useState(false)
  const [result, setResult] = useState<AiClassification | null>(null)
  const [error, setError] = useState('')

  // CSV
  const [csvRows, setCsvRows] = useState<Array<{ url: string; title?: string; description?: string }>>([])
  const [csvUploading, setCsvUploading] = useState(false)
  const [csvResults, setCsvResults] = useState<any[]>([])

  // Document upload
  const [docUploading, setDocUploading] = useState(false)
  const [docResult, setDocResult] = useState<AiClassification | null>(null)
  const [docError, setDocError] = useState('')
  const [docFileName, setDocFileName] = useState('')

  async function handleClassify(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim()) return
    setClassifying(true)
    setResult(null)
    setError('')
    try {
      const data = await classifyUrlAction(url.trim())
      if (data.error) {
        setError(data.error)
      } else {
        setResult(data.classification || data)
      }
    } catch (err: any) {
      setError(err.message || 'Classification failed')
    }
    setClassifying(false)
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
        return { url: parts[0], title: parts[1] || undefined, description: parts[2] || undefined }
      }).filter(r => r.url)
      setCsvRows(rows)
    }
    reader.readAsText(file)
  }

  async function handleCsvUpload() {
    if (csvRows.length === 0) return
    setCsvUploading(true)
    setCsvResults([])
    try {
      const data = await csvUploadAction(csvRows)
      setCsvResults(data.results || [data])
    } catch (err: any) {
      setCsvResults([{ error: err.message }])
    }
    setCsvUploading(false)
  }

  async function handleDocUpload(e: React.FormEvent) {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const formData = new FormData(form)
    const file = formData.get('file') as File | null
    if (!file) return
    setDocUploading(true)
    setDocResult(null)
    setDocError('')
    setDocFileName(file.name)
    try {
      const data = await uploadDocumentAction(formData)
      if (data.error) {
        setDocError(data.error)
      } else {
        setDocResult(data.classification || data)
      }
    } catch (err: any) {
      setDocError(err.message || 'Document upload failed')
    }
    setDocUploading(false)
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Submit Content</h1>

      {/* Single URL */}
      <div className="bg-white rounded-lg shadow-sm border border-brand-border p-6 space-y-4">
        <h2 className="text-lg font-semibold">Classify a URL</h2>
        <form onSubmit={handleClassify} className="flex gap-3">
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
            disabled={classifying}
            className="px-6 py-2 bg-brand-accent text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
          >
            {classifying ? 'Classifying...' : 'Classify'}
          </button>
        </form>
        {classifying && (
          <div className="flex items-center gap-2 text-sm text-brand-muted">
            <div className="w-4 h-4 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
            Processing with AI (may take 5-15 seconds)...
          </div>
        )}
        {error && (
          <div className="bg-red-50 text-red-700 rounded-lg p-3 text-sm">{error}</div>
        )}
        {result && (
          <div className="border border-brand-border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold">Classification Result</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-brand-muted text-xs block">Title (6th Grade)</span>
                <p className="font-medium mt-1">{result.title_6th_grade}</p>
              </div>
              <div>
                <span className="text-brand-muted text-xs block">Confidence</span>
                <div className="mt-1"><ConfidenceBadge confidence={result.confidence} /></div>
              </div>
              <div>
                <span className="text-brand-muted text-xs block">Pathway</span>
                <div className="mt-1"><ThemePill themeId={result.theme_primary} /></div>
              </div>
              <div>
                <span className="text-brand-muted text-xs block">Center</span>
                <div className="mt-1"><CenterBadge center={result.center} /></div>
              </div>
            </div>
            <div>
              <span className="text-brand-muted text-xs block">Summary (6th Grade)</span>
              <p className="text-sm mt-1">{result.summary_6th_grade}</p>
            </div>
            <div>
              <span className="text-brand-muted text-xs block">Focus Areas</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {(result.focus_area_ids || []).map((id) => (
                  <span key={id} className="text-xs bg-brand-bg px-2 py-0.5 rounded">{id}</span>
                ))}
              </div>
            </div>
            <div>
              <span className="text-brand-muted text-xs block">SDGs</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {(result.sdg_ids || []).map((id) => (
                  <span key={id} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{id}</span>
                ))}
              </div>
            </div>
            <div>
              <span className="text-brand-muted text-xs block">Reasoning</span>
              <p className="text-xs text-brand-muted mt-1">{result.reasoning}</p>
            </div>
          </div>
        )}
      </div>

      {/* Document Upload */}
      <div className="bg-white rounded-lg shadow-sm border border-brand-border p-6 space-y-4">
        <h2 className="text-lg font-semibold">Upload Document</h2>
        <p className="text-sm text-brand-muted">Upload a PDF, DOCX, or TXT file to extract text and classify it.</p>
        <form onSubmit={handleDocUpload} className="flex gap-3 items-center">
          <input
            type="file"
            name="file"
            accept=".pdf,.docx,.doc,.txt"
            className="text-sm"
          />
          <button
            type="submit"
            disabled={docUploading}
            className="px-6 py-2 bg-brand-accent text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
          >
            {docUploading ? 'Processing...' : 'Upload & Classify'}
          </button>
        </form>
        {docUploading && (
          <div className="flex items-center gap-2 text-sm text-brand-muted">
            <div className="w-4 h-4 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
            Extracting text and classifying {docFileName}...
          </div>
        )}
        {docError && (
          <div className="bg-red-50 text-red-700 rounded-lg p-3 text-sm">{docError}</div>
        )}
        {docResult && (
          <div className="border border-brand-border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold">Classification Result — {docFileName}</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-brand-muted text-xs block">Title (6th Grade)</span>
                <p className="font-medium mt-1">{docResult.title_6th_grade}</p>
              </div>
              <div>
                <span className="text-brand-muted text-xs block">Confidence</span>
                <div className="mt-1"><ConfidenceBadge confidence={docResult.confidence} /></div>
              </div>
              <div>
                <span className="text-brand-muted text-xs block">Pathway</span>
                <div className="mt-1"><ThemePill themeId={docResult.theme_primary} /></div>
              </div>
              <div>
                <span className="text-brand-muted text-xs block">Center</span>
                <div className="mt-1"><CenterBadge center={docResult.center} /></div>
              </div>
            </div>
            <div>
              <span className="text-brand-muted text-xs block">Summary (6th Grade)</span>
              <p className="text-sm mt-1">{docResult.summary_6th_grade}</p>
            </div>
            <div>
              <span className="text-brand-muted text-xs block">Focus Areas</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {(docResult.focus_area_ids || []).map((id) => (
                  <span key={id} className="text-xs bg-brand-bg px-2 py-0.5 rounded">{id}</span>
                ))}
              </div>
            </div>
            <div>
              <span className="text-brand-muted text-xs block">SDGs</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {(docResult.sdg_ids || []).map((id) => (
                  <span key={id} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{id}</span>
                ))}
              </div>
            </div>
            <div>
              <span className="text-brand-muted text-xs block">Reasoning</span>
              <p className="text-xs text-brand-muted mt-1">{docResult.reasoning}</p>
            </div>
          </div>
        )}
      </div>

      {/* CSV Upload */}
      <div className="bg-white rounded-lg shadow-sm border border-brand-border p-6 space-y-4">
        <h2 className="text-lg font-semibold">CSV Batch Upload</h2>
        <p className="text-sm text-brand-muted">Upload a CSV with columns: url, title (optional), description (optional)</p>
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
            {csvUploading ? 'Uploading...' : 'Upload & Classify'}
          </button>
        </div>

        {csvRows.length > 0 && csvResults.length === 0 && (
          <div className="bg-white rounded-lg border border-brand-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border text-left text-brand-muted bg-brand-bg/50">
                  <th className="px-4 py-2 font-medium">#</th>
                  <th className="px-4 py-2 font-medium">URL</th>
                  <th className="px-4 py-2 font-medium">Title</th>
                </tr>
              </thead>
              <tbody>
                {csvRows.slice(0, 20).map((row, i) => (
                  <tr key={i} className="border-b border-brand-border/50">
                    <td className="px-4 py-2 text-brand-muted">{i + 1}</td>
                    <td className="px-4 py-2 text-xs max-w-sm truncate">{row.url}</td>
                    <td className="px-4 py-2 text-xs">{row.title || '-'}</td>
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
          <div className="bg-white rounded-lg border border-brand-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border text-left text-brand-muted bg-brand-bg/50">
                  <th className="px-4 py-2 font-medium">#</th>
                  <th className="px-4 py-2 font-medium">URL</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Result</th>
                </tr>
              </thead>
              <tbody>
                {csvResults.map((r: any, i: number) => (
                  <tr key={i} className="border-b border-brand-border/50">
                    <td className="px-4 py-2 text-brand-muted">{i + 1}</td>
                    <td className="px-4 py-2 text-xs max-w-sm truncate">{r.url || '-'}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        r.error ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {r.error ? 'Error' : 'Success'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs text-brand-muted">{r.error || r.inbox_id || 'OK'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
