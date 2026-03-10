'use client'

import { GradientFOL } from './GradientFOL'

/**
 * Animated gradient FOL background for server-component heroes.
 * Renders two FOL layers — a large full variant and a smaller seed variant.
 */
export function HeroFOLBackground() {
  return (
    <>
      <div
        className="absolute pointer-events-none z-0"
        style={{ width: '800px', height: '800px', top: '-120px', right: '-160px', opacity: 0.08 }}
      >
        <GradientFOL variant="full" spinDur={90} colorDur={12} />
      </div>
      <div
        className="absolute pointer-events-none z-0"
        style={{ width: '400px', height: '400px', bottom: '-80px', left: '-80px', opacity: 0.05 }}
      >
        <GradientFOL variant="seed" spinDur={120} colorDur={16} />
      </div>
    </>
  )
}
