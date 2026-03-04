'use client'

import { useState, useRef } from 'react'
import { Upload, FileText, X, Check } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

export function DocumentUpload() {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [tags, setTags] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile)
      if (!title) setTitle(droppedFile.name.replace(/\.pdf$/i, ''))
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      if (!title) setTitle(selectedFile.name.replace(/\.pdf$/i, ''))
    }
  }

  function clearFile() {
    setFile(null)
    setResult(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file || isUploading) return

    setIsUploading(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', title)
      formData.append('tags', tags)

      const res = await fetch('/api/library/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (data.success) {
        setResult({ success: true, message: t('library.upload_success') })
        setFile(null)
        setTitle('')
        setTags('')
        if (fileInputRef.current) fileInputRef.current.value = ''
      } else {
        setResult({ success: false, message: data.error || 'Upload failed' })
      }
    } catch {
      setResult({ success: false, message: 'Upload failed. Please try again.' })
    } finally {
      setIsUploading(false)
    }
  }

  const fileSizeMB = file ? (file.size / (1024 * 1024)).toFixed(1) : '0'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={function () { fileInputRef.current?.click() }}
        className={
          'relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ' +
          (isDragging
            ? 'border-brand-accent bg-brand-accent/5'
            : file
              ? 'border-brand-success/50 bg-green-50/50'
              : 'border-brand-border hover:border-brand-accent/50 hover:bg-brand-accent/[0.02]')
        }
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileSelect}
          className="hidden"
        />

        {file ? (
          <div className="flex items-center justify-center gap-3">
            <FileText size={24} className="text-brand-success" />
            <div className="text-left">
              <p className="text-sm font-semibold text-brand-text">{file.name}</p>
              <p className="text-xs text-brand-muted">{fileSizeMB} MB</p>
            </div>
            <button
              type="button"
              onClick={function (e) { e.stopPropagation(); clearFile() }}
              className="p-1 rounded-full hover:bg-gray-100 text-brand-muted"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <>
            <Upload size={32} className="mx-auto text-brand-muted/50 mb-3" />
            <p className="text-sm font-semibold text-brand-text">{t('library.drop_pdf')}</p>
            <p className="text-xs text-brand-muted mt-1">{t('library.max_size')}</p>
          </>
        )}
      </div>

      {/* Title input */}
      <div>
        <label htmlFor="doc-title" className="block text-sm font-semibold text-brand-text mb-1">
          {t('library.doc_title')}
        </label>
        <input
          id="doc-title"
          type="text"
          value={title}
          onChange={function (e) { setTitle(e.target.value) }}
          placeholder={t('library.title_placeholder')}
          className="w-full text-sm px-4 py-2.5 border border-brand-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-accent placeholder:text-brand-muted/60"
        />
      </div>

      {/* Tags input */}
      <div>
        <label htmlFor="doc-tags" className="block text-sm font-semibold text-brand-text mb-1">
          {t('library.doc_tags')}
        </label>
        <input
          id="doc-tags"
          type="text"
          value={tags}
          onChange={function (e) { setTags(e.target.value) }}
          placeholder={t('library.tags_placeholder')}
          className="w-full text-sm px-4 py-2.5 border border-brand-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-accent placeholder:text-brand-muted/60"
        />
      </div>

      {/* Result message */}
      {result && (
        <div className={'flex items-center gap-2 px-4 py-3 rounded-lg text-sm ' +
          (result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700')}>
          {result.success ? <Check size={16} /> : <X size={16} />}
          {result.message}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={!file || isUploading}
        className="w-full py-3 rounded-xl bg-brand-accent text-white font-semibold text-sm disabled:opacity-40 hover:opacity-90 transition-opacity"
      >
        {isUploading ? t('library.uploading') : t('library.upload_btn')}
      </button>
    </form>
  )
}
