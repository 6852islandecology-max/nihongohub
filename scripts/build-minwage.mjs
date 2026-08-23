/**
 * Build the "Japan minimum wage by prefecture (2025-26)" article — multilingual.
 * Data-driven from data/min-wage-2025.json (official MHLW figures) so the 47-row
 * table is never hand-typed (no transcription/fabrication risk). Re-run yearly
 * after updating the JSON. Output per language:
 *   en -> blog/minimum-wage-japan-2025.html
 *   <lang> -> blog/<lang>/minimum-wage-japan-2025.html   (id, es, th)
 *
 * Languages chosen by competition density (competitive-analysis-2026-06-15.md):
 * en (gap for all-47 ranked) + id (spearhead) + es/th (thin). zh omitted (saturated).
 *
 * Run: node scripts/build-minwage.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { pathToFileURL } from "node:url";

const ROOT = new URL("../", import.meta.url);
const DATA = JSON.parse(readFileSync(new URL("data/min-wage-2025.json", ROOT), "utf8"));
const SLUG = "minimum-wage-japan-2025";
const SITE = "https://www.nihongo-hub.com";
const LANGS = ["en", "id", "es", "th"];
const LANG_LABEL = { en: "EN", id: "ID", es: "ES", th: "TH" };
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const yen = (n) => "¥" + n.toLocaleString("en-US"); // comma grouping = international yen convention

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
const fmtDate = (iso, lang) => {
  const [y, m, d] = iso.split("-").map(Number);
  const mon = MONTHS[lang][m - 1];
  return (lang === "en" || lang === "id") ? `${mon} ${d}, ${y}` : `${d} ${mon} ${y}`;
};
// illustrative full-time monthly (40h/week), before tax — transparent calc, clearly labelled
const monthly = (hourly) => Math.round((hourly * 40 * 52) / 12 / 1000) * 1000;
const urlFor = (L) => (L === "en" ? `${SITE}/blog/${SLUG}.html` : `${SITE}/blog/${L}/${SLUG}.html`);

function tableRows(lang) {
  return ranked.map((p) => {
    const slug = p.pref.toLowerCase();
    // en links to blog/<slug>.html (all 47 exist); a localized article links to its own
    // blog/<lang>/<slug>.html when that translation exists, else the English guide.
    const href = lang === "en"
      ? `${slug}.html`
      : (existsSync(new URL(`blog/${lang}/${slug}.html`, ROOT)) ? `${slug}.html` : `../${slug}.html`);
    const name = `<a href="${href}">${esc(p.pref)}</a>`;
    return `<tr><td class="r">${p.rank}</td><td class="pf">${name}</td><td class="w">${yen(p.amount)}</td><td class="up">+${p.raise}</td><td class="dt">${fmtDate(p.effective, lang)}</td><td class="rg">${REGION[lang][p.region]}</td></tr>`;
  }).join("\n      ");
}

export const T = {
  en: {
    htmlLang: "en",
    title: "Japan Minimum Wage by Prefecture (2025–26): All 47, Ranked — NihongoHub",
    desc: `The official 2025 regional minimum wage for all 47 Japanese prefectures (Ministry of Health, Labour and Welfare) — ranked, with each raise and effective date. For the first time on record, every prefecture is above ¥1,000/hour. National average ${yen(DATA.national_weighted_average)}.`,
    ogtitle: "Japan Minimum Wage by Prefecture (2025–26) — all 47, ranked",
    tag: "▶ WORKING IN JAPAN · DATA",
    h1: "Japan Minimum Wage by Prefecture (2025–26)",
    lede: "Japan sets its minimum wage by prefecture, not nationally. Here are the official 2025 figures for all 47 — ranked from highest to lowest, with the raise and the date each took effect.",
    tldrH: "Short answer",
    tldr: `Japan's minimum wage is set per prefecture. After the FY2025 revision, ${esc(highest.pref)} is highest at ${yen(highest.amount)}/hour; ${lowestPrefs.map(esc).join(", ")} are lowest at ${yen(lowest.amount)}. The national weighted average is ${yen(DATA.national_weighted_average)} — and for the first time on record, all 47 prefectures clear ¥1,000/hour. All figures are hourly, before tax.`,
    sourceLine: `Source: Ministry of Health, Labour and Welfare (MHLW), <em>FY2025 Regional Minimum Wages — National List</em>. Figures are the prefectural hourly minimum (地域別最低賃金), before tax and social insurance.`,
    glanceH: "At a glance",
    g1: "National weighted average", g1sub: `up +${yen(DATA.national_raise).slice(1)} (+${DATA.national_pct}%) on the year`,
    g2: "Highest", g2sub: `${esc(highest.pref)}`,
    g3: "Lowest", g3sub: `${lowestPrefs.map(esc).join(" · ")}`,
    g4: "Prefectures ≥ ¥1,000", g4sub: "first time on record (all 47)",
    tableH: "All 47 prefectures, ranked",
    tableNote: "Ranked by hourly rate, highest first. Tap a prefecture for its living-and-travel guide.",
    col: ["#", "Prefecture", "¥ / hour", "Raise", "Effective", "Region"],
    payH: "What this means for your paycheck",
    pay: `These are <em>hourly minimums</em> — the legal floor an employer may pay, before tax and insurance. As a rough full-time guide (40 hours a week), ${yen(highest.amount)} works out to about ${yen(monthly(highest.amount))} a month before deductions, and ${yen(lowest.amount)} to about ${yen(monthly(lowest.amount))}. Income tax, residence tax, health insurance and pension typically take roughly 15–20% off the top, so take-home pay is lower. A higher headline wage also tends to come with higher rent: Tokyo pays the most but also costs the most to live in, so compare wages against local rent before choosing where to work.`,
    sswH: "If you're coming on a Specified Skilled Worker (特定技能) visa",
    ssw: `Specified Skilled Worker (SSW / tokutei ginō) jobs in fields like caregiving, food service and manufacturing must pay at least the local prefectural minimum, and Japanese labour law requires equal-or-better pay than a Japanese worker doing the same job. Use the table to compare regions: a slightly lower wage in a low-rent prefecture can leave more money at the end of the month than a high wage in central Tokyo. Always confirm the wage, working hours and deductions written in your employment contract (雇用契約書) before you sign.`,
    remitH: "Sending money home",
    remit: `Many residents who send part of their pay abroad use a low-fee transfer service to avoid the high spread on bank wires. <a href="https://wise.com/" data-aff="wise" data-aff-fallback="https://wise.com/" target="_blank" rel="noopener">Wise</a> is one widely used option; compare its fee and exchange rate against your bank for your own corridor before deciding.`,
    targetH: "Where it's heading",
    target: `The figures above are the 2025 revision, which took effect between October 2025 and March 2026 depending on the prefecture. The government has stated a goal of lifting the national average to ¥1,500/hour by the late 2020s, so expect further annual increases.`,
    faqH: "Common questions",
    faq: [
      ["What is the minimum wage in Japan in 2025?", `Japan has no single national minimum wage — it is set per prefecture. After the FY2025 revision the national weighted average is ${yen(DATA.national_weighted_average)} per hour, ranging from ${yen(lowest.amount)} (${lowestPrefs.join(", ")}) to ${yen(highest.amount)} (${highest.pref}). All figures are hourly, before tax.`],
      ["Which prefecture has the highest minimum wage?", `${highest.pref} has the highest at ${yen(highest.amount)} per hour, followed by ${ranked[1].pref} (${yen(ranked[1].amount)}) and ${ranked[2].pref} (${yen(ranked[2].amount)}).`],
      ["Which prefecture has the lowest minimum wage?", `${lowestPrefs.join(", ")} share the lowest at ${yen(lowest.amount)} per hour. As of the 2025 revision, every one of the 47 prefectures is at or above ¥1,000 for the first time.`],
      ["When did the 2025 minimum wages take effect?", `Each prefecture sets its own effective date. The 2025 rates took effect between October 2025 and March 2026; all listed figures are in force as of June 2026.`],
    ],
    relH: "Related",
    relMove: "Moving to Japan: the practical timeline",
    relSsw: "Specified Skilled Worker (特定技能) practice test",
    relGuides: "All 47 prefecture guides",
    disc: "General information only, compiled from official MHLW data on the date below — not legal or employment advice. Minimum wages are revised every year; confirm the current figure for your prefecture at mhlw.go.jp before relying on it.",
    updated: "Data: MHLW FY2025 revision · page compiled",
    allGuides: "← All guides", freeQuiz: "FREE QUIZ",
  },
  id: {
    htmlLang: "id",
    title: "Upah Minimum Jepang per Prefektur (2025–26): 47 Prefektur, Diurutkan — NihongoHub",
    desc: `Upah minimum regional resmi 2025 untuk seluruh 47 prefektur Jepang (Kementerian Kesehatan, Tenaga Kerja dan Kesejahteraan) — diurutkan, dengan kenaikan dan tanggal berlaku. Untuk pertama kalinya, semua prefektur di atas ¥1,000/jam. Rata-rata nasional ${yen(DATA.national_weighted_average)}.`,
    ogtitle: "Upah Minimum Jepang per Prefektur (2025–26) — 47 prefektur, diurutkan",
    tag: "▶ KERJA DI JEPANG · DATA",
    h1: "Upah Minimum Jepang per Prefektur (2025–26)",
    lede: "Jepang menetapkan upah minimum per prefektur, bukan secara nasional. Berikut angka resmi 2025 untuk semua 47 prefektur — diurutkan dari tertinggi ke terendah, lengkap dengan kenaikan dan tanggal mulai berlaku.",
    tldrH: "Jawaban singkat",
    tldr: `Upah minimum Jepang ditetapkan per prefektur. Setelah revisi tahun fiskal 2025, ${esc(highest.pref)} tertinggi dengan ${yen(highest.amount)}/jam; ${lowestPrefs.map(esc).join(", ")} terendah dengan ${yen(lowest.amount)}. Rata-rata tertimbang nasional adalah ${yen(DATA.national_weighted_average)} — dan untuk pertama kalinya, seluruh 47 prefektur melewati ¥1,000/jam. Semua angka adalah per jam, sebelum pajak.`,
    sourceLine: `Sumber: Kementerian Kesehatan, Tenaga Kerja dan Kesejahteraan (MHLW), <em>Upah Minimum Regional Tahun Fiskal 2025 — Daftar Nasional</em>. Angka merupakan upah minimum per jam tiap prefektur (地域別最低賃金), sebelum pajak dan asuransi sosial.`,
    glanceH: "Sekilas",
    g1: "Rata-rata tertimbang nasional", g1sub: `naik +${yen(DATA.national_raise).slice(1)} (+${DATA.national_pct}%) dari tahun lalu`,
    g2: "Tertinggi", g2sub: `${esc(highest.pref)}`,
    g3: "Terendah", g3sub: `${lowestPrefs.map(esc).join(" · ")}`,
    g4: "Prefektur ≥ ¥1,000", g4sub: "pertama kali (semua 47)",
    tableH: "Seluruh 47 prefektur, diurutkan",
    tableNote: "Diurutkan menurut upah per jam, tertinggi dulu. Ketuk nama prefektur untuk panduan hidup-dan-wisatanya.",
    col: ["#", "Prefektur", "¥ / jam", "Naik", "Berlaku", "Wilayah"],
    payH: "Apa artinya untuk gaji Anda",
    pay: `Ini adalah <em>upah minimum per jam</em> — batas bawah legal yang boleh dibayar perusahaan, sebelum pajak dan asuransi. Sebagai perkiraan kasar kerja penuh waktu (40 jam seminggu), ${yen(highest.amount)} setara sekitar ${yen(monthly(highest.amount))} per bulan sebelum potongan, dan ${yen(lowest.amount)} sekitar ${yen(monthly(lowest.amount))}. Pajak penghasilan, pajak penduduk, asuransi kesehatan dan pensiun biasanya memotong sekitar 15–20%, jadi gaji bersih lebih rendah. Upah tinggi biasanya juga berarti sewa tinggi: Tokyo membayar paling banyak tetapi juga paling mahal untuk ditinggali, jadi bandingkan upah dengan sewa setempat sebelum memilih tempat kerja.`,
    sswH: "Jika Anda datang dengan visa Pekerja Berketerampilan Spesifik (特定技能)",
    ssw: `Pekerjaan Tokutei Ginō (SSW) di bidang seperti perawatan (kaigo), jasa makanan, dan manufaktur wajib membayar setidaknya upah minimum prefektur setempat, dan hukum ketenagakerjaan Jepang mewajibkan upah yang setara atau lebih tinggi dibanding pekerja Jepang pada pekerjaan yang sama. Gunakan tabel untuk membandingkan wilayah: upah sedikit lebih rendah di prefektur bersewa murah bisa menyisakan lebih banyak uang di akhir bulan dibanding upah tinggi di pusat Tokyo. Selalu periksa upah, jam kerja, dan potongan yang tertulis di kontrak kerja (雇用契約書) sebelum menandatangani.`,
    remitH: "Mengirim uang ke kampung halaman",
    remit: `Banyak penduduk yang mengirim sebagian gajinya ke luar negeri memakai layanan transfer berbiaya rendah untuk menghindari selisih kurs tinggi pada transfer bank. <a href="https://wise.com/" data-aff="wise" data-aff-fallback="https://wise.com/" target="_blank" rel="noopener">Wise</a> adalah salah satu pilihan yang banyak dipakai; bandingkan biaya dan kursnya dengan bank Anda untuk koridor Anda sendiri sebelum memutuskan.`,
    targetH: "Arah ke depan",
    target: `Angka di atas adalah revisi 2025, yang berlaku antara Oktober 2025 dan Maret 2026 tergantung prefekturnya. Pemerintah menyatakan target menaikkan rata-rata nasional menjadi ¥1,500/jam pada akhir 2020-an, jadi kenaikan tahunan lanjutan dapat diperkirakan.`,
    faqH: "Pertanyaan umum",
    faq: [
      ["Berapa upah minimum di Jepang pada 2025?", `Jepang tidak punya satu upah minimum nasional — ditetapkan per prefektur. Setelah revisi tahun fiskal 2025, rata-rata tertimbang nasional adalah ${yen(DATA.national_weighted_average)} per jam, berkisar dari ${yen(lowest.amount)} (${lowestPrefs.join(", ")}) hingga ${yen(highest.amount)} (${highest.pref}). Semua angka per jam, sebelum pajak.`],
      ["Prefektur mana yang upah minimumnya tertinggi?", `${highest.pref} tertinggi dengan ${yen(highest.amount)} per jam, diikuti ${ranked[1].pref} (${yen(ranked[1].amount)}) dan ${ranked[2].pref} (${yen(ranked[2].amount)}).`],
      ["Prefektur mana yang upah minimumnya terendah?", `${lowestPrefs.join(", ")} terendah dengan ${yen(lowest.amount)} per jam. Pada revisi 2025, seluruh 47 prefektur berada di atas atau sama dengan ¥1,000 untuk pertama kalinya.`],
      ["Kapan upah minimum 2025 mulai berlaku?", `Tiap prefektur menetapkan tanggal berlakunya sendiri. Tarif 2025 berlaku antara Oktober 2025 dan Maret 2026; semua angka yang tercantum sudah berlaku per Juni 2026.`],
    ],
    relH: "Terkait",
    relMove: "Pindah ke Jepang: garis waktu praktis",
    relSsw: "Tes latihan Pekerja Berketerampilan Spesifik (特定技能)",
    relGuides: "Semua 47 panduan prefektur",
    disc: "Hanya informasi umum, disusun dari data resmi MHLW pada tanggal di bawah — bukan nasihat hukum atau ketenagakerjaan. Upah minimum direvisi setiap tahun; pastikan angka terkini untuk prefektur Anda di mhlw.go.jp sebelum mengandalkannya.",
    updated: "Data: revisi MHLW TF2025 · halaman disusun",
    allGuides: "← Semua panduan", freeQuiz: "KUIS GRATIS",
  },
  es: {
    htmlLang: "es",
    title: "Salario mínimo en Japón por prefectura (2025–26): las 47, clasificadas — NihongoHub",
    desc: `El salario mínimo regional oficial de 2025 para las 47 prefecturas de Japón (Ministerio de Salud, Trabajo y Bienestar) — clasificado, con el aumento y la fecha de entrada en vigor. Por primera vez, todas las prefecturas superan los ¥1,000/hora. Promedio nacional ${yen(DATA.national_weighted_average)}.`,
    ogtitle: "Salario mínimo en Japón por prefectura (2025–26) — las 47, clasificadas",
    tag: "▶ TRABAJAR EN JAPÓN · DATOS",
    h1: "Salario mínimo en Japón por prefectura (2025–26)",
    lede: "Japón fija el salario mínimo por prefectura, no a nivel nacional. Aquí están las cifras oficiales de 2025 para las 47, ordenadas de mayor a menor, con el aumento y la fecha en que entró en vigor cada una.",
    tldrH: "Respuesta breve",
    tldr: `El salario mínimo de Japón se fija por prefectura. Tras la revisión del año fiscal 2025, ${esc(highest.pref)} es el más alto con ${yen(highest.amount)}/hora; ${lowestPrefs.map(esc).join(", ")} son los más bajos con ${yen(lowest.amount)}. El promedio ponderado nacional es ${yen(DATA.national_weighted_average)} y, por primera vez, las 47 prefecturas superan los ¥1,000/hora. Todas las cifras son por hora, antes de impuestos.`,
    sourceLine: `Fuente: Ministerio de Salud, Trabajo y Bienestar (MHLW), <em>Salarios mínimos regionales del año fiscal 2025 — Lista nacional</em>. Las cifras son el mínimo prefectural por hora (地域別最低賃金), antes de impuestos y seguros sociales.`,
    glanceH: "De un vistazo",
    g1: "Promedio ponderado nacional", g1sub: `+${yen(DATA.national_raise).slice(1)} (+${DATA.national_pct}%) respecto al año anterior`,
    g2: "Más alto", g2sub: `${esc(highest.pref)}`,
    g3: "Más bajo", g3sub: `${lowestPrefs.map(esc).join(" · ")}`,
    g4: "Prefecturas ≥ ¥1,000", g4sub: "por primera vez (las 47)",
    tableH: "Las 47 prefecturas, clasificadas",
    tableNote: "Ordenadas por tarifa por hora, de mayor a menor. Toca una prefectura para ver su guía de vida y viaje.",
    col: ["#", "Prefectura", "¥ / hora", "Subida", "En vigor", "Región"],
    payH: "Qué significa para tu sueldo",
    pay: `Estas son <em>tarifas mínimas por hora</em>: el piso legal que un empleador puede pagar, antes de impuestos y seguros. Como referencia aproximada a tiempo completo (40 horas semanales), ${yen(highest.amount)} equivalen a unos ${yen(monthly(highest.amount))} al mes antes de deducciones, y ${yen(lowest.amount)} a unos ${yen(monthly(lowest.amount))}. El impuesto sobre la renta, el impuesto de residencia, el seguro de salud y la pensión suelen restar entre un 15 % y un 20 %, por lo que el sueldo neto es menor. Un salario nominal más alto también suele ir acompañado de alquileres más altos: Tokio paga más pero también es lo más caro para vivir, así que compara los salarios con el alquiler local antes de decidir dónde trabajar.`,
    sswH: "Si vienes con un visado de Trabajador Cualificado Específico (特定技能)",
    ssw: `Los empleos de Trabajador Cualificado Específico (SSW / tokutei ginō) en sectores como cuidados, hostelería y manufactura deben pagar al menos el mínimo prefectural local, y la ley laboral japonesa exige una remuneración igual o mejor que la de un trabajador japonés en el mismo puesto. Usa la tabla para comparar regiones: un salario algo menor en una prefectura con alquiler bajo puede dejar más dinero a fin de mes que un salario alto en el centro de Tokio. Confirma siempre el salario, las horas y las deducciones que figuran en tu contrato de trabajo (雇用契約書) antes de firmar.`,
    remitH: "Enviar dinero a casa",
    remit: `Muchos residentes que envían parte de su sueldo al extranjero usan un servicio de transferencia de bajo coste para evitar el alto margen de las transferencias bancarias. <a href="https://wise.com/" data-aff="wise" data-aff-fallback="https://wise.com/" target="_blank" rel="noopener">Wise</a> es una opción muy usada; compara su comisión y tipo de cambio con los de tu banco para tu propio corredor antes de decidir.`,
    targetH: "Hacia dónde va",
    target: `Las cifras anteriores son la revisión de 2025, que entró en vigor entre octubre de 2025 y marzo de 2026 según la prefectura. El gobierno ha fijado el objetivo de elevar el promedio nacional a ¥1,500/hora hacia finales de la década de 2020, así que se esperan más subidas anuales.`,
    faqH: "Preguntas frecuentes",
    faq: [
      ["¿Cuál es el salario mínimo en Japón en 2025?", `Japón no tiene un único salario mínimo nacional: se fija por prefectura. Tras la revisión del año fiscal 2025, el promedio ponderado nacional es de ${yen(DATA.national_weighted_average)} por hora, y va desde ${yen(lowest.amount)} (${lowestPrefs.join(", ")}) hasta ${yen(highest.amount)} (${highest.pref}). Todas las cifras son por hora, antes de impuestos.`],
      ["¿Qué prefectura tiene el salario mínimo más alto?", `${highest.pref} tiene el más alto con ${yen(highest.amount)} por hora, seguida de ${ranked[1].pref} (${yen(ranked[1].amount)}) y ${ranked[2].pref} (${yen(ranked[2].amount)}).`],
      ["¿Qué prefectura tiene el salario mínimo más bajo?", `${lowestPrefs.join(", ")} comparten el más bajo con ${yen(lowest.amount)} por hora. Con la revisión de 2025, las 47 prefecturas están en o por encima de ¥1,000 por primera vez.`],
      ["¿Cuándo entraron en vigor los salarios mínimos de 2025?", `Cada prefectura fija su propia fecha. Las tarifas de 2025 entraron en vigor entre octubre de 2025 y marzo de 2026; todas las cifras listadas están vigentes en junio de 2026.`],
    ],
    relH: "Relacionado",
    relMove: "Mudarse a Japón: el cronograma práctico",
    relSsw: "Examen de práctica de Trabajador Cualificado Específico (特定技能)",
    relGuides: "Las 47 guías de prefecturas",
    disc: "Solo información general, recopilada de datos oficiales del MHLW en la fecha indicada abajo — no es asesoramiento legal ni laboral. Los salarios mínimos se revisan cada año; confirma la cifra actual de tu prefectura en mhlw.go.jp antes de basarte en ella.",
    updated: "Datos: revisión MHLW año fiscal 2025 · página compilada",
    allGuides: "← Todas las guías", freeQuiz: "CUESTIONARIO GRATIS",
  },
  th: {
    htmlLang: "th",
    title: "ค่าจ้างขั้นต่ำในญี่ปุ่นตามจังหวัด (2025–26): ครบ 47 จังหวัด จัดอันดับ — NihongoHub",
    desc: `ค่าจ้างขั้นต่ำระดับภูมิภาคอย่างเป็นทางการปี 2025 ของทั้ง 47 จังหวัดในญี่ปุ่น (กระทรวงสาธารณสุข แรงงานและสวัสดิการ) จัดอันดับ พร้อมจำนวนที่ปรับขึ้นและวันที่มีผลบังคับใช้ ปีนี้ทุกจังหวัดเกิน ¥1,000/ชั่วโมงเป็นครั้งแรก ค่าเฉลี่ยทั่วประเทศ ${yen(DATA.national_weighted_average)}.`,
    ogtitle: "ค่าจ้างขั้นต่ำในญี่ปุ่นตามจังหวัด (2025–26) — ครบ 47 จังหวัด จัดอันดับ",
    tag: "▶ ทำงานในญี่ปุ่น · ข้อมูล",
    h1: "ค่าจ้างขั้นต่ำในญี่ปุ่นตามจังหวัด (2025–26)",
    lede: "ญี่ปุ่นกำหนดค่าจ้างขั้นต่ำตามจังหวัด ไม่ใช่ระดับประเทศ นี่คือตัวเลขอย่างเป็นทางการปี 2025 ของ 47 จังหวัด ทั้งหมด เรียงจากสูงไปต่ำ พร้อมจำนวนที่ปรับขึ้นและวันที่เริ่มมีผลของแต่ละจังหวัด",
    tldrH: "คำตอบสั้น ๆ",
    tldr: `ค่าจ้างขั้นต่ำของญี่ปุ่นกำหนดแยกตามจังหวัด หลังการปรับปีงบประมาณ 2025 ${esc(highest.pref)} สูงสุดที่ ${yen(highest.amount)}/ชั่วโมง ส่วน ${lowestPrefs.map(esc).join(", ")} ต่ำสุดที่ ${yen(lowest.amount)} ค่าเฉลี่ยถ่วงน้ำหนักทั่วประเทศอยู่ที่ ${yen(DATA.national_weighted_average)} และเป็นครั้งแรกที่ทั้ง 47 จังหวัดเกิน ¥1,000/ชั่วโมง ตัวเลขทั้งหมดเป็นต่อชั่วโมง ก่อนหักภาษี`,
    sourceLine: `แหล่งข้อมูล: กระทรวงสาธารณสุข แรงงานและสวัสดิการ (MHLW), <em>ค่าจ้างขั้นต่ำระดับภูมิภาคปีงบประมาณ 2025 — รายการทั่วประเทศ</em> ตัวเลขคือค่าจ้างขั้นต่ำต่อชั่วโมงของแต่ละจังหวัด (地域別最低賃金) ก่อนหักภาษีและประกันสังคม`,
    glanceH: "ภาพรวม",
    g1: "ค่าเฉลี่ยถ่วงน้ำหนักทั่วประเทศ", g1sub: `เพิ่มขึ้น +${yen(DATA.national_raise).slice(1)} (+${DATA.national_pct}%) จากปีก่อน`,
    g2: "สูงสุด", g2sub: `${esc(highest.pref)}`,
    g3: "ต่ำสุด", g3sub: `${lowestPrefs.map(esc).join(" · ")}`,
    g4: "จังหวัดที่ ≥ ¥1,000", g4sub: "ครั้งแรก (ครบ 47)",
    tableH: "ทั้ง 47 จังหวัด จัดอันดับ",
    tableNote: "เรียงตามค่าจ้างต่อชั่วโมง สูงสุดก่อน แตะชื่อจังหวัดเพื่อดูคู่มือการใช้ชีวิตและท่องเที่ยว",
    col: ["#", "จังหวัด", "¥ / ชม.", "เพิ่ม", "มีผล", "ภูมิภาค"],
    payH: "มีความหมายอย่างไรต่อเงินเดือนของคุณ",
    pay: `ตัวเลขเหล่านี้คือ<em>ค่าจ้างขั้นต่ำต่อชั่วโมง</em> — ขั้นต่ำตามกฎหมายที่นายจ้างจ่ายได้ ก่อนหักภาษีและประกัน หากประเมินแบบทำงานเต็มเวลา (40 ชั่วโมงต่อสัปดาห์) ${yen(highest.amount)} เท่ากับประมาณ ${yen(monthly(highest.amount))} ต่อเดือนก่อนหัก และ ${yen(lowest.amount)} ประมาณ ${yen(monthly(lowest.amount))} ภาษีเงินได้ ภาษีผู้อยู่อาศัย ประกันสุขภาพ และเงินบำนาญ มักหักรวมราว 15–20% ดังนั้นเงินที่ได้รับจริงจะน้อยกว่า ค่าจ้างที่สูงกว่ามักมาพร้อมค่าเช่าที่สูงกว่า โตเกียวจ่ายมากที่สุดแต่ก็มีค่าครองชีพสูงที่สุด จึงควรเทียบค่าจ้างกับค่าเช่าในพื้นที่ก่อนเลือกที่ทำงาน`,
    sswH: "หากคุณมาด้วยวีซ่าแรงงานทักษะเฉพาะ (特定技能)",
    ssw: `งานแรงงานทักษะเฉพาะ (SSW / โทคุเทกิ กิโน) ในสาขาเช่น การดูแลผู้สูงอายุ บริการอาหาร และการผลิต ต้องจ่ายอย่างน้อยเท่าค่าจ้างขั้นต่ำของจังหวัดนั้น และกฎหมายแรงงานญี่ปุ่นกำหนดให้จ่ายเท่ากันหรือมากกว่าคนญี่ปุ่นที่ทำงานเดียวกัน ใช้ตารางนี้เปรียบเทียบภูมิภาค ค่าจ้างที่ต่ำกว่าเล็กน้อยในจังหวัดที่ค่าเช่าถูกอาจเหลือเงินปลายเดือนมากกว่าค่าจ้างสูงในใจกลางโตเกียว ตรวจสอบค่าจ้าง ชั่วโมงทำงาน และรายการหักในสัญญาจ้าง (雇用契約書) ทุกครั้งก่อนเซ็น`,
    remitH: "ส่งเงินกลับบ้าน",
    remit: `ผู้พำนักจำนวนมากที่ส่งเงินส่วนหนึ่งกลับต่างประเทศ ใช้บริการโอนเงินค่าธรรมเนียมต่ำเพื่อเลี่ยงส่วนต่างอัตราแลกเปลี่ยนที่สูงของการโอนผ่านธนาคาร <a href="https://wise.com/" data-aff="wise" data-aff-fallback="https://wise.com/" target="_blank" rel="noopener">Wise</a> เป็นตัวเลือกหนึ่งที่ใช้กันแพร่หลาย ลองเทียบค่าธรรมเนียมและอัตราแลกเปลี่ยนกับธนาคารของคุณสำหรับเส้นทางของคุณเองก่อนตัดสินใจ`,
    targetH: "ทิศทางต่อไป",
    target: `ตัวเลขข้างต้นคือการปรับปี 2025 ซึ่งมีผลระหว่างเดือนตุลาคม 2025 ถึงมีนาคม 2026 ขึ้นกับจังหวัด รัฐบาลตั้งเป้าเพิ่มค่าเฉลี่ยทั่วประเทศเป็น ¥1,500/ชม. ภายในปลายทศวรรษ 2020 จึงคาดว่าจะมีการปรับขึ้นต่อเนื่องทุกปี`,
    faqH: "คำถามที่พบบ่อย",
    faq: [
      ["ค่าจ้างขั้นต่ำในญี่ปุ่นปี 2025 เท่าไร?", `ญี่ปุ่นไม่มีค่าจ้างขั้นต่ำระดับประเทศเพียงค่าเดียว — กำหนดแยกตามจังหวัด หลังการปรับปีงบประมาณ 2025 ค่าเฉลี่ยถ่วงน้ำหนักทั่วประเทศอยู่ที่ ${yen(DATA.national_weighted_average)} ต่อชั่วโมง ตั้งแต่ ${yen(lowest.amount)} (${lowestPrefs.join(", ")}) ถึง ${yen(highest.amount)} (${highest.pref}) ตัวเลขทั้งหมดเป็นต่อชั่วโมง ก่อนหักภาษี`],
      ["จังหวัดใดมีค่าจ้างขั้นต่ำสูงสุด?", `${highest.pref} สูงสุดที่ ${yen(highest.amount)} ต่อชั่วโมง รองลงมาคือ ${ranked[1].pref} (${yen(ranked[1].amount)}) และ ${ranked[2].pref} (${yen(ranked[2].amount)})`],
      ["จังหวัดใดมีค่าจ้างขั้นต่ำต่ำสุด?", `${lowestPrefs.join(", ")} ต่ำสุดที่ ${yen(lowest.amount)} ต่อชั่วโมง ในการปรับปี 2025 ทั้ง 47 จังหวัดอยู่ที่หรือเกิน ¥1,000 เป็นครั้งแรก`],
      ["ค่าจ้างขั้นต่ำปี 2025 เริ่มมีผลเมื่อใด?", `แต่ละจังหวัดกำหนดวันมีผลเอง อัตราปี 2025 มีผลระหว่างตุลาคม 2025 ถึงมีนาคม 2026 ตัวเลขที่แสดงทั้งหมดมีผลบังคับใช้แล้ว ณ มิถุนายน 2026`],
    ],
    relH: "ที่เกี่ยวข้อง",
    relMove: "ย้ายมาญี่ปุ่น: ไทม์ไลน์ที่ใช้ได้จริง",
    relSsw: "แบบทดสอบแรงงานทักษะเฉพาะ (特定技能)",
    relGuides: "คู่มือครบ 47 จังหวัด",
    disc: "ข้อมูลทั่วไปเท่านั้น รวบรวมจากข้อมูลทางการของ MHLW ณ วันที่ด้านล่าง — ไม่ใช่คำแนะนำทางกฎหมายหรือการจ้างงาน ค่าจ้างขั้นต่ำมีการปรับทุกปี โปรดตรวจสอบตัวเลขปัจจุบันของจังหวัดคุณที่ mhlw.go.jp ก่อนนำไปใช้",
    updated: "ข้อมูล: การปรับ MHLW ปีงบประมาณ 2025 · จัดทำหน้าเมื่อ",
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
  const updatedStr = "2026-06-15";

  const faqLd = {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: t.faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a.replace(/<[^>]+>/g, "") } })),
  };
  const articleLd = {
    "@context": "https://schema.org", "@type": "Article", headline: t.ogtitle,
    description: t.desc.replace(/<[^>]+>/g, ""), url: selfUrl, mainEntityOfPage: selfUrl,
    inLanguage: t.htmlLang, isAccessibleForFree: true,
    author: { "@type": "Organization", name: "NihongoHub" },
    publisher: { "@type": "Organization", name: "NihongoHub", url: SITE + "/", logo: { "@type": "ImageObject", url: SITE + "/apple-touch-icon.png" } },
    datePublished: "2026-06-15", dateModified: "2026-06-15",
    citation: "Ministry of Health, Labour and Welfare (Japan), FY2025 Regional Minimum Wages National List",
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
    <div class="mw-card hl"><span class="mw-k">${esc(t.g4)}</span><span class="mw-v">47 / 47</span><span class="mw-s">${esc(t.g4sub)}</span></div>
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
.mw-table td.up{color:var(--green);font-variant-numeric:tabular-nums;white-space:nowrap}
.mw-table td.dt,.mw-table td.rg{color:var(--muted);font-size:12.5px;white-space:nowrap}
.mw-table tr:nth-child(1) td.w,.mw-table tr:nth-child(2) td.w,.mw-table tr:nth-child(3) td.w{color:var(--red)}
@media(max-width:620px){.mw-glance{grid-template-columns:repeat(2,1fr)}.mw-v{font-size:22px}.mw-table td.dt{display:none}.mw-table th.c4{display:none}}
</style>
<script type="application/ld+json">${JSON.stringify(articleLd)}</script>
<script type="application/ld+json">${JSON.stringify(faqLd)}</script>
<script src="${libPrefix}lib/config.js" defer></script>
<script defer src="/_vercel/insights/script.js"></script>
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

  <h2>${esc(t.glanceH)}</h2>
  ${glance}

  <h2>${esc(t.tableH)}</h2>
  <p style="font-size:13.5px;color:var(--muted);margin:2px 0 0">${esc(t.tableNote)}</p>
  ${table}

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
    ${esc(t.updated)} ${updatedStr}. <a href="https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/koyou_roudou/roudoukijun/minimumichiran/" target="_blank" rel="noopener">MHLW 地域別最低賃金</a>.
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
  console.log(`wrote ${n} minimum-wage articles (${LANGS.join("/")}) — national avg ${yen(DATA.national_weighted_average)}, ${ranked.length} prefectures`);
}

// Run the build only when executed directly, so proofread-minwage.mjs can `import { T }`
// without triggering a rebuild (no side effects on import).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) build();

