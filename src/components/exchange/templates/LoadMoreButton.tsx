/**
 * @fileoverview Load More button — AJAX-style pagination.
 *
 * Inspired by Greater Good Magazine's "Load More" pattern
 * instead of traditional numbered pagination.
 */

'use client'

interface LoadMoreButtonProps {
  onClick: () => void
  loading?: boolean
  hasMore?: boolean
  label?: string
  accentColor?: string
}

export function LoadMoreButton({
  onClick,
  loading = false,
  hasMore = true,
  label = 'Load More',
  accentColor = '#1b5e8a',
}: LoadMoreButtonProps) {
  if (!hasMore) return null

  return (
    <div className="flex justify-center py-8">
      <button
        onClick={onClick}
        disabled={loading}
        className="px-8 py-3 text-sm font-semibold border-2 transition-all hover:shadow-sm disabled:opacity-50"
        style={{
          color: accentColor,
          borderColor: accentColor,
          background: 'transparent',
        }}
      >
        {loading ? 'Loading...' : label}
      </button>
    </div>
  )
}
