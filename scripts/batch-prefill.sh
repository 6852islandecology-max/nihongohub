#!/usr/bin/env bash
# NihongoHub /api/generate-batch ループ呼出スクリプト
# 用途: Vercel Hobby 10s 制約下で 25 combo (5 lang × 5 level) を埋める
# 使い方: bash scripts/batch-prefill.sh [items_per_combo] [per_call]
#   例: bash scripts/batch-prefill.sh 10 2  # 25 combo × 10 items = 250 問

set -e
cd "$(dirname "$0")/.."

ADMIN_KEY=$(grep "^ADMIN_KEY=" .env | cut -d'=' -f2)
if [[ -z "$ADMIN_KEY" ]]; then
  echo "ERROR: ADMIN_KEY not found in .env"
  exit 1
fi

ENDPOINT="https://nihongohub-nu.vercel.app/api/generate-batch"
ITEMS_PER_COMBO=${1:-10}
PER_CALL=${2:-2}
ITERATIONS=$((ITEMS_PER_COMBO / PER_CALL))
LANGS=(en zh es th id)
LEVELS=(N1 N2 N3 N4 N5)

TOTAL_COMBOS=$((${#LANGS[@]} * ${#LEVELS[@]}))
TOTAL_CALLS=$((TOTAL_COMBOS * ITERATIONS))
TARGET_ITEMS=$((TOTAL_COMBOS * ITEMS_PER_COMBO))

echo "==============================================="
echo " NihongoHub Batch Prefill"
echo "==============================================="
echo " items per combo: $ITEMS_PER_COMBO"
echo " per call:        $PER_CALL"
echo " iterations:      $ITERATIONS"
echo " combos:          $TOTAL_COMBOS"
echo " total calls:     $TOTAL_CALLS"
echo " target items:    $TARGET_ITEMS"
echo " endpoint:        $ENDPOINT"
echo " started:         $(date '+%Y-%m-%d %H:%M:%S')"
echo "==============================================="

CUMULATIVE_GENERATED=0
CUMULATIVE_INSERTED=0
CUMULATIVE_FAILED=0
CALL_INDEX=0

for level in "${LEVELS[@]}"; do
  for lang in "${LANGS[@]}"; do
    for ((i=1; i<=ITERATIONS; i++)); do
      CALL_INDEX=$((CALL_INDEX + 1))
      RESP=$(curl -sS -m 25 -X POST "$ENDPOINT" \
        -H "Content-Type: application/json" \
        -H "x-admin-key: $ADMIN_KEY" \
        -d "{\"levels\":[\"$level\"],\"langs\":[\"$lang\"],\"perCombo\":$PER_CALL}" 2>&1)

      GEN=$(echo "$RESP" | grep -oE '"generated":[0-9]+' | head -1 | cut -d':' -f2)
      INS=$(echo "$RESP" | grep -oE '"inserted":[0-9]+' | head -1 | cut -d':' -f2)
      FAIL=$(echo "$RESP" | grep -oE '"failed":[0-9]+' | head -1 | cut -d':' -f2)

      GEN=${GEN:-0}; INS=${INS:-0}; FAIL=${FAIL:-0}
      CUMULATIVE_GENERATED=$((CUMULATIVE_GENERATED + GEN))
      CUMULATIVE_INSERTED=$((CUMULATIVE_INSERTED + INS))
      CUMULATIVE_FAILED=$((CUMULATIVE_FAILED + FAIL))

      printf "[%4d/%d] %s/%s call#%d gen=%d ins=%d fail=%d cum_ins=%d (%s)\n" \
        "$CALL_INDEX" "$TOTAL_CALLS" "$level" "$lang" "$i" "$GEN" "$INS" "$FAIL" "$CUMULATIVE_INSERTED" "$(date '+%H:%M:%S')"

      sleep 1
    done
  done
done

echo "==============================================="
echo " DONE"
echo " total calls:     $CALL_INDEX"
echo " generated:       $CUMULATIVE_GENERATED"
echo " inserted:        $CUMULATIVE_INSERTED / $TARGET_ITEMS target"
echo " failed:          $CUMULATIVE_FAILED"
echo " finished:        $(date '+%Y-%m-%d %H:%M:%S')"
echo "==============================================="
