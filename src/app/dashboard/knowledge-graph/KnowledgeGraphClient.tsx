'use client'

import { useState, useEffect } from "react";

// ═══════════════════════════════════════════════════════════════
// THE CHANGE ENGINE — CIVIC KNOWLEDGE GRAPH v3
// ULTIMATE GALAXY: 7 orbital layers · SDG ring · Bridging arcs
// Classification explosion · Life situations · Mini pipeline
// 2,755+ edges · 2,630+ records · 67 tables · 8 domains
// ═══════════════════════════════════════════════════════════════

const THEMES = {
  THEME_01: { name: "Our Health", color: "#e53e3e", emoji: "❤️", content: 25, focus: 45 },
  THEME_02: { name: "Our Families", color: "#dd6b20", emoji: "👨‍👩‍👧‍👦", content: 48, focus: 44 },
  THEME_03: { name: "Our Neighborhood", color: "#d69e2e", emoji: "🏘️", content: 44, focus: 45 },
  THEME_04: { name: "Our Voice", color: "#38a169", emoji: "🗳️", content: 44, focus: 45 },
  THEME_05: { name: "Our Money", color: "#3182ce", emoji: "💰", content: 16, focus: 44 },
  THEME_06: { name: "Our Planet", color: "#319795", emoji: "🌍", content: 10, focus: 45 },
  THEME_07: { name: "The Bigger We", color: "#805ad5", emoji: "🤝", content: 8, focus: 44 },
};

const CENTERS = {
  Learning:       { emoji: "📚", color: "#6366f1", count: 81, question: "How can I understand?" },
  Resource:       { emoji: "📋", color: "#10b981", count: 78, question: "What's available to me?" },
  Action:         { emoji: "✊", color: "#f59e0b", count: 28, question: "How can I help?" },
  Accountability: { emoji: "🏛️", color: "#8b5cf6", count: 8,  question: "Who makes decisions?" },
};

const SDOH = [
  { id: "SC", name: "Social & Community", short: "Social", color: "#805ad5", count: 73 },
  { id: "NB", name: "Neighborhood", short: "Neighbor", color: "#d69e2e", count: 65 },
  { id: "HC", name: "Healthcare", short: "Health", color: "#e53e3e", count: 23 },
  { id: "ED", name: "Education", short: "Edu", color: "#38a169", count: 17 },
  { id: "EA", name: "Economic Stability", short: "Econ", color: "#3182ce", count: 17 },
];

const SDG_DATA = [
  { id: 16, name: "Peace & Justice", icon: "⚖️", count: 65, color: "#1a5276" },
  { id: 11, name: "Sustainable Cities", icon: "🏙️", count: 49, color: "#f39c12" },
  { id: 3,  name: "Good Health", icon: "💚", count: 44, color: "#27ae60" },
  { id: 4,  name: "Quality Education", icon: "📖", count: 38, color: "#c0392b" },
  { id: 2,  name: "Zero Hunger", icon: "🍽️", count: 35, color: "#d4a937" },
  { id: 10, name: "Reduced Inequalities", icon: "⚡", count: 28, color: "#e91e8c" },
  { id: 8,  name: "Decent Work", icon: "💼", count: 21, color: "#8b1a38" },
  { id: 1,  name: "No Poverty", icon: "🏠", count: 21, color: "#e5243b" },
  { id: 15, name: "Life on Land", icon: "🌿", count: 7, color: "#56c02b" },
  { id: 13, name: "Climate Action", icon: "🌡️", count: 6, color: "#3f7e44" },
  { id: 5,  name: "Gender Equality", icon: "♀️", count: 5, color: "#ef402b" },
  { id: 17, name: "Partnerships", icon: "🤝", count: 5, color: "#19486a" },
];

const LIFE_SITUATIONS = [
  { name: "Find food", emoji: "🍎", count: 12 },
  { name: "Pay rent", emoji: "🏠", count: 8 },
  { name: "Get healthcare", emoji: "🏥", count: 10 },
  { name: "Find a job", emoji: "💼", count: 7 },
  { name: "Legal help", emoji: "⚖️", count: 5 },
  { name: "Childcare", emoji: "👶", count: 6 },
  { name: "Mental health", emoji: "🧠", count: 9 },
  { name: "Immigration", emoji: "🗽", count: 4 },
  { name: "Education", emoji: "🎓", count: 8 },
  { name: "Utilities", emoji: "💡", count: 5 },
  { name: "Transportation", emoji: "🚌", count: 3 },
  { name: "Disaster help", emoji: "🌊", count: 4 },
];

const PATHWAY_CENTER = [
  { pw: "THEME_01", c: "Learning", n: 8 },  { pw: "THEME_01", c: "Resource", n: 18 },
  { pw: "THEME_01", c: "Action", n: 3 },     { pw: "THEME_01", c: "Accountability", n: 1 },
  { pw: "THEME_02", c: "Learning", n: 15 },  { pw: "THEME_02", c: "Resource", n: 26 },
  { pw: "THEME_02", c: "Action", n: 5 },     { pw: "THEME_02", c: "Accountability", n: 2 },
  { pw: "THEME_03", c: "Learning", n: 18 },  { pw: "THEME_03", c: "Resource", n: 17 },
  { pw: "THEME_03", c: "Action", n: 7 },     { pw: "THEME_03", c: "Accountability", n: 2 },
  { pw: "THEME_04", c: "Learning", n: 26 },  { pw: "THEME_04", c: "Resource", n: 8 },
  { pw: "THEME_04", c: "Action", n: 8 },     { pw: "THEME_04", c: "Accountability", n: 2 },
  { pw: "THEME_05", c: "Learning", n: 10 },  { pw: "THEME_05", c: "Resource", n: 4 },
  { pw: "THEME_05", c: "Action", n: 2 },
  { pw: "THEME_06", c: "Learning", n: 4 },   { pw: "THEME_06", c: "Resource", n: 3 },
  { pw: "THEME_06", c: "Action", n: 2 },     { pw: "THEME_06", c: "Accountability", n: 1 },
  { pw: "THEME_07", c: "Learning", n: 5 },   { pw: "THEME_07", c: "Resource", n: 2 },
  { pw: "THEME_07", c: "Action", n: 1 },
];

const BRIDGING = [
  { a: "THEME_01", b: "THEME_02", shared: 12 },
  { a: "THEME_02", b: "THEME_03", shared: 15 },
  { a: "THEME_03", b: "THEME_04", shared: 8 },
  { a: "THEME_04", b: "THEME_07", shared: 10 },
  { a: "THEME_01", b: "THEME_06", shared: 5 },
  { a: "THEME_05", b: "THEME_02", shared: 9 },
  { a: "THEME_03", b: "THEME_06", shared: 7 },
  { a: "THEME_05", b: "THEME_04", shared: 6 },
];

