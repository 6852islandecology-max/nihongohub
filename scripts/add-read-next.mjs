// scripts/add-read-next.mjs — add a "Read next" block to articles that dead-end.
//
// Why: blog>blog is the site's largest in-site transition (73 of 123 in the last
// 30 days), yet ~half the articles offered the reader nowhere to go except the
// affiliate block. Prefecture guides built by build-guides.mjs already emit
// "Related guides"; hand-written articles never got an equivalent.
//
// Links are hand-mapped, not keyword-guessed: a wrong "related" link costs more
// trust than an absent one. Run with --check to diff without writing.
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const BLOG = resolve(dirname(fileURLToPath(import.meta.url)), "..", "blog");
const CHECK = process.argv.includes("--check");

// slug → [short link title, one-line hook]. The hook answers "why would I click
// this next?", so it is written from the reader's position, not the article's.
const A = {
  // ── collecting: stamps, cards, manhole covers ──────────────────────────────
  "pokefuta-pokemon-manholes-japan": ["Pokéfuta: the 47-prefecture Pokémon manhole hunt", "Every prefecture has its own ambassador Pokémon cover."],
  "gundam-manholes-japan": ["Gundam manhole covers across Japan", "RX-78-2 and Zeon pairs, donated town by town."],
  "character-manholes-japan": ["Conan, Eva, Lupin III & Ultraman manholes", "The other anime covers, sorted by town."],
  "manhole-cards-japan": ["Free manhole cards", "The lot system, where to pick them up, and the notable designs."],
  "japan-public-collectible-cards": ["Japan's other free collectible cards", "Rice terrace, dam, observatory and port cards — and which have ended."],
  "eki-stamps-japan": ["Station stamps", "The free paper stamps, the EKITAG app, and the rallies."],
  "michi-no-eki-stamp-rally-japan": ["Michi-no-eki stamp rally", "How roadside stations turn a drive into a collecting game."],
  "goshuin-temple-shrine-stamps": ["Goshuin: shrine & temple seal stamps", "What they mean and the etiquette that keeps you welcome."],
  "goshuincho-guide-japan": ["Choosing a goshuincho", "The accordion book itself: how to pick one and where to buy it."],
  "autumn-goshuin-momiji-japan": ["Autumn goshuin in maple season", "Famous temples stop writing in your book — here's what changes."],
  "kirie-goshuin-japan": ["Kirie cut-paper goshuin", "Confirmed temples, published prices, and the sell-out rules."],
  "shichifukujin-meguri-japan": ["Seven Lucky Gods routes", "Seven stamps on one sheet — and most routes open only 1–7 January."],
  "tori-no-ichi-kumade-japan": ["Tori-no-ichi rake markets", "Rooster-day markets, open midnight to midnight."],
  "daruma-markets-japan": ["Daruma markets", "Which eye you paint first, and why the doll goes back to be burned."],
  "nagoya-aichi-collectibles": ["Nagoya & Aichi collectible hunting", "Castle stamps, free manhole cards and pottery towns in one trip."],
  "japan-100-castles-goshuin": ["Japan's 100 Famous Castles", "The free stamp-rally book, the paid gojoin seals, and both official lists."],
  "anime-pilgrimage-japan": ["Anime pilgrimage, prefecture by prefecture", "Seichi junrei spots you can stand in, and the etiquette that keeps fans welcome."],

  // ── buying Japan-only things from overseas ────────────────────────────────
  "buy-from-japan-proxy-services": ["Buyee vs ZenMarket", "How proxy buying actually works, and which fits your order."],
  "japan-only-anime-merch-guide": ["Japan-only anime & character merch", "What genuinely never leaves Japan, and how to get it anyway."],
  "gunpla-starter-kits-guide": ["Best Gunpla starter kits", "Entry Grade vs HG vs RG, and which to build first."],
  "japanese-castle-model-kits-guide": ["Japanese castle model kits", "Build Himeji, Nagoya or Kumamoto castle at home."],
  "matcha-tea-ceremony-sets-guide": ["Matcha & tea ceremony sets", "Whisk sets and chasen compared, with the gift kits worth it."],
  "japanese-whetstones-guide": ["Japanese whetstones explained", "King vs Shapton vs Suehiro vs Naniwa, in plain terms."],
  "goshuincho-stamp-notebooks-guide": ["Stamp notebooks to buy before you go", "Goshuincho and rally notebooks, bought ahead of the trip."],

  // ── trip practicalities ───────────────────────────────────────────────────
  "is-japan-expensive-2026": ["Is Japan expensive in 2026?", "An honest daily budget: what $80–120 a day really buys."],
  "japan-cash-or-card-2026": ["Cash or card in Japan", "How much yen to actually carry, and where cards still fail."],
  "japan-2026-travel-changes": ["Every new fee, tax and rule for 2026", "Departure tax, JR Pass, Mt. Fuji and tax-free changes."],
  "konbini-guide-japan": ["The konbini guide", "What to actually buy, and how the foreign-card ATMs work."],
  "japan-first-two-weeks-checklist": ["Your first 14 days in Japan", "An arrival checklist in the order things must happen."],
  "luxury-ryokan-guide": ["The luxury ryokan guide", "Best hot-spring stays near Mt. Fuji and Kyoto."],
  "japan-premium-experiences": ["Beyond the tour bus", "Five ultra-premium cultural experiences, honestly assessed."],

  // ── living in Japan ───────────────────────────────────────────────────────
  "moving-to-japan-guide": ["Moving to Japan", "The practical timeline nobody tells you about."],
  "renting-apartment-japan-foreigner": ["Renting an apartment as a foreigner", "Key money, guarantors, and the cheaper routes around both."],
  "minimum-wage-japan-2025": ["Minimum wage by prefecture", "All 47, ranked — the number that decides where you can afford to live."],
  "study-japanese-in-japan": ["Language schools & study programs", "An honest comparison of the agents, including the free routes."],
  "jft-basic-tokutei-ginou-guide": ["JFT-Basic & Specified Skilled Worker", "The exact Japanese the tokutei ginou route asks for."],

  // ── studying Japanese ─────────────────────────────────────────────────────
  "jlpt-n5-study-roadmap": ["How to study for JLPT N5", "Kana first, then kanji and grammar — a roadmap that holds up."],
  "jlpt-textbooks-best-books": ["The best textbooks by JLPT level", "Genki, Quartet, Tobira and more — with the free tools first."],
  "n4-grammar-hardest-points": ["The N4 grammar wall", "The points that trip everyone, and the tell for each."],

  // ── Japan's wildlife, explained by a biologist ────────────────────────────
  "animal-colors-japan-science": ["Why Japan's animals are coloured the way they are", "Stripes, mimicry and metallic beetles, from the research."],
  "science-countershading-japan": ["Why a mackerel is dark on top, silver below", "Countershading in Japan's fish, serow and moths."],
  "science-eyespots-deimatic-display-japan": ["Why moths have “eyes” on their wings", "Eyespots and startle displays, and what they actually do."],
  "science-firefly-bioluminescence-japan": ["Why Japanese fireflies glow", "Cold light at 95% efficiency, and why two species flash differently."],
  "science-himebotaru-land-firefly-japan": ["Himebotaru, the land firefly", "Lives on land, eats snails, flashes gold after midnight."],
  "science-ladybird-thermal-melanism-japan": ["Why some ladybirds turn solid black", "Thermal melanism in Japan's nami-tentō."],
  "science-mycoheterotroph-plants-japan": ["Japan's ghost plants", "The flowers that gave up photosynthesis entirely."],
  "science-ptarmigan-seasonal-molting-japan": ["The ptarmigan that changes colour three times a year", "Why twice isn't enough on a Japanese alp."],
  "science-tanago-bitterling-japan": ["The fish that lays its eggs inside a mussel", "Tanago, and the bargain the mussel drives in return."],
  "japan-improved-medaka-varieties": ["500 varieties of an endangered fish", "How Japan bred improved medaka — and the paradox that follows."],
  "wildlife-watching-japan": ["Wildlife watching in Japan", "A naturalist's guide, region by region."],

  // ── the everyday Japan nobody writes about in English ─────────────────────
  "japan-densen-power-line-appreciation": ["Japan's power line lovers", "Why densen are a hobby, and how to see them that way."],
  "japan-shitsugaiki-air-conditioner-units": ["Shitsugaiki: appreciating AC units", "The hobby of looking at the boxes on the wall."],
  "japan-sukashi-block-walls": ["Sukashi blocks", "Japan's disappearing patterned wall blocks, and where they survive."],
  "japan-inuki-bukken-shop-ghosts": ["Inuki bukken", "Why Japanese shops are haunted by the last business in them."],
  "japan-profession-planners-techo": ["Planners made for one job only", "Nurse, farmer, prefecture — Japan's profession-specific techo."],
  "kochi-ripple-local-drinks-japan": ["The drink Kochi thinks is national", "Japan's prefecture-locked soft drinks."],
  "kissaten-showa-retro-japan": ["Kissaten", "Inside Japan's Showa-era cafés, and why Gen Z rediscovered them."],
  "tokyo-sousuiko-museum": ["Tokyo's museum of fire-hose inlets", "A museum for a thing you have walked past a thousand times."],
  "sukagawa-ultraman-town-japan": ["The town where Ultraman plays on the loudspeakers", "Sukagawa, Fukushima, and its 5pm chime."],
};

