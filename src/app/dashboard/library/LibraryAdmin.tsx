'use client'

import { useState, useRef, useCallback } from 'react'
import { FileText, Check, X, RefreshCw, Eye, Upload, CloudUpload } from 'lucide-react'
import type { KBDocument } from '@/lib/data/library'

interface LibraryAdminProps {
  documents: KBDocument[]
  role?: string
}

type UploadStage = 'idle' | 'uploading' | 'processing' | 'done' | 'error'

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  published: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
}

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export function LibraryAdmin({ documents: initialDocs, role = 'admin' }: LibraryAdminProps) {
  const [documents, setDocuments] = useState(initialDocs)
  const [filter, setFilter] = useState<string>('all')
  const [processing, setProcessing] = useState<Set<string>>(new Set())

  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [tags, setTags] = useState('')
  const [uploadStage, setUploadStage] = useState<UploadStage>('idle')
  const [uploadError, setUploadError] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isAdmin = role === 'admin'

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

  function validateFile(file: File): string | null {
    if (file.type !== 'application/pdf') return 'Only PDF files are accepted.'
    if (file.size > MAX_FILE_SIZE) return 'File size exceeds 50MB limit.'
    return null
  }

  function handleFileSelect(file: File) {
    const error = validateFile(file)
    if (error) {
      setUploadError(error)
      return
    }
    setSelectedFile(file)
    setUploadError('')
    setUploadStage('idle')
  }

  const handleDragOver = useCallback(function (e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback(function (e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(function (e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }, [])

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
  }

  async function handleUpload() {
    if (!selectedFile) return

    setUploadStage('uploading')
    setUploadError('')

    try {
      // Step 1: Upload
      const formData = new FormData()
      formData.append('file', selectedFile)
      if (title.trim()) formData.append('title', title.trim())
      if (tags.trim()) formData.append('tags', tags.trim())

      const uploadRes = await fetch('/api/library/upload', {
        method: 'POST',
        body: formData,
      })

      const uploadData = await uploadRes.json()

      if (!uploadRes.ok || !uploadData.success) {
        throw new Error(uploadData.error || 'Upload failed')
      }

      const docId = uploadData.document_id

      // Add the new document to the table immediately as "processing"
      const newDoc: KBDocument = {
        id: docId,
        title: title.trim() || selectedFile.name.replace(/\.pdf$/i, ''),
        summary: '',
        key_points: [],
        file_path: '',
        file_size: selectedFile.size,
        page_count: 0,
        status: 'processing',
        uploaded_by: null,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        theme_ids: [],
        focus_area_ids: [],
        created_at: new Date().toISOString(),
        published_at: null,
      }
      setDocuments(function (prev) { return [newDoc, ...prev] })

      // Step 2: Auto-process
      setUploadStage('processing')

      const processRes = await fetch('/api/library/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_id: docId }),
      })

      const processData = await processRes.json()

      if (processData.success) {
        // Update the document in the table
        setDocuments(function (prev) {
          return prev.map(function (d) {
            return d.id === docId
              ? { ...d, status: 'published', title: processData.title || d.title, page_count: processData.page_count || 0 }
              : d
          })
        })
        setUploadStage('done')
      } else {
        // Processing failed — leave as pending for admin to retry
        setDocuments(function (prev) {
          return prev.map(function (d) {
            return d.id === docId ? { ...d, status: 'pending' } : d
          })
        })
        throw new Error(processData.error || 'Processing failed')
      }

      // Reset form after success
      setTimeout(function () {
        setSelectedFile(null)
        setTitle('')
        setTags('')
        setUploadStage('idle')
        if (fileInputRef.current) fileInputRef.current.value = ''
      }, 3000)

    } catch (err) {
      setUploadStage('error')
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    }
  }

  function resetUpload() {
    setSelectedFile(null)
    setTitle('')
    setTags('')
    setUploadStage('idle')
    setUploadError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleApprove(docId: string) {
    setProcessing(function (prev) { return new Set(prev).add(docId) })

    try {
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

  const isUploading = uploadStage === 'uploading' || uploadStage === 'processing'

  return (
    <>
      {/* Upload section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Upload size={20} />
          Upload Document
        </h2>

        {/* Drop zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={function () { if (!isUploading) fileInputRef.current?.click() }}
          className={'relative rounded-lg border-2 border-dashed p-8 text-center cursor-pointer transition-colors '
            + (isDragOver
              ? 'border-blue-400 bg-blue-50'
              : selectedFile
                ? 'border-green-300 bg-green-50'
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50')}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileInputChange}
            className="hidden"
          />

          {selectedFile ? (
            <div className="flex items-center justify-center gap-3">
              <FileText size={24} className="text-green-600" />
              <div className="text-left">
                <p className="font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                </p>
              </div>
              {!isUploading && (
                <button
                  onClick={function (e) { e.stopPropagation(); resetUpload() }}
                  className="ml-4 p-1 rounded hover:bg-gray-200 text-gray-400"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          ) : (
            <>
              <CloudUpload size={32} className="mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600">
                Drag and drop a PDF here, or click to browse
              </p>
              <p className="text-xs text-gray-400 mt-1">PDF only, up to 50MB</p>
            </>
          )}
        </div>

        {/* Title and Tags inputs */}
        {selectedFile && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-gray-400 font-normal">(optional — AI will generate if blank)</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={function (e) { setTitle(e.target.value) }}
                disabled={isUploading}
                placeholder="e.g., Houston Food Access Report 2025"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags <span className="text-gray-400 font-normal">(comma-separated)</span>
              </label>
              <input
                type="text"
                value={tags}
                onChange={function (e) { setTags(e.target.value) }}
                disabled={isUploading}
                placeholder="e.g., food access, nutrition, community"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>
          </div>
        )}

        {/* Upload button + progress */}
        {selectedFile && (
          <div className="mt-4 flex items-center gap-4">
            <button
              onClick={handleUpload}
              disabled={isUploading || uploadStage === 'done'}
              className="px-5 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {uploadStage === 'uploading' && (
                <><RefreshCw size={14} className="animate-spin" /> Uploading...</>
              )}
              {uploadStage === 'processing' && (
                <><RefreshCw size={14} className="animate-spin" /> Processing with AI...</>
              )}
              {uploadStage === 'done' && (
                <><Check size={14} /> Published</>
              )}
              {uploadStage === 'idle' && (
                <><Upload size={14} /> Upload &amp; Process</>
              )}
              {uploadStage === 'error' && (
                <><Upload size={14} /> Retry Upload</>
              )}
            </button>

            {uploadStage === 'processing' && (
              <p className="text-sm text-blue-600">
                AI is reading, summarizing, and classifying your document...
              </p>
            )}
            {uploadStage === 'done' && (
              <p className="text-sm text-green-600">
                Document published to the knowledge base.
              </p>
            )}
          </div>
        )}

        {/* Error message */}
        {uploadError && (
          <p className="mt-3 text-sm text-red-600">{uploadError}</p>
        )}
      </div>

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
                        {doc.status === 'pending' && isAdmin && (
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
