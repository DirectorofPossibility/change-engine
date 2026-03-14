'use client'

import { useRef, useCallback } from 'react'
import Image from 'next/image'
import { Geo, GEO_MAP } from '@/components/geo/sacred'
import { Download } from 'lucide-react'

const GEO_TYPES = Object.keys(GEO_MAP)

const LABELS: Record<string, string> = {
  vesica_piscis: 'Vesica Piscis',
  flower_of_life: 'Flower of Life',
  compass_rose: 'Compass Rose',
  nested_circles: 'Nested Circles',
  outward_spiral: 'Outward Spiral',
  hub_and_spokes: 'Hub & Spokes',
  six_petal_rose: 'Six-Petal Rose',
  torus: 'Torus',
  seed_of_life: 'Seed of Life',
  hex_grid: 'Hex Grid',
  concentric_rings: 'Concentric Rings',
  golden_spiral: 'Golden Spiral',
  metatron_cube: 'Metatron\'s Cube',
}

const STATIC_SVGS = [
  { file: 'flower-full.svg', label: 'Flower of Life (Full)' },
  { file: 'flower-white.svg', label: 'Flower of Life (White)' },
  { file: 'seed-of-life.svg', label: 'Seed of Life' },
  { file: 'fruit-of-life.svg', label: 'Fruit of Life' },
  { file: 'metatrons-cube.svg', label: 'Metatron\'s Cube' },
  { file: 'tree-of-life.svg', label: 'Tree of Life' },
  { file: 'vesica-piscis.svg', label: 'Vesica Piscis' },
  { file: 'genesis.svg', label: 'Genesis Pattern' },
  { file: 'tripod-of-life.svg', label: 'Tripod of Life' },
]

const BRAND_COLOR = '#C75B2A'
const RENDER_SIZE = 2048

function downloadPng(svgEl: SVGElement | HTMLImageElement, filename: string, size: number) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  if (svgEl instanceof SVGElement) {
    const svgData = new XMLSerializer().serializeToString(svgEl)
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const img = new window.Image()
    img.onload = function () {
      ctx.drawImage(img, 0, 0, size, size)
      URL.revokeObjectURL(url)
      const a = document.createElement('a')
      a.download = filename + '.png'
      a.href = canvas.toDataURL('image/png')
      a.click()
    }
    img.src = url
  }
}

function downloadFromUrl(svgUrl: string, filename: string, size: number) {
  fetch(svgUrl)
    .then(function (r) { return r.text() })
    .then(function (svgText) {
      const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const img = new window.Image()
      img.onload = function () {
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.drawImage(img, 0, 0, size, size)
        URL.revokeObjectURL(url)
        const a = document.createElement('a')
        a.download = filename + '.png'
        a.href = canvas.toDataURL('image/png')
        a.click()
      }
      img.src = url
    })
}

function GeoCard({ type }: { type: string }) {
  const svgRef = useRef<HTMLDivElement>(null)

  const handleDownload = useCallback(function () {
    if (!svgRef.current) return
    const svg = svgRef.current.querySelector('svg')
    if (!svg) return
    downloadPng(svg, 'change-engine-' + type, RENDER_SIZE)
  }, [type])

  return (
    <div className="bg-white border p-6 group" style={{ borderColor: '#E2DDD5' }}>
      <div ref={svgRef} className="w-full aspect-square flex items-center justify-center p-4 mb-4" style={{ background: '#FAF9F6' }}>
        <Geo type={type} color={BRAND_COLOR} size={280} opacity={0.85} />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[14px] font-bold" style={{ color: '#2D2D2A' }}>{LABELS[type] || type}</h3>
          <p className="text-[11px]" style={{ color: '#9B9590' }}>2048 &times; 2048 PNG</p>
        </div>
        <button
          onClick={handleDownload}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold border transition-all hover:shadow-sm"
          style={{ color: BRAND_COLOR, borderColor: BRAND_COLOR }}
        >
          <Download size={12} /> PNG
        </button>
      </div>
    </div>
  )
}

