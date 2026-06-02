/**
 * i18n for /blog — Traditional Chinese (zh-Hant) + Indonesian (id).
 * Quality-first: UI strings + a reviewed pilot of full prefecture translations.
 * Japanese learning content (the kana/kanji phrase itself) stays Japanese;
 * only the gloss/explanation is localized.
 *
 * LANGS lists the non-English locales. T[lang] holds translated prefecture
 * content keyed by slug (the pilot set); add slugs over time. build-i18n.mjs
 * renders /blog/<lang>/<slug>.html for each, and build-guides.mjs uses
 * translatedSlugs() to emit hreflang + a language switcher on the EN pages.
 */
export const LANGS = [
  { code: "zh", htmlLang: "zh-Hant", label: "繁中" },
  { code: "id", htmlLang: "id", label: "ID" },
];

export const UI = {
  zh: {
    allGuides: "← 所有縣份指南", freeQuiz: "免費測驗", exploreMap: "🗾 探索地圖",
    whatToSee: "必看景點", whatToEat: "必吃美食", history: "歷史與背景",
    gettingWhen: "如何前往與最佳季節", gettingThere: "如何前往", bestTime: "最佳季節",
    seasons: "四季玩法", suggested: "建議行程",
    learn: "學個日語", localWord: "在地詞彙", goodToKnow: "小提醒", related: "相關指南",
    planStay: "規劃住宿", findStay: "在日本尋找住宿 →", source: "資料來源",
    disclose: "上方部分連結為聯盟行銷連結，我們可能因此獲得報酬，您不會額外付費。我們只推薦自己也會使用的服務。",
    sourceTail: "事實依官方旅遊資訊查核，觀點為我們所有。",
    openMap: (n) => `⚔️ 在探索地圖開啟${n} →`,
    h1Tail: "旅遊指南（為日語學習者撰寫）",
    indexH1: "日本，一次認識一個縣", indexLede: "為日語學習者撰寫的免費誠實旅遊指南——全 47 縣。去哪裡、吃什麼，以及旅途中真正用得上的日語。",
    indexTag: "▶ 縣份指南", seeAll: "⚔️ 在探索地圖上看看 →",
  },
  id: {
    allGuides: "← Semua panduan prefektur", freeQuiz: "KUIS GRATIS", exploreMap: "🗾 Peta Jelajah",
    whatToSee: "Yang Wajib Dilihat", whatToEat: "Yang Wajib Dicoba", history: "Sejarah & latar",
    gettingWhen: "Cara ke sana & waktu terbaik", gettingThere: "Cara ke sana", bestTime: "Waktu terbaik",
    seasons: "Musim demi musim", suggested: "Saran kunjungan",
    learn: "Belajar bahasa Jepang", localWord: "Kata lokal", goodToKnow: "Tips berguna", related: "Panduan terkait",
    planStay: "Rencanakan menginap", findStay: "Cari tempat menginap di Jepang →", source: "Sumber",
    disclose: "Beberapa tautan di atas adalah tautan afiliasi. Kami mungkin mendapat komisi tanpa biaya tambahan bagi Anda. Kami hanya mencantumkan layanan yang kami pakai sendiri.",
    sourceTail: "Fakta diperiksa terhadap informasi pariwisata resmi; opini adalah milik kami.",
    openMap: (n) => `⚔️ Buka ${n} di Peta Jelajah →`,
    h1Tail: "Panduan Wisata untuk Pelajar Bahasa Jepang",
    indexH1: "Jepang, satu prefektur setiap kali", indexLede: "Panduan wisata gratis dan jujur untuk pelajar bahasa Jepang — seluruh 47 prefektur. Ke mana, makan apa, dan bahasa Jepang yang benar-benar membantu di perjalanan.",
    indexTag: "▶ PANDUAN PREFEKTUR", seeAll: "⚔️ Lihat di Peta Jelajah →",
  },
};

