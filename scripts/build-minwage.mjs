/**
 * Build the "Japan minimum wage by prefecture" article — multilingual.
 * Data-driven from data/min-wage-<FY>.json (official MHLW figures) so the 47-row
 * table is never hand-typed (no transcription/fabrication risk). Re-run yearly:
 * add the new JSON, point DATA_FILE at it, refresh the prose in T. Output per language:
 *   en -> blog/minimum-wage-japan-2025.html            (slug kept for URL stability)
 *   <lang> -> blog/<lang>/minimum-wage-japan-2025.html (id, es, th)
 *
 * Languages chosen by competition density (competitive-analysis-2026-06-15.md):
 * en (gap for all-47 ranked) + id (spearhead) + es/th (thin). zh omitted (saturated).
 *
 * 2026-09-23: FY2026 (令和8年度) 答申額に差し替え (data/min-wage-2026.json)。ページ上で読者に
 * 約束していた「確定したら表を差し替える」の履行。旧 FY2025 は data/min-wage-2025.json に残す。
 * 同時に、手作業で HTML に足されていたブロック (発効前後の注意書き / Japan Living Fit CTA /
 * BlogPosting JSON-LD) をこのスクリプトに取り込んだ。それまでは再実行すると消える状態だった。
 *
 * Run: node scripts/build-minwage.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { pathToFileURL, fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const ROOT = new URL("../", import.meta.url);
const DATA_FILE = "data/min-wage-2026.json";
const DATA = JSON.parse(readFileSync(new URL(DATA_FILE, ROOT), "utf8"));
const SLUG = "minimum-wage-japan-2025";
const SITE = "https://www.nihongo-hub.com";
const LANGS = ["en", "id", "es", "th"];
const LANG_LABEL = { en: "EN", id: "ID", es: "ES", th: "TH" };
const UPDATED = "2026-09-23"; // date the data/prose were last refreshed (shown in the footer, dateModified)
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const yen = (n) => "¥" + n.toLocaleString("en-US"); // comma grouping = international yen convention

// Official NihongoHub entity profiles — keep in sync with scripts/inject-evidence.mjs SAMEAS.
const SAMEAS = [
  "https://www.nihongo-hub.com",
  "https://nihongohub-nu.vercel.app",
  "https://ikimonohakasefamily.substack.com",
  "https://www.youtube.com/@JepangMenarik",
  "https://www.tiktok.com/@ikimonofamilyhakase",
  "https://www.instagram.com/familyikimono",
  "https://www.threads.net/@familyikimono",
  "https://www.pinterest.com/ikimonofamily",
];

const REGION = {
  en: { hokkaido:"Hokkaidō", tohoku:"Tōhoku", kanto:"Kantō", chubu:"Chūbu", kansai:"Kansai", chugoku:"Chūgoku", shikoku:"Shikoku", kyushu:"Kyūshū", okinawa:"Okinawa" },
  id: { hokkaido:"Hokkaido", tohoku:"Tohoku", kanto:"Kanto", chubu:"Chubu", kansai:"Kansai", chugoku:"Chugoku", shikoku:"Shikoku", kyushu:"Kyushu", okinawa:"Okinawa" },
  es: { hokkaido:"Hokkaido", tohoku:"Tohoku", kanto:"Kanto", chubu:"Chubu", kansai:"Kansai", chugoku:"Chugoku", shikoku:"Shikoku", kyushu:"Kyushu", okinawa:"Okinawa" },
  th: { hokkaido:"Hokkaido", tohoku:"Tohoku", kanto:"Kanto", chubu:"Chubu", kansai:"Kansai", chugoku:"Chugoku", shikoku:"Shikoku", kyushu:"Kyushu", okinawa:"Okinawa" },
};
const MONTHS = {
  en: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
  id: ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"],
  es: ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"],
  th: ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."],
};

const ranked = [...DATA.prefectures].sort((a, b) => a.rank - b.rank);
const highest = ranked[0];
const lowest = ranked[ranked.length - 1];
const lowestPrefs = ranked.filter((p) => p.amount === lowest.amount).map((p) => p.pref);
const secondLowestAmt = Math.min(...ranked.filter((p) => p.amount > lowest.amount).map((p) => p.amount));
const secondLowestPrefs = ranked.filter((p) => p.amount === secondLowestAmt).map((p) => p.pref);
// Previous-year figures (still the legal floor in each prefecture until its FY2026 effective date)
const prevHighest = Math.max(...DATA.prefectures.map((p) => p.prev));
const prevLowest = Math.min(...DATA.prefectures.map((p) => p.prev));
const prevLowestPrefs = DATA.prefectures.filter((p) => p.prev === prevLowest).map((p) => p.pref);
const [effFrom, effTo] = DATA.effective_range;
const effFromPrefs = ranked.filter((p) => p.effective === effFrom);
const effToPrefs = ranked.filter((p) => p.effective === effTo).map((p) => p.pref);
// Six Rank-A prefectures had a ¥54 guideline in FY2026; Ranks B/C ¥56 (MHLW 2026-07-28). Used only to count
// how many prefectures went above the guideline — the number MHLW's own release reports as 33.
const RANK_A = new Set(["Saitama", "Chiba", "Tokyo", "Kanagawa", "Aichi", "Osaka"]);
const nAboveGuideline = ranked.filter((p) => p.raise > (RANK_A.has(p.pref) ? 54 : 56)).length;
const raiseMin = Math.min(...ranked.map((p) => p.raise));
const raiseMax = Math.max(...ranked.map((p) => p.raise));
const topRaises = [...ranked].sort((a, b) => b.raise - a.raise || a.rank - b.rank).slice(0, 4);
const natPct = Number(DATA.national_pct).toFixed(1); // 5.0, not "5" — JSON 5.0 parses to the integer 5
const ratioPct = ((lowest.amount / highest.amount) * 100).toFixed(1); // 84.8 in FY2026 = figure in MHLW release
const fmtDate = (iso, lang) => {
  const [y, m, d] = iso.split("-").map(Number);
  const mon = MONTHS[lang][m - 1];
  return (lang === "en" || lang === "id") ? `${mon} ${d}, ${y}` : `${d} ${mon} ${y}`;
};
// illustrative full-time monthly (40h/week), before tax — transparent calc, clearly labelled
const monthly = (hourly) => Math.round((hourly * 40 * 52) / 12 / 1000) * 1000;
const urlFor = (L) => (L === "en" ? `${SITE}/blog/${SLUG}.html` : `${SITE}/blog/${L}/${SLUG}.html`);
const MHLW_LIST = "https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/koyou_roudou/roudoukijun/minimumichiran/";
const MHLW_RELEASE = "https://www.mhlw.go.jp/stf/newpage_75950.html";
const MHLW_PDF = "https://www.mhlw.go.jp/content/11302000/001745621.pdf";
const prefList = (arr, and) => arr.length <= 1 ? arr.join("") : `${arr.slice(0, -1).join(", ")} ${and} ${arr[arr.length - 1]}`;
const topRaiseStr = (join) => topRaises.map((p) => `${p.pref} (+${yen(p.raise)})`).join(join);

// datePublished from git (first commit that added the file) — honest by construction, same rule as stamp-dates.mjs.
function firstCommitDate(rel) {
  try {
    const out = execSync(`git log --diff-filter=A --follow --format=%as -- "${rel}"`, { cwd: fileURLToPath(ROOT), encoding: "utf8" }).trim().split("\n").filter(Boolean);
    return out[out.length - 1] || UPDATED;
  } catch { return UPDATED; }
}

function tableRows(lang) {
  return ranked.map((p) => {
    const slug = p.pref.toLowerCase();
    // en links to blog/<slug>.html (all 47 exist); a localized article links to its own
    // blog/<lang>/<slug>.html when that translation exists, else the English guide.
    const href = lang === "en"
      ? `${slug}.html`
      : (existsSync(new URL(`blog/${lang}/${slug}.html`, ROOT)) ? `${slug}.html` : `../${slug}.html`);
    const name = `<a href="${href}">${esc(p.pref)}</a>`;
    return `<tr><td class="r">${p.rank}</td><td class="pf">${name}</td><td class="w">${yen(p.amount)}</td><td class="up" title="${yen(p.prev)} → ${yen(p.amount)}">+${p.raise}</td><td class="dt">${fmtDate(p.effective, lang)}</td><td class="rg">${REGION[lang][p.region]}</td></tr>`;
  }).join("\n      ");
}

export const T = {
  en: {
    htmlLang: "en",
    title: "Japan Minimum Wage by Prefecture (2026–27): All 47, Ranked — NihongoHub",
    desc: `The official FY2026 regional minimum wage for all 47 Japanese prefectures (Ministry of Health, Labour and Welfare) — ranked, with each raise and the date it takes effect (${fmtDate(effFrom, "en")} – ${fmtDate(effTo, "en")}). National average ${yen(DATA.national_weighted_average)}; ${highest.pref} ${yen(highest.amount)}, lowest ${yen(lowest.amount)}.`,
    ogtitle: "Japan Minimum Wage by Prefecture (2026–27) — all 47, ranked",
    tag: "▶ WORKING IN JAPAN · DATA",
    h1: "Japan Minimum Wage by Prefecture (2026–27)",
    lede: `Japan sets its minimum wage by prefecture, not nationally. Here are the FY2026 figures for all 47 — ranked from highest to lowest, with the raise and the date each one takes effect. The new rates phase in between ${fmtDate(effFrom, "en")} and ${fmtDate(effTo, "en")}, so check your prefecture's date before quoting the number.`,
    tldrH: "Short answer",
    tldr: `Japan's minimum wage is set per prefecture. Under the FY2026 revision, ${esc(highest.pref)} is highest at ${yen(highest.amount)}/hour; ${lowestPrefs.map(esc).join(", ")} ${lowestPrefs.length > 1 ? "are" : "is"} lowest at ${yen(lowest.amount)}. The national weighted average rises ${yen(DATA.national_raise)} to ${yen(DATA.national_weighted_average)} (+${natPct}%), the second-largest increase since the guideline system began in 1978. Each prefecture's new rate applies from its own effective date (${fmtDate(effFrom, "en")} – ${fmtDate(effTo, "en")}); until then the FY2025 rate is the legal floor. All figures are hourly, before tax.`,
    sourceLine: `Source: Ministry of Health, Labour and Welfare (MHLW), <em>FY2026 Regional Minimum Wages — council reports of all 47 prefectures (3 September 2026)</em>. Figures are the prefectural hourly minimum (地域別最低賃金), before tax and social insurance.`,
    phaseH: "⚠ NEW RATES ARE PHASING IN — CHECK YOUR PREFECTURE'S DATE",
    phase: [
      `<b>The table shows the FY2026 rates.</b> All 47 prefectural councils reported their figures by <b>3 September 2026</b>, and each rate takes effect on the date in the <em>Effective</em> column — from <b>${fmtDate(effFrom, "en")}</b> (${prefList(effFromPrefs.slice(0, 6).map((p) => p.pref), "and")} and ${effFromPrefs.length - 6} others) to <b>${fmtDate(effTo, "en")}</b> (${effToPrefs.join(", ")}).`,
      `<b>Before your prefecture's date, the FY2025 rate is still the legal floor</b> — the new figure minus the raise shown next to it (${highest.pref}: ${yen(highest.prev)} until ${fmtDate(highest.effective, "en")}, then ${yen(highest.amount)}). On a desktop, hover over the raise to see the old and new rate.`,
      `A council report becomes final when the prefectural Labour Bureau Director issues the decision; MHLW notes that an effective date can still move if objections are filed. Confirm your prefecture on the <a href="${MHLW_LIST}" target="_blank" rel="noopener">MHLW list</a> before relying on it.`,
    ],
    phaseSrc: `Source: MHLW press release, 3 September 2026 — <a href="${MHLW_RELEASE}" target="_blank" rel="noopener">all 47 prefectures reported</a> · <a href="${MHLW_PDF}" target="_blank" rel="noopener">prefecture table (PDF)</a>`,
    glanceH: "At a glance",
    g1: "National weighted average", g1sub: `up +${yen(DATA.national_raise).slice(1)} (+${natPct}%) on the year`,
    g2: "Highest", g2sub: `${esc(highest.pref)}`,
    g3: "Lowest", g3sub: `${lowestPrefs.map(esc).join(" · ")}`,
    g4: "Lowest ÷ highest", g4v: `${ratioPct}%`, g4sub: "gap narrowed for a 12th straight year",
    tableH: "All 47 prefectures, ranked",
    tableNote: "Ranked by hourly rate, highest first. Effective = the date the new rate starts in that prefecture. Tap a prefecture for its living-and-travel guide.",
    col: ["#", "Prefecture", "¥ / hour", "Raise", "Effective", "Region"],
    jlf: { h: "You have the wage. Which of these 47 would actually fit you?", p: "We built a free 8-question matcher: not the best place in Japan, the place that fits you. It compares 60 municipalities on real data about climate, housing and car-free life, and tells you what it could not verify. No name, no email.", cta: "Try Japan Living Fit", src: "nhb_minwage" },
    payH: "What this means for your paycheck",
    pay: `These are <em>hourly minimums</em> — the legal floor an employer may pay, before tax and insurance. As a rough full-time guide (40 hours a week), ${yen(highest.amount)} works out to about ${yen(monthly(highest.amount))} a month before deductions, and ${yen(lowest.amount)} to about ${yen(monthly(lowest.amount))}. Income tax, residence tax, health insurance and pension typically take roughly 15–20% off the top, so take-home pay is lower. A higher headline wage also tends to come with higher rent: Tokyo pays the most but also costs the most to live in, so compare wages against local rent before choosing where to work.`,
    sswH: "If you're coming on a Specified Skilled Worker (特定技能) visa",
    ssw: `Specified Skilled Worker (SSW / tokutei ginō) jobs in fields like caregiving, food service and manufacturing must pay at least the local prefectural minimum, and Japanese labour law requires equal-or-better pay than a Japanese worker doing the same job. Use the table to compare regions: a slightly lower wage in a low-rent prefecture can leave more money at the end of the month than a high wage in central Tokyo. Always confirm the wage, working hours and deductions written in your employment contract (雇用契約書) before you sign — and if your contract was signed on the FY2025 rate, the new prefectural minimum applies automatically from the effective date.`,
    remitH: "Sending money home",
    remit: `Many residents who send part of their pay abroad use a low-fee transfer service to avoid the high spread on bank wires. <a href="https://wise.com/card/" data-aff="wise" data-aff-fallback="https://wise.com/card/" target="_blank" rel="noopener">Wise</a> is one widely used option; compare its fee and exchange rate against your bank for your own corridor before deciding.`,
    targetH: "Where it's heading",
    target: `The FY2026 revision adds ${yen(DATA.national_raise)} to the national weighted average (${yen(DATA.national_prev)} → ${yen(DATA.national_weighted_average)}, +${natPct}%) — the second-largest rise since the guideline system began in 1978, after the ¥66 of FY2025. ${nAboveGuideline} prefectures went above the central council's guideline (¥54–56), which is why the increases range from ${yen(raiseMin)} to ${yen(raiseMax)}: ${topRaiseStr(", ")} led. The gap between the lowest and highest rate narrowed for a 12th consecutive year, to ${ratioPct}%. The government's stated goal is a national average of ¥1,500/hour by the late 2020s; at ${yen(DATA.national_raise)} a year that would not arrive until around 2032, so the size of each summer's guideline is the thing to watch.`,
    faqH: "Common questions",
    faq: [
      ["What is the minimum wage in Japan in 2026?", `Japan has no single national minimum wage — it is set per prefecture. Under the FY2026 revision the national weighted average is ${yen(DATA.national_weighted_average)} per hour, ranging from ${yen(lowest.amount)} (${lowestPrefs.join(", ")}) to ${yen(highest.amount)} (${highest.pref}). The new rates take effect between ${fmtDate(effFrom, "en")} and ${fmtDate(effTo, "en")}, prefecture by prefecture. All figures are hourly, before tax.`],
      ["Which prefecture has the highest minimum wage?", `${highest.pref} has the highest at ${yen(highest.amount)} per hour, followed by ${ranked[1].pref} (${yen(ranked[1].amount)}) and ${ranked[2].pref} (${yen(ranked[2].amount)}).`],
      ["Which prefecture has the lowest minimum wage?", `${lowestPrefs.join(", ")} ${lowestPrefs.length > 1 ? "share" : "has"} the lowest at ${yen(lowest.amount)} per hour, with ${prefList(secondLowestPrefs, "and")} next at ${yen(secondLowestAmt)}. Every prefecture is now at ${yen(lowest.amount)} or above.`],
      ["When do the 2026 rates take effect?", `Each prefecture sets its own date. The FY2026 rates take effect between ${fmtDate(effFrom, "en")} (${effFromPrefs.length} prefectures, including ${prefList(effFromPrefs.slice(0, 6).map((p) => p.pref), "and")}) and ${fmtDate(effTo, "en")} (${effToPrefs.join(", ")}). Until your prefecture's date, the FY2025 rate remains the legal minimum.`],
      ["What was the minimum wage in Japan in 2025?", `Under the FY2025 revision — still the legal floor in each prefecture until its 2026 effective date — the national weighted average was ${yen(DATA.national_prev)}, ranging from ${yen(prevLowest)} (${prevLowestPrefs.join(", ")}) to ${yen(prevHighest)} (${highest.pref}). That was the first year every prefecture cleared ¥1,000/hour.`],
      ["How much did my prefecture go up?", `Between ${yen(raiseMin)} and ${yen(raiseMax)} per hour. The three Rank A prefectures that matched the guideline (${ranked.filter((p) => p.raise === raiseMin).map((p) => p.pref).join(", ")}) rose ${yen(raiseMin)}; most others ¥56–61; the largest raises were ${topRaiseStr(", ")}. See the Raise column.`],
    ],
    relH: "Related",
    relMove: "Moving to Japan: the practical timeline",
    relSsw: "Specified Skilled Worker (特定技能) practice test",
    relGuides: "All 47 prefecture guides",
    disc: "General information only, compiled from official MHLW data on the date below — not legal or employment advice. Minimum wages are revised every year; confirm the current figure for your prefecture at mhlw.go.jp before relying on it.",
    updated: "Data: MHLW FY2026 council reports (3 Sep 2026) · page updated",
    allGuides: "← All guides", freeQuiz: "FREE QUIZ",
  },
  id: {
    htmlLang: "id",
    title: "Upah Minimum Jepang per Prefektur (2026–27): 47 Prefektur, Diurutkan — NihongoHub",
    desc: `Upah minimum regional resmi tahun fiskal 2026 untuk seluruh 47 prefektur Jepang (Kementerian Kesehatan, Tenaga Kerja dan Kesejahteraan) — diurutkan, dengan kenaikan dan tanggal mulai berlaku (${fmtDate(effFrom, "id")} – ${fmtDate(effTo, "id")}). Rata-rata nasional ${yen(DATA.national_weighted_average)}; ${highest.pref} ${yen(highest.amount)}, terendah ${yen(lowest.amount)}.`,
    ogtitle: "Upah Minimum Jepang per Prefektur (2026–27) — 47 prefektur, diurutkan",
    tag: "▶ KERJA DI JEPANG · DATA",
    h1: "Upah Minimum Jepang per Prefektur (2026–27)",
    lede: `Jepang menetapkan upah minimum per prefektur, bukan secara nasional. Berikut angka tahun fiskal 2026 untuk semua 47 prefektur — diurutkan dari tertinggi ke terendah, lengkap dengan kenaikan dan tanggal mulai berlaku. Tarif baru berlaku bertahap antara ${fmtDate(effFrom, "id")} dan ${fmtDate(effTo, "id")}, jadi periksa tanggal prefektur Anda sebelum mengutip angkanya.`,
    tldrH: "Jawaban singkat",
    tldr: `Upah minimum Jepang ditetapkan per prefektur. Dalam revisi tahun fiskal 2026, ${esc(highest.pref)} tertinggi dengan ${yen(highest.amount)}/jam; ${lowestPrefs.map(esc).join(", ")} terendah dengan ${yen(lowest.amount)}. Rata-rata tertimbang nasional naik ${yen(DATA.national_raise)} menjadi ${yen(DATA.national_weighted_average)} (+${natPct}%), kenaikan terbesar kedua sejak sistem panduan dimulai pada 1978. Tarif baru tiap prefektur berlaku sejak tanggal efektifnya masing-masing (${fmtDate(effFrom, "id")} – ${fmtDate(effTo, "id")}); sebelum itu tarif tahun fiskal 2025 masih menjadi batas bawah yang sah. Semua angka per jam, sebelum pajak.`,
    sourceLine: `Sumber: Kementerian Kesehatan, Tenaga Kerja dan Kesejahteraan (MHLW), <em>Upah Minimum Regional Tahun Fiskal 2026 — laporan dewan dari seluruh 47 prefektur (3 September 2026)</em>. Angka merupakan upah minimum per jam tiap prefektur (地域別最低賃金), sebelum pajak dan asuransi sosial.`,
    phaseH: "⚠ TARIF BARU BERLAKU BERTAHAP — PERIKSA TANGGAL PREFEKTUR ANDA",
    phase: [
      `<b>Tabel ini menampilkan tarif tahun fiskal 2026.</b> Dewan di seluruh 47 prefektur telah melaporkan angkanya per <b>3 September 2026</b>, dan tiap tarif berlaku pada tanggal di kolom <em>Berlaku</em> — dari <b>${fmtDate(effFrom, "id")}</b> (${prefList(effFromPrefs.slice(0, 6).map((p) => p.pref), "dan")}, serta ${effFromPrefs.length - 6} lainnya) hingga <b>${fmtDate(effTo, "id")}</b> (${effToPrefs.join(", ")}).`,
      `<b>Sebelum tanggal prefektur Anda, tarif tahun fiskal 2025 masih menjadi batas bawah yang sah</b> — yaitu angka baru dikurangi kenaikan di sampingnya (${highest.pref}: ${yen(highest.prev)} sampai ${fmtDate(highest.effective, "id")}, lalu ${yen(highest.amount)}). Di desktop, arahkan kursor ke angka kenaikan untuk melihat tarif lama dan baru.`,
      `Laporan dewan menjadi final setelah Kepala Biro Tenaga Kerja prefektur mengeluarkan keputusan; MHLW mencatat tanggal berlaku masih bisa bergeser jika ada keberatan yang diajukan. Pastikan prefektur Anda di <a href="${MHLW_LIST}" target="_blank" rel="noopener">daftar MHLW</a> sebelum mengandalkannya.`,
    ],
    phaseSrc: `Sumber: siaran pers MHLW, 3 September 2026 — <a href="${MHLW_RELEASE}" target="_blank" rel="noopener">seluruh 47 prefektur telah melapor</a> · <a href="${MHLW_PDF}" target="_blank" rel="noopener">tabel per prefektur (PDF)</a>`,
    glanceH: "Sekilas",
    g1: "Rata-rata tertimbang nasional", g1sub: `naik +${yen(DATA.national_raise).slice(1)} (+${natPct}%) dari tahun lalu`,
    g2: "Tertinggi", g2sub: `${esc(highest.pref)}`,
    g3: "Terendah", g3sub: `${lowestPrefs.map(esc).join(" · ")}`,
    g4: "Terendah ÷ tertinggi", g4v: `${ratioPct}%`, g4sub: "selisih menyempit 12 tahun berturut-turut",
    tableH: "Seluruh 47 prefektur, diurutkan",
    tableNote: "Diurutkan menurut upah per jam, tertinggi dulu. Berlaku = tanggal tarif baru mulai dipakai di prefektur itu. Ketuk nama prefektur untuk panduan hidup-dan-wisatanya.",
    col: ["#", "Prefektur", "¥ / jam", "Naik", "Berlaku", "Wilayah"],
    jlf: { h: "Gajinya sudah Anda tahu. Dari 47 ini, mana yang cocok untuk Anda?", p: "Kami membuat kuis gratis berisi 8 pertanyaan: bukan tempat terbaik di Jepang, melainkan tempat yang cocok untuk Anda. Kuis ini membandingkan 60 munisipalitas dengan data nyata tentang iklim, perumahan, dan hidup tanpa mobil, sekaligus menyebutkan apa yang tidak dapat diverifikasi. Tanpa nama, tanpa email. Alatnya berbahasa Inggris.", cta: "Coba Japan Living Fit", src: "nhb_minwage_id" },
    payH: "Apa artinya untuk gaji Anda",
    pay: `Ini adalah <em>upah minimum per jam</em> — batas bawah legal yang boleh dibayar perusahaan, sebelum pajak dan asuransi. Sebagai perkiraan kasar kerja penuh waktu (40 jam seminggu), ${yen(highest.amount)} setara sekitar ${yen(monthly(highest.amount))} per bulan sebelum potongan, dan ${yen(lowest.amount)} sekitar ${yen(monthly(lowest.amount))}. Pajak penghasilan, pajak penduduk, asuransi kesehatan dan pensiun biasanya memotong sekitar 15–20%, jadi gaji bersih lebih rendah. Upah tinggi biasanya juga berarti sewa tinggi: Tokyo membayar paling banyak tetapi juga paling mahal untuk ditinggali, jadi bandingkan upah dengan sewa setempat sebelum memilih tempat kerja.`,
    sswH: "Jika Anda datang dengan visa Pekerja Berketerampilan Spesifik (特定技能)",
    ssw: `Pekerjaan Tokutei Ginō (SSW) di bidang seperti perawatan (kaigo), jasa makanan, dan manufaktur wajib membayar setidaknya upah minimum prefektur setempat, dan hukum ketenagakerjaan Jepang mewajibkan upah yang setara atau lebih tinggi dibanding pekerja Jepang pada pekerjaan yang sama. Gunakan tabel untuk membandingkan wilayah: upah sedikit lebih rendah di prefektur bersewa murah bisa menyisakan lebih banyak uang di akhir bulan dibanding upah tinggi di pusat Tokyo. Selalu periksa upah, jam kerja, dan potongan yang tertulis di kontrak kerja (雇用契約書) sebelum menandatangani — dan jika kontrak Anda ditandatangani dengan tarif tahun fiskal 2025, upah minimum prefektur yang baru berlaku otomatis sejak tanggal efektifnya.`,
    remitH: "Mengirim uang ke kampung halaman",
    remit: `Banyak penduduk yang mengirim sebagian gajinya ke luar negeri memakai layanan transfer berbiaya rendah untuk menghindari selisih kurs tinggi pada transfer bank. <a href="https://wise.com/card/" data-aff="wise" data-aff-fallback="https://wise.com/card/" target="_blank" rel="noopener">Wise</a> adalah salah satu pilihan yang banyak dipakai; bandingkan biaya dan kursnya dengan bank Anda untuk koridor Anda sendiri sebelum memutuskan.`,
    targetH: "Arah ke depan",
    target: `Revisi tahun fiskal 2026 menambah ${yen(DATA.national_raise)} pada rata-rata tertimbang nasional (${yen(DATA.national_prev)} → ${yen(DATA.national_weighted_average)}, +${natPct}%) — kenaikan terbesar kedua sejak sistem panduan dimulai pada 1978, setelah ¥66 pada tahun fiskal 2025. Sebanyak ${nAboveGuideline} prefektur menetapkan di atas panduan dewan pusat (¥54–56), sehingga kenaikannya berkisar dari ${yen(raiseMin)} hingga ${yen(raiseMax)}: yang terbesar ${topRaiseStr(", ")}. Selisih antara tarif terendah dan tertinggi menyempit untuk tahun ke-12 berturut-turut, menjadi ${ratioPct}%. Pemerintah menargetkan rata-rata nasional ¥1,500/jam pada akhir 2020-an; dengan ${yen(DATA.national_raise)} per tahun, target itu baru tercapai sekitar 2032, jadi besarnya panduan tiap musim panas adalah hal yang perlu diperhatikan.`,
    faqH: "Pertanyaan umum",
    faq: [
      ["Berapa upah minimum di Jepang pada 2026?", `Jepang tidak punya satu upah minimum nasional — ditetapkan per prefektur. Dalam revisi tahun fiskal 2026, rata-rata tertimbang nasional adalah ${yen(DATA.national_weighted_average)} per jam, berkisar dari ${yen(lowest.amount)} (${lowestPrefs.join(", ")}) hingga ${yen(highest.amount)} (${highest.pref}). Tarif baru berlaku antara ${fmtDate(effFrom, "id")} dan ${fmtDate(effTo, "id")}, prefektur demi prefektur. Semua angka per jam, sebelum pajak.`],
      ["Prefektur mana yang upah minimumnya tertinggi?", `${highest.pref} tertinggi dengan ${yen(highest.amount)} per jam, diikuti ${ranked[1].pref} (${yen(ranked[1].amount)}) dan ${ranked[2].pref} (${yen(ranked[2].amount)}).`],
      ["Prefektur mana yang upah minimumnya terendah?", `${lowestPrefs.join(", ")} terendah dengan ${yen(lowest.amount)} per jam, disusul ${prefList(secondLowestPrefs, "dan")} dengan ${yen(secondLowestAmt)}. Kini semua prefektur berada di ${yen(lowest.amount)} atau lebih.`],
      ["Kapan tarif 2026 mulai berlaku?", `Tiap prefektur menetapkan tanggalnya sendiri. Tarif tahun fiskal 2026 berlaku antara ${fmtDate(effFrom, "id")} (${effFromPrefs.length} prefektur, termasuk ${prefList(effFromPrefs.slice(0, 6).map((p) => p.pref), "dan")}) dan ${fmtDate(effTo, "id")} (${effToPrefs.join(", ")}). Sebelum tanggal prefektur Anda, tarif tahun fiskal 2025 tetap menjadi upah minimum yang sah.`],
      ["Berapa upah minimum di Jepang pada 2025?", `Dalam revisi tahun fiskal 2025 — yang masih menjadi batas bawah di tiap prefektur sampai tanggal efektif 2026-nya — rata-rata tertimbang nasional adalah ${yen(DATA.national_prev)}, berkisar dari ${yen(prevLowest)} (${prevLowestPrefs.join(", ")}) hingga ${yen(prevHighest)} (${highest.pref}). Itu tahun pertama semua prefektur melewati ¥1,000/jam.`],
      ["Berapa kenaikan di prefektur saya?", `Antara ${yen(raiseMin)} dan ${yen(raiseMax)} per jam. Tiga prefektur Peringkat A yang mengikuti panduan (${ranked.filter((p) => p.raise === raiseMin).map((p) => p.pref).join(", ")}) naik ${yen(raiseMin)}; sebagian besar lainnya ¥56–61; kenaikan terbesar adalah ${topRaiseStr(", ")}. Lihat kolom Naik.`],
    ],
    relH: "Terkait",
    relMove: "Pindah ke Jepang: garis waktu praktis",
    relSsw: "Tes latihan Pekerja Berketerampilan Spesifik (特定技能)",
    relGuides: "Semua 47 panduan prefektur",
    disc: "Hanya informasi umum, disusun dari data resmi MHLW pada tanggal di bawah — bukan nasihat hukum atau ketenagakerjaan. Upah minimum direvisi setiap tahun; pastikan angka terkini untuk prefektur Anda di mhlw.go.jp sebelum mengandalkannya.",
    updated: "Data: laporan dewan MHLW TF2026 (3 Sep 2026) · halaman diperbarui",
    allGuides: "← Semua panduan", freeQuiz: "KUIS GRATIS",
  },
  es: {
    htmlLang: "es",
    title: "Salario mínimo en Japón por prefectura (2026–27): las 47, clasificadas — NihongoHub",
    desc: `El salario mínimo regional oficial del año fiscal 2026 para las 47 prefecturas de Japón (Ministerio de Salud, Trabajo y Bienestar) — clasificado, con la subida y la fecha de entrada en vigor (${fmtDate(effFrom, "es")} – ${fmtDate(effTo, "es")}). Promedio nacional ${yen(DATA.national_weighted_average)}; ${highest.pref} ${yen(highest.amount)}, el más bajo ${yen(lowest.amount)}.`,
    ogtitle: "Salario mínimo en Japón por prefectura (2026–27) — las 47, clasificadas",
    tag: "▶ TRABAJAR EN JAPÓN · DATOS",
    h1: "Salario mínimo en Japón por prefectura (2026–27)",
    lede: `Japón fija el salario mínimo por prefectura, no a nivel nacional. Aquí están las cifras del año fiscal 2026 para las 47, ordenadas de mayor a menor, con la subida y la fecha en que entra en vigor cada una. Las nuevas tarifas se aplican de forma escalonada entre el ${fmtDate(effFrom, "es")} y el ${fmtDate(effTo, "es")}, así que comprueba la fecha de tu prefectura antes de citar la cifra.`,
    tldrH: "Respuesta breve",
    tldr: `El salario mínimo de Japón se fija por prefectura. Con la revisión del año fiscal 2026, ${esc(highest.pref)} es el más alto con ${yen(highest.amount)}/hora; ${lowestPrefs.map(esc).join(", ")} ${lowestPrefs.length > 1 ? "son los más bajos" : "es el más bajo"} con ${yen(lowest.amount)}. El promedio ponderado nacional sube ${yen(DATA.national_raise)} hasta ${yen(DATA.national_weighted_average)} (+${natPct} %), la segunda mayor subida desde que empezó el sistema de orientación en 1978. La nueva tarifa de cada prefectura se aplica desde su propia fecha de entrada en vigor (${fmtDate(effFrom, "es")} – ${fmtDate(effTo, "es")}); hasta entonces, la tarifa del año fiscal 2025 sigue siendo el mínimo legal. Todas las cifras son por hora, antes de impuestos.`,
    sourceLine: `Fuente: Ministerio de Salud, Trabajo y Bienestar (MHLW), <em>Salarios mínimos regionales del año fiscal 2026 — dictámenes de los consejos de las 47 prefecturas (3 de septiembre de 2026)</em>. Las cifras son el mínimo prefectural por hora (地域別最低賃金), antes de impuestos y seguros sociales.`,
    phaseH: "⚠ LAS NUEVAS TARIFAS ENTRAN EN VIGOR DE FORMA ESCALONADA — COMPRUEBA LA FECHA DE TU PREFECTURA",
    phase: [
      `<b>La tabla muestra las tarifas del año fiscal 2026.</b> Los consejos de las 47 prefecturas emitieron sus dictámenes antes del <b>3 de septiembre de 2026</b>, y cada tarifa entra en vigor en la fecha de la columna <em>En vigor</em>: desde el <b>${fmtDate(effFrom, "es")}</b> (${prefList(effFromPrefs.slice(0, 6).map((p) => p.pref), "y")} y ${effFromPrefs.length - 6} más) hasta el <b>${fmtDate(effTo, "es")}</b> (${effToPrefs.join(", ")}).`,
      `<b>Antes de la fecha de tu prefectura, la tarifa del año fiscal 2025 sigue siendo el mínimo legal</b>: es la cifra nueva menos la subida que aparece al lado (${highest.pref}: ${yen(highest.prev)} hasta el ${fmtDate(highest.effective, "es")}, luego ${yen(highest.amount)}). En escritorio, pasa el cursor por la subida para ver la tarifa antigua y la nueva.`,
      `Un dictamen se vuelve definitivo cuando el director de la Oficina de Trabajo de la prefectura emite la decisión; el MHLW advierte que una fecha de entrada en vigor aún puede cambiar si se presentan objeciones. Confirma tu prefectura en la <a href="${MHLW_LIST}" target="_blank" rel="noopener">lista del MHLW</a> antes de basarte en ella.`,
    ],
    phaseSrc: `Fuente: comunicado del MHLW, 3 de septiembre de 2026 — <a href="${MHLW_RELEASE}" target="_blank" rel="noopener">las 47 prefecturas han dictaminado</a> · <a href="${MHLW_PDF}" target="_blank" rel="noopener">tabla por prefectura (PDF)</a>`,
    glanceH: "De un vistazo",
    g1: "Promedio ponderado nacional", g1sub: `+${yen(DATA.national_raise).slice(1)} (+${natPct} %) respecto al año anterior`,
    g2: "Más alto", g2sub: `${esc(highest.pref)}`,
    g3: "Más bajo", g3sub: `${lowestPrefs.map(esc).join(" · ")}`,
    g4: "Más bajo ÷ más alto", g4v: `${ratioPct} %`, g4sub: "la brecha se reduce por 12.º año consecutivo",
    tableH: "Las 47 prefecturas, clasificadas",
    tableNote: "Ordenadas por tarifa por hora, de mayor a menor. En vigor = fecha en que empieza la nueva tarifa en esa prefectura. Toca una prefectura para ver su guía de vida y viaje.",
    col: ["#", "Prefectura", "¥ / hora", "Subida", "En vigor", "Región"],
    jlf: { h: "Ya tienes el salario. ¿Cuál de estas 47 encaja contigo?", p: "Hicimos un test gratuito de 8 preguntas: no el mejor lugar de Japón, sino el que encaja contigo. Compara 60 municipios con datos reales sobre clima, vivienda y vida sin coche, y te dice qué no pudo verificar. Sin nombre, sin correo. La herramienta está en inglés.", cta: "Probar Japan Living Fit", src: "nhb_minwage_es" },
    payH: "Qué significa para tu sueldo",
    pay: `Estas son <em>tarifas mínimas por hora</em>: el piso legal que un empleador puede pagar, antes de impuestos y seguros. Como referencia aproximada a tiempo completo (40 horas semanales), ${yen(highest.amount)} equivalen a unos ${yen(monthly(highest.amount))} al mes antes de deducciones, y ${yen(lowest.amount)} a unos ${yen(monthly(lowest.amount))}. El impuesto sobre la renta, el impuesto de residencia, el seguro de salud y la pensión suelen restar entre un 15 % y un 20 %, por lo que el sueldo neto es menor. Un salario nominal más alto también suele ir acompañado de alquileres más altos: Tokio paga más pero también es lo más caro para vivir, así que compara los salarios con el alquiler local antes de decidir dónde trabajar.`,
    sswH: "Si vienes con un visado de Trabajador Cualificado Específico (特定技能)",
    ssw: `Los empleos de Trabajador Cualificado Específico (SSW / tokutei ginō) en sectores como cuidados, hostelería y manufactura deben pagar al menos el mínimo prefectural local, y la ley laboral japonesa exige una remuneración igual o mejor que la de un trabajador japonés en el mismo puesto. Usa la tabla para comparar regiones: un salario algo menor en una prefectura con alquiler bajo puede dejar más dinero a fin de mes que un salario alto en el centro de Tokio. Confirma siempre el salario, las horas y las deducciones que figuran en tu contrato de trabajo (雇用契約書) antes de firmar; y si tu contrato se firmó con la tarifa del año fiscal 2025, el nuevo mínimo prefectural se aplica automáticamente desde la fecha de entrada en vigor.`,
    remitH: "Enviar dinero a casa",
    remit: `Muchos residentes que envían parte de su sueldo al extranjero usan un servicio de transferencia de bajo coste para evitar el alto margen de las transferencias bancarias. <a href="https://wise.com/card/" data-aff="wise" data-aff-fallback="https://wise.com/card/" target="_blank" rel="noopener">Wise</a> es una opción muy usada; compara su comisión y tipo de cambio con los de tu banco para tu propio corredor antes de decidir.`,
    targetH: "Hacia dónde va",
    target: `La revisión del año fiscal 2026 añade ${yen(DATA.national_raise)} al promedio ponderado nacional (${yen(DATA.national_prev)} → ${yen(DATA.national_weighted_average)}, +${natPct} %), la segunda mayor subida desde que empezó el sistema de orientación en 1978, tras los ¥66 del año fiscal 2025. ${nAboveGuideline} prefecturas superaron la orientación del consejo central (¥54–56), y por eso las subidas van de ${yen(raiseMin)} a ${yen(raiseMax)}: las mayores fueron ${topRaiseStr(", ")}. La brecha entre la tarifa más baja y la más alta se redujo por 12.º año consecutivo, hasta el ${ratioPct} %. El objetivo declarado del gobierno es un promedio nacional de ¥1,500/hora hacia finales de la década de 2020; a ${yen(DATA.national_raise)} al año no llegaría hasta alrededor de 2032, así que el tamaño de la orientación de cada verano es lo que hay que vigilar.`,
    faqH: "Preguntas frecuentes",
    faq: [
      ["¿Cuál es el salario mínimo en Japón en 2026?", `Japón no tiene un único salario mínimo nacional: se fija por prefectura. Con la revisión del año fiscal 2026, el promedio ponderado nacional es de ${yen(DATA.national_weighted_average)} por hora, y va desde ${yen(lowest.amount)} (${lowestPrefs.join(", ")}) hasta ${yen(highest.amount)} (${highest.pref}). Las nuevas tarifas entran en vigor entre el ${fmtDate(effFrom, "es")} y el ${fmtDate(effTo, "es")}, prefectura por prefectura. Todas las cifras son por hora, antes de impuestos.`],
      ["¿Qué prefectura tiene el salario mínimo más alto?", `${highest.pref} tiene el más alto con ${yen(highest.amount)} por hora, seguida de ${ranked[1].pref} (${yen(ranked[1].amount)}) y ${ranked[2].pref} (${yen(ranked[2].amount)}).`],
      ["¿Qué prefectura tiene el salario mínimo más bajo?", `${lowestPrefs.join(", ")} ${lowestPrefs.length > 1 ? "comparten el más bajo" : "tiene el más bajo"} con ${yen(lowest.amount)} por hora, seguida de ${prefList(secondLowestPrefs, "y")} con ${yen(secondLowestAmt)}. Todas las prefecturas están ya en ${yen(lowest.amount)} o más.`],
      ["¿Cuándo entran en vigor las tarifas de 2026?", `Cada prefectura fija su propia fecha. Las tarifas del año fiscal 2026 entran en vigor entre el ${fmtDate(effFrom, "es")} (${effFromPrefs.length} prefecturas, entre ellas ${prefList(effFromPrefs.slice(0, 6).map((p) => p.pref), "y")}) y el ${fmtDate(effTo, "es")} (${effToPrefs.join(", ")}). Hasta la fecha de tu prefectura, la tarifa del año fiscal 2025 sigue siendo el mínimo legal.`],
      ["¿Cuál era el salario mínimo en Japón en 2025?", `Con la revisión del año fiscal 2025, vigente en cada prefectura hasta su fecha de entrada en vigor de 2026, el promedio ponderado nacional era de ${yen(DATA.national_prev)}, desde ${yen(prevLowest)} (${prevLowestPrefs.join(", ")}) hasta ${yen(prevHighest)} (${highest.pref}). Fue el primer año en que todas las prefecturas superaron los ¥1,000/hora.`],
      ["¿Cuánto subió mi prefectura?", `Entre ${yen(raiseMin)} y ${yen(raiseMax)} por hora. Las tres prefecturas de Rango A que siguieron la orientación (${ranked.filter((p) => p.raise === raiseMin).map((p) => p.pref).join(", ")}) subieron ${yen(raiseMin)}; la mayoría de las demás, entre ¥56 y ¥61; las mayores subidas fueron ${topRaiseStr(", ")}. Consulta la columna Subida.`],
    ],
    relH: "Relacionado",
    relMove: "Mudarse a Japón: el cronograma práctico",
    relSsw: "Examen de práctica de Trabajador Cualificado Específico (特定技能)",
    relGuides: "Las 47 guías de prefecturas",
    disc: "Solo información general, recopilada de datos oficiales del MHLW en la fecha indicada abajo — no es asesoramiento legal ni laboral. Los salarios mínimos se revisan cada año; confirma la cifra actual de tu prefectura en mhlw.go.jp antes de basarte en ella.",
    updated: "Datos: dictámenes de los consejos, MHLW, año fiscal 2026 (3 sep 2026) · página actualizada",
    allGuides: "← Todas las guías", freeQuiz: "CUESTIONARIO GRATIS",
  },
  th: {
    htmlLang: "th",
    title: "ค่าจ้างขั้นต่ำในญี่ปุ่นตามจังหวัด (2026–27): ครบ 47 จังหวัด จัดอันดับ — NihongoHub",
    desc: `ค่าจ้างขั้นต่ำระดับภูมิภาคอย่างเป็นทางการปีงบประมาณ 2026 ของทั้ง 47 จังหวัดในญี่ปุ่น (กระทรวงสาธารณสุข แรงงานและสวัสดิการ) จัดอันดับ พร้อมจำนวนที่ปรับขึ้นและวันที่มีผล (${fmtDate(effFrom, "th")} – ${fmtDate(effTo, "th")}) ค่าเฉลี่ยทั่วประเทศ ${yen(DATA.national_weighted_average)} ${highest.pref} ${yen(highest.amount)} ต่ำสุด ${yen(lowest.amount)}`,
    ogtitle: "ค่าจ้างขั้นต่ำในญี่ปุ่นตามจังหวัด (2026–27) — ครบ 47 จังหวัด จัดอันดับ",
    tag: "▶ ทำงานในญี่ปุ่น · ข้อมูล",
    h1: "ค่าจ้างขั้นต่ำในญี่ปุ่นตามจังหวัด (2026–27)",
    lede: `ญี่ปุ่นกำหนดค่าจ้างขั้นต่ำตามจังหวัด ไม่ใช่ระดับประเทศ นี่คือตัวเลขปีงบประมาณ 2026 ของทั้ง 47 จังหวัด เรียงจากสูงไปต่ำ พร้อมจำนวนที่ปรับขึ้นและวันที่แต่ละจังหวัดเริ่มมีผล อัตราใหม่ทยอยมีผลระหว่าง ${fmtDate(effFrom, "th")} ถึง ${fmtDate(effTo, "th")} จึงควรตรวจสอบวันที่ของจังหวัดคุณก่อนอ้างอิงตัวเลข`,
    tldrH: "คำตอบสั้น ๆ",
    tldr: `ค่าจ้างขั้นต่ำของญี่ปุ่นกำหนดแยกตามจังหวัด ในการปรับปีงบประมาณ 2026 ${esc(highest.pref)} สูงสุดที่ ${yen(highest.amount)}/ชั่วโมง ส่วน ${lowestPrefs.map(esc).join(", ")} ต่ำสุดที่ ${yen(lowest.amount)} ค่าเฉลี่ยถ่วงน้ำหนักทั่วประเทศเพิ่มขึ้น ${yen(DATA.national_raise)} เป็น ${yen(DATA.national_weighted_average)} (+${natPct}%) ซึ่งเป็นการปรับขึ้นมากเป็นอันดับสองนับตั้งแต่เริ่มระบบแนวทางในปี 1978 อัตราใหม่ของแต่ละจังหวัดมีผลตั้งแต่วันที่ของจังหวัดนั้น (${fmtDate(effFrom, "th")} – ${fmtDate(effTo, "th")}) ก่อนหน้านั้นอัตราปีงบประมาณ 2025 ยังเป็นขั้นต่ำตามกฎหมาย ตัวเลขทั้งหมดเป็นต่อชั่วโมง ก่อนหักภาษี`,
    sourceLine: `แหล่งข้อมูล: กระทรวงสาธารณสุข แรงงานและสวัสดิการ (MHLW), <em>ค่าจ้างขั้นต่ำระดับภูมิภาคปีงบประมาณ 2026 — มติของคณะกรรมการทั้ง 47 จังหวัด (3 กันยายน 2026)</em> ตัวเลขคือค่าจ้างขั้นต่ำต่อชั่วโมงของแต่ละจังหวัด (地域別最低賃金) ก่อนหักภาษีและประกันสังคม`,
    phaseH: "⚠ อัตราใหม่ทยอยมีผล — ตรวจสอบวันที่ของจังหวัดคุณ",
    phase: [
      `<b>ตารางนี้แสดงอัตราปีงบประมาณ 2026</b> คณะกรรมการของทั้ง 47 จังหวัดได้เสนอตัวเลขครบภายใน <b>3 กันยายน 2026</b> และแต่ละอัตรามีผลตามวันที่ในคอลัมน์ <em>มีผล</em> ตั้งแต่ <b>${fmtDate(effFrom, "th")}</b> (${prefList(effFromPrefs.slice(0, 6).map((p) => p.pref), "และ")} และอีก ${effFromPrefs.length - 6} จังหวัด) จนถึง <b>${fmtDate(effTo, "th")}</b> (${effToPrefs.join(", ")})`,
      `<b>ก่อนถึงวันที่ของจังหวัดคุณ อัตราปีงบประมาณ 2025 ยังเป็นขั้นต่ำตามกฎหมาย</b> ซึ่งก็คือตัวเลขใหม่ลบด้วยจำนวนที่ปรับขึ้นในช่องข้าง ๆ (${highest.pref}: ${yen(highest.prev)} จนถึง ${fmtDate(highest.effective, "th")} จากนั้นเป็น ${yen(highest.amount)}) บนเดสก์ท็อป วางเมาส์บนตัวเลขที่ปรับขึ้นเพื่อดูอัตราเก่าและใหม่`,
      `มติของคณะกรรมการจะเป็นที่สิ้นสุดเมื่อผู้อำนวยการสำนักงานแรงงานจังหวัดออกคำวินิจฉัย MHLW ระบุว่าวันที่มีผลอาจเลื่อนได้หากมีการยื่นคัดค้าน โปรดยืนยันจังหวัดของคุณใน<a href="${MHLW_LIST}" target="_blank" rel="noopener">รายการของ MHLW</a>ก่อนนำไปใช้`,
    ],
    phaseSrc: `แหล่งข้อมูล: ข่าวประชาสัมพันธ์ MHLW, 3 กันยายน 2026 — <a href="${MHLW_RELEASE}" target="_blank" rel="noopener">ทั้ง 47 จังหวัดเสนอตัวเลขครบแล้ว</a> · <a href="${MHLW_PDF}" target="_blank" rel="noopener">ตารางรายจังหวัด (PDF)</a>`,
    glanceH: "ภาพรวม",
    g1: "ค่าเฉลี่ยถ่วงน้ำหนักทั่วประเทศ", g1sub: `เพิ่มขึ้น +${yen(DATA.national_raise).slice(1)} (+${natPct}%) จากปีก่อน`,
    g2: "สูงสุด", g2sub: `${esc(highest.pref)}`,
    g3: "ต่ำสุด", g3sub: `${lowestPrefs.map(esc).join(" · ")}`,
    g4: "ต่ำสุด ÷ สูงสุด", g4v: `${ratioPct}%`, g4sub: "ช่องว่างแคบลงต่อเนื่องเป็นปีที่ 12",
    tableH: "ทั้ง 47 จังหวัด จัดอันดับ",
    tableNote: "เรียงตามค่าจ้างต่อชั่วโมง สูงสุดก่อน มีผล = วันที่อัตราใหม่เริ่มใช้ในจังหวัดนั้น แตะชื่อจังหวัดเพื่อดูคู่มือการใช้ชีวิตและท่องเที่ยว",
    col: ["#", "จังหวัด", "¥ / ชม.", "เพิ่ม", "มีผล", "ภูมิภาค"],
    jlf: { h: "รู้ค่าแรงแล้ว แล้วใน 47 จังหวัดนี้ ที่ไหนเหมาะกับคุณ", p: "เราสร้างแบบทดสอบฟรี 8 คำถาม ไม่ใช่ที่ที่ดีที่สุดในญี่ปุ่น แต่เป็นที่ที่เหมาะกับคุณ โดยเปรียบเทียบ 60 เทศบาลจากข้อมูลจริงเรื่องภูมิอากาศ ที่อยู่อาศัย และการใช้ชีวิตโดยไม่มีรถยนต์ พร้อมบอกด้วยว่าอะไรที่ยังตรวจสอบไม่ได้ ไม่ต้องกรอกชื่อ ไม่ต้องกรอกอีเมล เครื่องมือนี้เป็นภาษาอังกฤษ", cta: "ลองใช้ Japan Living Fit", src: "nhb_minwage_th" },
    payH: "มีความหมายอย่างไรต่อเงินเดือนของคุณ",
    pay: `ตัวเลขเหล่านี้คือ<em>ค่าจ้างขั้นต่ำต่อชั่วโมง</em> — ขั้นต่ำตามกฎหมายที่นายจ้างจ่ายได้ ก่อนหักภาษีและประกัน หากประเมินแบบทำงานเต็มเวลา (40 ชั่วโมงต่อสัปดาห์) ${yen(highest.amount)} เท่ากับประมาณ ${yen(monthly(highest.amount))} ต่อเดือนก่อนหัก และ ${yen(lowest.amount)} ประมาณ ${yen(monthly(lowest.amount))} ภาษีเงินได้ ภาษีผู้อยู่อาศัย ประกันสุขภาพ และเงินบำนาญ มักหักรวมราว 15–20% ดังนั้นเงินที่ได้รับจริงจะน้อยกว่า ค่าจ้างที่สูงกว่ามักมาพร้อมค่าเช่าที่สูงกว่า โตเกียวจ่ายมากที่สุดแต่ก็มีค่าครองชีพสูงที่สุด จึงควรเทียบค่าจ้างกับค่าเช่าในพื้นที่ก่อนเลือกที่ทำงาน`,
    sswH: "หากคุณมาด้วยวีซ่าแรงงานทักษะเฉพาะ (特定技能)",
    ssw: `งานแรงงานทักษะเฉพาะ (SSW / โทคุเทกิ กิโน) ในสาขาเช่น การดูแลผู้สูงอายุ บริการอาหาร และการผลิต ต้องจ่ายอย่างน้อยเท่าค่าจ้างขั้นต่ำของจังหวัดนั้น และกฎหมายแรงงานญี่ปุ่นกำหนดให้จ่ายเท่ากันหรือมากกว่าคนญี่ปุ่นที่ทำงานเดียวกัน ใช้ตารางนี้เปรียบเทียบภูมิภาค ค่าจ้างที่ต่ำกว่าเล็กน้อยในจังหวัดที่ค่าเช่าถูกอาจเหลือเงินปลายเดือนมากกว่าค่าจ้างสูงในใจกลางโตเกียว ตรวจสอบค่าจ้าง ชั่วโมงทำงาน และรายการหักในสัญญาจ้าง (雇用契約書) ทุกครั้งก่อนเซ็น และหากสัญญาของคุณเซ็นด้วยอัตราปีงบประมาณ 2025 ค่าจ้างขั้นต่ำใหม่ของจังหวัดจะมีผลโดยอัตโนมัติตั้งแต่วันที่มีผล`,
    remitH: "ส่งเงินกลับบ้าน",
    remit: `ผู้พำนักจำนวนมากที่ส่งเงินส่วนหนึ่งกลับต่างประเทศ ใช้บริการโอนเงินค่าธรรมเนียมต่ำเพื่อเลี่ยงส่วนต่างอัตราแลกเปลี่ยนที่สูงของการโอนผ่านธนาคาร <a href="https://wise.com/card/" data-aff="wise" data-aff-fallback="https://wise.com/card/" target="_blank" rel="noopener">Wise</a> เป็นตัวเลือกหนึ่งที่ใช้กันแพร่หลาย ลองเทียบค่าธรรมเนียมและอัตราแลกเปลี่ยนกับธนาคารของคุณสำหรับเส้นทางของคุณเองก่อนตัดสินใจ`,
    targetH: "ทิศทางต่อไป",
    target: `การปรับปีงบประมาณ 2026 เพิ่มค่าเฉลี่ยถ่วงน้ำหนักทั่วประเทศ ${yen(DATA.national_raise)} (${yen(DATA.national_prev)} → ${yen(DATA.national_weighted_average)}, +${natPct}%) มากเป็นอันดับสองนับตั้งแต่เริ่มระบบแนวทางในปี 1978 รองจาก ¥66 ของปีงบประมาณ 2025 มี ${nAboveGuideline} จังหวัดที่กำหนดสูงกว่าแนวทางของคณะกรรมการกลาง (¥54–56) การปรับขึ้นจึงอยู่ระหว่าง ${yen(raiseMin)} ถึง ${yen(raiseMax)} โดยสูงสุดคือ ${topRaiseStr(", ")} ช่องว่างระหว่างอัตราต่ำสุดกับสูงสุดแคบลงต่อเนื่องเป็นปีที่ 12 อยู่ที่ ${ratioPct}% รัฐบาลตั้งเป้าค่าเฉลี่ยทั่วประเทศ ¥1,500/ชม. ภายในปลายทศวรรษ 2020 หากขึ้นปีละ ${yen(DATA.national_raise)} จะไปถึงราวปี 2032 ขนาดของแนวทางในแต่ละฤดูร้อนจึงเป็นสิ่งที่ต้องจับตา`,
    faqH: "คำถามที่พบบ่อย",
    faq: [
      ["ค่าจ้างขั้นต่ำในญี่ปุ่นปี 2026 เท่าไร?", `ญี่ปุ่นไม่มีค่าจ้างขั้นต่ำระดับประเทศเพียงค่าเดียว — กำหนดแยกตามจังหวัด ในการปรับปีงบประมาณ 2026 ค่าเฉลี่ยถ่วงน้ำหนักทั่วประเทศอยู่ที่ ${yen(DATA.national_weighted_average)} ต่อชั่วโมง ตั้งแต่ ${yen(lowest.amount)} (${lowestPrefs.join(", ")}) ถึง ${yen(highest.amount)} (${highest.pref}) อัตราใหม่ทยอยมีผลระหว่าง ${fmtDate(effFrom, "th")} ถึง ${fmtDate(effTo, "th")} ทีละจังหวัด ตัวเลขทั้งหมดเป็นต่อชั่วโมง ก่อนหักภาษี`],
      ["จังหวัดใดมีค่าจ้างขั้นต่ำสูงสุด?", `${highest.pref} สูงสุดที่ ${yen(highest.amount)} ต่อชั่วโมง รองลงมาคือ ${ranked[1].pref} (${yen(ranked[1].amount)}) และ ${ranked[2].pref} (${yen(ranked[2].amount)})`],
      ["จังหวัดใดมีค่าจ้างขั้นต่ำต่ำสุด?", `${lowestPrefs.join(", ")} ต่ำสุดที่ ${yen(lowest.amount)} ต่อชั่วโมง รองลงมาคือ ${prefList(secondLowestPrefs, "และ")} ที่ ${yen(secondLowestAmt)} ขณะนี้ทุกจังหวัดอยู่ที่ ${yen(lowest.amount)} ขึ้นไป`],
      ["อัตราปี 2026 เริ่มมีผลเมื่อใด?", `แต่ละจังหวัดกำหนดวันมีผลเอง อัตราปีงบประมาณ 2026 มีผลระหว่าง ${fmtDate(effFrom, "th")} (${effFromPrefs.length} จังหวัด รวมถึง ${prefList(effFromPrefs.slice(0, 6).map((p) => p.pref), "และ")}) ถึง ${fmtDate(effTo, "th")} (${effToPrefs.join(", ")}) ก่อนถึงวันที่ของจังหวัดคุณ อัตราปีงบประมาณ 2025 ยังเป็นค่าจ้างขั้นต่ำตามกฎหมาย`],
      ["ค่าจ้างขั้นต่ำในญี่ปุ่นปี 2025 เท่าไร?", `ในการปรับปีงบประมาณ 2025 ซึ่งยังเป็นขั้นต่ำในแต่ละจังหวัดจนถึงวันที่มีผลของปี 2026 ค่าเฉลี่ยถ่วงน้ำหนักทั่วประเทศอยู่ที่ ${yen(DATA.national_prev)} ตั้งแต่ ${yen(prevLowest)} (${prevLowestPrefs.join(", ")}) ถึง ${yen(prevHighest)} (${highest.pref}) เป็นปีแรกที่ทุกจังหวัดเกิน ¥1,000/ชั่วโมง`],
      ["จังหวัดของฉันขึ้นเท่าไร?", `ระหว่าง ${yen(raiseMin)} ถึง ${yen(raiseMax)} ต่อชั่วโมง สามจังหวัดกลุ่ม A ที่ตามแนวทาง (${ranked.filter((p) => p.raise === raiseMin).map((p) => p.pref).join(", ")}) ขึ้น ${yen(raiseMin)} จังหวัดอื่นส่วนใหญ่ ¥56–61 ที่ขึ้นมากที่สุดคือ ${topRaiseStr(", ")} ดูคอลัมน์ "เพิ่ม"`],
    ],
    relH: "ที่เกี่ยวข้อง",
    relMove: "ย้ายมาญี่ปุ่น: ไทม์ไลน์ที่ใช้ได้จริง",
    relSsw: "แบบทดสอบแรงงานทักษะเฉพาะ (特定技能)",
    relGuides: "คู่มือครบ 47 จังหวัด",
    disc: "ข้อมูลทั่วไปเท่านั้น รวบรวมจากข้อมูลทางการของ MHLW ณ วันที่ด้านล่าง — ไม่ใช่คำแนะนำทางกฎหมายหรือการจ้างงาน ค่าจ้างขั้นต่ำมีการปรับทุกปี โปรดตรวจสอบตัวเลขปัจจุบันของจังหวัดคุณที่ mhlw.go.jp ก่อนนำไปใช้",
    updated: "ข้อมูล: มติคณะกรรมการ MHLW ปีงบประมาณ 2026 (3 ก.ย. 2026) · ปรับปรุงหน้าเมื่อ",
    allGuides: "← คู่มือทั้งหมด", freeQuiz: "ควิซฟรี",
  },
};

function page(lang) {
  const t = T[lang];
  const isEn = lang === "en";
  const cssPrefix = isEn ? "" : "../";
  const libPrefix = isEn ? "../" : "../../";
  const homePrefix = isEn ? "../" : "../../";
  const selfUrl = urlFor(lang);
  const movingHref = isEn ? "moving-to-japan-guide.html" : "../moving-to-japan-guide.html";
  const outRel = isEn ? `blog/${SLUG}.html` : `blog/${lang}/${SLUG}.html`;
  const updatedStr = UPDATED;

  const faqLd = {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: t.faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a.replace(/<[^>]+>/g, "") } })),
  };
  // BlogPosting + Organization(sameAs), same shape inject-evidence.mjs writes (marker kept so its
  // re-run replaces this block instead of stacking a second one). Key order matters for stamp-dates.mjs.
  const evidenceLd = {
    "@context": "https://schema.org", "@type": "BlogPosting",
    headline: t.title.replace(/\s+—\s+NihongoHub\s*$/, "").trim(),
    datePublished: firstCommitDate(outRel), dateModified: updatedStr,
    description: t.desc.replace(/<[^>]+>/g, ""), url: selfUrl, mainEntityOfPage: selfUrl,
    inLanguage: t.htmlLang, image: `${SITE}/og-default.png`,
    isPartOf: { "@type": "WebSite", name: "NihongoHub", url: SITE + "/" },
    author: { "@type": "Organization", name: "NihongoHub", url: SITE + "/", sameAs: SAMEAS },
    publisher: { "@type": "Organization", name: "NihongoHub", url: SITE + "/", logo: { "@type": "ImageObject", url: SITE + "/apple-touch-icon.png" } },
  };

  const hreflang = LANGS.map((L) => `<link rel="alternate" hreflang="${L}" href="${urlFor(L)}">`).join("\n")
    + `\n<link rel="alternate" hreflang="x-default" href="${urlFor("en")}">`;

  const switcher = `<span class="langsw">` + LANGS.map((L) => {
    if (L === lang) return `<a aria-current="page">${LANG_LABEL[L]}</a>`;
    const href = lang === "en" ? `${L}/${SLUG}.html` : (L === "en" ? `../${SLUG}.html` : `../${L}/${SLUG}.html`);
    return `<a href="${href}">${LANG_LABEL[L]}</a>`;
  }).join(" · ") + `</span>`;

  const glance = `
  <div class="mw-glance">
    <div class="mw-card"><span class="mw-k">${esc(t.g1)}</span><span class="mw-v">${yen(DATA.national_weighted_average)}</span><span class="mw-s">${t.g1sub}</span></div>
    <div class="mw-card"><span class="mw-k">${esc(t.g2)}</span><span class="mw-v">${yen(highest.amount)}</span><span class="mw-s">${esc(t.g2sub)}</span></div>
    <div class="mw-card"><span class="mw-k">${esc(t.g3)}</span><span class="mw-v">${yen(lowest.amount)}</span><span class="mw-s">${esc(t.g3sub)}</span></div>
    <div class="mw-card hl"><span class="mw-k">${esc(t.g4)}</span><span class="mw-v">${esc(t.g4v)}</span><span class="mw-s">${esc(t.g4sub)}</span></div>
  </div>`;

  // Phasing-in notice. Deliberately louder than .mw-tldr: between the council reports (Sept) and each
  // prefecture's effective date (Oct–Dec) the common error is quoting the new figure as if it were
  // already owed. The box states what applies today and links the reader to MHLW's list.
  const phase = `
  <div class="mw-next">
    <div class="mw-next-h">${esc(t.phaseH)}</div>
    ${t.phase.map((p) => `<p>${p}</p>`).join("\n    ")}
    <p class="mw-next-src">${t.phaseSrc}</p>
  </div>`;

  const table = `
  <div class="mw-tablewrap">
  <table class="mw-table">
    <thead><tr>${t.col.map((c, i) => `<th class="c${i}">${esc(c)}</th>`).join("")}</tr></thead>
    <tbody>
      ${tableRows(lang)}
    </tbody>
  </table>
  </div>`;

  const jlf = `
  <!--jlf-cta: Japan Living Fit funnel (2026-08-14, below the table since 2026-08-15, in the build script since 2026-09-23)-->
  <div style="background:var(--white,#fff);border:1px solid var(--soft,#ddd);border-left:3px solid var(--gold,#c8911f);border-radius:6px;padding:14px 18px;margin:26px 0">
    <b>${esc(t.jlf.h)}</b>
    <p style="margin:6px 0 10px;font-size:14.5px">${esc(t.jlf.p)}</p>
    <a data-aff="jlf" href="https://jlf-app.vercel.app/?src=${t.jlf.src}" target="_blank" rel="noopener">${esc(t.jlf.cta)} &#8594;</a>
  </div>`;

  const faqHtml = t.faq.map(([q, a]) => `<p><b>Q. ${esc(q)}</b><br>A. ${a}</p>`).join("\n  ");

  return `<!DOCTYPE html>
<html lang="${t.htmlLang}">
<head>
<link rel="canonical" href="${selfUrl}">
${hreflang}
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${esc(t.title)}</title>
<meta name="description" content="${esc(t.desc.replace(/<[^>]+>/g, ""))}">
<meta property="og:title" content="${esc(t.ogtitle)}">
<meta property="og:description" content="${esc(t.desc.replace(/<[^>]+>/g, ""))}">
<meta property="og:type" content="article">
<meta property="og:url" content="${selfUrl}">
<meta property="og:image" content="${SITE}/og-default.png">
<meta property="og:site_name" content="NihongoHub">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${SITE}/og-default.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,600;9..144,700&family=Karla:wght@400;500;700&family=Shippori+Mincho+B1:wght@700;800&family=Noto+Sans+JP:wght@400;700&family=Noto+Sans+Thai:wght@400;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${cssPrefix}blog.css">
<style>
.mw-tldr{background:var(--white);border:2px solid var(--ink);border-radius:8px;padding:14px 18px;margin:18px 0}
.mw-tldr b{font-family:var(--pixel);font-size:9px;color:var(--green);display:block;margin-bottom:6px;letter-spacing:1px}
.mw-tldr p{margin:0;font-size:15.5px}
.mw-src{font-size:12.5px;color:var(--muted);margin:6px 0 18px;border-left:3px solid var(--gold);padding:6px 12px;background:var(--white)}
.mw-next{background:#fff8e8;border:2px solid var(--gold);border-radius:8px;padding:15px 18px;margin:18px 0}
.mw-next-h{font-family:var(--pixel);font-size:9px;color:#8a5c00;letter-spacing:.6px;margin-bottom:10px;line-height:1.7}
.mw-next p{margin:0 0 9px}
.mw-next-src{font-size:12.5px;color:var(--muted);margin:11px 0 0;padding-top:9px;border-top:1px solid #e8d9b4}
.mw-glance{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:18px 0 8px}
.mw-card{background:var(--white);border:2px solid var(--soft);border-radius:8px;padding:12px;text-align:center}
.mw-card.hl{border-color:var(--green)}
.mw-k{display:block;font-family:var(--pixel);font-size:7.5px;color:var(--muted);letter-spacing:.5px;min-height:22px}
.mw-v{display:block;font-family:var(--dot);font-size:26px;color:var(--ink);margin:4px 0 2px}
.mw-s{display:block;font-size:11px;color:var(--muted);line-height:1.3}
.mw-tablewrap{overflow-x:auto;margin:14px 0}
.mw-table{border-collapse:collapse;width:100%;font-size:14px}
.mw-table th{font-family:var(--pixel);font-size:8px;color:var(--gold);background:var(--ink);padding:9px 8px;text-align:left;letter-spacing:.5px;position:sticky;top:0}
.mw-table td{padding:8px;border-bottom:1px solid var(--soft)}
.mw-table tr:nth-child(odd) td{background:var(--white)}
.mw-table td.r{color:var(--muted);font-variant-numeric:tabular-nums;width:30px}
.mw-table td.pf a{color:var(--ink);text-decoration:none;font-weight:600;border-bottom:1px dotted var(--soft)}
.mw-table td.w{font-family:var(--dot);font-size:16px;color:var(--ink);font-variant-numeric:tabular-nums;white-space:nowrap}
.mw-table td.up{color:var(--green);font-variant-numeric:tabular-nums;white-space:nowrap;cursor:help}
.mw-table td.dt,.mw-table td.rg{color:var(--muted);font-size:12.5px;white-space:nowrap}
.mw-table tr:nth-child(1) td.w,.mw-table tr:nth-child(2) td.w,.mw-table tr:nth-child(3) td.w{color:var(--red)}
/* On phones the Region column gives way, not the date: while rates phase in (Oct–Dec) the date is the answer. */
@media(max-width:620px){.mw-glance{grid-template-columns:repeat(2,1fr)}.mw-v{font-size:22px}.mw-table td.rg{display:none}.mw-table th.c5{display:none}}
</style>
<script type="application/ld+json">${JSON.stringify(faqLd)}</script>
<script src="${libPrefix}lib/config.js" defer></script>
<script defer src="/_vercel/insights/script.js"></script>
<!--evidence-ld--><script type="application/ld+json">${JSON.stringify(evidenceLd)}</script><!--/evidence-ld-->
</head>
<body>
<nav class="bnav">
  <a class="logo" href="${homePrefix}index.html">Nihongo<span>Hub</span></a>
  <a href="index.html">${esc(t.allGuides)}</a>
  ${switcher}
  <a class="cta" href="${homePrefix}index.html#practice">${esc(t.freeQuiz)}</a>
