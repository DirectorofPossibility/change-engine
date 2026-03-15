'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Adventure, AdventureNode } from '@/lib/data/adventures'
import { ArrowLeft, RotateCcw, BookOpen, ExternalLink, Sparkles, CheckCircle2, Star } from 'lucide-react'

// ─── SVG Scene Illustrations ─────────────────────────────────────────

function SceneIllustration({ scene, color }: { scene: string; color: string }) {
  const bg = color + '12'
  const mid = color + '30'
  const accent = color

  const scenes: Record<string, React.ReactNode> = {
    neighborhood_evening: (
      <svg viewBox="0 0 400 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
        <rect width="400" height="220" rx="12" fill={bg} />
        {/* Sky gradient */}
        <rect width="400" height="120" rx="12" fill={mid} opacity="0.3" />
        {/* Houses */}
        <rect x="30" y="100" width="60" height="50" rx="3" fill={accent} opacity="0.6" />
        <polygon points="30,100 60,75 90,100" fill={accent} opacity="0.4" />
        <rect x="45" y="120" width="12" height="15" rx="1" fill="white" opacity="0.8" />
        <rect x="65" y="110" width="10" height="10" rx="1" fill="white" opacity="0.6" />
        <rect x="110" y="90" width="70" height="60" rx="3" fill={accent} opacity="0.5" />
        <polygon points="110,90 145,60 180,90" fill={accent} opacity="0.35" />
        <rect x="130" y="110" width="14" height="18" rx="1" fill="white" opacity="0.8" />
        <rect x="150" y="105" width="10" height="10" rx="1" fill="white" opacity="0.6" />
        {/* Trees */}
        <circle cx="210" cy="110" r="20" fill={accent} opacity="0.3" />
        <rect x="208" y="130" width="4" height="20" rx="1" fill={accent} opacity="0.4" />
        <circle cx="250" cy="105" r="15" fill={accent} opacity="0.25" />
        <rect x="248" y="120" width="4" height="18" rx="1" fill={accent} opacity="0.35" />
        {/* Person with phone */}
        <circle cx="310" cy="120" r="10" fill={accent} opacity="0.7" />
        <rect x="305" y="130" width="10" height="25" rx="3" fill={accent} opacity="0.6" />
        <rect x="320" y="128" width="8" height="12" rx="2" fill="white" opacity="0.9" />
        {/* Street */}
        <rect x="0" y="150" width="400" height="70" rx="0" fill={accent} opacity="0.1" />
        <rect x="20" y="175" width="360" height="3" rx="1" fill={accent} opacity="0.15" />
      </svg>
    ),
    city_hall_interior: (
      <svg viewBox="0 0 400 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
        <rect width="400" height="220" rx="12" fill={bg} />
        {/* Grand arch */}
        <path d="M50 200 L50 80 Q200 20 350 80 L350 200" stroke={accent} strokeWidth="3" fill={mid} opacity="0.3" />
        {/* Columns */}
        <rect x="80" y="80" width="12" height="120" rx="2" fill={accent} opacity="0.4" />
        <rect x="140" y="65" width="12" height="135" rx="2" fill={accent} opacity="0.4" />
        <rect x="248" y="65" width="12" height="135" rx="2" fill={accent} opacity="0.4" />
        <rect x="308" y="80" width="12" height="120" rx="2" fill={accent} opacity="0.4" />
        {/* Sign-up sheet */}
        <rect x="170" y="110" width="60" height="80" rx="3" fill="white" opacity="0.9" />
        <rect x="180" y="120" width="40" height="3" rx="1" fill={accent} opacity="0.3" />
        <rect x="180" y="130" width="35" height="3" rx="1" fill={accent} opacity="0.3" />
        <rect x="180" y="140" width="38" height="3" rx="1" fill={accent} opacity="0.3" />
        <rect x="180" y="150" width="30" height="3" rx="1" fill={accent} opacity="0.3" />
        {/* Pen */}
        <rect x="225" y="125" width="3" height="30" rx="1" fill={accent} opacity="0.5" transform="rotate(15 225 125)" />
        {/* Floor */}
        <rect x="0" y="195" width="400" height="25" fill={accent} opacity="0.08" />
      </svg>
    ),
    person_at_laptop: (
      <svg viewBox="0 0 400 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
        <rect width="400" height="220" rx="12" fill={bg} />
        {/* Desk */}
        <rect x="80" y="140" width="240" height="8" rx="2" fill={accent} opacity="0.3" />
        <rect x="90" y="148" width="8" height="52" rx="1" fill={accent} opacity="0.2" />
        <rect x="302" y="148" width="8" height="52" rx="1" fill={accent} opacity="0.2" />
        {/* Laptop */}
        <rect x="150" y="95" width="100" height="45" rx="4" fill={accent} opacity="0.5" />
        <rect x="155" y="100" width="90" height="35" rx="2" fill="white" opacity="0.85" />
        <rect x="135" y="140" width="130" height="5" rx="2" fill={accent} opacity="0.4" />
        {/* Screen content lines */}
        <rect x="165" y="110" width="50" height="3" rx="1" fill={accent} opacity="0.3" />
        <rect x="165" y="118" width="65" height="3" rx="1" fill={accent} opacity="0.2" />
        <rect x="165" y="126" width="40" height="3" rx="1" fill={accent} opacity="0.3" />
        {/* Person */}
        <circle cx="200" cy="60" r="15" fill={accent} opacity="0.6" />
        <rect x="190" y="75" width="20" height="30" rx="5" fill={accent} opacity="0.5" />
        {/* Coffee mug */}
        <rect x="280" y="125" width="14" height="15" rx="3" fill={accent} opacity="0.3" />
        <path d="M294 130 Q302 130 302 138 Q302 140 294 140" stroke={accent} strokeWidth="2" opacity="0.3" fill="none" />
      </svg>
    ),
    phone_notifications: (
      <svg viewBox="0 0 400 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
        <rect width="400" height="220" rx="12" fill={bg} />
        {/* Phone */}
        <rect x="155" y="30" width="90" height="160" rx="12" fill={accent} opacity="0.5" />
        <rect x="160" y="40" width="80" height="135" rx="8" fill="white" opacity="0.85" />
        {/* Notification bubbles */}
        <rect x="170" y="50" width="60" height="20" rx="6" fill={accent} opacity="0.3" />
        <rect x="170" y="78" width="55" height="20" rx="6" fill={accent} opacity="0.25" />
        <rect x="170" y="106" width="62" height="20" rx="6" fill={accent} opacity="0.2" />
        <rect x="170" y="134" width="50" height="20" rx="6" fill={accent} opacity="0.15" />
        {/* Floating notification badges */}
        <circle cx="100" cy="60" r="18" fill={accent} opacity="0.2" />
        <text x="100" y="65" textAnchor="middle" fontSize="12" fill={accent} opacity="0.6">47</text>
        <circle cx="310" cy="80" r="15" fill={accent} opacity="0.15" />
        <text x="310" y="85" textAnchor="middle" fontSize="10" fill={accent} opacity="0.5">♥</text>
        <circle cx="85" cy="130" r="12" fill={accent} opacity="0.15" />
        <circle cx="320" cy="150" r="14" fill={accent} opacity="0.1" />
      </svg>
    ),
    phone_call: (
      <svg viewBox="0 0 400 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
        <rect width="400" height="220" rx="12" fill={bg} />
        {/* Person */}
        <circle cx="200" cy="70" r="22" fill={accent} opacity="0.6" />
        <rect x="185" y="92" width="30" height="45" rx="8" fill={accent} opacity="0.5" />
        {/* Phone at ear */}
        <rect x="225" y="55" width="10" height="30" rx="4" fill={accent} opacity="0.7" />
        {/* Sound waves */}
        <path d="M245 60 Q255 70 245 80" stroke={accent} strokeWidth="2" opacity="0.3" fill="none" />
        <path d="M252 55 Q265 70 252 85" stroke={accent} strokeWidth="2" opacity="0.2" fill="none" />
        <path d="M259 50 Q275 70 259 90" stroke={accent} strokeWidth="2" opacity="0.15" fill="none" />
        {/* Speech bubbles */}
        <rect x="90" y="50" width="70" height="25" rx="8" fill="white" opacity="0.7" />
        <rect x="100" y="58" width="40" height="3" rx="1" fill={accent} opacity="0.3" />
        <rect x="100" y="64" width="30" height="3" rx="1" fill={accent} opacity="0.2" />
      </svg>
    ),
    community_group: (
      <svg viewBox="0 0 400 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
        <rect width="400" height="220" rx="12" fill={bg} />
        {/* People in circle */}
        {[0, 1, 2, 3, 4, 5, 6].map(i => {
          const angle = (i / 7) * Math.PI * 2 - Math.PI / 2
          const cx = 200 + Math.cos(angle) * 70
          const cy = 110 + Math.sin(angle) * 50
          const opacity = 0.4 + (i % 3) * 0.15
          return (
            <g key={i}>
              <circle cx={cx} cy={cy - 12} r={10} fill={accent} opacity={opacity} />
              <rect x={cx - 7} y={cy - 2} width={14} height={20} rx={4} fill={accent} opacity={opacity - 0.1} />
            </g>
          )
        })}
        {/* Connection lines */}
        <circle cx="200" cy="110" r="55" stroke={accent} strokeWidth="1" opacity="0.1" fill="none" strokeDasharray="4 4" />
      </svg>
    ),
    two_people_talking: (
      <svg viewBox="0 0 400 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
        <rect width="400" height="220" rx="12" fill={bg} />
        {/* Person 1 */}
        <circle cx="140" cy="90" r="18" fill={accent} opacity="0.6" />
        <rect x="127" y="108" width="26" height="40" rx="6" fill={accent} opacity="0.5" />
        {/* Person 2 */}
        <circle cx="260" cy="90" r="18" fill={accent} opacity="0.5" />
        <rect x="247" y="108" width="26" height="40" rx="6" fill={accent} opacity="0.4" />
        {/* Speech bubbles between them */}
        <rect x="170" y="60" width="60" height="22" rx="8" fill="white" opacity="0.7" />
        <rect x="180" y="67" width="35" height="3" rx="1" fill={accent} opacity="0.3" />
        <rect x="175" y="100" width="55" height="22" rx="8" fill={accent} opacity="0.15" />
        <rect x="183" y="107" width="30" height="3" rx="1" fill="white" opacity="0.5" />
      </svg>
    ),
    crowd_outside: (
      <svg viewBox="0 0 400 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
        <rect width="400" height="220" rx="12" fill={bg} />
        {/* Building */}
        <rect x="100" y="30" width="200" height="120" rx="4" fill={accent} opacity="0.3" />
        <rect x="175" y="100" width="50" height="50" rx="2" fill={accent} opacity="0.4" />
        {/* Steps */}
        <rect x="120" y="150" width="160" height="8" rx="1" fill={accent} opacity="0.2" />
        <rect x="130" y="158" width="140" height="8" rx="1" fill={accent} opacity="0.15" />
        {/* Crowd of people */}
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => {
          const cx = 80 + i * 30 + (i % 2) * 10
          const cy = 180 + (i % 2) * 10
          return (
            <g key={i}>
              <circle cx={cx} cy={cy - 10} r={7} fill={accent} opacity={0.3 + (i % 3) * 0.1} />
              <rect x={cx - 5} y={cy - 3} width={10} height={15} rx={3} fill={accent} opacity={0.25 + (i % 3) * 0.1} />
            </g>
          )
        })}
        {/* Signs */}
        <rect x="100" y="160" width="3" height="25" fill={accent} opacity="0.3" />
        <rect x="90" y="155" width="22" height="12" rx="2" fill="white" opacity="0.6" />
      </svg>
    ),
    council_chambers: (
      <svg viewBox="0 0 400 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
        <rect width="400" height="220" rx="12" fill={bg} />
        {/* Curved dais */}
        <path d="M60 80 Q200 40 340 80 L340 120 Q200 80 60 120 Z" fill={accent} opacity="0.25" />
        {/* Council member seats */}
        {[0, 1, 2, 3, 4].map(i => {
          const cx = 120 + i * 45
          return (
            <g key={i}>
              <circle cx={cx} cy={55 + Math.abs(i - 2) * 5} r={8} fill={accent} opacity={0.5} />
              <rect x={cx - 5} y={63 + Math.abs(i - 2) * 5} width={10} height={12} rx={3} fill={accent} opacity={0.4} />
            </g>
          )
        })}
        {/* Podium */}
        <rect x="185" y="130" width="30" height="35" rx="3" fill={accent} opacity="0.4" />
        <rect x="180" y="128" width="40" height="5" rx="2" fill={accent} opacity="0.5" />
        {/* Audience seats */}
        {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
          <rect key={i} x={70 + i * 35} y={185} width={25} height={4} rx={2} fill={accent} opacity={0.15} />
        ))}
      </svg>
    ),
    podium_speaking: (
      <svg viewBox="0 0 400 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
        <rect width="400" height="220" rx="12" fill={bg} />
        {/* Podium */}
        <rect x="165" y="100" width="70" height="70" rx="4" fill={accent} opacity="0.4" />
        <rect x="160" y="95" width="80" height="8" rx="3" fill={accent} opacity="0.5" />
        {/* Microphone */}
        <rect x="198" y="80" width="4" height="20" rx="1" fill={accent} opacity="0.6" />
        <circle cx="200" cy="77" r="5" fill={accent} opacity="0.7" />
        {/* Speaker */}
        <circle cx="200" cy="55" r="16" fill={accent} opacity="0.65" />
        <rect x="188" y="71" width="24" height="30" rx="6" fill={accent} opacity="0.55" />
        {/* Sound waves */}
        <path d="M230 50 Q240 55 230 60" stroke={accent} strokeWidth="2" opacity="0.2" fill="none" />
        <path d="M237 45 Q250 55 237 65" stroke={accent} strokeWidth="2" opacity="0.15" fill="none" />
        {/* Audience silhouettes */}
        {[0, 1, 2, 3, 4].map(i => (
          <circle key={i} cx={80 + i * 65} cy={195} r={8} fill={accent} opacity={0.15} />
        ))}
      </svg>
    ),
    handshake: (
      <svg viewBox="0 0 400 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
        <rect width="400" height="220" rx="12" fill={bg} />
        {/* Two hands meeting */}
        <path d="M130 130 L170 110 L185 115 L200 110 L215 115 L230 110 L270 130" stroke={accent} strokeWidth="4" strokeLinecap="round" opacity="0.5" fill="none" />
        {/* Arms */}
        <rect x="80" y="120" width="55" height="14" rx="5" fill={accent} opacity="0.4" transform="rotate(-10 80 127)" />
        <rect x="265" y="120" width="55" height="14" rx="5" fill={accent} opacity="0.4" transform="rotate(10 320 127)" />
        {/* Sparkle effects */}
        <circle cx="200" cy="80" r="4" fill={accent} opacity="0.3" />
        <circle cx="180" cy="70" r="3" fill={accent} opacity="0.2" />
        <circle cx="220" cy="75" r="3" fill={accent} opacity="0.2" />
        <path d="M200 60 L200 55 M195 62 L192 58 M205 62 L208 58" stroke={accent} strokeWidth="2" opacity="0.25" />
      </svg>
    ),
    group_celebration: (
      <svg viewBox="0 0 400 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
        <rect width="400" height="220" rx="12" fill={bg} />
        {/* Confetti dots */}
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => (
          <circle key={i} cx={60 + i * 38} cy={30 + (i % 3) * 20} r={3 + (i % 2) * 2} fill={accent} opacity={0.1 + (i % 3) * 0.08} />
        ))}
        {/* People with arms up */}
        {[0, 1, 2, 3, 4].map(i => {
          const cx = 100 + i * 55
          return (
            <g key={i}>
              <circle cx={cx} cy={110} r={12} fill={accent} opacity={0.4 + (i % 2) * 0.15} />
              <rect x={cx - 8} y={122} width={16} height={28} rx={5} fill={accent} opacity={0.35 + (i % 2) * 0.1} />
              {/* Arms up */}
              <rect x={cx - 18} y={105} width={12} height={4} rx={2} fill={accent} opacity={0.3} transform={`rotate(-30 ${cx - 12} 107)`} />
              <rect x={cx + 6} y={105} width={12} height={4} rx={2} fill={accent} opacity={0.3} transform={`rotate(30 ${cx + 12} 107)`} />
            </g>
          )
        })}
        {/* Ground */}
        <rect x="40" y="165" width="320" height="3" rx="1" fill={accent} opacity="0.1" />
      </svg>
    ),
    walking_home: (
      <svg viewBox="0 0 400 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
        <rect width="400" height="220" rx="12" fill={bg} />
        {/* Moon */}
        <circle cx="320" cy="50" r="20" fill={accent} opacity="0.2" />
        {/* Stars */}
        {[0, 1, 2, 3, 4].map(i => (
          <circle key={i} cx={80 + i * 60} cy={30 + (i % 2) * 15} r={2} fill={accent} opacity={0.15} />
        ))}
        {/* Path */}
        <path d="M50 180 Q200 150 380 180" stroke={accent} strokeWidth="3" opacity="0.15" fill="none" />
        {/* Walking person */}
        <circle cx="200" cy="115" r="14" fill={accent} opacity="0.55" />
        <rect x="192" y="129" width="16" height="30" rx="5" fill={accent} opacity="0.45" />
        {/* Streetlight */}
        <rect x="130" y="90" width="4" height="80" rx="1" fill={accent} opacity="0.2" />
        <circle cx="132" cy="88" r="10" fill={accent} opacity="0.15" />
        <circle cx="132" cy="88" r="20" fill={accent} opacity="0.05" />
      </svg>
    ),
    person_thinking: (
      <svg viewBox="0 0 400 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
        <rect width="400" height="220" rx="12" fill={bg} />
        {/* Person sitting */}
        <circle cx="200" cy="80" r="18" fill={accent} opacity="0.55" />
        <rect x="187" y="98" width="26" height="35" rx="6" fill={accent} opacity="0.45" />
        {/* Chair */}
        <rect x="175" y="133" width="50" height="6" rx="2" fill={accent} opacity="0.2" />
        <rect x="178" y="139" width="6" height="30" rx="1" fill={accent} opacity="0.15" />
        <rect x="216" y="139" width="6" height="30" rx="1" fill={accent} opacity="0.15" />
        {/* Thought bubbles */}
        <circle cx="240" cy="65" r="5" fill={accent} opacity="0.15" />
        <circle cx="255" cy="50" r="8" fill={accent} opacity="0.12" />
        <circle cx="280" cy="40" r="20" fill={accent} opacity="0.1" />
        <text x="280" y="44" textAnchor="middle" fontSize="12" fill={accent} opacity="0.3">?</text>
      </svg>
    ),
    person_writing: (
      <svg viewBox="0 0 400 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
        <rect width="400" height="220" rx="12" fill={bg} />
        {/* Notepad */}
        <rect x="160" y="90" width="80" height="100" rx="4" fill="white" opacity="0.8" />
        <rect x="170" y="105" width="55" height="3" rx="1" fill={accent} opacity="0.2" />
        <rect x="170" y="115" width="45" height="3" rx="1" fill={accent} opacity="0.2" />
        <rect x="170" y="125" width="50" height="3" rx="1" fill={accent} opacity="0.2" />
        <rect x="170" y="135" width="35" height="3" rx="1" fill={accent} opacity="0.2" />
        {/* Pen */}
        <rect x="230" y="120" width="4" height="40" rx="1" fill={accent} opacity="0.5" transform="rotate(20 232 140)" />
        {/* Hand */}
        <circle cx="225" cy="145" r="8" fill={accent} opacity="0.4" />
      </svg>
    ),
    neighborhood_cookout: (
      <svg viewBox="0 0 400 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
        <rect width="400" height="220" rx="12" fill={bg} />
        {/* Grill */}
        <rect x="170" y="100" width="60" height="40" rx="6" fill={accent} opacity="0.4" />
        <rect x="175" y="96" width="50" height="6" rx="2" fill={accent} opacity="0.5" />
        {/* Smoke wisps */}
        <path d="M190 90 Q185 75 190 60" stroke={accent} strokeWidth="2" opacity="0.15" fill="none" />
        <path d="M200 85 Q205 70 200 55" stroke={accent} strokeWidth="2" opacity="0.12" fill="none" />
        <path d="M210 88 Q215 72 210 58" stroke={accent} strokeWidth="2" opacity="0.1" fill="none" />
        {/* Legs */}
        <rect x="180" y="140" width="4" height="30" rx="1" fill={accent} opacity="0.3" />
        <rect x="216" y="140" width="4" height="30" rx="1" fill={accent} opacity="0.3" />
        {/* People around */}
        {[0, 1, 2, 3].map(i => {
          const cx = 70 + i * 90
          const cy = 130 + (i % 2) * 15
          return (
            <g key={i}>
              <circle cx={cx} cy={cy - 15} r={9} fill={accent} opacity={0.3 + i * 0.05} />
              <rect x={cx - 6} y={cy - 6} width={12} height={18} rx={4} fill={accent} opacity={0.25 + i * 0.05} />
            </g>
          )
        })}
        {/* Table */}
        <rect x="280" y="120" width="60" height="4" rx="2" fill={accent} opacity="0.2" />
      </svg>
    ),
    neighborhood_walk: (
      <svg viewBox="0 0 400 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
        <rect width="400" height="220" rx="12" fill={bg} />
        {/* Path */}
        <path d="M30 200 Q100 170 200 175 Q300 180 380 160" stroke={accent} strokeWidth="4" opacity="0.15" fill="none" />
        {/* Buildings varied */}
        <rect x="40" y="90" width="40" height="70" rx="3" fill={accent} opacity="0.3" />
        <rect x="48" y="100" width="10" height="10" rx="1" fill="white" opacity="0.5" />
        <rect x="48" y="120" width="10" height="10" rx="1" fill="white" opacity="0.5" />
        <rect x="110" y="80" width="50" height="80" rx="3" fill={accent} opacity="0.25" />
        <rect x="118" y="95" width="12" height="12" rx="1" fill="white" opacity="0.5" />
        <rect x="138" y="95" width="12" height="12" rx="1" fill="white" opacity="0.5" />
        {/* Tree */}
        <circle cx="210" cy="90" r="22" fill={accent} opacity="0.2" />
        <rect x="208" y="112" width="4" height="25" rx="1" fill={accent} opacity="0.25" />
        {/* Church with cross */}
        <rect x="270" y="85" width="50" height="75" rx="3" fill={accent} opacity="0.3" />
        <rect x="293" y="65" width="4" height="22" rx="1" fill={accent} opacity="0.4" />
        <rect x="286" y="72" width="18" height="4" rx="1" fill={accent} opacity="0.4" />
        {/* Walking person */}
        <circle cx="200" cy="145" r="10" fill={accent} opacity="0.5" />
        <rect x="194" y="155" width="12" height="22" rx="4" fill={accent} opacity="0.4" />
      </svg>
    ),
    porch_conversation: (
      <svg viewBox="0 0 400 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
        <rect width="400" height="220" rx="12" fill={bg} />
        {/* House front */}
        <rect x="80" y="60" width="240" height="130" rx="4" fill={accent} opacity="0.2" />
        <polygon points="80,60 200,15 320,60" fill={accent} opacity="0.15" />
        {/* Porch */}
        <rect x="120" y="150" width="160" height="8" rx="2" fill={accent} opacity="0.25" />
        {/* Door */}
        <rect x="185" y="100" width="30" height="50" rx="3" fill={accent} opacity="0.35" />
        {/* Two people on porch */}
        <circle cx="150" cy="125" r="10" fill={accent} opacity="0.5" />
        <rect x="144" y="135" width="12" height="18" rx="4" fill={accent} opacity="0.4" />
        <circle cx="250" cy="125" r="10" fill={accent} opacity="0.45" />
        <rect x="244" y="135" width="12" height="18" rx="4" fill={accent} opacity="0.35" />
        {/* Glass/drink */}
        <rect x="195" y="130" width="10" height="14" rx="2" fill="white" opacity="0.5" />
      </svg>
    ),
    map_with_pins: (
      <svg viewBox="0 0 400 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
        <rect width="400" height="220" rx="12" fill={bg} />
        {/* Map */}
        <rect x="60" y="30" width="280" height="160" rx="6" fill="white" opacity="0.7" />
        {/* Streets */}
        <rect x="60" y="80" width="280" height="2" rx="1" fill={accent} opacity="0.1" />
        <rect x="60" y="120" width="280" height="2" rx="1" fill={accent} opacity="0.1" />
        <rect x="150" y="30" width="2" height="160" rx="1" fill={accent} opacity="0.1" />
        <rect x="250" y="30" width="2" height="160" rx="1" fill={accent} opacity="0.1" />
        {/* Pins */}
        {[[110, 60], [190, 70], [280, 55], [130, 110], [220, 100], [300, 130], [170, 150]].map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r={6} fill={accent} opacity={0.4 + (i % 3) * 0.1} />
            <circle cx={x} cy={y} r={3} fill="white" opacity="0.8" />
          </g>
        ))}
      </svg>
    ),
    clinic_interior: (
      <svg viewBox="0 0 400 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
        <rect width="400" height="220" rx="12" fill={bg} />
        {/* Cross symbol */}
        <rect x="185" y="30" width="30" height="8" rx="2" fill={accent} opacity="0.4" />
        <rect x="196" y="20" width="8" height="28" rx="2" fill={accent} opacity="0.4" />
        {/* Reception desk */}
        <rect x="100" y="100" width="200" height="12" rx="3" fill={accent} opacity="0.3" />
        <rect x="110" y="112" width="180" height="40" rx="3" fill={accent} opacity="0.2" />
        {/* Person behind desk */}
        <circle cx="200" cy="80" r="12" fill={accent} opacity="0.5" />
        <rect x="192" y="92" width="16" height="12" rx="4" fill={accent} opacity="0.4" />
        {/* Chairs in waiting area */}
        {[0, 1, 2].map(i => (
          <rect key={i} x={120 + i * 60} y={170} width={35} height={6} rx={2} fill={accent} opacity={0.15} />
        ))}
        {/* Flyers on counter */}
        <rect x="260" y="90" width="18" height="12" rx="1" fill="white" opacity="0.6" />
        <rect x="240" y="92" width="15" height="10" rx="1" fill="white" opacity="0.5" />
      </svg>
    ),
    community_center: (
      <svg viewBox="0 0 400 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
        <rect width="400" height="220" rx="12" fill={bg} />
        {/* Building */}
        <rect x="80" y="50" width="240" height="120" rx="4" fill={accent} opacity="0.25" />
        {/* Banner */}
        <rect x="130" y="60" width="140" height="20" rx="3" fill={accent} opacity="0.35" />
        <rect x="145" y="67" width="110" height="3" rx="1" fill="white" opacity="0.6" />
        {/* Windows */}
        <rect x="100" y="95" width="25" height="25" rx="2" fill="white" opacity="0.5" />
        <rect x="270" y="95" width="25" height="25" rx="2" fill="white" opacity="0.5" />
        {/* Door */}
        <rect x="185" y="105" width="30" height="65" rx="3" fill={accent} opacity="0.4" />
        {/* Garden boxes */}
        <rect x="80" y="175" width="40" height="12" rx="2" fill={accent} opacity="0.2" />
        <circle cx="90" cy="170" r="5" fill={accent} opacity="0.15" />
        <circle cx="105" cy="172" r="4" fill={accent} opacity="0.12" />
      </svg>
    ),
    meeting_room: (
      <svg viewBox="0 0 400 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
        <rect width="400" height="220" rx="12" fill={bg} />
        {/* Table */}
        <ellipse cx="200" cy="130" rx="120" ry="35" fill={accent} opacity="0.2" />
        {/* Chairs around table */}
        {[0, 1, 2, 3, 4, 5].map(i => {
          const angle = (i / 6) * Math.PI * 2 - Math.PI / 2
          const cx = 200 + Math.cos(angle) * 100
          const cy = 110 + Math.sin(angle) * 30
          return (
            <g key={i}>
              <circle cx={cx} cy={cy - 8} r={8} fill={accent} opacity={0.35 + (i % 2) * 0.1} />
              <rect x={cx - 5} y={cy} width={10} height={14} rx={3} fill={accent} opacity={0.3} />
            </g>
          )
        })}
        {/* Whiteboard */}
        <rect x="150" y="30" width="100" height="50" rx="3" fill="white" opacity="0.6" />
        <rect x="160" y="42" width="60" height="3" rx="1" fill={accent} opacity="0.2" />
        <rect x="160" y="52" width="50" height="3" rx="1" fill={accent} opacity="0.15" />
        <rect x="160" y="62" width="55" height="3" rx="1" fill={accent} opacity="0.15" />
      </svg>
    ),
    hallway_meeting: (
      <svg viewBox="0 0 400 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
        <rect width="400" height="220" rx="12" fill={bg} />
        {/* Hallway walls */}
        <rect x="0" y="0" width="400" height="220" fill={mid} opacity="0.15" />
        <rect x="30" y="40" width="340" height="140" fill={bg} />
        {/* Doors */}
        <rect x="50" y="50" width="30" height="60" rx="2" fill={accent} opacity="0.25" />
        <rect x="320" y="50" width="30" height="60" rx="2" fill={accent} opacity="0.25" />
        {/* Group of people */}
        {[0, 1, 2, 3, 4].map(i => {
          const cx = 140 + i * 35
          return (
            <g key={i}>
              <circle cx={cx} cy={110} r={10} fill={accent} opacity={0.35 + (i % 2) * 0.1} />
              <rect x={cx - 7} y={120} width={14} height={22} rx={4} fill={accent} opacity={0.3} />
            </g>
          )
        })}
      </svg>
    ),
    group_entering: (
      <svg viewBox="0 0 400 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
        <rect width="400" height="220" rx="12" fill={bg} />
        {/* Door frame */}
        <rect x="160" y="30" width="80" height="140" rx="4" fill={accent} opacity="0.3" />
        <rect x="165" y="35" width="70" height="130" fill={bg} />
        {/* Light from inside */}
        <rect x="165" y="35" width="70" height="130" fill={accent} opacity="0.05" />
        {/* People walking in */}
        {[0, 1, 2, 3].map(i => {
          const cx = 180 + i * 15
          const cy = 120 + i * 8
          return (
            <g key={i}>
              <circle cx={cx} cy={cy - 12} r={8} fill={accent} opacity={0.5 - i * 0.08} />
              <rect x={cx - 5} y={cy - 4} width={10} height={18} rx={3} fill={accent} opacity={0.4 - i * 0.06} />
            </g>
          )
        })}
      </svg>
    ),
    park_scene: (
      <svg viewBox="0 0 400 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
        <rect width="400" height="220" rx="12" fill={bg} />
        {/* Trees */}
        <circle cx="80" cy="80" r="30" fill={accent} opacity="0.2" />
        <rect x="78" y="110" width="4" height="35" rx="1" fill={accent} opacity="0.25" />
        <circle cx="320" cy="70" r="35" fill={accent} opacity="0.18" />
        <rect x="318" y="105" width="4" height="40" rx="1" fill={accent} opacity="0.22" />
        {/* Path */}
        <path d="M0 180 Q100 160 200 170 Q300 180 400 165" stroke={accent} strokeWidth="3" opacity="0.12" fill="none" />
        {/* Bench */}
        <rect x="170" y="140" width="60" height="5" rx="2" fill={accent} opacity="0.3" />
        <rect x="175" y="145" width="5" height="15" rx="1" fill={accent} opacity="0.2" />
        <rect x="220" y="145" width="5" height="15" rx="1" fill={accent} opacity="0.2" />
        {/* Sun */}
        <circle cx="340" cy="40" r="15" fill={accent} opacity="0.15" />
        {/* Birds */}
        <path d="M150 45 Q155 40 160 45" stroke={accent} strokeWidth="1.5" opacity="0.2" fill="none" />
        <path d="M170 40 Q175 35 180 40" stroke={accent} strokeWidth="1.5" opacity="0.2" fill="none" />
      </svg>
    ),
    weather_alert: (
      <svg viewBox="0 0 400 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
        <rect width="400" height="220" rx="12" fill={bg} />
        {/* Storm cloud */}
        <circle cx="160" cy="60" r="30" fill={accent} opacity="0.3" />
        <circle cx="200" cy="50" r="35" fill={accent} opacity="0.35" />
        <circle cx="240" cy="60" r="28" fill={accent} opacity="0.3" />
        <rect x="135" y="55" width="110" height="30" rx="10" fill={accent} opacity="0.3" />
        {/* Rain */}
        {[0, 1, 2, 3, 4, 5].map(i => (
          <rect key={i} x={155 + i * 20} y={95 + (i % 2) * 10} width="2" height="15" rx="1" fill={accent} opacity={0.2} />
        ))}
        {/* Lightning bolt */}
        <path d="M200 85 L195 110 L205 108 L198 135" stroke={accent} strokeWidth="3" opacity="0.5" fill="none" strokeLinecap="round" />
        {/* Alert triangle */}
        <path d="M185 160 L200 140 L215 160 Z" fill={accent} opacity="0.4" />
        <text x="200" y="157" textAnchor="middle" fontSize="14" fontWeight="bold" fill="white" opacity="0.9">!</text>
      </svg>
    ),
    emergency_supplies: (
      <svg viewBox="0 0 400 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
        <rect width="400" height="220" rx="12" fill={bg} />
        {/* Box/bag */}
        <rect x="140" y="70" width="120" height="90" rx="6" fill={accent} opacity="0.3" />
        <rect x="140" y="70" width="120" height="15" rx="4" fill={accent} opacity="0.4" />
        {/* Cross on bag */}
        <rect x="190" y="100" width="20" height="6" rx="1" fill="white" opacity="0.6" />
        <rect x="197" y="93" width="6" height="20" rx="1" fill="white" opacity="0.6" />
        {/* Water bottles */}
        <rect x="80" y="120" width="15" height="35" rx="4" fill={accent} opacity="0.25" />
        <rect x="100" y="125" width="15" height="30" rx="4" fill={accent} opacity="0.2" />
        {/* Flashlight */}
        <rect x="290" y="110" width="30" height="12" rx="3" fill={accent} opacity="0.3" />
        <circle cx="325" cy="116" r="6" fill={accent} opacity="0.2" />
        {/* Checklist */}
        <rect x="285" y="140" width="50" height="40" rx="3" fill="white" opacity="0.6" />
        <rect x="295" y="150" width="25" height="3" rx="1" fill={accent} opacity="0.2" />
        <rect x="295" y="158" width="30" height="3" rx="1" fill={accent} opacity="0.2" />
        <rect x="295" y="166" width="20" height="3" rx="1" fill={accent} opacity="0.2" />
      </svg>
    ),
    door_knock: (
      <svg viewBox="0 0 400 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
        <rect width="400" height="220" rx="12" fill={bg} />
        {/* Door */}
        <rect x="150" y="30" width="100" height="160" rx="4" fill={accent} opacity="0.35" />
        {/* Door handle */}
        <circle cx="235" cy="115" r="5" fill={accent} opacity="0.5" />
        {/* Knock lines */}
        <path d="M260 90 L270 85" stroke={accent} strokeWidth="2" opacity="0.3" />
        <path d="M265 100 L278 97" stroke={accent} strokeWidth="2" opacity="0.25" />
        <path d="M262 110 L275 110" stroke={accent} strokeWidth="2" opacity="0.2" />
        {/* Person at door */}
        <circle cx="120" cy="100" r="14" fill={accent} opacity="0.5" />
        <rect x="110" y="114" width="20" height="30" rx="5" fill={accent} opacity="0.4" />
        {/* Hand reaching */}
        <rect x="130" y="108" width="20" height="6" rx="3" fill={accent} opacity="0.35" />
      </svg>
    ),
    sunrise: (
      <svg viewBox="0 0 400 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
        <rect width="400" height="220" rx="12" fill={bg} />
        {/* Sun */}
        <circle cx="200" cy="130" r="40" fill={accent} opacity="0.2" />
        <circle cx="200" cy="130" r="25" fill={accent} opacity="0.3" />
        {/* Rays */}
        {[0, 1, 2, 3, 4, 5, 6].map(i => {
          const angle = (i / 7) * Math.PI - Math.PI
          const x1 = 200 + Math.cos(angle) * 50
          const y1 = 130 + Math.sin(angle) * 50
          const x2 = 200 + Math.cos(angle) * 75
          const y2 = 130 + Math.sin(angle) * 75
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={accent} strokeWidth="2" opacity="0.15" />
        })}
        {/* Horizon */}
        <rect x="0" y="140" width="400" height="80" fill={accent} opacity="0.08" />
        <rect x="0" y="140" width="400" height="3" rx="1" fill={accent} opacity="0.15" />
        {/* Houses silhouette */}
        <rect x="50" y="125" width="30" height="20" rx="2" fill={accent} opacity="0.15" />
        <rect x="90" y="118" width="25" height="27" rx="2" fill={accent} opacity="0.12" />
        <rect x="280" y="120" width="35" height="25" rx="2" fill={accent} opacity="0.12" />
        <rect x="325" y="115" width="25" height="30" rx="2" fill={accent} opacity="0.15" />
      </svg>
    ),
    crowd_cheering: (
      <svg viewBox="0 0 400 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
        <rect width="400" height="220" rx="12" fill={bg} />
        {/* Confetti */}
        {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
          <rect key={i} x={50 + i * 45} y={20 + (i % 3) * 15} width={6} height={6} rx={1} fill={accent} opacity={0.1 + (i % 3) * 0.06} transform={`rotate(${i * 30} ${53 + i * 45} ${23 + (i % 3) * 15})`} />
        ))}
        {/* People with arms raised */}
        {[0, 1, 2, 3, 4, 5, 6].map(i => {
          const cx = 65 + i * 45
          const cy = 130 + (i % 2) * 10
          return (
            <g key={i}>
              <circle cx={cx} cy={cy - 15} r={10} fill={accent} opacity={0.35 + (i % 3) * 0.1} />
              <rect x={cx - 7} y={cy - 5} width={14} height={25} rx={4} fill={accent} opacity={0.3 + (i % 3) * 0.08} />
              <rect x={cx - 15} y={cy - 18} width={10} height={3} rx={1} fill={accent} opacity={0.2} transform={`rotate(-40 ${cx - 10} ${cy - 17})`} />
              <rect x={cx + 5} y={cy - 18} width={10} height={3} rx={1} fill={accent} opacity={0.2} transform={`rotate(40 ${cx + 10} ${cy - 17})`} />
            </g>
          )
        })}
      </svg>
    ),
  }

  // Default fallback
  const fallback = (
    <svg viewBox="0 0 400 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
      <rect width="400" height="220" rx="12" fill={bg} />
      <circle cx="200" cy="100" r="40" fill={accent} opacity="0.15" />
      <circle cx="200" cy="100" r="25" fill={accent} opacity="0.1" />
    </svg>
  )

  return scenes[scene] || fallback
}

