"use client"
import { useState, useMemo, useEffect, useCallback, useRef } from "react"

/* ── API config ── */
const API = process.env.NEXT_PUBLIC_SUPABASE_URL + "/rest/v1"
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const HD = { apikey: KEY, Authorization: "Bearer " + KEY }

/* ── Palette ── */
const C = {
  // Galaxy dark theme
  void: "#06060F",
  deep: "#0C0C1E",
  nebula: "#12122A",
  ring: "rgba(255,255,255,0.04)",
  ringHi: "rgba(255,255,255,0.08)",
  star: "rgba(255,255,255,0.5)",
  starDim: "rgba(255,255,255,0.15)",
  label: "rgba(255,255,255,0.55)",
  labelHi: "rgba(255,255,255,0.9)",
  // Dashboard light theme
  bg: "#FAFAF7", sf: "#FFFFFF", alt: "#F5F3EE",
  bd: "#E8E4DB", tx: "#2D2A26", t2: "#6B665C", t3: "#9E9789",
  ac: "#C75B2A", al: "#E8885A",
}

/* ── Pathway definitions ── */
const PW: Record<string, { name: string; color: string; short: string; slug: string }> = {
  health:       { name: "Our Health",        color: "#e53e3e", short: "Health",       slug: "our-health" },
  families:     { name: "Our Families",      color: "#dd6b20", short: "Families",     slug: "our-families" },
  neighborhood: { name: "Our Neighborhood",  color: "#d69e2e", short: "Neighborhood", slug: "our-neighborhood" },
  voice:        { name: "Our Voice",         color: "#38a169", short: "Voice",        slug: "our-voice" },
  money:        { name: "Our Money",         color: "#3182ce", short: "Money",        slug: "our-money" },
  planet:       { name: "Our Planet",        color: "#319795", short: "Planet",       slug: "our-planet" },
  bigger_we:    { name: "The Bigger We",     color: "#805ad5", short: "Bigger We",    slug: "the-bigger-we" },
}
const PW_KEYS = Object.keys(PW)

/* ── Geographic levels ── */
const GEO = [
  { id: "city",          name: "City of Houston",  short: "Houston",    color: "#FFD166", ring: 0.22 },
  { id: "county",        name: "Harris County",    short: "Harris Co.", color: "#F4845F", ring: 0.38 },
  { id: "metro",         name: "Greater Houston",  short: "Metro",      color: "#EF476F", ring: 0.54 },
  { id: "state",         name: "State of Texas",   short: "Texas",      color: "#06D6A0", ring: 0.70 },
  { id: "federal",       name: "Federal",          short: "Federal",    color: "#118AB2", ring: 0.84 },
  { id: "international", name: "International",    short: "Intl",       color: "#9B5DE5", ring: 0.96 },
]
const GM: Record<string, typeof GEO[0]> = Object.fromEntries(GEO.map(g => [g.id, g]))

/* ── Types ── */
interface Foundation {
  id: string; name: string; mission?: string; type?: string; geo_level: string
  assets?: string; annual_giving?: string; website_display?: string; website_url?: string
  address?: string; city?: string; state_code?: string; zip_code?: string
  phone?: string; email?: string; founded_year?: number; verification_status: string
  last_verified_at?: string; last_updated_at?: string; source_state?: string; org_id?: string
  last_people_sync?: string
  ppl: Person[]; pws: string[]; fas: string[]
}
interface Person { foundation_id: string; name: string; role: string; role_type: string }

/* ── Helpers ── */
function ago(d?: string) {
  if (!d) return "never"
  const ms = Date.now() - new Date(d).getTime()
  const m = Math.floor(ms / 60000), h = Math.floor(m / 60), dy = Math.floor(h / 24)
  if (dy > 0) return dy + "d ago"
  if (h > 0) return h + "h ago"
  return m + "m ago"
}

function parseAssets(s?: string): number {
  if (!s) return 0
  const m = s.match(/([\d.]+)/)
  if (!m) return 0
  const n = parseFloat(m[1])
  if (s.includes("B")) return n * 1000
  return n // assume M
}

function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function fmtMoney(n: number): string {
  if (n >= 1000) return "$" + (n / 1000).toFixed(1) + "T"
  if (n >= 1) return "$" + n.toFixed(0) + "B"
  return "$" + (n * 1000).toFixed(0) + "M"
}

/* ── Galaxy star position calculator ── */
function computeGalaxyPositions(
  foundations: Foundation[],
  selectedPw: string | null,
  selectedId: string | null,
  vw: number,
  vh: number,
) {
  const cx = vw / 2, cy = vh / 2
  const maxR = Math.min(vw, vh) * 0.46

  return foundations.map((f) => {
    const geo = GM[f.geo_level] || GEO[0]
    const primaryPw = f.pws[0] || PW_KEYS[hashStr(f.id) % PW_KEYS.length]
    const pwIdx = PW_KEYS.indexOf(primaryPw)
    const sectorAngle = (2 * Math.PI) / PW_KEYS.length
    const baseAngle = sectorAngle * pwIdx - Math.PI / 2
    // Spread within the sector
    const seed = hashStr(f.id)
    const angleOffset = ((seed % 1000) / 1000 - 0.5) * sectorAngle * 0.7
    const angle = baseAngle + angleOffset
    // Radial distance from geo level ring
    const ringR = geo.ring * maxR
    const radialJitter = ((seed % 500) / 500 - 0.5) * maxR * 0.08
    const r = ringR + radialJitter

    const x = cx + r * Math.cos(angle)
    const y = cy + r * Math.sin(angle)

    // Star size based on assets
    const assets = parseAssets(f.assets)
    const size = Math.max(2.5, Math.min(9, 2.5 + Math.sqrt(assets) * 0.7))

    const isHighlighted = selectedPw ? f.pws.includes(selectedPw) : true
    const isSelected = f.id === selectedId

    return { f, x, y, size, color: geo.color, pwColor: PW[primaryPw]?.color || "#888", isHighlighted, isSelected, angle, r }
  })
}

