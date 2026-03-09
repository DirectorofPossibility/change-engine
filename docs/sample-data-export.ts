/**
 * @fileoverview Sample data export for building frontend templates.
 *
 * Every object here matches the types defined in src/lib/types/exchange.ts
 * and the shapes returned by the data modules in src/lib/data/*.ts.
 *
 * Uses realistic Houston names, ZIP codes, pathway themes, and focus areas.
 * Import individual exports or the unified `SAMPLE_DATA` default.
 */

import type {
  ExchangeStats,
  SearchResultOfficial,
  SearchResultService,
  SearchResultContent,
  SearchResultPolicy,
  SearchResultOrganization,
  SuperNeighborhood,
  GeographyData,
  MapMarkerData,
  WayfinderData,
  WayfinderContent,
  WayfinderOfficial,
  WayfinderPolicy,
  WayfinderService,
  WayfinderOrganization,
  WayfinderOpportunity,
  WayfinderFoundation,
  LibraryNugget,
  ContentPreview,
  ElectionDashboardData,
} from '@/lib/types/exchange'

// ── Theme / Pathway constants (mirror src/lib/constants.ts) ─────────

const THEME_IDS = {
  HEALTH: 'THEME_01',
  FAMILIES: 'THEME_02',
  NEIGHBORHOOD: 'THEME_03',
  VOICE: 'THEME_04',
  MONEY: 'THEME_05',
  PLANET: 'THEME_06',
  BIGGER_WE: 'THEME_07',
} as const

const CENTERS = ['Learning', 'Action', 'Resource', 'Accountability'] as const

// ── Homepage Stats ──────────────────────────────────────────────────

export const sampleExchangeStats: ExchangeStats = {
  resources: 1247,
  services: 438,
  officials: 87,
  learningPaths: 14,
  organizations: 312,
  policies: 63,
}

export const samplePathwayCounts: Record<string, number> = {
  THEME_01: 214,
  THEME_02: 189,
  THEME_03: 176,
  THEME_04: 163,
  THEME_05: 198,
  THEME_06: 142,
  THEME_07: 165,
}

export const sampleCenterCounts: Record<string, number> = {
  Learning: 412,
  Action: 287,
  Resource: 356,
  Accountability: 192,
}

// ── Officials (3 levels: federal, state, city) ──────────────────────

export const sampleOfficials: SearchResultOfficial[] = [
  {
    official_id: 'off-fed-001',
    official_name: 'Sheila Jackson Lee',
    title: 'U.S. Representative, TX-18',
    level: 'Federal',
    party: 'Democrat',
    jurisdiction: 'TX-18',
    email: 'sheila.jacksonlee@house.gov',
    office_phone: '(202) 225-3816',
    website: 'https://jacksonlee.house.gov',
  },
  {
    official_id: 'off-state-002',
    official_name: 'Borris Miles',
    title: 'State Senator, District 13',
    level: 'State',
    party: 'Democrat',
    jurisdiction: 'SD-13',
    email: 'borris.miles@senate.texas.gov',
    office_phone: '(713) 665-8322',
    website: 'https://senate.texas.gov/member.php?d=13',
  },
  {
    official_id: 'off-city-003',
    official_name: 'Carolyn Evans-Shabazz',
    title: 'City Council Member, District D',
    level: 'City',
    party: null,
    jurisdiction: 'District D',
    email: 'districtd@houstontx.gov',
    office_phone: '(832) 393-3001',
    website: 'https://www.houstontx.gov/council/d/',
  },
]

// ── Services (3 categories) ─────────────────────────────────────────

