#!/usr/bin/env bash
# NihongoHub batch-prefill resume script
# 用途: 中断地点 (N3/th call#1 直後) から残り combo を埋める
# - リトライ 3 回付き、curl exit 6 (DNS) など一時失敗を吸収
# - set -e なし、失敗 call はスキップして次へ進む
# 使い方: bash scripts/batch-prefill-resume.sh

cd "$(dirname "$0")/.."

ADMIN_KEY=$(grep "^ADMIN_KEY=" .env | cut -d'=' -f2)
if [[ -z "$ADMIN_KEY" ]]; then
  echo "ERROR: ADMIN_KEY not found in .env"
  exit 1
fi

ENDPOINT="https://nihongohub-nu.vercel.app/api/generate-batch"
ITEMS_PER_COMBO=40
PER_CALL=2
ITERATIONS=$((ITEMS_PER_COMBO / PER_CALL))

# Resume plan: from N3/th call#2 onwards
# N3/th: completed call#1, need #2-#20 = 19 calls
# N3/id: full 20 calls
# N4: all 5 langs × 20 calls = 100 calls
# N5: all 5 langs × 20 calls = 100 calls
# Total: 239 calls

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

run_combo() {
  local level=$1
  local lang=$2
  local start_iter=$3
  local end_iter=$4
  for ((i=start_iter; i<=end_iter; i++)); do
    CALL_INDEX=$((CALL_INDEX + 1))
    RESP=$(call_with_retry "$level" "$lang")
    GEN=$(echo "$RESP" | grep -oE '"generated":[0-9]+' | head -1 | cut -d':' -f2)
    INS=$(echo "$RESP" | grep -oE '"inserted":[0-9]+' | head -1 | cut -d':' -f2)
    FAIL=$(echo "$RESP" | grep -oE '"failed":[0-9]+' | head -1 | cut -d':' -f2)
    GEN=${GEN:-0}; INS=${INS:-0}; FAIL=${FAIL:-0}
    CUMULATIVE_INSERTED=$((CUMULATIVE_INSERTED + INS))
    CUMULATIVE_FAILED=$((CUMULATIVE_FAILED + FAIL))
    printf "[%4d/%d] %s/%s call#%d gen=%d ins=%d fail=%d cum_ins=%d (%s)\n" \
      "$CALL_INDEX" "$TOTAL_CALLS" "$level" "$lang" "$i" "$GEN" "$INS" "$FAIL" "$CUMULATIVE_INSERTED" "$(date '+%H:%M:%S')"
    sleep 1
  done
}

CUMULATIVE_INSERTED=0
CUMULATIVE_FAILED=0
CALL_INDEX=0
TOTAL_CALLS=239

echo "==============================================="
echo " NihongoHub Batch Prefill RESUME"
echo "==============================================="
echo " resuming from: N3/th call#2"
echo " total calls:   $TOTAL_CALLS"
echo " target items:  $((TOTAL_CALLS * PER_CALL))"
echo " started:       $(date '+%Y-%m-%d %H:%M:%S')"
echo "==============================================="

# Resume: N3/th call#2-20 (19 calls)
run_combo "N3" "th" 2 20

# N3/id full (20 calls)
run_combo "N3" "id" 1 20

# N4 all 5 langs × 20 calls
for lang in en zh es th id; do
  run_combo "N4" "$lang" 1 20
done

# N5 all 5 langs × 20 calls
for lang in en zh es th id; do
  run_combo "N5" "$lang" 1 20
done

echo "==============================================="
echo " RESUME DONE"
echo " total calls:     $CALL_INDEX"
echo " inserted (this run): $CUMULATIVE_INSERTED"
echo " failed (this run):   $CUMULATIVE_FAILED"
echo " finished:        $(date '+%Y-%m-%d %H:%M:%S')"
echo "==============================================="
