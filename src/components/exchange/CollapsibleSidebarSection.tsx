'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

export function CollapsibleSidebarSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div style={{ borderBottom: '1px solid #dde1e8' }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 text-left group"
      >
        <h4
          className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.1em]"
          style={{ color: '#5c6474' }}
        >
          {title}
        </h4>
        <ChevronDown
          size={14}
          className="flex-shrink-0 transition-transform duration-200"
          style={{
            color: '#5c6474',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>
      <div
        className="overflow-hidden transition-all duration-200"
        style={{
          maxHeight: open ? '500px' : '0',
          opacity: open ? 1 : 0,
        }}
      >
        <div className="px-6 pb-4">{children}</div>
      </div>
    </div>
  )
}