export const sampleServices: SearchResultService[] = [
  {
    service_id: 'svc-001',
    service_name: 'Harris Health Ben Taub Hospital - Emergency Department',
    description_5th_grade:
      'A hospital emergency room where anyone can get medical help, even without insurance. Open 24 hours, every day.',
    org_id: 'org-harrishealth',
    phone: '(713) 873-2000',
    address: '1504 Taub Loop',
    city: 'Houston',
    state: 'TX',
    zip_code: '77004',
    website: 'https://www.harrishealth.org',
    org_name: 'Harris Health System',
  },
  {
    service_id: 'svc-002',
    service_name: 'Houston Food Bank - Third Ward Distribution',
    description_5th_grade:
      'A place where families can pick up free groceries and food boxes. You do not need to show ID or proof of income.',
    org_id: 'org-foodbank',
    phone: '(713) 223-3700',
    address: '535 Portwall St',
    city: 'Houston',
    state: 'TX',
    zip_code: '77006',
    website: 'https://www.houstonfoodbank.org',
    org_name: 'Houston Food Bank',
  },
  {
    service_id: 'svc-003',
    service_name: 'Workforce Solutions - Career Center (Midtown)',
    description_5th_grade:
      'A center that helps people find jobs, write resumes, and learn new skills. All services are free.',
    org_id: 'org-workforce',
    phone: '(713) 627-3200',
    address: '3555 Timmons Ln Suite 120',
    city: 'Houston',
    state: 'TX',
    zip_code: '77019',
    website: 'https://www.wrksolutions.com',
    org_name: 'Workforce Solutions',
  },
]

// ── Content Items (3 pathways) ──────────────────────────────────────

export const sampleContentItems: SearchResultContent[] = [
  {
    id: 'cnt-001',
    inbox_id: 'inbox-cnt-001',
    title_6th_grade:
      'Houston expands free mental health clinics in underserved neighborhoods',
    summary_6th_grade:
      'The City of Houston announced 5 new community mental health clinics in neighborhoods that currently lack access. The clinics will offer therapy, crisis support, and substance use counseling at no cost to residents.',
    pathway_primary: THEME_IDS.HEALTH,
    center: 'Resource',
    source_url: 'https://www.houstonchronicle.com/health/mental-health-clinics',
    published_at: '2026-03-05T14:30:00Z',
  },
  {
    id: 'cnt-002',
    inbox_id: 'inbox-cnt-002',
    title_6th_grade:
      'How to get involved in Houston City Council budget hearings this spring',
    summary_6th_grade:
      'City Council will hold public budget hearings in April. Learn how to sign up to speak, submit written comments, or attend virtually. Your input shapes how the city spends billions of dollars.',
    pathway_primary: THEME_IDS.VOICE,
    center: 'Action',
    source_url: 'https://www.houstontx.gov/council/budget-hearings',
    published_at: '2026-03-02T09:15:00Z',
  },
  {
    id: 'cnt-003',
    inbox_id: 'inbox-cnt-003',
    title_6th_grade:
      'Understanding the Earned Income Tax Credit: how Houston families can keep more money',
    summary_6th_grade:
      'The EITC can put thousands of dollars back in working families\u2019 pockets. Learn who qualifies, how to file, and where to get free tax preparation help in Houston.',
    pathway_primary: THEME_IDS.MONEY,
    center: 'Learning',
    source_url: 'https://www.irs.gov/eitc',
    published_at: '2026-02-18T11:00:00Z',
  },
]

// ── Policies (2 levels) ─────────────────────────────────────────────

export const samplePolicies: SearchResultPolicy[] = [
  {
    policy_id: 'pol-001',
    policy_name: 'Houston Complete Streets Ordinance',
    title_6th_grade:
      'A city law that makes streets safer for walkers, bikers, and bus riders, not just cars',
    policy_type: 'Ordinance',
    level: 'City',
    status: 'Enacted',
    summary_5th_grade:
      'This law says that when Houston fixes or builds a street, it must include sidewalks, bike lanes, and safe crossings so everyone can travel safely.',
    summary_6th_grade:
      'The Complete Streets ordinance requires the City of Houston to design every road project with pedestrians, cyclists, transit riders, and drivers in mind. It applies to new construction and major renovations.',
    bill_number: 'ORD-2025-847',
    source_url: 'https://www.houstontx.gov/council/ordinances/2025-847',
  },
  {
    policy_id: 'pol-002',
    policy_name: 'Texas House Bill 5 - School Safety & Mental Health',
    title_6th_grade:
      'A state law that gives Texas schools more money for counselors and safety upgrades',
    policy_type: 'Bill',
    level: 'State',
    status: 'In Committee',
    summary_5th_grade:
      'This bill would give schools extra money to hire counselors, train teachers on mental health, and improve building safety.',
    summary_6th_grade:
      'HB 5 allocates $1.2 billion in state funding to increase school counselor ratios, mandate threat assessment protocols, and fund facility security improvements across Texas public schools.',
    bill_number: 'HB 5',
    source_url: 'https://capitol.texas.gov/BillLookup/History.aspx?LegSess=89R&Bill=HB5',
  },
]

