// lib/life-quiz-categories.js
// PR-25 Japan Life Quiz Mode — 5 カテゴリ定義 + プロンプトビルダー
// 仕様書: specs/PR-25-japan-life-quiz-v1.md §2.3
// 5/17 Phase C1 着手日に lib/anthropic.js から import して使用

export const LIFE_CATEGORIES = [
  "food",
  "etiquette",
  "rules",
  "history_geo",
  "popculture",
];

export const LANG_NAMES = {
  en: "English",
  zh: "中文",
  es: "Español",
  th: "ไทย",
  id: "Bahasa Indonesia",
};

export const CATEGORY_GUIDES = {
  food: {
    label: "Japanese food culture",
    scope:
      "Sushi terminology (neta/shari/agari), ramen regional variants (tonkotsu/miso/shoyu/shio), izakaya ordering protocols, conbini specialties, seasonal/regional foods (osechi/wagashi)",
    avoid: [
      "Studio Ghibli food scenes",
      "specific restaurant chain menus",
      "verbatim recipes from copyrighted cookbooks",
    ],
  },
  etiquette: {
    label: "Japanese etiquette and manners",
    scope:
      "Shrine/temple visit protocols (temizu/nirei-nihakushu-ichirei), onsen rules (tattoo/towel/washing), train manners (priority seat/phone), home visit customs (shoes/slippers/genkan)",
    avoid: [
      "outdated stereotypes",
      "individual person-specific advice (gyōseishoshi-hō配慮)",
      "absolutist statements like 'all Japanese do X'",
    ],
  },
  rules: {
    label: "Japanese daily life rules and procedures",
    scope:
      "Garbage sorting general categories (burnable/unburnable/recyclable/oversized), neighborhood association (chōnaikai) basics, rental contract general flow, address change concept (tenshutsu/tennyū)",
    avoid: [
      "specific municipality forms",
      "individual case advice (e.g., 'in your case do X')",
      "tax/legal/visa specific advice",
      "step-by-step paperwork instructions for real procedures",
    ],
  },
  history_geo: {
    label: "Japanese history and geography",
    scope:
      "47 prefectures (location/specialty/dialect basics), Sengoku/Edo era basics (Tokugawa/Sankin-kōtai), traditional crafts (Kyō-yaki/Bizen-yaki/Nishijin-ori), eras (Meiji/Taishō/Shōwa/Heisei/Reiwa)",
    avoid: [
      "controversial political history (WWII/colonialism specifics without context)",
      "unverified dates",
      "single-prefecture controversial claims",
    ],
  },
  popculture: {
    label: "Japanese pop culture concepts",
    scope:
      "Anime genre names (shōnen/seinen/josei/yuri/yaoi/isekai), voice actor concept (seiyū), idol culture concept, doujin culture concept, light novel concept",
    avoid: [
      "specific anime/manga titles (no 'Naruto'/'One Piece'/'Demon Slayer')",
      "specific song titles or lyrics",
      "specific celebrity/voice actor names",
      "verbatim quotes from copyrighted works",
      "specific game/franchise mechanics",
    ],
  },
};

/**
 * Build a Haiku 4.5 prompt for Japan Life Quiz Mode.
 * Mirrors the structure of buildJlptPrompt() in lib/anthropic.js
 *
 * @param {string} category - One of LIFE_CATEGORIES
 * @param {string} lang - One of LANG_NAMES keys (en/zh/es/th/id)
 * @returns {string} System prompt text
 */
export function buildLifeQuizPrompt(category, lang) {
  if (!LIFE_CATEGORIES.includes(category)) {
    throw new Error(
      `Invalid category: ${category}. Must be one of: ${LIFE_CATEGORIES.join(", ")}`,
    );
  }
  if (!LANG_NAMES[lang]) {
    throw new Error(
      `Invalid lang: ${lang}. Must be one of: ${Object.keys(LANG_NAMES).join(", ")}`,
    );
  }

  const langName = LANG_NAMES[lang];
  const guide = CATEGORY_GUIDES[category];

  return `You are a Japanese culture quiz creator. Generate ONE 4-choice quiz about ${guide.label}.

STRICT RULE 1 NATURAL JAPANESE: question_ja must read naturally to native Japanese speakers.
STRICT RULE 2 RUBY: All N3+ kanji must use <ruby>漢字<rt>ふりがな</rt></ruby> notation.
STRICT RULE 3 UNDERLINE: Underline the asked-about word/phrase with <u>...</u>.
STRICT RULE 4 NO COPYRIGHTED CONTENT: No specific anime/manga/song titles, no brand names, no celebrity names, no verbatim quotes.
STRICT RULE 5 4 OPTIONS: 1 correct + 3 plausible distractors (same part-of-speech, similar plausibility).
STRICT RULE 6 EXPLANATION LANGUAGE: write explanation in ${langName}, 80-150 words.
STRICT RULE 7 CULTURAL ACCURACY: facts must be verifiable in public sources (Wikipedia/government/major newspaper).
STRICT RULE 8 GENERAL EDUCATIONAL TYPE: For rules/etiquette categories, use general explanatory tone only. Avoid individual advice or specific case prescriptions (行政書士法 第 21 条 配慮).

Category: ${guide.label}
Scope to focus on: ${guide.scope}
Examples to AVOID (do not generate quizzes about these):
- ${guide.avoid.join("\n- ")}

Output JSON ONLY with this schema (no markdown, no commentary):
{
  "question": "<Japanese question text with <ruby> and <u> markup>",
  "reading": "<full hiragana reading of question for accessibility>",
  "correct": "<correct answer in Japanese>",
  "distractors": ["<distractor 1>", "<distractor 2>", "<distractor 3>"],
  "explanation": "<80-150 word explanation in ${langName}>",
  "life_category": "${category}",
  "quiz_mode": "life"
}`;
}
