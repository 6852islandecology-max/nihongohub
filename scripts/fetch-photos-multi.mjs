#!/usr/bin/env node
// Fetch SEVERAL free-licensed photos per prefecture (or spot) for the photo-first guide layout.
// Source order (owner decision 2026-08-16: attractive first, encyclopedic last):
//   1. FIND/47  (search.find47.jp, METI-backed 47-prefecture archive, all CC BY 4.0, up to 4928px)
//   2. Flickr   (via Openverse API, CC BY / BY-SA / CC0 / PDM only, ~1024px, no API key; anon 200 req/day)
//   3. Wikimedia Commons (CC0 / PD / CC BY / CC BY-SA)
// Writes optimized webp into blog/img/ and a credit record per photo into blog/img-credits-multi.json.
//
// Usage:
//   node scripts/fetch-photos-multi.mjs tokushima            # one slug (prefecture entry in PHOTOS)
//   node scripts/fetch-photos-multi.mjs tokushima --force    # re-fetch keys already in credits
//   node scripts/fetch-photos-multi.mjs tokushima --force --keys tile1,see2   # re-fetch only those keys
//   node scripts/fetch-photos-multi.mjs --list               # show configured queries
//   node scripts/fetch-photos-multi.mjs --catalog tokushima  # only (re)build the FIND/47 catalog for a prefecture
//
// Adding a prefecture/spot = add an entry to PHOTOS below (slug -> [{key, q, label, must?, pref?}]).
// Every rec carries fetched_from + attribution fields; the page builder prints them.

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import sharp from 'sharp';

