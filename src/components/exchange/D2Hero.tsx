import { FOLWatermark } from './FOLWatermark'

interface D2HeroProps {
  title: string
  subtitle?: string
  handAccent?: string
  folVariant?: 'flower' | 'seed' | 'vesica' | 'tripod' | 'metatron' | 'borromean'
  folColor?: string
  children?: React.ReactNode
}

export function D2Hero({
  title,
  subtitle,
  handAccent,
  folVariant = 'flower',
  folColor,
  children,
}: D2HeroProps) {
  return (
    <section className="relative overflow-hidden w-full bg-brand-cream">
      {/* Subtle radial gradients */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: [
            'radial-gradient(circle at 85% 15%, rgba(199,91,42,0.06) 0%, transparent 40%)',
            'radial-gradient(circle at 10% 85%, rgba(128,90,213,0.04) 0%, transparent 40%)',
          ].join(', '),
        }}
      />

      {/* FOL watermark */}
      <div className="absolute top-4 right-8 z-0">
        <FOLWatermark variant={folVariant} size="lg" color={folColor} animate />
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto px-8 py-14">
        <h1 className="font-display text-[clamp(2rem,5vw,3.5rem)] leading-[1.1] tracking-tight mb-3 text-brand-text">
          {title}
          {handAccent && (
            <span className="font-hand text-[1.15em] font-bold text-brand-accent"> {handAccent}</span>
          )}
        </h1>
        {subtitle && (
          <p className="text-lg leading-relaxed text-brand-muted max-w-2xl">
            {subtitle}
          </p>
        )}
        {children && <div className="mt-6">{children}</div>}
      </div>
    </section>
  )
}