const DOMAINS: Record<string, { name: string; color: string; items: { icon: string; name: string; count: number }[] }> = {
  content:  { name: "Content",   color: "#C75B2A",  items: [
    { icon: "📄", name: "Published", count: 195 },
    { icon: "📚", name: "Resources", count: 307 },
    { icon: "🌐", name: "Translations", count: 170 },
  ]},
  pipeline: { name: "Pipeline",  color: "#dd6b20",  items: [
    { icon: "📥", name: "Inbox", count: 233 },
    { icon: "🔍", name: "Review Queue", count: 233 },
  ]},
  people:   { name: "People",    color: "#8b5cf6",  items: [
    { icon: "🏛️", name: "Officials", count: 100 },
    { icon: "🏢", name: "Organizations", count: 100 },
    { icon: "🗳️", name: "Candidates", count: 20 },
  ]},
  services: { name: "Services",  color: "#10b981",  items: [
    { icon: "🤝", name: "Services 211", count: 100 },
    { icon: "💡", name: "Life Situations", count: 25 },
    { icon: "📋", name: "Policies", count: 30 },
  ]},
  learning: { name: "Learning",  color: "#3182ce",  items: [
    { icon: "🛤️", name: "Paths", count: 20 },
    { icon: "📖", name: "Modules", count: 50 },
    { icon: "❓", name: "Quizzes", count: 22 },
    { icon: "🏅", name: "Badges", count: 30 },
  ]},
  civic:    { name: "Civic",     color: "#d53f8c",  items: [
    { icon: "🗳️", name: "Elections", count: 8 },
    { icon: "☑️", name: "Ballot Items", count: 10 },
    { icon: "📍", name: "Voting Locations", count: 30 },
  ]},
  geo:      { name: "Geography", color: "#d69e2e",  items: [
    { icon: "📮", name: "ZIP Codes", count: 238 },
    { icon: "🏘️", name: "Neighborhoods", count: 50 },
    { icon: "📊", name: "Census Tracts", count: 50 },
    { icon: "🗺️", name: "Precincts", count: 40 },
    { icon: "🏞️", name: "Counties", count: 18 },
  ]},
  taxonomy: { name: "Taxonomy",  color: "#319795",  items: [
    { icon: "🎯", name: "Focus Areas", count: 312 },
  ]},
};

const SOURCES = [
  { name: "KHOU", count: 28, color: "#e53e3e" },
  { name: "Houston Food Bank", count: 22, color: "#38a169" },
  { name: "Houston Public Media", count: 16, color: "#3182ce" },
  { name: "YMCA Houston", count: 12, color: "#38a169" },
  { name: "Houston Habitat", count: 12, color: "#38a169" },
  { name: "SA Report", count: 9, color: "#3182ce" },
  { name: "Houstonia", count: 9, color: "#3182ce" },
  { name: "houstontx.gov", count: 6, color: "#8b5cf6" },
  { name: "Legacy Health", count: 2, color: "#d53f8c" },
  { name: "BakerRipley", count: 1, color: "#38a169" },
];

const CROSSWALKS = [
  { name: "SDGs", full: "17 UN Goals", color: "#dd6b20", count: 17 },
  { name: "SDOH", full: "5 Health Domains", color: "#805ad5", count: 5 },
  { name: "NTEE", full: "Nonprofit Codes", color: "#3182ce", count: 26 },
  { name: "AIRS", full: "211 Categories", color: "#10b981", count: 50 },
  { name: "Themes", full: "7 Pathways", color: "#C75B2A", count: 7 },
];

const DIMENSIONS = [
  { name: "Focus Areas", edges: 507, color: "#319795" },
  { name: "Audiences", edges: 431, color: "#d53f8c" },
  { name: "SDGs", edges: 337, color: "#dd6b20" },
  { name: "Pathways", edges: 317, color: "#C75B2A" },
  { name: "Life Situations", edges: 241, color: "#38a169" },
  { name: "Centers", edges: 195, color: "#6366f1" },
  { name: "SDOH", edges: 195, color: "#805ad5" },
  { name: "Translations", edges: 170, color: "#f59e0b" },
  { name: "Actions", edges: 137, color: "#e53e3e" },
];

const STATS = {
  content: 195, services: 100, officials: 100, orgs: 100,
  policies: 30, situations: 25, paths: 20, translations: 170,
  feeds: 10, zipCodes: 238, neighborhoods: 50, focusAreas: 312,
  elections: 8, badges: 30, resources: 307, totalEdges: 2755,
  totalRecords: 2630, objectTypes: 24, tables: 67, bridging: 43,
};

interface NodeBase {
  id: string | number;
  name: string;
  color: string;
  x: number;
  y: number;
  type: string;
  [key: string]: any;
}