const HOME = os.homedir();
const BLOG = path.join(HOME, '.secretary/projects/nihongohub/blog');
const IMGDIR = path.join(BLOG, 'img');
const SRCDIR = path.join(BLOG, 'img-src');
const CREDITS = path.join(BLOG, 'img-credits-multi.json');
const F47CAT = path.join(BLOG, 'find47-catalog.json');
const UA = 'NihongoHub-photos/1.0 (https://www.nihongo-hub.com; contact: support@nihongo-hub.com)';
const UA_BROWSER = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ---------- targets ---------------------------------------------------------
// key = role in the page template; q = search string(s), first is primary; label = caption subject;
// must = regex the candidate title/description must match (relevance guard); pref = FIND/47 prefecture slug.
const PHOTOS = {
  tokushima: [
    { key: 'hero',  q: ['Naruto whirlpools', 'Naruto Strait', 'Onaruto Bridge'], must: /naruto|whirlpool|うず|渦/i, label: 'Naruto whirlpools' },
    { key: 'tile1', q: ['Awa Odori dancers', 'Awa Odori festival', 'Awaodori'], must: /^(?![\s\S]*(taiwan|taïwan|koenji|kōenji|tokyo|nagoya|memorial hall|kaikan|museum))(?=[\s\S]*(awa|odori|阿波))/i, sources: ['find47', 'wikimedia'], label: 'Awa Odori dancers' }, // Flickr top hit was a face close-up (personality rights) -> skip Flickr here
    { key: 'tile2', q: ['Iya Kazurabashi vine bridge', 'Iya vine bridge', 'kazurabashi'], must: /iya|kazura|vine|祖谷|かずら/i, label: 'Iya Kazurabashi vine bridge' },
    { key: 'tile3', q: ['Oboke Gorge', 'Yoshino river Tokushima', 'Oboke', 'Koboke'], must: /oboke|koboke|大歩危|小歩危|yoshino|吉野/i, label: 'Oboke Gorge on the Yoshino River' },
    { key: 'tile4', q: ['Mount Bizan Tokushima', 'Bizan', 'Tokushima city'], must: /bizan|眉山|tokushima city|徳島市/i, label: 'Tokushima city from Mount Bizan' },
    { key: 'tile5', q: ['Ryozenji', 'Shikoku pilgrimage temple Tokushima', 'Ryozen-ji Naruto'], must: /ryozen|霊山|pilgrim|henro|遍路/i, label: 'Ryōzen-ji, temple no. 1 of the Shikoku pilgrimage' },
    { key: 'tile6', q: ['Nagoro scarecrow', 'Nagoro kakashi', 'scarecrow village Tokushima'], must: /scarecrow|kakashi|nagoro|名頃|かかし/i, label: 'Nagoro scarecrow village' },
    { key: 'food1', q: ['Tokushima ramen'], must: /ramen|ラーメン/i, label: 'Tokushima ramen' },
    { key: 'food2', q: ['sudachi'], must: /sudachi|すだち|スダチ/i, label: 'Sudachi citrus' },
    { key: 'food3', q: ['Naruto Kintoki sweet potato', 'satsumaimo Naruto'], must: /kintoki|sweet potato|金時|さつま/i, label: 'Naruto Kintoki sweet potato' },
    { key: 'see1',  q: ['Awa Odori Kaikan', 'Awa Odori hall', 'Awa Odori'], must: /awa|odori|阿波/i, sources: ['find47', 'wikimedia'], label: 'Awa Odori Kaikan' },
    { key: 'see2',  q: ['whirlpools bridge', 'Uzu no Michi', 'Naruto whirlpool boat'], must: /whirlpool|uzu|渦/i, label: 'Naruto whirlpools and the Onaruto Bridge' },
    { key: 'see3',  q: ['Iya Valley', 'Iya Onsen', 'Biwa Falls Iya'], must: /iya|祖谷/i, label: 'Iya Valley' },
    { key: 'see4',  q: ['Oboke gorge boat', 'Oboke sightseeing boat'], must: /oboke|大歩危|boat|遊覧/i, label: 'Oboke Gorge sightseeing boat' },
  ],
  // ---- Tokushima spot pages (2026-08-16): 3 photos each, sources try FIND/47 -> Flickr -> Wikimedia
  'naruto-whirlpools': [
    { key: 'hero', q: ['spring tide', 'whirlpools bridge', 'Naruto whirlpools'], must: /whirlpool|tide|渦|naruto/i, label: 'Naruto whirlpools at spring tide' },
    { key: 'p1', q: ['Naruto Kaikyo Bridge', 'Onaruto Bridge', 'Naruto bridge'], must: /naruto|bridge|鳴門/i, label: 'The Ōnaruto Bridge over the strait' },
    { key: 'p2', q: ['Naruto whirlpool boat', 'Uzu no Michi', 'Naruto whirlpools sightseeing'], must: /naruto|whirlpool|uzu|渦/i, label: 'Sightseeing boat in the whirlpools' },
  ],
  'awa-odori-kaikan': [
    { key: 'hero', q: ['Awa Odori dancers', 'Awa Odori festival', 'Awaodori'], must: /^(?![\s\S]*(taiwan|taïwan|koenji|kōenji|tokyo|nagoya|memorial hall|kaikan|museum))(?=[\s\S]*(awa|odori|阿波))/i, sources: ['find47', 'wikimedia'], label: 'Awa Odori dancers' },
    { key: 'p1', q: ['Awa Odori Kaikan', 'Awa Odori Museum'], must: /awa|odori|阿波/i, sources: ['find47', 'wikimedia'], label: 'Awa Odori Kaikan stage' },
    { key: 'p2', q: ['Mount Bizan Tokushima', 'Bizan ropeway', 'Bizan'], must: /bizan|眉山/i, label: 'Mount Bizan above the hall' },
  ],
  'iya-kazurabashi': [
    { key: 'hero', q: ['Iya Kazura Bridge', 'Kazura Bridge in Iya', 'kazurabashi'], must: /iya|kazura|vine|祖谷|かずら/i, label: 'Iya Kazurabashi vine bridge' },
    { key: 'p1', q: ['Iyadani Suspension bridge', 'Iya vine bridge crossing', 'Iya Valley'], must: /iya|kazura|vine|祖谷/i, label: 'Crossing the vine bridge' },
    { key: 'p2', q: ['Biwa Falls Iya', 'Iya Valley gorge', 'Iya Onsen'], must: /iya|biwa|祖谷/i, label: 'Iya Valley' },
  ],
  'ryozenji-temple': [
    { key: 'hero', q: ['Ryozenji', 'Ryozen-ji Naruto', 'Ryozenji Temple'], must: /ryozen|霊山寺/i, label: 'Ryōzen-ji, temple no. 1 of the Shikoku pilgrimage' },
    { key: 'p1', q: ['Shikoku pilgrimage henro', 'ohenro pilgrim Shikoku', 'henro'], must: /henro|pilgrim|遍路|巡礼/i, label: 'Rural Shikoku' },
  ],
  'oboke-gorge': [
    { key: 'hero', q: ['Oboke gorge boat', 'Oboke Gorge', 'Yoshino river Tokushima'], must: /oboke|koboke|大歩危|小歩危|yoshino|吉野/i, label: 'Oboke Gorge sightseeing boat' },
    { key: 'p1', q: ['Oboke gorge pleasure boat', 'Oboke Gorge boat'], must: /oboke|大歩危/i, sources: ['find47', 'wikimedia'], label: 'Sightseeing boat in the gorge' },
    { key: 'p2', q: ['Koinobori Oboke Gorge', 'Oboke Gorge Tokushima'], must: /oboke|大歩危|koinobori/i, sources: ['find47', 'wikimedia'], label: 'Koinobori over the gorge in May' },
  ],
  'ishima-island': [
    { key: 'hero', q: ['Ishima Tokushima', 'Ishima Anan', 'Ishima island', 'Ishima lighthouse'], must: /ishima|伊島/i, label: 'Ishima, Anan' },
    { key: 'p1', q: ['Ishima lighthouse', 'Ishima fishing port', 'Ishima Anan'], must: /ishima|伊島/i, label: 'Ishima' },
  ],
  'takegashima-island': [
    { key: 'hero', q: ['Takegashima Kaiyo', 'Takegashima Tokushima', 'Kaiyo Tokushima coast', 'Marine Jam Kaiyo'], must: /takegashima|竹ヶ島|竹ケ島|kaiyo|海陽/i, label: 'Takegashima, Kaiyō' },
    { key: 'p1', q: ['Shishikui Station', 'Asa Coast Railway', 'Shishikui'], must: /shishikui|宍喰|asa/i, label: 'Asa Coast Railway at Shishikui, the gateway to Takegashima' },
  ],
  'shimadajima-island': [
    { key: 'hero', q: ['View from Horikoshi Bridge, Shimada Island', 'Shimada Island Naruto', 'Shimadajima'], must: /shimada|島田/i, label: 'Shimadajima from Horikoshi Bridge' },
    { key: 'p1', q: ['Uchinoumi Naruto', 'Naruto Uchinoumi park', 'Horikoshi Bridge Naruto'], must: /uchinoumi|内ノ海|horikoshi|堀越/i, label: 'Naruto’s inland sea' },
  ],
};
// (pass-2 specs are merged into PHOTOS below)
Object.assign(PHOTOS, {
  // ---- pass 2 (2026-08-17): hand-written specs for the prefectures where auto specs mis-fetched. Only missing keys are fetched.
  shimane: [
    { key: 'hero',  q: ['Izumo Taisha', 'Izumo Grand Shrine', 'Izumo-taisha shimenawa'], must: /izumo|出雲/i, label: 'Izumo Taisha grand shrine' },
    { key: 'tile1', q: ['Matsue Castle', 'Matsue-jo'], must: /matsue|松江/i, label: 'Matsue Castle' },
    { key: 'see1',  q: ['Izumo Taisha shimenawa', 'Izumo Taisha haiden', 'Izumo Taisha'], must: /izumo|出雲/i, label: 'Izumo Taisha' },
    { key: 'see2',  q: ['Matsue Castle keep', 'Matsue Castle', 'Matsue castle moat'], must: /matsue|松江/i, label: 'Matsue Castle keep' },
  ],
  okayama: [
    { key: 'tile4', q: ['Kibitsu Shrine', 'Kibitsu-jinja corridor', 'Kibitsu Jinja Okayama'], must: /kibitsu|吉備津/i, label: 'Kibitsu Shrine' },
    { key: 'tile5', q: ['Bizen ware', 'Bizen-yaki pottery', 'Bizen pottery Imbe'], must: /bizen|備前/i, label: 'Bizen ware pottery' },
    { key: 'see2',  q: ['Okayama Castle', 'Okayama-jo crow castle', 'Ujo Okayama'], must: /okayama.?castle|okayama-jo|ujo|岡山城/i, label: 'Okayama Castle' },
    { key: 'see3',  q: ['Kurashiki Bikan', 'Kurashiki canal', 'Kurashiki'], must: /kurashiki|倉敷/i, label: 'Kurashiki Bikan Historical Quarter' },
    { key: 'food1', q: ['Okayama white peach', 'momo peach Okayama', 'Muscat of Alexandria grapes Okayama'], must: /peach|momo|muscat|grape|桃|ぶどう/i, label: 'Okayama peaches and Muscat grapes' },
    { key: 'food2', q: ['demi katsudon Okayama', 'demikatsu-don', 'katsudon'], must: /katsu|カツ/i, label: 'Demi-katsudon' },
  ],
  tottori: [
    { key: 'tile2', q: ['Sand Museum Tottori', 'Tottori Sand Museum sand sculpture', 'sand sculpture Tottori'], must: /sand museum|sand sculpture|砂の美術館|砂像/i, label: 'The Sand Museum' },
    { key: 'tile3', q: ['Nageiredo', 'Sanbutsuji Nageire-do', 'Mitoku-san Nageiredo'], must: /nageire|投入堂|sanbutsu|三徳/i, label: 'Nageiredō Hall, Mt. Mitoku' },
    { key: 'tile4', q: ['Mount Daisen', 'Daisen Tottori', 'Daisen mountain'], must: /daisen|大山/i, label: 'Mount Daisen' },
    { key: 'see1',  q: ['Tottori Sand Dunes', 'Tottori sakyu', 'Tottori dunes camel'], must: /dune|sakyu|砂丘/i, label: 'Tottori Sand Dunes' },
    { key: 'see2',  q: ['Sand Museum Tottori', 'sand sculpture Tottori'], must: /sand museum|sand sculpture|砂の美術館|砂像/i, label: 'The Sand Museum' },
    { key: 'see3',  q: ['Mizuki Shigeru Road', 'Sakaiminato yokai bronze statue', 'Mizuki Shigeru Road Sakaiminato'], must: /mizuki|sakaiminato|水木|境港/i, label: 'Mizuki Shigeru Road, Sakaiminato' },
    { key: 'food2', q: ['gyukotsu ramen', 'Tottori gyukotsu ramen', 'beef bone ramen Tottori'], must: /ramen|ラーメン/i, label: 'Tottori gyukotsu ramen' },
    { key: 'food3', q: ['Nijisseiki pear', 'twentieth century pear fruit', 'nashi pear Tottori'], must: /pear|nashi|梨/i, label: 'Twentieth Century pear' },
  ],
  hiroshima: [
    { key: 'hero',  q: ['Atomic Bomb Dome', 'Genbaku Dome Hiroshima', 'Hiroshima Peace Memorial'], must: /dome|genbaku|原爆|peace memorial/i, label: 'Atomic Bomb Dome, Peace Memorial Park' },
    { key: 'tile5', q: ['Onomichi', 'Onomichi temple walk', 'Onomichi hillside'], must: /onomichi|尾道/i, label: 'Onomichi hillside alleys' },
    { key: 'see1',  q: ['Atomic Bomb Dome', 'Genbaku Dome', 'Peace Memorial Park Hiroshima'], must: /dome|genbaku|原爆|peace memorial/i, label: 'Atomic Bomb Dome' },
    { key: 'see2',  q: ['Itsukushima Shrine torii', 'Miyajima floating torii', 'Itsukushima'], must: /itsukushima|miyajima|厳島|宮島/i, label: 'Itsukushima Shrine, Miyajima' },
    { key: 'see3',  q: ['Hiroshima Castle', 'Hiroshima-jo', 'Shukkeien garden'], must: /hiroshima castle|hiroshima-jo|shukkei|広島城|縮景園/i, label: 'Hiroshima Castle' },
  ],
  hyogo: [
    { key: 'tile2', q: ['Kitano Ijinkan', 'Kobe Kitano ijinkan-gai', 'Weathercock House Kobe'], must: /kitano|ijinkan|weathercock|異人館|北野/i, label: 'Kitano Ijinkan, Kobe' },
    { key: 'tile3', q: ['Arima Onsen', 'Arima Onsen town', 'Arima hot spring'], must: /arima|有馬/i, label: 'Arima Onsen' },
    { key: 'tile4', q: ['Kinosaki Onsen', 'Kinosaki Onsen canal', 'Kinosaki'], must: /kinosaki|城崎/i, label: 'Kinosaki Onsen' },
    { key: 'tile5', q: ['Kobe harbor night', 'Kobe Port Tower', 'Kobe Meriken Park'], must: /kobe|神戸|meriken|port tower/i, label: 'Kobe harbour' },
    { key: 'see2',  q: ['Kitano Ijinkan', 'Kobe Kitano'], must: /kitano|ijinkan|異人館|北野/i, label: 'Kitano Ijinkan-gai' },
    { key: 'food1', q: ['Kobe beef steak', 'Kobe beef', 'wagyu steak Kobe'], must: /kobe beef|kobe-beef|wagyu|神戸牛|steak/i, label: 'Kobe beef' },
    { key: 'food2', q: ['akashiyaki', 'Akashi-yaki tamagoyaki', 'akashiyaki Akashi'], must: /akashi|明石/i, label: 'Akashiyaki' },
    { key: 'food3', q: ['Himeji oden', 'oden Japan', 'oden pot'], must: /oden|おでん/i, label: 'Himeji oden' },
  ],
  kanagawa: [
    { key: 'tile1', q: ['Great Buddha Kamakura', 'Kamakura Daibutsu', 'Kotoku-in Great Buddha'], must: /daibutsu|great buddha|kotoku|大仏|高徳院/i, label: 'The Great Buddha of Kamakura' },
    { key: 'tile2', q: ['Tsurugaoka Hachimangu', 'Tsurugaoka Hachiman-gu Kamakura', 'Hachimangu Kamakura'], must: /tsurugaoka|hachiman|鶴岡/i, label: 'Tsurugaoka Hachimangū' },
    { key: 'see1',  q: ['Kamakura Daibutsu', 'Great Buddha Kamakura', 'Kotokuin'], must: /daibutsu|great buddha|kotoku|大仏|高徳院/i, label: 'The Great Buddha, Kōtoku-in' },
    { key: 'see2',  q: ['Hakone Shrine torii Lake Ashi', 'Hakone Jinja torii', 'Hakone Shrine'], must: /hakone|箱根/i, label: 'Hakone Shrine torii on Lake Ashi' },
    { key: 'food1', q: ['Yokohama Chinatown gate', 'Yokohama Chukagai', 'Yokohama Chinatown'], must: /chinatown|chukagai|中華街/i, label: 'Yokohama Chinatown' },
    { key: 'food2', q: ['shirasu don', 'shirasu-don Enoshima', 'whitebait bowl'], must: /shirasu|whitebait|しらす/i, label: 'Shirasu-don' },
    { key: 'food3', q: ['Yokosuka navy curry', 'kaigun curry Yokosuka', 'Japanese navy curry'], must: /curry|カレー/i, label: 'Yokosuka Navy Curry' },
  ],
  aomori: [
    { key: 'hero',  q: ['Nebuta Matsuri float', 'Aomori Nebuta', 'Nebuta festival'], must: /nebuta|ねぶた/i, label: 'Nebuta Matsuri float' },
    { key: 'tile1', q: ['Sannai-Maruyama site pit dwelling', 'Sannai Maruyama', 'Sannai-Maruyama'], must: /sannai|maruyama|三内/i, label: 'Sannai-Maruyama site' },
    { key: 'tile3', q: ['Oirase Gorge', 'Oirase stream', 'Oirase Keiryu'], must: /oirase|奥入瀬/i, label: 'Oirase Gorge' },
    { key: 'tile4', q: ['Hirosaki Castle cherry blossoms', 'Hirosaki Park sakura', 'Hirosaki Castle'], must: /hirosaki|弘前/i, label: 'Hirosaki Castle in cherry-blossom season' },
    { key: 'see3',  q: ['Lake Towada', 'Towada-ko', 'Towada lake'], must: /towada|十和田/i, label: 'Lake Towada' },
    { key: 'food1', q: ['Aomori apple orchard', 'Fuji apples Aomori', 'apple orchard Hirosaki'], must: /apple|ringo|りんご|林檎/i, label: 'Aomori apples' },
    { key: 'food2', q: ['ichigoni', 'ichigo-ni sea urchin soup', 'uni abalone soup Hachinohe'], must: /ichigo|いちご煮|uni|abalone/i, label: 'Ichigo-ni' },
    { key: 'food3', q: ['Aomori Nokke-don', 'nokkedon Aomori', 'Aomori Gyosai Center'], must: /nokke|のっけ|gyosai|魚菜/i, label: 'Nokke-don at Aomori Gyosai Center' },
  ],
  hokkaido: [
    { key: 'tile2', q: ['Sapporo Clock Tower', 'Sapporo Tokeidai', 'Former Hokkaido Government Office red brick'], must: /clock tower|tokeidai|red brick|akarenga|時計台|赤れんが/i, label: 'Sapporo Clock Tower' },
    { key: 'tile3', q: ['Sapporo Snow Festival snow sculpture', 'Yuki Matsuri Odori Park', 'Sapporo Snow Festival'], must: /snow festival|yuki matsuri|雪まつり|snow sculpture/i, label: 'Sapporo Snow Festival' },
    { key: 'tile4', q: ['Upopoy', 'Upopoy National Ainu Museum', 'Poroto Kotan Shiraoi'], must: /upopoy|poroto|shiraoi|白老|ウポポイ/i, label: 'Upopoy National Ainu Museum and Park' },
    { key: 'tile5', q: ['Lake Akan', 'Akanko Ainu Kotan', 'Lake Akan Hokkaido'], must: /akan|阿寒/i, label: 'Lake Akan' },
    { key: 'see3',  q: ['Sapporo Snow Festival', 'Yuki Matsuri Sapporo', 'snow sculpture Sapporo'], must: /snow festival|yuki matsuri|雪まつり|snow sculpture/i, label: 'Sapporo Snow Festival' },
  ],
});
// ---- blog article photo sets (2026-08-19): collectible-cluster articles get 8-12 in-body photos.
// Wikimedia first (curated titles, no personality-rights surprises), Flickr second. Every candidate is
// eyeballed before injection (scripts/inject-article-photos.mjs reads img-credits-multi.json).
Object.assign(PHOTOS, {
  'tori-no-ichi-kumade-japan': [
    { key: 'dates',   q: ['Tori no Ichi Otori Shrine Asakusa night', 'Tori no ichi Asakusa lanterns', 'Ootori jinja Asakusa'], must: /tori.?no.?ichi|otori|ootori|鷲神社|酉の市/i, sources: ['wikimedia', 'flickr'], label: 'Ōtori Shrine, Asakusa, on a rooster night' },
    { key: 'hours',   q: ['Tori no Ichi crowd night', 'Tori-no-ichi Hanazono Shrine night', 'Tori no ichi Shinjuku'], must: /tori.?no.?ichi|hanazono|花園|酉の市/i, sources: ['wikimedia', 'flickr'], label: 'The market runs through the night' },
    { key: 'kumade',  q: ['kumade rake decorated', 'kumade Tori no Ichi', 'engi kumade'], must: /kumade|熊手|rake/i, sources: ['wikimedia', 'flickr'], label: 'A decorated kumade' },
    { key: 'kumade2', q: ['kumade stall lucky charms', 'kumade okame', 'Tori no Ichi kumade stall'], must: /kumade|熊手|tori.?no.?ichi|酉の市/i, sources: ['wikimedia', 'flickr'], label: 'Kumade stall' },
    { key: 'kumade3', q: ['酉の市Torinoichi000'], must: /^酉の市Torinoichi000/i, sources: ['wikimedia'], label: 'A kumade sold at Ōtori Shrine' }, // hand-picked 2026-08-19
    { key: 'stall',   q: ['Hanazono shrine tori no ichi fair20251124'], must: /Hanazono shrine tori no ichi fair2025/i, sources: ['wikimedia'], label: 'Inside a kumade stall, Hanazono Shrine, November 2025' }, // hand-picked
    { key: 'asakusa', q: ['Ootori jinja.JPG', 'Ootori jinja'], must: /^Ootori jinja\.JPG/i, sources: ['wikimedia'], label: 'Ōtori Shrine, Asakusa, dressed for the market' }, // hand-picked
    { key: 'where1',  q: ['Hanazono Shrine Shinjuku', 'Hanazono Jinja', 'Hanazono Shrine torii'], must: /hanazono|花園神社/i, sources: ['wikimedia', 'flickr'], label: 'Hanazono Shrine, Shinjuku' },
    { key: 'where2',  q: ['Chokoku-ji (Taito)03'], must: /^Chokoku-ji \(Taito\)03/i, sources: ['wikimedia'], label: 'Chōkoku-ji, beside Ōtori Shrine' }, // hand-picked (auto pick was the Ena temple of the same name)
    { key: 'kansai',  q: ['Otori Taisha Sakai', 'Ōtori taisha', 'Otori Grand Shrine Sakai'], must: /[oō]tori.?taisha|大鳥大社|sakai|堺/i, sources: ['wikimedia', 'flickr'], label: 'Ōtori Taisha, Sakai' },
    { key: 'okame',   q: ['Otori Shrine @ Iriya (13824370665)'], must: /Otori Shrine @ Iriya \(13824370665\)/i, sources: ['wikimedia'], label: 'Okame on a giant kumade at Ōtori Shrine' }, // hand-picked
  ],
  'japan-aquariums-compared': [ // hand-picked from Commons candidate sheets 2026-08-19
    { key: 'lede', q: ['Okinawa Aquarium.jpg'], must: /^Okinawa Aquarium\.jpg/i, sources: ['wikimedia'], label: 'The Kuroshio Sea tank at Okinawa Churaumi Aquarium' },
    { key: 'aquamarine', q: ['Aquamarine Fukushima 20100124.JPG'], must: /^Aquamarine Fukushima 20100124\.JPG/i, sources: ['wikimedia'], label: 'Aquamarine Fukushima, Iwaki' },
    { key: 'churaumi2', q: ['Whale Shark - Churaumi aquarium, Okinawa, Japan.jpg'], must: /^Whale Shark - Churaumi aquarium, Okinawa, Japan\.jpg/i, sources: ['wikimedia'], label: 'Whale shark, Okinawa Churaumi Aquarium' },
    { key: 'kaiyukan', q: ['The spectacular Whale shark (6453177275).jpg'], must: /^The spectacular Whale shark \(6453177275\)\.jpg/i, sources: ['wikimedia'], label: 'Whale shark in the Pacific tank, Osaka Kaiyukan' },
    { key: 'kamogawa', q: ['Orca show at Kamogawa Sea World 3.jpg'], must: /^Orca show at Kamogawa Sea World 3\.jpg/i, sources: ['wikimedia'], label: 'Orca show, Kamogawa Sea World' },
    { key: 'kamo', q: ['Kamo Aquarium 20160505.jpg'], must: /^Kamo Aquarium 20160505\.jpg/i, sources: ['wikimedia'], label: 'Kamo Aquarium on the Tsuruoka coast' },
    { key: 'nagoya', q: ['Port of Nagoya Public Aquarium1.jpg'], must: /^Port of Nagoya Public Aquarium1\.jpg/i, sources: ['wikimedia'], label: 'Port of Nagoya Public Aquarium' },
    { key: 'notojima', q: ['のとじま水族館.JPG'], must: /^のとじま水族館\.JPG/i, sources: ['wikimedia'], label: 'Notojima Aquarium' },
    { key: 'sumida', q: ['Fishes in Sumida Aquarium 20180215.jpg'], must: /^Fishes in Sumida Aquarium 20180215\.jpg/i, sources: ['wikimedia'], label: 'Sumida Aquarium, Tokyo Skytree Town' },
    { key: 'tuna', q: ['Pacific bluefin tuna.jpg'], must: /^Pacific bluefin tuna\.jpg/i, sources: ['wikimedia'], label: 'Pacific bluefin tuna — the species in Kasai\'s doughnut tank' },
    { key: 'kyoto', q: ['KYOTO AQUARIUM.JPG'], must: /^KYOTO AQUARIUM\.JPG/i, sources: ['wikimedia'], label: 'Kyoto Aquarium' },
    { key: 'toba', q: ['Dugong Serena.jpg'], must: /^Dugong Serena\.jpg/i, sources: ['wikimedia'], label: 'Serena the dugong, Toba Aquarium' },
    { key: 'biwako', q: ['Lake Biwa Aquarium.jpg'], must: /^Lake Biwa Aquarium\.jpg/i, sources: ['wikimedia'], label: 'The tunnel tank at the Lake Biwa Museum' },
    { key: 'salamander', q: ['Andrias japonicus pair.jpg'], must: /^Andrias japonicus pair\.jpg/i, sources: ['wikimedia'], label: 'Japanese giant salamanders' },
  ],
  'japan-inhabited-islands': [ // hand-picked from Commons candidate sheets 2026-08-19
    { key: 'hero', q: ['久賀島.JPG'], must: /^久賀島\.JPG/i, sources: ['wikimedia'], label: 'Hisakajima in the Gotō Islands, Nagasaki — houses, boats and one road' },
    { key: 'setouchi', q: ['Shodo seen from the ferry (6453265785).jpg'], must: /^Shodo seen from the ferry \(6453265785\)\.jpg/i, sources: ['wikimedia'], label: 'Islands of the Seto Inland Sea from the ferry deck' },
    { key: 'ferry', q: ['Island Kofujikisen.jpg'], must: /^Island Kofujikisen\.jpg/i, sources: ['wikimedia'], label: 'A local island ferry in the Seto Inland Sea' },
    { key: 'aogashima', q: ['Aogasima maruyama.jpg'], must: /^Aogasima maruyama\.jpg/i, sources: ['wikimedia'], label: 'Aogashima, Tokyo — a village of about 170 people inside a volcanic caldera' },
    { key: 'shikine', q: ['赤崎遊歩道付近から式根島 - panoramio.jpg'], must: /^赤崎遊歩道付近から式根島 - panoramio\.jpg/i, sources: ['wikimedia'], label: 'Shikinejima in the Izu Islands, seen from the shore' },
    { key: 'naoshima', q: ['Naoshima honmura port terminal.jpg'], must: /^Naoshima honmura port terminal\.jpg/i, sources: ['wikimedia'], label: 'Honmura ferry terminal on Naoshima, Kagawa' },
    { key: 'gotosat', q: ['Goto Islands ISS065.jpg'], must: /^Goto Islands ISS065\.jpg/i, sources: ['wikimedia'], label: 'The Gotō archipelago off Nagasaki, photographed from the ISS' },
  ],
  'goshuin-temple-shrine-stamps': [ // hand-picked from Commons candidate sheets 2026-08-19
    { key: 'kashima', q: ['鹿島神宮・御朱印.jpg'], must: /^鹿島神宮・御朱印\.jpg/i, sources: ['wikimedia'], label: 'A goshuin from Kashima Jingū: brushed calligraphy over the shrine\'s vermilion seals' },
    { key: 'munakata', q: ['宗像大社沖津宮御朱印.jpg'], must: /^宗像大社沖津宮御朱印\.jpg/i, sources: ['wikimedia'], label: 'Goshuin of Munakata Taisha\'s Okitsu-gū' },
    { key: 'book', q: ['Goshuincho with five shuin.jpg'], must: /^Goshuincho with five shuin\.jpg/i, sources: ['wikimedia'], label: 'A goshuinchō open at five entries' },
    { key: 'office', q: ['猿田彦神社 - 授与所.jpg'], must: /^猿田彦神社 - 授与所\.jpg/i, sources: ['wikimedia'], label: 'The juyosho (shrine office) at Sarutahiko Shrine, Ise — where you ask' },
    { key: 'queue', q: ['11 jyuyo.jpg'], must: /^11 jyuyo\.jpg/i, sources: ['wikimedia'], label: 'Waiting at a shrine office window' },
    { key: 'sign', q: ['Omuroyama Sengen Shrine Shuin sign 2.jpg'], must: /^Omuroyama Sengen Shrine Shuin sign 2\.jpg/i, sources: ['wikimedia'], label: 'A shrine sign in three languages: the stamp is only for those who received a goshuin' },
    { key: 'fushimi', q: ['Fushimi Inari Romon Torii.jpg'], must: /^Fushimi Inari Romon Torii\.jpg/i, sources: ['wikimedia'], label: 'Fushimi Inari Taisha, Kyoto — one of the most-visited goshuin spots in Japan' },
    { key: 'seasonal', q: ['Sanoharagoshuin01.jpg'], must: /^Sanoharagoshuin01\.jpg/i, sources: ['wikimedia'], label: 'A seasonal, colour-printed goshuin' },
    { key: 'ishiura', q: ['Ishiura Shrine Goshuin 20200820.jpg'], must: /^Ishiura Shrine Goshuin 20200820\.jpg/i, sources: ['wikimedia'], label: 'A limited goshuin from Ishiura Shrine, Kanazawa' },
  ],
  'eki-stamps-japan': [ // hand-picked from Commons candidate sheets 2026-08-19
    { key: 'tokyo', q: ['Tokyo station eki stamp.jpg'], must: /^Tokyo station eki stamp\.jpg/i, sources: ['wikimedia'], label: 'The Tokyo Station eki stamp, with the Marunouchi building in the design' },
    { key: 'nippori', q: ['Nippori station eki stamp.jpg'], must: /^Nippori station eki stamp\.jpg/i, sources: ['wikimedia'], label: 'Nippori Station\'s stamp' },
    { key: 'stand', q: ['Watashinotabi-Stump-Stand.JPG'], must: /^Watashinotabi-Stump-Stand\.JPG/i, sources: ['wikimedia'], label: 'A "Watashi no Tabi" stamp stand — the classic JR East design' },
    { key: 'himeji', q: ['Memorial Stamp of Himeji Station.jpg'], must: /^Memorial Stamp of Himeji Station\.jpg/i, sources: ['wikimedia'], label: 'The stamp desk at JR Himeji Station' },
    { key: 'kaze', q: ['風の峠駅駅スタンプ.jpg'], must: /^風の峠駅駅スタンプ\.jpg/i, sources: ['wikimedia'], label: 'A stamp impression: every station\'s design is different' },
    { key: 'nara', q: ['奈良駅 2014 駅スタンプ (14003064021).jpg'], must: /^奈良駅 2014 駅スタンプ \(14003064021\)\.jpg/i, sources: ['wikimedia'], label: 'Stamping at Nara Station' },
    { key: 'marunouchi', q: ['Tokyo Station (Marunouchi Building) 1.jpg'], must: /^Tokyo Station \(Marunouchi Building\) 1\.jpg/i, sources: ['wikimedia'], label: 'Tokyo Station\'s Marunouchi building — the image on its stamp' },
  ],
  'gojoin-castle-stamps-japan': [ // hand-picked from Commons candidate sheets 2026-08-26
    { key: 'hikone', q: ['Hikone castle5537.JPG'], must: /^Hikone castle5537\.JPG/i, sources: ['wikimedia'], label: 'Hikone Castle, Shiga — a National Treasure keep whose gojōin carries the Ii clan crest' },
    { key: 'oshi', q: ['Oshi Castle 忍城 - panoramio.jpg'], must: /^Oshi Castle 忍城 - panoramio\.jpg/i, sources: ['wikimedia'], label: 'Oshi Castle in Gyōda, Saitama — the "floating castle" with rotating limited-edition gojōin' },
    { key: 'ueda', q: ['The gate of Ueda castle (2020394910).jpg'], must: /^The gate of Ueda castle \(2020394910\)\.jpg/i, sources: ['wikimedia'], label: 'Ueda Castle\'s gate, Nagano — its gojōin bears the Sanada six-coin crest' },
  ],
  'japan-100-castles-goshuin': [ // hand-picked from Commons candidate sheets 2026-08-19
    { key: 'himeji', q: ['Himeji castle-Daitensyu.jpg'], must: /^Himeji castle-Daitensyu\.jpg/i, sources: ['wikimedia'], label: 'Himeji Castle\'s main keep — No. 59 on the 100 Famous Castles list and an original keep' },
    { key: 'hikone', q: ['Hikone Castle November 2016 -02.jpg'], must: /^Hikone Castle November 2016 -02\.jpg/i, sources: ['wikimedia'], label: 'Hikone Castle, one of the five keeps designated National Treasures' },
    { key: 'nijo', q: ['どうする家康 二条城御城印.jpg'], must: /^どうする家康 二条城御城印\.jpg/i, sources: ['wikimedia'], label: 'A gojōin from Nijō Castle, Kyoto — the paid castle certificate, not the rally stamp' },
    { key: 'kamakura', q: ['鎌倉殿御城印.jpg'], must: /^鎌倉殿御城印\.jpg/i, sources: ['wikimedia'], label: 'A commemorative gojōin' },
    { key: 'matsue', q: ['Matsue castle01bs4592.jpg'], must: /^Matsue castle01bs4592\.jpg/i, sources: ['wikimedia'], label: 'Matsue Castle — original keep, National Treasure since 2015' },
    { key: 'inuyama', q: ['Castle in Inuyama.JPG'], must: /^Castle in Inuyama\.JPG/i, sources: ['wikimedia'], label: 'Inuyama Castle in cherry-blossom season — one of the twelve original keeps' },
    { key: 'stairs', q: ['松本城天守内階段.JPG'], must: /^松本城天守内階段\.JPG/i, sources: ['wikimedia'], label: 'Inside Matsumoto Castle\'s keep: the steep original stairs are the tell of a real one' },
  ],
  'autumn-goshuin-momiji-japan': [ // hand-picked from Commons candidate sheets 2026-08-19
    { key: 'tofukuji', q: ['TofukujiTsutenkyo Koyou.jpg'], must: /^TofukujiTsutenkyo Koyou\.jpg/i, sources: ['wikimedia'], label: 'Tsūten-kyō bridge at Tōfuku-ji, Kyoto, in autumn colour' },
    { key: 'shimogamo', q: ['下賀茂神社の西参道の鳥居と紅葉 Pcs34560 IMG3374.jpg'], must: /^下賀茂神社の西参道の鳥居と紅葉 Pcs34560 IMG3374\.jpg/i, sources: ['wikimedia'], label: 'Autumn at Shimogamo Shrine\'s west approach, Kyoto' },
    { key: 'korankei1', q: ['香嵐渓の紅葉 (愛知県豊田市足助町) - panoramio.jpg'], must: /^香嵐渓の紅葉 \(愛知県豊田市足助町\) - panoramio\.jpg/i, sources: ['wikimedia'], label: 'Kōrankei gorge, Aichi, at peak colour' },
    { key: 'korankei2', q: ['香嵐渓 (愛知県豊田市足助町) - panoramio (5).jpg'], must: /^香嵐渓 \(愛知県豊田市足助町\) - panoramio \(5\)\.jpg/i, sources: ['wikimedia'], label: 'The red Taigetsu-kyō bridge at Kōrankei' },
    { key: 'lightup', q: ['紅葉ライトアップ 田村神社 東参道途中.jpg'], must: /^紅葉ライトアップ 田村神社 東参道途中\.jpg/i, sources: ['wikimedia'], label: 'Autumn illumination on a shrine approach' },
  ],
  'goshuincho-guide-japan': [ // hand-picked from Commons candidate sheets 2026-08-19
    { key: 'open', q: ['Goshuincho with five shuin.jpg'], must: /^Goshuincho with five shuin\.jpg/i, sources: ['wikimedia'], label: 'A goshuinchō open at five entries' },
    { key: 'bag', q: ['Red stamp book drawstring bag.jpg'], must: /^Red stamp book drawstring bag\.jpg/i, sources: ['wikimedia'], label: 'A drawstring bag for carrying the book' },
    { key: 'isagawa', q: ['Isagawa-jinja Shuin.jpg'], must: /^Isagawa-jinja Shuin\.jpg/i, sources: ['wikimedia'], label: 'A page from Isagawa Shrine, Nara' },
    { key: 'office', q: ['猿田彦神社 - 授与所.jpg'], must: /^猿田彦神社 - 授与所\.jpg/i, sources: ['wikimedia'], label: 'The shrine office where the book is written in' },
  ],
  'goshuincho-stamp-notebooks-guide': [ // hand-picked from Commons candidate sheets 2026-08-19
    { key: 'open', q: ['Goshuincho with five shuin.jpg'], must: /^Goshuincho with five shuin\.jpg/i, sources: ['wikimedia'], label: 'A goshuinchō open at five entries' },
    { key: 'bag', q: ['Red stamp book drawstring bag.jpg'], must: /^Red stamp book drawstring bag\.jpg/i, sources: ['wikimedia'], label: 'A drawstring bag for carrying the book' },
    { key: 'sign', q: ['Omuroyama Sengen Shrine Shuin sign 2.jpg'], must: /^Omuroyama Sengen Shrine Shuin sign 2\.jpg/i, sources: ['wikimedia'], label: 'A shrine sign: the stamp is only for those who received a goshuin — not a stamp rally' },
  ],
  'kirie-goshuin-japan': [ // hand-picked from Commons candidate sheets 2026-08-19
    { key: 'open', q: ['Goshuincho with five shuin.jpg'], must: /^Goshuincho with five shuin\.jpg/i, sources: ['wikimedia'], label: 'A goshuinchō — kirie goshuin are usually handed out on loose sheets to keep with it' },
    { key: 'bag', q: ['Red stamp book drawstring bag.jpg'], must: /^Red stamp book drawstring bag\.jpg/i, sources: ['wikimedia'], label: 'A drawstring bag protects the book and loose sheets' },
  ],
  'character-manholes-japan': [ // hand-picked from Commons candidate sheets 2026-08-19
    { key: 'yura', q: ['Yura Station.jpg'], must: /^Yura Station\.jpg/i, sources: ['wikimedia'], label: 'Yura Station in Hokuei, Tottori — the gateway to the Conan manholes' },
    { key: 'ashi', q: ['Sightseeing Cruise @ Lake Ashi @ From Togendai to Hakone-Machi (10621220604).jpg'], must: /^Sightseeing Cruise @ Lake Ashi @ From Togendai to Hakone-Machi \(10621220604\)\.jpg/i, sources: ['wikimedia'], label: 'Lake Ashi, Hakone — the Evangelion covers are around the lake towns' },
  ],
  'japan-towns-to-live': [ // hand-picked from Commons candidate sheets 2026-08-19 (JLF hero images were not good enough)
    { key: 'omihachiman', q: ['Hachimanbori07s3200.jpg'], must: /^Hachimanbori07s3200\.jpg/i, sources: ['wikimedia'], label: 'Hachiman-bori moat, Omihachiman, Shiga' },
    { key: 'mishima', q: ['Genbei River 2011-09-18 (a).jpg'], must: /^Genbei River 2011-09-18 \(a\)\.jpg/i, sources: ['wikimedia'], label: 'The Genbei River, spring water through central Mishima' },
    { key: 'matsue', q: ['Matsue Castle in Japan, Horikawa Moats 松江城 堀川遊覧船.jpg'], must: /^Matsue Castle in Japan, Horikawa Moats 松江城 堀川遊覧船\.jpg/i, sources: ['wikimedia'], label: 'Matsue Castle and the Horikawa moat boats' },
    { key: 'yanagawa', q: ['Yanagawa cruise ac (1).jpg'], must: /^Yanagawa cruise ac \(1\)\.jpg/i, sources: ['wikimedia'], label: 'Poling the canals of Yanagawa, Fukuoka' },
    { key: 'gujo', q: ['Gujo-shi Gujo-hachiman kitamachi, Gifu, castle town.JPG'], must: /^Gujo-shi Gujo-hachiman kitamachi, Gifu, castle town\.JPG/i, sources: ['wikimedia'], label: 'Gujō Hachiman, Gifu' },
    { key: 'ogaki', q: ['Ogaki City Suimon River 2010-10.JPG'], must: /^Ogaki City Suimon River 2010-10\.JPG/i, sources: ['wikimedia'], label: 'The Suimon River in Ōgaki, Gifu' },
    { key: 'hikone', q: ['Hikone castle5537.JPG'], must: /^Hikone castle5537\.JPG/i, sources: ['wikimedia'], label: 'Hikone Castle keep — a National Treasure' },
    { key: 'inuyama', q: ['Castle in Inuyama.JPG'], must: /^Castle in Inuyama\.JPG/i, sources: ['wikimedia'], label: 'Inuyama Castle above the Kiso River' },
    { key: 'hirosaki', q: ['Cherry blossoms along the moat of Hirosaki Castle at night 20260420a.jpg'], must: /^Cherry blossoms along the moat of Hirosaki Castle at night 20260420a\.jpg/i, sources: ['wikimedia'], label: 'Cherry blossoms along the moat of Hirosaki Castle' },
    { key: 'takayama', q: ['Sanmachi Takayama02ds3872.jpg'], must: /^Sanmachi Takayama02ds3872\.jpg/i, sources: ['wikimedia'], label: 'Sanmachi, the preserved merchant streets of Takayama' },
    { key: 'hagi', q: ['Hagi-Horiuchi Yamaguchi samurai quarter.JPG'], must: /^Hagi-Horiuchi Yamaguchi samurai quarter\.JPG/i, sources: ['wikimedia'], label: 'The Horiuchi samurai quarter, Hagi' },
    { key: 'matsumoto', q: ['Matsumoto Castle05s5s4592.jpg'], must: /^Matsumoto Castle05s5s4592\.jpg/i, sources: ['wikimedia'], label: 'Matsumoto Castle' },
  ],
  'seto-inland-sea-islands': [ // hand-picked 2026-08-19
    { key: 'hero', q: ['男木島の集落2015-11-03 001.JPG'], must: /^男木島の集落2015-11-03 001\.JPG/i, sources: ['wikimedia'], label: 'The village of Ogijima, Kagawa, stacked up its hill above the harbour' },
    { key: 'angel', q: ['Angel Road Shodo Island Japan11bs5.jpg'], must: /^Angel Road Shodo Island Japan11bs5\.jpg/i, sources: ['wikimedia'], label: 'Angel Road sandbar, Shōdoshima' },
    { key: 'itsukushima', q: ['厳島神社と大鳥居.JPG'], must: /^厳島神社と大鳥居\.JPG/i, sources: ['wikimedia'], label: 'Itsukushima Shrine and its great torii, Miyajima' },
    { key: 'oyamazumi', q: ['Ōyamazumi-jinja shinmon.JPG'], must: /^Ōyamazumi-jinja shinmon\.JPG/i, sources: ['wikimedia'], label: 'Ōyamazumi Shrine on Ōmishima, the guardian shrine of the Inland Sea' },
  ],
  'japan-zoos-compared': [ // hand-picked 2026-08-19
    { key: 'hero', q: ['旭山動物園 (2309862259).jpg'], must: /^旭山動物園 \(2309862259\)\.jpg/i, sources: ['wikimedia'], label: 'King penguins on their winter walk at Asahiyama Zoo, Asahikawa' },
    { key: 'tama', q: ['多摩動物公園ライオンバス (7917055360).jpg'], must: /^多摩動物公園ライオンバス \(7917055360\)\.jpg/i, sources: ['wikimedia'], label: 'The lion bus at Tama Zoological Park' },
    { key: 'fuji', q: ['富士サファリパーク ライオン2 Fuji-safari-park-Lion2.jpg'], must: /^富士サファリパーク ライオン2 Fuji-safari-park-Lion2\.jpg/i, sources: ['wikimedia'], label: 'Lions at Fuji Safari Park' },
    { key: 'tsushima', q: ['Tsushima Cat 001.jpg'], must: /^Tsushima Cat 001\.jpg/i, sources: ['wikimedia'], label: 'Tsushima leopard cat — the endangered island cat bred in a handful of Japanese zoos' },
    { key: 'serow', q: ['Capricornis crispus s2.jpg'], must: /^Capricornis crispus s2\.jpg/i, sources: ['wikimedia'], label: 'Japanese serow, a native mountain goat-antelope, in the wild' },
    { key: 'koala', q: ['コアラ（東山動植物園）.JPG'], must: /^コアラ（東山動植物園）\.JPG/i, sources: ['wikimedia'], label: 'Koala at Higashiyama Zoo, Nagoya' },
    { key: 'nogeyama', q: ['Nogeyama Zoo.JPG'], must: /^Nogeyama Zoo\.JPG/i, sources: ['wikimedia'], label: 'Nogeyama Zoo, Yokohama — free entry' },
  ],
  'nagasaki-islands': [ // hand-picked 2026-08-19
    { key: 'hero', q: ['Aso Bay viewed from Mount Jo-2.jpg'], must: /^Aso Bay viewed from Mount Jo-2\.jpg/i, sources: ['wikimedia'], label: 'Asō Bay, Tsushima — the drowned valleys of the island\'s middle' },
    { key: 'church', q: ['Kashiragashima Church-1.JPG'], must: /^Kashiragashima Church-1\.JPG/i, sources: ['wikimedia'], label: 'Kashiragashima Church, one of the Gotō churches on the World Heritage list' },
    { key: 'hirado', q: ['Sight of the juxtaposition of Church and Buddhist Temples, Kagamigawa-cho Hirado 2014.jpg'], must: /^Sight of the juxtaposition of Church and Buddhist Temples, Kagamigawa-cho Hirado 2014\.jpg/i, sources: ['wikimedia'], label: 'Hirado — a church spire behind Buddhist temple roofs, the island\'s signature view' },
    { key: 'iki', q: ['Saruiwa 2009A.jpg'], must: /^Saruiwa 2009A\.jpg/i, sources: ['wikimedia'], label: 'Saruiwa, the monkey rock, on Iki' },
  ],
  'sea-of-japan-islands': [ // hand-picked 2026-08-19
    { key: 'hero', q: ['View of Kuniga coast, Nishinoshima (1).jpg'], must: /^View of Kuniga coast, Nishinoshima \(1\)\.jpg/i, sources: ['wikimedia'], label: 'The Kuniga coast of Nishinoshima, Oki Islands' },
    { key: 'oki2', q: ['Tsūtenkyō Arch at Kuniga coast, Nishinoshima.jpg'], must: /^Tsūtenkyō Arch at Kuniga coast, Nishinoshima\.jpg/i, sources: ['wikimedia'], label: 'Tsūtenkyō arch on the Kuniga coast, Oki' },
    { key: 'rebun', q: ['Rebun Island 20140814-2.jpg'], must: /^Rebun Island 20140814-2\.jpg/i, sources: ['wikimedia'], label: 'Rebun Island, the northernmost inhabited island in Japan' },
    { key: 'sado', q: ['Taraibune in Sado Ogi.jpg'], must: /^Taraibune in Sado Ogi\.jpg/i, sources: ['wikimedia'], label: 'Tub boats at Ogi, Sado' },
    { key: 'rishiri', q: ['Mt Rishiri.jpg'], must: /^Mt Rishiri\.jpg/i, sources: ['wikimedia'], label: 'Mount Rishiri — the whole island is the volcano' },
    { key: 'tsunoshima', q: ['角島大橋 (38654569244).jpg'], must: /^角島大橋 \(38654569244\)\.jpg/i, sources: ['wikimedia'], label: 'Tsunoshima Bridge, Yamaguchi' },
    { key: 'hegura', q: ['Hegura island -13 (175815774).jpg'], must: /^Hegura island -13 \(175815774\)\.jpg/i, sources: ['wikimedia'], label: 'Hegurajima, 50 km off the Noto Peninsula — a village of ama divers' },
    { key: 'noko', q: ['Beach on Nokonoshima Island 20140506-1.JPG'], must: /^Beach on Nokonoshima Island 20140506-1\.JPG/i, sources: ['wikimedia'], label: 'Nokonoshima, ten minutes from Fukuoka' },
  ],
  'izu-ogasawara-islands': [ // hand-picked 2026-08-19
    { key: 'hero', q: ['Minamijima.jpg'], must: /^Minamijima\.jpg/i, sources: ['wikimedia'], label: 'Ōgiike lagoon on Minamijima, off Chichijima — the Ogasawara Islands' },
    { key: 'aogashima', q: ['Aogasima maruyama.jpg'], must: /^Aogasima maruyama\.jpg/i, sources: ['wikimedia'], label: 'Aogashima: the Maruyama cone inside the outer caldera' },
    { key: 'chichijima', q: ['Port of Futami, Chichijima, Ogasawara.jpg'], must: /^Port of Futami, Chichijima, Ogasawara\.jpg/i, sources: ['wikimedia'], label: 'Futami port, Chichijima — where the Ogasawara-maru arrives after 24 hours' },
    { key: 'hahajima', q: ['View from Kofuji at Hahajima 2.jpg'], must: /^View from Kofuji at Hahajima 2\.jpg/i, sources: ['wikimedia'], label: 'Hahajima from Kofuji, at the southern end of the inhabited islands' },
    { key: 'hachijo', q: ['Mount Hachijofuji.jpg'], must: /^Mount Hachijofuji\.jpg/i, sources: ['wikimedia'], label: 'Hachijō-Fuji, Hachijōjima' },
    { key: 'kozu', q: ['Kozushima village (DSC03444).jpeg'], must: /^Kozushima village \(DSC03444\)\.jpeg/i, sources: ['wikimedia'], label: 'Kōzushima village from the hill' },
    { key: 'niijima', q: ['Niijima Habushiura Beach.jpg'], must: /^Niijima Habushiura Beach\.jpg/i, sources: ['wikimedia'], label: 'Habushiura, the six-kilometre surf beach on Niijima' },
    { key: 'miyake', q: ['View of Miyakejima from aircraft.jpg'], must: /^View of Miyakejima from aircraft\.jpg/i, sources: ['wikimedia'], label: 'Miyakejima from the air, Mount Oyama in the middle' },
    { key: 'mihara', q: ['Crater Lookout @ Mount Mihara @ Oshima (9612795532).jpg'], must: /^Crater Lookout @ Mount Mihara @ Oshima \(9612795532\)\.jpg/i, sources: ['wikimedia'], label: 'The crater of Mount Mihara, Izu Ōshima' },
  ],
  'nansei-islands': [ // hand-picked 2026-08-19
    { key: 'hero', q: ['Aerial view of Ishigaki island Taketomi and Kohama 2014.jpg'], must: /^Aerial view of Ishigaki island Taketomi and Kohama 2014\.jpg/i, sources: ['wikimedia'], label: 'Taketomi and Kohama on the reef off Ishigaki, Yaeyama Islands' },
    { key: 'taketomi', q: ['Village in Taketomi Island - located at southwest Japan.jpg'], must: /^Village in Taketomi Island - located at southwest Japan\.jpg/i, sources: ['wikimedia'], label: 'The red-roofed village on Taketomi' },
    { key: 'hateruma', q: ['Hateruma nishihama 2.jpg'], must: /^Hateruma nishihama 2\.jpg/i, sources: ['wikimedia'], label: 'Nishihama on Hateruma, the southernmost inhabited island in Japan' },
    { key: 'yonaguni', q: ['Yonaguni agarizaki.jpg'], must: /^Yonaguni agarizaki\.jpg/i, sources: ['wikimedia'], label: 'Cape Agarizaki, Yonaguni — Taiwan is 111 km west' },
    { key: 'zamami', q: ['Ama beach in Zamami Island.jpg'], must: /^Ama beach in Zamami Island\.jpg/i, sources: ['wikimedia'], label: 'Ama beach, Zamami — the Kerama Islands' },
    { key: 'irabu', q: ['Miyako irabu ohashi 2014 1.jpg'], must: /^Miyako irabu ohashi 2014 1\.jpg/i, sources: ['wikimedia'], label: 'The Irabu Bridge from Miyako — 3.5 km, toll-free' },
    { key: 'yakushima', q: ['Shiratani Unsui Gorge 06.jpg'], must: /^Shiratani Unsui Gorge 06\.jpg/i, sources: ['wikimedia'], label: 'Shiratani Unsuikyō, Yakushima' },
    { key: 'suwanose', q: ['Suwanosejima.jpg'], must: /^Suwanosejima\.jpg/i, sources: ['wikimedia'], label: 'Suwanosejima, Tokara — an island that is mostly an active volcano' },
    { key: 'amami', q: ['Amami beach.jpg'], must: /^Amami beach\.jpg/i, sources: ['wikimedia'], label: 'A bay on Amami Ōshima' },
  ],
  'pacific-coast-islands': [ // hand-picked 2026-08-19
    { key: 'hero', q: ['Kashiwajima 01.jpg'], must: /^Kashiwajima 01\.jpg/i, sources: ['wikimedia'], label: 'Kashiwajima, Kōchi — a fishing village on a bridged islet at the end of Shikoku' },
    { key: 'matsushima', q: ['Matsushima miyagi z.JPG'], must: /^Matsushima miyagi z\.JPG/i, sources: ['wikimedia'], label: 'Matsushima Bay, Miyagi — the inhabited islands are the ones behind the famous ones' },
    { key: 'tashiro', q: ['Nekotarou(a cat of Tashirojima island).JPG'], must: /^Nekotarou\(a cat of Tashirojima island\)\.JPG/i, sources: ['wikimedia'], label: 'A resident of Tashirojima, the cat island off Ishinomaki' },
    { key: 'enoshima', q: ['Fujisawa as seen from Enoshima Island 130809 7.jpg'], must: /^Fujisawa as seen from Enoshima Island 130809 7\.jpg/i, sources: ['wikimedia'], label: 'Enoshima — the torii at the top of the shopping street, Fujisawa behind' },
    { key: 'jogashima', q: ['Umanose-Domon Jogashima Island.jpg'], must: /^Umanose-Domon Jogashima Island\.jpg/i, sources: ['wikimedia'], label: 'Umanose-dōmon, the rock arch on Jōgashima at the tip of the Miura Peninsula' },
    { key: 'himaka', q: ['Himakajima 2011-08.JPG'], must: /^Himakajima 2011-08\.JPG/i, sources: ['wikimedia'], label: 'Octopus pots on Himakajima, Aichi' },
    { key: 'toshi', q: ['Tōshijima 01.jpg'], must: /^Tōshijima 01\.jpg/i, sources: ['wikimedia'], label: 'Tōshijima, the largest of the Toba islands' },
    { key: 'kii', q: ['Kii oshima turkey ship crash001.JPG'], must: /^Kii oshima turkey ship crash001\.JPG/i, sources: ['wikimedia'], label: 'The coast of Kii Ōshima where the Ottoman frigate Ertuğrul was wrecked in 1890' },
    { key: 'hoto', q: ['保戸島.jpg'], must: /^保戸島\.jpg/i, sources: ['wikimedia'], label: 'Hotojima, Ōita — a tuna-fishing village stacked up the hillside' },
  ],
  'manhole-cards-japan': [
    { key: 'hiroshima', q: ['Manhole hiroshima.jpg', 'Manhole hiroshima'], must: /^Manhole hiroshima\.jpg/i, sources: ['wikimedia'], label: 'Hiroshima city cover with Carp Boy' }, // hand-picked
    { key: 'kobe',    q: ['Manhole cover of Kobe, Hyogo.JPG', 'Manhole cover of Kobe, Hyogo'], must: /^Manhole cover of Kobe, Hyogo\.JPG/i, sources: ['wikimedia'], label: 'Kobe city cover' }, // hand-picked
    { key: 'toyama',  q: ['Toyama manhole cover', 'Toyama city manhole', 'Toyama manhole'], must: /toyama|富山/i, sources: ['wikimedia', 'flickr'], label: 'Toyama city cover' },
    { key: 'osaka',   q: ['Osaka Castle manhole cover.png', 'Osaka Castle manhole cover'], must: /^Osaka Castle manhole cover\.png/i, sources: ['wikimedia'], label: 'Osaka city cover, coloured version, with Osaka Castle' }, // hand-picked
    { key: 'yokote',  q: ['Manhole cover in Yokote, Akita'], must: /^Manhole cover in Yokote, Akita/i, sources: ['wikimedia'], label: 'Yokote, Akita: kamakura snow huts' }, // hand-picked
    { key: 'kumamoto', q: ['Manhole cover of Kumamoto, Kumamoto'], must: /^Manhole cover of Kumamoto, Kumamoto/i, sources: ['wikimedia'], label: 'Kumamoto city cover' }, // hand-picked
    { key: 'tokorozawa', q: ['Manhole cover Tokorozawa colored'], must: /^Manhole cover Tokorozawa colored/i, sources: ['wikimedia'], label: 'Tokorozawa, Saitama: the Anzai-Aizu biplane' }, // hand-picked
  ],
});
const PREF_OF = { tokushima: 'tokushima', 'naruto-whirlpools': 'tokushima', 'awa-odori-kaikan': 'tokushima', 'iya-kazurabashi': 'tokushima', 'ryozenji-temple': 'tokushima', 'oboke-gorge': 'tokushima', 'ishima-island': 'tokushima', 'takegashima-island': 'tokushima', 'shimadajima-island': 'tokushima' }; // slug -> FIND/47 prefecture slug (spot slugs map to their prefecture)

