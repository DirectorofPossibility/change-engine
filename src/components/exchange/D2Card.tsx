import Link from 'next/link'

interface D2CardProps {
  title: string
  description?: string
  href?: string
  meta?: string
  source?: string
  effort?: string
  barColor?: string
  children?: React.ReactNode
}

export function D2Card({
  title,
  description,
  href,
  meta,
  source,
  effort,
  barColor,
  children,
}: D2CardProps) {
  const content = (
    <div className="card-chunky relative">
      {barColor && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
          style={{ background: barColor }}
        />
      )}
      <div className={barColor ? 'pl-3' : ''}>
        {meta && <p className="meta-label mb-1.5">{meta}</p>}
        <h4 className="font-sans text-[15px] font-bold text-brand-text leading-snug">{title}</h4>
        {description && (
          <p className="text-[13px] text-brand-muted leading-relaxed mt-1.5">{description}</p>
        )}
        {children}
        <div className="flex items-center gap-3 mt-2">
          {source && <span className="meta-source">{source}</span>}
          {effort && <span className="effort-tag">{effort}</span>}
        </div>
      </div>
    </div>
  )

  if (href) {
    return <Link href={href} className="block">{content}</Link>
  }
  return content
}
