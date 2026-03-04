"use client"
import { useState, useMemo, useEffect, useCallback, useRef } from "react"

/* ── API config ── */
const API = process.env.NEXT_PUBLIC_SUPABASE_URL + "/rest/v1"
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const HD = { apikey: KEY, Authorization: "Bearer " + KEY }

/* ── Palette (light only) ── */
const C = {
  bg: "#FAFAF7", sf: "#FFFFFF", alt: "#F5F3EE",
  bd: "#E8E4DB", tx: "#2D2A26", t2: "#6B665C", t3: "#9E9789",
  ac: "#C75B2A", al: "#E8885A",
  ring: "rgba(0,0,0,0.06)", ringHi: "rgba(0,0,0,0.12)",
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
interface Person { foundation_id: string; name: string; role: string; role_type: string; linkedin_url?: string; linkedin_status?: string }

/* ── Helpers ── */
function parseAssets(s?: string): number {
  if (!s) return 0
  const m = s.match(/([\d.]+)/)
  if (!m) return 0
  const n = parseFloat(m[1])
  if (s.includes("B")) return n * 1000
  return n
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
  const maxR = Math.min(vw, vh) * 0.44

  return foundations.map((f) => {
    const geo = GM[f.geo_level] || GEO[0]
    const primaryPw = f.pws[0] || PW_KEYS[hashStr(f.id) % PW_KEYS.length]
    const pwIdx = PW_KEYS.indexOf(primaryPw)
    const sectorAngle = (2 * Math.PI) / PW_KEYS.length
    const baseAngle = sectorAngle * pwIdx - Math.PI / 2
    const seed = hashStr(f.id)
    const angleOffset = ((seed % 1000) / 1000 - 0.5) * sectorAngle * 0.7
    const angle = baseAngle + angleOffset
    const ringR = geo.ring * maxR
    const radialJitter = ((seed % 500) / 500 - 0.5) * maxR * 0.08
    const r = ringR + radialJitter

    const x = cx + r * Math.cos(angle)
    const y = cy + r * Math.sin(angle)

    const assets = parseAssets(f.assets)
    const size = Math.max(3, Math.min(10, 3 + Math.sqrt(assets) * 0.75))

    const isHighlighted = selectedPw ? f.pws.includes(selectedPw) : true
    const isSelected = f.id === selectedId

    return { f, x, y, size, color: geo.color, pwColor: PW[primaryPw]?.color || "#888", isHighlighted, isSelected, angle, r }
  })
}

/* ── Suggest an Edit button ── */
function SuggestEditButton({ subject }: { subject: string }) {
  const mailtoHref = `mailto:hello@changeengine.us?subject=${encodeURIComponent("Suggested Edit: " + subject)}&body=${encodeURIComponent("Hi Change Engine team,\n\nI'd like to suggest an update regarding: " + subject + "\n\n— What needs updating:\n\n— Correct information:\n\n— Source (if available):\n\nThank you!")}`
  return (
    <a href={mailtoHref} title="Suggest an edit" onClick={e => e.stopPropagation()} style={{
      display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10,
      background: C.alt, border: "1px solid " + C.bd,
      color: C.t2, fontSize: 12, fontWeight: 500, textDecoration: "none", cursor: "pointer", transition: "all .2s",
    }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
      Suggest an edit
    </a>
  )
}

/* ── Last sync badge ── */
function LastSyncBadge({ syncDate }: { syncDate?: string }) {
  if (!syncDate) return null
  const d = new Date(syncDate)
  const formatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + " at " + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return (
    <div style={{ fontSize: 10, color: C.t3, display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
      Last verified {formatted}
    </div>
  )
}

/* ── Contact row ── */
function ContactRow({ icon, label, val, href }: { icon: string; label: string; val: string; href?: string }) {
  const inner = (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "4px 0" }}>
      <span style={{ fontSize: 12, flexShrink: 0, marginTop: 1 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 9, color: C.t3, textTransform: "uppercase", letterSpacing: ".05em" }}>{label}</div>
        <div style={{ fontSize: 12, color: href ? C.ac : C.tx, fontWeight: href ? 500 : 400, marginTop: 1, wordBreak: "break-word" }}>{val}</div>
      </div>
    </div>
  )
  if (href) return <a href={href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }} onClick={e => e.stopPropagation()}>{inner}</a>
  return inner
}

/* ── Bottom Drawer for Foundation Detail ── */
function FoundationDrawer({ f, onClose, faIdMap }: { f: Foundation; onClose: () => void; faIdMap: Record<string, string> }) {
  const geo = GM[f.geo_level] || GEO[0]
  const RS: Record<string, { c: string; l: string }> = { executive: { c: C.ac, l: "Exec" }, board: { c: "#805ad5", l: "Board" }, grants: { c: "#38a169", l: "Grants" } }

  return (
    <div style={{
      position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 50,
      background: C.sf, borderTop: "1px solid " + C.bd,
      boxShadow: "0 -8px 40px rgba(0,0,0,0.12)",
      maxHeight: "45vh", overflowY: "auto",
      animation: "drawerUp .3s ease-out",
    }}>
      <style>{`@keyframes drawerUp { from { transform: translateY(100%) } to { transform: translateY(0) } }`}</style>

      {/* Drag handle */}
      <div style={{ display: "flex", justifyContent: "center", padding: "8px 0 4px", cursor: "pointer" }} onClick={onClose}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: C.bd }} />
      </div>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px 24px" }}>
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, fontFamily: "'Georgia',serif", color: C.tx }}>{f.name}</h2>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600, background: geo.color + "15", color: geo.color, border: "1px solid " + geo.color + "30", flexShrink: 0 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: geo.color }} />
                {geo.name}
              </span>
              {f.type && <span style={{ fontSize: 11, color: C.t3 }}>{f.type}</span>}
            </div>
            {f.mission && <p style={{ fontSize: 13, lineHeight: 1.6, color: C.t2, margin: "8px 0 0", maxWidth: 600 }}>{f.mission}</p>}
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: "50%", border: "1px solid " + C.bd, background: C.alt, color: C.t3, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0, marginLeft: 16 }}>x</button>
        </div>

        {/* Horizontal content grid */}
        <div style={{ display: "grid", gridTemplateColumns: "200px 1fr 1fr 1fr", gap: 20, alignItems: "start" }}>
          {/* Col 1: Metrics + Contact */}
          <div>
            <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
              <div style={{ background: C.ac + "08", border: "1px solid " + C.ac + "20", borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: C.ac }}>{f.assets || "N/A"}</div>
                <div style={{ fontSize: 9, color: C.t3, textTransform: "uppercase" }}>Assets</div>
              </div>
              <div style={{ background: "rgba(56,161,105,0.05)", border: "1px solid rgba(56,161,105,0.18)", borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#38a169" }}>{f.annual_giving || "N/A"}</div>
                <div style={{ fontSize: 9, color: C.t3, textTransform: "uppercase" }}>Annual Giving</div>
              </div>
            </div>
            <div style={{ background: C.alt, borderRadius: 10, padding: "10px 12px", border: "1px solid " + C.bd }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: C.t3, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>
                Contact{f.founded_year ? " · Est. " + f.founded_year : ""}
              </div>
              {f.website_display && <ContactRow icon="🌐" label="Website" val={f.website_display} href={f.website_url || ("https://" + f.website_display)} />}
              {f.city && <ContactRow icon="📍" label="Location" val={[f.city, f.state_code].filter(Boolean).join(", ")} />}
              {f.phone && <ContactRow icon="📞" label="Phone" val={f.phone} href={"tel:" + f.phone.replace(/[^\d+]/g, "")} />}
              {f.email && <ContactRow icon="✉️" label="Email" val={f.email} href={"mailto:" + f.email} />}
            </div>
          </div>

          {/* Col 2: Pathways + Focus Areas */}
          <div>
            {f.pws.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: C.t3, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>Pathways</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {f.pws.map(pid => {
                    const pw = PW[pid]
                    return pw ? <a key={pid} href={"/pathways/" + pw.slug} onClick={e => e.stopPropagation()} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 500, background: pw.color + "10", color: pw.color, border: "1px solid " + pw.color + "22", textDecoration: "none" }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: pw.color }} />
                      {pw.name}
                    </a> : null
                  })}
                </div>
              </div>
            )}
            {f.fas.length > 0 && (
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: C.t3, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>Focus Areas ({f.fas.length})</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {f.fas.map(a => {
                    const faId = faIdMap[a]
                    return faId
                      ? <a key={a} href={"/explore/focus/" + faId} onClick={e => e.stopPropagation()} style={{ padding: "3px 8px", borderRadius: 8, fontSize: 10, fontWeight: 500, background: C.alt, color: C.t2, border: "1px solid " + C.bd, textDecoration: "none" }}>{a}</a>
                      : <span key={a} style={{ padding: "3px 8px", borderRadius: 8, fontSize: 10, fontWeight: 500, background: C.alt, color: C.t2, border: "1px solid " + C.bd }}>{a}</span>
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Col 3: People */}
          <div>
            {f.ppl.length > 0 && (
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: C.t3, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>People ({f.ppl.length})</div>
                <div style={{ maxHeight: 200, overflowY: "auto" }}>
                  {f.ppl.map((p, i) => {
                    const rs = RS[p.role_type] || RS.executive
                    const hasLinkedIn = p.linkedin_status === 'verified' && p.linkedin_url
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 8px", background: rs.c + "06", borderLeft: "2px solid " + rs.c, borderRadius: "0 8px 8px 0", marginBottom: 3 }}>
                        <div style={{ width: 24, height: 24, borderRadius: "50%", background: rs.c + "12", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: rs.c, flexShrink: 0 }}>
                          {p.name.split(" ").map(w => w[0]).slice(0, 2).join("")}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: C.tx }}>{p.name}</span>
                            {hasLinkedIn && (
                              <a href={p.linkedin_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} title="LinkedIn Profile" style={{ display: "inline-flex", color: "#0A66C2", flexShrink: 0 }}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                              </a>
                            )}
                          </div>
                          <div style={{ fontSize: 10, color: C.t3 }}>{p.role}</div>
                        </div>
                        <span style={{ padding: "2px 6px", borderRadius: 6, fontSize: 8, fontWeight: 600, background: rs.c + "08", color: rs.c }}>{rs.l}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Col 4: Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {f.org_id && (
              <a href={"/organizations/" + f.org_id} style={{ display: "block", padding: "10px 14px", borderRadius: 10, background: C.ac + "08", border: "1px solid " + C.ac + "22", color: C.ac, fontSize: 12, fontWeight: 600, textDecoration: "none", textAlign: "center" }}>
                View Organization Profile →
              </a>
            )}
            <SuggestEditButton subject={f.name} />
            <LastSyncBadge syncDate={f.last_people_sync} />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Foundation card (list view) ── */
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
  const [view, setView] = useState<"galaxy" | "list">("galaxy")
  const [q, setQ] = useState("")
  const [geoF, setGeoF] = useState<string | null>(null)
  const [pwF, setPwF] = useState<string | null>(null)
  const [sel, setSel] = useState<Foundation | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [zipHits, setZipHits] = useState<string[] | null>(null)
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

  /* ── Pathway stats ── */
  const pwStats = useMemo(() =>
    PW_KEYS.map(pid => ({
      pid,
      pw: PW[pid],
      count: enriched.filter(f => f.pws.includes(pid)).length,
      assets: enriched.filter(f => f.pws.includes(pid)).reduce((s, f) => s + parseAssets(f.assets), 0),
    })).sort((a, b) => b.count - a.count), [enriched])

  /* ── Geo stats ── */
  const geoStats = useMemo(() =>
    GEO.map(g => ({
      ...g,
      count: enriched.filter(f => f.geo_level === g.id).length,
      assets: enriched.filter(f => f.geo_level === g.id).reduce((s, f) => s + parseAssets(f.assets), 0),
    })).filter(g => g.count > 0), [enriched])

  /* ── Loading / Error ── */
  if (loading) return (
    <div style={{ minHeight: "60vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 20, fontWeight: 600, color: C.tx }}>Loading Foundations...</div>
        <div style={{ fontSize: 13, color: C.t3, marginTop: 8 }}>Connecting to The Change Engine</div>
      </div>
    </div>
  )

  if (error) return (
    <div style={{ minHeight: "60vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", color: "#EF476F" }}>
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Connection Error</div>
        <div style={{ fontSize: 13 }}>{error}</div>
      </div>
    </div>
  )

  return (
    <div style={{ background: C.bg, minHeight: "80vh", color: C.tx, fontFamily: "'Inter',system-ui,sans-serif", position: "relative", paddingBottom: sel ? "45vh" : 0, transition: "padding .3s" }}>

      {/* ── Top Header ── */}
      <div style={{ borderBottom: "1px solid " + C.bd, background: C.sf }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: C.ac }} />
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, fontFamily: "'Georgia',serif", letterSpacing: "-.02em" }}>Foundations</h1>
              <p style={{ margin: 0, fontSize: 11, color: C.t3 }}>{foundations.length} across {stateCount} states</p>
            </div>
          </div>

          {/* View toggle (small icons, not pills) */}
          <div style={{ display: "flex", gap: 2, background: C.alt, borderRadius: 8, padding: 2 }}>
            <button onClick={() => { setView("galaxy"); setSel(null) }} title="Galaxy View" style={{
              padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer", border: "none", transition: "all .2s",
              background: view === "galaxy" ? C.sf : "transparent", color: view === "galaxy" ? C.tx : C.t3,
              boxShadow: view === "galaxy" ? "0 1px 3px rgba(0,0,0,.08)" : "none",
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "-2px", marginRight: 4 }}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg>
              Galaxy
            </button>
            <button onClick={() => { setView("list"); setSel(null) }} title="List View" style={{
              padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer", border: "none", transition: "all .2s",
              background: view === "list" ? C.sf : "transparent", color: view === "list" ? C.tx : C.t3,
              boxShadow: view === "list" ? "0 1px 3px rgba(0,0,0,.08)" : "none",
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "-2px", marginRight: 4 }}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
              List
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Layout: Control Panel + Content ── */}
      <div style={{ maxWidth: 1400, margin: "0 auto", display: "grid", gridTemplateColumns: "240px 1fr", gap: 0, minHeight: "70vh" }}>

        {/* ── LEFT: Control Panel ── */}
        <div style={{ borderRight: "1px solid " + C.bd, background: C.sf, padding: "16px 16px 24px", overflowY: "auto", maxHeight: "80vh", position: "sticky", top: 0 }}>

          {/* Search */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: C.t3, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>Search</div>
            <input type="text" placeholder="Name, city, ZIP..." value={q} onChange={e => handleQ(e.target.value)} style={{
              width: "100%", padding: "8px 10px", borderRadius: 8,
              background: C.alt, border: "1px solid " + C.bd,
              color: C.tx, fontSize: 12, outline: "none", boxSizing: "border-box",
            }} />
          </div>

          {/* Stats summary */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: C.t3, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>Overview</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {[
                { l: "Showing", v: filtered.length, c: C.ac },
                { l: "Assets", v: totalAssets >= 1000 ? "$" + (totalAssets / 1000).toFixed(0) + "B+" : "$" + totalAssets.toFixed(0) + "M+", c: "#38a169" },
                { l: "Focus Areas", v: uniqueFocusAreas, c: "#3182ce" },
                { l: "People", v: allPeople.length, c: "#805ad5" },
              ].map(s => (
                <div key={s.l} style={{ background: C.alt, borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: s.c, lineHeight: 1.1 }}>{s.v}</div>
                  <div style={{ fontSize: 8, color: C.t3, textTransform: "uppercase", letterSpacing: ".04em", marginTop: 2 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Geographic Level filter */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: C.t3, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>Geographic Level</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <button onClick={() => setGeoF(null)} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 8,
                background: !geoF ? C.ac + "08" : "transparent", border: "none",
                cursor: "pointer", width: "100%", textAlign: "left", transition: "all .15s",
              }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: !geoF ? C.ac : C.bd }} />
                <span style={{ fontSize: 12, fontWeight: !geoF ? 600 : 400, color: !geoF ? C.ac : C.t2, flex: 1 }}>All Levels</span>
                <span style={{ fontSize: 11, color: C.t3, fontWeight: 600 }}>{enriched.length}</span>
              </button>
              {GEO.map(g => {
                const ct = enriched.filter(f => f.geo_level === g.id).length
                if (!ct) return null
                const isActive = geoF === g.id
                return (
                  <button key={g.id} onClick={() => setGeoF(isActive ? null : g.id)} style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 8,
                    background: isActive ? g.color + "10" : "transparent", border: "none",
                    cursor: "pointer", width: "100%", textAlign: "left", transition: "all .15s",
                  }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: g.color, opacity: isActive ? 1 : 0.5 }} />
                    <span style={{ fontSize: 12, fontWeight: isActive ? 600 : 400, color: isActive ? g.color : C.t2, flex: 1 }}>{g.name}</span>
                    <span style={{ fontSize: 11, color: isActive ? g.color : C.t3, fontWeight: 600 }}>{ct}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Pathway filter */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: C.t3, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>Pathway</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <button onClick={() => setPwF(null)} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 8,
                background: !pwF ? C.ac + "08" : "transparent", border: "none",
                cursor: "pointer", width: "100%", textAlign: "left", transition: "all .15s",
              }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: !pwF ? C.ac : C.bd }} />
                <span style={{ fontSize: 12, fontWeight: !pwF ? 600 : 400, color: !pwF ? C.ac : C.t2, flex: 1 }}>All Pathways</span>
              </button>
              {pwStats.map(ps => {
                const isActive = pwF === ps.pid
                return (
                  <button key={ps.pid} onClick={() => setPwF(isActive ? null : ps.pid)} style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 8,
                    background: isActive ? ps.pw.color + "10" : "transparent", border: "none",
                    cursor: "pointer", width: "100%", textAlign: "left", transition: "all .15s",
                  }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: ps.pw.color, opacity: isActive ? 1 : 0.5 }} />
                    <span style={{ fontSize: 12, fontWeight: isActive ? 600 : 400, color: isActive ? ps.pw.color : C.t2, flex: 1 }}>{ps.pw.name}</span>
                    <span style={{ fontSize: 11, color: isActive ? ps.pw.color : C.t3, fontWeight: 600 }}>{ps.count}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Expansion log */}
          {expLog.length > 0 && (
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: C.t3, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>Recent Activity</div>
              <div style={{ background: C.alt, borderRadius: 10, padding: "10px 12px", border: "1px solid " + C.bd }}>
                {expLog.slice(0, 4).map((ex: any, i: number) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0", borderBottom: i < Math.min(expLog.length, 4) - 1 ? "1px solid " + C.bd : "none" }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: ex.status === "completed" ? "#38a169" : "#d69e2e" }} />
                    <span style={{ fontSize: 10, fontWeight: 500, flex: 1 }}>{ex.state_name}</span>
                    <span style={{ fontSize: 9, color: C.t3 }}>+{ex.foundations_added}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Main Content ── */}
        <div style={{ padding: view === "galaxy" ? 0 : "16px 24px 40px", overflow: "hidden" }}>

          {/* ━━━━━━━━━━ GALAXY VIEW ━━━━━━━━━━ */}
          {view === "galaxy" && (
            <div style={{ position: "relative" }}>
              <svg ref={svgRef} viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", height: "auto", display: "block", background: C.bg }}>
                {/* Subtle background pattern */}
                <defs>
                  <radialGradient id="gx-bg" cx="50%" cy="50%" r="55%">
                    <stop offset="0%" stopColor="#F0EDE6" />
                    <stop offset="100%" stopColor={C.bg} />
                  </radialGradient>
                  <filter id="dot-shadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.15" />
                  </filter>
                  <filter id="glow-light">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                <rect width={VW} height={VH} fill="url(#gx-bg)" />

                {/* Concentric rings for geo levels */}
                {GEO.map(g => {
                  const maxR = Math.min(VW, VH) * 0.44
                  const r = g.ring * maxR
                  const isActive = geoF === g.id
                  return (
                    <g key={g.id}>
                      <circle cx={VW / 2} cy={VH / 2} r={r} fill="none" stroke={g.color} strokeWidth={isActive ? 1.5 : 0.8} strokeOpacity={isActive ? 0.4 : 0.15} strokeDasharray={isActive ? "none" : "4 8"} />
                      <text x={VW / 2 + r + 6} y={VH / 2 - 4} fill={g.color} fontSize={9} fontWeight={500} opacity={isActive ? 0.8 : 0.35}>{g.short}</text>
                    </g>
                  )
                })}

                {/* Pathway sector labels */}
                {PW_KEYS.map((pid, i) => {
                  const pw = PW[pid]
                  const maxR = Math.min(VW, VH) * 0.44
                  const angle = (2 * Math.PI * i) / PW_KEYS.length - Math.PI / 2
                  const lx = VW / 2 + (maxR + 22) * Math.cos(angle)
                  const ly = VH / 2 + (maxR + 22) * Math.sin(angle)
                  const isActive = pwF === pid
                  return (
                    <g key={pid} onClick={() => setPwF(pwF === pid ? null : pid)} style={{ cursor: "pointer" }}>
                      <circle cx={lx} cy={ly} r={16} fill={isActive ? pw.color : C.sf} fillOpacity={isActive ? 0.15 : 0.9} stroke={pw.color} strokeWidth={isActive ? 2 : 1} strokeOpacity={isActive ? 0.8 : 0.3} />
                      <text x={lx} y={ly + 1} textAnchor="middle" dominantBaseline="middle" fill={pw.color} fontSize={7} fontWeight={600} opacity={isActive ? 1 : 0.6}>{pw.short.slice(0, 3)}</text>
                    </g>
                  )
                })}

                {/* Foundation dots */}
                {galaxyStars.map(s => {
                  const isHovered = hoveredId === s.f.id
                  const isSelected = sel?.id === s.f.id
                  const opacity = s.isHighlighted ? (isHovered || isSelected ? 1 : 0.8) : 0.15
                  const r = isSelected ? s.size * 1.8 : isHovered ? s.size * 1.4 : s.size

                  return (
                    <g key={s.f.id}
                      onClick={() => setSel(sel?.id === s.f.id ? null : s.f)}
                      onMouseEnter={() => setHoveredId(s.f.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      style={{ cursor: "pointer", transition: "opacity .3s" }}
                      opacity={opacity}
                    >
                      {/* Outer ring on hover/select */}
                      {(isHovered || isSelected) && (
                        <circle cx={s.x} cy={s.y} r={r + 4} fill="none" stroke={s.color} strokeWidth={1.5} strokeOpacity={0.4} style={{ transition: "all .3s" }} />
                      )}
                      {/* Dot body */}
                      <circle cx={s.x} cy={s.y} r={r} fill={s.color} stroke={C.sf} strokeWidth={1} filter="url(#dot-shadow)" style={{ transition: "all .3s" }} />
                      {/* Inner highlight */}
                      <circle cx={s.x - r * 0.2} cy={s.y - r * 0.2} r={r * 0.3} fill="white" fillOpacity={0.4} style={{ transition: "all .3s" }} />

                      {/* Name tooltip on hover */}
                      {(isHovered || isSelected) && (
                        <g>
                          <rect x={s.x - 65} y={s.y - r - 22} width={130} height={18} rx={4} fill={C.sf} stroke={C.bd} strokeWidth={0.5} />
                          <text x={s.x} y={s.y - r - 11} textAnchor="middle" dominantBaseline="middle" fill={C.tx} fontSize={8} fontWeight={600}>{s.f.name.length > 24 ? s.f.name.slice(0, 22) + "…" : s.f.name}</text>
                        </g>
                      )}
                    </g>
                  )
                })}

                {/* Center label */}
                <text x={VW / 2} y={VH / 2} textAnchor="middle" dominantBaseline="middle" fill={C.t3} fontSize={10} fontWeight={600} opacity={0.3}>
                  FOUNDATIONS
                </text>
              </svg>

              {/* Result count overlay */}
              {(geoF || pwF || q) && (
                <div style={{ position: "absolute", top: 12, left: 12, background: C.sf, borderRadius: 8, padding: "6px 12px", border: "1px solid " + C.bd, boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.ac }}>{filtered.length}</span>
                  <span style={{ fontSize: 11, color: C.t3, marginLeft: 4 }}>of {enriched.length} foundations</span>
                  <button onClick={() => { setGeoF(null); setPwF(null); setQ(""); setZipHits(null) }} style={{
                    marginLeft: 8, padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 500,
                    background: C.alt, border: "1px solid " + C.bd, color: C.t2, cursor: "pointer",
                  }}>Clear</button>
                </div>
              )}
            </div>
          )}

          {/* ━━━━━━━━━━ LIST VIEW ━━━━━━━━━━ */}
          {view === "list" && (
            <div>
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
          )}
        </div>
      </div>

      {/* ── Bottom Drawer for Foundation Detail ── */}
      {sel && <FoundationDrawer f={sel} onClose={() => setSel(null)} faIdMap={faIdMap} />}
    </div>
  )
}