// FIND/47 static archive: /en/images%253Farea=<area>%26prefectures=<pref>[%26page=N].html
const F47_AREA = {
  hokkaido: 'hokkaido',
  akita: 'tohoku', aomori: 'tohoku', fukushima: 'tohoku', iwate: 'tohoku', miyagi: 'tohoku', yamagata: 'tohoku',
  chiba: 'kanto-koshinetsu', gunma: 'kanto-koshinetsu', ibaraki: 'kanto-koshinetsu', kanagawa: 'kanto-koshinetsu', nagano: 'kanto-koshinetsu', niigata: 'kanto-koshinetsu', saitama: 'kanto-koshinetsu', tochigi: 'kanto-koshinetsu', tokyo: 'kanto-koshinetsu', yamanashi: 'kanto-koshinetsu',
  aichi: 'tokai-hokuriku', fukui: 'tokai-hokuriku', gifu: 'tokai-hokuriku', ishikawa: 'tokai-hokuriku', mie: 'tokai-hokuriku', shizuoka: 'tokai-hokuriku', toyama: 'tokai-hokuriku',
  hyogo: 'kinki', kyoto: 'kinki', nara: 'kinki', osaka: 'kinki', shiga: 'kinki', wakayama: 'kinki',
  hiroshima: 'chugoku', okayama: 'chugoku', shimane: 'chugoku', tottori: 'chugoku', yamaguchi: 'chugoku',
  ehime: 'sikoku', kagawa: 'sikoku', kochi: 'sikoku', tokushima: 'sikoku',
  fukuoka: 'kyushu-okinawa', kagoshima: 'kyushu-okinawa', kumamoto: 'kyushu-okinawa', miyazaki: 'kyushu-okinawa', nagasaki: 'kyushu-okinawa', oita: 'kyushu-okinawa', okinawa: 'kyushu-okinawa', saga: 'kyushu-okinawa',
};

