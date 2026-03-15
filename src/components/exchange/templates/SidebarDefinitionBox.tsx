/**
 * @fileoverview Sidebar definition box — explains a topic/pathway in the sidebar.
 *
 * Inspired by Greater Good Magazine's "Happiness" sidebar boxes that show:
 *   - "What Is [Topic]?"
 *   - "Why Practice It?"
 *   - "How Do I Cultivate It?"
 *
 * For Change Engine, this becomes a topic/pathway explainer with
 * key questions and links to deeper content.
 */

import Link from 'next/link'

interface DefinitionSection {
  question: string
  answer: string
  link?: { href: string; label: string }
}

interface SidebarDefinitionBoxProps {
  title: string
  color: string
  sections: DefinitionSection[]
}

export function SidebarDefinitionBox({ title, color, sections }: SidebarDefinitionBoxProps) {
  return (
    <div className="border border-rule bg-white overflow-hidden">
      {/* Color accent top */}
      <div className="h-1" style={{ background: color }} />

      <div className="p-5">
        <h3 className="font-display text-base font-bold text-ink mb-4">{title}</h3>

        <div className="space-y-4">
          {sections.map((s, i) => (
            <div key={i}>
              <h4 className="text-sm font-bold text-ink mb-1">{s.question}</h4>
              <p className="text-[13px] leading-relaxed text-muted">{s.answer}</p>
              {s.link && (
                <Link
                  href={s.link.href}
                  className="inline-block mt-1.5 text-xs font-semibold transition-colors"
                  style={{ color }}
                >
                  {s.link.label} &rarr;
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
