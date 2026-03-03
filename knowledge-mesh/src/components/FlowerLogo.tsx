"use client";

import { domains } from "@/data/domains";

interface Props {
  activeDomain: string | null;
  onSelectDomain: (id: string) => void;
}

export default function FlowerLogo({ activeDomain, onSelectDomain }: Props) {
  const cx = 150, cy = 150, petalRadius = 48, orbitRadius = 62;

  return (
    <svg viewBox="0 0 300 300" className="h-64 w-64 shrink-0 cursor-pointer" aria-label="Knowledge Mesh flower navigation">
      <circle cx={cx} cy={cy} r={22} fill="#1e293b" stroke="#334155" strokeWidth={1} />
      <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="central" fill="#94a3b8" fontSize={8} fontWeight={600}>MESH</text>
      {domains.map((domain, i) => {
        const angle = (2 * Math.PI * i) / domains.length - Math.PI / 2;
        const px = cx + orbitRadius * Math.cos(angle);
        const py = cy + orbitRadius * Math.sin(angle);
        const isActive = activeDomain === domain.id;
        return (
          <g key={domain.id} onClick={() => onSelectDomain(domain.id)} className="transition-transform duration-200" style={{ cursor: "pointer" }}>
            <circle cx={px} cy={py} r={petalRadius} fill={domain.color} opacity={isActive ? 0.95 : activeDomain ? 0.2 : 0.6} className="transition-opacity duration-300" />
            <text x={px} y={py + 1} textAnchor="middle" dominantBaseline="central" fill="white" fontSize={7} fontWeight={500} style={{ pointerEvents: "none" }}>
              {domain.label.length > 14 ? domain.label.slice(0, 12) + "…" : domain.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