// ---------- auto specs for any of the 47 prefectures (when no hand-written PHOTOS entry) ----------
import vm from 'node:vm';
import { GUIDES } from '../blog/guides-data.js';
const _sb = { window: {} }; vm.runInNewContext(fs.readFileSync(path.join(HOME, '.secretary/projects/nihongohub/explore-data.js'), 'utf8'), _sb);
const NH = _sb.window.NH_EXTRA || {};
const GENERIC = new Set(['art','island','islands','garden','gardens','gorge','ropeway','sand','coin','castle','temple','shrine','museum','park','beach','valley','falls','waterfall','lake','mountain','mount','bridge','festival','market','street','village','station','tower','house','cave','onsen','spring','springs','coast','bay','river','forest','road','trail','ruins','site','district','quarter','old','great','grand','national','world','heritage','skyline','night','view','viewpoint','observatory','aquarium','zoo','ramen','sushi','curry','noodle','dumplings','crab','oyster','oysters','wagyu','pottery','ware','dyeing','indigo','silk','paper','sake','tea','fruit','peach','apple','melon','strawberry','citrus','potato']);
const STOP = new Set(['the', 'and', 'with', 'from', 'year', 'round', 'hall', 'area', 'city', 'town', 'japan', 'japanese', 'prefecture', 'famous', 'local', 'style', 'sweet', 'fresh', 'grilled', 'noodles', 'soup', 'dish', 'dishes', 'rice', 'beef', 'pork', 'chicken', 'fish', 'sea', 'sea bream']);
const clean = (n) => String(n).split(/ \(| & | \/ | and /)[0].trim();
function mustOf(name) { const all = clean(name).toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter(t => t.length > 3 && !STOP.has(t)); const proper = all.filter(t => !GENERIC.has(t)); const toks = proper.length ? proper : all; return toks.length ? new RegExp(toks.map(t => t.replace(/[-]/g, '.?')).join('|'), 'i') : null; }
function autoSpecs(slug) {
  const g = GUIDES.find(x => x.slug === slug), nh = NH[slug]; if (!g || !nh) return null;
  const cul = (nh.culture || []).map(c => c.name), food = (nh.food || []).map(f => f.name);
  const heroName = (g.see && g.see[0]) || cul[0];
  const specs = [{ key: 'hero', q: [clean(heroName), clean(cul[0] || heroName), `${clean(heroName)} ${g.romaji}`], must: mustOf(heroName), label: clean(heroName) }];
  cul.slice(0, 5).forEach((n, i) => specs.push({ key: `tile${i + 1}`, q: [clean(n), `${clean(n)} ${g.romaji}`], must: mustOf(n), label: clean(n) }));
  cul.slice(0, 3).forEach((n, i) => specs.push({ key: `see${i + 1}`, q: [clean(n), `${clean(n)} ${g.romaji}`], must: mustOf(n), label: clean(n) }));
  food.slice(0, 3).forEach((n, i) => specs.push({ key: `food${i + 1}`, q: [clean(n), `${clean(n)} ${g.romaji}`, `${clean(n)} Japan food`], must: mustOf(n), label: clean(n) }));
  return specs;
}
GUIDES.forEach(g => { PREF_OF[g.slug] = PREF_OF[g.slug] || g.slug; });

const stripHtml = (s) => String(s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const unesc = (s) => String(s || '').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const kebab = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
async function get(url, ua = UA) { const r = await fetch(url, { headers: { 'User-Agent': ua, 'Accept-Language': 'en' } }); if (!r.ok) throw new Error(`${r.status} ${url}`); return r; }

// ---------- 1. FIND/47 --------------------------------------------------------
async function find47Catalog(pref, force = false) {
  const cat = fs.existsSync(F47CAT) ? JSON.parse(fs.readFileSync(F47CAT, 'utf8')) : {};
  if (cat[pref] && !force) return cat[pref];
  const area = F47_AREA[pref]; if (!area) throw new Error('no FIND/47 area for ' + pref);
  const ids = new Set();
  for (let page = 1; page < 60; page++) {
    const u = `https://search.find47.jp/en/images%253Farea=${area}%26prefectures=${pref}${page > 1 ? `%26page=${page}` : ''}.html`;
    let html; try { html = await (await get(u, UA_BROWSER)).text(); } catch (e) { break; }
    const found = [...html.matchAll(/\/en\/i\/([A-Za-z0-9]+)/g)].map(m => m[1]);
    const before = ids.size; found.forEach(i => ids.add(i));
    if (ids.size === before) break; // no new ids -> past the last page
    await sleep(400);
  }
  const items = [];
  for (const id of ids) {
    try {
      const html = await (await get(`https://search.find47.jp/en/i/${id}`, UA_BROWSER)).text();
      const title = unesc((html.match(/<title>Learn more about &quot;(.+?)&quot;/) || [, ''])[1]).replace(/\s*\(([^)]+)\)\s*$/, '').trim();
      const num = (html.match(/NO\.(\d+)/) || [, ''])[1];
      const base = (html.match(/https:\/\/find47\.jp\/uploads\/image_file\/content\/[0-9/]+\//) || [, ''])[0];
      // photographer: text right after the view counter block; fall back to og/twitter meta if present
      const txt = stripHtml(html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, ''));
      const m = txt.match(new RegExp(`NO\\.${num}\\s+(.+?)\\s+([A-Za-z]+)\\s+\\d+\\s+\\d+\\s+(.+?)\\s+Technical Details`));
      const who = m ? m[3].trim() : 'FIND/47 contributor';
      const photographer = who === 'FIND/47 contributor' ? who : who.split(' ')[0], desc = who === 'FIND/47 contributor' ? '' : who.split(' ').slice(1).join(' ');
      if (base) items.push({ id, num, title, photographer, desc, base, page: `https://search.find47.jp/en/i/${id}` });
    } catch (e) { /* skip broken page */ }
    await sleep(300);
  }
  cat[pref] = items; fs.writeFileSync(F47CAT, JSON.stringify(cat, null, 1));
  return items;
}
async function fromFind47(spec, pref, used) {
  const items = await find47Catalog(pref);
  const queries = Array.isArray(spec.q) ? spec.q : [spec.q];
  let best = null, bestScore = -1;
  for (const it of items) {
    if (used.has('f47:' + it.id)) continue;
    const t = (it.title + ' ' + (it.desc || '')).toLowerCase();
    if (spec.must && !spec.must.test(it.title + ' ' + (it.desc || ''))) continue;
    let s = 0;
    queries.forEach((q, qi) => { const toks = q.toLowerCase().split(/\s+/).filter(x => x.length > 2); const hits = toks.filter(x => t.includes(x)).length; if (hits) s = Math.max(s, hits * 10 - qi); });
    if (s > bestScore) { bestScore = s; best = it; }
  }
  if (!best || bestScore <= 0) return null;
  const size = spec.key === 'hero' ? 'm' : 's'; // m=1920px, s=1280px
  return {
    dlUrl: best.base + size + '.jpg', usedKey: 'f47:' + best.id, rec: { source_id: 'f47:' + best.id,
      title: best.title, source_page: best.page, license: 'CC BY 4.0', license_url: 'https://creativecommons.org/licenses/by/4.0/',
      artist: best.photographer, artist_html: '', fetched_from: 'find47',
    },
  };
}

// ---------- 2. Flickr via Openverse ------------------------------------------
async function fromOpenverse(spec, used) {
  const queries = Array.isArray(spec.q) ? spec.q : [spec.q];
  for (const q of queries) {
    const u = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(q + ' Japan')}&license=by,by-sa,cc0,pdm&source=flickr&page_size=20&mature=false`;
    let d; try { d = await (await get(u)).json(); } catch (e) { if (/429/.test(e.message)) { console.log('  openverse rate-limited'); return null; } continue; }
    const cands = (d.results || []).filter(r => !used.has('ov:' + r.id) && r.width >= 900)
      .filter(r => !spec.must || spec.must.test(r.title + ' ' + (r.tags || []).map(t => t.name).join(' ')))
      .map(r => { const t = (r.title + ' ' + (r.tags || []).map(t => t.name).join(' ')).toLowerCase(); const toks = q.toLowerCase().split(/\s+/).filter(x => x.length > 2); const hits = toks.filter(x => t.includes(x)).length; return { r, s: hits * 10 + (r.width >= r.height ? 3 : 0) + Math.min(r.width, 2048) / 1024 }; })
      .filter(x => x.s >= 10).sort((a, b) => b.s - a.s);
    await sleep(3200); // anon burst limit 20/min
    if (!cands.length) continue;
    const r = cands[0].r;
    return {
      dlUrl: r.url, usedKey: 'ov:' + r.id, rec: { source_id: 'ov:' + r.id,
        title: r.title, source_page: r.foreign_landing_url, license: `CC ${r.license.toUpperCase()} ${r.license_version || ''}`.trim(),
        license_url: r.license_url || `https://creativecommons.org/licenses/${r.license}/${r.license_version || '2.0'}/`,
        artist: r.creator || 'Flickr user', artist_html: '', fetched_from: 'flickr/openverse',
      },
    };
  }
  return null;
}

