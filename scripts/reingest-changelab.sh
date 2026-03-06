#!/usr/bin/env bash
# Re-ingest assets from Change Lab directory through classify-content-v2 with full body extraction.
# The Change Lab is a directory — content is attributed to original sources, not The Change Lab.
# Calls the edge function directly using the service role key.
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Load env
if [ -f "$PROJECT_DIR/.env.local" ]; then
  export $(grep '^NEXT_PUBLIC_SUPABASE_URL=' "$PROJECT_DIR/.env.local" | xargs)
  export $(grep '^SUPABASE_SECRET_KEY=' "$PROJECT_DIR/.env.local" | xargs)
fi

SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL}"
SECRET_KEY="${SUPABASE_SECRET_KEY}"
CLASSIFY_URL="${SUPABASE_URL}/functions/v1/classify-content-v2"
URL_FILE="$SCRIPT_DIR/changelab-urls.txt"
LOG_FILE="$SCRIPT_DIR/reingest-changelab.log"

TOTAL=$(wc -l < "$URL_FILE")
echo "=== Change Lab Directory Re-Ingestion (Full Body) ===" | tee "$LOG_FILE"
echo "  Total URLs: $TOTAL" | tee -a "$LOG_FILE"
echo "  Started: $(date)" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

SUCCEEDED=0
FAILED=0
COUNT=0

while IFS= read -r url; do
  COUNT=$((COUNT + 1))
  SLUG="${url##*/}"
  printf "[%d/%d] %s... " "$COUNT" "$TOTAL" "$SLUG" | tee -a "$LOG_FILE"

  RESPONSE=$(curl -s -w "\n%{http_code}" --max-time 60 -X POST "$CLASSIFY_URL" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $SECRET_KEY" \
    -d "{\"url\":\"$url\"}")

  HTTP_CODE=$(echo "$RESPONSE" | tail -1)
  BODY=$(echo "$RESPONSE" | sed '$d')

  if [ "$HTTP_CODE" = "200" ]; then
    INBOX_ID=$(echo "$BODY" | python3 -c "import sys,json;print(json.load(sys.stdin).get('inbox_id','?')[:8])" 2>/dev/null || echo "?")
    CONF=$(echo "$BODY" | python3 -c "import sys,json;c=json.load(sys.stdin).get('classification',{});print(round(c.get('confidence',0)*100))" 2>/dev/null || echo "?")
    HAS_BODY=$(echo "$BODY" | python3 -c "import sys,json;c=json.load(sys.stdin).get('classification',{});print('body' if c.get('body_6th_grade') else 'no-body')" 2>/dev/null || echo "?")
    echo "OK [$INBOX_ID] ${CONF}% ${HAS_BODY}" | tee -a "$LOG_FILE"
    SUCCEEDED=$((SUCCEEDED + 1))
  else
    echo "FAIL (HTTP $HTTP_CODE)" | tee -a "$LOG_FILE"
    FAILED=$((FAILED + 1))
  fi

  # Rate limit: 2 seconds between calls
  sleep 2
done < "$URL_FILE"

echo "" | tee -a "$LOG_FILE"
echo "=== DONE ===" | tee -a "$LOG_FILE"
echo "  Succeeded: $SUCCEEDED" | tee -a "$LOG_FILE"
echo "  Failed:    $FAILED" | tee -a "$LOG_FILE"
echo "  Finished:  $(date)" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "Next: Review items at /dashboard/review, then auto-approve or publish." | tee -a "$LOG_FILE"
