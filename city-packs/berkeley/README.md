# Berkeley City Pack

## Government Structure
- **Form**: Council-Manager
- **Mayor**: Citywide elected, 4-year term
- **Council**: 8 districts, 4-year staggered terms
- **Next election**: November 3, 2026 (Districts 1, 4, 7, 8)

## Data Sources

| Data | Source | Method |
|------|--------|--------|
| City officials | berkeleyca.gov/council-roster | Manual seed, periodic check |
| Meeting agendas | berkeley.granicus.com | RSS polling |
| Legislation/records | records.cityofberkeley.info (OnBase) | No API — manual or scrape |
| Council district boundaries | data.cityofberkeley.info | Shapefile download → GeoJSON |
| State officials | Open States API | `california` jurisdiction |
| Federal officials | Congress.gov + Google Civic | CA-12, SD-9, AD-15 |

## Notes
- Berkeley does NOT use Legistar. Uses Granicus for meetings and OnBase for records.
- All Berkeley ZIPs fall within single districts at each level (CA-12, SD-9, AD-15) — no splits.
- Shares Bay Area metro with San Francisco. Alameda County also covers Oakland.
- Strong civic engagement culture — UC Berkeley, many active nonprofits.

## GeoJSON Files Needed
- [ ] council-districts.geojson — Download Shapefile from data.cityofberkeley.info, convert with ogr2ogr
- [ ] city-boundary.geojson
- [ ] parks.geojson
- [ ] zip-codes.geojson

## Starter Organizations (for org profiler batch)
- UC Berkeley (civic programs)
- Berkeley Community Fund
- Ecology Center
- Berkeley Food Network
- Bay Area Community Resources
- East Bay Community Foundation