// Hand-picked next reads. Order matters: first is the strongest follow-on.
const NEXT = {
  "pokefuta-pokemon-manholes-japan": ["character-manholes-japan", "manhole-cards-japan", "gundam-manholes-japan"],
  "japan-public-collectible-cards": ["manhole-cards-japan", "eki-stamps-japan", "michi-no-eki-stamp-rally-japan"],
  "autumn-goshuin-momiji-japan": ["goshuin-temple-shrine-stamps", "goshuincho-guide-japan", "kirie-goshuin-japan"],
  "goshuincho-guide-japan": ["goshuin-temple-shrine-stamps", "autumn-goshuin-momiji-japan", "goshuincho-stamp-notebooks-guide"],
  "goshuincho-stamp-notebooks-guide": ["goshuincho-guide-japan", "goshuin-temple-shrine-stamps", "eki-stamps-japan"],
  "daruma-markets-japan": ["shichifukujin-meguri-japan", "tori-no-ichi-kumade-japan", "goshuin-temple-shrine-stamps"],
  "shichifukujin-meguri-japan": ["daruma-markets-japan", "goshuin-temple-shrine-stamps", "tori-no-ichi-kumade-japan"],
  "tori-no-ichi-kumade-japan": ["daruma-markets-japan", "shichifukujin-meguri-japan", "goshuin-temple-shrine-stamps"],
  "nagoya-aichi-collectibles": ["michi-no-eki-stamp-rally-japan", "manhole-cards-japan", "japanese-castle-model-kits-guide"],
  // Added 2026-08-13: these nine carry real impressions but dead-ended, so the
  // cluster's authority never flowed anywhere. Only the goshuin hub can honestly
  // point at tori-no-ichi (both are things you receive at a shrine on a set date);
  // the stamp and manhole pages are left alone rather than link-stuffed.
  "goshuin-temple-shrine-stamps": ["goshuincho-guide-japan", "shichifukujin-meguri-japan", "tori-no-ichi-kumade-japan"],
  "kirie-goshuin-japan": ["goshuin-temple-shrine-stamps", "autumn-goshuin-momiji-japan", "goshuincho-guide-japan"],
  "japan-100-castles-goshuin": ["goshuin-temple-shrine-stamps", "nagoya-aichi-collectibles", "michi-no-eki-stamp-rally-japan"],
  "eki-stamps-japan": ["michi-no-eki-stamp-rally-japan", "manhole-cards-japan", "japan-public-collectible-cards"],
  "manhole-cards-japan": ["japan-public-collectible-cards", "pokefuta-pokemon-manholes-japan", "character-manholes-japan"],
  "michi-no-eki-stamp-rally-japan": ["eki-stamps-japan", "japan-public-collectible-cards", "nagoya-aichi-collectibles"],
  "character-manholes-japan": ["pokefuta-pokemon-manholes-japan", "gundam-manholes-japan", "anime-pilgrimage-japan"],
  "gundam-manholes-japan": ["character-manholes-japan", "gunpla-starter-kits-guide", "manhole-cards-japan"],
  "anime-pilgrimage-japan": ["character-manholes-japan", "japan-only-anime-merch-guide", "sukagawa-ultraman-town-japan"],

  "buy-from-japan-proxy-services": ["japan-only-anime-merch-guide", "gunpla-starter-kits-guide", "matcha-tea-ceremony-sets-guide"],
  "japan-only-anime-merch-guide": ["buy-from-japan-proxy-services", "gunpla-starter-kits-guide", "character-manholes-japan"],
  "gunpla-starter-kits-guide": ["gundam-manholes-japan", "japanese-castle-model-kits-guide", "buy-from-japan-proxy-services"],
  "japanese-castle-model-kits-guide": ["gunpla-starter-kits-guide", "nagoya-aichi-collectibles", "buy-from-japan-proxy-services"],
  "matcha-tea-ceremony-sets-guide": ["kissaten-showa-retro-japan", "goshuin-temple-shrine-stamps", "buy-from-japan-proxy-services"],
  "japanese-whetstones-guide": ["buy-from-japan-proxy-services", "matcha-tea-ceremony-sets-guide", "japan-profession-planners-techo"],

  "is-japan-expensive-2026": ["japan-cash-or-card-2026", "konbini-guide-japan", "japan-2026-travel-changes"],
  "japan-cash-or-card-2026": ["is-japan-expensive-2026", "konbini-guide-japan", "japan-2026-travel-changes"],
  "japan-2026-travel-changes": ["is-japan-expensive-2026", "japan-cash-or-card-2026", "japan-first-two-weeks-checklist"],
  "konbini-guide-japan": ["japan-cash-or-card-2026", "is-japan-expensive-2026", "kissaten-showa-retro-japan"],
  "japan-first-two-weeks-checklist": ["moving-to-japan-guide", "renting-apartment-japan-foreigner", "japan-cash-or-card-2026"],
  "luxury-ryokan-guide": ["japan-premium-experiences", "is-japan-expensive-2026", "matcha-tea-ceremony-sets-guide"],
  "japan-premium-experiences": ["luxury-ryokan-guide", "matcha-tea-ceremony-sets-guide", "is-japan-expensive-2026"],

  "moving-to-japan-guide": ["renting-apartment-japan-foreigner", "japan-first-two-weeks-checklist", "minimum-wage-japan-2025"],
  "renting-apartment-japan-foreigner": ["moving-to-japan-guide", "minimum-wage-japan-2025", "japan-first-two-weeks-checklist"],
  "study-japanese-in-japan": ["jlpt-textbooks-best-books", "moving-to-japan-guide", "jft-basic-tokutei-ginou-guide"],
  "jft-basic-tokutei-ginou-guide": ["jlpt-n5-study-roadmap", "minimum-wage-japan-2025", "moving-to-japan-guide"],

  "jlpt-n5-study-roadmap": ["jlpt-textbooks-best-books", "n4-grammar-hardest-points", "jft-basic-tokutei-ginou-guide"],
  "jlpt-textbooks-best-books": ["jlpt-n5-study-roadmap", "n4-grammar-hardest-points", "study-japanese-in-japan"],
  "n4-grammar-hardest-points": ["jlpt-n5-study-roadmap", "jlpt-textbooks-best-books", "study-japanese-in-japan"],

  "animal-colors-japan-science": ["science-countershading-japan", "science-eyespots-deimatic-display-japan", "science-ladybird-thermal-melanism-japan"],
  "science-countershading-japan": ["animal-colors-japan-science", "science-eyespots-deimatic-display-japan", "science-ptarmigan-seasonal-molting-japan"],
  "science-eyespots-deimatic-display-japan": ["animal-colors-japan-science", "science-countershading-japan", "science-ladybird-thermal-melanism-japan"],
  "science-firefly-bioluminescence-japan": ["science-himebotaru-land-firefly-japan", "animal-colors-japan-science", "wildlife-watching-japan"],
  "science-himebotaru-land-firefly-japan": ["science-firefly-bioluminescence-japan", "science-tanago-bitterling-japan", "wildlife-watching-japan"],
  "science-ladybird-thermal-melanism-japan": ["animal-colors-japan-science", "science-countershading-japan", "science-ptarmigan-seasonal-molting-japan"],
  "science-mycoheterotroph-plants-japan": ["science-tanago-bitterling-japan", "wildlife-watching-japan", "animal-colors-japan-science"],
  "science-ptarmigan-seasonal-molting-japan": ["science-countershading-japan", "animal-colors-japan-science", "wildlife-watching-japan"],
  "science-tanago-bitterling-japan": ["japan-improved-medaka-varieties", "science-mycoheterotroph-plants-japan", "wildlife-watching-japan"],
  "japan-improved-medaka-varieties": ["science-tanago-bitterling-japan", "animal-colors-japan-science", "wildlife-watching-japan"],
  "wildlife-watching-japan": ["animal-colors-japan-science", "science-firefly-bioluminescence-japan", "science-ptarmigan-seasonal-molting-japan"],

  "japan-densen-power-line-appreciation": ["japan-shitsugaiki-air-conditioner-units", "japan-sukashi-block-walls", "tokyo-sousuiko-museum"],
  "japan-shitsugaiki-air-conditioner-units": ["japan-densen-power-line-appreciation", "japan-sukashi-block-walls", "tokyo-sousuiko-museum"],
  "japan-sukashi-block-walls": ["japan-shitsugaiki-air-conditioner-units", "japan-densen-power-line-appreciation", "kissaten-showa-retro-japan"],
  "japan-inuki-bukken-shop-ghosts": ["kissaten-showa-retro-japan", "japan-sukashi-block-walls", "japan-profession-planners-techo"],
  "japan-profession-planners-techo": ["goshuincho-stamp-notebooks-guide", "japan-inuki-bukken-shop-ghosts", "japanese-whetstones-guide"],
  "kochi-ripple-local-drinks-japan": ["konbini-guide-japan", "kissaten-showa-retro-japan", "japan-public-collectible-cards"],
  "kissaten-showa-retro-japan": ["japan-inuki-bukken-shop-ghosts", "matcha-tea-ceremony-sets-guide", "japan-sukashi-block-walls"],
  "tokyo-sousuiko-museum": ["japan-sukashi-block-walls", "japan-shitsugaiki-air-conditioner-units", "manhole-cards-japan"],
  "sukagawa-ultraman-town-japan": ["character-manholes-japan", "japan-inuki-bukken-shop-ghosts", "kissaten-showa-retro-japan"],

  // A bespoke prefecture page; the generated ones already carry "Related guides".
  hokkaido: ["wildlife-watching-japan", "science-ptarmigan-seasonal-molting-japan", "michi-no-eki-stamp-rally-japan"],
};

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function block(slugs) {
  const items = slugs
    .filter((s) => A[s])
    .map((s) => {
      const [title, hook] = A[s];
      return (
        `\n    <a href="${s}.html"><span class="rn-t">${esc(title)}</span>` +
        `<span class="rn-d">${esc(hook)}</span></a>`
      );
    })
    .join("");
  return `  <nav class="readnext" aria-label="Read next">\n` +
    `    <div class="readnext-h">READ NEXT</div>${items}\n  </nav>\n`;
}