function StaticSvgCard({ file, label }: { file: string; label: string }) {
  const handleDownload = useCallback(function () {
    downloadFromUrl('/images/fol/' + file, 'change-engine-' + file.replace('.svg', ''), RENDER_SIZE)
  }, [file])

  const isWhite = file === 'flower-white.svg'

  return (
    <div className="bg-white border p-6 group" style={{ borderColor: '#E2DDD5' }}>
      <div
        className="w-full aspect-square flex items-center justify-center p-6 mb-4"
        style={{ background: isWhite ? '#1a1a2e' : '#FAF9F6' }}
      >
        <Image src={'/images/fol/' + file} alt={label} width={280} height={280} className="w-full h-full object-contain" />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[14px] font-bold" style={{ color: '#2D2D2A' }}>{label}</h3>
          <p className="text-[11px]" style={{ color: '#9B9590' }}>2048 &times; 2048 PNG</p>
        </div>
        <button
          onClick={handleDownload}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold border transition-all hover:shadow-sm"
          style={{ color: BRAND_COLOR, borderColor: BRAND_COLOR }}
        >
          <Download size={12} /> PNG
        </button>
      </div>
    </div>
  )
}

export default function SacredGeometryDownloads() {
  function downloadAll() {
    // Download all component-based geometries
    GEO_TYPES.forEach(function (type, i) {
      setTimeout(function () {
        const container = document.getElementById('geo-' + type)
        if (!container) return
        const svg = container.querySelector('svg')
        if (!svg) return
        downloadPng(svg, 'change-engine-' + type, RENDER_SIZE)
      }, i * 400)
    })
    // Download all static SVGs
    STATIC_SVGS.forEach(function (s, i) {
      setTimeout(function () {
        downloadFromUrl('/images/fol/' + s.file, 'change-engine-' + s.file.replace('.svg', ''), RENDER_SIZE)
      }, (GEO_TYPES.length + i) * 400)
    })
  }

  return (
    <div className="min-h-screen" style={{ background: '#FAF9F6' }}>
      {/* Header */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(170deg, #F0EDE6 0%, #E8E4DB 40%, #DDD8CE 100%)' }}>
        <div className="max-w-[1060px] mx-auto px-6 py-12">
          <h1 className="font-serif text-[clamp(2rem,4vw,3rem)] leading-tight mb-3" style={{ color: '#2D2D2A' }}>
            Sacred Geometry Collection
          </h1>
          <p className="text-[15px] max-w-xl mb-6" style={{ color: '#6B6560' }}>
            All 22 sacred geometry patterns from the Change Engine design system. Each downloads as a high-resolution 2048&times;2048 PNG.
          </p>
          <button
            onClick={downloadAll}
            className="inline-flex items-center gap-2 px-6 py-3 text-[14px] font-bold text-white transition-all hover:shadow-lg"
            style={{ background: BRAND_COLOR }}
          >
            <Download size={16} /> Download All ({GEO_TYPES.length + STATIC_SVGS.length} PNGs)
          </button>
        </div>
      </section>

      <div className="max-w-[1060px] mx-auto px-6 py-10">
        {/* Component-based geometries */}
        <h2 className="font-serif text-2xl mb-1" style={{ color: '#2D2D2A' }}>Focus Area Instruments</h2>
        <p className="text-[13px] mb-6" style={{ color: '#9B9590' }}>13 programmatic sacred geometry patterns used for focus areas and themes</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {GEO_TYPES.map(function (type) {
            return (
              <div key={type} id={'geo-' + type}>
                <GeoCard type={type} />
              </div>
            )
          })}
        </div>

        <hr className="border-0 h-px mb-10" style={{ background: '#E2DDD5' }} />

        {/* Static SVG assets */}
        <h2 className="font-serif text-2xl mb-1" style={{ color: '#2D2D2A' }}>Brand SVG Collection</h2>
        <p className="text-[13px] mb-6" style={{ color: '#9B9590' }}>9 hand-crafted SVG patterns in the Change Engine brand color</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {STATIC_SVGS.map(function (s) {
            return <StaticSvgCard key={s.file} file={s.file} label={s.label} />
          })}
        </div>
      </div>
    </div>
  )
}