// Pilot: full translated content for these slugs (extend over time).
export const T = {
  zh: {
    hiroshima: {
      lede: "感人的和平紀念園區，以及宮島海上的「漂浮」鳥居。",
      intro: "廣島將深刻的歷史與絕美的風景結合在一起。和平紀念公園紀念 1945 年的原爆，而鄰近宮島（Miyajima）的嚴島神社在漲潮時彷彿漂浮於海面。",
      history: "廣島在 1945 年 8 月 6 日的原子彈爆炸後，成為全球的和平象徵。鄰近的嚴島神社自 12 世紀便已存在，其鳥居自海中升起。",
      see: ["和平紀念公園與原爆圓頂（世界遺產）", "宮島的嚴島神社（世界遺產）", "廣島城", "縮景園"],
      eat: "廣島風御好燒（層疊式）與生蠔。",
      gettingThere: "從東京搭新幹線約 4 小時，從大阪約 1 小時 25 分。",
      bestTime: "全年皆宜；查潮汐表即可看到宮島鳥居「漂浮」的時刻。",
      seasons: "氣候溫和，全年可訪。春櫻與秋楓為宮島增色；依漲退潮可見鳥居漂浮或可步行靠近。",
      itinerary: "上午在和平紀念公園與資料館靜思，再搭渡輪前往宮島看漂浮鳥居、嚴島神社與親人的鹿群。晚餐就吃廣島燒。",
      tip: "想看漂浮鳥居請配合漲潮，想走到鳥居下則挑退潮。",
      phraseGloss: "你推薦什麼？", wordEn: "「和平」——廣島紀念園區的核心訊息",
    },
    nara: {
      lede: "日本第一個首都——大佛與自由漫步的鹿。",
      intro: "奈良在 8 世紀曾是首都，保存了日本最古老的一些寺廟。野生鹿在中央公園漫步，會為鹿仙貝向你鞠躬。",
      history: "奈良是日本第一個常設首都（710–784 年）。東大寺的大佛鑄造於 752 年，法隆寺則擁有世界上現存最古老的木造建築之一。",
      see: ["東大寺與大佛（世界遺產）", "奈良公園的鹿", "春日大社", "法隆寺——世界最古老的木造建築之一"],
      eat: "柿葉壽司與麻糬。",
      gettingThere: "從京都與大阪搭車各約 45 分鐘。",
      bestTime: "全年皆宜；是京都或大阪的輕鬆一日遊。",
      seasons: "全年舒適；春櫻與新綠適合春日，秋天為奈良公園增添紅葉。鹿群四季都在。",
      itinerary: "半天即可走訪東大寺、奈良公園鞠躬的鹿與春日大社的石燈籠。時間充裕可再加上市郊的古老法隆寺。",
      tip: "鹿仙貝在公園周邊販售；鹿會為了仙貝向你鞠躬。",
      phraseGloss: "好美啊。", wordEn: "鹿——奈良公園自由漫步的居民",
    },
  },
  id: {
    hiroshima: {
      lede: "Taman peringatan perdamaian yang menyentuh dan torii 'mengapung' di Miyajima.",
      intro: "Hiroshima memadukan sejarah mendalam dengan keindahan luar biasa. Taman Peringatan Perdamaian mengenang tahun 1945, sementara Kuil Itsukushima di Miyajima tampak mengapung saat air pasang.",
      history: "Hiroshima menjadi simbol perdamaian dunia setelah bom atom 6 Agustus 1945. Kuil Itsukushima di dekatnya berdiri sejak abad ke-12, dengan torii yang muncul dari laut.",
      see: ["Taman Peringatan Perdamaian & Kubah Bom Atom (UNESCO)", "Kuil Itsukushima di Miyajima (UNESCO)", "Kastel Hiroshima", "Taman Shukkei-en"],
      eat: "Okonomiyaki gaya Hiroshima (berlapis) dan tiram.",
      gettingThere: "Sekitar 4 jam dari Tokyo dan 1 jam 25 menit dari Osaka dengan shinkansen.",
      bestTime: "Sepanjang tahun; cek tabel pasang untuk melihat torii Miyajima 'mengapung'.",
      seasons: "Iklim sedang dan bisa dikunjungi sepanjang tahun. Bunga sakura musim semi dan daun maple musim gugur mempercantik Miyajima; tergantung pasang, torii tampak mengapung atau bisa didekati dengan jalan kaki.",
      itinerary: "Habiskan pagi yang penuh perenungan di Taman Peringatan Perdamaian, lalu naik feri ke Miyajima untuk melihat torii mengapung, Kuil Itsukushima, dan rusa yang jinak. Makan malam dengan okonomiyaki Hiroshima.",
      tip: "Untuk torii mengapung datanglah saat pasang; untuk berjalan ke bawah torii pilih saat surut.",
      phraseGloss: "Apa yang Anda rekomendasikan?", wordEn: "'perdamaian' — pesan inti peringatan Hiroshima",
    },
    nara: {
      lede: "Ibu kota pertama Jepang — Buddha raksasa dan rusa yang berkeliaran bebas.",
      intro: "Nara adalah ibu kota pada abad ke-8 dan menyimpan beberapa kuil tertua di Jepang. Rusa liar berkeliaran di taman pusatnya, membungkuk meminta kerupuk rusa.",
      history: "Nara adalah ibu kota tetap pertama Jepang (710–784). Buddha Raksasa Tōdai-ji dibuat pada tahun 752, dan Hōryū-ji memiliki sebagian bangunan kayu tertua yang masih berdiri di dunia.",
      see: ["Tōdai-ji dan Buddha Raksasa (UNESCO)", "Rusa di Taman Nara", "Kuil Kasuga Taisha", "Hōryū-ji, salah satu bangunan kayu tertua di dunia"],
      eat: "Kakinoha-zushi (sushi daun kesemek) dan mochi.",
      gettingThere: "Sekitar 45 menit dari Kyoto maupun Osaka dengan kereta.",
      bestTime: "Sepanjang tahun; perjalanan sehari yang santai dari Kyoto atau Osaka.",
      seasons: "Nyaman sepanjang tahun; sakura dan dedaunan hijau cocok untuk musim semi, dan musim gugur mewarnai Taman Nara. Rusa ada di setiap musim.",
      itinerary: "Setengah hari cukup untuk Tōdai-ji, rusa yang membungkuk di Taman Nara, dan lentera batu Kasuga Taisha. Bila ada waktu, tambahkan Hōryū-ji kuno di pinggir kota.",
      tip: "Kerupuk rusa (shika-senbei) dijual di sekitar taman; rusa akan membungkuk untuk mendapatkannya.",
      phraseGloss: "Indah sekali, ya.", wordEn: "rusa — penghuni Taman Nara yang berkeliaran bebas",
    },
  },
};

export function translatedSlugs(lang) {
  return Object.keys(T[lang] || {});
}
