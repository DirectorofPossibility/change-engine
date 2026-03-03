'use client'
import { useState, useEffect } from 'react'

export function ReadingProgressBar() {
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    function onScroll() {
      const h = document.documentElement.scrollHeight - window.innerHeight
      setProgress(h > 0 ? (window.scrollY / h) * 100 : 0)
    }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: progress + '%', height: 3, background: '#C75B2A', zIndex: 100, transition: 'width .1s' }} />
  )
}
