"use client";

interface Props { color: string; size?: number; }

export default function ThemeRing({ color, size = 120 }: Props) {
  const r = size / 2 - 4;
  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={3} opacity={0.5} />
    </svg>
  );
}
