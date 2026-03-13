interface QuoteCardProps {
  text: string
  attribution?: string
  accentColor?: string
}

export function QuoteCard({ text, attribution, accentColor = '#C75B2A' }: QuoteCardProps) {
  return (
    <blockquote className="relative my-10 py-8">
      <div
        className="absolute left-0 top-0 bottom-0"
        style={{ width: '3px', background: accentColor }}
      />
      <p className="font-display text-[1.35rem] leading-[1.35] text-ink italic font-bold pl-5">
        {text}
      </p>
      {attribution && (
        <cite className="block mt-4 font-mono text-micro uppercase tracking-wider text-muted not-italic pl-5">
          {attribution}
        </cite>
      )}
    </blockquote>
  )
}
