'use client'

import { useState } from 'react'
import Image from 'next/image'
import { FolFallback } from '@/components/ui/FolFallback'

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

  return (
    <div className="w-full h-72 flex items-center justify-center bg-white/10">
      <Image
        src={src}
        alt={alt}
        className="max-w-full max-h-full w-auto h-auto object-contain"
        width={800}
        height={600}
        onError={() => setError(true)}
      />
    </div>
  )
}