// ── Organizations (2 types) ─────────────────────────────────────────

export const sampleOrganizations: SearchResultOrganization[] = [
  {
    org_id: 'org-avenue',
    org_name: 'Avenue Community Development Corporation',
    description_5th_grade:
      'A nonprofit that builds affordable homes and helps people in Northside and Near Northside neighborhoods buy their first house, start businesses, and improve their community.',
    website: 'https://www.avenuecdc.org',
    org_type: 'Nonprofit',
    logo_url: 'https://www.avenuecdc.org/logo.png',
  },
  {
    org_id: 'org-bakeripple',
    org_name: 'BakerRipley',
    description_5th_grade:
      'One of the largest charities in Houston. They run after-school programs, citizenship classes, workforce training, and disaster recovery across many neighborhoods.',
    website: 'https://www.bakerripley.org',
    org_type: 'Nonprofit',
    logo_url: 'https://www.bakerripley.org/logo.png',
  },
]

// ── Election Dashboard ──────────────────────────────────────────────

export const sampleElectionDashboard: ElectionDashboardData = {
  pastElections: [
    {
      election_id: 'elec-past-001',
      election_name: 'Houston Municipal Runoff Election',
      election_date: '2025-12-14',
      election_type: 'Runoff',
      jurisdiction: 'City of Houston',
      description: 'Runoff elections for Houston City Council Districts B, F, and J.',
      is_active: false,
      registration_deadline: '2025-11-14',
      early_voting_start: '2025-12-01',
      early_voting_end: '2025-12-10',
      source_url: 'https://www.harrisvotes.com',
      created_at: '2025-10-01T00:00:00Z',
      updated_at: '2025-12-15T00:00:00Z',
    } as any,
  ],
  upcomingElections: [
    {
      election_id: 'elec-up-001',
      election_name: 'Texas Constitutional Amendment Election',
      election_date: '2026-05-03',
      election_type: 'Special',
      jurisdiction: 'State of Texas',
      description:
        'Statewide vote on proposed amendments to the Texas Constitution, including infrastructure bonds and education funding formulas.',
      is_active: true,
      registration_deadline: '2026-04-03',
      early_voting_start: '2026-04-20',
      early_voting_end: '2026-04-29',
      source_url: 'https://www.sos.texas.gov/elections',
      created_at: '2026-01-15T00:00:00Z',
      updated_at: '2026-03-01T00:00:00Z',
    } as any,
  ],
  civicEvents: [
    {
      event_id: 'cev-001',
      event_name: 'City Council Public Budget Hearing',
      event_date: '2026-04-10',
      event_type: 'Hearing',
      location: 'Houston City Hall, Council Chamber',
      description:
        'Public hearing on the FY2027 proposed budget. Sign up to provide testimony.',
      source_url: 'https://www.houstontx.gov/council/',
      is_active: true,
      created_at: '2026-02-20T00:00:00Z',
      updated_at: '2026-03-01T00:00:00Z',
    } as any,
  ],
  recentCandidates: [],
  recentBallotItems: [],
  upcomingCandidates: [
    {
      candidate_id: 'cand-001',
      candidate_name: 'Maria Gonzalez',
      election_id: 'elec-up-001',
      office_sought: 'Proposition 1 - For',
      party: null,
      website: null,
      photo_url: null,
      is_incumbent: false,
      created_at: '2026-02-01T00:00:00Z',
      updated_at: '2026-03-01T00:00:00Z',
    } as any,
  ],
  upcomingBallotItems: [
    {
      item_id: 'ballot-001',
      election_id: 'elec-up-001',
      item_name: 'Proposition 1 - Infrastructure Bond',
      item_type: 'Constitutional Amendment',
      description:
        'Authorizes $3.5 billion in bonds for road, bridge, and flood control infrastructure across Texas.',
      jurisdiction: 'State',
      source_url: 'https://www.sos.texas.gov/elections/propositions',
      created_at: '2026-01-20T00:00:00Z',
      updated_at: '2026-03-01T00:00:00Z',
    } as any,
  ],
  officials: sampleOfficials as any[],
}