export default function KnowledgeGraphClient() {
  const [selectedNode, setSelectedNode] = useState<NodeBase | null>(null);
  const [view, setView] = useState("galaxy");
  const [hoveredEdge, setHoveredEdge] = useState<number | null>(null);
  const [hovered, setHovered] = useState<NodeBase | null>(null);
  const [animPhase, setAnimPhase] = useState(0);
  const [showExplosion, setShowExplosion] = useState(false);
  const [layers, setLayers] = useState({
    pathways: true, centers: true, sdoh: true, sdgs: true,
    domains: true, sources: true, crosswalks: true,
    bridging: true, lifeSit: true,
  });

  useEffect(() => {
    const timer = setInterval(() => setAnimPhase(p => (p + 1) % 360), 50);
    return () => clearInterval(timer);
  }, []);

  type LayerKey = keyof typeof layers;
  const toggleLayer = (key: LayerKey) => setLayers(l => ({ ...l, [key]: !l[key] }));

  const cx = 500, cy = 450;

  const pathwayNodes: NodeBase[] = Object.entries(THEMES).map(([id, t], i) => {
    const angle = (i / 7) * Math.PI * 2 - Math.PI / 2;
    return { id, ...t, x: cx + Math.cos(angle) * 195, y: cy + Math.sin(angle) * 195, type: "pathway" };
  });

  const centerNodes: NodeBase[] = Object.entries(CENTERS).map(([name, c], i) => {
    const angle = (i / 4) * Math.PI * 2 - Math.PI / 4;
    return { id: name, name, ...c, x: cx + Math.cos(angle) * 95, y: cy + Math.sin(angle) * 95, type: "center" };
  });

  const sdohNodes: NodeBase[] = SDOH.map((s, i) => {
    const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
    return { ...s, x: cx + Math.cos(angle) * 300, y: cy + Math.sin(angle) * 300, type: "sdoh" };
  });

  const sdgNodes: NodeBase[] = SDG_DATA.map((s, i) => {
    const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
    return { ...s, x: cx + Math.cos(angle) * 248, y: cy + Math.sin(angle) * 248, type: "sdg" };
  });

  const lifeSitNodes: NodeBase[] = LIFE_SITUATIONS.map((s, i) => {
    const angle = (i / 12) * Math.PI * 2 - Math.PI / 2 + 0.15;
    return { ...s, id: s.name, color: "#38a169", x: cx + Math.cos(angle) * 140, y: cy + Math.sin(angle) * 140, type: "lifeSit" };
  });

  const domainEntries = Object.entries(DOMAINS);
  const domainNodes: NodeBase[] = domainEntries.map(([key, d], i) => {
    const angle = (i / domainEntries.length) * Math.PI * 2 - Math.PI / 2;
    const totalCount = d.items.reduce((s, it) => s + it.count, 0);
    return { id: key, ...d, totalCount, x: cx + Math.cos(angle) * 390, y: cy + Math.sin(angle) * 390, type: "domain" };
  });

  const sourceNodes: NodeBase[] = SOURCES.map((s, i) => {
    const angle = (i / 10) * Math.PI * 2 - Math.PI / 2 + 0.3;
    return { ...s, x: cx + Math.cos(angle) * 468, y: cy + Math.sin(angle) * 468, type: "source", id: s.name };
  });

  const crosswalkNodes: NodeBase[] = CROSSWALKS.map((c, i) => {
    const angle = (i / 5) * Math.PI * 2 - Math.PI / 2 + 0.6;
    return { ...c, x: cx + Math.cos(angle) * 56, y: cy + Math.sin(angle) * 56, type: "crosswalk", id: c.name };
  });

  const edges = PATHWAY_CENTER.filter(d => d.n > 0).map(d => {
    const from = pathwayNodes.find(n => n.id === d.pw);
    const to = centerNodes.find(n => n.id === d.c);
    return from && to ? { from, to, count: d.n } : null;
  }).filter(Boolean) as { from: NodeBase; to: NodeBase; count: number }[];

  const selectNode = (n: NodeBase) => setSelectedNode(selectedNode?.id === n.id ? null : n);

  const arcPath = (x1: number, y1: number, x2: number, y2: number) => {
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const dx = mx - cx, dy = my - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const bulge = 40;
    const ox = mx + (dx / dist) * bulge, oy = my + (dy / dist) * bulge;
    return `M ${x1} ${y1} Q ${ox} ${oy} ${x2} ${y2}`;
  };

  return (
    <div style={{ background: "#0f1419", color: "#e8e6e3", fontFamily: "system-ui, -apple-system, sans-serif", borderRadius: 12, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "20px 28px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #e53e3e, #dd6b20, #d69e2e, #38a169, #3182ce, #805ad5)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#0f1419", border: "2px solid #e8e6e3" }} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em" }}>
                <span style={{ color: "#C75B2A" }}>Civic Knowledge Graph</span>
              </h1>
              <p style={{ margin: 0, fontSize: 11, color: "#5a6b7f", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                {STATS.totalRecords.toLocaleString()} records · {STATS.totalEdges.toLocaleString()}+ edges · {STATS.objectTypes} object types · {STATS.tables} tables
              </p>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 5 }}>
          {[
            { id: "galaxy", label: "🌌 Galaxy" },
            { id: "flows", label: "🔗 Flows" },
            { id: "stats", label: "📊 Stats" },
          ].map(v => (
            <button key={v.id} onClick={() => setView(v.id)} style={{
              padding: "7px 14px", borderRadius: 8, border: "1px solid",
              borderColor: view === v.id ? "#C75B2A" : "#2a3441",
              background: view === v.id ? "rgba(199,91,42,0.15)" : "transparent",
              color: view === v.id ? "#C75B2A" : "#8b9baf",
              cursor: "pointer", fontSize: 12, fontWeight: 500,
            }}>
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pipeline pulse */}
      <div style={{ padding: "10px 28px", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#38a169", boxShadow: "0 0 6px #38a169" }} />
        <span style={{ fontSize: 11, color: "#38a169" }}>Pipeline Active</span>
        <span style={{ fontSize: 11, color: "#2a3441" }}>•</span>
        <span style={{ fontSize: 11, color: "#5a6b7f" }}>
          {STATS.totalEdges.toLocaleString()} connections · {STATS.content} published · 8 cron jobs · {STATS.bridging} bridging areas
        </span>
      </div>

      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes explode{0%{r:2;opacity:.8}100%{r:60;opacity:0}}
      `}</style>

      {/* GALAXY VIEW */}
      {view === "galaxy" && (
        <div style={{ padding: "0 28px 28px" }}>
          <div style={{ display: "flex", gap: 4, marginBottom: 10, flexWrap: "wrap" }}>
            {([
              { key: "centers" as LayerKey, label: "Centers", icon: "🏠", color: "#6366f1" },
              { key: "lifeSit" as LayerKey, label: "Life Situations", icon: "💡", color: "#10b981" },
              { key: "pathways" as LayerKey, label: "Pathways", icon: "🛤️", color: "#C75B2A" },
              { key: "bridging" as LayerKey, label: "Bridges", icon: "🌉", color: "#d53f8c" },
              { key: "sdgs" as LayerKey, label: "12 SDGs", icon: "🌐", color: "#dd6b20" },
              { key: "sdoh" as LayerKey, label: "SDOH", icon: "🏥", color: "#805ad5" },
              { key: "crosswalks" as LayerKey, label: "Rosetta", icon: "🔮", color: "#319795" },
              { key: "domains" as LayerKey, label: "24 Objects", icon: "🧱", color: "#dd6b20" },
              { key: "sources" as LayerKey, label: "Sources", icon: "📡", color: "#d53f8c" },
            ]).map(l => (
              <button key={l.key} onClick={() => toggleLayer(l.key)} style={{
                padding: "4px 9px", borderRadius: 16, fontSize: 10, fontWeight: 600,
                border: `1px solid ${layers[l.key as LayerKey] ? l.color + "60" : "#1e2d3d"}`,
                background: layers[l.key as LayerKey] ? l.color + "15" : "transparent",
                color: layers[l.key as LayerKey] ? l.color : "#3d4f63",
                cursor: "pointer", transition: "all 0.2s",
              }}>
                {l.icon} {l.label}
              </button>
            ))}
          </div>

          <svg viewBox="0 0 1000 900" style={{ width: "100%", maxHeight: "72vh", background: "radial-gradient(ellipse at 50% 50%, #141d26 0%, #0c1117 60%, #080b0f 100%)", borderRadius: 12 }}>
            <defs>
              <radialGradient id="coreGlow">
                <stop offset="0%" stopColor="#C75B2A" stopOpacity={0.14} />
                <stop offset="40%" stopColor="#C75B2A" stopOpacity={0.04} />
                <stop offset="100%" stopColor="#C75B2A" stopOpacity={0} />
              </radialGradient>
              <radialGradient id="innerGlow">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.06} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
              </radialGradient>
              <radialGradient id="sdgGlow">
                <stop offset="0%" stopColor="#dd6b20" stopOpacity={0.05} />
                <stop offset="100%" stopColor="#dd6b20" stopOpacity={0} />
              </radialGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="b" />
                <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="bigGlow">
                <feGaussianBlur stdDeviation="6" result="b" />
                <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {/* Orbital ring guides */}
            {layers.crosswalks && <circle cx={cx} cy={cy} r={56} fill="none" stroke="#319795" strokeWidth={0.4} strokeDasharray="2 4" opacity={0.25} />}
            {layers.centers && <circle cx={cx} cy={cy} r={95} fill="none" stroke="#1a2332" strokeWidth={0.5} opacity={0.35} />}
            {layers.lifeSit && <circle cx={cx} cy={cy} r={140} fill="none" stroke="#10b981" strokeWidth={0.3} strokeDasharray="1 8" opacity={0.12} />}
            {layers.pathways && <circle cx={cx} cy={cy} r={195} fill="none" stroke="#1a2332" strokeWidth={0.5} strokeDasharray="3 6" opacity={0.3} />}
            {layers.sdgs && <circle cx={cx} cy={cy} r={248} fill="none" stroke="#dd6b20" strokeWidth={0.3} strokeDasharray="2 6" opacity={0.2} />}
            {layers.sdoh && <circle cx={cx} cy={cy} r={300} fill="none" stroke="#1a2332" strokeWidth={0.4} strokeDasharray="4 10" opacity={0.2} />}
            {layers.domains && <circle cx={cx} cy={cy} r={390} fill="none" stroke="#1a2332" strokeWidth={0.3} strokeDasharray="2 14" opacity={0.12} />}
            {layers.sources && <circle cx={cx} cy={cy} r={468} fill="none" stroke="#1a2332" strokeWidth={0.2} strokeDasharray="1 16" opacity={0.08} />}

            <circle cx={cx} cy={cy} r={210} fill="url(#coreGlow)" />
            <circle cx={cx} cy={cy} r={115} fill="url(#innerGlow)" />
            {layers.sdgs && <circle cx={cx} cy={cy} r={265} fill="url(#sdgGlow)" />}

            {/* Classification explosion */}
            {showExplosion && DIMENSIONS.map((d, i) => {
              const angle = (i / 9) * Math.PI * 2 - Math.PI / 2;
              const ex = cx + Math.cos(angle) * 120;
              const ey = cy + Math.sin(angle) * 120;
              return (
                <g key={`exp-${i}`}>
                  <line x1={cx} y1={cy} x2={ex} y2={ey} stroke={d.color} strokeWidth={1.5} opacity={0.5}>
                    <animate attributeName="opacity" values="0.6;0.1" dur="2s" repeatCount="indefinite" />
                  </line>
                  <circle cx={ex} cy={ey} r={4} fill={d.color} opacity={0.7}>
                    <animate attributeName="r" values="3;8;3" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.8;0.2;0.8" dur="2s" repeatCount="indefinite" />
                  </circle>
                  <text x={ex + (ex > cx ? 10 : -10)} y={ey + 3} fill={d.color} fontSize={7}
                    textAnchor={ex > cx ? "start" : "end"} fontWeight={600} opacity={0.8}>
                    {d.name} ({d.edges})
                  </text>
                </g>
              );
            })}

            {/* Source → Pipeline */}
            {layers.sources && sourceNodes.map((s, i) => {
              const pipeline = domainNodes.find(d => d.id === "pipeline");
              if (!pipeline) return null;
              return (
                <line key={`src-l-${i}`} x1={s.x} y1={s.y} x2={pipeline.x} y2={pipeline.y}
                  stroke={s.color} strokeWidth={Math.max(0.3, s.count / 18)}
                  opacity={hovered?.id === s.id ? 0.35 : 0.05} strokeDasharray="2 8">
                  <animate attributeName="stroke-dashoffset" from="0" to="-20" dur="3s" repeatCount="indefinite" />
                </line>
              );
            })}

            {/* Domain → Hub */}
            {layers.domains && domainNodes.map((d, i) => (
              <line key={`dom-l-${i}`} x1={cx} y1={cy} x2={d.x} y2={d.y}
                stroke={d.color} strokeWidth={0.4} opacity={hovered?.id === d.id ? 0.25 : 0.03} strokeDasharray="2 14" />
            ))}

            {/* SDOH → Hub */}
            {layers.sdoh && sdohNodes.map((n, i) => (
              <line key={`sdoh-l-${i}`} x1={cx} y1={cy} x2={n.x} y2={n.y}
                stroke={n.color} strokeWidth={0.5} opacity={hovered?.id === n.id ? 0.4 : 0.06} strokeDasharray="3 10" />
            ))}

            {/* SDG → Pathway */}
            {layers.sdgs && layers.pathways && sdgNodes.slice(0, 6).map((s, i) => {
              const pw = pathwayNodes[i % 7];
              return (
                <line key={`sdg-pw-${i}`} x1={s.x} y1={s.y} x2={pw.x} y2={pw.y}
                  stroke={s.color} strokeWidth={0.3} opacity={hovered?.id === s.id || hovered?.id === pw.id ? 0.3 : 0.03}
                  strokeDasharray="2 10" />
              );
            })}

            {/* Pathway → Center edges */}
            {layers.pathways && layers.centers && edges.map((e, i) => {
              const isHot = hovered?.id === e.from.id || hovered?.id === e.to.id || hoveredEdge === i;
              const w = Math.max(0.6, e.count / 5);
              return (
                <g key={`edge-${i}`} onMouseEnter={() => setHoveredEdge(i)} onMouseLeave={() => setHoveredEdge(null)}>
                  <line x1={e.from.x} y1={e.from.y} x2={e.to.x} y2={e.to.y}
                    stroke={(THEMES as any)[e.from.id]?.color || "#555"} strokeWidth={w}
                    opacity={isHot ? 0.55 : 0.07} strokeDasharray={isHot ? "none" : "3 5"} />
                  {isHot && (
                    <text x={(e.from.x + e.to.x) / 2} y={(e.from.y + e.to.y) / 2 - 6}
                      fill="#e8e6e3" fontSize={9} textAnchor="middle" style={{ pointerEvents: "none" }}>
                      {e.count}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Bridging arcs */}
            {layers.bridging && BRIDGING.map((b, i) => {
              const a = pathwayNodes.find(n => n.id === b.a);
              const bb = pathwayNodes.find(n => n.id === b.b);
              if (!a || !bb) return null;
              const isHot = hovered?.id === a.id || hovered?.id === bb.id;
              return (
                <g key={`bridge-${i}`}>
                  <path d={arcPath(a.x, a.y, bb.x, bb.y)}
                    fill="none" stroke="#d53f8c" strokeWidth={isHot ? 1.5 : 0.6}
                    opacity={isHot ? 0.4 : 0.08} strokeDasharray="4 6">
                    <animate attributeName="stroke-dashoffset" from="0" to="-20" dur="4s" repeatCount="indefinite" />
                  </path>
                  {isHot && (
                    <text x={(a.x + bb.x) / 2} y={(a.y + bb.y) / 2 - 14}
                      fill="#d53f8c" fontSize={8} textAnchor="middle" fontWeight={600}>
                      {b.shared} shared
                    </text>
                  )}
                </g>
              );
            })}

            {/* Animated particles */}
            {layers.pathways && pathwayNodes.map((p, i) => {
              const phase = ((animPhase + i * 51) % 360) / 360;
              return <circle key={`pt-${i}`} cx={p.x + (cx - p.x) * phase} cy={p.y + (cy - p.y) * phase}
                r={1.8} fill={p.color} opacity={0.5 * (1 - phase)} />;
            })}
            {layers.sources && sourceNodes.slice(0, 5).map((s, i) => {
              const pipeline = domainNodes.find(d => d.id === "pipeline");
              if (!pipeline) return null;
              const phase = ((animPhase + i * 72 + 180) % 360) / 360;
              return <circle key={`spt-${i}`} cx={s.x + (pipeline.x - s.x) * phase} cy={s.y + (pipeline.y - s.y) * phase}
                r={1.5} fill={s.color} opacity={0.4 * (1 - phase)} />;
            })}
            {layers.sdgs && sdgNodes.slice(0, 4).map((s, i) => {
              const phase = ((animPhase + i * 90 + 90) % 360) / 360;
              return <circle key={`sdgp-${i}`} cx={s.x + (cx - s.x) * phase} cy={s.y + (cy - s.y) * phase}
                r={1.3} fill={s.color} opacity={0.35 * (1 - phase)} />;
            })}

            {/* Source nodes */}
            {layers.sources && sourceNodes.map((s, i) => {
              const isH = hovered?.id === s.id;
              const r = 3.5 + s.count / 5;
              return (
                <g key={`src-${i}`} style={{ cursor: "pointer" }}
                  onMouseEnter={() => setHovered(s)} onMouseLeave={() => setHovered(null)}>
                  <circle cx={s.x} cy={s.y} r={r * 1.8} fill={s.color} opacity={isH ? 0.15 : 0} />
                  <circle cx={s.x} cy={s.y} r={r} fill={s.color} opacity={isH ? 0.85 : 0.22}
                    filter={isH ? "url(#glow)" : undefined} />
                  {(isH || s.count > 12) && (
                    <text x={s.x} y={s.y + r + 12} fill={isH ? "#e8e6e3" : "#2a3441"}
                      fontSize={7} textAnchor="middle" fontWeight={isH ? 600 : 400}>{s.name}</text>
                  )}
                  {isH && <text x={s.x} y={s.y + r + 21} fill={s.color} fontSize={8} textAnchor="middle" fontWeight={700}>{s.count}</text>}
                </g>
              );
            })}

            {/* Domain clusters */}
            {layers.domains && domainNodes.map((d) => {
              const isH = hovered?.id === d.id;
              const clusterR = 17 + d.items.length * 2.5;
              return (
                <g key={d.id} style={{ cursor: "pointer" }}
                  onMouseEnter={() => setHovered(d)} onMouseLeave={() => setHovered(null)}
                  onClick={() => selectNode(d)}>
                  <circle cx={d.x} cy={d.y} r={clusterR + 8} fill={d.color} opacity={isH ? 0.08 : 0.015} />
                  <circle cx={d.x} cy={d.y} r={16} fill="#0f1419" stroke={d.color}
                    strokeWidth={isH ? 2 : 0.7} opacity={isH ? 1 : 0.5} />
                  <text x={d.x} y={d.y + 4} fill={d.color} fontSize={9} textAnchor="middle" fontWeight={800}>{d.items.length}</text>
                  <text x={d.x} y={d.y + (d.y < cy ? -(clusterR + 4) : clusterR + 10)}
                    fill={isH ? d.color : "#2a3441"} fontSize={8} textAnchor="middle" fontWeight={600}>{d.name}</text>
                  {d.items.map((item: any, j: number) => {
                    const a = (j / d.items.length) * Math.PI * 2 - Math.PI / 2;
                    const sx = d.x + Math.cos(a) * clusterR;
                    const sy = d.y + Math.sin(a) * clusterR;
                    const dotR = 2 + Math.log10(item.count + 1) * 1.5;
                    return (
                      <g key={`${d.id}-${j}`}>
                        <circle cx={sx} cy={sy} r={dotR} fill={d.color} opacity={isH ? 0.65 : 0.12} />
                        {isH && <text x={sx} y={sy - dotR - 3} fill={d.color} fontSize={6} textAnchor="middle" fontWeight={600}>{item.icon} {item.count}</text>}
                      </g>
                    );
                  })}
                </g>
              );
            })}

            {/* SDOH */}
            {layers.sdoh && sdohNodes.map((n) => {
              const isH = hovered?.id === n.id;
              const r = 9 + n.count / 7;
              return (
                <g key={n.id} style={{ cursor: "pointer" }}
                  onMouseEnter={() => setHovered(n)} onMouseLeave={() => setHovered(null)}
                  onClick={() => selectNode(n)}>
                  <circle cx={n.x} cy={n.y} r={r * 1.6} fill={n.color} opacity={isH ? 0.12 : 0.03} />
                  <circle cx={n.x} cy={n.y} r={r} fill={n.color} opacity={isH ? 0.75 : 0.3}
                    filter={isH ? "url(#glow)" : undefined} />
                  <text x={n.x} y={n.y + 3.5} fill="#fff" fontSize={8} textAnchor="middle" fontWeight={700}>{n.count}</text>
                  <text x={n.x} y={n.y + (n.y < cy ? -(r + 7) : r + 13)}
                    fill={isH ? n.color : "#2a3441"} fontSize={8.5} textAnchor="middle" fontWeight={500}>{n.short}</text>
                </g>
              );
            })}

            {/* SDGs */}
            {layers.sdgs && sdgNodes.map((s) => {
              const isH = hovered?.id === s.id;
              const r = 4 + Math.log2(s.count + 1) * 2;
              return (
                <g key={`sdg-${s.id}`} style={{ cursor: "pointer" }}
                  onMouseEnter={() => setHovered(s)} onMouseLeave={() => setHovered(null)}
                  onClick={() => selectNode(s)}>
                  <circle cx={s.x} cy={s.y} r={r * 2} fill={s.color} opacity={isH ? 0.15 : 0.03} />
                  <circle cx={s.x} cy={s.y} r={r} fill={s.color} opacity={isH ? 0.8 : 0.25}
                    filter={isH ? "url(#glow)" : undefined} />
                  {isH ? (
                    <>
                      <text x={s.x} y={s.y + 3} fill="#fff" fontSize={7} textAnchor="middle" fontWeight={700}>{s.count}</text>
                      <text x={s.x} y={s.y + (s.y < cy ? -(r + 6) : r + 12)}
                        fill={s.color} fontSize={7} textAnchor="middle" fontWeight={600}>
                        SDG {s.id}: {s.name}
                      </text>
                    </>
                  ) : (
                    <text x={s.x} y={s.y + 3} fill="#fff" fontSize={6} textAnchor="middle" fontWeight={600} opacity={0.7}>
                      {s.id}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Pathways */}
            {layers.pathways && pathwayNodes.map((n, i) => {
              const isH = hovered?.id === n.id;
              const isSel = selectedNode?.id === n.id;
              return (
                <g key={n.id} style={{ cursor: "pointer" }}
                  onMouseEnter={() => setHovered(n)} onMouseLeave={() => setHovered(null)}
                  onClick={() => selectNode(n)}>
                  <circle cx={n.x} cy={n.y} r={16 + n.content / 3} fill={n.color} opacity={0}>
                    <animate attributeName="opacity" values="0;0.1;0" dur="3s" begin={`${i * 0.4}s`} repeatCount="indefinite" />
                    <animate attributeName="r" values={`${16 + n.content / 3};${26 + n.content / 3};${16 + n.content / 3}`} dur="3s" begin={`${i * 0.4}s`} repeatCount="indefinite" />
                  </circle>
                  <circle cx={n.x} cy={n.y} r={21} fill="#111822" stroke={n.color}
                    strokeWidth={isH || isSel ? 2.5 : 1.5} />
                  <text x={n.x} y={n.y + 1} fill="#e8e6e3" fontSize={15} textAnchor="middle" dominantBaseline="middle">{n.emoji}</text>
                  <text x={n.x} y={n.y + (n.y < cy ? -29 : 34)} fill={n.color} fontSize={10} textAnchor="middle" fontWeight={600}>{n.name}</text>
                  <text x={n.x} y={n.y + (n.y < cy ? -18 : 45)} fill="#3d4f63" fontSize={8} textAnchor="middle">
                    {n.content} · {n.focus} focus
                  </text>
                </g>
              );
            })}

            {/* Life Situations */}
            {layers.lifeSit && lifeSitNodes.map((s, i) => {
              const isH = hovered?.id === s.id;
              return (
                <g key={`ls-${i}`} style={{ cursor: "pointer" }}
                  onMouseEnter={() => setHovered(s)} onMouseLeave={() => setHovered(null)}>
                  <circle cx={s.x} cy={s.y} r={isH ? 11 : 6} fill="#10b981" opacity={isH ? 0.3 : 0.08} />
                  <text x={s.x} y={s.y + 4} fill="#e8e6e3" fontSize={isH ? 10 : 8} textAnchor="middle">{s.emoji}</text>
                  {isH && (
                    <text x={s.x} y={s.y + 18} fill="#10b981" fontSize={7} textAnchor="middle" fontWeight={600}>
                      {s.name}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Centers */}
            {layers.centers && centerNodes.map((n) => {
              const isH = hovered?.id === n.id;
              return (
                <g key={n.id} style={{ cursor: "pointer" }}
                  onMouseEnter={() => setHovered(n)} onMouseLeave={() => setHovered(null)}
                  onClick={() => selectNode(n)}>
                  <circle cx={n.x} cy={n.y} r={30} fill={n.color} opacity={isH ? 0.12 : 0.04} />
                  <circle cx={n.x} cy={n.y} r={22} fill="#111822" stroke={n.color} strokeWidth={isH ? 2.5 : 1.5} />
                  <text x={n.x} y={n.y + 1} fill="#e8e6e3" fontSize={16} textAnchor="middle" dominantBaseline="middle">{n.emoji}</text>
                  <text x={n.x} y={n.y + 34} fill={n.color} fontSize={9.5} textAnchor="middle" fontWeight={600}>{n.name}</text>
                  <text x={n.x} y={n.y + 45} fill="#3d4f63" fontSize={8} textAnchor="middle">{n.count}</text>
                </g>
              );
            })}

            {/* Rosetta Stone */}
            {layers.crosswalks && crosswalkNodes.map((c) => {
              const isH = hovered?.id === c.id;
              return (
                <g key={c.id} style={{ cursor: "pointer" }}
                  onMouseEnter={() => setHovered(c)} onMouseLeave={() => setHovered(null)}>
                  <circle cx={c.x} cy={c.y} r={isH ? 8 : 5} fill={c.color}
                    opacity={isH ? 0.8 : 0.3} filter={isH ? "url(#glow)" : undefined} />
                  {isH && (
                    <>
                      <text x={c.x} y={c.y - 12} fill={c.color} fontSize={8} textAnchor="middle" fontWeight={700}>{c.name}</text>
                      <text x={c.x} y={c.y + 16} fill="#5a6b7f" fontSize={7} textAnchor="middle">{c.full}</text>
                    </>
                  )}
                </g>
              );
            })}

            {/* Central Hub */}
            <g style={{ cursor: "pointer" }} onClick={() => setShowExplosion(!showExplosion)}>
              <circle cx={cx} cy={cy} r={32} fill="#111822" stroke="#C75B2A" strokeWidth={2} filter="url(#glow)" />
              <text x={cx} y={cy - 9} fill="#C75B2A" fontSize={7} textAnchor="middle" fontWeight={700} letterSpacing="0.1em">CHANGE</text>
              <text x={cx} y={cy + 1} fill="#C75B2A" fontSize={7} textAnchor="middle" fontWeight={700} letterSpacing="0.1em">ENGINE</text>
              <text x={cx} y={cy + 13} fill="#5a6b7f" fontSize={5.5} textAnchor="middle">312 focus · 5 systems</text>
              <text x={cx} y={cy + 21} fill="#3d4f63" fontSize={5} textAnchor="middle">{showExplosion ? "click to hide 9D" : "click for 9D explosion"}</text>
            </g>

            {/* Ring labels */}
            {layers.crosswalks && <text x={28} y={cy - 20} fill="#319795" fontSize={7} fontWeight={600} opacity={0.35}>ROSETTA</text>}
            {layers.centers && <text x={28} y={cy - 60} fill="#1e2d3d" fontSize={7} fontWeight={600}>CENTERS</text>}
            {layers.lifeSit && <text x={28} y={cy - 107} fill="#10b981" fontSize={7} fontWeight={600} opacity={0.3}>LIFE SITUATIONS</text>}
            {layers.pathways && <text x={28} y={cy - 165} fill="#1e2d3d" fontSize={7} fontWeight={600}>PATHWAYS</text>}
            {layers.sdgs && <text x={28} y={cy - 215} fill="#dd6b20" fontSize={7} fontWeight={600} opacity={0.35}>12 SDGs</text>}
            {layers.sdoh && <text x={28} y={cy - 268} fill="#1e2d3d" fontSize={7} fontWeight={600}>SDOH</text>}
            {layers.domains && <text x={28} y={cy - 356} fill="#1e2d3d" fontSize={7} fontWeight={600}>24 OBJECTS</text>}
            {layers.sources && <text x={28} y={cy - 430} fill="#1e2d3d" fontSize={7} fontWeight={600}>SOURCES</text>}

            {/* Mini pipeline */}
            <g transform="translate(870, 820)">
              <text x={0} y={-8} fill="#3d4f63" fontSize={7} fontWeight={600}>PIPELINE</text>
              {[
                { label: "IN", val: "233", color: "#6366f1", x: 0 },
                { label: "AI", val: "0.95", color: "#f59e0b", x: 30 },
                { label: "PUB", val: "195", color: "#38a169", x: 60 },
                { label: "TR", val: "170", color: "#C75B2A", x: 90 },
              ].map((s, i) => (
                <g key={i}>
                  <rect x={s.x} y={0} width={25} height={20} rx={3} fill={s.color + "15"} stroke={s.color + "30"} strokeWidth={0.5} />
                  <text x={s.x + 12.5} y={9} fill="#5a6b7f" fontSize={5} textAnchor="middle">{s.label}</text>
                  <text x={s.x + 12.5} y={17} fill={s.color} fontSize={6} textAnchor="middle" fontWeight={700}>{s.val}</text>
                  {i < 3 && <text x={s.x + 27} y={13} fill="#2a3441" fontSize={8}>→</text>}
                </g>
              ))}
              <circle cx={-10} cy={10} r={3} fill="#38a169" opacity={0.7}>
                <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite" />
              </circle>
            </g>
          </svg>

          {/* Detail panel */}
          {selectedNode && (
            <div style={{ marginTop: 12, padding: 16, background: "#111822", borderRadius: 12, border: `1px solid ${selectedNode.color || "#2a3441"}30` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0, fontSize: 16, color: selectedNode.color || "#e8e6e3" }}>
                  {selectedNode.emoji || selectedNode.icon || "🔍"} {selectedNode.name}
                </h3>
                <button onClick={() => setSelectedNode(null)} style={{ background: "none", border: "none", color: "#5a6b7f", cursor: "pointer", fontSize: 14 }}>✕</button>
              </div>
              <div style={{ marginTop: 8, fontSize: 13, color: "#8b9baf", lineHeight: 1.6 }}>
                {selectedNode.type === "pathway" && <>{selectedNode.content} items across {selectedNode.focus} focus areas. Connected to all 4 Centers with bridging areas to adjacent pathways.</>}
                {selectedNode.type === "center" && <>Answers &ldquo;{selectedNode.question}&rdquo; — {selectedNode.count} items through all 7 pathways, connected to 25 life situations.</>}
                {selectedNode.type === "sdoh" && <>{selectedNode.count} items under &ldquo;{selectedNode.name}&rdquo; — one of 5 Social Determinant of Health domains.</>}
                {selectedNode.type === "sdg" && <>UN Sustainable Development Goal {selectedNode.id}: &ldquo;{selectedNode.name}&rdquo; — {selectedNode.count} content items mapped to this global goal.</>}
                {selectedNode.type === "domain" && (
                  <div>
                    <div style={{ marginBottom: 8 }}>{selectedNode.items.length} object types · {selectedNode.totalCount.toLocaleString()} records</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {selectedNode.items.map((item: any, j: number) => (
                        <span key={j} style={{ padding: "3px 10px", borderRadius: 6, fontSize: 12, background: selectedNode.color + "12", border: `1px solid ${selectedNode.color}25` }}>
                          {item.icon} {item.name}: <strong>{item.count}</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* FLOWS VIEW */}
      {view === "flows" && (
        <div style={{ padding: "0 28px 28px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 2, alignItems: "start" }}>
            <div>
              <h3 style={{ fontSize: 12, color: "#5a6b7f", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Sources</h3>
              {[
                { name: "RSS Feeds", count: "10", color: "#3182ce" },
                { name: "Manual URLs", count: "∞", color: "#38a169" },
                { name: "CSV Upload", count: "bulk", color: "#d69e2e" },
              ].map(s => (
                <div key={s.name} style={{ padding: "8px 10px", background: "#1a2332", borderRadius: 8, marginBottom: 5, borderLeft: `3px solid ${s.color}` }}>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>{s.name}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.count}</div>
                </div>
              ))}
            </div>
            <div>
              <h3 style={{ fontSize: 12, color: "#5a6b7f", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Pipeline</h3>
              {[
                { name: "Inbox", val: "233", color: "#6366f1", sub: "" },
                { name: "AI Classify", val: "0.95", color: "#f59e0b", sub: "9 dimensions" },
                { name: "Published", val: "195", color: "#38a169", sub: "" },
                { name: "Translated", val: "170", color: "#C75B2A", sub: "ES + VI" },
              ].map((s, i) => (
                <div key={s.name}>
                  <div style={{ padding: "8px 10px", background: "#1a2332", borderRadius: 8, marginBottom: 2, borderLeft: `3px solid ${s.color}` }}>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>{s.name}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.val}</div>
                    {s.sub && <div style={{ fontSize: 10, color: "#5a6b7f" }}>{s.sub}</div>}
                  </div>
                  {i < 3 && <div style={{ textAlign: "center", fontSize: 16, color: "#2a3441", padding: 1 }}>↓</div>}
                </div>
              ))}
            </div>
            <div>
              <h3 style={{ fontSize: 12, color: "#5a6b7f", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>7 Pathways</h3>
              {Object.entries(THEMES).map(([id, t]) => (
                <div key={id} style={{ padding: "5px 8px", background: "#1a2332", borderRadius: 6, marginBottom: 3, borderLeft: `3px solid ${t.color}`, display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11 }}>{t.emoji} {t.name}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: t.color }}>{t.content}</span>
                </div>
              ))}
            </div>
            <div>
              <h3 style={{ fontSize: 12, color: "#5a6b7f", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>4 Centers</h3>
              {Object.entries(CENTERS).map(([name, c]) => (
                <div key={name} style={{ padding: "10px", background: "#1a2332", borderRadius: 8, marginBottom: 5, borderLeft: `3px solid ${c.color}` }}>
                  <div style={{ fontSize: 20 }}>{c.emoji}</div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{name}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: c.color }}>{c.count}</div>
                </div>
              ))}
            </div>
            <div>
              <h3 style={{ fontSize: 12, color: "#5a6b7f", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Crosswalks</h3>
              <div style={{ padding: "8px 10px", background: "#1a2332", borderRadius: 8, marginBottom: 5 }}>
                <div style={{ fontSize: 11, color: "#319795", fontWeight: 600 }}>🔮 Rosetta Stone</div>
                <div style={{ fontSize: 10, color: "#5a6b7f", margin: "4px 0" }}>312 × 5 systems</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#319795" }}>1,560</div>
              </div>
              <div style={{ padding: "8px 10px", background: "#1a2332", borderRadius: 8, marginBottom: 5 }}>
                <div style={{ fontSize: 11, color: "#8b9baf" }}>UN SDGs</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 2, marginTop: 3 }}>
                  {SDG_DATA.slice(0, 6).map(s => (
                    <span key={s.id} style={{ fontSize: 9, padding: "1px 5px", borderRadius: 8, background: "#2a3441" }}>
                      #{s.id}: {s.count}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ padding: "8px 10px", background: "#1a2332", borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: "#8b9baf" }}>SDOH</div>
                {SDOH.map(s => (
                  <div key={s.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: s.color }}>
                    <span>{s.short}</span><span style={{ fontWeight: 700 }}>{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STATS VIEW */}
      {view === "stats" && (
        <div style={{ padding: "0 28px 28px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
            {[
              { label: "Content Nodes", value: STATS.content, color: "#C75B2A", sub: "Classified & published" },
              { label: "Knowledge Edges", value: STATS.totalEdges.toLocaleString(), color: "#6366f1", sub: "Cross-dimension connections" },
              { label: "Object Types", value: STATS.objectTypes, color: "#dd6b20", sub: "Across 8 domains" },
              { label: "Focus Areas", value: STATS.focusAreas, color: "#319795", sub: "Universal taxonomy" },
              { label: "Translations", value: STATS.translations, color: "#f59e0b", sub: "Spanish + Vietnamese" },
              { label: "Services", value: STATS.services, color: "#e53e3e", sub: "211 directory entries" },
              { label: "Officials", value: STATS.officials, color: "#3182ce", sub: "Federal → City" },
              { label: "ZIP Codes", value: STATS.zipCodes, color: "#805ad5", sub: "Houston metro coverage" },
              { label: "Neighborhoods", value: STATS.neighborhoods, color: "#d69e2e", sub: "With demographics" },
              { label: "Resources", value: STATS.resources, color: "#319795", sub: "Guides & tools" },
              { label: "Organizations", value: STATS.orgs, color: "#dd6b20", sub: "Nonprofits & agencies" },
              { label: "Bridging Areas", value: STATS.bridging, color: "#d53f8c", sub: "Focus areas spanning pathways" },
            ].map(s => (
              <div key={s.label} style={{ padding: 14, background: "#1a2332", borderRadius: 10, borderTop: `3px solid ${s.color}` }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{typeof s.value === "number" ? s.value.toLocaleString() : s.value}</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{s.label}</div>
                <div style={{ fontSize: 11, color: "#5a6b7f", marginTop: 2 }}>{s.sub}</div>
              </div>
            ))}
          </div>

          <div style={{ padding: 18, background: "#1a2332", borderRadius: 12, border: "1px solid #2a3441", marginBottom: 16 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 15, color: "#C75B2A" }}>9-Dimension Classification Explosion</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {DIMENSIONS.map(d => (
                <div key={d.name} style={{ padding: 10, background: "#0f1419", borderRadius: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{d.name}</span>
                    <span style={{ fontSize: 16, fontWeight: 800, color: d.color }}>{d.edges}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14, padding: 10, background: "rgba(199,91,42,0.1)", borderRadius: 8, textAlign: "center" }}>
              <span style={{ fontSize: 13, color: "#C75B2A" }}>
                195 × 9 = <strong>2,755+ edges</strong> + 1,560 crosswalks = <strong>4,315+ total connections</strong>
              </span>
            </div>
          </div>

          <div style={{ padding: 18, background: "rgba(49,151,149,0.06)", borderRadius: 12, border: "1px solid rgba(49,151,149,0.15)" }}>
            <h3 style={{ margin: "0 0 10px", fontSize: 15, color: "#319795" }}>🔮 Rosetta Stone</h3>
            <div style={{ fontSize: 13, color: "#8b9baf", lineHeight: 1.6, marginBottom: 12 }}>
              312 focus areas × 5 systems = <strong style={{ color: "#319795" }}>1,560 crosswalks</strong>. A universal translator between nonprofits (NTEE), the UN (SDGs), health (SDOH), 211 (AIRS), and 7 Pathways.
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {CROSSWALKS.map(c => (
                <div key={c.name} style={{ padding: "6px 12px", background: c.color + "12", border: `1px solid ${c.color}25`, borderRadius: 8, textAlign: "center" }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: c.color }}>{c.count}</div>
                  <div style={{ fontSize: 10, color: "#8b9baf" }}>{c.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: "14px 28px", borderTop: "1px solid #1a2332", display: "flex", justifyContent: "space-between", color: "#3d4f63", fontSize: 11 }}>
        <span>The Change Engine — Community Life, Organized</span>
        <span>Houston, TX · 8 cron jobs · v3 Ultimate Galaxy</span>
      </div>
    </div>
  );
}