</nav>
<article class="wrap">
  <div class="tag">${esc(t.tag)}</div>
  <h1>${esc(t.h1)}</h1>
  <div class="hero-img" role="img" aria-label="Japan minimum wage" style="height:150px;border-radius:8px;margin:12px 0 16px;background:linear-gradient(135deg,#16100a,#2a1d0a 60%,#c8911f);display:flex;align-items:center;justify-content:center">
    <span style="font-family:'Noto Sans JP',sans-serif;font-size:46px;color:rgba(255,255,255,.16)">最低賃金</span>
  </div>
  <p class="lede">${esc(t.lede)}</p>

  <div class="mw-tldr"><b>${esc(t.tldrH)}</b><p>${t.tldr}</p></div>
  <div class="mw-src">${t.sourceLine}</div>
${phase}

  <h2>${esc(t.glanceH)}</h2>
  ${glance}

  <h2>${esc(t.tableH)}</h2>
  <p style="font-size:13.5px;color:var(--muted);margin:2px 0 0">${esc(t.tableNote)}</p>
  ${table}
${jlf}

  <h2>${esc(t.payH)}</h2>
  <p>${t.pay}</p>

  <h2>${esc(t.sswH)}</h2>
  <p>${t.ssw}</p>

  <h2>${esc(t.remitH)}</h2>
  <p>${t.remit}</p>

  <h2>${esc(t.targetH)}</h2>
  <p>${t.target}</p>

  <section class="faq" aria-label="${esc(t.faqH)}" style="margin:24px 0">
  <h2>${esc(t.faqH)}</h2>
  ${faqHtml}
  </section>

  <h2>${esc(t.relH)}</h2>
  <div class="pxrel">
    <div class="pxrel-row">
      <a href="${movingHref}">${esc(t.relMove)} →</a>
      <a href="${homePrefix}tokutei-ginou-id.html">${esc(t.relSsw)} →</a>
      <a href="index.html">${esc(t.relGuides)} →</a>
    </div>
  </div>

  <div class="sources">
    ${t.disc}<br>
    ${esc(t.updated)} ${updatedStr}. <a href="${MHLW_LIST}" target="_blank" rel="noopener">MHLW 地域別最低賃金</a>.
  </div>
