#!/usr/bin/env bash
# PR-25 Japan Life Quiz Mode — シード生成 batch script
# 仕様書: specs/PR-25-japan-life-quiz-v1.md §4.1
# 実行日: 2026-05-17 (Phase C1 着手日)
# 前提: api/generate-batch.js の life mode 対応実装が完了していること
#       (5/17 実装後にこの script が動く)
#
# 使用方法:
#   ./scripts/seed-life-quiz.sh                       # 全 1,250 問 (5 cat × 5 lang × 50)
#   ./scripts/seed-life-quiz.sh food en               # 単一 cat × 単一 lang (50 問のみ、テスト用)
#   PER_COMBO=10 ./scripts/seed-life-quiz.sh          # 全 cat/lang × 10 問 = 250 問 (smoke test)
#
# 想定コスト: 全量 1,250 問 = ~$2.50, 所要 25-30 分

set -euo pipefail

# ---- Config ----
ENDPOINT="${ENDPOINT:-https://nihongohub-nu.vercel.app/api/generate-batch}"
PER_COMBO="${PER_COMBO:-50}"
LANGS_ALL=(en zh es th id)
CATS_ALL=(food etiquette rules history_geo popculture)

# ---- ADMIN_KEY 取得 ----
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_ROOT/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: .env not found at $ENV_FILE" >&2
  exit 1
fi

ADMIN_KEY=$(grep "^ADMIN_KEY=" "$ENV_FILE" | cut -d'=' -f2- | tr -d '"' | tr -d "'" | tr -d '\r')
if [ -z "$ADMIN_KEY" ]; then
  echo "ERROR: ADMIN_KEY not set in .env" >&2
  exit 1
fi

# ---- 引数解析 ----
TARGET_CAT="${1:-}"
TARGET_LANG="${2:-}"

if [ -n "$TARGET_CAT" ] && [ -n "$TARGET_LANG" ]; then
  CATS=("$TARGET_CAT")
  LANGS=("$TARGET_LANG")
  echo "Mode: single (cat=$TARGET_CAT, lang=$TARGET_LANG, perCombo=$PER_COMBO)"
else
  CATS=("${CATS_ALL[@]}")
  LANGS=("${LANGS_ALL[@]}")
  TOTAL=$((${#CATS[@]} * ${#LANGS[@]} * PER_COMBO))
  echo "Mode: full batch (5 cats × 5 langs × $PER_COMBO = $TOTAL quizzes)"
  ESTIMATED_USD=$(awk "BEGIN{printf \"%.2f\", $TOTAL * 0.002}")
  echo "Estimated cost: ~\$$ESTIMATED_USD (Haiku 4.5)"
fi

# ---- 確認プロンプト ----
echo ""
echo "Endpoint: $ENDPOINT"
read -p "Proceed? [y/N] " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 0
fi

# ---- 実行 ----
START_TS=$(date +%s)
SUCCESS=0
FAILED=0
LOG_FILE="$PROJECT_ROOT/logs/seed-life-quiz-$(date +%Y%m%d-%H%M%S).log"
mkdir -p "$PROJECT_ROOT/logs"

for cat in "${CATS[@]}"; do
  for lang in "${LANGS[@]}"; do
    echo ""
    echo "=== Generating: cat=$cat, lang=$lang, perCombo=$PER_COMBO ==="
    PAYLOAD=$(printf '{"mode":"life","langs":["%s"],"lifeCategories":["%s"],"perCombo":%d}' "$lang" "$cat" "$PER_COMBO")
    RESP=$(curl -sS -m 600 -X POST "$ENDPOINT" \
      -H "Content-Type: application/json" \
      -H "x-admin-key: $ADMIN_KEY" \
      -d "$PAYLOAD" || echo '{"error":"curl-failed"}')
    echo "$RESP" | tee -a "$LOG_FILE"
    if echo "$RESP" | grep -q '"inserted":[1-9]'; then
      SUCCESS=$((SUCCESS + 1))
    else
      FAILED=$((FAILED + 1))
    fi
    sleep 1
  done
done

END_TS=$(date +%s)
ELAPSED=$((END_TS - START_TS))

echo ""
echo "=== Summary ==="
echo "Success combos: $SUCCESS"
echo "Failed combos: $FAILED"
echo "Elapsed: ${ELAPSED}s ($(($ELAPSED / 60)) min)"
echo "Log: $LOG_FILE"
echo ""
echo "Next step: Verify with"
echo "  node scripts/smoke-test-life-quiz-coverage.mjs"
