'use client'

import { useState } from 'react'
import { FileText, Check, X, RefreshCw, Eye } from 'lucide-react'
import type { KBDocument } from '@/lib/data/library'

interface LibraryAdminProps {
  documents: KBDocument[]
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  published: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
}

export function LibraryAdmin({ documents: initialDocs }: LibraryAdminProps) {
  const [documents, setDocuments] = useState(initialDocs)
  const [filter, setFilter] = useState<string>('all')
  const [processing, setProcessing] = useState<Set<string>>(new Set())

  const filteredDocs = filter === 'all'
    ? documents
    : documents.filter(function (d) { return d.status === filter })

  const counts = {
    all: documents.length,
    pending: documents.filter(d => d.status === 'pending').length,
    processing: documents.filter(d => d.status === 'processing').length,
    published: documents.filter(d => d.status === 'published').length,
    rejected: documents.filter(d => d.status === 'rejected').length,
  }

  async function handleApprove(docId: string) {
    setProcessing(function (prev) { return new Set(prev).add(docId) })

    try {
      // Trigger processing
      const res = await fetch('/api/library/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_id: docId }),
      })

      const data = await res.json()

      if (data.success) {
        setDocuments(function (prev) {
          return prev.map(function (d) {
            return d.id === docId ? { ...d, status: 'published', title: data.title || d.title } : d
          })
        })
      } else {
        alert('Processing failed: ' + (data.error || 'Unknown error'))
        setDocuments(function (prev) {
          return prev.map(function (d) {
            return d.id === docId ? { ...d, status: 'pending' } : d
          })
        })
      }
    } catch (err) {
      alert('Processing failed')
    } finally {
      setProcessing(function (prev) {
        const next = new Set(prev)
        next.delete(docId)
        return next
      })
    }
  }

  async function handleReject(docId: string) {
    if (!confirm('Reject this document?')) return

    try {
      const res = await fetch(
        process.env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/kb_documents?id=eq.' + docId,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            Authorization: 'Bearer ' + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            Prefer: 'return=minimal',
          },
          body: JSON.stringify({ status: 'rejected' }),
        }
      )

      if (res.ok) {
        setDocuments(function (prev) {
          return prev.map(function (d) {
            return d.id === docId ? { ...d, status: 'rejected' } : d
          })
        })
      }
    } catch {
      alert('Failed to reject document')
    }
  }

  return (
    <>
      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {(['all', 'pending', 'processing', 'published', 'rejected'] as const).map(function (f) {
          return (
            <button
              key={f}
              onClick={function () { setFilter(f) }}
              className={'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ' +
                (filter === f
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
            </button>
          )
        })}
      </div>

      {/* Documents table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Document</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Size</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Uploaded</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDocs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  No documents found
                </td>
              </tr>
            ) : (
              filteredDocs.map(function (doc) {
                const isProcessing = processing.has(doc.id)
                const sizeMB = (doc.file_size / (1024 * 1024)).toFixed(1)

                return (
                  <tr key={doc.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <FileText size={16} className="text-gray-400 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-gray-900 line-clamp-1">{doc.title || 'Untitled'}</p>
                          {doc.summary && (
                            <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{doc.summary}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={'inline-flex px-2 py-0.5 rounded-full text-xs font-medium ' + (STATUS_STYLES[doc.status] || '')}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{sizeMB} MB</td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {doc.status === 'published' && (
                          <a
                            href={'/library/' + doc.id}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500"
                            title="View"
                          >
                            <Eye size={15} />
                          </a>
                        )}
                        {doc.status === 'pending' && (
                          <>
                            <button
                              onClick={function () { handleApprove(doc.id) }}
                              disabled={isProcessing}
                              className="p-1.5 rounded-md hover:bg-green-50 text-green-600 disabled:opacity-50"
                              title="Approve & Process"
                            >
                              {isProcessing ? <RefreshCw size={15} className="animate-spin" /> : <Check size={15} />}
                            </button>
                            <button
                              onClick={function () { handleReject(doc.id) }}
                              disabled={isProcessing}
                              className="p-1.5 rounded-md hover:bg-red-50 text-red-600 disabled:opacity-50"
                              title="Reject"
                            >
                              <X size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
