# Houston Neighborhood-Level Civic Data APIs — Scoping Document

**Date:** 2026-03-12
**Purpose:** Inventory of public data APIs for Houston neighborhood-level civic indicators, modeled on the data domains covered by Understanding Houston (understandinghouston.org).

---

## Table of Contents

1. [Census / ACS](#1-census--acs)
2. [Bureau of Labor Statistics (BLS)](#2-bureau-of-labor-statistics-bls)
3. [CDC PLACES](#3-cdc-places)
4. [Texas Education Agency (TEA)](#4-texas-education-agency-tea)
5. [EPA Air Quality](#5-epa-air-quality)
6. [HUD Housing Data](#6-hud-housing-data)
7. [FBI Crime Data](#7-fbi-crime-data)
8. [Texas DSHS Health Data](#8-texas-dshs-health-data)
9. [Harris County Open Data](#9-harris-county-open-data)
10. [City of Houston Open Data](#10-city-of-houston-open-data)
11. [Understanding Houston](#11-understanding-houston)
12. [Integration Priority Matrix](#12-integration-priority-matrix)

---

## 1. Census / ACS

The single most important data source. Understanding Houston derives the majority of its demographic, economic, and housing indicators from Census/ACS data.

### API Details

| Field | Value |
|-------|-------|
| **Base URL** | `https://api.census.gov/data/{year}/acs/acs5` |
| **Documentation** | https://www.census.gov/data/developers.html |
| **Auth** | Free API key required — register at https://api.census.gov/data/key_signup.html |
| **Rate Limits** | 500 requests/day without key; no published hard limit with key (but throttled at ~50 req/sec) |
| **Cost** | Free |

### Available Datasets

| Dataset | Endpoint Suffix | Variables | Notes |
|---------|----------------|-----------|-------|
| **ACS 5-Year Detailed Tables** | `/acs/acs5` | ~64,000 | Down to block group |
| **ACS 5-Year Subject Tables** | `/acs/acs5/subject` | ~66,000 | Down to tract |
| **ACS 5-Year Data Profiles** | `/acs/acs5/profile` | ~2,400 | Down to tract |
| **ACS 1-Year** | `/acs/acs1` | Fewer | Places 65K+ pop only |
| **Decennial Census** | `/dec/pl` | Redistricting | Down to block |
| **Population Estimates (PEP)** | `/pep/population` | Annual intercensal | County+ |

### Geographic Granularity

The ACS 5-Year API supports **87 geographic summary levels**, including:

- **Census Tract** (FIPS code `140`) — the key neighborhood proxy
- **Block Group** (FIPS `150`) — sub-neighborhood (Detailed Tables only)
- **ZCTA / ZIP Code Tabulation Area** (FIPS `860`)
- **Place** (FIPS `160`) — city boundaries
- **County** (FIPS `050`)
- **Congressional District** (FIPS `500`)
- **School District** (FIPS `950`-`970`)
- **PUMA** (FIPS `795`) — Public Use Microdata Area

### Key Variables for Houston

| Domain | Table Group Examples |
|--------|---------------------|
| Population & demographics | B01001 (age/sex), B02001 (race), B03003 (Hispanic origin) |
| Income & poverty | B19013 (median household income), B17001 (poverty status) |
| Housing | B25003 (tenure), B25077 (median home value), B25064 (median rent) |
| Education | B15003 (educational attainment) |
| Language | B16001 (language spoken at home) |
| Health insurance | B27001 (insurance coverage) |
| Commuting | B08301 (means of transportation to work) |
| Internet access | B28002 (internet subscriptions) |

### Query Pattern
```
https://api.census.gov/data/2022/acs/acs5?get=B19013_001E,NAME&for=tract:*&in=state:48&in=county:201&key=YOUR_KEY
```
This returns median household income for every census tract in Harris County (FIPS 48201).

---

## 2. Bureau of Labor Statistics (BLS)

### API Details

| Field | Value |
|-------|-------|
| **Base URL** | `https://api.bls.gov/publicAPI/v2/timeseries/data/` |
| **Documentation** | https://www.bls.gov/developers/ |
| **Auth** | API v1: no key (severely limited). API v2: free registration key |
| **Rate Limits** | **v1**: 25 queries/day, 10 years max, 25 series per query. **v2**: 500 queries/day, 20 years, 50 series per query |
| **Cost** | Free |

### Available Data Series

| Series | Prefix | Geographic Level | Houston-Relevant |
|--------|--------|-----------------|-----------------|
| **Local Area Unemployment (LAUS)** | `LA` | MSA, county, city | Houston-The Woodlands-Sugar Land MSA |
| **Current Employment Statistics (CES)** | `CE` / `SM` | MSA, state | Houston MSA employment by industry |
| **Quarterly Census of Employment & Wages (QCEW)** | `EN` | County | Harris County wages by industry |
| **Consumer Price Index (CPI)** | `CU` | MSA (large cities only) | Houston-Woodlands-Sugar Land CPI |
| **Occupational Employment & Wage Statistics (OEWS)** | `OE` | MSA | Houston MSA wages by occupation |

### Geographic Granularity

- **Best case**: MSA (Houston-The Woodlands-Sugar Land) and County (Harris, Fort Bend, etc.)
- **No tract/ZIP level data** — BLS does not publish sub-county geography
- Series IDs encode geography: e.g., `LAUST4835380000000003` = Houston city unemployment rate

### Limitations
- No neighborhood/tract-level data — supplementary to Census ACS for sub-county work
- Historical data depth varies by series (some go back to 1939, others only recent years)

---

## 3. CDC PLACES

The primary source for neighborhood-level health indicators. This is how Understanding Houston gets tract-level health data.

### API Details

| Field | Value |
|-------|-------|
| **Platform** | Socrata (SODA API) on data.cdc.gov |
| **Base API Pattern** | `https://data.cdc.gov/resource/{dataset-id}.json` |
| **Documentation** | https://dev.socrata.com/ and https://www.cdc.gov/places/ |
| **Auth** | Free Socrata app token recommended (not required) |
| **Rate Limits** | Without token: shared throttle pool. With token: 1,000 req/hour |
| **Cost** | Free |

### Datasets & Identifiers

| Dataset | Socrata ID | Geographic Level | Records |
|---------|-----------|-----------------|---------|
| **PLACES: Census Tract Data** | `cwsq-ngmh` | Census Tract | ~4.8M |
| **PLACES: County Data** | `swc5-untb` | County | ~190K |
| **PLACES: Place (City) Data** | `eav7-ber7` | Place/city | ~1.7M |
| **PLACES: ZCTA Data** | `qnzd-25i4` | ZIP Code (ZCTA) | ~1.9M |

### Available Health Measures (49 total)

| Category | Example Measures |
|----------|-----------------|
| **Health Outcomes (12)** | Arthritis, asthma, cancer, COPD, CHD, diabetes, high blood pressure, kidney disease, obesity, stroke, depression, tooth loss |
| **Prevention (7)** | Cholesterol screening, dental visits, mammography, core preventive services, colorectal cancer screening, cervical cancer screening, flu vaccination |
| **Health Risk Behaviors (4)** | Binge drinking, current smoking, physical inactivity, short sleep duration |
| **Disabilities (7)** | Any disability, cognitive, hearing, mobility, self-care, independent living, vision |
| **Health Status (3)** | Fair/poor health, physical health not good, mental health not good |
| **Social Needs (7)** | Food stamps/SNAP, lack of health insurance, housing cost burden, poverty, no high school diploma, single-parent households, unemployment |

### Query Pattern (Census Tract, Harris County)
```
https://data.cdc.gov/resource/cwsq-ngmh.json?countyFIPS=48201&$limit=50000&$$app_token=YOUR_TOKEN
```

### Notes
- Model-based small area estimates from BRFSS (survey) + ACS
- Data updated annually, typically with 1-2 year lag
- Uses 2020 Census geographies
- Covers all 83,522 census tracts nationally with 50+ adult residents

---

## 4. Texas Education Agency (TEA)

### API Details

| Field | Value |
|-------|-------|
| **Platform** | No REST API — bulk download files and interactive tools only |
| **Data Portal** | https://tea.texas.gov/reports-and-data |
| **TAPR Reports** | https://rptsvr1.tea.texas.gov/perfreport/tapr/index.html |
| **AskTED Directory** | https://tealprod.tea.state.tx.us/tea.askted.web/Forms/Home.aspx |
| **Auth** | None (public downloads) |
| **Cost** | Free |

### Available Data

| Dataset | Granularity | Format |
|---------|------------|--------|
| **A-F Accountability Ratings** | Campus, District | Excel/CSV downloads |
| **STAAR Test Results** | Campus, District, State | Excel/CSV |
| **TAPR (Texas Academic Performance Reports)** | Campus, District | Interactive + downloads |
| **Enrollment & Demographics** | Campus, District | PEIMS flat files |
| **Graduation/Dropout Rates** | Campus, District | Excel/CSV |
| **Staff/Teacher Data** | Campus, District | Excel/CSV |
| **Financial Data** | District | Excel/CSV |

### Geographic Granularity
- **Campus** (individual school) — finest grain
- **District** — ~1,200 districts statewide
- **No tract/ZIP level** — must map school addresses to tracts via geocoding

### Houston-Relevant Districts
- Houston ISD (101912)
- Aldine ISD, Alief ISD, Cypress-Fairbanks ISD, Fort Bend ISD, Katy ISD, Klein ISD, Pasadena ISD, Spring Branch ISD, Spring ISD, and ~20 more in the metro area

### Integration Approach
Since TEA lacks a REST API, integration options are:
1. **Scrape/download** annual flat files and load into database
2. **PEIMS data** available as fixed-width/CSV bulk downloads
3. **Map campuses to tracts** using campus addresses + geocoding

---

## 5. EPA Air Quality

### API Details

| Field | Value |
|-------|-------|
| **Base URL** | `https://aqs.epa.gov/data/api/` |
| **Documentation** | https://aqs.epa.gov/aqsweb/documents/data_api.html |
| **Auth** | Free — register with email at the API signup endpoint |
| **Registration** | `https://aqs.epa.gov/data/api/signup?email=YOUR_EMAIL` |
| **Rate Limits** | 10 requests/minute, 100K rows/request |
| **Cost** | Free |

### Available Data

| Endpoint | Data |
|----------|------|
| `/annualData/byCounty` | Annual summaries by pollutant and county |
| `/dailyData/byCounty` | Daily AQI and pollutant readings |
| `/monitors/byCounty` | Monitor locations and metadata |
| `/sampleData/byCounty` | Raw sample-level measurements |
| `/quarterlyData/byCounty` | Quarterly aggregations |
| `/transactionsData/byCounty` | Change log data |

### Pollutants Tracked
- Ozone (O3)
- PM2.5 (fine particulate)
- PM10 (coarse particulate)
- CO (carbon monoxide)
- SO2 (sulfur dioxide)
- NO2 (nitrogen dioxide)
- Lead
- Hazardous Air Pollutants (HAPs)

### Geographic Granularity
- **Monitoring Site** (lat/lon of individual sensors)
- **County** (FIPS code)
- **CBSA** (metro statistical area)
- **State**
- No native tract/ZIP — but site lat/lon can be mapped to tracts

### Query Pattern (Harris County)
```
https://aqs.epa.gov/data/api/annualData/byCounty?email=YOUR_EMAIL&key=YOUR_KEY&param=88101&bdate=20220101&edate=20221231&state=48&county=201
```
(`88101` = PM2.5)

### Additional EPA Sources

| Source | URL | Notes |
|--------|-----|-------|
| **EJScreen (Environmental Justice)** | https://ejscreen.epa.gov/mapper/ | Tract-level EJ indices; bulk download + API |
| **AirNow** | https://www.airnowapi.org/ | Real-time AQI; free API key |
| **TRI (Toxic Release Inventory)** | https://www.epa.gov/tri | Facility-level toxic releases; Envirofacts API |
| **Envirofacts API** | `https://enviro.epa.gov/enviro/efservice/` | REST API for multiple EPA databases |

**EJScreen is particularly valuable** — it provides pre-computed tract-level environmental justice indices combining pollution burden with demographic vulnerability.

---

## 6. HUD Housing Data

### API Details

| Field | Value |
|-------|-------|
| **Base URL** | `https://www.huduser.gov/hudapi/public/` |
| **Documentation** | https://www.huduser.gov/portal/dataset/fmr-api.html |
| **Auth** | Free account + Bearer token |
| **Registration** | https://www.huduser.gov/portal/dataset/fmr-api.html (sign up) |
| **Rate Limits** | Not published (reasonable use expected) |
| **Cost** | Free |

### Available API Endpoints

| Endpoint | Data | Granularity |
|----------|------|-------------|
| `/fmr/data/{entityid}` | Fair Market Rents (by bedroom count) | County, Metro, ZIP (Small Area FMR) |
| `/fmr/statedata/{statecode}` | State-level FMR | State |
| `/il/data/{entityid}` | Income Limits (30/50/80% AMI) | County, Metro |
| `/chas` | CHAS housing affordability data | County, Place, Tract, Block Group |
| `/mtspil/data/{entityid}` | Multifamily Tax Subsidy income limits | County, Metro |

### CHAS Data (Most Granular)

The CHAS dataset is the richest for neighborhood-level housing analysis:
- **Geographic levels**: Nation, State, County, MCD, Place, Census Tract, Block Group
- **Years**: 2006-2022 (5-year ACS windows)
- **Variables**: Cost burden, overcrowding, substandard housing by income level and tenure
- **API**: `https://www.huduser.gov/hudapi/public/chas?type=3&stateId=48&entityId=48201&year=2018-2022`

### Additional HUD Data (Download Only)

| Dataset | URL | Notes |
|---------|-----|-------|
| **Picture of Subsidized Households** | huduser.gov/portal/datasets/assthsg.html | Project-level data on HUD-assisted housing |
| **LIHTC Database** | huduser.gov/portal/datasets/lihtc.html | Low-Income Housing Tax Credit projects |
| **HUD Crosswalk Files** | huduser.gov/portal/datasets/usps_crosswalk.html | ZIP-to-tract, tract-to-ZIP mappings (essential!) |
| **PIT Homeless Count** | hudexchange.info/resource/3031/ | CoC-level homelessness data |

### HUD Crosswalk Files — Critical Utility
HUD publishes quarterly ZIP-to-tract and tract-to-ZIP crosswalk files derived from USPS data. These are essential for mapping between ZIP-based data (like BLS, some health data) and tract-based data (Census, PLACES).

---

## 7. FBI Crime Data

### API Details

| Field | Value |
|-------|-------|
| **Base URL** | `https://api.usa.gov/crime/fbi/cde/` |
| **Documentation** | https://cde.ucr.cjis.gov/LATEST/webapp/#/pages/docApi |
| **Auth** | Free API key from api.data.gov |
| **Registration** | https://api.data.gov/signup/ |
| **Rate Limits** | 1,000 requests/hour (api.data.gov standard) |
| **Cost** | Free |

### Available Endpoints

| Endpoint | Data |
|----------|------|
| `/summarized/agency/{ori}/offenses` | UCR Summary offense counts by agency |
| `/summarized/agency/{ori}/arrest` | Arrest data by agency |
| `/summarized/state/{stateAbbr}/offenses` | State-level offense summaries |
| `/nibrs/offense/agency/{ori}` | NIBRS detailed incident data by agency |
| `/hate-crime/agency/{ori}` | Hate crime reports by agency |
| `/victims/agency/{ori}` | Victim data by agency |
| `/officers/agency/{ori}` | Law enforcement officer data |
| `/participation/agencies/{ori}` | Agency reporting participation |

### Geographic Granularity
- **Agency (ORI code)** — individual police departments
- **State** — aggregated
- **National** — aggregated
- **No tract/ZIP/county level** — must map agencies to geographies

### Houston-Relevant Agency ORIs
- Houston Police Department: `TX2010000`
- Harris County Sheriff's Office: `TX2010100`
- Pasadena PD, Baytown PD, and other metro agencies

### Limitations
- Data is agency-reported; not all agencies report every year
- NIBRS transition ongoing — older data may be UCR Summary only
- No sub-city geographic breakdown (no beat/district level via this API)
- Significant reporting lag (1-2 years)

### Alternative: City of Houston Crime Data
The City of Houston open data portal provides more granular, more timely crime data with lat/lon coordinates that can be mapped to tracts. This is likely more useful for neighborhood-level analysis.

---

## 8. Texas DSHS Health Data

### Details

| Field | Value |
|-------|-------|
| **Portal** | https://healthdata.dshs.texas.gov/ |
| **Platform** | Interactive dashboards (Power BI / Tableau) + bulk downloads |
| **API** | No public REST API |
| **Auth** | None (public access) |
| **Cost** | Free |

### Available Data

| Dataset | Granularity | Access |
|---------|------------|--------|
| **Vital Statistics (Births)** | County, Health Service Region | Dashboard + download |
| **Vital Statistics (Deaths)** | County, Health Service Region | Dashboard + download |
| **Notifiable Disease Surveillance** | County, Region | Reports/downloads |
| **Behavioral Risk Factors (BRFSS)** | State, sometimes HSR | Reports |
| **Hospital Discharge Data (THCIC)** | Facility, County | Restricted access for detailed data |
| **Cancer Registry** | County, HSR | Texas Cancer Registry portal |
| **Immunization Data** | County, school district | Reports |
| **Health Professional Supply** | County | Downloads |

### Geographic Granularity
- **Health Service Region (HSR)** — Texas divides into 11 HSRs; Houston is HSR 6
- **County** — most datasets available at county level
- **No tract/ZIP level** — DSHS does not publish sub-county data (CDC PLACES fills this gap)

### Integration Approach
- Download county-level vital statistics and disease data for Harris + surrounding counties
- Use CDC PLACES for tract-level health estimates (Section 3)
- THCIC hospital data requires data use agreement for detailed records

---

## 9. Harris County Open Data

### Portals

Harris County data is split across multiple portals:

| Portal | URL | Platform |
|--------|-----|----------|
| **Harris County Open Data** | https://opendata.harriscountytx.gov | ArcGIS Hub |
| **Harris County Flood Control** | https://www.hcfcd.org/Resources/Interactive-Mapping-Tools | Custom GIS |
| **HCAD (Appraisal District)** | https://hcad.org/pdata/ | Custom downloads |

### Available Datasets (ArcGIS Hub)

| Category | Datasets |
|----------|----------|
| **Boundaries** | Precincts, commissioner districts, justice of the peace areas |
| **Flood** | Floodplain maps, bayou watersheds, detention basins |
| **Infrastructure** | Roads, bridges, county facilities |
| **Elections** | Polling locations, election results |
| **Property** | Parcels (via HCAD) |

### HCAD Property Data
- Free bulk downloads of entire Harris County property roll
- Includes: property values, ownership, land use, building characteristics
- Text/CSV format, updated regularly
- No API — flat file downloads only

### API Access
- ArcGIS Hub datasets expose **ArcGIS REST API** endpoints
- Pattern: `https://opendata.harriscountytx.gov/api/v3/datasets/{id}`
- Also supports GeoJSON and Shapefile downloads
- Free, no authentication required

### Harris County Flood Control
- Critical for Houston — flood risk mapping
- Interactive maps but limited API access
- FEMA flood maps available via NFHL (National Flood Hazard Layer) API

---

## 10. City of Houston Open Data

### API Details

| Field | Value |
|-------|-------|
| **Portal URL** | https://data.houstontx.gov |
| **Platform** | CKAN |
| **API** | CKAN API (`https://data.houstontx.gov/api/3/action/`) |
| **Auth** | None required |
| **Rate Limits** | Not published |
| **Cost** | Free |

### Available Datasets (83 total)

| Category | Notable Datasets |
|----------|-----------------|
| **Public Safety** | HPD crime statistics (with lat/lon), fire incidents |
| **Finance** | City checkbook, payroll, vendor/supplier data, budget |
| **Planning** | Building permits, code enforcement violations |
| **Demographics** | Population estimates by age/sex/race, median household income |
| **Housing** | Housing occupancy, tenure, residential building permits |
| **Infrastructure** | 311 service requests, city facilities |

### CKAN API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/api/3/action/package_list` | List all dataset names |
| `/api/3/action/package_show?id={name}` | Get dataset metadata |
| `/api/3/action/datastore_search?resource_id={id}` | Query dataset rows with filters |
| `/api/3/action/datastore_search_sql` | SQL queries against datasets |

### Key Dataset: HPD Crime Data
- Individual incidents with addresses/coordinates
- Can be geocoded to census tracts for neighborhood-level crime analysis
- More granular and timely than FBI UCR data
- Updated regularly

---

## 11. Understanding Houston

### About
- Produced by the **Greater Houston Community Foundation** with data analysis by the **Kinder Institute for Urban Research** at Rice University
- Launched as a civic data dashboard covering the 9-county Greater Houston region
- Covers ~100+ indicators across education, health, economy, demographics, environment, public safety, and quality of life

### Data Sources They Use
Understanding Houston aggregates from most of the APIs listed in this document:
- Census/ACS (primary demographic and economic data)
- CDC PLACES / BRFSS (health indicators)
- TEA (education)
- BLS (employment)
- FBI UCR (crime)
- EPA (environment)
- Various state and local sources

### Public API / Data Downloads
- **No public API** — Understanding Houston is a JavaScript single-page app (React) that renders pre-processed data
- **No documented data download** feature for raw data
- Data appears to be pre-aggregated and embedded in the application
- Their backend data processing is not publicly accessible

### Integration Implications
- Cannot pull data from Understanding Houston directly
- Must go to the same upstream sources they use
- The value of this scoping doc is identifying those upstream sources for direct integration

---

## 12. Integration Priority Matrix

### Tier 1 — High Value, API-Ready (Integrate First)

| Source | Why | Effort |
|--------|-----|--------|
| **Census/ACS** | Foundation for all demographic, economic, housing data at tract level | Low — clean REST API |
| **CDC PLACES** | Only source for tract-level health indicators | Low — Socrata SODA API |
| **HUD (FMR + CHAS)** | Housing affordability at tract level | Low — REST API with token |

### Tier 2 — High Value, Moderate Effort

| Source | Why | Effort |
|--------|-----|--------|
| **City of Houston Open Data** | Crime data with coordinates, permits, 311 | Medium — CKAN API, needs geocoding |
| **EPA (EJScreen + AQS)** | Environmental justice indicators at tract level | Medium — multiple APIs |
| **BLS** | Employment/wage context at MSA/county level | Low — REST API, but limited geography |

### Tier 3 — Valuable, Higher Effort (Bulk Download / Scrape)

| Source | Why | Effort |
|--------|-----|--------|
| **TEA** | School performance — critical for families | High — no API, bulk file processing + geocoding |
| **FBI Crime Data** | National comparison context | Medium — API exists but agency-level only |
| **Harris County (HCAD)** | Property values, land use | High — bulk flat files |
| **Texas DSHS** | State health data | High — no API, county-level only |

### Recommended Integration Sequence

1. **Census/ACS** — build the geographic foundation (tracts, ZCTAs, counties for Harris County)
2. **HUD Crosswalk Files** — enable ZIP-to-tract mapping for all future data
3. **CDC PLACES** — layer health indicators onto tracts
4. **HUD CHAS** — add housing affordability metrics
5. **City of Houston crime data** — geocode to tracts for public safety layer
6. **EPA EJScreen** — environmental justice overlay
7. **BLS** — MSA/county economic context
8. **TEA** — school data mapped to attendance zones/tracts

### Key Geographic Identifiers for Harris County

| Identifier | Value | Notes |
|------------|-------|-------|
| State FIPS | `48` | Texas |
| County FIPS | `201` | Harris County |
| Full County FIPS | `48201` | State + County |
| MSA CBSA Code | `26420` | Houston-The Woodlands-Sugar Land |
| Place FIPS | `4835000` | City of Houston |
| Adjacent Counties | Fort Bend (157), Montgomery (339), Brazoria (039), Galveston (167), Liberty (291), Waller (473), Chambers (071), Austin (015) | 9-county metro region |

### Data Refresh Cadence

| Source | Update Frequency | Typical Lag |
|--------|-----------------|-------------|
| Census ACS 5-Year | Annual (December) | ~1 year |
| Census ACS 1-Year | Annual (September) | ~1 year |
| CDC PLACES | Annual | ~2 years |
| BLS LAUS | Monthly | 1-2 months |
| BLS QCEW | Quarterly | ~6 months |
| EPA AQS | Daily (raw), Annual (summary) | Varies |
| HUD FMR | Annual (October) | Current year |
| HUD CHAS | Annual (December) | ~2 years |
| FBI UCR | Annual | 1-2 years |
| TEA Accountability | Annual (August) | Current year |
| Houston Crime Data | Ongoing | Days-weeks |