// ── Wayfinder Context (braided connections) ─────────────────────────

export const sampleWayfinderContext: WayfinderData = {
  focusAreas: [
    { focus_id: 'fa-mental-health', focus_area_name: 'Mental Health', theme_id: THEME_IDS.HEALTH },
    { focus_id: 'fa-food-access', focus_area_name: 'Food Access & Nutrition', theme_id: THEME_IDS.HEALTH },
    { focus_id: 'fa-youth-dev', focus_area_name: 'Youth Development', theme_id: THEME_IDS.FAMILIES },
  ],
  themes: [THEME_IDS.HEALTH, THEME_IDS.FAMILIES],
  content: [
    {
      id: 'cnt-wf-001',
      title_6th_grade: 'Free counseling now available at 12 Houston ISD campuses',
      summary_6th_grade:
        'Licensed counselors from the Harris Center are offering free drop-in sessions at middle and high schools across HISD. Students can visit during lunch or after school without a referral.',
      pathway_primary: THEME_IDS.HEALTH,
      center: 'Resource',
      image_url: 'https://images.unsplash.com/photo-school-counseling',
      source_url: 'https://www.houstonisd.org/counseling',
      inbox_id: 'inbox-wf-001',
      content_type: 'article',
    },
    {
      id: 'cnt-wf-002',
      title_6th_grade: 'Summer youth jobs program opens applications for 2026',
      summary_6th_grade:
        'The Mayor\u2019s Summer Jobs Program is accepting applications for teens ages 16\u201319. Participants earn $10/hour for 6 weeks and gain career skills in healthcare, technology, and public service.',
      pathway_primary: THEME_IDS.FAMILIES,
      center: 'Action',
      image_url: 'https://images.unsplash.com/photo-youth-jobs',
      source_url: 'https://www.houstontx.gov/summerjobs',
      inbox_id: 'inbox-wf-002',
      content_type: 'announcement',
    },
  ] satisfies WayfinderContent[],
  libraryNuggets: [
    {
      id: 'nug-001',
      title: 'Community Health Needs Assessment 2025',
      summary: 'Key findings on mental health service gaps in Houston\u2019s Third Ward and Sunnyside neighborhoods.',
      excerpt:
        'Only 23% of residents in these neighborhoods report having access to a mental health provider within 3 miles of their home.',
      page_ref: 'p. 47',
      document_id: 'doc-chna-2025',
    },
  ] satisfies LibraryNugget[],
  opportunities: [
    {
      opportunity_id: 'opp-001',
      opportunity_name: 'Volunteer Crisis Text Line Counselor',
      description_5th_grade:
        'Help people who are going through a tough time by texting with them. You will be trained to listen, support, and connect them to help.',
      start_date: '2026-04-01',
      end_date: '2026-12-31',
      time_commitment: '4 hours/week',
      is_virtual: true,
      registration_url: 'https://www.crisistextline.org/volunteer',
      org_id: 'org-crisis',
    },
  ] satisfies WayfinderOpportunity[],
  services: [
    {
      service_id: 'svc-wf-001',
      service_name: 'The Harris Center - Crisis Hotline',
      description_5th_grade:
        'A phone number you can call any time, day or night, if you or someone you know needs help with mental health or a crisis.',
      phone: '(713) 970-7000',
      address: '9401 Southwest Fwy',
      city: 'Houston',
      zip_code: '77074',
      org_id: 'org-harriscenter',
    },
  ] satisfies WayfinderService[],
  officials: [
    {
      official_id: 'off-state-002',
      official_name: 'Borris Miles',
      title: 'State Senator, District 13',
      level: 'State',
      party: 'Democrat',
      photo_url: null,
    },
  ] satisfies WayfinderOfficial[],
  policies: [
    {
      policy_id: 'pol-002',
      policy_name: 'Texas House Bill 5 - School Safety & Mental Health',
      title_6th_grade:
        'A state law that gives Texas schools more money for counselors and safety upgrades',
      bill_number: 'HB 5',
      status: 'In Committee',
      level: 'State',
    },
  ] satisfies WayfinderPolicy[],
  foundations: [
    {
      foundation_id: 'fnd-001',
      name: 'Houston Endowment Inc.',
      description:
        'One of the largest private foundations in Texas, investing in education, arts, environment, and community health across the Greater Houston region.',
      website: 'https://www.houstonendowment.org',
    },
  ] satisfies WayfinderFoundation[],
  organizations: [
    {
      org_id: 'org-harriscenter',
      org_name: 'The Harris Center for Mental Health and IDD',
      description_5th_grade:
        'The largest mental health center in Texas. They help people with mental health, substance use, and intellectual disabilities. Services include therapy, crisis help, and housing support.',
      logo_url: 'https://www.theharriscenter.org/logo.png',
      website: 'https://www.theharriscenter.org',
      phone: '(713) 970-7000',
      donate_url: 'https://www.theharriscenter.org/donate',
      volunteer_url: 'https://www.theharriscenter.org/volunteer',
      newsletter_url: null,
      org_type: 'Government Agency',
    },
  ] satisfies WayfinderOrganization[],
  taxonomy: {
    sdgs: [
      { sdg_id: 'sdg-3', sdg_number: 3, sdg_name: 'Good Health and Well-being', sdg_color: '#4C9F38' },
      { sdg_id: 'sdg-10', sdg_number: 10, sdg_name: 'Reduced Inequalities', sdg_color: '#DD1367' },
    ],
    sdohDomain: {
      sdoh_code: 'SDOH-3',
      sdoh_name: 'Health Care Access and Quality',
      sdoh_description: 'Access to comprehensive, quality health care services.',
    },
    actionTypes: [
      { action_type_id: 'at-learn', action_type_name: 'Learn', category: 'Engagement' },
      { action_type_id: 'at-access', action_type_name: 'Access Service', category: 'Resource' },
    ],
    govLevel: { gov_level_id: 'gl-state', gov_level_name: 'State' },
    timeCommitment: { time_id: 'tc-quick', time_name: '15 minutes or less' },
    ntee_codes: ['F20', 'F30'],
    airs_codes: ['RP-1500.1400'],
  },
}

