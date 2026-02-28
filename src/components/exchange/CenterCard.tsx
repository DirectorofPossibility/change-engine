import Link from 'next/link'

interface CenterCardProps {
  name: string
  emoji: string
  question: string
  slug: string
  count: number
}

export function CenterCard({ name, emoji, question, slug, count }: CenterCardProps) {
  return (
    <Link
      href={`/centers/${slug}`}
      className="block bg-white rounded-xl border border-brand-border p-6 hover:shadow-md transition-shadow text-center"
    >
      <span className="text-4xl block mb-3">{emoji}</span>
      <h3 className="font-bold text-brand-text mb-1">{name}</h3>
      <p className="text-sm text-brand-muted mb-3">{question}</p>
      <span className="text-xs text-brand-accent font-medium">{count} resources</span>
    </Link>
  )
}
