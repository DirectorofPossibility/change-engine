'use client'

import { useState } from 'react'
import Image from 'next/image'
import { FolFallback } from '@/components/ui/FolFallback'

const PATHWAY_GRADIENTS: Record<string, { from: string; to: string }> = {
  THEME_01: { from: '#1a6b56', to: '#0a2a22' },
  THEME_02: { from: '#1e4d7a', to: '#0e2a45' },
  THEME_03: { from: '#4a2870', to: '#2a1640' },
  THEME_04: { from: '#5c2d3e', to: '#2a1520' },
  THEME_05: { from: '#3a4a2a', to: '#1a2812' },
  THEME_06: { from: '#1a5030', to: '#0a2818' },
  THEME_07: { from: '#1b5e8a', to: '#0a1a30' },
}

interface ContentImageProps {
  src: string
  alt: string
  themeColor: string
  pathway?: string | null
}

export function ContentImage({ src, alt, themeColor, pathway }: ContentImageProps) {
  const [error, setError] = useState(false)

  if (error) {
    return <FolFallback pathway={pathway} height="h-72" />
  }

  const grad = (pathway && PATHWAY_GRADIENTS[pathway]) || { from: '#5c6474', to: '#2c3038' }

  return (
    <div
      className="w-full h-72 flex items-center justify-center relative overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${grad.from}, ${grad.to})` }}
    >
      {/* FOL pattern behind image */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <g opacity="0.08">
          {Array.from({ length: 7 }, (_, i) => {
            const r = 12
            const cx = 50
            const cy = 50
            const offsets = [
              [0, 0], [r, 0], [-r, 0],
              [r / 2, -r * 0.866], [-r / 2, -r * 0.866],
              [r / 2, r * 0.866], [-r / 2, r * 0.866],
            ]
            const [dx, dy] = offsets[i]
            return <circle key={i} cx={cx + dx} cy={cy + dy} r={r} stroke="white" strokeWidth="0.5" />
          })}
          <circle cx={50} cy={50} r={26} stroke="white" strokeWidth="0.3" />
        </g>
      </svg>
      <Image
        src={src}
        alt={alt}
        className="max-w-full max-h-full w-auto h-auto object-contain relative z-10"
        width={800}
        height={600}
        onError={() => setError(true)}
      />
    </div>
  )
}
