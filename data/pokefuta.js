// pokefuta.js — verified data for the Pokéfuta (Pokémon manhole) feature.
// Single source of truth for the per-prefecture injector in blog-quiz.js and a
// reference for the hub page. ONLY verified, slow-changing facts live here:
// the official "Pokémon Local Acts" ambassador Pokémon assigned to each prefecture.
//
// We deliberately do NOT hardcode per-prefecture Pokéfuta *counts* or exact
// locations — those change as new covers are installed, so we always point the
// reader to the official map (the authoritative, always-current source) instead.
//
// Sources (verified 2026-06-11):
//   - Official: https://local.pokemon.jp/en/  +  https://local.pokemon.jp/en/manhole/
//   - Official municipality page (example): https://local.pokemon.jp/en/municipality/kagawa/
//   - Aggregated list cross-check: Bulbapedia "Pokémon Local Acts"
// The program adds prefectures over time; the official site holds the current roster.
window.NH_POKEFUTA = {
  updated: '2026-06-11',
  officialUrl: 'https://local.pokemon.jp/en/manhole/',     // the Pokéfuta map (authoritative location list)
  officialActsUrl: 'https://local.pokemon.jp/en/',          // Pokémon Local Acts home
  // Prefecture slug (matches the blog .html filename) → official ambassador Pokémon.
  ambassadors: {
    hokkaido:  { pkmn: 'Vulpix & Alolan Vulpix', jp: 'ロコン・アローラロコン', reason: 'a nod to the snowy north and the Ezo red fox' },
    iwate:     { pkmn: 'Geodude',                jp: 'イシツブテ',             reason: 'the prefecture name reads like "rock palm"' },
    miyagi:    { pkmn: 'Lapras',                 jp: 'ラプラス',               reason: 'its scenic Pacific coastline' },
    fukushima: { pkmn: 'Chansey',                jp: 'ラッキー',               reason: 'the kanji 福 ("luck") matches Chansey’s Japanese name, Lucky' },
    fukui:     { pkmn: 'Dragonite',              jp: 'カイリュー',             reason: 'its dinosaur fossils and the Kuzuryū ("nine-headed dragon") River' },
    mie:       { pkmn: 'Oshawott',               jp: 'ミジュマル',             reason: 'a name pun and the region’s shellfish' },
    tottori:   { pkmn: 'Sandshrew & Alolan Sandshrew', jp: 'サンド・アローラサンド', reason: 'its famous sand dunes' },
    kagawa:    { pkmn: 'Slowpoke',               jp: 'ヤドン',                 reason: '"Yadon" sounds like udon, Kagawa’s iconic noodle' },
    kochi:     { pkmn: 'Quagsire',               jp: 'ヌオー',                 reason: 'its many rivers match Quagsire’s habitat' },
    nagasaki:  { pkmn: 'Ampharos',               jp: 'デンリュウ',             reason: 'its lighthouses and a folk-song pun' },
    miyazaki:  { pkmn: 'Exeggutor & Alolan Exeggutor', jp: 'ナッシー・アローラナッシー', reason: 'the prefectural tree, the phoenix palm' },
    okinawa:   { pkmn: 'Growlithe',              jp: 'ガーディ',               reason: 'it resembles the shisa guardian lion-dogs' }
  }
};
