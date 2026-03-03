#!/usr/bin/env bash
#
# prepare-geo.sh — Download, clip, simplify, and convert boundary shapefiles to GeoJSON
#
# Prerequisites:
#   brew install gdal mapshaper  (or apt-get on Linux)
#
# Usage:
#   ./scripts/prepare-geo.sh [layer]
#
# Without arguments, processes all layers. With an argument, processes only that layer.
# Example: ./scripts/prepare-geo.sh council-districts

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
OUTPUT_DIR="$PROJECT_DIR/public/geo"
TMP_DIR="$(mktemp -d)"

# Harris County bounding box (generous)
BBOX="-96.0,29.4,-94.9,30.2"

cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

mkdir -p "$OUTPUT_DIR"

log() {
  echo "[prepare-geo] $1"
}

# ─── Super Neighborhoods ───────────────────────────────────────────────
prepare_super_neighborhoods() {
  log "Super Neighborhoods: downloading from ArcGIS..."
  curl -sL "https://services.arcgis.com/NummVBqZSIJKUeVR/arcgis/rest/services/Super_Neighborhoods/FeatureServer/0/query?where=1%3D1&outFields=*&f=geojson&resultRecordCount=200" \
    -o "$TMP_DIR/sn_raw.geojson"

  log "Super Neighborhoods: processing..."
  python3 -c "
import json
with open('$TMP_DIR/sn_raw.geojson') as f:
    data = json.load(f)
if 'properties' in data:
    del data['properties']
for feat in data['features']:
    p = feat['properties']
    polyid = p.get('POLYID', 0)
    feat['properties'] = {
        'SN_ID': f'SN-{polyid:02d}',
        'SN_NAME': p.get('SNBNAME', '').title(),
        'SN_NUMBER': polyid,
    }
with open('$OUTPUT_DIR/super-neighborhoods.geojson', 'w') as f:
    json.dump(data, f, separators=(',', ':'))
print(f'  {len(data[\"features\"])} features')
"

  if command -v mapshaper &>/dev/null; then
    log "Super Neighborhoods: simplifying with mapshaper..."
    mapshaper "$OUTPUT_DIR/super-neighborhoods.geojson" \
      -simplify dp 50% \
      -o "$OUTPUT_DIR/super-neighborhoods.geojson" force format=geojson
  fi

  log "Super Neighborhoods: done ($(du -h "$OUTPUT_DIR/super-neighborhoods.geojson" | cut -f1))"
}

# ─── Council Districts ─────────────────────────────────────────────────
prepare_council_districts() {
  log "Council Districts: downloading from ArcGIS..."
  # City of Houston council districts
  curl -sL "https://services.arcgis.com/NummVBqZSIJKUeVR/arcgis/rest/services/Council_Districts/FeatureServer/0/query?where=1%3D1&outFields=*&f=geojson&resultRecordCount=50" \
    -o "$TMP_DIR/cd_raw.geojson" || {
    log "Council Districts: download failed (endpoint may have changed), skipping"
    return 0
  }

  python3 -c "
import json
with open('$TMP_DIR/cd_raw.geojson') as f:
    data = json.load(f)
if 'properties' in data:
    del data['properties']
for feat in data['features']:
    p = feat['properties']
    dist = p.get('DISTRICT', p.get('District', ''))
    feat['properties'] = {'DISTRICT': str(dist), 'NAME': 'District ' + str(dist)}
with open('$OUTPUT_DIR/council-districts.geojson', 'w') as f:
    json.dump(data, f, separators=(',', ':'))
print(f'  {len(data[\"features\"])} features')
" && log "Council Districts: done" || log "Council Districts: processing failed, skipping"
}

# ─── Census TIGER/Line layers ──────────────────────────────────────────
# These require downloading shapefiles from Census TIGER/Line and converting
# Run these only when you have ogr2ogr (GDAL) installed

