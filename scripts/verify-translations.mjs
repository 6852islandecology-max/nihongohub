/**
 * Translation quality smoke-test: scan blog/translations/*.json for:
 *  - Romaji proper nouns that survived correctly (Tokyo, Kyoto, Osaka, Nebuta, etc.)
 *  - Empty/missing fields per slug
 *  - Anomalously short translations (likely truncation)
 *
 * Output: console report + writes blog/translations/_quality.json with per-slug findings.
 * Run: node scripts/verify-translations.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { GUIDES } from "../blog/guides-data.js";

const TRANS_DIR = new URL("../blog/translations/", import.meta.url);
const LANGS = ["zh", "es", "th", "id"];
const PROPER_NOUNS_FREQ = [
  "Tokyo", "Kyoto", "Osaka", "Hokkaido", "Okinawa", "Nara", "Hiroshima",
  "Nebuta", "Matsuri", "Hirosaki", "Onsen", "Shinkansen", "JR", "ICOCA", "Suica",
  "Fushimi Inari", "Dōtonbori", "Sannai-Maruyama", "Towada", "Tsugaru",
  "UNESCO", "Jōmon", "Edo", "Meiji", "Heisei", "Reiwa"
];

function readLangJson(lang){
  const p = new URL(`${lang}.json`, TRANS_DIR);
  if (!existsSync(p)) return {};
  return JSON.parse(readFileSync(p, "utf8"));
}

const REQUIRED_FIELDS = ["lede", "intro", "eat", "getting", "when"];
// Per-language MIN_LENGTH: CJK languages encode more meaning per char so thresholds are roughly halved.
const MIN_LENGTH_BY_LANG = {
  en: { lede: 30, intro: 80, eat: 12, getting: 12, when: 8 },
  es: { lede: 30, intro: 80, eat: 12, getting: 12, when: 8 },
  id: { lede: 30, intro: 80, eat: 12, getting: 12, when: 8 },
  th: { lede: 25, intro: 70, eat: 10, getting: 10, when: 7 },
  zh: { lede: 12, intro: 35, eat: 5,  getting: 5,  when: 4 }
};

const report = { generatedAt: new Date().toISOString(), findings: {} };

for (const lang of LANGS) {
  const data = readLangJson(lang);
  const minLen = MIN_LENGTH_BY_LANG[lang] || MIN_LENGTH_BY_LANG.en;
  report.findings[lang] = { totalSlugs: Object.keys(data).length, issues: [] };
  for (const g of GUIDES) {
    const tr = data[g.slug];
    if (!tr) {
      report.findings[lang].issues.push({ slug: g.slug, issue: "missing" });
      continue;
    }
    // Field completeness (CJK-aware thresholds)
    for (const f of REQUIRED_FIELDS) {
      if (g[f] && (!tr[f] || String(tr[f]).trim().length < minLen[f])) {
        report.findings[lang].issues.push({ slug: g.slug, issue: `field-too-short:${f}`, len: tr[f] ? tr[f].length : 0 });
      }
    }
    // Proper-noun preservation in lede/intro (sample)
    const combined = ((tr.lede||"") + " " + (tr.intro||"")).toLowerCase();
    const enCombined = ((g.lede||"") + " " + (g.intro||"")).toLowerCase();
    const droppedNouns = PROPER_NOUNS_FREQ.filter(n => enCombined.includes(n.toLowerCase()) && !combined.includes(n.toLowerCase().split(" ")[0]));
    if (droppedNouns.length) {
      report.findings[lang].issues.push({ slug: g.slug, issue: "proper-noun-missing", dropped: droppedNouns });
    }
  }
  const counts = report.findings[lang].issues.reduce((acc, i) => { acc[i.issue.split(":")[0]] = (acc[i.issue.split(":")[0]]||0) + 1; return acc; }, {});
  console.log(`[${lang}] ${report.findings[lang].totalSlugs} slugs · ${report.findings[lang].issues.length} issues`, counts);
}

writeFileSync(new URL("_quality.json", TRANS_DIR), JSON.stringify(report, null, 2));
console.log(`\n✓ Report saved → blog/translations/_quality.json`);
