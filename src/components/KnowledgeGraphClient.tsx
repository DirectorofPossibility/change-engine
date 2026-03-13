/**
 * @fileoverview SVG-based knowledge graph visualization for the Civic Knowledge Galaxy.
 *
 * Renders an interactive force-directed graph with pan/zoom, search, and
 * click-to-inspect functionality. Each node carries approximately 35
 * dimensions across five groups: classification (14), actions (7), graph
 * edges (5), content rings (5), and metadata (4). The graph visualizes
 * 7 pathways, 4 centers, 5 SDOH domains, 12 SDGs, and 164 focus areas
 * as interconnected nodes with no orphans or dead ends.
 *
 * The component is entirely client-side (`'use client'`) and self-contained,
 * embedding its own data constants for themes, centers, SDOH, SDGs, and
 * focus areas. It renders to an SVG canvas with mouse-driven panning and
 * wheel-driven zooming.
 */
'use client'

import { useState, useEffect, useRef, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════
// THE CHANGE ENGINE — CIVIC KNOWLEDGE MESH v5
// ~35 dimensions per node · Seamless wayfinder mirror
// 5 rings · 7 pathways · 4 centers · 164 focus areas
// Every node interconnects: no orphans, no dead ends.
// ═══════════════════════════════════════════════════════════════

// ─── The Mesh Model ────────────────────────────────────────────
//
// DIMENSION GROUPS (~35 per content node):
//
// CLASSIFICATION (14):
//   Theme Primary · Theme Secondary · Center · Resource Type
//   Focus Areas · SDGs · SDOH · NTEE · AIRS
//   Audiences · Life Situations · Service Categories · Skills · Geo Scope
//
// ACTIONS (7):
//   Donate · Volunteer · Signup · Register · Apply · Call · Attend
//
// GRAPH EDGES (5):
//   Organizations · Translations (ES/VI) · Internal Cross-refs · Keywords · Source
//
// CONTENT RINGS (5):
//   Resources · Guides · 211 Services · Officials · Policies
//
// METADATA (4):
//   Engagement Level · Reading Level · Confidence · Review Status
//
// ═══════════════════════════════════════════════════════════════

// ─── 7 Pathways ────────────────────────────────────────────────

const THEMES: Record<string, {
  name: string; color: string; emoji: string; content: number; focus: number;
  sdoh: string[]; sdgs: number[]; audiences: string[];
  rings: { resources: number; guides: number; services: number; officials: number; policies: number };
  orgs: string[];
}> = {
  THEME_01: { name: "Health", color: "#1a6b56", emoji: "❤️", content: 25, focus: 45, sdoh: ["HC", "SC"], sdgs: [3, 2], audiences: ["hard-worker", "looking-for-answers"], rings: { resources: 18, guides: 3, services: 15, officials: 8, policies: 4 }, orgs: ["Legacy Health", "Houston Food Bank"] },
  THEME_02: { name: "Families", color: "#1e4d7a", emoji: "👨‍👩‍👧‍👦", content: 48, focus: 44, sdoh: ["SC", "ED"], sdgs: [4, 5, 10], audiences: ["starter", "hard-worker"], rings: { resources: 26, guides: 5, services: 20, officials: 10, policies: 6 }, orgs: ["YMCA Houston", "BakerRipley"] },
  THEME_03: { name: "Neighborhood", color: "#4a2870", emoji: "🏘️", content: 44, focus: 45, sdoh: ["NB", "SC"], sdgs: [11, 2], audiences: ["scout", "bridge-builder"], rings: { resources: 17, guides: 4, services: 18, officials: 12, policies: 8 }, orgs: ["Houston Habitat", "houstontx.gov"] },
  THEME_04: { name: "Voice", color: "#7a2018", emoji: "🗳️", content: 44, focus: 45, sdoh: ["SC"], sdgs: [16, 10], audiences: ["spark-plug", "register"], rings: { resources: 8, guides: 2, services: 5, officials: 20, policies: 12 }, orgs: ["houstontx.gov"] },
  THEME_05: { name: "Money", color: "#6a4e10", emoji: "💰", content: 16, focus: 44, sdoh: ["EA"], sdgs: [1, 8], audiences: ["hard-worker", "next-steps"], rings: { resources: 4, guides: 2, services: 12, officials: 6, policies: 5 }, orgs: ["BakerRipley", "YMCA Houston"] },
  THEME_06: { name: "Planet", color: "#1a5030", emoji: "🌍", content: 10, focus: 45, sdoh: ["NB"], sdgs: [13, 15, 11], audiences: ["scout", "spark-plug"], rings: { resources: 3, guides: 1, services: 4, officials: 4, policies: 3 }, orgs: ["houstontx.gov"] },
  THEME_07: { name: "The Bigger We", color: "#1b5e8a", emoji: "🤝", content: 8, focus: 44, sdoh: ["SC"], sdgs: [16, 17, 10], audiences: ["bridge-builder", "spark-plug"], rings: { resources: 2, guides: 1, services: 3, officials: 6, policies: 2 }, orgs: ["BakerRipley"] },
};

// ─── 4 Centers ─────────────────────────────────────────────────

const CENTERS: Record<string, { emoji: string; color: string; count: number; question: string; sdoh: string[]; sdgs: number[]; orgs: string[]; geos: string[] }> = {
  Learning:       { emoji: "📚", color: "#6366f1", count: 81, question: "How can I understand?", sdoh: ["HC", "ED", "SC"], sdgs: [3, 4, 16], orgs: ["ORG_ymca_houston", "ORG_legacy_health", "ORG_houston_public_media", "ORG_khou"], geos: ["GEO_montrose", "GEO_heights", "GEO_gulfton", "GEO_spring_branch", "GEO_alief"] },
  Resource:       { emoji: "📋", color: "#10b981", count: 78, question: "What's available to me?", sdoh: ["SC", "EA", "NB", "HC", "ED"], sdgs: [1, 2, 3, 8, 11], orgs: ["ORG_houston_food_bank", "ORG_baker_ripley", "ORG_ymca_houston", "ORG_legacy_health", "ORG_houston_habitat"], geos: ["GEO_third_ward", "GEO_east_end", "GEO_sunnyside", "GEO_gulfton", "GEO_fifth_ward", "GEO_kashmere_gardens", "GEO_alief", "GEO_spring_branch"] },
  Action:         { emoji: "✊", color: "#f59e0b", count: 28, question: "How can I help?", sdoh: ["SC", "NB"], sdgs: [2, 11, 13, 16], orgs: ["ORG_houston_food_bank", "ORG_baker_ripley", "ORG_houstontx_gov"], geos: ["GEO_third_ward", "GEO_east_end", "GEO_sunnyside", "GEO_kashmere_gardens"] },
  Accountability: { emoji: "🏛️", color: "#8b5cf6", count: 8,  question: "Who makes decisions?", sdoh: ["SC", "NB", "EA"], sdgs: [16, 10, 1, 11], orgs: ["ORG_houstontx_gov", "ORG_houston_public_media", "ORG_sa_report"], geos: ["GEO_third_ward", "GEO_east_end", "GEO_fifth_ward", "GEO_sunnyside", "GEO_sharpstown", "GEO_kashmere_gardens"] },
};

// ─── 5 SDOH Domains ────────────────────────────────────────────

const SDOH = [
  { id: "SC", name: "Social & Community", short: "Social", color: "#1b5e8a", count: 73, themes: ["THEME_02", "THEME_04", "THEME_07"], sdgs: [16, 10, 17] },
  { id: "NB", name: "Neighborhood", short: "Neighbor", color: "#4a2870", count: 65, themes: ["THEME_03", "THEME_06"], sdgs: [11, 2, 13] },
  { id: "HC", name: "Healthcare", short: "Health", color: "#1a6b56", count: 23, themes: ["THEME_01"], sdgs: [3] },
  { id: "ED", name: "Education", short: "Edu", color: "#7a2018", count: 17, themes: ["THEME_02", "THEME_05"], sdgs: [4] },
  { id: "EA", name: "Economic Stability", short: "Econ", color: "#6a4e10", count: 17, themes: ["THEME_05"], sdgs: [1, 8] },
];

// ─── 12 SDGs ───────────────────────────────────────────────────

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

// ─── 12 Life Situations (full mesh) ───────────────────────────

const LIFE_SITUATIONS = [
  { name: "Find food", emoji: "🍎", count: 12, themes: ["THEME_01", "THEME_02"], centers: ["Resource", "Action"], sdoh: "SC", sdg: 2, airs: "BD-1800", services: ["food-pantry", "snap-benefits"], audiences: ["hard-worker", "looking-for-answers"], orgs: ["Houston Food Bank", "BakerRipley"] },
  { name: "Pay rent", emoji: "🏠", count: 8, themes: ["THEME_05", "THEME_03"], centers: ["Resource", "Accountability"], sdoh: "EA", sdg: 1, airs: "BH-3800", services: ["rental-assistance", "housing-counseling"], audiences: ["hard-worker"], orgs: ["BakerRipley", "Houston Habitat"] },
  { name: "Get healthcare", emoji: "🏥", count: 10, themes: ["THEME_01"], centers: ["Resource", "Learning"], sdoh: "HC", sdg: 3, airs: "LF-0100", services: ["community-clinic", "medicaid-enrollment"], audiences: ["looking-for-answers", "hard-worker"], orgs: ["Legacy Health"] },
  { name: "Find a job", emoji: "💼", count: 7, themes: ["THEME_05", "THEME_07"], centers: ["Resource", "Action"], sdoh: "EA", sdg: 8, airs: "ND-2000", services: ["workforce-dev", "job-training"], audiences: ["hard-worker", "next-steps"], orgs: ["YMCA Houston", "BakerRipley"] },
  { name: "Legal help", emoji: "⚖️", count: 5, themes: ["THEME_04", "THEME_07"], centers: ["Resource", "Accountability"], sdoh: "SC", sdg: 16, airs: "FT-0000", services: ["legal-aid", "immigration-legal"], audiences: ["looking-for-answers"], orgs: ["BakerRipley", "houstontx.gov"] },
  { name: "Childcare", emoji: "👶", count: 6, themes: ["THEME_02"], centers: ["Resource"], sdoh: "SC", sdg: 4, airs: "PH-0200", services: ["childcare-subsidy", "headstart"], audiences: ["starter", "hard-worker"], orgs: ["YMCA Houston"] },
  { name: "Mental health", emoji: "🧠", count: 9, themes: ["THEME_01", "THEME_02"], centers: ["Resource", "Learning"], sdoh: "HC", sdg: 3, airs: "RF-0000", services: ["counseling", "crisis-hotline"], audiences: ["looking-for-answers"], orgs: ["Legacy Health"] },
  { name: "Immigration", emoji: "🗽", count: 4, themes: ["THEME_04", "THEME_07"], centers: ["Resource", "Accountability"], sdoh: "SC", sdg: 10, airs: "FT-1000", services: ["citizenship-classes", "immigration-legal"], audiences: ["starter", "looking-for-answers"], orgs: ["BakerRipley"] },
  { name: "Education", emoji: "🎓", count: 8, themes: ["THEME_02", "THEME_05"], centers: ["Learning", "Resource"], sdoh: "ED", sdg: 4, airs: "HD-0000", services: ["ged-classes", "tutoring"], audiences: ["starter", "next-steps"], orgs: ["YMCA Houston"] },
  { name: "Utilities", emoji: "💡", count: 5, themes: ["THEME_05", "THEME_06"], centers: ["Resource", "Accountability"], sdoh: "NB", sdg: 11, airs: "BH-1800", services: ["utility-assistance", "weatherization"], audiences: ["hard-worker"], orgs: ["houstontx.gov"] },
  { name: "Transportation", emoji: "🚌", count: 3, themes: ["THEME_03", "THEME_06"], centers: ["Resource"], sdoh: "NB", sdg: 11, airs: "BT-0000", services: ["metro-passes", "ride-programs"], audiences: ["hard-worker", "looking-for-answers"], orgs: ["houstontx.gov", "BakerRipley"] },
  { name: "Disaster help", emoji: "🌊", count: 4, themes: ["THEME_03", "THEME_06"], centers: ["Resource", "Action"], sdoh: "NB", sdg: 13, airs: "TH-0000", services: ["disaster-relief", "fema-assistance"], audiences: ["looking-for-answers", "hard-worker"], orgs: ["Houston Food Bank", "BakerRipley"] },
];

// ─── Pathway ↔ Center edges ───────────────────────────────────

const PATHWAY_CENTER = [
  { pw: "THEME_01", c: "Learning", n: 8 },  { pw: "THEME_01", c: "Resource", n: 18 },
  { pw: "THEME_01", c: "Action", n: 3 },    { pw: "THEME_01", c: "Accountability", n: 1 },
  { pw: "THEME_02", c: "Learning", n: 15 }, { pw: "THEME_02", c: "Resource", n: 26 },
  { pw: "THEME_02", c: "Action", n: 5 },    { pw: "THEME_02", c: "Accountability", n: 2 },
  { pw: "THEME_03", c: "Learning", n: 18 }, { pw: "THEME_03", c: "Resource", n: 17 },
  { pw: "THEME_03", c: "Action", n: 7 },    { pw: "THEME_03", c: "Accountability", n: 2 },
  { pw: "THEME_04", c: "Learning", n: 26 }, { pw: "THEME_04", c: "Resource", n: 8 },
  { pw: "THEME_04", c: "Action", n: 8 },    { pw: "THEME_04", c: "Accountability", n: 2 },
  { pw: "THEME_05", c: "Learning", n: 10 }, { pw: "THEME_05", c: "Resource", n: 4 },
  { pw: "THEME_05", c: "Action", n: 2 },    { pw: "THEME_05", c: "Accountability", n: 0 },
  { pw: "THEME_06", c: "Learning", n: 4 },  { pw: "THEME_06", c: "Resource", n: 3 },
  { pw: "THEME_06", c: "Action", n: 2 },    { pw: "THEME_06", c: "Accountability", n: 1 },
  { pw: "THEME_07", c: "Learning", n: 5 },  { pw: "THEME_07", c: "Resource", n: 2 },
  { pw: "THEME_07", c: "Action", n: 1 },    { pw: "THEME_07", c: "Accountability", n: 0 },
];

// ─── Bridges ──────────────────────────────────────────────────

const BRIDGING = [
  { a: "THEME_01", b: "THEME_02", shared: 12, reason: "Family health & wellness" },
  { a: "THEME_02", b: "THEME_03", shared: 15, reason: "Family housing & community" },
  { a: "THEME_03", b: "THEME_04", shared: 8, reason: "Neighborhood civic engagement" },
  { a: "THEME_04", b: "THEME_07", shared: 10, reason: "Civic voice & collective action" },
  { a: "THEME_01", b: "THEME_06", shared: 5, reason: "Environmental health" },
  { a: "THEME_05", b: "THEME_02", shared: 9, reason: "Family economic stability" },
  { a: "THEME_03", b: "THEME_06", shared: 7, reason: "Sustainable neighborhoods" },
  { a: "THEME_05", b: "THEME_04", shared: 6, reason: "Economic policy & advocacy" },
];

const MISSING_BRIDGES = [
  { a: "THEME_01", b: "THEME_05", shared: 0, reason: "Healthcare costs & medical debt" },
  { a: "THEME_01", b: "THEME_03", shared: 0, reason: "Environmental health & food deserts" },
  { a: "THEME_06", b: "THEME_07", shared: 0, reason: "Environmental justice & collective action" },
  { a: "THEME_02", b: "THEME_07", shared: 0, reason: "Family support networks & mutual aid" },
  { a: "THEME_02", b: "THEME_04", shared: 0, reason: "Family advocacy & parent voice" },
  { a: "THEME_05", b: "THEME_06", shared: 0, reason: "Green economy & sustainable jobs" },
  { a: "THEME_05", b: "THEME_07", shared: 0, reason: "Economic equity & solidarity economy" },
  { a: "THEME_01", b: "THEME_07", shared: 0, reason: "Community health workers & peer support" },
];

const MISSING_CENTER_EDGES = [
  { pw: "THEME_05", c: "Accountability", n: 0, reason: "Who regulates financial services? Who sets minimum wage?" },
  { pw: "THEME_07", c: "Accountability", n: 0, reason: "Who oversees civic organizations? Who funds community programs?" },
];

// ─── SDG ↔ SDOH cross-links ──────────────────────────────────

const SDG_SDOH_LINKS = [
  { sdg: 3, sdoh: "HC", strength: 10, label: "Good Health ↔ Healthcare Access" },
  { sdg: 4, sdoh: "ED", strength: 8, label: "Quality Education ↔ Education Access" },
  { sdg: 1, sdoh: "EA", strength: 9, label: "No Poverty ↔ Economic Stability" },
  { sdg: 8, sdoh: "EA", strength: 7, label: "Decent Work ↔ Economic Stability" },
  { sdg: 11, sdoh: "NB", strength: 8, label: "Sustainable Cities ↔ Neighborhood" },
  { sdg: 16, sdoh: "SC", strength: 7, label: "Peace & Justice ↔ Social & Community" },
  { sdg: 2, sdoh: "NB", strength: 6, label: "Zero Hunger ↔ Neighborhood (food deserts)" },
  { sdg: 10, sdoh: "SC", strength: 6, label: "Reduced Inequalities ↔ Social & Community" },
];

// ─── Organizations (first-class mesh nodes) ───────────────────

const ORGANIZATIONS = [
  { id: "ORG_houston_food_bank", name: "Houston Food Bank", color: "#7a2018", count: 22, domain: "houstonfoodbank.org", themes: ["THEME_01", "THEME_02", "THEME_03"], sdoh: ["SC", "NB"], sdgs: [2, 1], situations: ["Find food", "Disaster help"], pipeline: "verified" },
  { id: "ORG_baker_ripley", name: "BakerRipley", color: "#1b5e8a", count: 1, domain: "bakerripley.org", themes: ["THEME_02", "THEME_05", "THEME_07"], sdoh: ["SC", "EA", "ED"], sdgs: [1, 4, 10], situations: ["Find a job", "Immigration", "Pay rent", "Disaster help"], pipeline: "verified" },
  { id: "ORG_ymca_houston", name: "YMCA Houston", color: "#6a4e10", count: 12, domain: "ymcahouston.org", themes: ["THEME_01", "THEME_02", "THEME_05"], sdoh: ["SC", "ED", "HC"], sdgs: [3, 4, 8], situations: ["Childcare", "Find a job", "Education"], pipeline: "verified" },
  { id: "ORG_legacy_health", name: "Legacy Health", color: "#d53f8c", count: 2, domain: "legacycommunityhealth.org", themes: ["THEME_01"], sdoh: ["HC"], sdgs: [3], situations: ["Get healthcare", "Mental health"], pipeline: "verified" },
  { id: "ORG_houston_habitat", name: "Houston Habitat", color: "#7a2018", count: 12, domain: "houstonhabitat.org", themes: ["THEME_03", "THEME_05"], sdoh: ["NB", "EA"], sdgs: [11, 1], situations: ["Pay rent"], pipeline: "verified" },
  { id: "ORG_houstontx_gov", name: "houstontx.gov", color: "#8b5cf6", count: 6, domain: "houstontx.gov", themes: ["THEME_03", "THEME_04"], sdoh: ["NB", "SC"], sdgs: [11, 16], situations: ["Utilities"], pipeline: "verified" },
  { id: "ORG_khou", name: "KHOU", color: "#1a6b56", count: 28, domain: "khou.com", themes: ["THEME_01", "THEME_02", "THEME_03", "THEME_04"], sdoh: ["SC", "NB"], sdgs: [16, 11], situations: ["Find food", "Disaster help", "Get healthcare", "Legal help"], pipeline: "source" },
  { id: "ORG_houston_public_media", name: "Houston Public Media", color: "#6a4e10", count: 16, domain: "houstonpublicmedia.org", themes: ["THEME_04", "THEME_03"], sdoh: ["SC", "NB"], sdgs: [16, 11], situations: ["Legal help", "Transportation", "Utilities"], pipeline: "source" },
  { id: "ORG_sa_report", name: "SA Report", color: "#6a4e10", count: 9, domain: "sanantonioreport.org", themes: ["THEME_04", "THEME_03"], sdoh: ["SC", "NB"], sdgs: [16, 11], situations: ["Legal help", "Immigration"], pipeline: "source" },
  { id: "ORG_houstonia", name: "Houstonia", color: "#6a4e10", count: 9, domain: "houstoniamag.com", themes: ["THEME_03", "THEME_02"], sdoh: ["NB", "SC"], sdgs: [11, 4], situations: ["Education", "Find food", "Transportation"], pipeline: "source" },
];

// ─── 12 Super-Neighborhood Geography Anchors ─────────────────

const GEOGRAPHY = [
  { id: "GEO_third_ward", name: "Third Ward", zips: ["77004", "77021"], population: 24000, orgs: ["ORG_houston_food_bank", "ORG_baker_ripley", "ORG_khou"], situations: ["Find food", "Pay rent", "Get healthcare", "Education"], pathways: ["THEME_01", "THEME_02", "THEME_03"], sdoh: ["SC", "NB", "HC"], sdgs: [2, 1, 3, 4], rings: ["resources", "services", "officials"] },
  { id: "GEO_montrose", name: "Montrose", zips: ["77006", "77098"], population: 35000, orgs: ["ORG_legacy_health", "ORG_ymca_houston", "ORG_houstonia"], situations: ["Get healthcare", "Mental health", "Legal help", "Education"], pathways: ["THEME_01", "THEME_02", "THEME_07"], sdoh: ["HC", "SC", "ED"], sdgs: [3, 4, 10], rings: ["resources", "services", "guides"] },
  { id: "GEO_heights", name: "Heights", zips: ["77007", "77008", "77009"], population: 42000, orgs: ["ORG_ymca_houston", "ORG_houstonia", "ORG_houstontx_gov"], situations: ["Education", "Childcare", "Transportation", "Utilities"], pathways: ["THEME_02", "THEME_03", "THEME_06"], sdoh: ["ED", "NB", "SC"], sdgs: [4, 11, 13], rings: ["resources", "services", "officials"] },
  { id: "GEO_midtown", name: "Midtown", zips: ["77004", "77006"], population: 18000, orgs: ["ORG_baker_ripley", "ORG_khou", "ORG_legacy_health"], situations: ["Find a job", "Immigration", "Get healthcare", "Legal help"], pathways: ["THEME_01", "THEME_05", "THEME_07"], sdoh: ["EA", "SC", "HC"], sdgs: [8, 10, 3], rings: ["services", "resources", "guides"] },
  { id: "GEO_east_end", name: "East End", zips: ["77011", "77012", "77023"], population: 45000, orgs: ["ORG_baker_ripley", "ORG_houston_food_bank", "ORG_khou"], situations: ["Find food", "Immigration", "Pay rent", "Find a job", "Childcare"], pathways: ["THEME_02", "THEME_03", "THEME_05"], sdoh: ["SC", "EA", "NB"], sdgs: [2, 1, 10, 8], rings: ["services", "resources", "guides", "officials"] },
  { id: "GEO_sunnyside", name: "Sunnyside", zips: ["77033", "77051"], population: 22000, orgs: ["ORG_houston_food_bank", "ORG_houstontx_gov", "ORG_houston_habitat"], situations: ["Find food", "Utilities", "Pay rent", "Disaster help"], pathways: ["THEME_01", "THEME_03", "THEME_05", "THEME_06"], sdoh: ["NB", "SC", "EA"], sdgs: [2, 11, 1, 13], rings: ["services", "officials", "policies"] },
  { id: "GEO_gulfton", name: "Gulfton", zips: ["77081", "77036"], population: 50000, orgs: ["ORG_baker_ripley", "ORG_ymca_houston", "ORG_sa_report"], situations: ["Immigration", "Find a job", "Education", "Find food", "Legal help"], pathways: ["THEME_02", "THEME_04", "THEME_05", "THEME_07"], sdoh: ["SC", "EA", "ED"], sdgs: [10, 4, 8, 2], rings: ["services", "resources", "guides"] },
  { id: "GEO_spring_branch", name: "Spring Branch", zips: ["77055", "77043", "77080"], population: 60000, orgs: ["ORG_ymca_houston", "ORG_baker_ripley", "ORG_houston_public_media"], situations: ["Childcare", "Education", "Find a job", "Immigration", "Transportation"], pathways: ["THEME_02", "THEME_05", "THEME_07"], sdoh: ["ED", "EA", "SC"], sdgs: [4, 8, 10], rings: ["services", "resources", "guides"] },
  { id: "GEO_fifth_ward", name: "Fifth Ward", zips: ["77020", "77026"], population: 19000, orgs: ["ORG_houston_food_bank", "ORG_houston_habitat", "ORG_houstontx_gov"], situations: ["Find food", "Pay rent", "Disaster help", "Utilities"], pathways: ["THEME_01", "THEME_03", "THEME_06"], sdoh: ["NB", "SC", "EA"], sdgs: [2, 1, 11, 13], rings: ["services", "officials", "policies"] },
  { id: "GEO_alief", name: "Alief", zips: ["77072", "77082", "77099"], population: 70000, orgs: ["ORG_baker_ripley", "ORG_ymca_houston", "ORG_khou", "ORG_sa_report"], situations: ["Immigration", "Education", "Find a job", "Childcare", "Find food"], pathways: ["THEME_02", "THEME_05", "THEME_07"], sdoh: ["SC", "ED", "EA"], sdgs: [10, 4, 8, 2], rings: ["services", "resources", "guides"] },
  { id: "GEO_sharpstown", name: "Sharpstown", zips: ["77036", "77074"], population: 38000, orgs: ["ORG_baker_ripley", "ORG_ymca_houston", "ORG_sa_report"], situations: ["Find a job", "Legal help", "Immigration", "Education"], pathways: ["THEME_04", "THEME_05", "THEME_07"], sdoh: ["EA", "SC", "ED"], sdgs: [8, 16, 10, 4], rings: ["services", "resources", "policies"] },
  { id: "GEO_kashmere_gardens", name: "Kashmere Gardens", zips: ["77026", "77028"], population: 15000, orgs: ["ORG_houston_food_bank", "ORG_houstontx_gov", "ORG_houston_habitat"], situations: ["Find food", "Disaster help", "Utilities", "Pay rent"], pathways: ["THEME_01", "THEME_03", "THEME_06"], sdoh: ["NB", "SC", "EA"], sdgs: [2, 13, 11, 1], rings: ["services", "officials", "policies"] },
];

// ─── 8 Audience Segments ──────────────────────────────────────

const AUDIENCES = [
  { id: "starter", name: "Starter", emoji: "🌱", count: 42, color: "#7a2018", tagline: "I want to get involved but don't know where to begin." },
  { id: "hard-worker", name: "Hard Worker", emoji: "💪", count: 68, color: "#1e4d7a", tagline: "I need resources and I want to give back." },
  { id: "next-steps", name: "Next Steps", emoji: "🎯", count: 35, color: "#6a4e10", tagline: "I'm already active. What's next?" },
  { id: "looking-for-answers", name: "Looking for Answers", emoji: "🔍", count: 48, color: "#1a6b56", tagline: "I have a specific question or need." },
  { id: "spark-plug", name: "Spark Plug", emoji: "⚡", count: 22, color: "#4a2870", tagline: "I want to lead and organize." },
  { id: "bridge-builder", name: "Bridge Builder", emoji: "🌉", count: 18, color: "#1b5e8a", tagline: "I want to connect across divides." },
  { id: "scout", name: "Scout", emoji: "🔭", count: 15, color: "#1a5030", tagline: "I want to explore what's out there." },
  { id: "register", name: "Register", emoji: "🗳️", count: 12, color: "#d53f8c", tagline: "I want to vote and participate in democracy." },
];

// ─── 5 Content Rings (matches wayfinder) ──────────────────────

const RINGS = [
  { id: "resources", name: "Resources", color: "#C75B2A", count: 307, desc: "Articles, tools, explainers", icon: "📄", orgs: ["ORG_khou", "ORG_houston_public_media", "ORG_sa_report", "ORG_houstonia"], sdgs: [16, 11, 3, 4], sdoh: ["SC", "NB", "HC", "ED", "EA"], situations: ["Find food", "Get healthcare", "Education", "Legal help", "Disaster help"], geos: ["GEO_third_ward", "GEO_montrose", "GEO_heights", "GEO_east_end", "GEO_gulfton", "GEO_alief"] },
  { id: "guides", name: "Guides", color: "#1e4d7a", count: 18, desc: "Step-by-step walkthroughs", icon: "📖", orgs: ["ORG_baker_ripley", "ORG_ymca_houston", "ORG_houstontx_gov"], sdgs: [4, 3, 1], sdoh: ["ED", "HC", "EA"], situations: ["Find a job", "Pay rent", "Get healthcare", "Immigration"], geos: ["GEO_gulfton", "GEO_east_end", "GEO_spring_branch", "GEO_alief"] },
  { id: "services", name: "211 Services", color: "#10b981", count: 100, desc: "Real services near you", icon: "🤝", orgs: ["ORG_houston_food_bank", "ORG_baker_ripley", "ORG_ymca_houston", "ORG_legacy_health", "ORG_houston_habitat", "ORG_houstontx_gov"], sdgs: [1, 2, 3, 8, 11], sdoh: ["SC", "EA", "HC", "NB", "ED"], situations: ["Find food", "Pay rent", "Get healthcare", "Find a job", "Childcare", "Mental health", "Utilities"], geos: ["GEO_third_ward", "GEO_montrose", "GEO_heights", "GEO_midtown", "GEO_east_end", "GEO_sunnyside", "GEO_gulfton", "GEO_spring_branch", "GEO_fifth_ward", "GEO_alief", "GEO_sharpstown", "GEO_kashmere_gardens"] },
  { id: "officials", name: "Officials", color: "#6a4e10", count: 100, desc: "Elected decision-makers", icon: "🏛️", orgs: ["ORG_houstontx_gov"], sdgs: [16, 10, 11], sdoh: ["SC", "NB"], situations: ["Legal help", "Utilities", "Transportation"], geos: ["GEO_third_ward", "GEO_montrose", "GEO_heights", "GEO_midtown", "GEO_east_end", "GEO_sunnyside", "GEO_gulfton", "GEO_spring_branch", "GEO_fifth_ward", "GEO_alief", "GEO_sharpstown", "GEO_kashmere_gardens"] },
  { id: "policies", name: "Policies", color: "#8b5cf6", count: 30, desc: "Bills & ordinances", icon: "📋", orgs: ["ORG_houstontx_gov", "ORG_houston_public_media"], sdgs: [16, 10, 1, 11], sdoh: ["SC", "NB", "EA"], situations: ["Legal help", "Utilities", "Pay rent", "Transportation"], geos: ["GEO_third_ward", "GEO_east_end", "GEO_sunnyside", "GEO_fifth_ward", "GEO_kashmere_gardens"] },
];

// ─── 5 Crosswalk Systems ─────────────────────────────────────

const CROSSWALKS = [
  { name: "SDGs", full: "17 UN Goals", color: "#1e4d7a", count: 17 },
  { name: "SDOH", full: "5 Health Domains", color: "#1b5e8a", count: 5 },
  { name: "NTEE", full: "Nonprofit Codes", color: "#6a4e10", count: 26 },
  { name: "AIRS", full: "211 Categories", color: "#10b981", count: 50 },
  { name: "Themes", full: "7 Pathways", color: "#C75B2A", count: 7 },
];

const DOMAINS: Record<string, { name: string; color: string; items: { icon: string; name: string; count: number }[] }> = {
  content:  { name: "Content",   color: "#C75B2A",  items: [{ icon: "📄", name: "Published", count: 195 }, { icon: "📚", name: "Resources", count: 307 }, { icon: "🌐", name: "Translations", count: 170 }] },
  pipeline: { name: "Pipeline",  color: "#1e4d7a",  items: [{ icon: "📥", name: "Inbox", count: 233 }, { icon: "🔍", name: "Review Queue", count: 233 }] },
  people:   { name: "People",    color: "#8b5cf6",  items: [{ icon: "🏛️", name: "Officials", count: 100 }, { icon: "🏢", name: "Organizations", count: 100 }, { icon: "🗳️", name: "Candidates", count: 20 }] },
  services: { name: "Services",  color: "#10b981",  items: [{ icon: "🤝", name: "Services 211", count: 100 }, { icon: "💡", name: "Life Situations", count: 25 }, { icon: "📋", name: "Policies", count: 30 }] },
  learning: { name: "Learning",  color: "#6a4e10",  items: [{ icon: "🛤️", name: "Paths", count: 20 }, { icon: "📖", name: "Modules", count: 50 }, { icon: "❓", name: "Quizzes", count: 22 }, { icon: "🏅", name: "Badges", count: 30 }] },
  civic:    { name: "Civic",     color: "#d53f8c",  items: [{ icon: "🗳️", name: "Elections", count: 8 }, { icon: "☑️", name: "Ballot Items", count: 10 }, { icon: "📍", name: "Voting Locations", count: 30 }] },
  geo:      { name: "Geography", color: "#4a2870",  items: [{ icon: "📮", name: "ZIP Codes", count: 238 }, { icon: "🏘️", name: "Neighborhoods", count: 50 }, { icon: "📊", name: "Census Tracts", count: 50 }, { icon: "🗺️", name: "Precincts", count: 40 }, { icon: "🏞️", name: "Counties", count: 18 }] },
  taxonomy: { name: "Taxonomy",  color: "#1a5030",  items: [{ icon: "🎯", name: "Focus Areas", count: 164 }] },
};

// ─── Dimension Groups ─────────────────────────────────────────

const DIMENSION_GROUPS = [
  { group: "Classification", color: "#C75B2A", dims: [
    { name: "Theme Primary", edges: 195 }, { name: "Theme Secondary", edges: 122 },
    { name: "Center", edges: 195 }, { name: "Resource Type", edges: 195 },
    { name: "Focus Areas", edges: 507 }, { name: "SDGs", edges: 337 },
    { name: "SDOH", edges: 195 }, { name: "NTEE", edges: 195 },
    { name: "AIRS", edges: 195 }, { name: "Audiences", edges: 431 },
    { name: "Life Situations", edges: 241 }, { name: "Service Cats", edges: 148 },
    { name: "Skills", edges: 120 }, { name: "Geo Scope", edges: 195 },
  ]},
  { group: "Actions", color: "#1a6b56", dims: [
    { name: "Donate", edges: 42 }, { name: "Volunteer", edges: 35 },
    { name: "Signup", edges: 28 }, { name: "Register", edges: 18 },
    { name: "Apply", edges: 15 }, { name: "Call", edges: 22 },
    { name: "Attend", edges: 12 },
  ]},
  { group: "Graph Edges", color: "#1e4d7a", dims: [
    { name: "Organizations", edges: 100 }, { name: "Translations (ES)", edges: 170 },
    { name: "Translations (VI)", edges: 170 }, { name: "Cross-refs", edges: 85 },
    { name: "Keywords", edges: 450 },
  ]},
  { group: "Content Rings", color: "#6366f1", dims: [
    { name: "Resources", edges: 307 }, { name: "Guides", edges: 18 },
    { name: "211 Services", edges: 100 }, { name: "Officials", edges: 100 },
    { name: "Policies", edges: 30 },
  ]},
  { group: "Metadata", color: "#8b8178", dims: [
    { name: "Engagement", edges: 195 }, { name: "Reading Level", edges: 195 },
    { name: "Confidence", edges: 195 }, { name: "Review Status", edges: 233 },
  ]},
];

const TOTAL_DIMS = DIMENSION_GROUPS.reduce((s, g) => s + g.dims.length, 0);
const TOTAL_EDGES = DIMENSION_GROUPS.reduce((s, g) => s + g.dims.reduce((ss, d) => ss + d.edges, 0), 0);

const STATS = {
  content: 195, services: 100, officials: 100, orgs: 100,
  policies: 30, situations: 25, paths: 20, translations: 170,
  feeds: 10, zipCodes: 238, neighborhoods: 50, focusAreas: 164,
  elections: 8, badges: 30, resources: 307,
  totalEdges: TOTAL_EDGES, totalRecords: 2630,
  objectTypes: 24, tables: 67, bridging: 43,
  dimensions: TOTAL_DIMS, audienceSegments: 8,
};

// ─── Types ─────────────────────────────────────────────────────

interface NodeBase {
  id: string | number;
  name: string;
  color: string;
  x: number;
  y: number;
  type: string;
  [key: string]: any;
}

// ═══════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════

/**
 * SVG-based knowledge graph visualization with pan/zoom, search, and click-to-inspect.
 *
 * Renders the Civic Knowledge Galaxy as an interactive force-directed graph.
 * Supports multiple views (galaxy, pathway detail, center detail, etc.),
 * mouse-driven panning and wheel-driven zooming, node hover/click inspection
 * with a detail panel showing all ~35 dimensions, and a search bar for
 * filtering nodes by name. Entirely client-side with no server data fetching.
 */
export default function KnowledgeGraphClient() {
  const [selectedNode, setSelectedNode] = useState<NodeBase | null>(null);
  const [view, setView] = useState("galaxy");
  const [hoveredEdge, setHoveredEdge] = useState<number | null>(null);
  const [hovered, setHovered] = useState<NodeBase | null>(null);
  const [animPhase, setAnimPhase] = useState(0);
  const [showExplosion, setShowExplosion] = useState(false);
  const [search, setSearch] = useState("");
  const [showMissing, setShowMissing] = useState(false);
  const [layers, setLayers] = useState({
    pathways: true, centers: true, sdoh: true, sdgs: true,
    domains: true, sources: false, crosswalks: true,
    bridging: true, lifeSit: true, rings: true, orgs: true,
    geography: true,
  });

  // Pan & zoom state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const panOrigin = useRef({ x: 0, y: 0 });
  const svgContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setAnimPhase(p => (p + 1) % 360), 50);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't capture zoom shortcuts when user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === "Escape") { setSearch(""); (e.target as HTMLElement).blur(); }
        return;
      }
      if (e.key === "Escape") { setSelectedNode(null); setSearch(""); }
      if (e.key === "+" || e.key === "=") setZoom(z => Math.min(z * 1.15, 5));
      if (e.key === "-") setZoom(z => Math.max(z / 1.15, 0.3));
      if (e.key === "0") { setZoom(1); setPan({ x: 0, y: 0 }); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const container = svgContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.3, Math.min(5, zoom * delta));
    const scale = newZoom / zoom;
    setPan(p => ({ x: mouseX - scale * (mouseX - p.x), y: mouseY - scale * (mouseY - p.y) }));
    setZoom(newZoom);
  }, [zoom]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if ((e.target as SVGElement).closest('[data-node]')) return;
    setIsPanning(true);
    panStart.current = { x: e.clientX, y: e.clientY };
    panOrigin.current = { ...pan };
  }, [pan]);
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({ x: panOrigin.current.x + (e.clientX - panStart.current.x), y: panOrigin.current.y + (e.clientY - panStart.current.y) });
  }, [isPanning]);
  const onMouseUp = useCallback(() => setIsPanning(false), []);

  const lastTouches = useRef<React.Touch[]>([]);
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    lastTouches.current = Array.from(e.touches);
    if (e.touches.length === 1) { panStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; panOrigin.current = { ...pan }; }
  }, [pan]);
  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setPan({ x: panOrigin.current.x + (e.touches[0].clientX - panStart.current.x), y: panOrigin.current.y + (e.touches[0].clientY - panStart.current.y) });
    } else if (e.touches.length === 2 && lastTouches.current.length === 2) {
      const prev = Math.hypot(lastTouches.current[0].clientX - lastTouches.current[1].clientX, lastTouches.current[0].clientY - lastTouches.current[1].clientY);
      const cur = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      setZoom(z => Math.max(0.3, Math.min(5, z * (cur / prev))));
    }
    lastTouches.current = Array.from(e.touches);
  }, []);

  type LayerKey = keyof typeof layers;
  const toggleLayer = (key: LayerKey) => setLayers(l => ({ ...l, [key]: !l[key] }));
  const cx = 500, cy = 450;

  // ─── Node positions ─────────────────────────────────────────

  const pathwayNodes: NodeBase[] = Object.entries(THEMES).map(([id, t], i) => {
    const a = (i / 7) * Math.PI * 2 - Math.PI / 2;
    return { id, ...t, x: cx + Math.cos(a) * 195, y: cy + Math.sin(a) * 195, type: "pathway" };
  });
  const centerNodes: NodeBase[] = Object.entries(CENTERS).map(([name, c], i) => {
    const a = (i / 4) * Math.PI * 2 - Math.PI / 4;
    return { id: name, name, ...c, x: cx + Math.cos(a) * 95, y: cy + Math.sin(a) * 95, type: "center" };
  });
  const sdohNodes: NodeBase[] = SDOH.map((s, i) => {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    return { ...s, x: cx + Math.cos(a) * 300, y: cy + Math.sin(a) * 300, type: "sdoh" };
  });
  const sdgNodes: NodeBase[] = SDG_DATA.map((s, i) => {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    return { ...s, x: cx + Math.cos(a) * 248, y: cy + Math.sin(a) * 248, type: "sdg" };
  });
  const lifeSitNodes: NodeBase[] = LIFE_SITUATIONS.map((s, i) => {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2 + 0.15;
    return { ...s, id: s.name, color: "#7a2018", x: cx + Math.cos(a) * 140, y: cy + Math.sin(a) * 140, type: "lifeSit" };
  });
  const ringNodes: NodeBase[] = RINGS.map((r, i) => {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2 + 0.35;
    return { ...r, x: cx + Math.cos(a) * 350, y: cy + Math.sin(a) * 350, type: "ring" };
  });
  const orgNodes: NodeBase[] = ORGANIZATIONS.map((o, i) => {
    const a = (i / ORGANIZATIONS.length) * Math.PI * 2 - Math.PI / 2 + 0.2;
    return { ...o, x: cx + Math.cos(a) * 430, y: cy + Math.sin(a) * 430, type: "org" };
  });
  const geoNodes: NodeBase[] = GEOGRAPHY.map((g, i) => {
    const a = (i / GEOGRAPHY.length) * Math.PI * 2 - Math.PI / 2 + 0.45;
    return { ...g, color: "#4a2870", x: cx + Math.cos(a) * 365, y: cy + Math.sin(a) * 365, type: "geography" };
  });
  const domainEntries = Object.entries(DOMAINS);
  const domainNodes: NodeBase[] = domainEntries.map(([key, d], i) => {
    const a = (i / domainEntries.length) * Math.PI * 2 - Math.PI / 2;
    const totalCount = d.items.reduce((s, it) => s + it.count, 0);
    return { id: key, ...d, totalCount, x: cx + Math.cos(a) * 390, y: cy + Math.sin(a) * 390, type: "domain" };
  });
  const crosswalkNodes: NodeBase[] = CROSSWALKS.map((c, i) => {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2 + 0.6;
    return { ...c, x: cx + Math.cos(a) * 56, y: cy + Math.sin(a) * 56, type: "crosswalk", id: c.name };
  });

  const allNodes: NodeBase[] = [...pathwayNodes, ...centerNodes, ...sdohNodes, ...sdgNodes, ...lifeSitNodes, ...ringNodes, ...orgNodes, ...geoNodes, ...domainNodes, ...crosswalkNodes];
  const edges = PATHWAY_CENTER.filter(d => d.n > 0).map(d => {
    const from = pathwayNodes.find(n => n.id === d.pw);
    const to = centerNodes.find(n => n.id === d.c);
    return from && to ? { from, to, count: d.n } : null;
  }).filter(Boolean) as { from: NodeBase; to: NodeBase; count: number }[];

  const searchLower = search.toLowerCase();
  const matchesSearch = (n: NodeBase) => !search || n.name.toLowerCase().includes(searchLower);
  const hasSearchResults = search && allNodes.some(matchesSearch);
  const selectNode = (n: NodeBase) => setSelectedNode(selectedNode?.id === n.id ? null : n);
  const arcPath = (x1: number, y1: number, x2: number, y2: number) => {
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const dx = mx - cx, dy = my - cy, dist = Math.sqrt(dx * dx + dy * dy) || 1;
    return `M ${x1} ${y1} Q ${mx + (dx / dist) * 40} ${my + (dy / dist) * 40} ${x2} ${y2}`;
  };

  // ─── Full mesh connections (detail panel) ───────────────────

  const getConnections = (node: NodeBase) => {
    const c: { label: string; nodes: string[]; color: string }[] = [];

    if (node.type === "pathway") {
      const t = THEMES[node.id as string];
      const pwEdges = PATHWAY_CENTER.filter(e => e.pw === node.id && e.n > 0);
      c.push({ label: "Centers", nodes: pwEdges.map(e => `${e.c} (${e.n})`), color: "#6366f1" });
      c.push({ label: "5 Rings", nodes: Object.entries(t.rings).map(([ring, cnt]) => `${ring}: ${cnt}`), color: "#C75B2A" });
      const bridges = BRIDGING.filter(b => b.a === node.id || b.b === node.id);
      if (bridges.length) c.push({ label: "Bridges", nodes: bridges.map(b => { const o = b.a === node.id ? b.b : b.a; return `${THEMES[o]?.name} (${b.shared} — ${b.reason})`; }), color: "#d53f8c" });
      if (t.sdoh.length) c.push({ label: "SDOH", nodes: t.sdoh.map(code => SDOH.find(x => x.id === code)?.name || code), color: "#1b5e8a" });
      if (t.sdgs.length) c.push({ label: "SDGs", nodes: t.sdgs.map(id => { const s = SDG_DATA.find(x => x.id === id); return s ? `#${s.id}: ${s.name}` : `#${id}`; }), color: "#1e4d7a" });
      if (t.audiences.length) c.push({ label: "Audiences", nodes: t.audiences.map(id => { const a = AUDIENCES.find(x => x.id === id); return a ? `${a.name}` : id; }), color: "#d53f8c" });
      const sits = LIFE_SITUATIONS.filter(ls => ls.themes.includes(node.id as string));
      if (sits.length) c.push({ label: "Life Situations", nodes: sits.map(s => `${s.name} (${s.count})`), color: "#10b981" });
      if (t.orgs.length) c.push({ label: "Organizations", nodes: t.orgs, color: "#1e4d7a" });
      const geos = GEOGRAPHY.filter(g => g.pathways.includes(node.id as string));
      if (geos.length) c.push({ label: "Geography", nodes: geos.map(g => `${g.name} (${g.zips.join(", ")})`), color: "#4a2870" });
      const missing = MISSING_BRIDGES.filter(b => b.a === node.id || b.b === node.id);
      if (missing.length) c.push({ label: "Missing Bridges", nodes: missing.map(b => { const o = b.a === node.id ? b.b : b.a; return `${THEMES[o]?.name}: ${b.reason}`; }), color: "#ef4444" });
      const mc = MISSING_CENTER_EDGES.filter(e => e.pw === node.id);
      if (mc.length) c.push({ label: "Missing Centers", nodes: mc.map(e => `${e.c}: ${e.reason}`), color: "#ef4444" });
    }
    if (node.type === "center") {
      const ctr = CENTERS[node.id as string];
      const pwEdges = PATHWAY_CENTER.filter(e => e.c === node.id && e.n > 0);
      c.push({ label: "Pathways", nodes: pwEdges.map(e => `${THEMES[e.pw]?.name} (${e.n})`), color: "#C75B2A" });
      const sits = LIFE_SITUATIONS.filter(ls => ls.centers.includes(node.id as string));
      if (sits.length) c.push({ label: "Life Situations", nodes: sits.map(s => `${s.name}`), color: "#10b981" });
      if (ctr?.sdoh.length) c.push({ label: "SDOH", nodes: ctr.sdoh.map(code => SDOH.find(s => s.id === code)?.name || code), color: "#1b5e8a" });
      if (ctr?.sdgs.length) c.push({ label: "SDGs", nodes: ctr.sdgs.map(id => { const s = SDG_DATA.find(x => x.id === id); return s ? `#${s.id}: ${s.name}` : `#${id}`; }), color: "#1e4d7a" });
      if (ctr?.orgs.length) { const ctrOrgs = ORGANIZATIONS.filter(o => ctr.orgs.includes(o.id)); c.push({ label: "Organizations", nodes: ctrOrgs.map(o => o.name), color: "#1e4d7a" }); }
      if (ctr?.geos.length) { const ctrGeos = GEOGRAPHY.filter(g => ctr.geos.includes(g.id)); c.push({ label: "Geography", nodes: ctrGeos.map(g => `${g.name}`), color: "#4a2870" }); }
      const ctrRings = RINGS.filter(r => { const ringCenters = Object.entries(THEMES).some(([tid]) => PATHWAY_CENTER.some(pc => pc.c === node.id && pc.pw === tid && pc.n > 0)); return ringCenters; });
      if (ctrRings.length) c.push({ label: "Content Rings", nodes: RINGS.map(r => `${r.name} (${r.count})`), color: "#6366f1" });
    }
    if (node.type === "sdoh") {
      const d = SDOH.find(s => s.id === node.id);
      if (d?.themes.length) c.push({ label: "Pathways", nodes: d.themes.map(t => `${THEMES[t]?.name}`), color: "#C75B2A" });
      if (d?.sdgs.length) c.push({ label: "SDGs", nodes: d.sdgs.map(id => { const s = SDG_DATA.find(x => x.id === id); return s ? `#${s.id}: ${s.name}` : `#${id}`; }), color: "#1e4d7a" });
      const sits = LIFE_SITUATIONS.filter(ls => ls.sdoh === node.id);
      if (sits.length) c.push({ label: "Life Situations", nodes: sits.map(s => `${s.name}`), color: "#10b981" });
      const orgs = ORGANIZATIONS.filter(o => o.sdoh.includes(node.id as string));
      if (orgs.length) c.push({ label: "Organizations", nodes: orgs.map(o => o.name), color: "#1e4d7a" });
      const sdohGeos = GEOGRAPHY.filter(g => g.sdoh.includes(node.id as string));
      if (sdohGeos.length) c.push({ label: "Geography", nodes: sdohGeos.map(g => `${g.name}`), color: "#4a2870" });
      const sdohRings = RINGS.filter(r => r.sdoh.includes(node.id as string));
      if (sdohRings.length) c.push({ label: "Content Rings", nodes: sdohRings.map(r => `${r.name}`), color: "#6366f1" });
    }
    if (node.type === "sdg") {
      const linkedSdoh = SDG_SDOH_LINKS.filter(l => l.sdg === node.id);
      if (linkedSdoh.length) c.push({ label: "SDOH", nodes: linkedSdoh.map(l => l.label), color: "#1b5e8a" });
      const themes = Object.entries(THEMES).filter(([, t]) => t.sdgs.includes(node.id as number));
      if (themes.length) c.push({ label: "Pathways", nodes: themes.map(([, t]) => `${t.name}`), color: "#C75B2A" });
      const sits = LIFE_SITUATIONS.filter(ls => ls.sdg === node.id);
      if (sits.length) c.push({ label: "Life Situations", nodes: sits.map(s => `${s.name}`), color: "#10b981" });
      const orgs = ORGANIZATIONS.filter(o => o.sdgs.includes(node.id as number));
      if (orgs.length) c.push({ label: "Organizations", nodes: orgs.map(o => o.name), color: "#1e4d7a" });
      const sdgGeos = GEOGRAPHY.filter(g => g.sdgs.includes(node.id as number));
      if (sdgGeos.length) c.push({ label: "Geography", nodes: sdgGeos.map(g => `${g.name}`), color: "#4a2870" });
      const sdgRings = RINGS.filter(r => r.sdgs.includes(node.id as number));
      if (sdgRings.length) c.push({ label: "Content Rings", nodes: sdgRings.map(r => `${r.name}`), color: "#6366f1" });
    }
    if (node.type === "lifeSit") {
      const sit = LIFE_SITUATIONS.find(ls => ls.name === node.id);
      if (sit) {
        c.push({ label: "Pathways", nodes: sit.themes.map(t => `${THEMES[t]?.name}`), color: "#C75B2A" });
        c.push({ label: "Centers", nodes: sit.centers.map(cn => `${cn}`), color: "#6366f1" });
        c.push({ label: "SDOH", nodes: [SDOH.find(s => s.id === sit.sdoh)?.name || sit.sdoh], color: "#1b5e8a" });
        c.push({ label: "SDG", nodes: [(() => { const s = SDG_DATA.find(x => x.id === sit.sdg); return s ? `#${s.id}: ${s.name}` : `#${sit.sdg}`; })()], color: "#1e4d7a" });
        if (sit.services.length) c.push({ label: "Services", nodes: sit.services, color: "#10b981" });
        c.push({ label: "AIRS Code", nodes: [sit.airs], color: "#10b981" });
        if (sit.audiences.length) c.push({ label: "Audiences", nodes: sit.audiences.map(id => { const a = AUDIENCES.find(x => x.id === id); return a ? `${a.name}` : id; }), color: "#d53f8c" });
        if (sit.orgs.length) c.push({ label: "Organizations", nodes: sit.orgs, color: "#1e4d7a" });
        const sitGeos = GEOGRAPHY.filter(g => g.situations.includes(sit.name));
        if (sitGeos.length) c.push({ label: "Geography", nodes: sitGeos.map(g => `${g.name} (${g.zips.join(", ")})`), color: "#4a2870" });
        const sitRings = RINGS.filter(r => r.situations.includes(sit.name));
        if (sitRings.length) c.push({ label: "Content Rings", nodes: sitRings.map(r => `${r.name}`), color: "#6366f1" });
      }
    }
    if (node.type === "ring") {
      const ring = RINGS.find(r => r.id === node.id);
      const perPathway = Object.entries(THEMES).map(([id, t]) => `${t.name}: ${t.rings[node.id as keyof typeof t.rings] || 0}`);
      c.push({ label: "Per Pathway", nodes: perPathway, color: "#C75B2A" });
      if (ring) {
        if (ring.orgs.length) { const ringOrgs = ORGANIZATIONS.filter(o => ring.orgs.includes(o.id)); c.push({ label: "Organizations", nodes: ringOrgs.map(o => o.name), color: "#1e4d7a" }); }
        if (ring.sdgs.length) c.push({ label: "SDGs", nodes: ring.sdgs.map(id => { const s = SDG_DATA.find(x => x.id === id); return s ? `#${s.id}: ${s.name}` : `#${id}`; }), color: "#1e4d7a" });
        if (ring.sdoh.length) c.push({ label: "SDOH", nodes: ring.sdoh.map(code => SDOH.find(s => s.id === code)?.name || code), color: "#1b5e8a" });
        if (ring.situations.length) c.push({ label: "Life Situations", nodes: ring.situations, color: "#10b981" });
        if (ring.geos.length) { const ringGeos = GEOGRAPHY.filter(g => ring.geos.includes(g.id)); c.push({ label: "Geography", nodes: ringGeos.map(g => `${g.name}`), color: "#4a2870" }); }
      }
    }
    if (node.type === "org") {
      const org = ORGANIZATIONS.find(o => o.id === node.id);
      if (org) {
        c.push({ label: "Pathways", nodes: org.themes.map(t => `${THEMES[t]?.name}`), color: "#C75B2A" });
        c.push({ label: "SDOH", nodes: org.sdoh.map(code => SDOH.find(s => s.id === code)?.name || code), color: "#1b5e8a" });
        c.push({ label: "SDGs", nodes: org.sdgs.map(id => { const s = SDG_DATA.find(x => x.id === id); return s ? `#${s.id}: ${s.name}` : `#${id}`; }), color: "#1e4d7a" });
        if (org.situations.length) c.push({ label: "Life Situations", nodes: org.situations, color: "#10b981" });
        const orgGeos = GEOGRAPHY.filter(g => g.orgs.includes(org.id));
        if (orgGeos.length) c.push({ label: "Geography", nodes: orgGeos.map(g => `${g.name} (${g.zips.join(", ")})`), color: "#4a2870" });
        c.push({ label: "Pipeline", nodes: [`${org.pipeline} — ${org.domain} — ${org.count} articles`], color: "#8b8178" });
      }
    }
    if (node.type === "geography") {
      const geo = GEOGRAPHY.find(g => g.id === node.id);
      if (geo) {
        c.push({ label: "ZIP Codes", nodes: geo.zips, color: "#4a2870" });
        c.push({ label: "Pathways", nodes: geo.pathways.map(t => `${THEMES[t]?.name}`), color: "#C75B2A" });
        const geoOrgs = ORGANIZATIONS.filter(o => geo.orgs.includes(o.id));
        if (geoOrgs.length) c.push({ label: "Organizations", nodes: geoOrgs.map(o => o.name), color: "#1e4d7a" });
        if (geo.situations.length) c.push({ label: "Life Situations", nodes: geo.situations, color: "#10b981" });
        if (geo.sdoh.length) c.push({ label: "SDOH", nodes: geo.sdoh.map(code => SDOH.find(s => s.id === code)?.name || code), color: "#1b5e8a" });
        if (geo.sdgs.length) c.push({ label: "SDGs", nodes: geo.sdgs.map(id => { const s = SDG_DATA.find(x => x.id === id); return s ? `#${s.id}: ${s.name}` : `#${id}`; }), color: "#1e4d7a" });
        if (geo.rings.length) { const geoRings = RINGS.filter(r => geo.rings.includes(r.id)); c.push({ label: "Content Rings", nodes: geoRings.map(r => `${r.name} (${r.count})`), color: "#6366f1" }); }
      }
    }
    return c;
  };

  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  // ─── Render ─────────────────────────────────────────────────

  return (
    <div style={{ background: "#ffffff", color: "#2C2C2C", fontFamily: "system-ui, -apple-system, sans-serif", borderRadius: 12, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "20px 28px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <svg width={36} height={36} viewBox="0 0 36 36" style={{ flexShrink: 0 }}>
              <circle cx={18} cy={18} r={17} fill="#C75B2A" opacity={0.08} stroke="#C75B2A" strokeWidth={1.2} />
              {[0, 60, 120, 180, 240, 300].map(d => <circle key={d} cx={18 + Math.cos(d * Math.PI / 180) * 6} cy={18 + Math.sin(d * Math.PI / 180) * 6} r={6} fill="none" stroke="#C75B2A" strokeWidth={0.6} opacity={0.35} />)}
              <circle cx={18} cy={18} r={6} fill="none" stroke="#C75B2A" strokeWidth={0.8} opacity={0.5} />
              <circle cx={18} cy={18} r={2} fill="#C75B2A" opacity={0.4} />
            </svg>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em" }}>
                <span style={{ color: "#C75B2A" }}>Civic Knowledge Galaxy</span>
              </h1>
              <p style={{ margin: 0, fontSize: 11, color: "#8b8178", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                {STATS.totalRecords.toLocaleString()} records · {STATS.totalEdges.toLocaleString()}+ edges · ~{TOTAL_DIMS} dimensions per node · {STATS.tables} tables
              </p>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <input type="text" placeholder="Search nodes..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ padding: "7px 12px 7px 30px", borderRadius: 8, border: "1px solid #e5e0d8", background: "#f4f5f7", color: "#2C2C2C", fontSize: 12, width: 160, outline: "none" }} />
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "#8b8178", fontWeight: 600 }}>S</span>
          </div>
          {["galaxy", "nodemap", "mesh", "stats", "gaps"].map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: "7px 14px", borderRadius: 8, border: "1px solid",
              borderColor: view === v ? "#C75B2A" : "#e5e0d8",
              background: view === v ? "rgba(199,91,42,0.15)" : "transparent",
              color: view === v ? "#C75B2A" : "#6b6157", cursor: "pointer", fontSize: 12, fontWeight: 500,
            }}>
              {v === "nodemap" ? "Node Map" : v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "10px 28px", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#7a2018", boxShadow: "0 0 6px #7a2018" }} />
        <span style={{ fontSize: 11, color: "#7a2018" }}>Pipeline Active</span>
        <span style={{ fontSize: 11, color: "#e5e0d8" }}>|</span>
        <span style={{ fontSize: 11, color: "#8b8178" }}>
          ~{TOTAL_DIMS} dims · {STATS.totalEdges.toLocaleString()} edges · {ORGANIZATIONS.length} orgs pipelined · Scroll to zoom · Drag to pan · Click for mesh
        </span>
      </div>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
[data-node]{transition:transform .15s ease-out,filter .15s ease-out}
[data-node]:hover{filter:drop-shadow(0 2px 8px rgba(0,0,0,.15))}
.kg-circle{transition:r .2s ease-out,opacity .2s ease-out,stroke-width .15s ease-out}`}</style>

      {/* ═══════════════════ GALAXY VIEW ═══════════════════ */}
      {view === "galaxy" && (
        <div style={{ padding: "0 28px 28px", display: "flex", gap: 0 }}>
        <div style={{ flex: "1 1 0%", minWidth: 0 }}>
          <div style={{ display: "flex", gap: 4, marginBottom: 10, flexWrap: "wrap", alignItems: "center" }}>
            {([
              { key: "centers" as LayerKey, label: "Centers", color: "#6366f1" },
              { key: "lifeSit" as LayerKey, label: "Life Sits", color: "#10b981" },
              { key: "pathways" as LayerKey, label: "Pathways", color: "#C75B2A" },
              { key: "bridging" as LayerKey, label: "Bridges", color: "#d53f8c" },
              { key: "rings" as LayerKey, label: "5 Rings", color: "#6366f1" },
              { key: "sdgs" as LayerKey, label: "SDGs", color: "#1e4d7a" },
              { key: "sdoh" as LayerKey, label: "SDOH", color: "#1b5e8a" },
              { key: "crosswalks" as LayerKey, label: "Rosetta", color: "#1a5030" },
              { key: "orgs" as LayerKey, label: "Orgs", color: "#1e4d7a" },
              { key: "geography" as LayerKey, label: "Geography", color: "#4a2870" },
              { key: "domains" as LayerKey, label: "Domains", color: "#4a2870" },
            ]).map(l => (
              <button key={l.key} onClick={() => toggleLayer(l.key)} style={{
                padding: "4px 9px", borderRadius: 16, fontSize: 10, fontWeight: 600,
                border: `1px solid ${layers[l.key] ? l.color + "60" : "#e5e0d8"}`,
                background: layers[l.key] ? l.color + "15" : "transparent",
                color: layers[l.key] ? l.color : "#9a918a", cursor: "pointer", transition: "all 0.2s",
              }}>{l.label}</button>
            ))}
            <div style={{ flex: 1 }} />
            <button onClick={() => setShowMissing(!showMissing)} style={{
              padding: "4px 9px", borderRadius: 16, fontSize: 10, fontWeight: 600,
              border: `1px solid ${showMissing ? "#ef444460" : "#e5e0d8"}`,
              background: showMissing ? "#ef444415" : "transparent",
              color: showMissing ? "#ef4444" : "#9a918a", cursor: "pointer",
            }}>{showMissing ? "Hide" : "Show"} Gaps</button>
          </div>

          <div ref={svgContainerRef} onWheel={onWheel} onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onMouseUp}
            style={{ position: "relative", overflow: "hidden", borderRadius: 12, background: "radial-gradient(ellipse at 50% 50%, #f4f5f7 0%, #faf9f7 60%, #ffffff 100%)", cursor: isPanning ? "grabbing" : "grab", touchAction: "none" }}>
            <svg viewBox="0 0 1000 900" style={{ width: "100%", maxHeight: "72vh", transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "0 0", transition: isPanning ? "none" : "transform 0.1s ease-out" }}>
              <defs>
                <radialGradient id="coreGlow"><stop offset="0%" stopColor="#C75B2A" stopOpacity={0.14} /><stop offset="100%" stopColor="#C75B2A" stopOpacity={0} /></radialGradient>
                <filter id="glow"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                <filter id="selGlow"><feGaussianBlur stdDeviation="8" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
              </defs>

              {/* Orbital guides */}
              {layers.crosswalks && <circle cx={cx} cy={cy} r={56} fill="none" stroke="#1a5030" strokeWidth={0.4} strokeDasharray="2 4" opacity={0.25} />}
              {layers.centers && <circle cx={cx} cy={cy} r={95} fill="none" stroke="#f4f5f7" strokeWidth={0.5} opacity={0.35} />}
              {layers.lifeSit && <circle cx={cx} cy={cy} r={140} fill="none" stroke="#10b981" strokeWidth={0.3} strokeDasharray="1 8" opacity={0.12} />}
              {layers.pathways && <circle cx={cx} cy={cy} r={195} fill="none" stroke="#f4f5f7" strokeWidth={0.5} strokeDasharray="3 6" opacity={0.3} />}
              {layers.sdgs && <circle cx={cx} cy={cy} r={248} fill="none" stroke="#1e4d7a" strokeWidth={0.3} strokeDasharray="2 6" opacity={0.2} />}
              {layers.sdoh && <circle cx={cx} cy={cy} r={300} fill="none" stroke="#f4f5f7" strokeWidth={0.4} strokeDasharray="4 10" opacity={0.2} />}
              {layers.geography && <circle cx={cx} cy={cy} r={365} fill="none" stroke="#4a2870" strokeWidth={0.3} strokeDasharray="2 8" opacity={0.12} />}
              {layers.rings && <circle cx={cx} cy={cy} r={350} fill="none" stroke="#6366f1" strokeWidth={0.3} strokeDasharray="3 8" opacity={0.15} />}
              {layers.orgs && <circle cx={cx} cy={cy} r={430} fill="none" stroke="#1e4d7a" strokeWidth={0.2} strokeDasharray="2 12" opacity={0.1} />}
              <circle cx={cx} cy={cy} r={210} fill="url(#coreGlow)" />

              {/* Explosion */}
              {showExplosion && DIMENSION_GROUPS.map((g, gi) => g.dims.map((d, di) => {
                const total = DIMENSION_GROUPS.reduce((s, gg) => s + gg.dims.length, 0);
                const idx = DIMENSION_GROUPS.slice(0, gi).reduce((s, gg) => s + gg.dims.length, 0) + di;
                const a = (idx / total) * Math.PI * 2 - Math.PI / 2;
                const ex = cx + Math.cos(a) * 130, ey = cy + Math.sin(a) * 130;
                return (
                  <g key={`exp-${gi}-${di}`}>
                    <line x1={cx} y1={cy} x2={ex} y2={ey} stroke={g.color} strokeWidth={1} opacity={0.3} />
                    <circle cx={ex} cy={ey} r={3} fill={g.color} opacity={0.6} />
                    <text x={ex + (ex > cx ? 8 : -8)} y={ey + 3} fill={g.color} fontSize={5.5} textAnchor={ex > cx ? "start" : "end"} fontWeight={600} opacity={0.7}>{d.name}</text>
                  </g>
                );
              }))}

              {/* Life Sit → Pathway */}
              {layers.lifeSit && layers.pathways && LIFE_SITUATIONS.map((sit, i) => sit.themes.map((tid, j) => {
                const sn = lifeSitNodes[i], pw = pathwayNodes.find(n => n.id === tid);
                if (!pw) return null;
                const hot = hovered?.id === sn.id || hovered?.id === pw.id || selectedNode?.id === sn.id;
                return <line key={`ls-pw-${i}-${j}`} x1={sn.x} y1={sn.y} x2={pw.x} y2={pw.y} stroke="#10b981" strokeWidth={hot ? 1 : 0.3} opacity={hot ? 0.4 : 0.03} strokeDasharray="2 6" />;
              }))}

              {/* Org → Pathway */}
              {layers.orgs && layers.pathways && ORGANIZATIONS.map((org, i) => org.themes.map((tid, j) => {
                const on = orgNodes[i], pw = pathwayNodes.find(n => n.id === tid);
                if (!pw) return null;
                const hot = hovered?.id === on.id || hovered?.id === pw.id || selectedNode?.id === on.id;
                return <line key={`org-pw-${i}-${j}`} x1={on.x} y1={on.y} x2={pw.x} y2={pw.y} stroke="#1e4d7a" strokeWidth={hot ? 1 : 0.2} opacity={hot ? 0.35 : 0.02} strokeDasharray="3 8" />;
              }))}

              {/* Center → Life Situation */}
              {layers.centers && layers.lifeSit && LIFE_SITUATIONS.map((sit, i) => sit.centers.map((cName, j) => {
                const sn = lifeSitNodes[i], cn = centerNodes.find(n => n.id === cName);
                if (!cn) return null;
                const hot = hovered?.id === sn.id || hovered?.id === cn.id || selectedNode?.id === cn.id;
                return <line key={`ctr-sit-${i}-${j}`} x1={cn.x} y1={cn.y} x2={sn.x} y2={sn.y} stroke="#6366f1" strokeWidth={hot ? 0.8 : 0.15} opacity={hot ? 0.3 : 0.015} strokeDasharray="2 8" />;
              }))}

              {/* Center → SDOH */}
              {layers.centers && layers.sdoh && Object.entries(CENTERS).map(([cName, ctr]) => ctr.sdoh.map((code, j) => {
                const cn = centerNodes.find(n => n.id === cName), sn = sdohNodes.find(n => n.id === code);
                if (!cn || !sn) return null;
                const hot = hovered?.id === cn.id || hovered?.id === sn.id || selectedNode?.id === cn.id;
                return <line key={`ctr-sdoh-${cName}-${j}`} x1={cn.x} y1={cn.y} x2={sn.x} y2={sn.y} stroke="#1b5e8a" strokeWidth={hot ? 0.8 : 0.15} opacity={hot ? 0.3 : 0.015} strokeDasharray="2 8" />;
              }))}

              {/* Center → SDG */}
              {layers.centers && layers.sdgs && Object.entries(CENTERS).map(([cName, ctr]) => ctr.sdgs.map((sdgId, j) => {
                const cn = centerNodes.find(n => n.id === cName), sn = sdgNodes.find(n => n.id === sdgId);
                if (!cn || !sn) return null;
                const hot = hovered?.id === cn.id || hovered?.id === sn.id || selectedNode?.id === cn.id;
                return <line key={`ctr-sdg-${cName}-${j}`} x1={cn.x} y1={cn.y} x2={sn.x} y2={sn.y} stroke="#1e4d7a" strokeWidth={hot ? 0.8 : 0.15} opacity={hot ? 0.3 : 0.015} strokeDasharray="2 8" />;
              }))}

              {/* Center → Organization */}
              {layers.centers && layers.orgs && Object.entries(CENTERS).map(([cName, ctr]) => ctr.orgs.map((orgId, j) => {
                const cn = centerNodes.find(n => n.id === cName), on = orgNodes.find(n => n.id === orgId);
                if (!cn || !on) return null;
                const hot = hovered?.id === cn.id || hovered?.id === on.id || selectedNode?.id === cn.id;
                return <line key={`ctr-org-${cName}-${j}`} x1={cn.x} y1={cn.y} x2={on.x} y2={on.y} stroke="#1e4d7a" strokeWidth={hot ? 0.8 : 0.15} opacity={hot ? 0.3 : 0.015} strokeDasharray="2 8" />;
              }))}

              {/* Center → Geography */}
              {layers.centers && layers.geography && Object.entries(CENTERS).map(([cName, ctr]) => ctr.geos.map((geoId, j) => {
                const cn = centerNodes.find(n => n.id === cName), gn = geoNodes.find(n => n.id === geoId);
                if (!cn || !gn) return null;
                const hot = hovered?.id === cn.id || hovered?.id === gn.id || selectedNode?.id === cn.id;
                return <line key={`ctr-geo-${cName}-${j}`} x1={cn.x} y1={cn.y} x2={gn.x} y2={gn.y} stroke="#4a2870" strokeWidth={hot ? 0.8 : 0.15} opacity={hot ? 0.3 : 0.015} strokeDasharray="2 8" />;
              }))}

              {/* SDOH → Life Situation */}
              {layers.sdoh && layers.lifeSit && LIFE_SITUATIONS.map((sit, i) => {
                const sn = lifeSitNodes[i], dn = sdohNodes.find(n => n.id === sit.sdoh);
                if (!dn) return null;
                const hot = hovered?.id === sn.id || hovered?.id === dn.id || selectedNode?.id === sn.id || selectedNode?.id === dn.id;
                return <line key={`sdoh-sit-${i}`} x1={dn.x} y1={dn.y} x2={sn.x} y2={sn.y} stroke="#1b5e8a" strokeWidth={hot ? 0.8 : 0.15} opacity={hot ? 0.3 : 0.015} strokeDasharray="2 8" />;
              })}

              {/* SDG → Life Situation */}
              {layers.sdgs && layers.lifeSit && LIFE_SITUATIONS.map((sit, i) => {
                const sn = lifeSitNodes[i], sg = sdgNodes.find(n => n.id === sit.sdg);
                if (!sg) return null;
                const hot = hovered?.id === sn.id || hovered?.id === sg.id || selectedNode?.id === sn.id || selectedNode?.id === sg.id;
                return <line key={`sdg-sit-${i}`} x1={sg.x} y1={sg.y} x2={sn.x} y2={sn.y} stroke="#1e4d7a" strokeWidth={hot ? 0.8 : 0.15} opacity={hot ? 0.3 : 0.015} strokeDasharray="2 8" />;
              })}

              {/* Pathway → Ring */}
              {layers.pathways && layers.rings && Object.entries(THEMES).map(([tid, theme]) => Object.entries(theme.rings).filter(([, cnt]) => cnt > 0).map(([ringId, cnt], j) => {
                const pw = pathwayNodes.find(n => n.id === tid), rn = ringNodes.find(n => n.id === ringId);
                if (!pw || !rn) return null;
                const hot = hovered?.id === pw.id || hovered?.id === rn.id || selectedNode?.id === pw.id;
                return <line key={`pw-ring-${tid}-${j}`} x1={pw.x} y1={pw.y} x2={rn.x} y2={rn.y} stroke={theme.color} strokeWidth={hot ? 1 : 0.2} opacity={hot ? 0.35 : 0.02} strokeDasharray="3 8" />;
              }))}

              {/* Ring → Center */}
              {layers.rings && layers.centers && ringNodes.map((r, i) => centerNodes.map((cn, j) => {
                const hot = hovered?.id === r.id || hovered?.id === cn.id;
                return <line key={`ring-c-${i}-${j}`} x1={r.x} y1={r.y} x2={cn.x} y2={cn.y} stroke="#6366f1" strokeWidth={hot ? 0.8 : 0.15} opacity={hot ? 0.25 : 0.01} strokeDasharray="2 10" />;
              }))}

              {/* Ring → Org */}
              {layers.rings && layers.orgs && RINGS.map((ring, i) => (ring.orgs || []).map((orgId, j) => {
                const rn = ringNodes[i], on = orgNodes.find(n => n.id === orgId);
                if (!on) return null;
                const hot = hovered?.id === rn.id || hovered?.id === on.id || selectedNode?.id === rn.id || selectedNode?.id === on.id;
                return <line key={`ring-org-${i}-${j}`} x1={rn.x} y1={rn.y} x2={on.x} y2={on.y} stroke="#10b981" strokeWidth={hot ? 1 : 0.2} opacity={hot ? 0.35 : 0.02} strokeDasharray="3 8" />;
              }))}

              {/* Ring → Geography */}
              {layers.rings && layers.geography && RINGS.map((ring, i) => (ring.geos || []).map((geoId, j) => {
                const rn = ringNodes[i], gn = geoNodes.find(n => n.id === geoId);
                if (!gn) return null;
                const hot = hovered?.id === rn.id || hovered?.id === gn.id || selectedNode?.id === rn.id || selectedNode?.id === gn.id;
                return <line key={`ring-geo-${i}-${j}`} x1={rn.x} y1={rn.y} x2={gn.x} y2={gn.y} stroke="#4a2870" strokeWidth={hot ? 1 : 0.15} opacity={hot ? 0.3 : 0.015} strokeDasharray="2 10" />;
              }))}

              {/* Ring → SDOH */}
              {layers.rings && layers.sdoh && RINGS.map((ring, i) => (ring.sdoh || []).map((code, j) => {
                const rn = ringNodes[i], sn = sdohNodes.find(n => n.id === code);
                if (!sn) return null;
                const hot = hovered?.id === rn.id || hovered?.id === sn.id || selectedNode?.id === rn.id;
                return <line key={`ring-sdoh-${i}-${j}`} x1={rn.x} y1={rn.y} x2={sn.x} y2={sn.y} stroke="#1b5e8a" strokeWidth={hot ? 0.8 : 0.15} opacity={hot ? 0.3 : 0.015} strokeDasharray="2 10" />;
              }))}

              {/* Ring → SDG */}
              {layers.rings && layers.sdgs && RINGS.map((ring, i) => (ring.sdgs || []).map((sdgId, j) => {
                const rn = ringNodes[i], sn = sdgNodes.find(n => n.id === sdgId);
                if (!sn) return null;
                const hot = hovered?.id === rn.id || hovered?.id === sn.id || selectedNode?.id === rn.id;
                return <line key={`ring-sdg-${i}-${j}`} x1={rn.x} y1={rn.y} x2={sn.x} y2={sn.y} stroke="#1e4d7a" strokeWidth={hot ? 0.8 : 0.15} opacity={hot ? 0.3 : 0.015} strokeDasharray="2 10" />;
              }))}

              {/* Ring → Life Situation */}
              {layers.rings && layers.lifeSit && RINGS.map((ring, i) => (ring.situations || []).map((sit, j) => {
                const rn = ringNodes[i], sn = lifeSitNodes.find(n => n.id === sit);
                if (!sn) return null;
                const hot = hovered?.id === rn.id || hovered?.id === sn.id || selectedNode?.id === rn.id;
                return <line key={`ring-sit-${i}-${j}`} x1={rn.x} y1={rn.y} x2={sn.x} y2={sn.y} stroke="#10b981" strokeWidth={hot ? 0.8 : 0.15} opacity={hot ? 0.3 : 0.015} strokeDasharray="2 10" />;
              }))}

              {/* Geography → SDG */}
              {layers.geography && layers.sdgs && GEOGRAPHY.map((geo, i) => (geo.sdgs || []).map((sdgId, j) => {
                const gn = geoNodes[i], sn = sdgNodes.find(n => n.id === sdgId);
                if (!sn) return null;
                const hot = hovered?.id === gn.id || hovered?.id === sn.id || selectedNode?.id === gn.id;
                return <line key={`geo-sdg-${i}-${j}`} x1={gn.x} y1={gn.y} x2={sn.x} y2={sn.y} stroke="#1e4d7a" strokeWidth={hot ? 0.8 : 0.15} opacity={hot ? 0.3 : 0.015} strokeDasharray="2 10" />;
              }))}

              {/* Geography → SDOH */}
              {layers.geography && layers.sdoh && GEOGRAPHY.map((geo, i) => geo.sdoh.map((code, j) => {
                const gn = geoNodes[i], sn = sdohNodes.find(n => n.id === code);
                if (!sn) return null;
                const hot = hovered?.id === gn.id || hovered?.id === sn.id || selectedNode?.id === gn.id;
                return <line key={`geo-sdoh-${i}-${j}`} x1={gn.x} y1={gn.y} x2={sn.x} y2={sn.y} stroke="#1b5e8a" strokeWidth={hot ? 0.8 : 0.15} opacity={hot ? 0.3 : 0.015} strokeDasharray="2 10" />;
              }))}

              {/* Org → SDOH */}
              {layers.orgs && layers.sdoh && ORGANIZATIONS.map((org, i) => org.sdoh.map((code, j) => {
                const on = orgNodes[i], sn = sdohNodes.find(n => n.id === code);
                if (!sn) return null;
                const hot = hovered?.id === on.id || hovered?.id === sn.id || selectedNode?.id === on.id;
                return <line key={`org-sdoh-${i}-${j}`} x1={on.x} y1={on.y} x2={sn.x} y2={sn.y} stroke="#1b5e8a" strokeWidth={hot ? 1 : 0.2} opacity={hot ? 0.35 : 0.02} strokeDasharray="3 8" />;
              }))}

              {/* Org → SDG */}
              {layers.orgs && layers.sdgs && ORGANIZATIONS.map((org, i) => org.sdgs.map((sdgId, j) => {
                const on = orgNodes[i], sn = sdgNodes.find(n => n.id === sdgId);
                if (!sn) return null;
                const hot = hovered?.id === on.id || hovered?.id === sn.id || selectedNode?.id === on.id;
                return <line key={`org-sdg-${i}-${j}`} x1={on.x} y1={on.y} x2={sn.x} y2={sn.y} stroke="#1e4d7a" strokeWidth={hot ? 1 : 0.2} opacity={hot ? 0.35 : 0.02} strokeDasharray="3 8" />;
              }))}

              {/* Org → Life Situation */}
              {layers.orgs && layers.lifeSit && ORGANIZATIONS.map((org, i) => org.situations.map((sit, j) => {
                const on = orgNodes[i], sn = lifeSitNodes.find(n => n.id === sit);
                if (!sn) return null;
                const hot = hovered?.id === on.id || hovered?.id === sn.id || selectedNode?.id === on.id;
                return <line key={`org-sit-${i}-${j}`} x1={on.x} y1={on.y} x2={sn.x} y2={sn.y} stroke="#10b981" strokeWidth={hot ? 1 : 0.2} opacity={hot ? 0.35 : 0.02} strokeDasharray="3 8" />;
              }))}

              {/* Pathway → SDOH */}
              {layers.pathways && layers.sdoh && Object.entries(THEMES).map(([tid, theme]) => theme.sdoh.map((code, j) => {
                const pw = pathwayNodes.find(n => n.id === tid), sn = sdohNodes.find(n => n.id === code);
                if (!pw || !sn) return null;
                const hot = hovered?.id === pw.id || hovered?.id === sn.id || selectedNode?.id === pw.id;
                return <line key={`pw-sdoh-${tid}-${j}`} x1={pw.x} y1={pw.y} x2={sn.x} y2={sn.y} stroke="#1b5e8a" strokeWidth={hot ? 1 : 0.3} opacity={hot ? 0.4 : 0.03} strokeDasharray="3 8" />;
              }))}

              {/* Pathway → SDG */}
              {layers.pathways && layers.sdgs && Object.entries(THEMES).map(([tid, theme]) => theme.sdgs.map((sdgId, j) => {
                const pw = pathwayNodes.find(n => n.id === tid), sn = sdgNodes.find(n => n.id === sdgId);
                if (!pw || !sn) return null;
                const hot = hovered?.id === pw.id || hovered?.id === sn.id || selectedNode?.id === pw.id;
                return <line key={`pw-sdg-${tid}-${j}`} x1={pw.x} y1={pw.y} x2={sn.x} y2={sn.y} stroke="#1e4d7a" strokeWidth={hot ? 1 : 0.3} opacity={hot ? 0.4 : 0.03} strokeDasharray="3 8" />;
              }))}

              {/* Org → Geography */}
              {layers.orgs && layers.geography && GEOGRAPHY.map((geo, i) => geo.orgs.map((orgId, j) => {
                const gn = geoNodes[i], on = orgNodes.find(n => n.id === orgId);
                if (!on) return null;
                const hot = hovered?.id === gn.id || hovered?.id === on.id || selectedNode?.id === gn.id || selectedNode?.id === on.id;
                return <line key={`org-geo-${i}-${j}`} x1={on.x} y1={on.y} x2={gn.x} y2={gn.y} stroke="#4a2870" strokeWidth={hot ? 1.2 : 0.3} opacity={hot ? 0.4 : 0.03} />;
              }))}

              {/* Geography → Life Situation */}
              {layers.geography && layers.lifeSit && GEOGRAPHY.map((geo, i) => geo.situations.map((sit, j) => {
                const gn = geoNodes[i], sn = lifeSitNodes.find(n => n.id === sit);
                if (!sn) return null;
                const hot = hovered?.id === gn.id || hovered?.id === sn.id || selectedNode?.id === gn.id;
                return <line key={`geo-sit-${i}-${j}`} x1={gn.x} y1={gn.y} x2={sn.x} y2={sn.y} stroke="#10b981" strokeWidth={hot ? 1 : 0.2} opacity={hot ? 0.35 : 0.02} strokeDasharray="3 8" />;
              }))}

              {/* Geography → Pathway */}
              {layers.geography && layers.pathways && GEOGRAPHY.map((geo, i) => geo.pathways.map((tid, j) => {
                const gn = geoNodes[i], pw = pathwayNodes.find(n => n.id === tid);
                if (!pw) return null;
                const hot = hovered?.id === gn.id || hovered?.id === pw.id || selectedNode?.id === gn.id;
                return <line key={`geo-pw-${i}-${j}`} x1={gn.x} y1={gn.y} x2={pw.x} y2={pw.y} stroke={THEMES[tid]?.color || "#4a2870"} strokeWidth={hot ? 1 : 0.2} opacity={hot ? 0.35 : 0.02} strokeDasharray="3 8" />;
              }))}

              {/* SDG ↔ SDOH */}
              {showMissing && layers.sdgs && layers.sdoh && SDG_SDOH_LINKS.map((link, i) => {
                const s = sdgNodes.find(n => n.id === link.sdg), d = sdohNodes.find(n => n.id === link.sdoh);
                if (!s || !d) return null;
                return <line key={`sdg-sdoh-${i}`} x1={s.x} y1={s.y} x2={d.x} y2={d.y} stroke="#f59e0b" strokeWidth={0.8} opacity={0.15} strokeDasharray="4 4"><animate attributeName="opacity" values="0.1;0.25;0.1" dur="3s" repeatCount="indefinite" /></line>;
              })}

              {/* SDOH → Hub */}
              {layers.sdoh && sdohNodes.map((n, i) => <line key={`sdoh-l-${i}`} x1={cx} y1={cy} x2={n.x} y2={n.y} stroke={n.color} strokeWidth={0.5} opacity={hovered?.id === n.id || selectedNode?.id === n.id ? 0.4 : 0.06} strokeDasharray="3 10" />)}

              {/* Pathway → Center */}
              {layers.pathways && layers.centers && edges.map((e, i) => {
                const hot = hovered?.id === e.from.id || hovered?.id === e.to.id || hoveredEdge === i || selectedNode?.id === e.from.id || selectedNode?.id === e.to.id;
                return (
                  <g key={`edge-${i}`} onMouseEnter={() => setHoveredEdge(i)} onMouseLeave={() => setHoveredEdge(null)}>
                    <line x1={e.from.x} y1={e.from.y} x2={e.to.x} y2={e.to.y} stroke={THEMES[e.from.id as string]?.color || "#555"} strokeWidth={Math.max(0.6, e.count / 5)} opacity={hot ? 0.55 : 0.07} strokeDasharray={hot ? "none" : "3 5"} />
                    {hot && <text x={(e.from.x + e.to.x) / 2} y={(e.from.y + e.to.y) / 2 - 6} fill="#2C2C2C" fontSize={9} textAnchor="middle" style={{ pointerEvents: "none" }}>{e.count}</text>}
                  </g>
                );
              })}

              {/* Bridging arcs */}
              {layers.bridging && BRIDGING.map((b, i) => {
                const a = pathwayNodes.find(n => n.id === b.a), bb = pathwayNodes.find(n => n.id === b.b);
                if (!a || !bb) return null;
                const hot = hovered?.id === a.id || hovered?.id === bb.id || selectedNode?.id === a.id || selectedNode?.id === bb.id;
                return (
                  <g key={`bridge-${i}`}>
                    <path d={arcPath(a.x, a.y, bb.x, bb.y)} fill="none" stroke="#d53f8c" strokeWidth={hot ? 1.5 : 0.6} opacity={hot ? 0.4 : 0.08} strokeDasharray="4 6"><animate attributeName="stroke-dashoffset" from="0" to="-20" dur="4s" repeatCount="indefinite" /></path>
                    {hot && <text x={(a.x + bb.x) / 2} y={(a.y + bb.y) / 2 - 14} fill="#d53f8c" fontSize={7} textAnchor="middle" fontWeight={600}>{b.shared} — {b.reason}</text>}
                  </g>
                );
              })}

              {/* Missing bridges */}
              {showMissing && layers.bridging && MISSING_BRIDGES.map((b, i) => {
                const a = pathwayNodes.find(n => n.id === b.a), bb = pathwayNodes.find(n => n.id === b.b);
                if (!a || !bb) return null;
                return (
                  <g key={`miss-${i}`}>
                    <path d={arcPath(a.x, a.y, bb.x, bb.y)} fill="none" stroke="#ef4444" strokeWidth={1} opacity={0.2} strokeDasharray="6 4"><animate attributeName="opacity" values="0.12;0.3;0.12" dur="2s" repeatCount="indefinite" /></path>
                  </g>
                );
              })}

              {/* Particles */}
              {layers.pathways && pathwayNodes.map((p, i) => {
                const phase = ((animPhase + i * 51) % 360) / 360;
                return <circle key={`pt-${i}`} cx={p.x + (cx - p.x) * phase} cy={p.y + (cy - p.y) * phase} r={1.8} fill={p.color} opacity={0.5 * (1 - phase)} />;
              })}

              {/* ─── Nodes ─────────────────────────────────── */}

              {/* Org nodes */}
              {layers.orgs && orgNodes.map((o, i) => {
                const isH = hovered?.id === o.id, isSel = selectedNode?.id === o.id, dim = search && !matchesSearch(o);
                const r = 4 + Math.log10(o.count + 1) * 3;
                return (
                  <g key={`org-${i}`} data-node style={{ cursor: "pointer", opacity: dim ? 0.15 : 1 }} onMouseEnter={() => setHovered(o)} onMouseLeave={() => setHovered(null)} onClick={() => selectNode(o)}>
                    {isSel && <circle cx={o.x} cy={o.y} r={r * 3} fill={o.color} opacity={0.1} filter="url(#selGlow)" />}
                    <rect x={o.x - r} y={o.y - r} width={r * 2} height={r * 2} rx={3} fill={o.color} opacity={isH || isSel ? 0.7 : 0.2} stroke={isSel ? "#fff" : "none"} strokeWidth={1} />
                    {(isH || isSel || o.count > 10) && <text x={o.x} y={o.y + r + 12} fill={isH || isSel ? "#2C2C2C" : "#e5e0d8"} fontSize={7} textAnchor="middle" fontWeight={isH ? 600 : 400}>{o.name}</text>}
                    {(isH || isSel) && <text x={o.x} y={o.y + r + 21} fill={o.color} fontSize={7} textAnchor="middle">{o.count} · {o.pipeline}</text>}
                  </g>
                );
              })}

              {/* Geography nodes (hexagons) */}
              {layers.geography && geoNodes.map((g, i) => {
                const isH = hovered?.id === g.id, isSel = selectedNode?.id === g.id, dim = search && !matchesSearch(g);
                const r = 12;
                const hex = Array.from({ length: 6 }, (_, k) => {
                  const angle = (k / 6) * Math.PI * 2 - Math.PI / 6;
                  return `${g.x + Math.cos(angle) * r},${g.y + Math.sin(angle) * r}`;
                }).join(" ");
                return (
                  <g key={`geo-${i}`} data-node style={{ cursor: "pointer", opacity: dim ? 0.15 : 1 }} onMouseEnter={() => setHovered(g)} onMouseLeave={() => setHovered(null)} onClick={() => selectNode(g)}>
                    {isSel && <circle cx={g.x} cy={g.y} r={r * 2.5} fill="#4a2870" opacity={0.1} filter="url(#selGlow)" />}
                    <polygon points={hex} fill="#f8f6f3" stroke="#4a2870" strokeWidth={isSel ? 2.5 : isH ? 2 : 1} opacity={isH || isSel ? 1 : 0.4} />
                    <circle cx={g.x} cy={g.y} r={4} fill="#4a2870" opacity={isH || isSel ? 0.7 : 0.3} />
                    {(isH || isSel) && <text x={g.x} y={g.y + r + 14} fill="#4a2870" fontSize={7} textAnchor="middle" fontWeight={600}>{g.name}</text>}
                    {(isH || isSel) && <text x={g.x} y={g.y + r + 23} fill="#8b8178" fontSize={6} textAnchor="middle">{g.population?.toLocaleString()} pop · {g.zips?.join(", ")}</text>}
                  </g>
                );
              })}

              {/* Ring nodes */}
              {layers.rings && ringNodes.map((r) => {
                const isH = hovered?.id === r.id, isSel = selectedNode?.id === r.id, dim = search && !matchesSearch(r);
                return (
                  <g key={r.id} data-node style={{ cursor: "pointer", opacity: dim ? 0.15 : 1 }} onMouseEnter={() => setHovered(r)} onMouseLeave={() => setHovered(null)} onClick={() => selectNode(r)}>
                    {isSel && <circle cx={r.x} cy={r.y} r={24} fill={r.color} opacity={0.1} filter="url(#selGlow)" />}
                    <circle cx={r.x} cy={r.y} r={16} fill="#f8f6f3" stroke={r.color} strokeWidth={isSel ? 2.5 : isH ? 2 : 1} opacity={isH || isSel ? 1 : 0.5} />
                    <text x={r.x} y={r.y + 4} fill={r.color} fontSize={9} textAnchor="middle" fontWeight={800}>{r.count}</text>
                    <text x={r.x} y={r.y + (r.y < cy ? -22 : 28)} fill={isH || isSel ? r.color : "#e5e0d8"} fontSize={8} textAnchor="middle" fontWeight={600}>{r.name}</text>
                    {(isH || isSel) && <text x={r.x} y={r.y + (r.y < cy ? -12 : 38)} fill="#8b8178" fontSize={7} textAnchor="middle">{r.count}</text>}
                  </g>
                );
              })}

              {/* Domain clusters */}
              {layers.domains && domainNodes.map((d) => {
                const isH = hovered?.id === d.id, isSel = selectedNode?.id === d.id, dim = search && !matchesSearch(d);
                const clusterR = 17 + d.items.length * 2.5;
                return (
                  <g key={d.id} data-node style={{ cursor: "pointer", opacity: dim ? 0.15 : 1 }} onMouseEnter={() => setHovered(d)} onMouseLeave={() => setHovered(null)} onClick={() => selectNode(d)}>
                    <circle cx={d.x} cy={d.y} r={clusterR + 8} fill={d.color} opacity={isH || isSel ? 0.08 : 0.015} />
                    <circle cx={d.x} cy={d.y} r={16} fill="#ffffff" stroke={d.color} strokeWidth={isSel ? 2.5 : isH ? 2 : 0.7} opacity={isH || isSel ? 1 : 0.5} />
                    <text x={d.x} y={d.y + 4} fill={d.color} fontSize={9} textAnchor="middle" fontWeight={800}>{d.items.length}</text>
                    <text x={d.x} y={d.y + (d.y < cy ? -(clusterR + 4) : clusterR + 10)} fill={isH || isSel ? d.color : "#e5e0d8"} fontSize={8} textAnchor="middle" fontWeight={600}>{d.name}</text>
                    {d.items.map((item: any, j: number) => {
                      const a = (j / d.items.length) * Math.PI * 2 - Math.PI / 2;
                      return <circle key={`${d.id}-${j}`} cx={d.x + Math.cos(a) * clusterR} cy={d.y + Math.sin(a) * clusterR} r={2 + Math.log10(item.count + 1) * 1.5} fill={d.color} opacity={isH || isSel ? 0.65 : 0.12} />;
                    })}
                  </g>
                );
              })}

              {/* SDOH */}
              {layers.sdoh && sdohNodes.map((n) => {
                const isH = hovered?.id === n.id, isSel = selectedNode?.id === n.id, dim = search && !matchesSearch(n);
                const r = 9 + n.count / 7;
                return (
                  <g key={n.id} data-node style={{ cursor: "pointer", opacity: dim ? 0.15 : 1 }} onMouseEnter={() => setHovered(n)} onMouseLeave={() => setHovered(null)} onClick={() => selectNode(n)}>
                    {isSel && <circle cx={n.x} cy={n.y} r={r * 2.2} fill={n.color} opacity={0.12} filter="url(#selGlow)" />}
                    <circle cx={n.x} cy={n.y} r={r} fill={n.color} opacity={isH || isSel ? 0.75 : 0.3} stroke={isSel ? "#fff" : "none"} strokeWidth={1} filter={isH ? "url(#glow)" : undefined} />
                    <text x={n.x} y={n.y + 3.5} fill="#fff" fontSize={8} textAnchor="middle" fontWeight={700}>{n.count}</text>
                    <text x={n.x} y={n.y + (n.y < cy ? -(r + 7) : r + 13)} fill={isH || isSel ? n.color : "#e5e0d8"} fontSize={8.5} textAnchor="middle" fontWeight={500}>{n.short}</text>
                  </g>
                );
              })}

              {/* SDGs */}
              {layers.sdgs && sdgNodes.map((s) => {
                const isH = hovered?.id === s.id, isSel = selectedNode?.id === s.id, dim = search && !matchesSearch(s);
                const r = 4 + Math.log2(s.count + 1) * 2;
                return (
                  <g key={`sdg-${s.id}`} data-node style={{ cursor: "pointer", opacity: dim ? 0.15 : 1 }} onMouseEnter={() => setHovered(s)} onMouseLeave={() => setHovered(null)} onClick={() => selectNode(s)}>
                    {isSel && <circle cx={s.x} cy={s.y} r={r * 3} fill={s.color} opacity={0.12} filter="url(#selGlow)" />}
                    <circle cx={s.x} cy={s.y} r={r} fill={s.color} opacity={isH || isSel ? 0.8 : 0.25} stroke={isSel ? "#fff" : "none"} strokeWidth={1} filter={isH ? "url(#glow)" : undefined} />
                    <text x={s.x} y={s.y + 3} fill="#fff" fontSize={isH || isSel ? 7 : 6} textAnchor="middle" fontWeight={600}>{isH || isSel ? s.count : s.id}</text>
                    {(isH || isSel) && <text x={s.x} y={s.y + (s.y < cy ? -(r + 6) : r + 12)} fill={s.color} fontSize={7} textAnchor="middle" fontWeight={600}>SDG {s.id}: {s.name}</text>}
                  </g>
                );
              })}

              {/* Pathways */}
              {layers.pathways && pathwayNodes.map((n, i) => {
                const isH = hovered?.id === n.id, isSel = selectedNode?.id === n.id, dim = search && !matchesSearch(n);
                return (
                  <g key={n.id} data-node style={{ cursor: "pointer", opacity: dim ? 0.15 : 1 }} onMouseEnter={() => setHovered(n)} onMouseLeave={() => setHovered(null)} onClick={() => selectNode(n)}>
                    {isSel && <circle cx={n.x} cy={n.y} r={36} fill={n.color} opacity={0.15} filter="url(#selGlow)" />}
                    <circle cx={n.x} cy={n.y} r={16 + n.content / 3} fill={n.color} opacity={0}><animate attributeName="opacity" values="0;0.1;0" dur="3s" begin={`${i * 0.4}s`} repeatCount="indefinite" /></circle>
                    <circle cx={n.x} cy={n.y} r={21} fill="#f8f6f3" stroke={n.color} strokeWidth={isSel ? 3 : isH ? 2.5 : 1.5} />
                    <circle cx={n.x} cy={n.y} r={8} fill={n.color} opacity={0.15} />
                    <text x={n.x} y={n.y + 3.5} fill={n.color} fontSize={9} textAnchor="middle" fontWeight={800}>{n.name.split(" ").pop()?.charAt(0) || ""}</text>
                    <text x={n.x} y={n.y + (n.y < cy ? -29 : 34)} fill={n.color} fontSize={10} textAnchor="middle" fontWeight={600}>{n.name}</text>
                    <text x={n.x} y={n.y + (n.y < cy ? -18 : 45)} fill="#9a918a" fontSize={8} textAnchor="middle">{n.content} · {n.focus}fa</text>
                  </g>
                );
              })}

              {/* Life Situations */}
              {layers.lifeSit && lifeSitNodes.map((s, i) => {
                const isH = hovered?.id === s.id, isSel = selectedNode?.id === s.id, dim = search && !matchesSearch(s);
                return (
                  <g key={`ls-${i}`} data-node style={{ cursor: "pointer", opacity: dim ? 0.15 : 1 }} onMouseEnter={() => setHovered(s)} onMouseLeave={() => setHovered(null)} onClick={() => selectNode(s)}>
                    {isSel && <circle cx={s.x} cy={s.y} r={16} fill="#10b981" opacity={0.15} filter="url(#selGlow)" />}
                    <circle cx={s.x} cy={s.y} r={isH || isSel ? 11 : 6} fill="#10b981" opacity={isH || isSel ? 0.3 : 0.08} />
                    <circle cx={s.x} cy={s.y} r={3} fill="#10b981" opacity={isH || isSel ? 0.8 : 0.4} />
                    {(isH || isSel) && <text x={s.x} y={s.y + 18} fill="#10b981" fontSize={7} textAnchor="middle" fontWeight={600}>{s.name} ({s.count})</text>}
                  </g>
                );
              })}

              {/* Centers */}
              {layers.centers && centerNodes.map((n) => {
                const isH = hovered?.id === n.id, isSel = selectedNode?.id === n.id;
                return (
                  <g key={n.id} data-node style={{ cursor: "pointer" }} onMouseEnter={() => setHovered(n)} onMouseLeave={() => setHovered(null)} onClick={() => selectNode(n)}>
                    {isSel && <circle cx={n.x} cy={n.y} r={38} fill={n.color} opacity={0.12} filter="url(#selGlow)" />}
                    <circle cx={n.x} cy={n.y} r={22} fill="#f8f6f3" stroke={n.color} strokeWidth={isSel ? 3 : isH ? 2.5 : 1.5} />
                    <circle cx={n.x} cy={n.y} r={9} fill={n.color} opacity={0.15} />
                    <text x={n.x} y={n.y + 3.5} fill={n.color} fontSize={10} textAnchor="middle" fontWeight={800}>{(n.name as string).charAt(0)}</text>
                    <text x={n.x} y={n.y + 34} fill={n.color} fontSize={9.5} textAnchor="middle" fontWeight={600}>{n.name}</text>
                    <text x={n.x} y={n.y + 45} fill="#9a918a" fontSize={8} textAnchor="middle">{n.count}</text>
                  </g>
                );
              })}

              {/* Crosswalks */}
              {layers.crosswalks && crosswalkNodes.map((co) => {
                const isH = hovered?.id === co.id, isSel = selectedNode?.id === co.id;
                return (
                  <g key={co.id} data-node style={{ cursor: "pointer" }} onMouseEnter={() => setHovered(co)} onMouseLeave={() => setHovered(null)} onClick={() => selectNode(co)}>
                    <circle cx={co.x} cy={co.y} r={isH || isSel ? 8 : 5} fill={co.color} opacity={isH || isSel ? 0.8 : 0.3} filter={isH ? "url(#glow)" : undefined} />
                    {(isH || isSel) && <><text x={co.x} y={co.y - 12} fill={co.color} fontSize={8} textAnchor="middle" fontWeight={700}>{co.name}</text><text x={co.x} y={co.y + 16} fill="#8b8178" fontSize={7} textAnchor="middle">{co.full} ({co.count})</text></>}
                  </g>
                );
              })}

              {/* Hub — Flower of Life */}
              <g data-node style={{ cursor: "pointer" }} onClick={() => setShowExplosion(!showExplosion)}>
                <circle cx={cx} cy={cy} r={34} fill="#f4f5f7" stroke="#C75B2A" strokeWidth={1.5} opacity={0.9} />
                <circle cx={cx} cy={cy} r={34} fill="url(#coreGlow)" />
                {/* Flower of Life: 6 petals + center */}
                {[0, 60, 120, 180, 240, 300].map(deg => {
                  const rad = (deg * Math.PI) / 180;
                  const px = cx + Math.cos(rad) * 12;
                  const py = cy + Math.sin(rad) * 12;
                  return <circle key={deg} cx={px} cy={py} r={12} fill="none" stroke="#C75B2A" strokeWidth={0.7} opacity={0.3} />;
                })}
                <circle cx={cx} cy={cy} r={12} fill="none" stroke="#C75B2A" strokeWidth={0.9} opacity={0.45} />
                <circle cx={cx} cy={cy} r={4} fill="#C75B2A" opacity={0.25} />
                <text x={cx} y={cy + 42} fill="#C75B2A" fontSize={6} textAnchor="middle" fontWeight={700} letterSpacing="0.08em" opacity={0.7}>CHANGE ENGINE</text>
                <text x={cx} y={cy + 50} fill="#9a918a" fontSize={5} textAnchor="middle">{showExplosion ? "click to collapse" : "click to explode dims"}</text>
              </g>
            </svg>

            {/* Zoom controls */}
            <div style={{ position: "absolute", bottom: 16, right: 16, display: "flex", flexDirection: "column", gap: 4 }}>
              <button onClick={() => setZoom(z => Math.min(z * 1.25, 5))} style={zoomBtnStyle}>+</button>
              <button onClick={resetView} style={{ ...zoomBtnStyle, fontSize: 10 }}>{Math.round(zoom * 100)}%</button>
              <button onClick={() => setZoom(z => Math.max(z / 1.25, 0.3))} style={zoomBtnStyle}>−</button>
            </div>

            {hasSearchResults && (
              <div style={{ position: "absolute", top: 12, left: 12, padding: "6px 12px", borderRadius: 8, background: "rgba(199,91,42,0.9)", color: "#fff", fontSize: 11, fontWeight: 600 }}>
                {allNodes.filter(matchesSearch).length} matches
              </div>
            )}
          </div>
        </div>
        <div style={{ width: 360, flexShrink: 0, borderLeft: "1px solid #e5e0d8", background: "#faf9f7", overflowY: "auto", maxHeight: "82vh", position: "sticky", top: 0 }}>
          {selectedNode ? (
            <div style={{ padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <span style={{ padding: "2px 8px", borderRadius: 12, fontSize: 10, fontWeight: 600, background: selectedNode.color + "20", color: selectedNode.color, textTransform: "uppercase", letterSpacing: "0.05em" }}>{selectedNode.type}</span>
                  <h3 style={{ margin: "6px 0 0", fontSize: 17, fontWeight: 700, color: selectedNode.color }}>{selectedNode.name}</h3>
                </div>
                <button onClick={() => setSelectedNode(null)} style={{ background: "#f4f5f7", border: "1px solid #e5e0d8", color: "#8b8178", cursor: "pointer", fontSize: 12, borderRadius: 8, padding: "4px 10px", whiteSpace: "nowrap" }}>ESC</button>
              </div>
              <div style={{ fontSize: 12, color: "#6b6157", lineHeight: 1.6, marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #e5e0d8" }}>
                {selectedNode.type === "pathway" && <>{selectedNode.content} items across {selectedNode.focus} focus areas, distributed across 5 rings. Each item classified across ~{TOTAL_DIMS} dimensions.</>}
                {selectedNode.type === "center" && <>Answers {"\u201C"}{selectedNode.question}{"\u201D"} — {selectedNode.count} items routed through all 7 pathways.</>}
                {selectedNode.type === "sdoh" && <>{selectedNode.count} items in {"\u201C"}{selectedNode.name}{"\u201D"} — links to pathways, SDGs, life situations, and organizations.</>}
                {selectedNode.type === "sdg" && <>UN SDG #{selectedNode.id}: {"\u201C"}{selectedNode.name}{"\u201D"} — {selectedNode.count} items. Cross-linked via the Rosetta Stone.</>}
                {selectedNode.type === "lifeSit" && <>{"\u201C"}{selectedNode.name}{"\u201D"} — {selectedNode.count} resources across pathways, centers, and service organizations.</>}
                {selectedNode.type === "ring" && <>{selectedNode.name}: {selectedNode.count} items. One of 5 content rings distributed across all 7 pathways.</>}
                {selectedNode.type === "org" && <>{selectedNode.name} ({selectedNode.domain}) — {selectedNode.count} articles. Status: {selectedNode.pipeline}.</>}
                {selectedNode.type === "geography" && <>{selectedNode.name} — pop. {selectedNode.population?.toLocaleString()}. ZIPs: {selectedNode.zips?.join(", ")}.</>}
                {selectedNode.type === "domain" && <>{selectedNode.items?.length} object types, {selectedNode.totalCount?.toLocaleString()} records.</>}
                {selectedNode.type === "crosswalk" && <>{selectedNode.full}: {selectedNode.count} codes in the Rosetta Stone.</>}
              </div>
              {selectedNode.type === "pathway" && (() => {
                const slugMap: Record<string, string> = { THEME_01: "health", THEME_02: "families", THEME_03: "neighborhood", THEME_04: "voice", THEME_05: "money", THEME_06: "planet", THEME_07: "the-bigger-we" };
                const slug = slugMap[selectedNode.id as string];
                return slug ? <a href={"/pathways/" + slug} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, background: selectedNode.color + "15", color: selectedNode.color, border: "1px solid " + selectedNode.color + "30", textDecoration: "none", marginBottom: 14 }}>View {selectedNode.name} pathway {"\u2192"}</a> : null;
              })()}
              {selectedNode.type === "org" && selectedNode.domain && (
                <a href={"https://" + selectedNode.domain} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, background: selectedNode.color + "15", color: selectedNode.color, border: "1px solid " + selectedNode.color + "30", textDecoration: "none", marginBottom: 14 }}>Visit {selectedNode.domain} {"\u2192"}</a>
              )}
              {selectedNode.type === "geography" && (
                <a href="/super-neighborhoods" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, background: "#4a287015", color: "#4a2870", border: "1px solid #4a287030", textDecoration: "none", marginBottom: 14 }}>View neighborhoods {"\u2192"}</a>
              )}
              {selectedNode.type === "ring" && (() => {
                const ringRoutes: Record<string, string> = { resources: "/news", guides: "/library", services: "/services", officials: "/officials", policies: "/policies" };
                const href = ringRoutes[selectedNode.id as string];
                return href ? <a href={href} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, background: selectedNode.color + "15", color: selectedNode.color, border: "1px solid " + selectedNode.color + "30", textDecoration: "none", marginBottom: 14 }}>Browse {selectedNode.name} {"\u2192"}</a> : null;
              })()}
              {(() => {
                const conns = getConnections(selectedNode);
                if (!conns.length) return null;
                return (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#8b8178", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Connections</div>
                    {conns.map((conn, i) => (
                      <div key={i} style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: conn.color, marginBottom: 4 }}>{conn.label}</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                          {conn.nodes.map((n, j) => {
                            const cleanName = n.replace(/[^\u0020-\u007E\u00A0-\u00FF]/g, "").trim();
                            const matchNode = allNodes.find(an => cleanName.startsWith(an.name));
                            return matchNode ? (
                              <button key={j} onClick={() => selectNode(matchNode)} style={{ padding: "3px 8px", borderRadius: 6, fontSize: 10, background: conn.color + "10", border: "1px solid " + conn.color + "20", color: "#4a453e", cursor: "pointer", lineHeight: 1.4, textAlign: "left" }}>{cleanName}</button>
                            ) : (
                              <span key={j} style={{ padding: "3px 8px", borderRadius: 6, fontSize: 10, background: conn.color + "10", border: "1px solid " + conn.color + "20", color: "#6b6157", lineHeight: 1.4 }}>{cleanName}</span>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          ) : (
            <div style={{ padding: 20 }}>
              <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: "#2C2C2C" }}>Galaxy Overview</h3>
              <p style={{ margin: "0 0 16px", fontSize: 11, color: "#8b8178", lineHeight: 1.5 }}>
                Click any node to inspect its mesh connections. Each node connects across ~{TOTAL_DIMS} dimensions.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 16 }}>
                {[
                  { label: "Records", value: STATS.totalRecords.toLocaleString(), color: "#E8723A" },
                  { label: "Edges", value: STATS.totalEdges.toLocaleString(), color: "#6366f1" },
                  { label: "Focus Areas", value: "164", color: "#1a5030" },
                  { label: "Organizations", value: String(STATS.orgs), color: "#1e4d7a" },
                  { label: "Translations", value: String(STATS.translations), color: "#f59e0b" },
                  { label: "Pathways", value: "7", color: "#E8723A" },
                ].map(s => (
                  <div key={s.label} style={{ padding: "8px 10px", background: "#ffffff", borderRadius: 8, borderLeft: "3px solid " + s.color }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 9, color: "#8b8178" }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#8b8178", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Node Types</div>
              {[
                { color: "#E8723A", label: "Pathways", desc: "7 community themes" },
                { color: "#6366f1", label: "Centers", desc: "4 engagement frames" },
                { color: "#10b981", label: "Life Situations", desc: "12 real-world needs" },
                { color: "#1e4d7a", label: "SDGs", desc: "12 UN Sustainable Goals" },
                { color: "#1b5e8a", label: "SDOH", desc: "5 health domains" },
                { color: "#1a5030", label: "Crosswalks", desc: "Rosetta Stone mapping" },
                { color: "#4a2870", label: "Geography", desc: "12 neighborhoods" },
                { color: "#1e4d7a", label: "Organizations", desc: "10 pipelined orgs" },
              ].map(l => (
                <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: l.color, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#2C2C2C" }}>{l.label}</div>
                    <div style={{ fontSize: 9, color: "#8b8178" }}>{l.desc}</div>
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 16, fontSize: 10, fontWeight: 700, color: "#8b8178", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Quick Links</div>
              {[
                { href: "/pathways", label: "All Pathways" },
                { href: "/services", label: "Local Resources" },
                { href: "/officials", label: "Officials" },
                { href: "/policies", label: "Policies" },
                { href: "/explore/knowledge-base", label: "Knowledge Base" },
                { href: "/super-neighborhoods", label: "Neighborhoods" },
              ].map(l => (
                <a key={l.href} href={l.href} style={{ display: "block", padding: "6px 10px", marginBottom: 3, borderRadius: 6, fontSize: 11, color: "#E8723A", fontWeight: 500, textDecoration: "none", background: "transparent" }}>{l.label} {"\u2192"}</a>
              ))}
            </div>
          )}
        </div>
        </div>
      )}

      {/* ═══════════════════ NODE MAP VIEW ═══════════════════ */}
      {view === "nodemap" && (() => {
        // Organize nodes into typed columns for a hierarchical left-to-right map
        const columns: { label: string; color: string; nodes: NodeBase[] }[] = [
          { label: "Crosswalks", color: "#1a5030", nodes: crosswalkNodes },
          { label: "Centers", color: "#6366f1", nodes: centerNodes },
          { label: "Life Situations", color: "#10b981", nodes: lifeSitNodes },
          { label: "Pathways", color: "#C75B2A", nodes: pathwayNodes },
          { label: "SDGs", color: "#1e4d7a", nodes: sdgNodes },
          { label: "SDOH", color: "#1b5e8a", nodes: sdohNodes },
          { label: "Geography", color: "#4a2870", nodes: geoNodes },
          { label: "Content Rings", color: "#6366f1", nodes: ringNodes },
          { label: "Organizations", color: "#1e4d7a", nodes: orgNodes },
          { label: "Domains", color: "#4a2870", nodes: domainNodes },
        ];

        const colWidth = 120;
        const nodeSpacingY = 42;
        const headerH = 40;
        const padX = 60;
        const padY = 20;
        const totalW = padX * 2 + columns.length * colWidth;
        const maxNodesInCol = Math.max(...columns.map(c => c.nodes.length));
        const totalH = padY + headerH + maxNodesInCol * nodeSpacingY + 40;

        // Assign map positions
        const mapPositions = new Map<string | number, { x: number; y: number; color: string; name: string; type: string }>();
        columns.forEach((col, ci) => {
          const colX = padX + ci * colWidth + colWidth / 2;
          col.nodes.forEach((n, ni) => {
            const nodeY = padY + headerH + ni * nodeSpacingY + nodeSpacingY / 2;
            mapPositions.set(n.id, { x: colX, y: nodeY, color: n.color, name: n.name, type: n.type });
          });
        });

        // Build edges for the node map
        type MapEdge = { fromId: string | number; toId: string | number; color: string; label?: string };
        const mapEdges: MapEdge[] = [];

        // Pathway → Center
        PATHWAY_CENTER.filter(e => e.n > 0).forEach(e => {
          mapEdges.push({ fromId: e.pw, toId: e.c, color: THEMES[e.pw]?.color || "#555", label: String(e.n) });
        });

        // Life Sit → Pathway
        LIFE_SITUATIONS.forEach(sit => {
          sit.themes.forEach(tid => mapEdges.push({ fromId: sit.name, toId: tid, color: "#10b981" }));
        });

        // SDOH → Pathway (via theme linkage)
        SDOH.forEach(s => {
          s.themes.forEach(tid => mapEdges.push({ fromId: s.id, toId: tid, color: s.color }));
        });

        // SDG ↔ SDOH
        SDG_SDOH_LINKS.forEach(l => {
          mapEdges.push({ fromId: l.sdg, toId: l.sdoh, color: "#f59e0b" });
        });

        // Center → SDOH
        Object.entries(CENTERS).forEach(([cName, ctr]) => {
          ctr.sdoh.forEach(code => mapEdges.push({ fromId: cName, toId: code, color: "#1b5e8a" }));
        });

        // Center → SDG
        Object.entries(CENTERS).forEach(([cName, ctr]) => {
          ctr.sdgs.forEach(sdgId => mapEdges.push({ fromId: cName, toId: sdgId, color: "#1e4d7a" }));
        });

        // Center → Organization
        Object.entries(CENTERS).forEach(([cName, ctr]) => {
          ctr.orgs.forEach(orgId => mapEdges.push({ fromId: cName, toId: orgId, color: "#1e4d7a" }));
        });

        // Center → Geography
        Object.entries(CENTERS).forEach(([cName, ctr]) => {
          ctr.geos.forEach(geoId => mapEdges.push({ fromId: cName, toId: geoId, color: "#4a2870" }));
        });

        // Center → Life Situation
        LIFE_SITUATIONS.forEach(sit => {
          sit.centers.forEach(cName => mapEdges.push({ fromId: cName, toId: sit.name, color: "#6366f1" }));
        });

        // SDOH → Life Situation
        LIFE_SITUATIONS.forEach(sit => {
          mapEdges.push({ fromId: sit.sdoh, toId: sit.name, color: "#1b5e8a" });
        });

        // SDG → Life Situation
        LIFE_SITUATIONS.forEach(sit => {
          mapEdges.push({ fromId: sit.sdg, toId: sit.name, color: "#1e4d7a" });
        });

        // Pathway → Ring
        Object.entries(THEMES).forEach(([tid, theme]) => {
          Object.entries(theme.rings).filter(([, cnt]) => cnt > 0).forEach(([ringId]) => {
            mapEdges.push({ fromId: tid, toId: ringId, color: theme.color });
          });
        });

        // Org → Pathway
        ORGANIZATIONS.forEach(o => {
          o.themes.forEach(tid => mapEdges.push({ fromId: o.id, toId: tid, color: "#1e4d7a" }));
        });

        // Bridging (pathway ↔ pathway)
        BRIDGING.forEach(b => {
          mapEdges.push({ fromId: b.a, toId: b.b, color: "#d53f8c" });
        });

        // Org → SDOH
        ORGANIZATIONS.forEach(o => {
          o.sdoh.forEach(code => mapEdges.push({ fromId: o.id, toId: code, color: "#1b5e8a" }));
        });

        // Org → SDG
        ORGANIZATIONS.forEach(o => {
          o.sdgs.forEach(sdgId => mapEdges.push({ fromId: o.id, toId: sdgId, color: "#1e4d7a" }));
        });

        // Org → Life Situation
        ORGANIZATIONS.forEach(o => {
          o.situations.forEach(sit => mapEdges.push({ fromId: o.id, toId: sit, color: "#10b981" }));
        });

        // Pathway → SDG
        Object.entries(THEMES).forEach(([tid, theme]) => {
          theme.sdgs.forEach(sdgId => mapEdges.push({ fromId: tid, toId: sdgId, color: "#1e4d7a" }));
        });

        // Pathway → SDOH
        Object.entries(THEMES).forEach(([tid, theme]) => {
          theme.sdoh.forEach(code => mapEdges.push({ fromId: tid, toId: code, color: "#1b5e8a" }));
        });

        // Org → Geography (reverse: geo.orgs → org)
        GEOGRAPHY.forEach(geo => {
          geo.orgs.forEach(orgId => mapEdges.push({ fromId: orgId, toId: geo.id, color: "#4a2870" }));
        });

        // Geography → Pathway
        GEOGRAPHY.forEach(geo => {
          geo.pathways.forEach(tid => mapEdges.push({ fromId: geo.id, toId: tid, color: "#4a2870" }));
        });

        // Geography → SDG
        GEOGRAPHY.forEach(geo => {
          geo.sdgs.forEach(sdgId => mapEdges.push({ fromId: geo.id, toId: sdgId, color: "#1e4d7a" }));
        });

        // Geography → SDOH
        GEOGRAPHY.forEach(geo => {
          geo.sdoh.forEach(code => mapEdges.push({ fromId: geo.id, toId: code, color: "#1b5e8a" }));
        });

        // Ring → Org
        RINGS.forEach(ring => {
          ring.orgs.forEach(orgId => mapEdges.push({ fromId: ring.id, toId: orgId, color: "#10b981" }));
        });

        // Ring → Geography
        RINGS.forEach(ring => {
          ring.geos.forEach(geoId => mapEdges.push({ fromId: ring.id, toId: geoId, color: "#4a2870" }));
        });

        // Ring → SDG
        RINGS.forEach(ring => {
          ring.sdgs.forEach(sdgId => mapEdges.push({ fromId: ring.id, toId: sdgId, color: "#1e4d7a" }));
        });

        // Ring → SDOH
        RINGS.forEach(ring => {
          ring.sdoh.forEach(code => mapEdges.push({ fromId: ring.id, toId: code, color: "#1b5e8a" }));
        });

        // Ring → Life Situation
        RINGS.forEach(ring => {
          ring.situations.forEach(sit => mapEdges.push({ fromId: ring.id, toId: sit, color: "#10b981" }));
        });

        return (
          <div style={{ padding: "0 28px 28px" }}>
            <p style={{ fontSize: 12, color: "#8b8178", marginBottom: 12 }}>
              Hierarchical node map — every node type in its own column with mesh connections drawn between them. Hover nodes to highlight edges. Click any node to inspect.
            </p>
            <div ref={svgContainerRef} onWheel={onWheel} onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
              style={{ position: "relative", overflow: "hidden", borderRadius: 12, background: "radial-gradient(ellipse at 50% 50%, #f4f5f7 0%, #faf9f7 60%, #ffffff 100%)", cursor: isPanning ? "grabbing" : "grab", touchAction: "none" }}>
              <svg viewBox={`0 0 ${totalW} ${totalH}`} style={{ width: "100%", maxHeight: "75vh", transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "0 0", transition: isPanning ? "none" : "transform 0.1s ease-out" }}>
                <defs>
                  <radialGradient id="nmGlow"><stop offset="0%" stopColor="#C75B2A" stopOpacity={0.08} /><stop offset="100%" stopColor="#C75B2A" stopOpacity={0} /></radialGradient>
                  <filter id="nmEdgeGlow"><feGaussianBlur stdDeviation="2" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                </defs>

                {/* Column headers + vertical guides */}
                {columns.map((col, ci) => {
                  const colX = padX + ci * colWidth + colWidth / 2;
                  return (
                    <g key={`col-${ci}`}>
                      <line x1={colX} y1={padY + 28} x2={colX} y2={totalH - 20} stroke={col.color} strokeWidth={0.3} opacity={0.08} />
                      <text x={colX} y={padY + 14} fill={col.color} fontSize={9} textAnchor="middle" fontWeight={700} letterSpacing="0.04em">{col.label.toUpperCase()}</text>
                      <text x={colX} y={padY + 26} fill="#9a918a" fontSize={8} textAnchor="middle">{col.nodes.length}</text>
                    </g>
                  );
                })}

                {/* Edges */}
                {mapEdges.map((edge, i) => {
                  const from = mapPositions.get(edge.fromId);
                  const to = mapPositions.get(edge.toId);
                  if (!from || !to) return null;
                  const isHot = hovered?.id === edge.fromId || hovered?.id === edge.toId || selectedNode?.id === edge.fromId || selectedNode?.id === edge.toId;
                  // Curved edge
                  const midX = (from.x + to.x) / 2;
                  const midY = (from.y + to.y) / 2;
                  const dx = to.x - from.x;
                  const curveOffset = Math.abs(dx) < 20 ? 30 : 0; // Same-column links get a curve
                  const cpx = midX + curveOffset;
                  const cpy = midY - Math.abs(from.y - to.y) * 0.1;
                  return (
                    <path
                      key={`nmedge-${i}`}
                      d={`M ${from.x} ${from.y} Q ${cpx} ${cpy} ${to.x} ${to.y}`}
                      fill="none"
                      stroke={edge.color}
                      strokeWidth={isHot ? 1.5 : 0.3}
                      opacity={isHot ? 0.5 : 0.04}
                      strokeDasharray={isHot ? "none" : "3 6"}
                      filter={isHot ? "url(#nmEdgeGlow)" : undefined}
                    />
                  );
                })}

                {/* Nodes */}
                {columns.map((col, ci) =>
                  col.nodes.map((n, ni) => {
                    const pos = mapPositions.get(n.id);
                    if (!pos) return null;
                    const isH = hovered?.id === n.id;
                    const isSel = selectedNode?.id === n.id;
                    const dim = search && !matchesSearch(n);
                    const r = n.type === "pathway" ? 14 : n.type === "center" ? 13 : n.type === "org" ? 6 : n.type === "geography" ? 10 : n.type === "sdoh" ? 9 + (n.count || 0) / 12 : n.type === "sdg" ? 5 + Math.log2((n.count || 1) + 1) * 1.5 : 8;
                    const connCount = mapEdges.filter(e => e.fromId === n.id || e.toId === n.id).length;
                    return (
                      <g key={`nm-${ci}-${ni}`} data-node style={{ cursor: "pointer", opacity: dim ? 0.15 : 1 }}
                        onMouseEnter={() => setHovered(n)} onMouseLeave={() => setHovered(null)} onClick={() => selectNode(n)}>
                        {/* Glow ring */}
                        {(isH || isSel) && <circle cx={pos.x} cy={pos.y} r={r + 8} fill={n.color} opacity={0.1} />}
                        {/* Connection count ring */}
                        {connCount > 2 && <circle cx={pos.x} cy={pos.y} r={r + 3} fill="none" stroke={n.color} strokeWidth={0.4} opacity={isH || isSel ? 0.4 : 0.08} strokeDasharray={`${connCount * 2} ${Math.max(2, 20 - connCount * 2)}`} />}
                        {/* Node shape */}
                        {n.type === "org" ? (
                          <rect x={pos.x - r} y={pos.y - r} width={r * 2} height={r * 2} rx={3} fill={n.color} opacity={isH || isSel ? 0.7 : 0.25} stroke={isSel ? "#fff" : "none"} strokeWidth={1} />
                        ) : n.type === "geography" ? (
                          <polygon points={Array.from({ length: 6 }, (_, k) => { const angle = (k / 6) * Math.PI * 2 - Math.PI / 6; return `${pos.x + Math.cos(angle) * r},${pos.y + Math.sin(angle) * r}`; }).join(" ")} fill="#f8f6f3" stroke={n.color} strokeWidth={isSel ? 2.5 : isH ? 2 : 1} opacity={isH || isSel ? 1 : 0.4} />
                        ) : (
                          <circle cx={pos.x} cy={pos.y} r={r} fill={n.type === "crosswalk" ? n.color : "#f8f6f3"} stroke={n.color}
                            strokeWidth={isSel ? 2.5 : isH ? 2 : 1} opacity={isH || isSel ? 1 : 0.5} />
                        )}
                        {/* Initial/text inside */}
                        {(n.type === "pathway" || n.type === "center") && (
                          <text x={pos.x} y={pos.y + 3} fill={n.color} fontSize={9} textAnchor="middle" fontWeight={800}>{n.name?.charAt(0)}</text>
                        )}
                        {n.type === "ring" && (
                          <text x={pos.x} y={pos.y + 3} fill={n.color} fontSize={8} textAnchor="middle" fontWeight={800}>{n.count}</text>
                        )}
                        {n.type === "sdg" && (
                          <text x={pos.x} y={pos.y + 3} fill="#fff" fontSize={7} textAnchor="middle" fontWeight={600}>{n.id}</text>
                        )}
                        {n.type === "sdoh" && (
                          <text x={pos.x} y={pos.y + 3} fill="#fff" fontSize={7} textAnchor="middle" fontWeight={700}>{n.count}</text>
                        )}
                        {n.type === "crosswalk" && (
                          <text x={pos.x} y={pos.y + 3} fill="#fff" fontSize={6} textAnchor="middle" fontWeight={700}>{n.name?.slice(0, 4)}</text>
                        )}
                        {n.type === "geography" && (
                          <circle cx={pos.x} cy={pos.y} r={4} fill="#4a2870" opacity={0.5} />
                        )}
                        {n.type === "lifeSit" && (
                          <circle cx={pos.x} cy={pos.y} r={3} fill="#10b981" opacity={0.6} />
                        )}
                        {/* Label */}
                        <text x={pos.x + r + 6} y={pos.y + 1} fill={isH || isSel ? n.color : "#9a918a"} fontSize={8} fontWeight={isH || isSel ? 600 : 400} dominantBaseline="middle">
                          {n.name?.length > 14 ? n.name.slice(0, 13) + "..." : n.name}
                        </text>
                        {(isH || isSel) && n.count !== undefined && (
                          <text x={pos.x + r + 6} y={pos.y + 11} fill="#8b8178" fontSize={7} dominantBaseline="middle">{n.count} items · {connCount} edges</text>
                        )}
                      </g>
                    );
                  })
                )}
              </svg>

              {/* Zoom controls */}
              <div style={{ position: "absolute", bottom: 16, right: 16, display: "flex", flexDirection: "column", gap: 4 }}>
                <button onClick={() => setZoom(z => Math.min(z * 1.25, 5))} style={zoomBtnStyle}>+</button>
                <button onClick={resetView} style={{ ...zoomBtnStyle, fontSize: 10 }}>{Math.round(zoom * 100)}%</button>
                <button onClick={() => setZoom(z => Math.max(z / 1.25, 0.3))} style={zoomBtnStyle}>-</button>
              </div>

              {/* Legend */}
              <div style={{ position: "absolute", top: 12, left: 12, padding: "8px 12px", borderRadius: 8, background: "rgba(15,20,25,0.9)", border: "1px solid #e5e0d8", backdropFilter: "blur(8px)" }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#8b8178", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Edge Types</div>
                {[
                  { color: "#C75B2A", label: "Pathway → Center" },
                  { color: "#10b981", label: "Life Sit/Ring ↔ Org" },
                  { color: "#1b5e8a", label: "SDOH ↔ All types" },
                  { color: "#f59e0b", label: "SDG ↔ SDOH" },
                  { color: "#1e4d7a", label: "SDG ↔ All types" },
                  { color: "#d53f8c", label: "Bridge" },
                  { color: "#4a2870", label: "Geography ↔ All" },
                ].map(l => (
                  <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                    <div style={{ width: 12, height: 2, borderRadius: 1, background: l.color }} />
                    <span style={{ fontSize: 9, color: "#6b6157" }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Detail panel (reuse the same one as galaxy view) */}
            {selectedNode && (
              <div style={{ marginTop: 12, padding: 20, background: "#f8f6f3", borderRadius: 12, border: `1px solid ${selectedNode.color || "#e5e0d8"}30`, maxHeight: 400, overflowY: "auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <span style={{ padding: "2px 8px", borderRadius: 12, fontSize: 10, fontWeight: 600, background: selectedNode.color + "20", color: selectedNode.color, textTransform: "uppercase", letterSpacing: "0.05em" }}>{selectedNode.type}</span>
                    <h3 style={{ margin: "6px 0 0", fontSize: 18, color: selectedNode.color }}>{selectedNode.name}</h3>
                  </div>
                  <button onClick={() => setSelectedNode(null)} style={{ background: "#f4f5f7", border: "1px solid #e5e0d8", color: "#8b8178", cursor: "pointer", fontSize: 14, borderRadius: 8, padding: "4px 10px" }}>ESC</button>
                </div>
                {(() => {
                  const conns = getConnections(selectedNode);
                  if (!conns.length) return null;
                  return (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#8b8178", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Mesh Connections</div>
                      {conns.map((conn, i) => (
                        <div key={i} style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: conn.color, marginBottom: 3 }}>{conn.label.startsWith("Missing") ? "Warning " : ""}{conn.label}</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                            {conn.nodes.map((nn, j) => (
                              <span key={j} style={{ padding: "3px 8px", borderRadius: 6, fontSize: 11, background: conn.label.startsWith("Missing") ? "#ef444415" : conn.color + "12", border: `1px solid ${conn.label.startsWith("Missing") ? "#ef4444" : conn.color}25`, color: conn.label.startsWith("Missing") ? "#ef4444" : "#6b6157", lineHeight: 1.4 }}>{nn}</span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        );
      })()}

      {/* ═══════════════════ MESH VIEW ═══════════════════ */}
      {view === "mesh" && (
        <div style={{ padding: "0 28px 28px" }}>
          <p style={{ fontSize: 12, color: "#8b8178", marginBottom: 16 }}>Every dimension group and how they interconnect. Click any cell to see the mesh path between two systems.</p>
          <div style={{ display: "grid", gap: 16 }}>
            {DIMENSION_GROUPS.map(g => (
              <div key={g.group} style={{ padding: 16, background: "#f4f5f7", borderRadius: 12, borderLeft: `4px solid ${g.color}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <h3 style={{ margin: 0, fontSize: 14, color: g.color }}>{g.group}</h3>
                  <span style={{ fontSize: 20, fontWeight: 800, color: g.color }}>{g.dims.length}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(g.dims.length, 7)}, 1fr)`, gap: 6 }}>
                  {g.dims.map(d => (
                    <div key={d.name} style={{ padding: "8px 6px", background: "#ffffff", borderRadius: 6, textAlign: "center" }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: g.color }}>{d.edges}</div>
                      <div style={{ fontSize: 9, color: "#8b8178", marginTop: 2 }}>{d.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, padding: 14, background: "rgba(199,91,42,0.1)", borderRadius: 12, textAlign: "center" }}>
            <span style={{ fontSize: 15, color: "#C75B2A", fontWeight: 700 }}>
              {TOTAL_DIMS} dimensions × 195 content nodes = {TOTAL_EDGES.toLocaleString()}+ mesh edges + 1,560 Rosetta crosswalks
            </span>
          </div>

          {/* Org Pipeline */}
          <div style={{ marginTop: 16, padding: 16, background: "#f4f5f7", borderRadius: 12, borderLeft: "4px solid #1e4d7a" }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 14, color: "#1e4d7a" }}>Organization Pipeline</h3>
            <p style={{ fontSize: 11, color: "#8b8178", margin: "0 0 10px" }}>
              When content mentions an organization, Claude extracts it. If it doesn&apos;t exist, a new record is created and classified across all ~{TOTAL_DIMS} dimensions.
            </p>
            <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
              {["Detect in content", "Extract name+URL", "Lookup org_domains", "Create if new (ORG_CL_*)", `Classify ~${TOTAL_DIMS}D`, "Link to content"].map((step, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ padding: "4px 8px", borderRadius: 6, fontSize: 10, fontWeight: 600, background: "#1e4d7a15", color: "#1e4d7a", border: "1px solid #1e4d7a30" }}>{step}</span>
                  {i < 5 && <span style={{ color: "#e5e0d8" }}>→</span>}
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6 }}>
              {ORGANIZATIONS.map(org => (
                <div key={org.id} style={{ padding: "8px 10px", background: "#ffffff", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: org.color }}>{org.name}</div>
                    <div style={{ fontSize: 10, color: "#8b8178" }}>{org.domain} · {org.themes.length} pw · {org.sdoh.length} sdoh · {org.situations.length} sits</div>
                  </div>
                  <span style={{ padding: "2px 6px", borderRadius: 4, fontSize: 9, fontWeight: 700, background: org.pipeline === "verified" ? "#7a201820" : "#6a4e1020", color: org.pipeline === "verified" ? "#7a2018" : "#6a4e10" }}>{org.pipeline}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════ STATS VIEW ═══════════════════ */}
      {view === "stats" && (
        <div style={{ padding: "0 28px 28px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
            {[
              { label: "Dimensions/Node", value: `~${TOTAL_DIMS}`, color: "#C75B2A", sub: "Full mesh depth" },
              { label: "Mesh Edges", value: STATS.totalEdges.toLocaleString(), color: "#6366f1", sub: "Cross-dimension connections" },
              { label: "Content Nodes", value: STATS.content, color: "#C75B2A", sub: "Classified & published" },
              { label: "Focus Areas", value: STATS.focusAreas, color: "#1a5030", sub: "Rosetta Stone key" },
              { label: "Organizations", value: STATS.orgs, color: "#1e4d7a", sub: "Auto-created via pipeline" },
              { label: "Audiences", value: STATS.audienceSegments, color: "#d53f8c", sub: "Persona segments" },
              { label: "Translations", value: STATS.translations, color: "#f59e0b", sub: "Spanish + Vietnamese" },
              { label: "Services", value: STATS.services, color: "#1a6b56", sub: "211 directory entries" },
              { label: "Officials", value: STATS.officials, color: "#6a4e10", sub: "Federal → City" },
              { label: "ZIP Codes", value: STATS.zipCodes, color: "#1b5e8a", sub: "Houston metro" },
              { label: "Resources", value: STATS.resources, color: "#1a5030", sub: "Guides & tools" },
              { label: "Content Rings", value: 5, color: "#6366f1", sub: "Wayfinder layers" },
            ].map(s => (
              <div key={s.label} style={{ padding: 14, background: "#f4f5f7", borderRadius: 10, borderTop: `3px solid ${s.color}` }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{typeof s.value === "number" ? s.value.toLocaleString() : s.value}</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{s.label}</div>
                <div style={{ fontSize: 11, color: "#8b8178", marginTop: 2 }}>{s.sub}</div>
              </div>
            ))}
          </div>

          <div style={{ padding: 18, background: "rgba(49,151,149,0.06)", borderRadius: 12, border: "1px solid rgba(49,151,149,0.15)" }}>
            <h3 style={{ margin: "0 0 10px", fontSize: 15, color: "#1a5030" }}>Rosetta Stone</h3>
            <div style={{ fontSize: 13, color: "#6b6157", lineHeight: 1.6, marginBottom: 12 }}>
              164 focus areas × 5 systems = <strong style={{ color: "#1a5030" }}>820 crosswalks</strong>. Every focus area inherits SDG, SDOH, NTEE, and AIRS codes — making it the universal key that connects all classification systems.
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {CROSSWALKS.map(cw => (
                <div key={cw.name} style={{ padding: "6px 12px", background: cw.color + "12", border: `1px solid ${cw.color}25`, borderRadius: 8, textAlign: "center" }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: cw.color }}>{cw.count}</div>
                  <div style={{ fontSize: 10, color: "#6b6157" }}>{cw.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════ GAPS VIEW ═══════════════════ */}
      {view === "gaps" && (() => {
        const orgsNoGeo = ORGANIZATIONS.filter(o => !GEOGRAPHY.some(g => g.orgs.includes(o.id)));
        const orgsNoSituations = ORGANIZATIONS.filter(o => o.situations.length === 0);
        const ringsNoOrg = RINGS.filter(r => r.orgs.length === 0);
        const lowServiceGeos = GEOGRAPHY.filter(g => g.situations.length <= 2);
        const orgsNoSdoh = ORGANIZATIONS.filter(o => o.sdoh.length === 0);
        const lifeSitsNoOrg = LIFE_SITUATIONS.filter(ls => ls.orgs.length === 0);
        const crossEntityGapCount = orgsNoGeo.length + orgsNoSituations.length + ringsNoOrg.length + lowServiceGeos.length + orgsNoSdoh.length + lifeSitsNoOrg.length;
        return (
        <div style={{ padding: "0 28px 28px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
            <div style={{ padding: 16, background: "#f4f5f7", borderRadius: 12, borderTop: "3px solid #ef4444" }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: "#ef4444" }}>{MISSING_BRIDGES.length}</div>
              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>Missing Bridges</div>
              <div style={{ fontSize: 11, color: "#8b8178", marginTop: 2 }}>Pathway pairs with no content overlap</div>
            </div>
            <div style={{ padding: 16, background: "#f4f5f7", borderRadius: 12, borderTop: "3px solid #f59e0b" }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: "#f59e0b" }}>{MISSING_CENTER_EDGES.length}</div>
              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>Missing Centers</div>
              <div style={{ fontSize: 11, color: "#8b8178", marginTop: 2 }}>Pathways missing center connections</div>
            </div>
            <div style={{ padding: 16, background: "#f4f5f7", borderRadius: 12, borderTop: "3px solid #6a4e10" }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: "#6a4e10" }}>{SDG_SDOH_LINKS.length}</div>
              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>SDG-SDOH Links</div>
              <div style={{ fontSize: 11, color: "#8b8178", marginTop: 2 }}>Cross-system connections to formalize</div>
            </div>
            <div style={{ padding: 16, background: "#f4f5f7", borderRadius: 12, borderTop: "3px solid #4a2870" }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: "#4a2870" }}>{crossEntityGapCount}</div>
              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>Cross-Entity Gaps</div>
              <div style={{ fontSize: 11, color: "#8b8178", marginTop: 2 }}>Org, service, geography disconnects</div>
            </div>
          </div>

          <div style={{ padding: 18, background: "#f4f5f7", borderRadius: 12, border: "1px solid #ef444430", marginBottom: 16 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 15, color: "#ef4444" }}>Missing Bridges Between Pathways</h3>
            <div style={{ display: "grid", gap: 8 }}>
              {MISSING_BRIDGES.map((b, i) => (
                <div key={i} style={{ padding: "12px 14px", background: "#ffffff", borderRadius: 8, border: "1px solid #ef444420" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 700, background: THEMES[b.a].color + "20", color: THEMES[b.a].color }}>{THEMES[b.a].name}</span>
                    <span style={{ color: "#ef4444", fontSize: 14 }}>⟷</span>
                    <span style={{ padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 700, background: THEMES[b.b].color + "20", color: THEMES[b.b].color }}>{THEMES[b.b].name}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#6b6157" }}>{b.reason}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: 18, background: "#f4f5f7", borderRadius: 12, border: "1px solid #f59e0b30", marginBottom: 16 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 15, color: "#f59e0b" }}>Missing Center Connections</h3>
            {MISSING_CENTER_EDGES.map((e, i) => (
              <div key={i} style={{ padding: "12px 14px", background: "#ffffff", borderRadius: 8, border: "1px solid #f59e0b20", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 700, background: THEMES[e.pw].color + "20", color: THEMES[e.pw].color }}>{THEMES[e.pw].name}</span>
                  <span style={{ color: "#f59e0b" }}>→</span>
                  <span style={{ padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 700, background: CENTERS[e.c].color + "20", color: CENTERS[e.c].color }}>{e.c}</span>
                  <span style={{ padding: "2px 6px", borderRadius: 6, fontSize: 9, fontWeight: 700, background: "#ef444420", color: "#ef4444" }}>0 items</span>
                </div>
                <div style={{ fontSize: 12, color: "#6b6157" }}>{e.reason}</div>
              </div>
            ))}
          </div>

          <div style={{ padding: 18, background: "#f4f5f7", borderRadius: 12, border: "1px solid #6a4e1030", marginBottom: 16 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 15, color: "#6a4e10" }}>SDG ↔ SDOH Cross-links to Formalize</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
              {SDG_SDOH_LINKS.map((link, i) => (
                <div key={i} style={{ padding: "10px 12px", background: "#ffffff", borderRadius: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#6b6157", marginBottom: 4 }}>{link.label}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ flex: 1, height: 3, borderRadius: 2, background: "#f4f5f7" }}>
                      <div style={{ width: `${link.strength * 10}%`, height: "100%", borderRadius: 2, background: "#6a4e10" }} />
                    </div>
                    <span style={{ fontSize: 9, color: "#6a4e10", fontWeight: 700 }}>{link.strength}/10</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cross-Entity Gap Analysis */}
          {orgsNoGeo.length > 0 && (
          <div style={{ padding: 18, background: "#f4f5f7", borderRadius: 12, border: "1px solid #4a287030", marginBottom: 16 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 15, color: "#4a2870" }}>Org → Geography Gaps</h3>
            <p style={{ fontSize: 12, color: "#8b8178", margin: "0 0 10px" }}>Organizations with no neighborhood assignment — cannot trace service coverage geographically.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
              {orgsNoGeo.map((org, i) => (
                <div key={i} style={{ padding: "10px 12px", background: "#ffffff", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: org.color }}>{org.name}</div>
                    <div style={{ fontSize: 10, color: "#8b8178" }}>{org.domain} · {org.themes.length} pathways</div>
                  </div>
                  <span style={{ padding: "2px 6px", borderRadius: 4, fontSize: 9, fontWeight: 700, background: "#4a287020", color: "#4a2870" }}>no geo</span>
                </div>
              ))}
            </div>
          </div>
          )}

          {ringsNoOrg.length > 0 && (
          <div style={{ padding: 18, background: "#f4f5f7", borderRadius: 12, border: "1px solid #10b98130", marginBottom: 16 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 15, color: "#10b981" }}>Ring → Org Gaps</h3>
            <p style={{ fontSize: 12, color: "#8b8178", margin: "0 0 10px" }}>Content rings with no organization connections.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
              {ringsNoOrg.map((ring, i) => (
                <div key={i} style={{ padding: "10px 12px", background: "#ffffff", borderRadius: 8, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 700, background: ring.color + "20", color: ring.color }}>{ring.name} ({ring.count})</span>
                  <span style={{ padding: "2px 6px", borderRadius: 4, fontSize: 9, fontWeight: 700, background: "#ef444420", color: "#ef4444" }}>no orgs</span>
                </div>
              ))}
            </div>
          </div>
          )}

          {lifeSitsNoOrg.length > 0 && (
          <div style={{ padding: 18, background: "#f4f5f7", borderRadius: 12, border: "1px solid #10b98130", marginBottom: 16 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 15, color: "#10b981" }}>Life Situation → Org Gaps</h3>
            <p style={{ fontSize: 12, color: "#8b8178", margin: "0 0 10px" }}>Life situations with no serving organization.</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {lifeSitsNoOrg.map((sit, i) => (
                <div key={i} style={{ padding: "6px 10px", background: "#ffffff", borderRadius: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
                  <span style={{ fontSize: 11, color: "#6b6157" }}>{sit.name}</span>
                  <span style={{ padding: "2px 6px", borderRadius: 4, fontSize: 9, fontWeight: 700, background: "#ef444420", color: "#ef4444" }}>no orgs</span>
                </div>
              ))}
            </div>
          </div>
          )}

          {orgsNoSituations.length > 0 && (
          <div style={{ padding: 18, background: "#f4f5f7", borderRadius: 12, border: "1px solid #1e4d7a30", marginBottom: 16 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 15, color: "#1e4d7a" }}>Org → Life Situation Gaps</h3>
            <p style={{ fontSize: 12, color: "#8b8178", margin: "0 0 10px" }}>Organizations with no life situation connections — cannot trace who they serve.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
              {orgsNoSituations.map((org, i) => (
                <div key={i} style={{ padding: "10px 12px", background: "#ffffff", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: org.color }}>{org.name}</div>
                    <div style={{ fontSize: 10, color: "#8b8178" }}>{org.domain}</div>
                  </div>
                  <span style={{ padding: "2px 6px", borderRadius: 4, fontSize: 9, fontWeight: 700, background: "#1e4d7a20", color: "#1e4d7a" }}>no sits</span>
                </div>
              ))}
            </div>
          </div>
          )}

          {lowServiceGeos.length > 0 && (
          <div style={{ padding: 18, background: "#f4f5f7", borderRadius: 12, border: "1px solid #4a287030", marginBottom: 16 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 15, color: "#4a2870" }}>Geography → Service Coverage Gaps</h3>
            <p style={{ fontSize: 12, color: "#8b8178", margin: "0 0 10px" }}>Neighborhoods with low service density — 2 or fewer life situations connected.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
              {lowServiceGeos.map((geo, i) => (
                <div key={i} style={{ padding: "10px 12px", background: "#ffffff", borderRadius: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#4a2870" }}>{geo.name}</span>
                    <span style={{ padding: "2px 6px", borderRadius: 4, fontSize: 9, fontWeight: 700, background: "#ef444420", color: "#ef4444" }}>{geo.situations.length} sits</span>
                  </div>
                  <div style={{ fontSize: 10, color: "#8b8178" }}>ZIPs: {geo.zips.join(", ")} · pop. {geo.population.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
          )}

          {orgsNoSdoh.length > 0 && (
          <div style={{ padding: 18, background: "#f4f5f7", borderRadius: 12, border: "1px solid #1b5e8a30", marginBottom: 16 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 15, color: "#1b5e8a" }}>Org → SDOH Gaps</h3>
            <p style={{ fontSize: 12, color: "#8b8178", margin: "0 0 10px" }}>Organizations missing health domain linkage — cannot assess health impact.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
              {orgsNoSdoh.map((org, i) => (
                <div key={i} style={{ padding: "10px 12px", background: "#ffffff", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: org.color }}>{org.name}</div>
                    <div style={{ fontSize: 10, color: "#8b8178" }}>{org.domain}</div>
                  </div>
                  <span style={{ padding: "2px 6px", borderRadius: 4, fontSize: 9, fontWeight: 700, background: "#1b5e8a20", color: "#1b5e8a" }}>no SDOH</span>
                </div>
              ))}
            </div>
          </div>
          )}
        </div>
        );
      })()}

      <div style={{ padding: "14px 28px", borderTop: "1px solid #f4f5f7", display: "flex", justifyContent: "space-between", color: "#9a918a", fontSize: 11 }}>
        <span>Change Engine — A project of The Change Lab</span>
        <span>Houston, TX · ~{TOTAL_DIMS}D mesh · v5</span>
      </div>
    </div>
  );
}

const zoomBtnStyle: React.CSSProperties = {
  width: 36, height: 36, borderRadius: 8,
  background: "rgba(255, 255, 255, 0.9)", border: "1px solid #e5e0d8",
  color: "#6b6157", cursor: "pointer", fontSize: 18,
  display: "flex", alignItems: "center", justifyContent: "center",
  backdropFilter: "blur(8px)",
};