prepare_zip_codes() {
  if ! command -v ogr2ogr &>/dev/null; then
    log "ZIP Codes: ogr2ogr not found, install GDAL first (brew install gdal)"
    return 0
  fi

  log "ZIP Codes: downloading ZCTA shapefile from Census TIGER/Line..."
  curl -sL "https://www2.census.gov/geo/tiger/TIGER2020/ZCTA520/tl_2020_us_zcta520.zip" \
    -o "$TMP_DIR/zcta.zip"

  unzip -q "$TMP_DIR/zcta.zip" -d "$TMP_DIR/zcta"

  log "ZIP Codes: clipping to Harris County area..."
  ogr2ogr -f GeoJSON "$TMP_DIR/zips_clipped.geojson" "$TMP_DIR/zcta/tl_2020_us_zcta520.shp" \
    -clipsrc $BBOX

  python3 -c "
import json
with open('$TMP_DIR/zips_clipped.geojson') as f:
    data = json.load(f)
for feat in data['features']:
    p = feat['properties']
    feat['properties'] = {'ZCTA5CE20': p.get('ZCTA5CE20', ''), 'NAME': p.get('ZCTA5CE20', '')}
with open('$OUTPUT_DIR/zip-codes.geojson', 'w') as f:
    json.dump(data, f, separators=(',', ':'))
print(f'  {len(data[\"features\"])} features')
"

  if command -v mapshaper &>/dev/null; then
    mapshaper "$OUTPUT_DIR/zip-codes.geojson" \
      -simplify dp 50% \
      -o "$OUTPUT_DIR/zip-codes.geojson" force format=geojson
  fi

  log "ZIP Codes: done"
}

prepare_census_tracts() {
  if ! command -v ogr2ogr &>/dev/null; then
    log "Census Tracts: ogr2ogr not found, skipping"
    return 0
  fi

  log "Census Tracts: downloading shapefile for Texas (FIPS 48)..."
  curl -sL "https://www2.census.gov/geo/tiger/TIGER2020/TRACT/tl_2020_48_tract.zip" \
    -o "$TMP_DIR/tracts.zip"

  unzip -q "$TMP_DIR/tracts.zip" -d "$TMP_DIR/tracts"

  log "Census Tracts: clipping to Harris County area..."
  ogr2ogr -f GeoJSON "$TMP_DIR/tracts_clipped.geojson" "$TMP_DIR/tracts/tl_2020_48_tract.shp" \
    -clipsrc $BBOX

  python3 -c "
import json
with open('$TMP_DIR/tracts_clipped.geojson') as f:
    data = json.load(f)
for feat in data['features']:
    p = feat['properties']
    feat['properties'] = {'GEOID': p.get('GEOID', ''), 'NAME': p.get('NAME', ''), 'NAMELSAD': p.get('NAMELSAD', '')}
with open('$OUTPUT_DIR/census-tracts.geojson', 'w') as f:
    json.dump(data, f, separators=(',', ':'))
print(f'  {len(data[\"features\"])} features')
"

  if command -v mapshaper &>/dev/null; then
    mapshaper "$OUTPUT_DIR/census-tracts.geojson" \
      -simplify dp 50% \
      -o "$OUTPUT_DIR/census-tracts.geojson" force format=geojson
  fi

  log "Census Tracts: done"
}

prepare_congressional() {
  if ! command -v ogr2ogr &>/dev/null; then
    log "Congressional Districts: ogr2ogr not found, skipping"
    return 0
  fi

  log "Congressional Districts: downloading shapefile..."
  curl -sL "https://www2.census.gov/geo/tiger/TIGER2020/CD/tl_2020_us_cd116.zip" \
    -o "$TMP_DIR/cd116.zip"

  unzip -q "$TMP_DIR/cd116.zip" -d "$TMP_DIR/cd116"

  ogr2ogr -f GeoJSON "$TMP_DIR/cd_clipped.geojson" "$TMP_DIR/cd116/tl_2020_us_cd116.shp" \
    -clipsrc $BBOX -where "STATEFP='48'"

  python3 -c "
import json
with open('$TMP_DIR/cd_clipped.geojson') as f:
    data = json.load(f)
for feat in data['features']:
    p = feat['properties']
    feat['properties'] = {'CD': p.get('CD116FP', ''), 'NAME': 'TX-' + p.get('CD116FP', ''), 'NAMELSAD': p.get('NAMELSAD', '')}
with open('$OUTPUT_DIR/congressional-districts.geojson', 'w') as f:
    json.dump(data, f, separators=(',', ':'))
print(f'  {len(data[\"features\"])} features')
"

  log "Congressional Districts: done"
}