// ---------- 3. Wikimedia Commons ---------------------------------------------
const FREE_OK = /(^|\b)(cc0|public domain|cc[- ]by([- ]sa)?([- ]\d(\.\d)?)?|pd|pdmark)\b/i;
const FREE_BAD = /non[- ]free|fair use|copyright|all rights reserved|by-nc|by-nd|noncommercial|no derivativ/i;
const BAD_SUBJECT = /\bchart\b|\bmap\b|diagram|engraving|woodblock|ukiyo|lithograph|\b1[5-8]\d\d\b|logo|coat of arms|\bflag\b|locator|painting|\bsiege\b|\bbattle\b|folding screen|byobu|scroll|print of|drawing|sketch|portrait|\.svg$/i;
function licenseOf(ext) {
  const short = stripHtml(ext?.LicenseShortName?.value), mach = stripHtml(ext?.License?.value), url = stripHtml(ext?.LicenseUrl?.value);
  const blob = `${short} ${mach}`;
  return { short: short || mach || 'CC', url, free: (FREE_OK.test(blob) || /pd|public/i.test(mach)) && !FREE_BAD.test(blob) };
}
async function fromWikimedia(spec, used) {
  const queries = Array.isArray(spec.q) ? spec.q : [spec.q];
  const wantLand = spec.key === 'hero' || spec.key.startsWith('tile');
  for (const q of queries) {
    const u = new URL('https://commons.wikimedia.org/w/api.php');
    u.search = new URLSearchParams({ action: 'query', format: 'json', generator: 'search', gsrsearch: q, gsrnamespace: '6', gsrlimit: '25', prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata', iiurlwidth: '1600' }).toString();
    let j; try { j = await (await get(u)).json(); } catch { continue; }
    const cands = Object.values(j?.query?.pages || {}).map(p => ({ title: p.title, info: (p.imageinfo || [])[0] })).filter(x => x.info)
      .map(c => {
        const inf = c.info, ext = inf.extmetadata || {}; const title = c.title.replace(/^File:/, '');
        if (used.has('wm:' + c.title) || !licenseOf(ext).free || !/image\/(jpeg|png|webp)/.test(inf.mime || '') || BAD_SUBJECT.test(title)) return null;
        if (spec.must && !spec.must.test(title + ' ' + stripHtml(ext?.ImageDescription?.value))) return null;
        const toks = q.toLowerCase().split(/\s+/).filter(t => t.length > 2); const hits = toks.filter(t => title.toLowerCase().includes(t)).length; if (!hits) return null;
        let s = hits * 60 + Math.min(inf.width, 4000) / 40 + (wantLand ? (inf.width >= inf.height ? 300 : -50) : 0) - (inf.width < 1000 ? 200 : 0);
        return { c, s };
      }).filter(Boolean).sort((a, b) => b.s - a.s);
    await sleep(350);
    if (!cands.length) continue;
    const best = cands[0].c, inf = best.info, ext = inf.extmetadata || {}, lic = licenseOf(ext);
    return { dlUrl: inf.thumburl || inf.url, usedKey: 'wm:' + best.title, rec: { source_id: 'wm:' + best.title, title: best.title.replace(/^File:/, ''), source_page: inf.descriptionurl, license: lic.short, license_url: lic.url, artist: stripHtml(ext?.Artist?.value) || 'Unknown', artist_html: ext?.Artist?.value || '', fetched_from: 'wikimedia' } };
  }
  return null;
}

// ---------- pipeline ------------------------------------------------------------
async function fetchOne(slug, spec, used) {
  const pref = spec.pref || PREF_OF[slug];
  const all = { find47: () => pref ? fromFind47(spec, pref, used) : null, flickr: () => fromOpenverse(spec, used), wikimedia: () => fromWikimedia(spec, used) };
  const tries = (spec.sources || ['find47', 'flickr', 'wikimedia']).map(n => [n, all[n]]);
  for (const [name, fn] of tries) {
    let hit = null; try { hit = await fn(); } catch (e) { console.log(`  ${name} error: ${e.message}`); }
    if (!hit) continue;
    fs.mkdirSync(SRCDIR, { recursive: true }); fs.mkdirSync(IMGDIR, { recursive: true });
    const src = path.join(SRCDIR, `${slug}-${spec.key}.jpg`);
    const r = await get(hit.dlUrl, hit.rec.fetched_from === 'find47' ? UA_BROWSER : UA); fs.writeFileSync(src, Buffer.from(await r.arrayBuffer()));
    const outName = `${slug}-${spec.key}-${kebab(spec.label)}.webp`;
    const meta = await sharp(src).resize({ width: spec.key === 'hero' ? 1600 : 960, withoutEnlargement: true }).webp({ quality: 80 }).toFile(path.join(IMGDIR, outName));
    used.add(hit.usedKey);
    return { ok: true, rec: { key: spec.key, label: spec.label, query: spec.q, file: `img/${outName}`, width: meta.width, height: meta.height, ...hit.rec } };
  }
  return { ok: false, reason: 'no free candidate in any source' };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--list') && args.length > 1) { const sl = args.filter(a => !a.startsWith('--'))[0]; (PHOTOS[sl] || autoSpecs(sl) || []).forEach(p => console.log(`${sl.padEnd(12)} ${p.key.padEnd(6)} ${[].concat(p.q).join(' | ')}   must=${p.must}`)); return; }
  if (args.includes('--list')) { for (const [s, l] of Object.entries(PHOTOS)) l.forEach(p => console.log(`${s.padEnd(12)} ${p.key.padEnd(6)} ${[].concat(p.q).join(' | ')}`)); return; }
  if (args.includes('--catalog')) { const pref = args[args.indexOf('--catalog') + 1]; const items = await find47Catalog(pref, true); console.log(`FIND/47 ${pref}: ${items.length} photos`); items.forEach(i => console.log(`  ${i.id} ${i.title}  [${i.photographer}]`)); return; }
  const slugs = args.filter(a => !a.startsWith('--') && !(args[args.indexOf(a) - 1] === '--keys')); const force = args.includes('--force');
  const onlyKeys = args.includes('--keys') ? args[args.indexOf('--keys') + 1].split(',') : null;
  if (!slugs.length) { console.error('give a slug, e.g. tokushima'); process.exit(1); }
  const credits = fs.existsSync(CREDITS) ? JSON.parse(fs.readFileSync(CREDITS, 'utf8')) : {};
  for (const slug of slugs) {
    const specs = PHOTOS[slug] || autoSpecs(slug); if (!specs) { console.log(`SKIP ${slug}: no PHOTOS entry and not a prefecture`); continue; }
    credits[slug] = credits[slug] || {};
    const used = new Set(Object.entries(credits[slug]).filter(([k]) => !(force && (!onlyKeys || onlyKeys.includes(k)))).map(([, r]) => r.source_id).filter(Boolean));
    for (const spec of specs) {
      if (onlyKeys && !onlyKeys.includes(spec.key)) continue;
      if (credits[slug][spec.key] && !force) { console.log(`KEEP ${slug}/${spec.key.padEnd(6)} ${credits[slug][spec.key].fetched_from}`); continue; }
      try {
        const r = await fetchOne(slug, spec, used);
        if (r.ok) { credits[slug][spec.key] = r.rec; console.log(`OK   ${slug}/${spec.key.padEnd(6)} ${r.rec.fetched_from.padEnd(16)} ${r.rec.license.padEnd(12)} ${r.rec.title.slice(0, 55)}  [${r.rec.artist.slice(0, 20)}]`); }
        else console.log(`FAIL ${slug}/${spec.key.padEnd(6)} ${r.reason}`);
      } catch (e) { console.log(`ERR  ${slug}/${spec.key.padEnd(6)} ${e.message}`); }
      fs.writeFileSync(CREDITS, JSON.stringify(credits, null, 2));
    }
  }
  console.log(`\nCredits -> ${CREDITS}`);
}
main().catch(e => { console.error(e); process.exit(1); });
