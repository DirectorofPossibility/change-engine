#!/bin/bash
# ──────────────────────────────────────────────────────────────────
# prepare-sf-geo.sh — Download San Francisco GeoJSON boundary files
# from DataSF (SF Open Data) and the US Census Bureau.
#
# Output goes to public/geo/sf/
# ──────────────────────────────────────────────────────────────────

set -e

OUT_DIR="public/geo/sf"
mkdir -p "$OUT_DIR"

echo "🌉 Downloading San Francisco GeoJSON files..."

# ── 1. Supervisor Districts (Board of Supervisors 1-11) ──────────
echo "  → Supervisor Districts..."
curl -sL "https://data.sfgov.org/api/geospatial/p5b7-5n3h?method=export&type=GeoJSON" \
  -o "$OUT_DIR/supervisor-districts.geojson"

# ── 2. Neighborhoods (Analysis Neighborhoods) ────────────────────
echo "  → Neighborhoods..."
curl -sL "https://data.sfgov.org/api/geospatial/p5b7-5n3h?method=export&type=GeoJSON" \
  -o "$OUT_DIR/neighborhoods.geojson" 2>/dev/null || \
curl -sL "https://data.sfgov.org/api/geospatial/pty2-tcw4?method=export&type=GeoJSON" \
  -o "$OUT_DIR/neighborhoods.geojson"

# ── 3. ZIP Codes ─────────────────────────────────────────────────
echo "  → ZIP Codes..."
curl -sL "https://data.sfgov.org/api/geospatial/u5j3-svi6?method=export&type=GeoJSON" \
  -o "$OUT_DIR/zip-codes.geojson"

# ── 4. Police Districts ──────────────────────────────────────────
echo "  → Police Districts..."
curl -sL "https://data.sfgov.org/api/geospatial/wkhw-cjsf?method=export&type=GeoJSON" \
  -o "$OUT_DIR/police-districts.geojson"

# ── 5. Census Tracts (from Census Bureau) ─────────────────────────
echo "  → Census Tracts (SF County FIPS 06075)..."
curl -sL "https://data.sfgov.org/api/geospatial/bwbp-wk3r?method=export&type=GeoJSON" \
  -o "$OUT_DIR/census-tracts.geojson"

# ── 6. Parks ──────────────────────────────────────────────────────
echo "  → Parks..."
curl -sL "https://data.sfgov.org/api/geospatial/gqw7-mctj?method=export&type=GeoJSON" \
  -o "$OUT_DIR/parks.geojson"

echo ""
echo "✅ GeoJSON files saved to $OUT_DIR/"
ls -lh "$OUT_DIR/"*.geojson 2>/dev/null
echo ""
echo "Next: Add SF layers to src/lib/constants.ts GEO_LAYERS config"