prepare_state_senate() {
  if ! command -v ogr2ogr &>/dev/null; then
    log "State Senate: ogr2ogr not found, skipping"
    return 0
  fi

  log "State Senate Districts: downloading shapefile..."
  curl -sL "https://www2.census.gov/geo/tiger/TIGER2020/SLDU/tl_2020_48_sldu.zip" \
    -o "$TMP_DIR/sldu.zip"

  unzip -q "$TMP_DIR/sldu.zip" -d "$TMP_DIR/sldu"

  ogr2ogr -f GeoJSON "$TMP_DIR/sldu_clipped.geojson" "$TMP_DIR/sldu/tl_2020_48_sldu.shp" \
    -clipsrc $BBOX

  python3 -c "
import json
with open('$TMP_DIR/sldu_clipped.geojson') as f:
    data = json.load(f)
for feat in data['features']:
    p = feat['properties']
    feat['properties'] = {'SD': p.get('SLDUST', ''), 'NAME': 'Senate District ' + p.get('SLDUST', ''), 'NAMELSAD': p.get('NAMELSAD', '')}
with open('$OUTPUT_DIR/state-senate-districts.geojson', 'w') as f:
    json.dump(data, f, separators=(',', ':'))
print(f'  {len(data[\"features\"])} features')
"

  log "State Senate Districts: done"
}

prepare_state_house() {
  if ! command -v ogr2ogr &>/dev/null; then
    log "State House: ogr2ogr not found, skipping"
    return 0
  fi

  log "State House Districts: downloading shapefile..."
  curl -sL "https://www2.census.gov/geo/tiger/TIGER2020/SLDL/tl_2020_48_sldl.zip" \
    -o "$TMP_DIR/sldl.zip"

  unzip -q "$TMP_DIR/sldl.zip" -d "$TMP_DIR/sldl"

  ogr2ogr -f GeoJSON "$TMP_DIR/sldl_clipped.geojson" "$TMP_DIR/sldl/tl_2020_48_sldl.shp" \
    -clipsrc $BBOX

  python3 -c "
import json
with open('$TMP_DIR/sldl_clipped.geojson') as f:
    data = json.load(f)
for feat in data['features']:
    p = feat['properties']
    feat['properties'] = {'HD': p.get('SLDLST', ''), 'NAME': 'House District ' + p.get('SLDLST', ''), 'NAMELSAD': p.get('NAMELSAD', '')}
with open('$OUTPUT_DIR/state-house-districts.geojson', 'w') as f:
    json.dump(data, f, separators=(',', ':'))
print(f'  {len(data[\"features\"])} features')
"

  log "State House Districts: done"
}

# ─── Main ───────────────────────────────────────────────────────────────

LAYER="${1:-all}"

case "$LAYER" in
  super-neighborhoods)  prepare_super_neighborhoods ;;
  council-districts)    prepare_council_districts ;;
  zip-codes)            prepare_zip_codes ;;
  census-tracts)        prepare_census_tracts ;;
  congressional)        prepare_congressional ;;
  state-senate)         prepare_state_senate ;;
  state-house)          prepare_state_house ;;
  all)
    prepare_super_neighborhoods
    prepare_council_districts
    prepare_zip_codes
    prepare_census_tracts
    prepare_congressional
    prepare_state_senate
    prepare_state_house
    ;;
  *)
    echo "Unknown layer: $LAYER"
    echo "Usage: $0 [super-neighborhoods|council-districts|zip-codes|census-tracts|congressional|state-senate|state-house|all]"
    exit 1
    ;;
esac

log "All done. Files in $OUTPUT_DIR:"
ls -lh "$OUTPUT_DIR"/*.geojson 2>/dev/null || echo "  (no files)"
