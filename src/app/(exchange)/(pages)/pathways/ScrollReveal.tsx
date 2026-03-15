'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

export function ScrollReveal({
  children,
  className = '',
  delay = 0,
  direction = 'up',
}: {
  children: ReactNode
  className?: string
  delay?: number
  direction?: 'up' | 'left' | 'right'
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(function () {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      function ([entry]) {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
    )
    observer.observe(el)
    return function () { observer.disconnect() }
  }, [])

  const transforms = {
    up: 'translateY(40px)',
    left: 'translateX(40px)',
    right: 'translateX(-40px)',
  }

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translate(0)' : transforms[direction],
        transition: `opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

export function ParallaxSection({
  children,
  className = '',
  color,
}: {
  children: ReactNode
  className?: string
  color: string
}) {
  return (
    <section
      className={className}
      style={{
        borderTop: `6px solid ${color}`,
        background: `linear-gradient(180deg, ${color}08 0%, transparent 40%)`,
      }}
    >
      {children}
    </section>
  )
}
