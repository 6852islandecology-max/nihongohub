// [server] リーダーボードの集計期間。
//
// 2026-07-24 新設。api/rank.js:6-9 と api/rank-submit.js:6-9 に同じ 4 行が重複していた。
// 片方だけ直すと、投稿した期間と集計する期間がずれて誰もランキングに載らなくなる。

// UTC 基準の "YYYY-MM"。leaderboard.period 列の形式。
export function currentPeriod() {
  const d = new Date();
  return d.getUTCFullYear() + "-" + String(d.getUTCMonth() + 1).padStart(2, "0");
}
