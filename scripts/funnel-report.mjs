// scripts/funnel-report.mjs — daily funnel report (Upstash counters + Supabase actuals).
// Usage: node scripts/funnel-report.mjs [days]    (default 7; dates are UTC)
//
// Counters (Upstash, written by lib/funnel-server.js):
//   pv_*            page views from the client beacon, with first-touch source
//   trial_start     api/trial-start.js (server-side, by user id)
//   checkout_*      api/upgrade-checkout.js (server-side, by user id + source)
//   paid_* / churn_pro  api/stripe-webhook.js (server-side = money truth from Stripe)
// Actuals (Supabase trial_events): trial_started / upgraded_pro / upgraded_lifetime —
// cross-check that Redis counters and the DB agree.
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
try {
  for (const line of readFileSync(resolve(root, ".env"), "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
} catch { /* .env optional when env vars are already set */ }

const R_URL = process.env.UPSTASH_REDIS_REST_URL;
const R_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const S_URL = process.env.SUPABASE_URL;
const S_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!R_URL || !R_TOKEN) {
  console.error("UPSTASH_REDIS_REST_URL / _TOKEN not set (check .env)");
  process.exit(1);
}

const days = Math.max(1, Math.min(60, Number(process.argv[2]) || 7));
const dates = [];
for (let i = days - 1; i >= 0; i--) {
  dates.push(new Date(Date.now() - i * 86400000).toISOString().slice(0, 10));
}

async function redis(cmds) {
  const r = await fetch(`${R_URL}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${R_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmds),
  });
  if (!r.ok) throw new Error(`upstash ${r.status}`);
  return (await r.json()).map((x) => x.result);
}

function toObj(flat) {
  const o = {};
  for (let i = 0; flat && i < flat.length; i += 2) o[flat[i]] = Number(flat[i + 1]);
  return o;
}

const UNIQ_STAGES = ["pv_lp", "pv_blog", "pv_onboarding", "pv_quiz"];
const rows = [];
for (const day of dates) {
  const cmds = [["HGETALL", `nh:f:${day}`], ["HGETALL", `nh:fsrc:${day}`], ["HGETALL", `nh:fnav:${day}`]];
  for (const s of UNIQ_STAGES) cmds.push(["PFCOUNT", `nh:fu:${day}:${s}`]);
  const out = await redis(cmds);
  const uniq = {};
  UNIQ_STAGES.forEach((s, i) => (uniq[s] = Number(out[3 + i]) || 0));
  rows.push({ day, counts: toObj(out[0]), bySrc: toObj(out[1]), nav: toObj(out[2]), uniq });
}

// Supabase actuals
const actuals = {};
const signupPaths = [];
if (S_URL && S_KEY) {
  try {
    const since = `${dates[0]}T00:00:00Z`;
    const r = await fetch(
      `${S_URL}/rest/v1/trial_events?select=event_type,created_at,metadata&created_at=gte.${since}&limit=10000`,
      { headers: { apikey: S_KEY, Authorization: `Bearer ${S_KEY}` } },
    );
    if (r.ok) {
      for (const e of await r.json()) {
        const day = String(e.created_at).slice(0, 10);
        (actuals[day] = actuals[day] || {})[e.event_type] =
          (actuals[day][e.event_type] || 0) + 1;
        // 2026-08-23: 登録の経路。src/land/page は api/trial-start.js が入れる。
        // 2026-08-23 より前の行にはこれらが無いので、その場合は行ごと出さない。
        if (e.event_type === "trial_started" && e.metadata && e.metadata.land) {
          signupPaths.push({
            day,
            src: e.metadata.src || "?",
            land: e.metadata.land,
            page: e.metadata.page || "?",
          });
        }
      }
    }
  } catch { /* report still useful without DB cross-check */ }
}

const COLS = [
  ["lp", (r) => r.counts.pv_lp],
  ["lp_u", (r) => r.uniq.pv_lp],
  ["blog", (r) => r.counts.pv_blog],
  ["onbrd", (r) => r.counts.pv_onboarding],
  ["quiz", (r) => r.counts.pv_quiz],
  ["trial", (r) => r.counts.trial_start],
  ["chkout", (r) => (r.counts.checkout_pro || 0) + (r.counts.checkout_lifetime || 0)],
  ["paid", (r) => (r.counts.paid_pro || 0) + (r.counts.paid_lifetime || 0)],
  ["upOK", (r) => r.counts.upgrade_success],
  ["db:trial", (r) => (actuals[r.day] || {}).trial_started],
  ["db:paid", (r) => ((actuals[r.day] || {}).upgraded_pro || 0) + ((actuals[r.day] || {}).upgraded_lifetime || 0)],
];

const pad = (v, w) => String(v ?? 0).padStart(w);
console.log(`\nNihongoHub funnel — last ${days} days (UTC)\n`);
console.log("date       " + COLS.map(([n]) => n.padStart(8)).join(""));
for (const r of rows) {
  console.log(r.day + " " + COLS.map(([, f]) => pad(f(r), 8)).join(""));
}

// window totals + CVR
const tot = {};
for (const r of rows) for (const [k, v] of Object.entries(r.counts)) tot[k] = (tot[k] || 0) + v;
const lp = tot.pv_lp || 0;
const trial = tot.trial_start || 0;
const chk = (tot.checkout_pro || 0) + (tot.checkout_lifetime || 0);
const paid = (tot.paid_pro || 0) + (tot.paid_lifetime || 0);
const pct = (a, b) => (b > 0 ? ((100 * a) / b).toFixed(1) + "%" : "-");
console.log(`\nwindow: LP ${lp} → trial ${trial} (${pct(trial, lp)}) → checkout ${chk} (${pct(chk, trial)}) → paid ${paid} (${pct(paid, chk)})`);
if (tot.churn_pro) console.log(`churn_pro: ${tot.churn_pro}`);

// per-source totals (all events with a source dimension)
const srcTot = {};
for (const r of rows) {
  for (const [k, v] of Object.entries(r.bySrc)) {
    const [, s] = k.split("|");
    srcTot[s] = (srcTot[s] || 0) + v;
  }
}
const top = Object.entries(srcTot).sort((a, b) => b[1] - a[1]);
if (top.length) {
  console.log("\nby first-touch source (all events): " + top.map(([s, v]) => `${s}=${v}`).join("  "));
}

// page views by type (all pv_* events this window) — "which pages get used"
// pv_blog__<slug> (2026-08-23-) is the per-article denominator and is reported in its own
// section below; the server writes the aggregate pv_blog for the same hit, so counting the
// slug rows here as well would double them.
const pageTot = {};
const pvByPage = {};
for (const r of rows) for (const [k, v] of Object.entries(r.counts)) {
  if (!k.startsWith("pv_")) continue;
  const cut = k.indexOf("__");
  if (cut >= 0) { const p = k.slice(cut + 2); pvByPage[p] = (pvByPage[p] || 0) + v; continue; }
  pageTot[k.slice(3)] = (pageTot[k.slice(3)] || 0) + v;
}
const pages = Object.entries(pageTot).sort((a, b) => b[1] - a[1]);
if (pages.length) console.log("\npage views by type: " + pages.map(([s, v]) => `${s}=${v}`).join("  "));

// in-site transitions (nh:fnav) — "does the site get walked around" (回遊)
const navTot = {};
for (const r of rows) for (const [k, v] of Object.entries(r.nav || {})) navTot[k] = (navTot[k] || 0) + v;
const navs = Object.entries(navTot).sort((a, b) => b[1] - a[1]);
if (navs.length) {
  console.log("\nin-site transitions (from>to, top 20): " + navs.slice(0, 20).map(([s, v]) => `${s}=${v}`).join("  "));
  const trans = navs.reduce((a, [, v]) => a + v, 0);
  const pv = Object.values(pageTot).reduce((a, v) => a + v, 0);
  if (pv > 0) console.log(`transition rate: ${trans} transitions / ${pv} page views = ${((100 * trans) / pv).toFixed(1)}% of views came from another page on the site`);
}

// affiliate clicks (aff_* events this window). Fields are aff_<network> (legacy)
// or aff_<network>__<page-slug> (per-page since 2026-08-12); the first "__" splits
// network from page. Show network totals plus a per-page breakdown per network.
const affTot = {};
const affByPage = {};
for (const r of rows) {
  for (const [k, v] of Object.entries(r.counts)) {
    if (!k.startsWith("aff_")) continue;
    const rest = k.slice(4);
    const cut = rest.indexOf("__");
    const net = cut >= 0 ? rest.slice(0, cut) : rest;
    affTot[net] = (affTot[net] || 0) + v;
    if (cut >= 0) {
      const page = rest.slice(cut + 2);
      (affByPage[net] = affByPage[net] || {})[page] = (affByPage[net][page] || 0) + v;
    }
  }
}
const affs = Object.entries(affTot).sort((a, b) => b[1] - a[1]);
console.log("affiliate clicks: " + (affs.length ? affs.map(([s, v]) => `${s}=${v}`).join("  ") : "0"));
for (const [net] of affs) {
  const pages = Object.entries(affByPage[net] || {}).sort((a, b) => b[1] - a[1]);
  if (pages.length) console.log(`  ${net} by page: ` + pages.map(([s, v]) => `${s}=${v}`).join("  "));
}

// Similar-places clicks (sim_click__<page-slug>, 2026-08-23) — 11月判定の指標④。
// CTR の分母はそのページの pv_blog なので、ここではクリック数のみをページ別に出す。
const simByPage = {};
for (const r of rows) {
  for (const [k, v] of Object.entries(r.counts)) {
    if (!k.startsWith("sim_click__")) continue;
    const page = k.slice(11);
    simByPage[page] = (simByPage[page] || 0) + v;
  }
}
const sims = Object.entries(simByPage).sort((a, b) => b[1] - a[1]);
if (sims.length) {
  console.log("similar-places clicks: " + sims.reduce((a, [, v]) => a + v, 0) +
    "  by page: " + sims.map(([s, v]) => `${s}=${v}`).join("  "));
}

// 記事別の分母と分子 (2026-08-23-)。これが無い間は「押されない記事」と「読まれていない記事」が
// 区別できなかった。クリック率は分母が小さいうちは値として使わないこと (目安は 100 閲覧)。
const affByPageAll = {};
for (const net of Object.keys(affByPage)) {
  for (const [p, v] of Object.entries(affByPage[net])) affByPageAll[p] = (affByPageAll[p] || 0) + v;
}
const artPages = [...new Set([...Object.keys(pvByPage), ...Object.keys(affByPageAll), ...Object.keys(simByPage)])];
if (artPages.length) {
  const rowsArt = artPages.map((p) => {
    const views = pvByPage[p] || 0, aff = affByPageAll[p] || 0, sim = simByPage[p] || 0;
    return { p, views, aff, sim, ctr: views ? (100 * aff) / views : null };
  }).sort((a, b) => b.views - a.views || b.aff - a.aff);
  console.log("\nper article (views vs clicks) — pv_blog__<slug> は 2026-08-23 から記録開始:");
  console.log("  " + "article".padEnd(42) + "views".padStart(7) + "aff".padStart(6) + "sim".padStart(6) + "aff/view".padStart(10));
  for (const r of rowsArt.slice(0, 25)) {
    console.log("  " + r.p.slice(0, 42).padEnd(42) + String(r.views).padStart(7) + String(r.aff).padStart(6) +
      String(r.sim).padStart(6) + (r.ctr === null ? "-" : r.ctr.toFixed(1) + "%").padStart(10));
  }
  const noView = rowsArt.filter((r) => !r.views && (r.aff || r.sim)).length;
  if (noView) console.log(`  (${noView} 件はクリックのみで閲覧数が無い = 計測開始前のクリック)`);
}

// signup attribution — one line per trial, plus a landing-page tally.
// 2026-08-23 以降の登録だけが対象(それ以前は経路が記録されていない)。
if (signupPaths.length) {
  console.log("\nsignups by path (trial_started, since 2026-08-23):");
  for (const s of signupPaths) {
    console.log(`  ${s.day}  src=${s.src}  landed=${s.land}  signed-up-on=${s.page}`);
  }
  const landTot = {};
  for (const s of signupPaths) landTot[s.land] = (landTot[s.land] || 0) + 1;
  console.log("  by landing page: " +
    Object.entries(landTot).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}=${v}`).join("  "));
} else {
  console.log("\nsignups by path: none recorded in this window");
}

console.log("");