/* ── Background star field ── */
function StarField({ width, height }: { width: number; height: number }) {
  const stars = useMemo(() => {
    const result = []
    for (let i = 0; i < 200; i++) {
      const seed = hashStr("star" + i)
      result.push({
        x: (seed % 10000) / 10000 * width,
        y: ((seed >> 8) % 10000) / 10000 * height,
        r: 0.3 + (seed % 100) / 200,
        o: 0.1 + (seed % 100) / 250,
      })
    }
    return result
  }, [width, height])

  return (
    <g>
      {stars.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="white" opacity={s.o} />
      ))}
    </g>
  )
}

/* ── Suggest an Edit button ── */
function SuggestEditButton({ subject, dark }: { subject: string; dark?: boolean }) {
  const mailtoHref = `mailto:hello@changeengine.us?subject=${encodeURIComponent("Suggested Edit: " + subject)}&body=${encodeURIComponent("Hi Change Engine team,\n\nI'd like to suggest an update regarding: " + subject + "\n\n— What needs updating:\n\n— Correct information:\n\n— Source (if available):\n\nThank you!")}`
  return (
    <a href={mailtoHref} title="Suggest an edit" onClick={e => e.stopPropagation()} style={{
      display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10,
      background: dark ? "rgba(255,255,255,0.06)" : C.alt,
      border: "1px solid " + (dark ? "rgba(255,255,255,0.1)" : C.bd),
      color: dark ? "rgba(255,255,255,0.55)" : C.t2,
      fontSize: 12, fontWeight: 500, textDecoration: "none", cursor: "pointer", transition: "all .2s",
    }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
      Suggest an edit
    </a>
  )
}

/* ── Last sync badge ── */
function LastSyncBadge({ syncDate, dark }: { syncDate?: string; dark?: boolean }) {
  if (!syncDate) return null
  const d = new Date(syncDate)
  const formatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + " at " + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return (
    <div style={{
      fontSize: 10, color: dark ? "rgba(255,255,255,0.3)" : C.t3,
      display: "flex", alignItems: "center", gap: 4, marginTop: 4,
    }}>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
      Last verified {formatted}
    </div>
  )
}

/* ── Detail panel (dark theme) ── */
function GalaxyDetail({ f, onClose, faIdMap }: { f: Foundation; onClose: () => void; faIdMap: Record<string, string> }) {
  const geo = GM[f.geo_level] || GEO[0]
  const RS: Record<string, { c: string; l: string }> = { executive: { c: "#F4845F", l: "Exec" }, board: { c: "#9B5DE5", l: "Board" }, grants: { c: "#06D6A0", l: "Grants" } }

  return (
    <div style={{
      position: "absolute", right: 0, top: 0, bottom: 0, width: 380, maxWidth: "100%",
      background: "rgba(6,6,15,0.95)", backdropFilter: "blur(20px)",
      borderLeft: "1px solid rgba(255,255,255,0.08)", overflowY: "auto",
      padding: "24px 20px", zIndex: 20, color: "white",
      animation: "slideIn .3s ease-out",
    }}>
      <style>{`@keyframes slideIn { from { transform: translateX(100%); opacity: 0 } to { transform: translateX(0); opacity: 1 } }`}</style>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.3, margin: 0, color: "white" }}>{f.name}</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: geo.color + "22", color: geo.color, border: "1px solid " + geo.color + "44" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: geo.color }} />
              {geo.name}
            </span>
            {f.type && <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{f.type}</span>}
          </div>
        </div>
        <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>x</button>
      </div>

      {/* Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
        <div style={{ background: "rgba(199,91,42,0.1)", border: "1px solid rgba(199,91,42,0.25)", borderRadius: 12, padding: "12px 14px", textAlign: "center" }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#E8885A" }}>{f.assets || "N/A"}</div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: ".06em", marginTop: 2 }}>Assets</div>
        </div>
        <div style={{ background: "rgba(6,214,160,0.08)", border: "1px solid rgba(6,214,160,0.2)", borderRadius: 12, padding: "12px 14px", textAlign: "center" }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#06D6A0" }}>{f.annual_giving || "N/A"}</div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: ".06em", marginTop: 2 }}>Annual Giving</div>
        </div>
      </div>

      {/* Mission */}
      {f.mission && <p style={{ fontSize: 13, lineHeight: 1.65, color: "rgba(255,255,255,0.65)", margin: "0 0 18px" }}>{f.mission}</p>}

      {/* Contact */}
      <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "14px 16px", marginBottom: 18, border: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>
          Contact{f.founded_year ? " · Est. " + f.founded_year : ""}
        </div>
        {f.website_display && <ContactRow icon="🌐" label="Website" val={f.website_display} href={f.website_url || ("https://" + f.website_display)} />}
        {f.city && <ContactRow icon="📍" label="Location" val={[f.city, f.state_code].filter(Boolean).join(", ")} />}
        {f.phone && <ContactRow icon="📞" label="Phone" val={f.phone} href={"tel:" + f.phone.replace(/[^\d+]/g, "")} />}
        {f.email && <ContactRow icon="✉️" label="Email" val={f.email} href={"mailto:" + f.email} />}
      </div>

      {/* Pathways */}
      {f.pws.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>Pathways</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {f.pws.map(pid => {
              const pw = PW[pid]
              return pw ? <a key={pid} href={"/pathways/" + pw.slug} onClick={e => e.stopPropagation()} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 500, background: pw.color + "18", color: pw.color, border: "1px solid " + pw.color + "33", textDecoration: "none", transition: "all .2s" }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: pw.color }} />
                {pw.name}
              </a> : null
            })}
          </div>
        </div>
      )}

      {/* Focus Areas */}
      {f.fas.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>Focus Areas ({f.fas.length})</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {f.fas.map(a => {
              const faId = faIdMap[a]
              return faId
                ? <a key={a} href={"/explore/focus/" + faId} onClick={e => e.stopPropagation()} style={{ padding: "2px 8px", borderRadius: 8, fontSize: 10, fontWeight: 500, background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.08)", textDecoration: "none", transition: "all .2s" }}>{a}</a>
                : <span key={a} style={{ padding: "2px 8px", borderRadius: 8, fontSize: 10, fontWeight: 500, background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.08)" }}>{a}</span>
            })}
          </div>
        </div>
      )}

      {/* People */}
      {f.ppl.length > 0 && (
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 10 }}>People ({f.ppl.length})</div>
          {f.ppl.map((p, i) => {
            const rs = RS[p.role_type] || RS.executive
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: rs.c + "0A", borderLeft: "2px solid " + rs.c, borderRadius: "0 8px 8px 0", marginBottom: 4 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: rs.c + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: rs.c, flexShrink: 0 }}>
                  {p.name.split(" ").map(w => w[0]).slice(0, 2).join("")}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>{p.name}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{p.role}</div>
                </div>
                <span style={{ padding: "2px 7px", borderRadius: 6, fontSize: 8, fontWeight: 600, background: rs.c + "15", color: rs.c }}>{rs.l}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Org link */}
      {f.org_id && (
        <a href={"/organizations/" + f.org_id} style={{ display: "block", marginTop: 18, padding: "10px 14px", borderRadius: 10, background: "rgba(199,91,42,0.1)", border: "1px solid rgba(199,91,42,0.25)", color: "#E8885A", fontSize: 12, fontWeight: 600, textDecoration: "none", textAlign: "center" }}>
          View Full Organization Profile →
        </a>
      )}

      {/* Suggest an edit + last sync */}
      <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start" }}>
        <SuggestEditButton subject={f.name} dark />
        <LastSyncBadge syncDate={f.last_people_sync} dark />
      </div>
    </div>
  )
}

