'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { useTranslation } from '@/lib/use-translation'

export function LibraryHeroSearch() {
  const { t } = useTranslation()
  const router = useRouter()
  const [query, setQuery] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    router.push('/search?q=' + encodeURIComponent(q) + '&scope=library')
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="relative">
        <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-muted" />
        <input
          type="text"
          value={query}
          onChange={function (e) { setQuery(e.target.value) }}
          placeholder={t('library.kb_search_placeholder')}
          className="w-full pl-14 pr-6 py-4 text-base border border-brand-border rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-accent placeholder:text-brand-muted/60"
        />
      </div>
    </form>
  )
}