// ─── Adventure Engine Component ──────────────────────────────────────

export function AdventureEngine({ adventure }: { adventure: Adventure }) {
  const [currentNodeId, setCurrentNodeId] = useState(adventure.startNode)
  const [history, setHistory] = useState<string[]>([])
  const [stats, setStats] = useState({ civic: 0, community: 0, knowledge: 0 })
  const [transitioning, setTransitioning] = useState(false)

  const node = adventure.nodes[currentNodeId]
  if (!node) return null

  function handleChoice(choice: typeof node.choices[0]) {
    setTransitioning(true)
    if (choice.stat) {
      const key = choice.stat.replace('+', '') as keyof typeof stats
      setStats(prev => ({ ...prev, [key]: prev[key] + 1 }))
    }
    setTimeout(() => {
      setHistory(prev => [...prev, currentNodeId])
      setCurrentNodeId(choice.next)
      setTransitioning(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 300)
  }

  function handleBack() {
    if (history.length === 0) return
    const prev = history[history.length - 1]
    setHistory(h => h.slice(0, -1))
    setCurrentNodeId(prev)
  }

  function handleRestart() {
    setHistory([])
    setCurrentNodeId(adventure.startNode)
    setStats({ civic: 0, community: 0, knowledge: 0 })
  }

  const totalStats = stats.civic + stats.community + stats.knowledge
  const progress = history.length

  return (
    <div className={`transition-opacity duration-300 ${transitioning ? 'opacity-40' : 'opacity-100'}`}>
      {/* Progress bar */}
      <div className="flex items-center gap-3 mb-4">
        {history.length > 0 && (
          <button onClick={handleBack} className="flex items-center gap-1 text-xs text-brand-muted hover:text-brand-accent transition-colors">
            <ArrowLeft size={14} /> Back
          </button>
        )}
        <div className="flex-1 h-1.5 bg-brand-bg rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min((progress / 8) * 100, 100)}%`, backgroundColor: adventure.color }}
          />
        </div>
        <span className="text-xs font-mono text-brand-muted">Step {progress + 1}</span>
      </div>

      {/* Scene illustration */}
      <div className=" overflow-hidden mb-5 border border-brand-border">
        <SceneIllustration scene={node.scene} color={node.color || adventure.color} />
      </div>

      {/* Story text */}
      <div className="bg-white border border-brand-border p-6">
        <h2 className="font-display text-xl font-bold text-brand-text mb-3">{node.title}</h2>
        <p className="text-sm text-brand-muted leading-relaxed whitespace-pre-line">{node.text}</p>

        {/* Factoid */}
        {node.factoid && (
          <div className="mt-4 p-3 bg-brand-bg border border-brand-border">
            <div className="flex items-start gap-2">
              <BookOpen size={14} className="text-brand-accent flex-shrink-0 mt-0.5" />
              <p className="text-xs text-brand-muted leading-relaxed">{node.factoid}</p>
            </div>
          </div>
        )}

        {/* Learn more link */}
        {node.learnMore && (
          <Link
            href={node.learnMore.href}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium hover:underline"
            style={{ color: adventure.color }}
          >
            <ExternalLink size={12} /> {node.learnMore.label}
          </Link>
        )}
      </div>

      {/* Choices or Ending */}
      {node.ending ? (
        <div className="mt-5">
          {/* Ending badge */}
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-brand-border bg-white">
              {node.endingType === 'great' ? <Star size={16} style={{ color: adventure.color }} /> : <CheckCircle2 size={16} style={{ color: adventure.color }} />}
              <span className="text-sm font-display font-bold text-brand-text">
                {node.endingType === 'great' ? 'Adventure Complete!' : node.endingType === 'good' ? 'Well Done' : 'Journey Complete'}
              </span>
            </div>
          </div>

          {/* Stats summary */}
          {totalStats > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              {[
                { key: 'civic', label: 'Civic Action', emoji: '🏛' },
                { key: 'community', label: 'Community', emoji: '🤝' },
                { key: 'knowledge', label: 'Knowledge', emoji: '📚' },
              ].map(s => (
                <div key={s.key} className="bg-white border border-brand-border p-3 text-center">
                  <p className="text-lg mb-1">{s.emoji}</p>
                  <p className="font-display font-bold text-brand-text">{stats[s.key as keyof typeof stats]}</p>
                  <p className="text-xs font-mono text-brand-muted uppercase tracking-wider">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Restart / More adventures */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleRestart}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-brand-border bg-white text-sm font-medium text-brand-text hover:border-ink transition-all"
             
            >
              <RotateCcw size={14} /> Try a Different Path
            </button>
            <Link
              href="/adventures"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white transition-all hover:opacity-90"
              style={{ backgroundColor: adventure.color }}
            >
              <Sparkles size={14} /> More Adventures
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {node.choices.map(function (choice, i) {
            return (
              <button
                key={i}
                onClick={() => handleChoice(choice)}
                className="w-full text-left px-5 py-4 border border-brand-border bg-white hover:border-ink hover:translate-y-[-1px] transition-all group"
               
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                    style={{ backgroundColor: adventure.color }}
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                  <span className="text-sm font-medium text-brand-text group-hover:text-brand-accent transition-colors">
                    {choice.text}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