function ContactRow({ icon, label, val, href }: { icon: string; label: string; val: string; href?: string }) {
  const inner = (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "4px 0" }}>
      <span style={{ fontSize: 12, flexShrink: 0, marginTop: 1 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: ".05em" }}>{label}</div>
        <div style={{ fontSize: 12, color: href ? "#E8885A" : "rgba(255,255,255,0.7)", fontWeight: href ? 500 : 400, marginTop: 1, wordBreak: "break-word" }}>{val}</div>
      </div>
    </div>
  )
  if (href) return <a href={href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }} onClick={e => e.stopPropagation()}>{inner}</a>
  return inner
}

/* ── Dashboard metric card ── */
function MetricCard({ label, value, color, sub }: { label: string; value: string | number; color: string; sub?: string }) {
  return (
    <div style={{ background: C.sf, border: "1px solid " + C.bd, borderRadius: 14, padding: "16px 18px", textAlign: "center" }}>
      <div style={{ fontSize: 26, fontWeight: 700, color, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 10, color: C.t3, textTransform: "uppercase", letterSpacing: ".06em", marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: C.t2, marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

/* ── Dashboard pathway card ── */
function PathwayRow({ pid, pw, count, assets }: { pid: string; pw: typeof PW[string]; count: number; assets: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: C.sf, border: "1px solid " + C.bd, borderRadius: 10, cursor: "pointer" }}>
      <span style={{ width: 10, height: 10, borderRadius: "50%", background: pw.color, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.tx }}>{pw.name}</div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: pw.color }}>{count}</div>
        <div style={{ fontSize: 10, color: C.t3 }}>{assets > 0 ? fmtMoney(assets) : "N/A"}</div>
      </div>
    </div>
  )
}

