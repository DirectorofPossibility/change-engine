/**
 * Flower of Life watermark — decorative background element.
 * Different sacred geometry variants at 3 scales.
 */

interface FOLWatermarkProps {
  variant?: 'flower' | 'seed' | 'vesica' | 'tripod' | 'metatron' | 'borromean'
  size?: 'sm' | 'md' | 'lg'
  color?: string
  className?: string
  animate?: boolean
}

const SIZES = { sm: 80, md: 160, lg: 400 }
const OPACITIES = { sm: 0.12, md: 0.08, lg: 0.05 }

function FlowerPath() {
  return (
    <>
      <circle cx="100" cy="100" r="40" />
      <circle cx="100" cy="60" r="40" />
      <circle cx="100" cy="140" r="40" />
      <circle cx="134.6" cy="80" r="40" />
      <circle cx="134.6" cy="120" r="40" />
      <circle cx="65.4" cy="80" r="40" />
      <circle cx="65.4" cy="120" r="40" />
    </>
  )
}

function SeedPath() {
  return (
    <>
      <circle cx="100" cy="100" r="40" strokeOpacity="0.8" />
      <circle cx="100" cy="60" r="40" strokeOpacity="0.5" />
      <circle cx="100" cy="140" r="40" strokeOpacity="0.5" />
      <circle cx="134.6" cy="80" r="40" strokeOpacity="0.5" />
      <circle cx="134.6" cy="120" r="40" strokeOpacity="0.5" />
      <circle cx="65.4" cy="80" r="40" strokeOpacity="0.5" />
      <circle cx="65.4" cy="120" r="40" strokeOpacity="0.5" />
    </>
  )
}

function VesicaPath() {
  return (
    <>
      <circle cx="80" cy="100" r="45" />
      <circle cx="120" cy="100" r="45" />
    </>
  )
}

function TripodPath() {
  return (
    <>
      <circle cx="100" cy="72" r="38" />
      <circle cx="132" cy="128" r="38" />
      <circle cx="68" cy="128" r="38" />
    </>
  )
}

function MetatronPath() {
  return (
    <>
      <circle cx="100" cy="100" r="36" />
      <circle cx="100" cy="60" r="36" />
      <circle cx="100" cy="140" r="36" />
      <circle cx="134.6" cy="80" r="36" />
      <circle cx="134.6" cy="120" r="36" />
      <circle cx="65.4" cy="80" r="36" />
      <circle cx="65.4" cy="120" r="36" />
      <line x1="100" y1="60" x2="134.6" y2="80" />
      <line x1="134.6" y1="80" x2="134.6" y2="120" />
      <line x1="134.6" y1="120" x2="100" y2="140" />
      <line x1="100" y1="140" x2="65.4" y2="120" />
      <line x1="65.4" y1="120" x2="65.4" y2="80" />
      <line x1="65.4" y1="80" x2="100" y2="60" />
      <line x1="100" y1="60" x2="100" y2="140" />
      <line x1="65.4" y1="80" x2="134.6" y2="120" />
      <line x1="134.6" y1="80" x2="65.4" y2="120" />
    </>
  )
}

function BorromeanPath() {
  return (
    <>
      <circle cx="100" cy="78" r="35" />
      <circle cx="122" cy="118" r="35" />
      <circle cx="78" cy="118" r="35" />
    </>
  )
}

const VARIANTS = {
  flower: FlowerPath,
  seed: SeedPath,
  vesica: VesicaPath,
  tripod: TripodPath,
  metatron: MetatronPath,
  borromean: BorromeanPath,
}

export function FOLWatermark({
  variant = 'flower',
  size = 'lg',
  color = '#C75B2A',
  className = '',
  animate = false,
}: FOLWatermarkProps) {
  const px = SIZES[size]
  const opacity = OPACITIES[size]
  const Path = VARIANTS[variant]

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 200 200"
      fill="none"
      stroke={color}
      strokeWidth={size === 'lg' ? 1 : size === 'md' ? 1.5 : 2}
      opacity={opacity}
      className={`pointer-events-none ${animate ? 'animate-fol-spin' : ''} ${className}`}
      aria-hidden="true"
    >
      <Path />
    </svg>
  )
}
