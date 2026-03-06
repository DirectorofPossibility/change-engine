#!/usr/bin/env bash
#
# backfill-attribution.sh — Re-enrich Change Lab directory imports with proper attribution.
#
# Calls POST /api/enrich with batches of inbox_ids so the updated prompt
# extracts source_org_name and attributes content to original creators.
#
# Usage:
#   export INGEST_API_KEY="sk_live_..."
#   ./scripts/backfill-attribution.sh              # Process all items
#   ./scripts/backfill-attribution.sh --dry-run    # Show count only

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

if [ -f "$PROJECT_DIR/.env.local" ]; then
  export $(grep '^NEXT_PUBLIC_SUPABASE_URL=' "$PROJECT_DIR/.env.local" | xargs)
  export $(grep '^SUPABASE_SECRET_KEY=' "$PROJECT_DIR/.env.local" | xargs)
fi

SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-}"
SECRET_KEY="${SUPABASE_SECRET_KEY:-}"
API_KEY="${INGEST_API_KEY:-}"
BATCH_SIZE=5
DRY_RUN=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)  DRY_RUN=true; shift ;;
    *)          echo "Unknown arg: $1"; exit 1 ;;
  esac
done

# Use local dev server if running, otherwise production
ENRICH_URL="https://www.changeengine.us/api/enrich"
if curl -s --max-time 2 "http://localhost:3000" > /dev/null 2>&1; then
  ENRICH_URL="http://localhost:3000/api/enrich"
  echo "Using local dev server"
fi

echo "=== Attribution Backfill ==="
echo "  Target: $ENRICH_URL"
echo ""

# Get all inbox IDs needing re-attribution
mapfile -t ALL_IDS < <(curl -s \
  "${SUPABASE_URL}/rest/v1/content_review_queue?select=inbox_id&ai_classification->>_version=eq.v2-needs-reattribution&limit=500" \
  -H "apikey: ${SECRET_KEY}" \
  -H "Authorization: Bearer ${SECRET_KEY}" | \
  python3 -c "import sys,json; [print(r['inbox_id']) for r in json.load(sys.stdin)]")

TOTAL=${#ALL_IDS[@]}
echo "  Items to re-enrich: $TOTAL"

if [ "$DRY_RUN" = "true" ] || [ "$TOTAL" -eq 0 ]; then
  [ "$TOTAL" -eq 0 ] && echo "Nothing to do."
  exit 0
fi

NUM_BATCHES=$(( (TOTAL + BATCH_SIZE - 1) / BATCH_SIZE ))
echo "  Batches: $NUM_BATCHES (${BATCH_SIZE}/batch)"
echo ""

TOTAL_OK=0
TOTAL_FAIL=0

for (( b=0; b<NUM_BATCHES; b++ )); do
  START=$((b * BATCH_SIZE))
  BATCH=("${ALL_IDS[@]:$START:$BATCH_SIZE}")

  # Build JSON array
  JSON_IDS=$(printf '%s\n' "${BATCH[@]}" | python3 -c "import sys,json; print(json.dumps([l.strip() for l in sys.stdin]))")

  echo "--- Batch $((b+1))/$NUM_BATCHES (IDs $((START+1))-$((START+${#BATCH[@]}))) ---"

  RESPONSE=$(curl -s -w "\n%{http_code}" --max-time 300 -X POST "$ENRICH_URL" \
    -H "Content-Type: application/json" \
    -H "X-API-Key: ${API_KEY}" \
    -d "{\"inbox_ids\": $JSON_IDS}")

  HTTP_CODE=$(echo "$RESPONSE" | tail -1)
  BODY=$(echo "$RESPONSE" | sed '$d')

  if [ "$HTTP_CODE" = "200" ]; then
    OK=$(echo "$BODY" | python3 -c "import sys,json;print(json.load(sys.stdin).get('succeeded',0))" 2>/dev/null || echo 0)
    FAIL=$(echo "$BODY" | python3 -c "import sys,json;print(json.load(sys.stdin).get('failed',0))" 2>/dev/null || echo 0)
    echo "  OK: $OK succeeded, $FAIL failed"
    TOTAL_OK=$((TOTAL_OK + OK))
    TOTAL_FAIL=$((TOTAL_FAIL + FAIL))
  else
    echo "  ERROR (HTTP $HTTP_CODE): $(echo "$BODY" | head -c 200)"
    TOTAL_FAIL=$((TOTAL_FAIL + ${#BATCH[@]}))
  fi

  # Wait between batches
  if [ "$b" -lt "$((NUM_BATCHES - 1))" ]; then
    echo "  Waiting 10s..."
    sleep 10
  fi
done

echo ""
echo "=== DONE ==="
echo "  Succeeded: $TOTAL_OK"
echo "  Failed:    $TOTAL_FAIL"
