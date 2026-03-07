interface QuoteCardProps {
  text: string
  attribution?: string
  accentColor?: string
}

export function QuoteCard({ text, attribution, accentColor = '#C75B2A' }: QuoteCardProps) {
  return (
    <blockquote className="relative my-10 py-8 px-8 max-w-3xl mx-auto">
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded"
        style={{ background: accentColor }}
      />
      <p className="font-serif text-xl leading-relaxed text-brand-text italic pl-6">
        {text}
      </p>
      {attribution && (
        <cite className="block mt-4 pl-6 font-mono text-xs font-bold uppercase tracking-wider text-brand-muted not-italic">
          {attribution}
        </cite>
      )}
    </blockquote>
  )
}
