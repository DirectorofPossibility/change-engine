import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { LibraryChat } from '@/components/exchange/LibraryChat'

export const metadata: Metadata = {
  title: 'Ask the Library | Community Research Library',
  description: 'Ask questions across Houston community research documents and get AI-powered answers with source citations.',
}

export default function LibraryChatPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <Link
        href="/library"
        className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-accent transition-colors mb-6"
      >
        <ArrowLeft size={14} />
        Back to Library
      </Link>

      <div className="mb-6">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-brand-text">
          Ask the Library
        </h1>
        <p className="text-sm text-brand-muted mt-2">
          Ask questions about any topic covered in our community research documents. Answers are generated from the library collection with source citations.
        </p>
      </div>

      <LibraryChat />
    </div>
  )
}