// ── Braided Feed (mixed entity types along a pathway) ───────────────

export const sampleBraidedFeed = {
  content: [
    {
      id: 'cnt-bf-001',
      inbox_id: 'inbox-bf-001',
      title_6th_grade: 'After Hurricane Beryl: how to file a FEMA claim and get help rebuilding',
      summary_6th_grade:
        'Step-by-step guide for Houston residents to file disaster claims, find repair assistance, and access temporary housing after the storm.',
      pathway_primary: THEME_IDS.NEIGHBORHOOD,
      center: 'Resource',
      source_domain: 'houstonchronicle.com',
      published_at: '2026-02-28T08:00:00Z',
      image_url: 'https://images.unsplash.com/photo-disaster-recovery',
    },
    {
      id: 'cnt-bf-002',
      inbox_id: 'inbox-bf-002',
      title_6th_grade: 'Third Ward residents organize to demand better flood drainage',
      summary_6th_grade:
        'Neighbors formed a task force to push the city for drainage improvements after repeated flooding. They collected 500 signatures and presented their plan at City Council.',
      pathway_primary: THEME_IDS.NEIGHBORHOOD,
      center: 'Accountability',
      source_domain: 'texasobserver.org',
      published_at: '2026-02-20T10:30:00Z',
      image_url: null,
    },
  ],
  officials: [
    {
      official_id: 'off-city-003',
      official_name: 'Carolyn Evans-Shabazz',
      title: 'City Council Member, District D',
      party: null,
      level: 'City',
      jurisdiction: 'District D',
      description_5th_grade:
        'The city council member for District D, which includes Third Ward, MacGregor, and South Union. She works on neighborhood safety, flooding, and community investment.',
    },
  ],
  policies: [
    {
      policy_id: 'pol-bf-001',
      policy_name: 'Harris County Flood Bond Program',
      summary_5th_grade:
        'A plan to spend $2.5 billion to build better drainage, buyout flooded homes, and create new green spaces that soak up rain in Harris County.',
      policy_type: 'Bond Program',
      level: 'County',
      status: 'Active',
      bill_number: null,
    },
  ],
  services: [
    {
      service_id: 'svc-bf-001',
      service_name: 'Disaster Recovery Assistance - BakerRipley',
      description_5th_grade:
        'Free help for people affected by storms and flooding. They can help with home repairs, replacing lost documents, and finding temporary housing.',
      org_id: 'org-bakeripple',
      phone: '(713) 354-7587',
      address: '6500 Rookin St',
      city: 'Houston',
      state: 'TX',
      zip_code: '77004',
      website: 'https://www.bakerripley.org/disaster',
    },
  ],
  focusAreas: [
    { focus_id: 'fa-flooding', focus_area_name: 'Flooding & Drainage' },
    { focus_id: 'fa-housing-stability', focus_area_name: 'Housing Stability' },
    { focus_id: 'fa-disaster-recovery', focus_area_name: 'Disaster Recovery' },
  ],
}

