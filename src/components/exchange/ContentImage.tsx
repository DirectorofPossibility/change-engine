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
    <Image
      src={src}
      alt={alt}
      className="w-full h-72 object-cover"
      width={800}
      height={288}
      onError={() => setError(true)}
    />
  )
}
