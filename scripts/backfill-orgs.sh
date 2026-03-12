#!/bin/bash
#
# Overnight org backfill — crawls all uncrawled organizations.
#
# Calls the deployed /api/ingest-org endpoint for each org,
# with a 10-second delay between requests to be respectful.
#
# Usage:
#   chmod +x scripts/backfill-orgs.sh
#   nohup ./scripts/backfill-orgs.sh > /tmp/org-backfill.log 2>&1 &
#
# Monitor:
#   tail -f /tmp/org-backfill.log
#

API_URL="https://www.changeengine.us/api/ingest-org"
CRON_SECRET="83836a0cbf4a443625dd4261a6fd0d3318e5494ae1df73b06955d63e66090eac"
SUPABASE_URL="https://xesojwzcnjqtpuossmuv.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhlc29qd3pjbmpxdHB1b3NzbXV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5ODEzODUsImV4cCI6MjA4NzU1NzM4NX0.9B3_TX3qBG0SXI9UifYH7sJQMmiHjc_YRbaYBAk7l0w"

LOGFILE="/tmp/org-backfill.log"
DELAY=10  # seconds between orgs

echo "=============================================="
echo "  Org Backfill — $(date)"
echo "=============================================="

# Fetch all uncrawled orgs from Supabase
echo "Fetching uncrawled organizations..."
ORGS=$(curl -s \
  "${SUPABASE_URL}/rest/v1/organizations?data_source=not.eq.org_crawl&website=not.is.null&select=org_id,org_name,website&order=org_name.asc&limit=600" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}")

# Count orgs
TOTAL=$(echo "$ORGS" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo 0)
echo "Found ${TOTAL} organizations to crawl"
echo ""

if [ "$TOTAL" -eq 0 ]; then
  echo "No orgs to process. Exiting."
  exit 0
fi

# Process each org
IDX=0
SUCCESS=0
FAILED=0
SKIPPED=0

echo "$ORGS" | python3 -c "
import sys, json
orgs = json.load(sys.stdin)
for o in orgs:
    w = o.get('website', '')
    n = o.get('org_name', '')
    # Skip Amazon, generic, or non-org sites
    if not w or 'amazon.com' in w.lower():
        continue
    print(f\"{w}\t{n}\")
" | while IFS=$'\t' read -r WEBSITE ORG_NAME; do
  IDX=$((IDX + 1))

  echo "[$IDX/$TOTAL] Crawling: $ORG_NAME"
  echo "  URL: $WEBSITE"

  # Call the ingest-org API
  RESPONSE=$(curl -s -w "\n%{http_code}" --max-time 120 \
    -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${CRON_SECRET}" \
    -d "{\"url\": \"$WEBSITE\", \"org_name\": \"$ORG_NAME\", \"max_pages\": 20}")

  HTTP_CODE=$(echo "$RESPONSE" | tail -1)
  BODY=$(echo "$RESPONSE" | sed '$d')

  if [ "$HTTP_CODE" = "200" ]; then
    ENTITIES=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('entities_created', 0))" 2>/dev/null || echo "?")
    PAGES=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('pages_discovered', 0))" 2>/dev/null || echo "?")
    echo "  ✓ Success — ${PAGES} pages found, ${ENTITIES} entities created"
    SUCCESS=$((SUCCESS + 1))
  elif [ "$HTTP_CODE" = "502" ]; then
    echo "  ⊘ Skipped — site unreachable"
    SKIPPED=$((SKIPPED + 1))
  else
    echo "  ✗ Failed (HTTP $HTTP_CODE)"
    FAILED=$((FAILED + 1))
  fi

  echo "  Waiting ${DELAY}s..."
  sleep $DELAY
done

echo ""
echo "=============================================="
echo "  Backfill Complete — $(date)"
echo "  Success: $SUCCESS | Failed: $FAILED | Skipped: $SKIPPED"
echo "=============================================="
