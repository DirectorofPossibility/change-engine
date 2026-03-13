/**
 * Shared color manipulation helpers.
 * Used by mastheads and theme-colored sections.
 */

/** Darken a hex color to ~25% brightness */
export function darken(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `#${Math.max(0, Math.floor(r * 0.25)).toString(16).padStart(2, '0')}${Math.max(0, Math.floor(g * 0.25)).toString(16).padStart(2, '0')}${Math.max(0, Math.floor(b * 0.25)).toString(16).padStart(2, '0')}`
}

/** Lighten a hex color by ~55% toward white */
export function lighten(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `#${Math.min(255, Math.floor(r + (255 - r) * 0.55)).toString(16).padStart(2, '0')}${Math.min(255, Math.floor(g + (255 - g) * 0.55)).toString(16).padStart(2, '0')}${Math.min(255, Math.floor(b + (255 - b) * 0.55)).toString(16).padStart(2, '0')}`
}
