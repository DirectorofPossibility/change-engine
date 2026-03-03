import Link from 'next/link'

interface GuideNavProps {
  prev: { slug: string; title: string } | null
  next: { slug: string; title: string } | null
}

export function GuideNavigation({ prev, next }: GuideNavProps) {
  return (
    <div className="flex justify-between mt-12 pt-8 border-t border-brand-border">
      {prev ? (
        <Link href={'/guides/' + prev.slug} className="group">
          <span className="text-xs text-brand-muted block mb-1">Previous guide</span>
          <span className="font-serif font-medium text-brand-text group-hover:text-brand-accent transition-colors">{prev.title}</span>
        </Link>
      ) : <div />}
      {next ? (
        <Link href={'/guides/' + next.slug} className="text-right group">
          <span className="text-xs text-brand-muted block mb-1">Next guide</span>
          <span className="font-serif font-medium text-brand-text group-hover:text-brand-accent transition-colors">{next.title}</span>
        </Link>
      ) : <div />}
    </div>
  )
}
