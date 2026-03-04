#!/usr/bin/env bash
#
# ingest-changelab.sh — Ingest thechangelab.net/resourcecenter into The Change Engine
#
# Calls the api-ingest edge function in batches of 25 URLs.
# Images are automatically captured via og:image extraction in classify-content-v2.
#
# Prerequisites:
#   1. An API key from the api_keys table (create one in /dashboard/api-keys)
#   2. The SUPABASE_URL (already in .env.local)
#
# Usage:
#   export INGEST_API_KEY="sk_live_..."
#   ./scripts/ingest-changelab.sh                  # Ingest all 257 resources
#   ./scripts/ingest-changelab.sh --dry-run        # Show what would be ingested
#   ./scripts/ingest-changelab.sh --batch 3        # Only run batch 3 (URLs 50-74)
#   ./scripts/ingest-changelab.sh --resume 100     # Skip first 100 URLs

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Load Supabase URL from .env.local
if [ -f "$PROJECT_DIR/.env.local" ]; then
  export $(grep '^NEXT_PUBLIC_SUPABASE_URL=' "$PROJECT_DIR/.env.local" | xargs)
fi

SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-}"
API_KEY="${INGEST_API_KEY:-}"
INGEST_URL="${SUPABASE_URL}/functions/v1/api-ingest"
BATCH_SIZE=25
DRY_RUN=false
ONLY_BATCH=""
RESUME=0

# Parse args
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)  DRY_RUN=true; shift ;;
    --batch)    ONLY_BATCH="$2"; shift 2 ;;
    --resume)   RESUME="$2"; shift 2 ;;
    *)          echo "Unknown arg: $1"; exit 1 ;;
  esac
done

if [ -z "$SUPABASE_URL" ]; then
  echo "Error: NEXT_PUBLIC_SUPABASE_URL not set (check .env.local)"
  exit 1
fi

if [ -z "$API_KEY" ] && [ "$DRY_RUN" = "false" ]; then
  echo "Error: Set INGEST_API_KEY environment variable"
  echo "  Create an API key at your dashboard: /dashboard/api-keys"
  echo "  Then: export INGEST_API_KEY='sk_live_...'"
  exit 1
fi

# URL list — 257 resources from thechangelab.net/resourcecenter sitemap
URL_FILE="$SCRIPT_DIR/changelab-urls.txt"

if [ ! -f "$URL_FILE" ]; then
  echo "Downloading sitemap and extracting resource URLs..."
  curl -sL "https://www.thechangelab.net/sitemap.xml" | \
    grep -oP 'https://www\.thechangelab\.net/resourcecenter/[^<]+' | \
    sort -u > "$URL_FILE"
  echo "  Found $(wc -l < "$URL_FILE") URLs"
fi

TOTAL=$(wc -l < "$URL_FILE")
echo "=== The Change Lab Resource Center Ingestion ==="
echo "  Source: thechangelab.net/resourcecenter"
echo "  Total URLs: $TOTAL"
echo "  Batch size: $BATCH_SIZE"
echo "  Target: $INGEST_URL"
echo ""

# Read URLs into array
mapfile -t ALL_URLS < "$URL_FILE"

# Apply resume offset
if [ "$RESUME" -gt 0 ]; then
  ALL_URLS=("${ALL_URLS[@]:$RESUME}")
  echo "  Resuming from URL #$RESUME (${#ALL_URLS[@]} remaining)"
fi

# Calculate batches
NUM_BATCHES=$(( (${#ALL_URLS[@]} + BATCH_SIZE - 1) / BATCH_SIZE ))
echo "  Batches: $NUM_BATCHES"
echo ""

TOTAL_SUCCEEDED=0
TOTAL_SKIPPED=0
TOTAL_FAILED=0

for (( batch=0; batch<NUM_BATCHES; batch++ )); do
  BATCH_NUM=$((batch + 1))

  # If --batch flag, skip other batches
  if [ -n "$ONLY_BATCH" ] && [ "$BATCH_NUM" != "$ONLY_BATCH" ]; then
    continue
  fi

  START=$((batch * BATCH_SIZE))
  END=$((START + BATCH_SIZE))
  if [ "$END" -gt "${#ALL_URLS[@]}" ]; then
    END=${#ALL_URLS[@]}
  fi

  BATCH_URLS=("${ALL_URLS[@]:$START:$((END - START))}")

  echo "--- Batch $BATCH_NUM/$NUM_BATCHES (URLs $((START + RESUME + 1))-$((END + RESUME))) ---"

  # Build JSON payload
  JSON_URLS=""
  for url in "${BATCH_URLS[@]}"; do
    [ -n "$JSON_URLS" ] && JSON_URLS="$JSON_URLS,"
    JSON_URLS="$JSON_URLS{\"url\":\"$url\"}"
  done
  PAYLOAD="{\"urls\":[$JSON_URLS]}"

  if [ "$DRY_RUN" = "true" ]; then
    echo "  [DRY RUN] Would send ${#BATCH_URLS[@]} URLs:"
    for url in "${BATCH_URLS[@]}"; do
      echo "    $url"
    done
    echo ""
    continue
  fi

  # Call api-ingest
  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$INGEST_URL" \
    -H "Content-Type: application/json" \
    -H "X-API-Key: $API_KEY" \
    -d "$PAYLOAD" \
    --max-time 300)

  HTTP_CODE=$(echo "$RESPONSE" | tail -1)
  BODY=$(echo "$RESPONSE" | sed '$d')

  if [ "$HTTP_CODE" = "200" ]; then
    SUCCEEDED=$(echo "$BODY" | python3 -c "import sys,json;d=json.load(sys.stdin);print(d.get('succeeded',0))" 2>/dev/null || echo "?")
    SKIPPED=$(echo "$BODY" | python3 -c "import sys,json;d=json.load(sys.stdin);print(d.get('skipped',0))" 2>/dev/null || echo "?")
    FAILED=$(echo "$BODY" | python3 -c "import sys,json;d=json.load(sys.stdin);print(d.get('failed',0))" 2>/dev/null || echo "?")
    DURATION=$(echo "$BODY" | python3 -c "import sys,json;d=json.load(sys.stdin);print(d.get('duration_ms',0))" 2>/dev/null || echo "?")

    echo "  OK: $SUCCEEDED new, $SKIPPED skipped, $FAILED failed (${DURATION}ms)"

    TOTAL_SUCCEEDED=$((TOTAL_SUCCEEDED + ${SUCCEEDED:-0}))
    TOTAL_SKIPPED=$((TOTAL_SKIPPED + ${SKIPPED:-0}))
    TOTAL_FAILED=$((TOTAL_FAILED + ${FAILED:-0}))
  else
    echo "  ERROR (HTTP $HTTP_CODE): $BODY"
    TOTAL_FAILED=$((TOTAL_FAILED + ${#BATCH_URLS[@]}))
  fi

  # Pause between batches to avoid rate limits
  if [ "$batch" -lt "$((NUM_BATCHES - 1))" ]; then
    echo "  Waiting 5s before next batch..."
    sleep 5
  fi
done

echo ""
echo "=== DONE ==="
echo "  Succeeded: $TOTAL_SUCCEEDED"
echo "  Skipped:   $TOTAL_SKIPPED"
echo "  Failed:    $TOTAL_FAILED"
echo ""
echo "Next steps:"
echo "  1. Review items in /dashboard → Content Review Queue"
echo "  2. Approve items → they publish automatically with images"