let written = 0;
const problems = [];
for (const [slug, nexts] of Object.entries(NEXT)) {
  const file = resolve(BLOG, `${slug}.html`);
  let html;
  try {
    html = readFileSync(file, "utf8");
  } catch {
    problems.push(`missing file: ${slug}.html`);
    continue;
  }
  if (html.includes('class="readnext"')) continue; // idempotent
  const missing = nexts.filter((s) => !A[s]);
  if (missing.length) problems.push(`${slug}: no copy for ${missing.join(", ")}`);

  const md = block(nexts);
  // Sit above the sources note when there is one, otherwise close out the article.
  let out;
  if (html.includes('<div class="sources">')) {
    out = html.replace('<div class="sources">', `${md}  <div class="sources">`);
  } else if (html.includes("</article>")) {
    out = html.replace("</article>", `${md}</article>`);
  } else {
    problems.push(`${slug}: no insertion point`);
    continue;
  }
  if (!CHECK) writeFileSync(file, out);
  written++;
}

// Every link must resolve to a file that exists.
const broken = new Set();
for (const nexts of Object.values(NEXT)) {
  for (const s of nexts) {
    try {
      readFileSync(resolve(BLOG, `${s}.html`));
    } catch {
      broken.add(s);
    }
  }
}
if (broken.size) problems.push(`broken targets: ${[...broken].join(", ")}`);

console.log(`${CHECK ? "would update" : "updated"}: ${written} articles`);
if (problems.length) {
  console.log("problems:");
  for (const p of problems) console.log("  - " + p);
  process.exit(1);
}
console.log("all link targets exist, all have copy.");
