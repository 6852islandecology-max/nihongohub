#!/usr/bin/env bash
# scripts/batch-prefill-250.sh
# Generate 250 fresh quizzes (5 langs × 5 levels × 10 items) under the new
# PR-17/PR-23 prompt format. Uses perCombo=2 × 5 calls/combo to stay under
# Vercel Hobby's 10s timeout per invocation.
# Usage: bash scripts/batch-prefill-250.sh

cd "$(dirname "$0")/.."

ADMIN_KEY=$(awk -F= '/^ADMIN_KEY=/{print $2}' .env | tr -d '\r')
if [[ -z "$ADMIN_KEY" ]]; then
  echo "ERROR: ADMIN_KEY not found in .env"
  exit 1
fi

ENDPOINT="https://nihongohub-nu.vercel.app/api/generate-batch"
PER_CALL=2
CALLS_PER_COMBO=5
TOTAL_CALLS=$((5 * 5 * CALLS_PER_COMBO))  # 125

call_with_retry() {
  local level=$1
  local lang=$2
  local max_retries=3
  local attempt=1
  local resp=""
  while [[ $attempt -le $max_retries ]]; do
    resp=$(curl -sS -m 25 -X POST "$ENDPOINT" \
      -H "Content-Type: application/json" \
      -H "x-admin-key: $ADMIN_KEY" \
      -d "{\"levels\":[\"$level\"],\"langs\":[\"$lang\"],\"perCombo\":$PER_CALL}" 2>&1)
    local rc=$?
    if [[ $rc -eq 0 ]] && echo "$resp" | grep -q '"generated"'; then
      echo "$resp"
      return 0
    fi
    echo "  (attempt $attempt/$max_retries failed rc=$rc, retrying after 5s)" >&2
    sleep 5
    attempt=$((attempt + 1))
  done
  echo '{"generated":0,"inserted":0,"failed":1,"_error":"max retries"}'
  return 1
}

CUMULATIVE_INSERTED=0
CUMULATIVE_FAILED=0
CALL_INDEX=0

echo "==============================================="
echo " NihongoHub Batch Prefill 250 (post PR-17/PR-23)"
echo "==============================================="
echo " total calls:   $TOTAL_CALLS"
echo " target items:  $((TOTAL_CALLS * PER_CALL))"
echo " started:       $(date '+%Y-%m-%d %H:%M:%S')"
echo "==============================================="

for level in N5 N4 N3 N2 N1; do
  for lang in en zh es th id; do
    for ((c=1; c<=CALLS_PER_COMBO; c++)); do
      CALL_INDEX=$((CALL_INDEX + 1))
      RESP=$(call_with_retry "$level" "$lang")
      GEN=$(echo "$RESP" | grep -oE '"generated":[0-9]+' | head -1 | cut -d':' -f2)
      INS=$(echo "$RESP" | grep -oE '"inserted":[0-9]+' | head -1 | cut -d':' -f2)
      FAIL=$(echo "$RESP" | grep -oE '"failed":[0-9]+' | head -1 | cut -d':' -f2)
      GEN=${GEN:-0}; INS=${INS:-0}; FAIL=${FAIL:-0}
      CUMULATIVE_INSERTED=$((CUMULATIVE_INSERTED + INS))
      CUMULATIVE_FAILED=$((CUMULATIVE_FAILED + FAIL))
      printf "[%3d/%d] %s/%s call#%d gen=%d ins=%d fail=%d cum_ins=%d (%s)\n" \
        "$CALL_INDEX" "$TOTAL_CALLS" "$level" "$lang" "$c" "$GEN" "$INS" "$FAIL" "$CUMULATIVE_INSERTED" "$(date '+%H:%M:%S')"
      sleep 1
    done
  done
done

echo "==============================================="
echo " DONE"
echo " total calls:        $CALL_INDEX"
echo " inserted (this run): $CUMULATIVE_INSERTED"
echo " failed (this run):   $CUMULATIVE_FAILED"
echo " finished:           $(date '+%Y-%m-%d %H:%M:%S')"
echo "==============================================="