// ── Geography / Neighborhood ────────────────────────────────────────

export const sampleSuperNeighborhood: SuperNeighborhood = {
  sn_id: 'sn-third-ward',
  sn_name: 'Third Ward',
  sn_number: 67,
  council_districts: 'D',
  zip_codes: '77004, 77021',
  population: 27500,
  median_income: 31200,
  description:
    'One of Houston\u2019s historically significant African American neighborhoods, home to Texas Southern University, the University of Houston, and Emancipation Park. Rich cultural heritage with growing investment in housing and community infrastructure.',
}

export const sampleGeographyData: GeographyData = {
  superNeighborhoods: [
    sampleSuperNeighborhood,
    {
      sn_id: 'sn-montrose',
      sn_name: 'Montrose',
      sn_number: 52,
      council_districts: 'C',
      zip_codes: '77006, 77019',
      population: 35800,
      median_income: 62400,
      description:
        'A vibrant, walkable neighborhood known for its arts scene, historic bungalows, and diverse community. Home to the Menil Collection, Rothko Chapel, and a thriving restaurant district.',
    },
  ],
  neighborhoods: [
    { neighborhood_id: 'hood-tw-01', neighborhood_name: 'Third Ward', super_neighborhood_id: 'sn-third-ward' },
    { neighborhood_id: 'hood-tw-02', neighborhood_name: 'South Union', super_neighborhood_id: 'sn-third-ward' },
    { neighborhood_id: 'hood-mt-01', neighborhood_name: 'Montrose', super_neighborhood_id: 'sn-montrose' },
    { neighborhood_id: 'hood-mt-02', neighborhood_name: 'Neartown', super_neighborhood_id: 'sn-montrose' },
  ],
  serviceMarkers: [
    {
      id: 'msvc-001',
      lat: 29.7199,
      lng: -95.3563,
      title: 'Houston Fire Station 7',
      type: 'fire',
      address: '2515 Holman St, Houston',
      phone: '(713) 884-3143',
      link: null,
    },
    {
      id: 'msvc-002',
      lat: 29.7357,
      lng: -95.3931,
      title: 'HPD Montrose Storefront',
      type: 'police',
      address: '404 Westheimer Rd, Houston',
      phone: '(713) 284-8604',
      link: null,
    },
  ] satisfies MapMarkerData[],
  organizationMarkers: [
    {
      id: 'org-avenue',
      lat: 29.7864,
      lng: -95.3621,
      title: 'Avenue Community Development Corporation',
      type: 'organization',
      address: '5900 Canal St, Houston',
      phone: '(713) 699-4867',
      link: '/services?org=org-avenue',
    },
  ] satisfies MapMarkerData[],
  officials: [
    {
      official_id: 'off-city-003',
      official_name: 'Carolyn Evans-Shabazz',
      title: 'City Council Member, District D',
      level: 'City',
      party: null,
      email: 'districtd@houstontx.gov',
      office_phone: '(832) 393-3001',
      website: 'https://www.houstontx.gov/council/d/',
      photo_url: null,
    },
  ],
  policies: [
    {
      policy_id: 'pol-001',
      policy_name: 'Houston Complete Streets Ordinance',
      title_6th_grade: 'A city law that makes streets safer for walkers, bikers, and bus riders',
      status: 'Enacted',
      level: 'City',
      source_url: 'https://www.houstontx.gov/council/ordinances/2025-847',
    },
  ],
}

