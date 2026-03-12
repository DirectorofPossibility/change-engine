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
      <p className="font-display text-[1.35rem] leading-[1.35] text-[#0d1117] italic font-bold" style={{ paddingLeft: '1.25rem' }}>
        {text}
      </p>
      {attribution && (
        <cite className="block mt-4 font-mono text-[.6rem] uppercase tracking-[0.1em] text-[#5c6474] not-italic" style={{ paddingLeft: '1.25rem' }}>
          {attribution}
        </cite>
      )}
    </blockquote>
  )
}