</article>
<footer>© 2026 NihongoHub · <a href="index.html">${esc(t.allGuides.replace(/[←-]/g, "").trim())}</a> · <a href="${homePrefix}index.html">Home</a></footer>
<!-- 計測 (2026-08-23): これが無いと pv_blog__<slug> も aff_* も飛ばず、記事別レポートに行が出ない -->
<script src="${cssPrefix}blog-quiz.js" defer><\/script>
</body>
</html>
`;
}

export function build() {
  let n = 0;
  for (const lang of LANGS) {
    if (lang === "en") {
      writeFileSync(new URL(`blog/${SLUG}.html`, ROOT), page("en"));
    } else {
      mkdirSync(new URL(`blog/${lang}/`, ROOT), { recursive: true });
      writeFileSync(new URL(`blog/${lang}/${SLUG}.html`, ROOT), page(lang));
    }
    n++;
  }
  console.log(`wrote ${n} minimum-wage articles (${LANGS.join("/")}) — ${DATA.fiscal_year}, national avg ${yen(DATA.national_weighted_average)}, ${ranked.length} prefectures, effective ${effFrom}..${effTo}`);
}

// Run the build only when executed directly, so proofread-minwage.mjs can `import { T }`
// without triggering a rebuild (no side effects on import).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) build();