// ── Compass Preview (pathway x center grid) ─────────────────────────

export const sampleCompassPreview: Record<string, Record<string, ContentPreview[]>> = {
  [THEME_IDS.HEALTH]: {
    Learning: [
      {
        id: 'cmp-001',
        title: 'What is Medicaid and who qualifies in Texas?',
        summary: 'A plain-language explainer of Texas Medicaid eligibility, enrollment steps, and covered services.',
        pathway: THEME_IDS.HEALTH,
        center: 'Learning',
        image_url: null,
        source_url: 'https://www.hhs.texas.gov/medicaid',
      },
    ],
    Resource: [
      {
        id: 'cmp-002',
        title: 'Find a free or low-cost clinic near you',
        summary: 'Interactive map of federally qualified health centers and charity care clinics across Houston.',
        pathway: THEME_IDS.HEALTH,
        center: 'Resource',
        image_url: 'https://images.unsplash.com/photo-clinic',
        source_url: 'https://findahealthcenter.hrsa.gov',
      },
    ],
  },
  [THEME_IDS.VOICE]: {
    Action: [
      {
        id: 'cmp-003',
        title: 'Register to vote in Harris County',
        summary: 'Step-by-step voter registration for Harris County residents. Deadline reminders and ID requirements explained.',
        pathway: THEME_IDS.VOICE,
        center: 'Action',
        image_url: null,
        source_url: 'https://www.harrisvotes.com/register',
      },
    ],
  },
}

// ── Pathway Hub Item (single pathway summary) ───────────────────────

export const samplePathwayHubItem = {
  themeId: THEME_IDS.HEALTH,
  heroContent: [
    {
      id: 'hero-001',
      title: 'Houston expands free mental health clinics in underserved neighborhoods',
      summary: 'Five new clinics will offer therapy, crisis support, and substance use counseling at no cost.',
      image_url: 'https://images.unsplash.com/photo-mental-health-clinic',
      content_type: 'article',
      published_at: '2026-03-05T14:30:00Z',
      source_domain: 'houstonchronicle.com',
    },
  ],
  contentCounts: { article: 89, video: 23, report: 14, announcement: 12, guide: 8 },
  totalContent: 146,
  entityCounts: { services: 67, officials: 12, policies: 9, opportunities: 15 },
  focusAreas: [
    { focus_id: 'fa-mental-health', focus_area_name: 'Mental Health', description: 'Access to therapy, counseling, crisis intervention, and behavioral health services.' },
    { focus_id: 'fa-food-access', focus_area_name: 'Food Access & Nutrition', description: 'Healthy food availability, food banks, SNAP, WIC, and community gardens.' },
    { focus_id: 'fa-maternal-health', focus_area_name: 'Maternal & Child Health', description: 'Prenatal care, postpartum support, infant health, and birthing services.' },
  ],
  learningPaths: [
    { path_id: 'lp-001', path_name: 'Navigate the Healthcare System', description: 'Learn how to find doctors, understand insurance, and access free clinics in Houston.', estimated_minutes: 25 },
  ],
  guides: [
    { guide_id: 'guide-001', title: 'Your Health Rights in Texas', slug: 'health-rights-texas', description: 'A comprehensive guide to healthcare rights, patient protections, and advocacy resources.', hero_image_url: null },
  ],
  bridges: [
    { targetThemeId: THEME_IDS.FAMILIES, targetName: 'Our Families', targetColor: '#dd6b20', targetSlug: 'our-families', sharedCount: 34 },
    { targetThemeId: THEME_IDS.MONEY, targetName: 'Our Money', targetColor: '#3182ce', targetSlug: 'our-money', sharedCount: 21 },
    { targetThemeId: THEME_IDS.NEIGHBORHOOD, targetName: 'Our Neighborhood', targetColor: '#d69e2e', targetSlug: 'our-neighborhood', sharedCount: 18 },
  ],
}

// ── Archetype Dashboard ─────────────────────────────────────────────

