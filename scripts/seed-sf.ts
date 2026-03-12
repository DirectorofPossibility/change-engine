#!/usr/bin/env npx tsx
/**
 * seed-sf.ts — Populate San Francisco organizations, services, foundations,
 * government agencies, and elected officials via the intake API.
 *
 * Usage:
 *   npx tsx scripts/seed-sf.ts
 *
 * Requires:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY) in .env.local
 *   OR pass API_BASE and API_KEY environment variables
 *
 * This script is idempotent — uses deterministic IDs so re-running upserts.
 */

// Load .env.local manually (no dotenv dependency needed)
import { readFileSync } from 'fs'
try {
  const envFile = readFileSync('.env.local', 'utf-8')
  for (const line of envFile.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.substring(0, eq)
    const val = trimmed.substring(eq + 1).replace(/^["']|["']$/g, '')
    if (!process.env[key]) process.env[key] = val
  }
} catch { /* .env.local may not exist if vars set in environment */ }

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY!

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

// ── Supabase REST helper ─────────────────────────────────────────────

async function supaRest(method: string, path: string, body?: unknown) {
  const headers: Record<string, string> = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
  }
  if (method === 'POST') headers['Prefer'] = 'return=representation,resolution=merge-duplicates'
  if (method === 'PATCH') headers['Prefer'] = 'return=representation'

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text()
    console.error(`  ✗ ${method} ${path}: ${res.status} ${text.substring(0, 200)}`)
    return null
  }
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

async function upsertBatch(table: string, idCol: string, items: any[]) {
  let success = 0
  // Batch in groups of 50
  for (let i = 0; i < items.length; i += 50) {
    const batch = items.slice(i, i + 50)
    const res = await supaRest('POST', `${table}?on_conflict=${idCol}`, batch)
    if (res) success += batch.length
    await new Promise(r => setTimeout(r, 300))
  }
  return success
}

// ═══════════════════════════════════════════════════════════════════════
// DATA: 150+ San Francisco Organizations
// ═══════════════════════════════════════════════════════════════════════

interface OrgRecord {
  org_id: string
  org_name: string
  website: string
  city: string
  state: string
  county_id: string
  zip_code: string
  description_5th_grade: string
  data_source: string
  last_updated: string
}

const NOW = new Date().toISOString()
const DS = 'seed_sf'

function orgId(slug: string): string {
  return `ORG_SF_${slug.toUpperCase().replace(/[^A-Z0-9]/g, '_').substring(0, 30)}`
}
function svcId(slug: string): string {
  return `SVC_SF_${slug.toUpperCase().replace(/[^A-Z0-9]/g, '_').substring(0, 30)}`
}

// ── Social Services & 211 ────────────────────────────────────────────

const SOCIAL_SERVICES_ORGS: OrgRecord[] = [
  { org_id: orgId('sf-hsa'), org_name: 'SF Human Services Agency', website: 'https://www.sfhsa.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94103', description_5th_grade: 'Helps people in San Francisco get food, housing, money, and other support when they need it. They run programs like CalFresh (food stamps) and Medi-Cal.', data_source: DS, last_updated: NOW },
  { org_id: orgId('sf-211'), org_name: '211 Bay Area', website: 'https://www.211bayarea.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94104', description_5th_grade: 'Call 2-1-1 any time to find help in the Bay Area. They connect you to food, housing, health care, and other services in your neighborhood.', data_source: DS, last_updated: NOW },
  { org_id: orgId('glide'), org_name: 'GLIDE Foundation', website: 'https://www.glide.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94102', description_5th_grade: 'Serves free meals every day in the Tenderloin. Also helps with housing, health care, job training, and recovery programs. Everyone is welcome.', data_source: DS, last_updated: NOW },
  { org_id: orgId('st-anthonys'), org_name: "St. Anthony Foundation", website: 'https://www.stanthonysf.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94102', description_5th_grade: "Serves free hot meals, provides clothing, medical care, and tech training in the Tenderloin. Helps people get back on their feet with dignity.", data_source: DS, last_updated: NOW },
  { org_id: orgId('sf-marin-food-bank'), org_name: 'SF-Marin Food Bank', website: 'https://www.sfmfoodbank.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94124', description_5th_grade: 'Gives free groceries to families and individuals across San Francisco and Marin County. Runs pop-up pantries in neighborhoods that need them most.', data_source: DS, last_updated: NOW },
  { org_id: orgId('project-open-hand'), org_name: 'Project Open Hand', website: 'https://www.openhand.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94103', description_5th_grade: 'Delivers free, healthy meals to people who are sick or elderly. Also provides groceries and nutrition counseling to help people eat well.', data_source: DS, last_updated: NOW },
  { org_id: orgId('hamilton-families'), org_name: 'Hamilton Families', website: 'https://www.hamiltonfamilies.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94103', description_5th_grade: 'Helps families with children find and keep housing in San Francisco. Provides shelters, rental help, and support to prevent homelessness.', data_source: DS, last_updated: NOW },
  { org_id: orgId('larkin-street'), org_name: 'Larkin Street Youth Services', website: 'https://www.larkinstreetyouth.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94109', description_5th_grade: 'Helps young people ages 12-24 who are homeless or at risk. Provides shelter, education, job training, and mental health support.', data_source: DS, last_updated: NOW },
  { org_id: orgId('sf-aids-foundation'), org_name: 'San Francisco AIDS Foundation', website: 'https://www.sfaf.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94103', description_5th_grade: 'Helps people prevent and live with HIV/AIDS. Offers testing, medical care, housing help, and support groups for everyone in the community.', data_source: DS, last_updated: NOW },
  { org_id: orgId('compass-family-services'), org_name: 'Compass Family Services', website: 'https://www.compass-sf.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94115', description_5th_grade: 'Helps families facing homelessness find stable housing and build better lives. Provides shelter, childcare, job help, and family support.', data_source: DS, last_updated: NOW },
]

// ── Healthcare ───────────────────────────────────────────────────────

const HEALTHCARE_ORGS: OrgRecord[] = [
  { org_id: orgId('sf-dph'), org_name: 'SF Department of Public Health', website: 'https://www.sfdph.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94102', description_5th_grade: 'Runs health clinics, Zuckerberg SF General Hospital, and disease prevention programs for all San Franciscans. Protects community health.', data_source: DS, last_updated: NOW },
  { org_id: orgId('sf-general'), org_name: 'Zuckerberg SF General Hospital', website: 'https://zuckerbergsanfranciscogeneral.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94110', description_5th_grade: "San Francisco's main public hospital and trauma center. Provides emergency care, surgery, and medical services regardless of ability to pay.", data_source: DS, last_updated: NOW },
  { org_id: orgId('ucsf-health'), org_name: 'UCSF Health', website: 'https://www.ucsfhealth.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94143', description_5th_grade: 'A top-ranked university hospital system. Provides advanced medical care, research, and specialty treatments at multiple locations in San Francisco.', data_source: DS, last_updated: NOW },
  { org_id: orgId('healthright-360'), org_name: 'HealthRIGHT 360', website: 'https://www.healthright360.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94103', description_5th_grade: 'Provides health care, addiction treatment, and mental health services to people who might not otherwise get help. Serves over 35,000 people a year.', data_source: DS, last_updated: NOW },
  { org_id: orgId('sf-community-health'), org_name: 'SF Community Health Center', website: 'https://www.sfcommunityhealth.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94103', description_5th_grade: 'Community clinic serving low-income and uninsured patients. Offers medical, dental, and behavioral health care with a focus on LGBTQ+ communities.', data_source: DS, last_updated: NOW },
  { org_id: orgId('nems'), org_name: 'North East Medical Services (NEMS)', website: 'https://www.nems.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94108', description_5th_grade: 'Health clinic serving the Chinese and Asian communities. Doctors speak Cantonese, Mandarin, Vietnamese, and other Asian languages.', data_source: DS, last_updated: NOW },
  { org_id: orgId('instituto-familiar'), org_name: 'Instituto Familiar de la Raza', website: 'https://www.ifrsf.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94110', description_5th_grade: 'Provides mental health, family support, and cultural programs for Latino families in the Mission District. Bilingual services in Spanish and English.', data_source: DS, last_updated: NOW },
  { org_id: orgId('bay-area-community-health'), org_name: 'Bay Area Community Health', website: 'https://www.bach.care', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94112', description_5th_grade: 'Community health centers providing medical, dental, and mental health care on a sliding scale. Multiple locations across the Bay Area.', data_source: DS, last_updated: NOW },
  { org_id: orgId('planned-parenthood-sf'), org_name: 'Planned Parenthood Northern California', website: 'https://www.plannedparenthood.org/planned-parenthood-northern-california', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94110', description_5th_grade: 'Provides reproductive health care including birth control, STI testing, cancer screenings, and education. Services available on a sliding fee scale.', data_source: DS, last_updated: NOW },
  { org_id: orgId('curry-senior-center'), org_name: 'Curry Senior Center', website: 'https://www.curryseniorcenter.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94102', description_5th_grade: 'Helps seniors in the Tenderloin with meals, housing, health care, and social activities. A safe place for older adults who need support.', data_source: DS, last_updated: NOW },
]

// ── Housing ──────────────────────────────────────────────────────────

const HOUSING_ORGS: OrgRecord[] = [
  { org_id: orgId('sf-mohcd'), org_name: "SF Mayor's Office of Housing", website: 'https://sfmohcd.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94102', description_5th_grade: "Helps San Franciscans find affordable housing. Manages the city's affordable housing lottery, down payment assistance, and tenant protections.", data_source: DS, last_updated: NOW },
  { org_id: orgId('sf-housing-authority'), org_name: 'SF Housing Authority', website: 'https://www.sfha.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94102', description_5th_grade: 'Manages public housing and Section 8 vouchers in San Francisco. Helps low-income families, seniors, and people with disabilities find affordable homes.', data_source: DS, last_updated: NOW },
  { org_id: orgId('tenderloin-housing'), org_name: 'Tenderloin Housing Clinic', website: 'https://www.thclinic.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94102', description_5th_grade: 'Provides free legal help to tenants facing eviction. Also runs supportive housing for people who were previously homeless.', data_source: DS, last_updated: NOW },
  { org_id: orgId('todco'), org_name: 'TODCO', website: 'https://www.todco.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94103', description_5th_grade: 'Builds and manages affordable housing in SoMa for seniors and low-income residents. Advocates for tenant rights and neighborhood preservation.', data_source: DS, last_updated: NOW },
  { org_id: orgId('habitat-sf'), org_name: 'Habitat for Humanity Greater SF', website: 'https://www.habitatgsf.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94107', description_5th_grade: 'Builds affordable homes for working families. Volunteers help construct houses, and families buy them with affordable mortgages.', data_source: DS, last_updated: NOW },
  { org_id: orgId('sf-hsh'), org_name: 'SF Dept of Homelessness & Supportive Housing', website: 'https://hsh.sfgov.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94102', description_5th_grade: 'Coordinates homeless services across San Francisco. Runs shelters, navigation centers, and permanent supportive housing programs.', data_source: DS, last_updated: NOW },
  { org_id: orgId('chinatown-cdc'), org_name: 'Chinatown Community Development Center', website: 'https://www.chinatowncdc.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94108', description_5th_grade: 'Builds and manages affordable housing in Chinatown and other neighborhoods. Also runs community programs and fights for tenant rights.', data_source: DS, last_updated: NOW },
  { org_id: orgId('homebridge'), org_name: 'Homebridge', website: 'https://www.homebridgeca.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94103', description_5th_grade: 'Provides in-home care for seniors and adults with disabilities so they can live safely at home instead of moving to a facility.', data_source: DS, last_updated: NOW },
  { org_id: orgId('mercy-housing'), org_name: 'Mercy Housing California', website: 'https://www.mercyhousing.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94104', description_5th_grade: 'Builds and manages affordable apartments for families, seniors, and people with special needs. Provides support services in their communities.', data_source: DS, last_updated: NOW },
  { org_id: orgId('bridge-housing'), org_name: 'BRIDGE Housing', website: 'https://bridgehousing.com', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94104', description_5th_grade: 'One of the largest affordable housing developers in California. Creates mixed-income communities that are safe and well-maintained.', data_source: DS, last_updated: NOW },
]

// ── Education & Youth ────────────────────────────────────────────────

const EDUCATION_ORGS: OrgRecord[] = [
  { org_id: orgId('sfusd'), org_name: 'San Francisco Unified School District', website: 'https://www.sfusd.edu', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94102', description_5th_grade: 'Runs all public schools in San Francisco — over 100 schools serving about 50,000 students from pre-K through 12th grade.', data_source: DS, last_updated: NOW },
  { org_id: orgId('sfpl'), org_name: 'San Francisco Public Library', website: 'https://sfpl.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94102', description_5th_grade: 'Free library system with 28 branches across the city. Offers books, computers, classes, homework help, and community events for all ages.', data_source: DS, last_updated: NOW },
  { org_id: orgId('ccsf'), org_name: 'City College of San Francisco', website: 'https://www.ccsf.edu', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94112', description_5th_grade: 'Free community college for San Francisco residents. Offers degree programs, job training, ESL classes, and courses for career advancement.', data_source: DS, last_updated: NOW },
  { org_id: orgId('dcyf'), org_name: 'SF Dept of Children, Youth & Families', website: 'https://www.dcyf.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94102', description_5th_grade: 'Funds after-school programs, summer camps, mental health services, and family support across San Francisco. Serves kids from birth to age 24.', data_source: DS, last_updated: NOW },
  { org_id: orgId('boys-girls-club-sf'), org_name: 'Boys & Girls Clubs of SF', website: 'https://www.kidsclub.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94102', description_5th_grade: 'After-school and summer programs for kids and teens at multiple locations. Offers homework help, sports, arts, and leadership programs.', data_source: DS, last_updated: NOW },
  { org_id: orgId('mission-graduates'), org_name: 'Mission Graduates', website: 'https://www.missiongraduates.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94110', description_5th_grade: 'Helps kids in the Mission District go to college. Provides tutoring, mentoring, and family support from elementary school through college graduation.', data_source: DS, last_updated: NOW },
  { org_id: orgId('sf-beacon-initiative'), org_name: 'SF Beacon Initiative', website: 'https://www.sfbeacon.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94102', description_5th_grade: 'Network of community centers in SF schools. Keeps schools open after hours for tutoring, arts, sports, and family programs.', data_source: DS, last_updated: NOW },
  { org_id: orgId('ycd'), org_name: 'Youth Community Developers', website: 'https://www.ycdsf.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94124', description_5th_grade: 'Trains young people in Bayview-Hunters Point for jobs and leadership. Runs construction training, job placement, and youth programs.', data_source: DS, last_updated: NOW },
  { org_id: orgId('first-5-sf'), org_name: 'First 5 San Francisco', website: 'https://www.first5sf.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94102', description_5th_grade: 'Supports children from birth to age 5 and their families. Funds preschool, health screenings, parenting classes, and family resource centers.', data_source: DS, last_updated: NOW },
  { org_id: orgId('juma-ventures'), org_name: 'Juma Ventures', website: 'https://www.juma.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94107', description_5th_grade: 'Helps low-income youth get jobs and save for college. Young people work at sports venues while getting financial coaching and college support.', data_source: DS, last_updated: NOW },
]

// ── Legal Aid & Immigrant Services ───────────────────────────────────

const LEGAL_ORGS: OrgRecord[] = [
  { org_id: orgId('sf-public-defender'), org_name: 'SF Public Defender', website: 'https://sfpublicdefender.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94102', description_5th_grade: 'Provides free lawyers to people who cannot afford one in criminal cases. Defends the rights of San Franciscans in court.', data_source: DS, last_updated: NOW },
  { org_id: orgId('legal-aid-sf'), org_name: 'Legal Aid at Work', website: 'https://www.legalaidatwork.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94104', description_5th_grade: 'Free legal help for workers dealing with discrimination, wage theft, or unfair treatment at work. Fights for worker rights in California.', data_source: DS, last_updated: NOW },
  { org_id: orgId('bay-area-legal-aid'), org_name: 'Bay Area Legal Aid', website: 'https://www.baylegal.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94104', description_5th_grade: 'Free legal services for low-income people in the Bay Area. Helps with housing, benefits, domestic violence, and consumer protection.', data_source: DS, last_updated: NOW },
  { org_id: orgId('irc-sf'), org_name: 'International Rescue Committee SF', website: 'https://www.rescue.org/united-states/san-francisco-ca', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94102', description_5th_grade: 'Helps refugees and immigrants settle in San Francisco. Provides job training, English classes, legal help, and cultural orientation.', data_source: DS, last_updated: NOW },
  { org_id: orgId('pangea-legal'), org_name: 'Pangea Legal Services', website: 'https://www.pangealegal.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94110', description_5th_grade: 'Free immigration legal services for people facing deportation. Helps with asylum cases, green cards, and citizenship applications.', data_source: DS, last_updated: NOW },
  { org_id: orgId('carecen-sf'), org_name: 'CARECEN SF', website: 'https://www.carecensf.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94110', description_5th_grade: 'Helps Central American and Latino immigrants with legal services, English classes, and community organizing in the Mission District.', data_source: DS, last_updated: NOW },
  { org_id: orgId('api-legal-outreach'), org_name: 'API Legal Outreach', website: 'https://www.apilegaloutreach.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94108', description_5th_grade: 'Free legal help for Asian and Pacific Islander communities. Helps with immigration, domestic violence, elder abuse, and tenant rights.', data_source: DS, last_updated: NOW },
  { org_id: orgId('la-raza-centro-legal'), org_name: 'La Raza Centro Legal', website: 'https://www.lrcl.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94110', description_5th_grade: 'Free legal services for Latino and immigrant communities in the Mission. Helps with immigration, housing, workers rights, and community issues.', data_source: DS, last_updated: NOW },
]

// ── Environment & Sustainability ─────────────────────────────────────

const ENVIRONMENT_ORGS: OrgRecord[] = [
  { org_id: orgId('sf-environment'), org_name: 'SF Department of the Environment', website: 'https://sfenvironment.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94102', description_5th_grade: 'Leads the city on climate action, zero waste, clean energy, and environmental justice. Runs programs for composting, solar, and green buildings.', data_source: DS, last_updated: NOW },
  { org_id: orgId('baykeeper'), org_name: 'San Francisco Baykeeper', website: 'https://baykeeper.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94104', description_5th_grade: 'Protects San Francisco Bay from pollution. Uses science, law, and community action to keep the bay clean and healthy for everyone.', data_source: DS, last_updated: NOW },
  { org_id: orgId('sf-parks-alliance'), org_name: 'SF Parks Alliance', website: 'https://www.sfparksalliance.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94102', description_5th_grade: 'Works to make San Francisco parks beautiful, safe, and welcoming. Organizes volunteer clean-ups and raises money for park improvements.', data_source: DS, last_updated: NOW },
  { org_id: orgId('sf-rec-park'), org_name: 'SF Recreation & Parks', website: 'https://sfrecpark.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94102', description_5th_grade: 'Manages 220+ parks, playgrounds, and recreation centers across San Francisco. Offers sports, classes, camps, and community events.', data_source: DS, last_updated: NOW },
  { org_id: orgId('friends-urban-forest'), org_name: 'Friends of the Urban Forest', website: 'https://www.fuf.net', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94102', description_5th_grade: 'Plants and cares for trees on San Francisco streets. Volunteers plant thousands of trees each year to make neighborhoods greener and cleaner.', data_source: DS, last_updated: NOW },
  { org_id: orgId('nature-in-city'), org_name: 'Nature in the City', website: 'https://www.natureinthecity.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94110', description_5th_grade: 'Restores wildlife habitat in San Francisco. Creates gardens, green spaces, and nature trails so city residents can enjoy nature close to home.', data_source: DS, last_updated: NOW },
  { org_id: orgId('surfrider-sf'), org_name: 'Surfrider Foundation SF Chapter', website: 'https://sf.surfrider.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94122', description_5th_grade: 'Protects San Francisco ocean beaches. Organizes beach cleanups, fights water pollution, and educates people about protecting our coast.', data_source: DS, last_updated: NOW },
]

// ── Workforce & Economic Development ─────────────────────────────────

const WORKFORCE_ORGS: OrgRecord[] = [
  { org_id: orgId('sf-oewd'), org_name: 'SF Office of Economic & Workforce Development', website: 'https://oewd.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94102', description_5th_grade: "Helps people find jobs and supports small businesses in San Francisco. Runs job training, career fairs, and the city's workforce programs.", data_source: DS, last_updated: NOW },
  { org_id: orgId('jvs'), org_name: 'Jewish Vocational Service (JVS)', website: 'https://www.jvs.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94108', description_5th_grade: 'Free job training and placement for all San Franciscans. Helps people learn new skills, write resumes, and find careers that pay well.', data_source: DS, last_updated: NOW },
  { org_id: orgId('arriba-juntos'), org_name: 'Arriba Juntos', website: 'https://www.arribajuntos.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94110', description_5th_grade: 'Job training and education for the Mission District community. Helps people learn English, get their GED, and find good jobs.', data_source: DS, last_updated: NOW },
  { org_id: orgId('goodwill-sf'), org_name: 'Goodwill Industries SF', website: 'https://sfgoodwill.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94103', description_5th_grade: 'Provides job training, career coaching, and employment for people facing barriers to work. Thrift stores fund the job programs.', data_source: DS, last_updated: NOW },
  { org_id: orgId('renaissance-center'), org_name: 'Renaissance Entrepreneurship Center', website: 'https://www.rencenter.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94124', description_5th_grade: 'Helps people start and grow small businesses. Offers free classes, mentoring, and small loans especially for women and minorities.', data_source: DS, last_updated: NOW },
  { org_id: orgId('sf-small-business'), org_name: 'SF Office of Small Business', website: 'https://sf.gov/departments/office-small-business', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94102', description_5th_grade: 'Helps small business owners navigate city permits, find funding, and grow their businesses. Free help for entrepreneurs in San Francisco.', data_source: DS, last_updated: NOW },
  { org_id: orgId('kiva-sf'), org_name: 'Kiva', website: 'https://www.kiva.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94104', description_5th_grade: 'Crowdfunding platform that gives small loans to entrepreneurs worldwide and locally. Helps small business owners get started without traditional bank loans.', data_source: DS, last_updated: NOW },
]

// ── Arts & Culture ───────────────────────────────────────────────────

const ARTS_ORGS: OrgRecord[] = [
  { org_id: orgId('sfmoma'), org_name: 'San Francisco Museum of Modern Art', website: 'https://www.sfmoma.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94103', description_5th_grade: 'Major modern art museum in downtown SF. Features paintings, sculptures, photography, and interactive exhibits. Free admission for visitors under 18.', data_source: DS, last_updated: NOW },
  { org_id: orgId('asian-art-museum'), org_name: 'Asian Art Museum', website: 'https://asianart.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94102', description_5th_grade: 'One of the largest museums of Asian art in the world. Shows art from China, Japan, Korea, India, and more. Located in Civic Center.', data_source: DS, last_updated: NOW },
  { org_id: orgId('de-young-museum'), org_name: 'de Young Museum', website: 'https://www.famsf.org/deyoung', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94118', description_5th_grade: 'Art museum in Golden Gate Park with American, African, and contemporary art. The observation tower has free views of the whole city.', data_source: DS, last_updated: NOW },
  { org_id: orgId('sf-arts-commission'), org_name: 'SF Arts Commission', website: 'https://www.sfartscommission.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94102', description_5th_grade: 'Funds public art, grants for artists, and arts programs across San Francisco. Makes sure art is part of every neighborhood.', data_source: DS, last_updated: NOW },
  { org_id: orgId('yerba-buena-arts'), org_name: 'Yerba Buena Center for the Arts', website: 'https://ybca.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94103', description_5th_grade: 'Art center in SoMa with exhibitions, performances, and film screenings. Focuses on art that connects to social issues and community voices.', data_source: DS, last_updated: NOW },
  { org_id: orgId('sf-symphony'), org_name: 'San Francisco Symphony', website: 'https://www.sfsymphony.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94102', description_5th_grade: 'World-class orchestra performing classical and contemporary music at Davies Symphony Hall. Offers free community concerts and youth programs.', data_source: DS, last_updated: NOW },
  { org_id: orgId('sffilm'), org_name: 'SFFILM', website: 'https://sffilm.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94102', description_5th_grade: 'Runs the San Francisco International Film Festival and supports independent filmmakers. Shows films from around the world year-round.', data_source: DS, last_updated: NOW },
]

// ── Community & Civic Organizations ──────────────────────────────────

const CIVIC_ORGS: OrgRecord[] = [
  { org_id: orgId('sf-planning'), org_name: 'SF Planning Department', website: 'https://sfplanning.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94102', description_5th_grade: 'Plans how San Francisco grows and changes. Reviews building permits, protects historic buildings, and makes sure development benefits neighborhoods.', data_source: DS, last_updated: NOW },
  { org_id: orgId('sf-election'), org_name: 'SF Department of Elections', website: 'https://sfelections.sfgov.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94102', description_5th_grade: 'Runs all elections in San Francisco. Helps you register to vote, find your polling place, and learn about ranked choice voting.', data_source: DS, last_updated: NOW },
  { org_id: orgId('spur'), org_name: 'SPUR', website: 'https://www.spur.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94105', description_5th_grade: 'Urban planning and policy think tank. Researches and promotes solutions for housing, transportation, sustainability, and good government in the Bay Area.', data_source: DS, last_updated: NOW },
  { org_id: orgId('sf-chamber'), org_name: 'SF Chamber of Commerce', website: 'https://sfchamber.com', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94104', description_5th_grade: 'Represents San Francisco businesses. Advocates for policies that help companies thrive and creates networking events for local business owners.', data_source: DS, last_updated: NOW },
  { org_id: orgId('sf-npc'), org_name: 'SF Neighborhood Parks Council', website: 'https://www.sfnpc.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94102', description_5th_grade: 'Brings together neighborhood groups that care for local parks. Organizes park clean-ups, community gardens, and advocacy for better parks.', data_source: DS, last_updated: NOW },
  { org_id: orgId('united-way-bay'), org_name: 'United Way Bay Area', website: 'https://uwba.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94105', description_5th_grade: 'Fights poverty in the Bay Area by funding programs for education, income, and health. Connects volunteers and donors to community needs.', data_source: DS, last_updated: NOW },
  { org_id: orgId('sf-volunteer-center'), org_name: 'SF Volunteer Center', website: 'https://www.onebrick.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94102', description_5th_grade: 'Connects volunteers with opportunities across San Francisco. Find ways to help your community — from serving meals to mentoring youth.', data_source: DS, last_updated: NOW },
  { org_id: orgId('sf-lgbtq-center'), org_name: 'SF LGBT Center', website: 'https://www.sfcenter.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94114', description_5th_grade: 'Community center in the Castro serving LGBTQ+ people and allies. Offers health services, youth programs, job help, and community events.', data_source: DS, last_updated: NOW },
  { org_id: orgId('chinese-progressive'), org_name: 'Chinese Progressive Association', website: 'https://cpasf.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94108', description_5th_grade: 'Organizes Chinese immigrants and workers for better wages, housing, and environmental justice. Provides leadership training and civic education.', data_source: DS, last_updated: NOW },
  { org_id: orgId('causa-justa'), org_name: 'Causa Justa :: Just Cause', website: 'https://cjjc.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94110', description_5th_grade: 'Fights for housing rights and racial justice in the Mission and Oakland. Organizes tenants to prevent evictions and displacement.', data_source: DS, last_updated: NOW },
]

// ── Safety & Emergency ───────────────────────────────────────────────

const SAFETY_ORGS: OrgRecord[] = [
  { org_id: orgId('sfpd'), org_name: 'San Francisco Police Department', website: 'https://www.sanfranciscopolice.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94103', description_5th_grade: 'The police department for San Francisco. Divided into 10 districts. Call 911 for emergencies or 311 for non-emergency city services.', data_source: DS, last_updated: NOW },
  { org_id: orgId('sffd'), org_name: 'San Francisco Fire Department', website: 'https://sf-fire.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94102', description_5th_grade: 'Responds to fires, medical emergencies, and disasters in San Francisco. Also provides fire safety education and building inspections.', data_source: DS, last_updated: NOW },
  { org_id: orgId('sf-dem'), org_name: 'SF Dept of Emergency Management', website: 'https://sfdem.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94103', description_5th_grade: 'Prepares San Francisco for earthquakes, fires, and other emergencies. Runs the 911 call center and helps neighborhoods get ready for disasters.', data_source: DS, last_updated: NOW },
  { org_id: orgId('safe-sf'), org_name: 'SF SAFE', website: 'https://sfsafe.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94102', description_5th_grade: 'Helps neighborhoods prevent crime through education, cameras, and community organizing. Works with police and residents to make areas safer.', data_source: DS, last_updated: NOW },
  { org_id: orgId('la-casa-madres'), org_name: 'La Casa de las Madres', website: 'https://lacasa.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94110', description_5th_grade: 'Shelters and support for people escaping domestic violence. Provides safe housing, counseling, legal help, and a 24-hour crisis hotline.', data_source: DS, last_updated: NOW },
  { org_id: orgId('womens-building'), org_name: "The Women's Building", website: 'https://womensbuilding.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94110', description_5th_grade: 'Community center serving women and families in the Mission District. Offers classes, legal clinics, health services, and cultural events.', data_source: DS, last_updated: NOW },
]

// ── Foundations & Funders ────────────────────────────────────────────

const FOUNDATIONS: Array<{
  id: string
  name: string
  city: string
  state_code: string
  zip_code: string
  geo_level: string
  mission: string
  data_source: string
  website: string
}> = [
  { id: 'FND_SF_COMM', name: 'The San Francisco Foundation', city: 'San Francisco', state_code: 'CA', zip_code: '94104', geo_level: 'regional', mission: 'Mobilizes resources and acts as a catalyst for change to build strong communities and close the opportunity gap in the Bay Area.', data_source: DS, website: 'https://sff.org' },
  { id: 'FND_SF_TIPPING', name: 'Tipping Point Community', city: 'San Francisco', state_code: 'CA', zip_code: '94105', geo_level: 'regional', mission: 'Fights poverty in the Bay Area by funding and strengthening the most effective nonprofits serving low-income residents.', data_source: DS, website: 'https://tippingpoint.org' },
  { id: 'FND_SF_HELLMAN', name: 'Hellman Foundation', city: 'San Francisco', state_code: 'CA', zip_code: '94104', geo_level: 'regional', mission: 'Supports education, human services, environment, and arts organizations in the San Francisco Bay Area.', data_source: DS, website: 'https://www.hellmanfoundation.org' },
  { id: 'FND_SF_HAAS', name: 'Haas Jr. Fund', city: 'San Francisco', state_code: 'CA', zip_code: '94104', geo_level: 'national', mission: 'Promotes equal rights and opportunities, a fair and diverse society, and responsible stewardship of the environment.', data_source: DS, website: 'https://www.haasjr.org' },
  { id: 'FND_SF_HEWLETT', name: 'William and Flora Hewlett Foundation', city: 'San Francisco', state_code: 'CA', zip_code: '94104', geo_level: 'national', mission: 'Advances ideas and supports institutions to promote a better world, focusing on education, environment, and performing arts.', data_source: DS, website: 'https://hewlett.org' },
  { id: 'FND_SF_PACKARD', name: 'David and Lucile Packard Foundation', city: 'San Francisco', state_code: 'CA', zip_code: '94104', geo_level: 'national', mission: 'Works on improving the lives of children, enabling creative pursuit of science, and conserving the natural world.', data_source: DS, website: 'https://www.packard.org' },
  { id: 'FND_SF_IRVINE', name: 'James Irvine Foundation', city: 'San Francisco', state_code: 'CA', zip_code: '94104', geo_level: 'state', mission: 'Expands economic and political opportunity for low-income workers in California through workforce development and civic participation.', data_source: DS, website: 'https://www.irvine.org' },
  { id: 'FND_SF_CRANKSTART', name: 'Crankstart Foundation', city: 'San Francisco', state_code: 'CA', zip_code: '94105', geo_level: 'regional', mission: 'Supports education access, arts, and social services to create equitable opportunity in the Bay Area.', data_source: DS, website: '' },
  { id: 'FND_SF_SOBRATO', name: 'Sobrato Philanthropies', city: 'San Francisco', state_code: 'CA', zip_code: '94104', geo_level: 'regional', mission: 'Invests in Silicon Valley and Bay Area communities through education, immigrant integration, and nonprofit capacity building.', data_source: DS, website: 'https://www.sobrato.org' },
  { id: 'FND_SF_WEINBERG', name: 'Harry and Jeanette Weinberg Foundation (Bay Area)', city: 'San Francisco', state_code: 'CA', zip_code: '94104', geo_level: 'national', mission: 'Supports organizations that provide direct services to low-income and vulnerable individuals, including housing, health, and workforce.', data_source: DS, website: 'https://hjweinbergfoundation.org' },
  { id: 'FND_SF_MCKESSON', name: 'McKesson Foundation', city: 'San Francisco', state_code: 'CA', zip_code: '94104', geo_level: 'national', mission: 'Promotes health equity and community well-being. Supports programs in health, education, and disaster relief.', data_source: DS, website: 'https://www.mckesson.com/about-mckesson/mckesson-foundation/' },
  { id: 'FND_SF_LEVI', name: 'Levi Strauss Foundation', city: 'San Francisco', state_code: 'CA', zip_code: '94105', geo_level: 'national', mission: 'Advances the human rights and well-being of underserved communities, focusing on workers rights, HIV/AIDS, and community engagement.', data_source: DS, website: 'https://www.levistrauss.com/levi-strauss-foundation/' },
  { id: 'FND_SF_SALESFORCE', name: 'Salesforce Foundation', city: 'San Francisco', state_code: 'CA', zip_code: '94105', geo_level: 'national', mission: 'Provides grants, volunteer time, and technology to support education, workforce development, and community organizations.', data_source: DS, website: 'https://www.salesforce.org' },
  { id: 'FND_SF_WALTON', name: 'San Francisco Community Investment Fund', city: 'San Francisco', state_code: 'CA', zip_code: '94102', geo_level: 'local', mission: 'Invests in affordable housing, small businesses, and community facilities in underserved San Francisco neighborhoods.', data_source: DS, website: '' },
  { id: 'FND_SF_ZELLERBACH', name: 'Zellerbach Family Foundation', city: 'San Francisco', state_code: 'CA', zip_code: '94104', geo_level: 'regional', mission: 'Strengthens families and communities through early childhood education, immigrant integration, and community arts in the Bay Area.', data_source: DS, website: 'https://www.zellerbach.org' },
]

// ── Government Agencies ──────────────────────────────────────────────

const GOV_AGENCIES: OrgRecord[] = [
  { org_id: orgId('sf-311'), org_name: 'SF 311 Customer Service Center', website: 'https://sf311.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94102', description_5th_grade: 'Call 311 for non-emergency city services — report potholes, graffiti, broken streetlights, or ask questions about any city department.', data_source: DS, last_updated: NOW },
  { org_id: orgId('sf-mta'), org_name: 'SF Municipal Transportation Agency (SFMTA)', website: 'https://www.sfmta.com', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94103', description_5th_grade: 'Runs Muni buses, trains, and cable cars. Also manages parking, bike lanes, and street safety. Use the Muni app to plan your ride.', data_source: DS, last_updated: NOW },
  { org_id: orgId('sf-dpw'), org_name: 'SF Public Works', website: 'https://www.sfpublicworks.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94103', description_5th_grade: 'Maintains city streets, sidewalks, and buildings. Handles street cleaning, tree care, graffiti removal, and infrastructure repairs.', data_source: DS, last_updated: NOW },
  { org_id: orgId('sf-puc'), org_name: 'SF Public Utilities Commission', website: 'https://sfpuc.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94103', description_5th_grade: 'Provides clean water, wastewater treatment, and green power to San Francisco. Manages the Hetch Hetchy water system from Yosemite.', data_source: DS, last_updated: NOW },
  { org_id: orgId('sf-assessor'), org_name: 'SF Office of the Assessor-Recorder', website: 'https://sfassessor.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94102', description_5th_grade: 'Determines property values for taxes. Records property sales, marriage certificates, and other official documents for San Francisco.', data_source: DS, last_updated: NOW },
  { org_id: orgId('sf-treasurer'), org_name: 'SF Office of the Treasurer & Tax Collector', website: 'https://sftreasurer.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94102', description_5th_grade: 'Collects property taxes and business taxes. Also runs Kindergarten to College, giving every SF public school student a savings account.', data_source: DS, last_updated: NOW },
  { org_id: orgId('sf-controller'), org_name: 'SF Office of the Controller', website: 'https://sfcontroller.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94102', description_5th_grade: "Watches over how the city spends money. Publishes reports on city finances and performance so the public can see where tax dollars go.", data_source: DS, last_updated: NOW },
  { org_id: orgId('bart'), org_name: 'Bay Area Rapid Transit (BART)', website: 'https://www.bart.gov', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94104', description_5th_grade: 'Regional rail system connecting San Francisco to Oakland, Berkeley, and suburbs. Nine stations in SF including downtown and the airport.', data_source: DS, last_updated: NOW },
]

// ── Transportation & Infrastructure ──────────────────────────────────

const TRANSPORT_ORGS: OrgRecord[] = [
  { org_id: orgId('sf-bicycle-coalition'), org_name: 'SF Bicycle Coalition', website: 'https://sfbike.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94103', description_5th_grade: 'Advocates for safer streets and better bike lanes in San Francisco. Offers free bike education classes and promotes biking for everyone.', data_source: DS, last_updated: NOW },
  { org_id: orgId('walk-sf'), org_name: 'Walk San Francisco', website: 'https://walksf.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94102', description_5th_grade: 'Works to make walking safer in San Francisco by advocating for slower traffic, better crosswalks, and Vision Zero (no traffic deaths).', data_source: DS, last_updated: NOW },
  { org_id: orgId('sf-transit-riders'), org_name: 'SF Transit Riders', website: 'https://www.sftransitriders.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94102', description_5th_grade: 'Advocates for better, more affordable public transit in San Francisco. Organizes riders to push for improved Muni service.', data_source: DS, last_updated: NOW },
]

// ── Senior Services ──────────────────────────────────────────────────

const SENIOR_ORGS: OrgRecord[] = [
  { org_id: orgId('sf-doas'), org_name: 'SF Dept of Disability & Aging Services', website: 'https://www.sfhsa.org/services/health-wellness/disability-aging-services', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94102', description_5th_grade: 'Helps seniors and people with disabilities live independently. Provides meal delivery, in-home care, adult day programs, and transportation.', data_source: DS, last_updated: NOW },
  { org_id: orgId('on-lok'), org_name: 'On Lok', website: 'https://www.onlok.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94108', description_5th_grade: 'Comprehensive care for seniors so they can stay in their homes and communities. Provides medical care, meals, transportation, and social activities.', data_source: DS, last_updated: NOW },
  { org_id: orgId('self-help-elderly'), org_name: 'Self-Help for the Elderly', website: 'https://www.selfhelpelderly.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94108', description_5th_grade: 'Serves Chinese and Asian seniors with meals, housing, health care, and social services in their own languages. Multiple locations in SF.', data_source: DS, last_updated: NOW },
  { org_id: orgId('institute-aging'), org_name: 'Institute on Aging', website: 'https://www.ioaging.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94118', description_5th_grade: 'Helps older adults maintain independence with home care, adult day programs, mental health services, and the Friendship Line crisis hotline.', data_source: DS, last_updated: NOW },
]

// ── Disability Services ──────────────────────────────────────────────

const DISABILITY_ORGS: OrgRecord[] = [
  { org_id: orgId('ilrc'), org_name: 'Independent Living Resource Center SF', website: 'https://www.ilrcsf.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94102', description_5th_grade: 'Helps people with disabilities live independently. Provides benefits counseling, housing search, personal assistance, and assistive technology.', data_source: DS, last_updated: NOW },
  { org_id: orgId('lighthouse-blind'), org_name: 'LightHouse for the Blind', website: 'https://lighthouse-sf.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94102', description_5th_grade: 'Training and support for people who are blind or have low vision. Teaches technology skills, independent living, and helps with employment.', data_source: DS, last_updated: NOW },
  { org_id: orgId('toolworks'), org_name: 'Toolworks', website: 'https://www.toolworks.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94102', description_5th_grade: 'Job training and employment for adults with developmental disabilities. Helps people find meaningful work and build careers.', data_source: DS, last_updated: NOW },
]

// ── Addiction & Recovery ─────────────────────────────────────────────

const RECOVERY_ORGS: OrgRecord[] = [
  { org_id: orgId('baker-places'), org_name: 'Baker Places', website: 'https://www.bakerplaces.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94117', description_5th_grade: 'Residential treatment and recovery programs for people dealing with substance abuse and mental health challenges. Multiple locations in SF.', data_source: DS, last_updated: NOW },
  { org_id: orgId('westside-community'), org_name: 'Westside Community Services', website: 'https://www.westside-health.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94102', description_5th_grade: 'Substance abuse treatment and mental health care in the Tenderloin. Offers detox, counseling, case management, and recovery support.', data_source: DS, last_updated: NOW },
  { org_id: orgId('jelani-house'), org_name: 'Jelani House', website: 'https://www.waldenhouse.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94124', description_5th_grade: 'Recovery program for African American families affected by substance abuse. Provides treatment, parenting support, and family reunification.', data_source: DS, last_updated: NOW },
]

// ── Technology & Digital Equity ───────────────────────────────────────

const TECH_ORGS: OrgRecord[] = [
  { org_id: orgId('sf-digital-equity'), org_name: 'SF Digital Equity', website: 'https://sfgov.org/dt/digital-equity', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94102', description_5th_grade: 'Works to make sure every San Franciscan has internet access, devices, and digital skills. Provides free WiFi and computer training in public spaces.', data_source: DS, last_updated: NOW },
  { org_id: orgId('code-tenderloin'), org_name: 'Code Tenderloin', website: 'https://www.codetenderloin.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94102', description_5th_grade: 'Free job training and tech skills for Tenderloin residents. Helps people build resumes, learn computers, and find employment.', data_source: DS, last_updated: NOW },
  { org_id: orgId('techsf'), org_name: 'TechSF', website: 'https://oewd.org/techsf', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94102', description_5th_grade: 'Free tech job training for San Francisco residents. Offers coding bootcamps, IT certifications, and connections to tech employers.', data_source: DS, last_updated: NOW },
]

// ── Additional Community Orgs ────────────────────────────────────────

const MORE_ORGS: OrgRecord[] = [
  { org_id: orgId('sf-spca'), org_name: 'San Francisco SPCA', website: 'https://www.sfspca.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94110', description_5th_grade: 'Rescues and adopts out dogs, cats, and other animals. Also offers low-cost veterinary care and animal welfare programs for the community.', data_source: DS, last_updated: NOW },
  { org_id: orgId('sf-food-runners'), org_name: 'SF Food Runners', website: 'https://www.sffoodrunners.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94102', description_5th_grade: 'Rescues surplus food from restaurants and businesses and delivers it to shelters, soup kitchens, and food programs. Prevents food waste.', data_source: DS, last_updated: NOW },
  { org_id: orgId('bay-area-rescue'), org_name: 'Bay Area Rescue Mission', website: 'https://www.bayarearescue.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94107', description_5th_grade: 'Emergency shelter, meals, and recovery programs for people experiencing homelessness. Helps people rebuild their lives through comprehensive support.', data_source: DS, last_updated: NOW },
  { org_id: orgId('ep-foster-care'), org_name: 'Edgewood Center for Children & Families', website: 'https://www.edgewood.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94127', description_5th_grade: 'Mental health services and support for children and families affected by trauma, abuse, and neglect. Runs school-based counseling programs.', data_source: DS, last_updated: NOW },
  { org_id: orgId('catholic-charities-sf'), org_name: 'Catholic Charities SF', website: 'https://www.catholiccharitiessf.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94102', description_5th_grade: 'Provides housing, immigration services, senior care, and family support regardless of religion. Serves some of the most vulnerable San Franciscans.', data_source: DS, last_updated: NOW },
  { org_id: orgId('meals-on-wheels-sf'), org_name: 'Meals on Wheels San Francisco', website: 'https://www.mowsf.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94107', description_5th_grade: 'Delivers hot, nutritious meals to homebound seniors every weekday. Also provides social visits and safety checks for isolated elderly neighbors.', data_source: DS, last_updated: NOW },
  { org_id: orgId('presidio-trust'), org_name: 'Presidio Trust', website: 'https://www.presidio.gov', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94129', description_5th_grade: 'Manages the Presidio national park in San Francisco. Offers hiking trails, beaches, museums, and community programs in this historic former military post.', data_source: DS, last_updated: NOW },
  { org_id: orgId('exploratorium'), org_name: 'Exploratorium', website: 'https://www.exploratorium.edu', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94111', description_5th_grade: 'Hands-on science museum on Pier 15. Hundreds of interactive exhibits about science, art, and human perception. Fun for all ages.', data_source: DS, last_updated: NOW },
  { org_id: orgId('cal-academy'), org_name: 'California Academy of Sciences', website: 'https://www.calacademy.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94118', description_5th_grade: 'Natural history museum, aquarium, planetarium, and rainforest all under one living roof in Golden Gate Park. Free for SF residents quarterly.', data_source: DS, last_updated: NOW },
  { org_id: orgId('sf-neighborhood-centers'), org_name: 'SF Neighborhood Centers Together', website: 'https://www.snct.org', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94102', description_5th_grade: 'Network of neighborhood centers across San Francisco providing childcare, youth programs, senior services, and community events.', data_source: DS, last_updated: NOW },
]

// ═══════════════════════════════════════════════════════════════════════
// 211 SERVICES
// ═══════════════════════════════════════════════════════════════════════

const SERVICES_211 = [
  { service_id: svcId('calfresh-sf'), service_name: 'CalFresh (Food Stamps) — SF', org_id: orgId('sf-hsa'), description_5th_grade: 'Free money on an EBT card to buy groceries. Apply if your income is low. Most people qualify — individuals earning less than $2,000/month.', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94103', website: 'https://www.sfhsa.org/services/health-food/calfresh', is_active: 'Yes', data_source: DS, last_updated: NOW, engagement_level: 'Resource' },
  { service_id: svcId('medi-cal-sf'), service_name: 'Medi-Cal Enrollment — SF', org_id: orgId('sf-hsa'), description_5th_grade: 'Free or low-cost health insurance for Californians with low income. Covers doctor visits, prescriptions, mental health, dental, and more.', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94103', website: 'https://www.sfhsa.org/services/health-food/medi-cal', is_active: 'Yes', data_source: DS, last_updated: NOW, engagement_level: 'Resource' },
  { service_id: svcId('healthy-sf'), service_name: 'Healthy San Francisco', org_id: orgId('sf-dph'), description_5th_grade: 'Health care program for uninsured San Francisco adults. Provides access to a medical home, prescriptions, and preventive care regardless of immigration status.', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94102', website: 'https://healthysanfrancisco.org', is_active: 'Yes', data_source: DS, last_updated: NOW, engagement_level: 'Resource' },
  { service_id: svcId('sf-free-meals'), service_name: 'Free Meals Program — GLIDE', org_id: orgId('glide'), description_5th_grade: 'Free hot meals served 3 times a day, 365 days a year at 330 Ellis Street in the Tenderloin. No questions asked — everyone welcome.', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94102', website: 'https://www.glide.org/free-meals', is_active: 'Yes', data_source: DS, last_updated: NOW, engagement_level: 'Resource' },
  { service_id: svcId('sf-shelter-hotline'), service_name: 'SF Homeless Outreach Hotline', org_id: orgId('sf-hsh'), description_5th_grade: 'Call 415-355-0311 if you or someone you know needs emergency shelter. Connects to shelter beds, navigation centers, and outreach teams.', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94102', phone: '415-355-0311', website: 'https://hsh.sfgov.org', is_active: 'Yes', data_source: DS, last_updated: NOW, engagement_level: 'Resource' },
  { service_id: svcId('sf-dv-hotline'), service_name: 'Domestic Violence Hotline — La Casa', org_id: orgId('la-casa-madres'), description_5th_grade: 'Call 877-503-1850 any time for help escaping abuse. Confidential support, safety planning, shelter referrals, and legal help.', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94110', phone: '877-503-1850', website: 'https://lacasa.org', is_active: 'Yes', data_source: DS, last_updated: NOW, engagement_level: 'Resource' },
  { service_id: svcId('sf-rental-assist'), service_name: 'Rental Assistance — SF', org_id: orgId('sf-mohcd'), description_5th_grade: 'Emergency help paying rent for San Francisco tenants at risk of eviction. Apply through the SF Human Services Agency or community partners.', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94102', website: 'https://sfmohcd.org', is_active: 'Yes', data_source: DS, last_updated: NOW, engagement_level: 'Resource' },
  { service_id: svcId('sf-eviction-defense'), service_name: 'Tenant Right to Counsel', org_id: orgId('tenderloin-housing'), description_5th_grade: 'Free lawyer for SF tenants facing eviction. San Francisco guarantees legal representation for every tenant in eviction court.', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94102', website: 'https://www.thclinic.org', is_active: 'Yes', data_source: DS, last_updated: NOW, engagement_level: 'Resource' },
  { service_id: svcId('sf-wic'), service_name: 'WIC Program — SF', org_id: orgId('sf-dph'), description_5th_grade: 'Free food, nutrition education, and breastfeeding support for pregnant women, new mothers, and children under 5 with low income.', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94102', website: 'https://www.sfdph.org/dph/comupg/oprograms/NutritionSvcs/WIC.asp', is_active: 'Yes', data_source: DS, last_updated: NOW, engagement_level: 'Resource' },
  { service_id: svcId('sf-mental-health'), service_name: 'Behavioral Health Access Center', org_id: orgId('sf-dph'), description_5th_grade: 'Walk-in center for mental health and substance use help. No appointment needed. Get connected to counseling, psychiatry, and support programs.', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94103', phone: '415-255-3737', website: 'https://www.sfdph.org/dph/comupg/oservices/mentalHlth/', is_active: 'Yes', data_source: DS, last_updated: NOW, engagement_level: 'Resource' },
  { service_id: svcId('sf-free-city'), service_name: 'Free City College', org_id: orgId('ccsf'), description_5th_grade: 'Free tuition at City College of San Francisco for all SF residents. Covers certificate programs, associate degrees, and transfer courses.', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94112', website: 'https://www.ccsf.edu/freecity', is_active: 'Yes', data_source: DS, last_updated: NOW, engagement_level: 'Resource' },
  { service_id: svcId('sf-k2c'), service_name: 'Kindergarten to College', org_id: orgId('sf-treasurer'), description_5th_grade: 'Every child in SF public schools gets a savings account with seed money for college. Families can add to it, and the city matches deposits.', city: 'San Francisco', state: 'CA', county_id: 'sf-county', zip_code: '94102', website: 'https://sfgov.org/k2c', is_active: 'Yes', data_source: DS, last_updated: NOW, engagement_level: 'Resource' },
]

// ═══════════════════════════════════════════════════════════════════════
// STATE & FEDERAL OFFICIALS (pre-seed)
// ═══════════════════════════════════════════════════════════════════════

const SF_OFFICIALS = [
  // US Senators (California)
  { official_id: 'OFF_CA_PADILLA', official_name: 'Alex Padilla', title: 'U.S. Senator', level: 'Federal', jurisdiction: 'California', district_type: 'Statewide', district_id: 'CA-SEN', party: 'Democrat', data_source: DS, last_updated: NOW },
  { official_id: 'OFF_CA_BUTLER', official_name: 'Laphonza Butler', title: 'U.S. Senator', level: 'Federal', jurisdiction: 'California', district_type: 'Statewide', district_id: 'CA-SEN', party: 'Democrat', data_source: DS, last_updated: NOW },
  // US House — CA-11 covers SF
  { official_id: 'OFF_CA11_PELOSI', official_name: 'Nancy Pelosi', title: 'U.S. Representative', level: 'Federal', jurisdiction: 'California', district_type: 'Congressional', district_id: 'CA-11', party: 'Democrat', data_source: DS, last_updated: NOW },
  // Governor
  { official_id: 'OFF_CA_NEWSOM', official_name: 'Gavin Newsom', title: 'Governor', level: 'State', jurisdiction: 'California', district_type: 'Statewide', district_id: 'CA', party: 'Democrat', data_source: DS, last_updated: NOW },
  // State Senator — SD-11
  { official_id: 'OFF_CA_SD11', official_name: 'Scott Wiener', title: 'State Senator', level: 'State', jurisdiction: 'California', district_type: 'State Senate', district_id: 'SD-11', party: 'Democrat', data_source: DS, last_updated: NOW },
  // State Assembly — AD-17
  { official_id: 'OFF_CA_AD17', official_name: 'Matt Haney', title: 'Assembly Member', level: 'State', jurisdiction: 'California', district_type: 'State Assembly', district_id: 'AD-17', party: 'Democrat', data_source: DS, last_updated: NOW },
  // State Assembly — AD-19
  { official_id: 'OFF_CA_AD19', official_name: 'Phil Ting', title: 'Assembly Member', level: 'State', jurisdiction: 'California', district_type: 'State Assembly', district_id: 'AD-19', party: 'Democrat', data_source: DS, last_updated: NOW },
  // SF Mayor
  { official_id: 'OFF_SF_MAYOR', official_name: 'London Breed', title: 'Mayor', level: 'City', jurisdiction: 'San Francisco', district_type: 'Citywide', district_id: 'mayor', party: 'Democrat', data_source: DS, last_updated: NOW },
  // SF District Attorney
  { official_id: 'OFF_SF_DA', official_name: 'Brooke Jenkins', title: 'District Attorney', level: 'City', jurisdiction: 'San Francisco', district_type: 'Citywide', district_id: 'district-attorney', party: 'Democrat', data_source: DS, last_updated: NOW },
  // SF City Attorney
  { official_id: 'OFF_SF_CITYATTY', official_name: 'David Chiu', title: 'City Attorney', level: 'City', jurisdiction: 'San Francisco', district_type: 'Citywide', district_id: 'city-attorney', party: 'Democrat', data_source: DS, last_updated: NOW },
  // SF Board of Supervisors (11 districts)
  { official_id: 'OFF_SF_D1', official_name: 'Connie Chan', title: 'Supervisor', level: 'City', jurisdiction: 'San Francisco', district_type: 'Board District', district_id: '1', data_source: DS, last_updated: NOW },
  { official_id: 'OFF_SF_D2', official_name: 'Catherine Stefani', title: 'Supervisor', level: 'City', jurisdiction: 'San Francisco', district_type: 'Board District', district_id: '2', data_source: DS, last_updated: NOW },
  { official_id: 'OFF_SF_D3', official_name: 'Aaron Peskin', title: 'Supervisor', level: 'City', jurisdiction: 'San Francisco', district_type: 'Board District', district_id: '3', data_source: DS, last_updated: NOW },
  { official_id: 'OFF_SF_D4', official_name: 'Joel Engardio', title: 'Supervisor', level: 'City', jurisdiction: 'San Francisco', district_type: 'Board District', district_id: '4', data_source: DS, last_updated: NOW },
  { official_id: 'OFF_SF_D5', official_name: 'Dean Preston', title: 'Supervisor', level: 'City', jurisdiction: 'San Francisco', district_type: 'Board District', district_id: '5', data_source: DS, last_updated: NOW },
  { official_id: 'OFF_SF_D6', official_name: 'Matt Dorsey', title: 'Supervisor', level: 'City', jurisdiction: 'San Francisco', district_type: 'Board District', district_id: '6', data_source: DS, last_updated: NOW },
  { official_id: 'OFF_SF_D7', official_name: 'Myrna Melgar', title: 'Supervisor', level: 'City', jurisdiction: 'San Francisco', district_type: 'Board District', district_id: '7', data_source: DS, last_updated: NOW },
  { official_id: 'OFF_SF_D8', official_name: 'Rafael Mandelman', title: 'Supervisor', level: 'City', jurisdiction: 'San Francisco', district_type: 'Board District', district_id: '8', data_source: DS, last_updated: NOW },
  { official_id: 'OFF_SF_D9', official_name: 'Hillary Ronen', title: 'Supervisor', level: 'City', jurisdiction: 'San Francisco', district_type: 'Board District', district_id: '9', data_source: DS, last_updated: NOW },
  { official_id: 'OFF_SF_D10', official_name: 'Shamann Walton', title: 'Supervisor', level: 'City', jurisdiction: 'San Francisco', district_type: 'Board District', district_id: '10', data_source: DS, last_updated: NOW },
  { official_id: 'OFF_SF_D11', official_name: 'Ahsha Safai', title: 'Supervisor', level: 'City', jurisdiction: 'San Francisco', district_type: 'Board District', district_id: '11', data_source: DS, last_updated: NOW },
]

// ═══════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════

async function main() {
  console.log('🌉 Seeding San Francisco data...\n')

  // Combine all orgs
  const allOrgs = [
    ...SOCIAL_SERVICES_ORGS,
    ...HEALTHCARE_ORGS,
    ...HOUSING_ORGS,
    ...EDUCATION_ORGS,
    ...LEGAL_ORGS,
    ...ENVIRONMENT_ORGS,
    ...WORKFORCE_ORGS,
    ...ARTS_ORGS,
    ...CIVIC_ORGS,
    ...SAFETY_ORGS,
    ...GOV_AGENCIES,
    ...TRANSPORT_ORGS,
    ...SENIOR_ORGS,
    ...DISABILITY_ORGS,
    ...RECOVERY_ORGS,
    ...TECH_ORGS,
    ...MORE_ORGS,
  ]

  console.log(`Organizations: ${allOrgs.length}`)
  const orgResult = await upsertBatch('organizations', 'org_id', allOrgs)
  console.log(`  ✓ ${orgResult} organizations upserted\n`)

  console.log(`Services (211): ${SERVICES_211.length}`)
  const svcResult = await upsertBatch('services_211', 'service_id', SERVICES_211)
  console.log(`  ✓ ${svcResult} services upserted\n`)

  console.log(`Foundations: ${FOUNDATIONS.length}`)
  const fndResult = await upsertBatch('foundations', 'id', FOUNDATIONS)
  console.log(`  ✓ ${fndResult} foundations upserted\n`)

  console.log(`Officials: ${SF_OFFICIALS.length}`)
  const offResult = await upsertBatch('elected_officials', 'official_id', SF_OFFICIALS)
  console.log(`  ✓ ${offResult} officials upserted\n`)

  // Log to ingestion_log
  await supaRest('POST', 'ingestion_log', {
    event_type: 'seed_sf',
    source: 'seed_sf',
    status: 'success',
    message: `SF seed: ${orgResult} orgs, ${svcResult} services, ${fndResult} foundations, ${offResult} officials`,
    item_count: orgResult + svcResult + fndResult + offResult,
  })

  console.log('─────────────────────────────────────────')
  console.log(`Total: ${orgResult + svcResult + fndResult + offResult} records seeded`)
  console.log('\n🌉 San Francisco seed complete!')
  console.log('\nNext steps:')
  console.log('  1. Run the SQL migration: supabase db push (or run 20260310_seed_san_francisco.sql)')
  console.log('  2. Deploy sync-city-sf edge function: supabase functions deploy sync-city-sf')
  console.log('  3. Trigger enrichment: POST /api/enrich-entity { table: "organizations", limit: 50 }')
  console.log('  4. Add SF GeoJSON files to public/geo/sf/')
}

main().catch(console.error)