/* ── Foundation card (list view, light theme) ── */
function FCard({ f, isSelected, onClick }: { f: Foundation; isSelected: boolean; onClick: () => void }) {
  const geo = GM[f.geo_level] || GEO[0]
  return (
    <div onClick={onClick} style={{
      background: C.sf, border: "1px solid " + (isSelected ? C.ac : C.bd), borderRadius: 14,
      padding: "16px 18px", cursor: "pointer", transition: "all .2s",
      boxShadow: isSelected ? "0 0 0 2px rgba(199,91,42,.15)" : "0 1px 4px rgba(0,0,0,.03)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.3, marginBottom: 4 }}>{f.name}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 8px", borderRadius: 8, fontSize: 10, fontWeight: 500, background: geo.color + "15", color: geo.color }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: geo.color }} />
              {geo.short}
            </span>
            {f.type && <span style={{ fontSize: 10, color: C.t3 }}>{f.type}</span>}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0, paddingLeft: 10 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.ac }}>{f.assets || "N/A"}</div>
          {f.annual_giving && <div style={{ fontSize: 10, color: C.t3 }}>{f.annual_giving}/yr</div>}
        </div>
      </div>
      {f.mission && <p style={{ fontSize: 12, lineHeight: 1.5, color: C.t2, margin: "0 0 8px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{f.mission}</p>}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginBottom: 4 }}>
        {f.pws.slice(0, 4).map(pid => {
          const pw = PW[pid]
          return pw ? <span key={pid} style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 7px", borderRadius: 8, fontSize: 9, fontWeight: 500, background: pw.color + "10", color: pw.color }}>
            <span style={{ width: 4, height: 4, borderRadius: "50%", background: pw.color }} /> {pw.short}
          </span> : null
        })}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
        <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
          {f.fas.slice(0, 2).map(a => <span key={a} style={{ padding: "1px 6px", borderRadius: 6, fontSize: 9, background: C.alt, color: C.t2, border: "1px solid " + C.bd }}>{a}</span>)}
          {f.fas.length > 2 && <span style={{ fontSize: 9, color: C.t3 }}>+{f.fas.length - 2}</span>}
        </div>
        <span style={{ fontSize: 9, color: C.t3 }}>{f.ppl.length} people</span>
      </div>
    </div>
  )
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   MAIN COMPONENT
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export default function FoundationsGalaxy() {
  /* ── Data state ── */
  const [foundations, setFoundations] = useState<any[]>([])
  const [people, setPeople] = useState<any[]>([])
  const [pwLinks, setPwLinks] = useState<any[]>([])
  const [faLinks, setFaLinks] = useState<any[]>([])
  const [expLog, setExpLog] = useState<any[]>([])
  const [faIdMap, setFaIdMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /* ── UI state ── */
  const [view, setView] = useState<"galaxy" | "dashboard" | "list">("galaxy")
  const [q, setQ] = useState("")
  const [geoF, setGeoF] = useState<string | null>(null)
  const [pwF, setPwF] = useState<string | null>(null)
  const [sel, setSel] = useState<Foundation | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [zipHits, setZipHits] = useState<string[] | null>(null)
  const [showAbout, setShowAbout] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)

  /* ── Fetch data ── */
  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const eps = [
          "/foundations?select=*&order=name",
          "/foundation_people?select=*",
          "/foundation_pathways?select=*",
          "/foundation_focus_areas?select=*",
          "/foundation_expansion_log?select=*&order=created_at.desc&limit=10",
          "/focus_areas?select=focus_id,focus_area_name",
        ]
        const res = await Promise.all(eps.map(ep => fetch(API + ep, { headers: HD }).then(r => r.json())))
        setFoundations(res[0] || [])
        setPeople(res[1] || [])
        setPwLinks(res[2] || [])
        setFaLinks(res[3] || [])
        setExpLog(res[4] || [])
        // Build name→ID map for focus areas
        const faMap: Record<string, string> = {}
        for (const fa of (res[5] || [])) faMap[fa.focus_area_name] = fa.focus_id
        setFaIdMap(faMap)
      } catch (e) {
        setError(String(e))
      }
      setLoading(false)
    }
    load()
  }, [])

  /* ── ZIP search ── */
  const searchZip = useCallback(async (zip: string) => {
    if (!zip || zip.length < 5) { setZipHits(null); return }
    try {
      const res = await fetch(API + "/foundation_zip_coverage?zip_code=eq." + zip + "&select=foundation_id", { headers: HD })
      const hits = await res.json()
      setZipHits((hits || []).map((h: any) => h.foundation_id))
    } catch { setZipHits(null) }
  }, [])

  function handleQ(v: string) {
    setQ(v)
    if (/^\d{5}$/.test(v)) searchZip(v)
    else if (zipHits) setZipHits(null)
  }

  /* ── Enrich and filter ── */
  const enriched: Foundation[] = useMemo(() =>
    foundations.map(f => ({
      ...f,
      ppl: people.filter(p => p.foundation_id === f.id),
      pws: pwLinks.filter(p => p.foundation_id === f.id).map(p => p.pathway_id),
      fas: faLinks.filter(a => a.foundation_id === f.id).map(a => a.focus_area),
    })), [foundations, people, pwLinks, faLinks])

  const filtered = useMemo(() =>
    enriched.filter(f => {
      if (zipHits && !zipHits.includes(f.id)) return false
      if (geoF && f.geo_level !== geoF) return false
      if (pwF && !f.pws.includes(pwF)) return false
      if (q && !/^\d{5}$/.test(q)) {
        const s = q.toLowerCase()
        return f.name.toLowerCase().includes(s) || (f.mission || "").toLowerCase().includes(s) || f.fas.some(a => a.toLowerCase().includes(s)) || f.ppl.some(p => p.name.toLowerCase().includes(s)) || (f.city || "").toLowerCase().includes(s)
      }
      return true
    }), [enriched, geoF, pwF, q, zipHits])

  /* ── Aggregate stats ── */
  const totalAssets = filtered.reduce((s, f) => s + parseAssets(f.assets), 0)
  const allPeople = filtered.flatMap(f => f.ppl)
  const uniqueFocusAreas = new Set(filtered.flatMap(f => f.fas)).size
  const stateCount = new Set(foundations.map((f: any) => f.source_state)).size

  /* ── Galaxy positions ── */
  const VW = 900, VH = 700
  const galaxyStars = useMemo(() => computeGalaxyPositions(filtered, pwF, sel?.id || null, VW, VH), [filtered, pwF, sel])

  /* ── Pathway stats for dashboard ── */
  const pwStats = useMemo(() =>
    PW_KEYS.map(pid => ({
      pid,
      pw: PW[pid],
      count: enriched.filter(f => f.pws.includes(pid)).length,
      assets: enriched.filter(f => f.pws.includes(pid)).reduce((s, f) => s + parseAssets(f.assets), 0),
    })).sort((a, b) => b.count - a.count), [enriched])

  /* ── Geo stats for dashboard ── */
  const geoStats = useMemo(() =>
    GEO.map(g => ({
      ...g,
      count: enriched.filter(f => f.geo_level === g.id).length,
      assets: enriched.filter(f => f.geo_level === g.id).reduce((s, f) => s + parseAssets(f.assets), 0),
    })).filter(g => g.count > 0), [enriched])

  /* ── Loading / Error ── */
  if (loading) return (
    <div style={{ minHeight: "100vh", background: C.void, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 20, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>Loading Foundations Galaxy...</div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginTop: 8 }}>Connecting to The Change Engine</div>
      </div>
    </div>
  )

  if (error) return (
    <div style={{ minHeight: "100vh", background: C.void, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", color: "#EF476F" }}>
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Connection Error</div>
        <div style={{ fontSize: 13 }}>{error}</div>
      </div>
    </div>
  )

  const isDark = view === "galaxy"
  const bgColor = isDark ? C.void : C.bg
  const textColor = isDark ? "white" : C.tx
  const mutedColor = isDark ? "rgba(255,255,255,0.4)" : C.t3
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : C.bd
  const surfaceColor = isDark ? "rgba(255,255,255,0.04)" : C.sf

  return (
    <div style={{ background: bgColor, minHeight: "100vh", color: textColor, fontFamily: "'Inter',system-ui,sans-serif", position: "relative" }}>

      {/* ── Top bar ── */}
      <div style={{ borderBottom: "1px solid " + borderColor, background: isDark ? "rgba(6,6,15,0.8)" : C.sf, backdropFilter: isDark ? "blur(12px)" : "none", position: "sticky", top: 0, zIndex: 15 }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "14px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: C.ac }} />
              <div>
                <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: "-.02em" }}>Foundations</h1>
                <p style={{ margin: 0, fontSize: 11, color: mutedColor }}>{foundations.length} across {stateCount} states · The Change Engine</p>
              </div>
              <button onClick={() => setShowAbout(!showAbout)} style={{
                padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 500, cursor: "pointer",
                background: showAbout ? (isDark ? "rgba(255,255,255,0.12)" : C.ac + "10") : "transparent",
                border: "1px solid " + (showAbout ? (isDark ? "rgba(255,255,255,0.2)" : C.ac + "30") : borderColor),
                color: showAbout ? (isDark ? "white" : C.ac) : mutedColor,
                transition: "all .2s", marginLeft: 4,
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline", verticalAlign: "-1px", marginRight: 4 }}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                About
              </button>
            </div>

            {/* View switcher */}
            <div style={{ display: "flex", gap: 2, background: isDark ? "rgba(255,255,255,0.06)" : C.alt, borderRadius: 10, padding: 3 }}>
              {([
                { id: "galaxy" as const, label: "✦ Galaxy" },
                { id: "dashboard" as const, label: "◫ Dashboard" },
                { id: "list" as const, label: "☰ List" },
              ]).map(v => (
                <button key={v.id} onClick={() => { setView(v.id); setSel(null) }} style={{
                  padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer", border: "none", transition: "all .2s",
                  background: view === v.id ? (isDark ? "rgba(255,255,255,0.12)" : C.sf) : "transparent",
                  color: view === v.id ? (isDark ? "white" : C.tx) : (isDark ? "rgba(255,255,255,0.45)" : C.t3),
                  boxShadow: view === v.id ? "0 1px 3px rgba(0,0,0,.1)" : "none",
                }}>{v.label}</button>
              ))}
            </div>
          </div>

          {/* Search + Filters */}
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <input type="text" placeholder="Search name, city, focus area... or 5-digit ZIP" value={q} onChange={e => handleQ(e.target.value)} style={{
              flex: "1 1 280px", maxWidth: 420, padding: "8px 14px", borderRadius: 10,
              background: isDark ? "rgba(255,255,255,0.06)" : C.alt, border: "1px solid " + borderColor,
              color: textColor, fontSize: 13, outline: "none",
            }} />

            {/* Geo filters */}
            <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
              <button onClick={() => setGeoF(null)} style={{ padding: "3px 10px", borderRadius: 10, fontSize: 10, fontWeight: 500, cursor: "pointer", background: !geoF ? (isDark ? "rgba(255,255,255,0.15)" : C.tx) : "transparent", border: "1px solid " + (!geoF ? "transparent" : borderColor), color: !geoF ? (isDark ? "white" : "#fff") : mutedColor }}>All</button>
              {GEO.map(g => {
                const ct = enriched.filter(f => f.geo_level === g.id).length
                if (!ct) return null
                return <button key={g.id} onClick={() => setGeoF(geoF === g.id ? null : g.id)} style={{ padding: "3px 10px", borderRadius: 10, fontSize: 10, fontWeight: 500, cursor: "pointer", background: geoF === g.id ? g.color + "20" : "transparent", border: "1px solid " + (geoF === g.id ? g.color + "55" : borderColor), color: geoF === g.id ? g.color : mutedColor }}>{g.short} ({ct})</button>
              })}
            </div>

            {/* Pathway filters */}
            <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
              <button onClick={() => setPwF(null)} style={{ padding: "3px 10px", borderRadius: 10, fontSize: 10, fontWeight: 500, cursor: "pointer", background: !pwF ? (isDark ? "rgba(255,255,255,0.15)" : C.tx) : "transparent", border: "1px solid " + (!pwF ? "transparent" : borderColor), color: !pwF ? (isDark ? "white" : "#fff") : mutedColor }}>All</button>
              {PW_KEYS.map(pid => {
                const pw = PW[pid]
                return <button key={pid} onClick={() => setPwF(pwF === pid ? null : pid)} style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "3px 10px", borderRadius: 10, fontSize: 10, fontWeight: 500, cursor: "pointer", background: pwF === pid ? pw.color + "20" : "transparent", border: "1px solid " + (pwF === pid ? pw.color + "55" : borderColor), color: pwF === pid ? pw.color : mutedColor }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: pw.color }} />{pw.short}
                </button>
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── About Section ── */}
      {showAbout && (
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
          <div style={{
            background: isDark ? "rgba(255,255,255,0.03)" : C.sf,
            border: "1px solid " + borderColor,
            borderRadius: 16, padding: "24px 28px", marginTop: 16, marginBottom: 8,
            animation: "fadeIn .3s ease-out",
          }}>
            <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(-8px) } to { opacity: 1; transform: translateY(0) } }`}</style>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, fontFamily: "'Georgia',serif", lineHeight: 1.3 }}>About the Foundations Galaxy</h2>
                <p style={{ fontSize: 13, lineHeight: 1.7, color: isDark ? "rgba(255,255,255,0.6)" : C.t2, margin: "0 0 12px" }}>
                  The Foundations Galaxy maps philanthropic investment across the Houston region and beyond. Each foundation is positioned by its community pathway and geographic reach, revealing the constellation of resources powering civic life.
                </p>
                <p style={{ fontSize: 13, lineHeight: 1.7, color: isDark ? "rgba(255,255,255,0.6)" : C.t2, margin: 0 }}>
                  Explore by pathway, geographic level, or search by name, city, or ZIP code. Click any foundation to see its leadership, focus areas, and connections to the broader Change Engine knowledge graph.
                </p>
              </div>
              <div>
                <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, textTransform: "uppercase", letterSpacing: ".06em", color: isDark ? "rgba(255,255,255,0.4)" : C.t3 }}>How to Read the Galaxy</h3>
                <div style={{ display: "grid", gap: 8 }}>
                  {[
                    { label: "Position", desc: "Each foundation orbits its primary community pathway. The sector angle shows which pathway it serves." },
                    { label: "Distance from center", desc: "Rings represent geographic reach — Houston at the core, expanding outward to county, state, federal, and international." },
                    { label: "Star size", desc: "Larger stars represent foundations with greater total assets under management." },
                    { label: "Color", desc: "Star color matches geographic level. Pathway sector labels surround the galaxy." },
                  ].map(item => (
                    <div key={item.label} style={{ display: "flex", gap: 8 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.ac, flexShrink: 0, marginTop: 6 }} />
                      <div>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{item.label}</span>
                        <span style={{ fontSize: 11, color: isDark ? "rgba(255,255,255,0.45)" : C.t3, marginLeft: 4 }}>— {item.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 10, background: isDark ? "rgba(199,91,42,0.08)" : C.ac + "06", border: "1px solid " + (isDark ? "rgba(199,91,42,0.2)" : C.ac + "18") }}>
                  <div style={{ fontSize: 11, color: isDark ? "rgba(255,255,255,0.5)" : C.t2, lineHeight: 1.5 }}>
                    Foundation data is verified weekly from official websites. Staff and board leadership is automatically updated and cross-referenced. See something outdated? Use the <strong>Suggest an edit</strong> button on any foundation.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ━━━━━━━━━━ GALAXY VIEW ━━━━━━━━━━ */}
      {view === "galaxy" && (
        <div style={{ position: "relative", maxWidth: 1280, margin: "0 auto" }}>
          <svg ref={svgRef} viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", height: "auto", display: "block" }}>
            {/* Radial gradient background */}
            <defs>
              <radialGradient id="gx-bg" cx="50%" cy="50%" r="55%">
                <stop offset="0%" stopColor="#14142E" />
                <stop offset="100%" stopColor={C.void} />
              </radialGradient>
              {/* Glow filter for selected star */}
              <filter id="glow">
                <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <rect width={VW} height={VH} fill="url(#gx-bg)" />
            <StarField width={VW} height={VH} />

            {/* Concentric rings for geo levels */}
            {GEO.map(g => {
              const maxR = Math.min(VW, VH) * 0.46
              const r = g.ring * maxR
              return (
                <g key={g.id}>
                  <circle cx={VW / 2} cy={VH / 2} r={r} fill="none" stroke={g.color} strokeWidth={0.5} strokeOpacity={geoF === g.id ? 0.25 : 0.06} strokeDasharray="3 6" />
                  {!geoF && <text x={VW / 2 + r + 4} y={VH / 2 - 4} fill={g.color} fontSize={8} opacity={0.3}>{g.short}</text>}
                </g>
              )
            })}

            {/* Pathway sector labels */}
            {PW_KEYS.map((pid, i) => {
              const pw = PW[pid]
              const maxR = Math.min(VW, VH) * 0.46
              const angle = (2 * Math.PI * i) / PW_KEYS.length - Math.PI / 2
              const lx = VW / 2 + (maxR + 20) * Math.cos(angle)
              const ly = VH / 2 + (maxR + 20) * Math.sin(angle)
              const isActive = pwF === pid
              return (
                <g key={pid} onClick={() => setPwF(pwF === pid ? null : pid)} style={{ cursor: "pointer" }}>
                  <circle cx={lx} cy={ly} r={14} fill={pw.color} fillOpacity={isActive ? 0.25 : 0.08} stroke={pw.color} strokeWidth={isActive ? 1.5 : 0.5} strokeOpacity={isActive ? 0.6 : 0.2} />
                  <text x={lx} y={ly + 1} textAnchor="middle" dominantBaseline="middle" fill={pw.color} fontSize={7} fontWeight={600} opacity={isActive ? 1 : 0.5}>{pw.short.slice(0, 3)}</text>
                </g>
              )
            })}

            {/* Foundation stars */}
            {galaxyStars.map(s => {
              const isHovered = hoveredId === s.f.id
              const isSelected = sel?.id === s.f.id
              const opacity = s.isHighlighted ? (isHovered || isSelected ? 1 : 0.75) : 0.12
              const r = isSelected ? s.size * 2 : isHovered ? s.size * 1.5 : s.size

              return (
                <g key={s.f.id}
                  onClick={() => setSel(sel?.id === s.f.id ? null : s.f)}
                  onMouseEnter={() => setHoveredId(s.f.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{ cursor: "pointer", transition: "opacity .3s" }}
                  opacity={opacity}
                >
                  {/* Outer glow */}
                  <circle cx={s.x} cy={s.y} r={r * 2.5} fill={s.color} fillOpacity={isSelected ? 0.15 : isHovered ? 0.08 : 0.02} style={{ transition: "all .3s" }} />
                  {/* Star body */}
                  <circle cx={s.x} cy={s.y} r={r} fill={s.color} fillOpacity={0.85} stroke={s.color} strokeWidth={isSelected ? 2 : 0.5} strokeOpacity={isSelected ? 1 : 0.4} filter={isSelected ? "url(#glow)" : undefined} style={{ transition: "all .3s" }} />
                  {/* Core */}
                  <circle cx={s.x} cy={s.y} r={r * 0.4} fill="white" fillOpacity={0.6} style={{ transition: "all .3s" }} />

                  {/* Name tooltip on hover */}
                  {(isHovered || isSelected) && (
                    <g>
                      <rect x={s.x - 60} y={s.y - r - 20} width={120} height={16} rx={4} fill="rgba(0,0,0,0.7)" />
                      <text x={s.x} y={s.y - r - 10} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={8} fontWeight={500}>{s.f.name.length > 22 ? s.f.name.slice(0, 20) + "…" : s.f.name}</text>
                    </g>
                  )}
                </g>
              )
            })}

            {/* Center label */}
            <text x={VW / 2} y={VH / 2} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={10} fontWeight={600} opacity={0.15}>
              FOUNDATIONS
            </text>
          </svg>

          {/* Stats overlay */}
          <div style={{ position: "absolute", bottom: 16, left: 24, display: "flex", gap: 20 }}>
            {[
              { label: "Foundations", value: filtered.length, color: C.ac },
              { label: "Est. Assets", value: totalAssets >= 1000 ? "$" + (totalAssets / 1000).toFixed(0) + "B+" : "$" + totalAssets.toFixed(0) + "M+", color: "#06D6A0" },
              { label: "Focus Areas", value: uniqueFocusAreas, color: "#118AB2" },
              { label: "People", value: allPeople.length, color: "#9B5DE5" },
            ].map(s => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: ".05em" }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Galaxy legend */}
          <div style={{ position: "absolute", top: 16, right: sel ? 400 : 24, display: "flex", flexWrap: "wrap", gap: 8, transition: "right .3s" }}>
            {GEO.filter(g => enriched.some(f => f.geo_level === g.id)).map(g => (
              <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer", opacity: geoF && geoF !== g.id ? 0.3 : 1 }} onClick={() => setGeoF(geoF === g.id ? null : g.id)}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: g.color }} />
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.5)" }}>{g.short}</span>
              </div>
            ))}
          </div>

          {/* Detail panel */}
          {sel && <GalaxyDetail f={sel} onClose={() => setSel(null)} faIdMap={faIdMap} />}
        </div>
      )}

      {/* ━━━━━━━━━━ DASHBOARD VIEW ━━━━━━━━━━ */}
      {view === "dashboard" && (
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "20px 24px 40px" }}>
          {/* Top metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
            <MetricCard label="Foundations" value={filtered.length} color={C.ac} sub={"of " + enriched.length + " total"} />
            <MetricCard label="Estimated Assets" value={totalAssets >= 1000 ? "$" + (totalAssets / 1000).toFixed(1) + "B+" : "$" + totalAssets.toFixed(0) + "M+"} color="#38a169" />
            <MetricCard label="Focus Areas" value={uniqueFocusAreas} color="#3182ce" />
            <MetricCard label="Key People" value={allPeople.length} color="#805ad5" />
            <MetricCard label="States" value={stateCount} color="#d69e2e" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {/* Pathway breakdown */}
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: C.tx, marginBottom: 12 }}>By Pathway</h3>
              <div style={{ display: "grid", gap: 6 }}>
                {pwStats.map(ps => <PathwayRow key={ps.pid} pid={ps.pid} pw={ps.pw} count={ps.count} assets={ps.assets} />)}
              </div>
            </div>

            {/* Geo breakdown */}
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: C.tx, marginBottom: 12 }}>By Geographic Level</h3>
              <div style={{ display: "grid", gap: 6 }}>
                {geoStats.map(gs => (
                  <div key={gs.id} onClick={() => setGeoF(geoF === gs.id ? null : gs.id)} style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                    background: geoF === gs.id ? gs.color + "08" : C.sf, border: "1px solid " + (geoF === gs.id ? gs.color + "33" : C.bd), borderRadius: 10, cursor: "pointer",
                  }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: gs.color, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.tx }}>{gs.name}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: gs.color }}>{gs.count}</div>
                      <div style={{ fontSize: 10, color: C.t3 }}>{gs.assets > 0 ? fmtMoney(gs.assets) : ""}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Expansion log */}
              {expLog.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: C.tx, marginBottom: 12 }}>Expansion Activity</h3>
                  <div style={{ background: C.sf, border: "1px solid " + C.bd, borderRadius: 12, padding: "12px 16px" }}>
                    {expLog.slice(0, 5).map((ex: any, i: number) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: i < Math.min(expLog.length, 5) - 1 ? "1px solid " + C.alt : "none" }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: ex.status === "completed" ? "#38a169" : "#d69e2e" }} />
                        <span style={{ fontSize: 12, fontWeight: 500, minWidth: 90 }}>{ex.state_name}</span>
                        <span style={{ fontSize: 11, color: C.t2 }}>{ex.foundations_added} foundations</span>
                        <span style={{ fontSize: 10, color: C.t3, marginLeft: "auto" }}>{ex.completed_at ? ago(ex.completed_at) : "running..."}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Top foundations by assets */}
          <div style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: C.tx, marginBottom: 12 }}>Top Foundations by Assets</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 10 }}>
              {[...filtered].sort((a, b) => parseAssets(b.assets) - parseAssets(a.assets)).slice(0, 6).map(f => (
                <FCard key={f.id} f={f} isSelected={sel?.id === f.id} onClick={() => setSel(sel?.id === f.id ? null : f)} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ━━━━━━━━━━ LIST VIEW ━━━━━━━━━━ */}
      {view === "list" && (
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "14px 24px 40px", display: "grid", gridTemplateColumns: sel ? "1fr 380px" : "1fr", gap: 20, alignItems: "start" }}>
          <div>
            {/* Stats bar */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
              {[
                { l: "Foundations", v: filtered.length, c: C.ac },
                { l: "Est. Assets", v: totalAssets >= 1000 ? "$" + (totalAssets / 1000).toFixed(0) + "B+" : "$" + totalAssets.toFixed(0) + "M+", c: "#38a169" },
                { l: "Focus Areas", v: uniqueFocusAreas, c: "#3182ce" },
                { l: "Key People", v: allPeople.length, c: "#805ad5" },
              ].map(s => (
                <div key={s.l} style={{ background: C.sf, border: "1px solid " + C.bd, borderRadius: 10, padding: "11px 14px", textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: s.c, lineHeight: 1.1 }}>{s.v}</div>
                  <div style={{ fontSize: 9, color: C.t3, textTransform: "uppercase", letterSpacing: ".05em", marginTop: 2 }}>{s.l}</div>
                </div>
              ))}
            </div>

            {/* Foundation cards grouped by geo level */}
            {filtered.length === 0 && <div style={{ textAlign: "center", padding: 50, color: C.t3 }}>No foundations match your filters.</div>}
            {GEO.filter(g => !geoF || g.id === geoF).map(g => {
              const gf = filtered.filter(f => f.geo_level === g.id)
              if (!gf.length) return null
              return (
                <div key={g.id} style={{ marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: g.color }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: g.color }}>{g.name}</span>
                    <span style={{ fontSize: 11, color: C.t3 }}>({gf.length})</span>
                    <div style={{ flex: 1, height: 1, background: C.bd }} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 10 }}>
                    {gf.map(f => <FCard key={f.id} f={f} isSelected={sel?.id === f.id} onClick={() => setSel(sel?.id === f.id ? null : f)} />)}
                  </div>
                </div>
              )
            })}
          </div>

          {/* List view detail panel (light theme) */}
          {sel && (
            <div style={{ background: C.sf, border: "1px solid " + C.bd, borderRadius: 14, padding: 22, position: "sticky", top: 80, boxShadow: "0 6px 30px rgba(0,0,0,.06)", maxHeight: "calc(100vh - 96px)", overflowY: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.3 }}>{sel.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                    {(() => { const g = GM[sel.geo_level] || GEO[0]; return <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 8px", borderRadius: 8, fontSize: 10, fontWeight: 500, background: g.color + "15", color: g.color }}><span style={{ width: 5, height: 5, borderRadius: "50%", background: g.color }} />{g.name}</span> })()}
                  </div>
                </div>
                <button onClick={() => setSel(null)} style={{ width: 26, height: 26, borderRadius: "50%", border: "1px solid " + C.bd, background: C.alt, color: C.t3, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>x</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
                <div style={{ background: "rgba(199,91,42,0.06)", border: "1px solid rgba(199,91,42,0.18)", borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.ac }}>{sel.assets || "N/A"}</div>
                  <div style={{ fontSize: 9, color: C.t3, textTransform: "uppercase" }}>Assets</div>
                </div>
                <div style={{ background: "rgba(56,161,105,0.05)", border: "1px solid rgba(56,161,105,0.18)", borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#38a169" }}>{sel.annual_giving || "N/A"}</div>
                  <div style={{ fontSize: 9, color: C.t3, textTransform: "uppercase" }}>Annual Giving</div>
                </div>
              </div>
              {sel.mission && <p style={{ fontSize: 13, lineHeight: 1.6, color: C.t2, margin: "0 0 14px" }}>{sel.mission}</p>}
              {sel.pws.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: C.t3, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>Pathways</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {sel.pws.map(pid => { const pw = PW[pid]; return pw ? <a key={pid} href={"/pathways/" + pw.slug} onClick={e => e.stopPropagation()} style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 8px", borderRadius: 8, fontSize: 10, fontWeight: 500, background: pw.color + "10", color: pw.color, border: "1px solid " + pw.color + "22", textDecoration: "none" }}><span style={{ width: 5, height: 5, borderRadius: "50%", background: pw.color }} />{pw.name}</a> : null })}
                  </div>
                </div>
              )}
              {sel.fas.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: C.t3, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>Focus Areas ({sel.fas.length})</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                    {sel.fas.map(a => { const faId = faIdMap[a]; return faId ? <a key={a} href={"/explore/focus/" + faId} onClick={e => e.stopPropagation()} style={{ padding: "2px 8px", borderRadius: 8, fontSize: 10, background: C.alt, color: C.t2, border: "1px solid " + C.bd, textDecoration: "none" }}>{a}</a> : <span key={a} style={{ padding: "2px 8px", borderRadius: 8, fontSize: 10, background: C.alt, color: C.t2, border: "1px solid " + C.bd }}>{a}</span> })}
                  </div>
                </div>
              )}
              {sel.ppl.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: C.t3, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>People ({sel.ppl.length})</div>
                  {sel.ppl.map((p, i) => {
                    const RS: Record<string, { c: string; l: string }> = { executive: { c: C.ac, l: "Exec" }, board: { c: "#805ad5", l: "Board" }, grants: { c: "#38a169", l: "Grants" } }
                    const rs = RS[p.role_type] || RS.executive
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: rs.c + "06", borderLeft: "2px solid " + rs.c, borderRadius: "0 8px 8px 0", marginBottom: 3 }}>
                        <div style={{ width: 26, height: 26, borderRadius: "50%", background: rs.c + "10", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: rs.c }}>{p.name.split(" ").map(w => w[0]).slice(0, 2).join("")}</div>
                        <div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 600 }}>{p.name}</div><div style={{ fontSize: 10, color: C.t3 }}>{p.role}</div></div>
                        <span style={{ padding: "2px 7px", borderRadius: 6, fontSize: 8, fontWeight: 600, background: rs.c + "08", color: rs.c }}>{rs.l}</span>
                      </div>
                    )
                  })}
                </div>
              )}
              {sel.org_id && <a href={"/organizations/" + sel.org_id} style={{ display: "block", padding: "10px 14px", borderRadius: 10, background: C.ac + "08", border: "1px solid " + C.ac + "22", color: C.ac, fontSize: 12, fontWeight: 600, textDecoration: "none", textAlign: "center" }}>View Full Organization Profile →</a>}
              {/* Suggest an edit + last sync */}
              <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start" }}>
                <SuggestEditButton subject={sel.name} />
                <LastSyncBadge syncDate={sel.last_people_sync} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