export const sampleArchetypeDashboardData = {
  contentByCenter: {
    Learning: [
      {
        id: 'ad-001', title: 'Understanding flood insurance in Houston', summary: 'What every homeowner and renter needs to know.',
        pathway: THEME_IDS.NEIGHBORHOOD, center: 'Learning', content_type: 'article',
        image_url: null, source_domain: 'khou.com', published_at: '2026-03-01T08:00:00Z',
      },
    ],
    Action: [
      {
        id: 'ad-002', title: 'Sign up for a neighborhood cleanup day', summary: 'Join volunteers across Houston for Keep Houston Beautiful.',
        pathway: THEME_IDS.PLANET, center: 'Action', content_type: 'event',
        image_url: null, source_domain: 'keephoutonbeautiful.org', published_at: '2026-02-25T10:00:00Z',
      },
    ],
    Resource: [],
    Accountability: [],
  },
  contentCountsByType: { article: 412, video: 98, report: 67, announcement: 54, guide: 32, event: 28 },
  contentCountsByPathway: samplePathwayCounts,
  services: [
    { service_id: 'svc-001', service_name: 'Harris Health Ben Taub Hospital - Emergency Department', description: 'Emergency medical care, open 24/7.', org_name: 'Harris Health System', category: 'Health Care' },
  ],
  officials: [
    { official_id: 'off-fed-001', official_name: 'Sheila Jackson Lee', title: 'U.S. Representative, TX-18', party: 'Democrat', level: 'Federal', photo_url: null },
  ],
  policies: [
    { policy_id: 'pol-001', policy_name: 'Houston Complete Streets Ordinance', summary: 'Streets designed for all travelers.', policy_type: 'Ordinance', level: 'City', status: 'Enacted' },
  ],
  opportunities: [
    { opportunity_id: 'opp-001', title: 'Volunteer Crisis Text Line Counselor', description: 'Support people in crisis via text.', org_name: 'Crisis Text Line', time_commitment: '4 hours/week', is_virtual: true },
  ],
  learningPaths: [
    { path_id: 'lp-001', path_name: 'Navigate the Healthcare System', description: 'Find doctors, insurance, and free clinics.', theme_id: THEME_IDS.HEALTH, estimated_minutes: 25, difficulty_level: 'Beginner' },
  ],
  guides: [
    { guide_id: 'guide-001', title: 'Your Health Rights in Texas', slug: 'health-rights-texas', description: 'Healthcare rights and patient protections.', theme_id: THEME_IDS.HEALTH, hero_image_url: null },
  ],
  libraryDocs: [
    { id: 'doc-chna-2025', title: 'Community Health Needs Assessment 2025', summary: 'Mental health gaps in Third Ward and Sunnyside.', tags: ['health', 'equity', 'Third Ward'], theme_ids: [THEME_IDS.HEALTH], page_count: 84 },
  ],
  totalCounts: { content: 691, services: 438, officials: 87, policies: 63, opportunities: 42, learningPaths: 14, guides: 11, library: 23 },
}

// ── Unified export ──────────────────────────────────────────────────

const SAMPLE_DATA = {
  // Homepage
  exchangeStats: sampleExchangeStats,
  pathwayCounts: samplePathwayCounts,
  centerCounts: sampleCenterCounts,

  // Entity lists
  officials: sampleOfficials,
  services: sampleServices,
  contentItems: sampleContentItems,
  policies: samplePolicies,
  organizations: sampleOrganizations,

  // Election dashboard
  electionDashboard: sampleElectionDashboard,

  // Wayfinder (braided connections)
  wayfinderContext: sampleWayfinderContext,

  // Braided feed (mixed entities along a pathway)
  braidedFeed: sampleBraidedFeed,

  // Geography / neighborhoods
  superNeighborhood: sampleSuperNeighborhood,
  geographyData: sampleGeographyData,

  // Compass grid
  compassPreview: sampleCompassPreview,

  // Pathway hub
  pathwayHubItem: samplePathwayHubItem,

  // Archetype dashboard
  archetypeDashboard: sampleArchetypeDashboardData,

  // Constants for reference
  THEME_IDS,
  CENTERS,
}

export default SAMPLE_DATA
