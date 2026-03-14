'use client'

import { useState, useEffect } from 'react'
import { Bookmark } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface BookmarkButtonProps {
  contentType: string
  contentId: string
  title?: string
  imageUrl?: string | null
  /** Render style — 'icon' for minimal, 'pill' for labeled */
  variant?: 'icon' | 'pill'
  className?: string
}

export function BookmarkButton({
  contentType,
  contentId,
  title,
  imageUrl,
  variant = 'icon',
  className = '',
}: BookmarkButtonProps) {
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(function () {
    const supabase = createClient()
    supabase.auth.getUser().then(function ({ data }) {
      if (!data?.user) {
        setLoading(false)
        return
      }
      setIsLoggedIn(true)
      supabase
        .from('user_bookmarks' as any)
        .select('id')
        .eq('user_id', data.user.id)
        .eq('content_type', contentType)
        .eq('content_id', contentId)
        .maybeSingle()
        .then(function ({ data: bookmark }) {
          setSaved(!!bookmark)
          setLoading(false)
        })
    })
  }, [contentType, contentId])

  if (!isLoggedIn && !loading) return null

  async function toggle() {
    if (loading) return
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return setLoading(false)

    if (saved) {
      await (supabase.from('user_bookmarks' as any) as any)
        .delete()
        .eq('user_id', user.id)
        .eq('content_type', contentType)
        .eq('content_id', contentId)
      setSaved(false)
    } else {
      await (supabase.from('user_bookmarks' as any) as any)
        .insert({
          user_id: user.id,
          content_type: contentType,
          content_id: contentId,
          title: title || null,
          image_url: imageUrl || null,
        })
      setSaved(true)
    }
    setLoading(false)
  }

  if (variant === 'pill') {
    return (
      <button
        onClick={toggle}
        disabled={loading}
        className={
          'inline-flex items-center gap-2 px-4 py-2 text-[13px] font-semibold border transition-all ' +
          (saved
            ? 'bg-[#1b5e8a] text-white border-[#1b5e8a]'
            : 'bg-white text-[#2D2D2A] border-[#E2DDD5] hover:border-[#1b5e8a] hover:shadow-sm') +
          ' ' + className
        }
        aria-label={saved ? 'Remove bookmark' : 'Bookmark this'}
      >
        <Bookmark size={14} fill={saved ? 'currentColor' : 'none'} />
        {saved ? 'Saved' : 'Save'}
      </button>
    )
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={
        'inline-flex items-center justify-center w-9 h-9 rounded-full transition-all ' +
        (saved
          ? 'bg-[#1b5e8a] text-white'
          : 'bg-white/20 text-white/80 hover:bg-white/30 hover:text-white') +
        ' ' + className
      }
      aria-label={saved ? 'Remove bookmark' : 'Bookmark this'}
    >
      <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />
    </button>
  )
}
