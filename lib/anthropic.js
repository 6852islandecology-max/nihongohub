// [server] Vercel Serverless Functions から import される。ブラウザからは読み込まれない。
// lib/anthropic.js
// Anthropic API 呼び出し共通化 — Haiku 4.5 でクイズ生成
// JLPT 公式 5 形式 (漢字読み / 文脈規定 / 表記 / 言い換え類義 / 文法形式判断) に準拠

// 語彙の定義は lib/quiz-constants.js に移した（2026-07-24）。
// 既存の import 元を壊さないよう、ここから同じ名前で再 export し続ける。
import { LANG_NAMES, VALID_LEVELS, VALID_LANGS, VALID_TOPICS } from "./quiz-constants.js";

export { VALID_LEVELS, VALID_LANGS, VALID_TOPICS };

const TOPIC_CONTEXT = {
  any: null,
  greetings: "introductions, greetings, farewells, polite expressions, or casual social interaction",
  transport: "trains, buses, taxis, airports, stations, IC cards, platforms, or asking directions",
  food: "restaurants, cafes, ordering food, menus, ingredients, cooking, or convenience stores",
  shopping: "buying things in shops, prices, sizes, returns, department stores, or souvenirs",
  travel: "sightseeing, booking accommodation, check-in/out, tourist spots, shrines, or temples",
  nature: "seasons, weather, parks, mountains, animals, plants, or outdoor activities",
  numbers: "counting, prices, dates, times, phone numbers, measurements, or quantities",
};

const LEVEL_GUIDANCE = {
  N5: {
    vocab: "~800 most basic everyday words (numbers, days, family, basic verbs 行く/来る/食べる/飲む/見る/聞く, basic adjectives 大きい/小さい/新しい/古い/高い/安い, basic nouns 学校/家/水/お茶/本/車/電車).",
    kanji: "~100 most basic kanji only (日月火水木金土, 一-十百千万, 人男女子, 山川田, 大小, 上下中外, 入出立行来見, 学校先生, 私何時分, 円, 父母兄姉, 食飲書読言).",
    grammar: "Polite です/ます forms only, basic particles (は/が/を/に/で/へ/と/から/まで/も/の), simple い-adjectives & な-adjectives, basic verb forms (present/past/negative).",
    avoid: "NO te-form, NO conditionals, NO causative/passive, NO formal/literary forms.",
  },
  N4: {
    vocab: "~1,500 words. Adds basic abstract nouns, more verbs (借りる/返す/送る/直す), more adjectives, basic counters.",
    kanji: "~300 kanji (adds 朝昼夜, 春夏秋冬, 東西南北, 駅店, 電気, 仕事, 会社, 家族, 元気, etc.).",
    grammar: "て-form, た-form, ない-form, 〜たい, 〜ことができる, 〜たことがある, 〜ながら, 〜ても, 〜ば, basic でしょう/だろう, plain forms.",
    avoid: "NO advanced honorifics, NO complex causative-passive, NO formal/literary expressions.",
  },
  N3: {
    vocab: "~3,700 words. Daily-life intermediate vocab, basic abstract concepts, simple business terms.",
    kanji: "~650 kanji (adds 経済, 政治, 社会, 文化, 教育, 健康, 環境, 情報, 関係, 必要, 経験, 記録, etc.).",
    grammar: "〜ようになる, 〜ところ, 〜らしい, 〜そうだ (hearsay/appearance), 〜ばかり, causative させる, passive される, conditional 〜なら/〜たら/〜ば distinctions, 〜ために, 〜ように.",
    avoid: "NO N1/N2 literary forms (〜ものの, 〜ながらも, 〜ずにはいられない).",
  },
  N2: {
    vocab: "~6,000 words. Newspaper-level vocabulary, business Japanese, abstract reasoning.",
    kanji: "~1,000 kanji (adds 概念, 抽象, 検討, 提案, 解決, 制度, 現象, 傾向, 範囲, etc.).",
    grammar: "〜について/〜に対して/〜に関して/〜に基づいて, 〜わけだ/〜わけではない, 〜限り, 〜うえで, 〜次第, 〜にもかかわらず, 〜どころか, 〜ばかりか, formal honorifics.",
    avoid: "NO super-rare N1 expressions (〜ようでは, 〜にひきかえ, 〜ともなると).",
  },
  N1: {
    vocab: "~10,000 words. Literary, academic, journalistic vocabulary; nuanced synonyms.",
    kanji: "~2,000 kanji (jōyō kanji full set including 概, 顧, 緻, 弊, 凡, 漠, etc.).",
    grammar: "〜ものの, 〜ながらも, 〜ずにはいられない, 〜を余儀なくされる, 〜にひきかえ, 〜ともなると, 〜ようでは, 〜まじき, 〜なくして, formal/literary register.",
    avoid: "Nothing is off-limits ABOVE — but do NOT drop below N1. The item must hinge on genuinely N1-only material: a rare/literary grammar form, a low-frequency kanji compound or on-yomi, or a fine distinction between near-synonyms. An item a solid N2 learner could answer at a glance is a CALIBRATION FAILURE here, even if every word used is correct Japanese.",
  },
};

const QUESTION_TYPES_BY_LEVEL = {
  N5: ["kanji_reading", "vocab_context"],
  N4: ["kanji_reading", "vocab_context", "grammar_form"],
  N3: ["kanji_reading", "orthography", "vocab_context", "synonym", "grammar_form", "culture_jlpt"],
  // NOTE: "usage" (用法) intentionally removed from N1/N2 (2026-06-09). It is the only type whose
  // answer is a positional number (correct "1", distractors ["2","3","4"]) with four example
  // sentences crammed into the question — it renders as numbered-sentence soup + bare-number
  // buttons (inconsistent with every other type) and is error-prone for the LLM to author.
  // Re-introduce only with a sentence-option format (buttons show the candidate sentences).
  N2: ["vocab_context", "synonym", "grammar_form", "culture_jlpt"],
  N1: ["synonym", "grammar_form", "culture_jlpt"],
};

const TYPE_INSTRUCTIONS = {
  kanji_reading: {
    name: "漢字読み (Kanji Reading)",
    desc: "Show a Japanese sentence with one underlined kanji compound. The 'question' field contains the sentence with the target word wrapped in <u>...</u> HTML tags (e.g., 「明日は<u>大切</u>な日です。」). The 'correct' answer is the hiragana reading of the marked kanji. Distractors are 3 plausible WRONG hiragana readings (similar sound, common confusion). IMPORTANT: do NOT add furigana ruby to the underlined target word (it would reveal the answer); other kanji in the sentence MAY have ruby per LEVEL ruby rule.",
    example: '{"question":"明日は<u>大切</u>な日です。","correct":"たいせつ","distractors":["だいせつ","おおきり","たいき"]}',
  },
  vocab_context: {
    name: "文脈規定 (Context-based Vocabulary)",
    desc: "Show a Japanese sentence with one blank marked as （　）. The 'correct' is the vocabulary word that fits the context. Distractors are 3 wrong words of the same part of speech (e.g., all nouns, or all verbs).",
    example: '{"question":"昨日 友だちと えいがを（　）。","correct":"見ました","distractors":["読みました","聞きました","食べました"]}',
  },
  orthography: {
    name: "表記 (Orthography)",
    desc: "Show a Japanese sentence where one word is written in hiragana, wrapped in <u>...</u> HTML tags. The 'correct' is the proper kanji form. Distractors are 3 plausible WRONG kanji (similar shape or sound).",
    example: '{"question":"<u>けいけん</u>が大切です。","correct":"経験","distractors":["経検","軽験","景験"]}',
  },
  synonym: {
    name: "言い換え類義 (Synonym Replacement)",
    desc: "Show a Japanese sentence with one word/phrase wrapped in <u>...</u> HTML tags. The 'correct' is a synonym/paraphrase that preserves meaning. Distractors are 3 words that change the meaning subtly.",
    example: '{"question":"会議は<u>延期</u>になった。","correct":"後ろにずらすこと","distractors":["中止すること","早めること","継続すること"]}',
  },
  usage: {
    name: "用法 (Word Usage)",
    desc: "The 'question' field contains a target word followed by 4 short example sentences labeled 1-4 (e.g., '改善: 1) 〜。 2) 〜。 3) 〜。 4) 〜。'). The 'correct' is the number (1/2/3/4) of the sentence with CORRECT usage. Distractors are the other 3 numbers as strings.",
    example: '{"question":"改善: 1)病気を改善する 2)料理を改善する 3)料理が改善する 4)雨が改善する","correct":"1","distractors":["2","3","4"]}',
  },
  grammar_form: {
    name: "文法形式判断 (Grammar Form)",
    desc: "Show a Japanese sentence with a grammar-pattern blank marked as （　）. The 'correct' is the grammar form that fits. Distractors are 3 wrong grammar forms with similar shape.",
    example: '{"question":"雨が降った（　）、試合は中止になった。","correct":"ために","distractors":["ように","ばかりに","ところに"]}',
  },
  culture_jlpt: {
    name: "文化文脈問題 (Culture-context Vocabulary)",
    desc: "Like vocab_context, but the sentence revolves around AUTHENTIC Japanese cultural topics (food/cuisine, festivals, etiquette, geography, daily-life rules, history, traditional crafts, work culture). The blank （　） is still a level-appropriate vocabulary word; the cultural angle is in the sentence content, not in the answer choices. The learner should plausibly encounter the cultural concept while living in or visiting Japan. Avoid stereotypes; prefer concrete everyday situations.",
    example: '{"question":"お正月には、家族みんなでおせちを（　）。","correct":"食べます","distractors":["読みます","聞きます","書きます"]}',
  },
};

const RUBY_POLICY = {
  N5: "REQUIRED — wrap EVERY kanji in the question stem with <ruby>kanji<rt>furigana</rt></ruby>. Example: <ruby>学校<rt>がっこう</rt></ruby>. Exception: do NOT add ruby to a word wrapped in <u>...</u> (it would reveal the answer for kanji_reading questions).",
  N4: "REQUIRED — wrap EVERY kanji in the question stem with <ruby>kanji<rt>furigana</rt></ruby>. Same exception as N5.",
  N3: "OPTIONAL — add ruby only to less-common kanji (above N4 level). Do NOT add ruby to a word wrapped in <u>...</u>.",
  N2: "DISCOURAGED — only add ruby to rare/specialized kanji.",
  N1: "NONE — never add ruby tags.",
};

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function buildPrompt(level, lang, topic = "any") {
  const langName = LANG_NAMES[lang] || "English";
  const guidance = LEVEL_GUIDANCE[level];
  const allowedTypes = QUESTION_TYPES_BY_LEVEL[level];
  const chosenType = pickRandom(allowedTypes);
  const typeInfo = TYPE_INSTRUCTIONS[chosenType];
  const topicLine = topic && topic !== "any" && TOPIC_CONTEXT[topic]
    ? `\nTOPIC FOCUS: The sentence in your question should naturally involve ${TOPIC_CONTEXT[topic]}. Keep all JLPT question mechanics standard — only the situational content reflects this topic.`
    : "";

  return `You are a JLPT (Japanese Language Proficiency Test) question writer creating an ORIGINAL ${level} level question.

QUESTION TYPE: ${typeInfo.name}
TYPE INSTRUCTION: ${typeInfo.desc}
TYPE EXAMPLE (format only, do NOT reuse content): ${typeInfo.example}

LEVEL ${level} CONSTRAINTS:
- Vocabulary: ${guidance.vocab}
- Kanji: ${guidance.kanji}
- Grammar: ${guidance.grammar}
- Avoid: ${guidance.avoid}

LEVEL ${level} RUBY (FURIGANA) POLICY:
${RUBY_POLICY[level]}

STRICT RULES:
1. Completely ORIGINAL content — do NOT copy JLPT past exams, textbooks, or copyrighted material.
2. NO references to anime, manga, films, songs, brand names, or real people.
3. Question stem and answer choices MUST stay within ${level} vocabulary/kanji/grammar — do not exceed level.
4. ONE clearly correct answer and THREE distractors.
5. Distractors must be the SAME part of speech / grammatical category as the correct answer (no nouns mixed with verbs).
6. Distractors must be plausible enough that an unprepared learner could be tempted, but clearly WRONG to a prepared one.
7. NATURAL JAPANESE: question stems MUST sound like natural everyday Japanese a native speaker would actually use. Reject contrived, robotic, or unnatural phrasing. Re-generate internally if the sentence sounds awkward.
8. UNDERLINE FORMAT: when a target word should be visually marked, wrap it in <u>...</u> HTML tags. Do NOT use ＿ (full-width underscore) or other ASCII/Unicode punctuation as a substitute.
9. RUBY (FURIGANA) FORMAT: when adding ruby per LEVEL ruby policy above, use exactly <ruby>漢字<rt>かんじ</rt></ruby>. The reading inside <rt>...</rt> must be hiragana (or katakana for foreign-origin words).
10. "reading" field: short instruction in ${langName} explaining what the learner should do (max 12 words). Example for English: "Choose the correct reading of the underlined kanji." MUST be in ${langName} — NEVER in Japanese unless ${langName} is "Japanese".
11. "explanation" field in ${langName} (NEVER Japanese unless ${langName} is "Japanese"). This explanation is the CORE VALUE of the paid product — make it precise, instructive, and easy to follow. REQUIRED STRUCTURE:
   (a) First sentence: why the CORRECT answer fits — name the SPECIFIC point at work (the exact grammar pattern, the vocabulary nuance, the reading rule, or the collocation), not just "it is correct".
   (b) Then ONE short clause per distractor, EACH containing TWO things: its reading-in-hiragana and/or short meaning in parentheses when it is kanji or non-obvious, AND the precise reason it is wrong HERE (wrong conjugation / different meaning / wrong collocation / register mismatch / look-alike kanji / real word but wrong context). Address every distractor individually — NEVER lump them together ("the others don't fit", "the rest are unrelated").
   (c) A learner who reads it should come away able to tell all four apart next time. Keep it concrete and jargon-light; 4-6 sentences total.
12. OKURIGANA / CONJUGATION CONSISTENCY: the blank （　） must accept exactly ONE conjugation slot, and EVERY option must produce a grammatical sentence when dropped in. Critical patterns to handle:
   (a) Suffix-bound blanks: if the stem has 「（　）ます」「（　）ました」「（　）ない」「（　）た」「（　）て」, options must be the stem/i-form ONLY (e.g. 「食べ」「飲み」). Options like 「食べます」「飲みました」are FORBIDDEN (would produce 「食べますます」 etc.).
   (b) Compound-conjugation blanks: if the stem has 「（　）なければならない」「（　）なければいけない」「（　）ながら」「（　）ば」「（　）れば」「（　）たら」「（　）ても」「（　）たり」「（　）よう」, the blank requires a SPECIFIC conjugation (ren'yōkei/i-form for 「なければ…」「ながら」, kateikei/conditional for 「ば/れば」, ta-form for 「たら/たり/ても」, etc.). ALL FOUR options must be in that exact conjugation. Mixing dictionary, te-, ta-, and -te iru forms together (e.g. options 「準備する／準備した／準備している／準備できる」 for 「（　）なければならない」) is FORBIDDEN — none of them attach cleanly to 「なければならない」 and the item has no real correct answer.
   (c) Free blanks: if the blank stands alone with punctuation after it (「（　）。」), options must be fully conjugated (e.g. 「食べました」). Pick ONE convention per item and apply it consistently to ALL 4 options.
13. LEVEL CALIBRATION — the difficulty must genuinely match the ${level} label, not merely the vocabulary used. The biggest defect to avoid: an item LABELLED N3+ that any learner one full level below could answer at a glance.
   - For N3/N2/N1: the distractors must be GENUINELY tempting at this level — near-synonyms, words sharing a kanji, or subtle collocation/nuance/register traps. Do NOT use a set of basic words whose meanings differ obviously (e.g., はやく/おそく/ゆっくり/しずかに for an N3 item is TOO EASY — those differ at a glance). If a prepared learner one level below would pick the answer instantly, REDESIGN with tighter distractors.
   - Also at N3+: the correct answer OR at least one distractor must use a kanji compound or grammar form at or above ${level}; never let an N3+ item reduce to choosing among basic hiragana adverbs.
   - N1 FLOOR (only when ${level} is N1): the item must require N1-specific knowledge — a literary/rare grammar form, a low-frequency kanji reading or compound, or a subtle near-synonym/register/nuance distinction. The distractors must each be a real, tempting N1-register option. If the whole item could be solved with N2 vocabulary and grammar alone, it is MIS-LABELLED — redesign it so the decisive point genuinely lives at N1.
   - For N5/N4: keep it simple and unambiguous; do NOT smuggle in above-level traps. Easy is correct here.
14. SELF-CHECK BEFORE OUTPUT (do this silently, then output only the JSON): verify (i) EXACTLY one option is correct and the other three are each unambiguously wrong in THIS exact sentence; (ii) the difficulty truly matches ${level} per rule 13; (iii) the explanation distinguishes all four options per rule 11. If any check fails, revise the item before answering.
15. FLAVOR (optional, applies only when the topic is naturally social — greetings, shopping, transport, food, etiquette, travel): you MAY frame the stem as one short line of dialogue spoken by a local character — e.g. a Kyoto shopkeeper, an Akita station master, a Naha taxi driver — and design the 4 options as possible learner replies where only ONE perfectly suits the cultural register / politeness level / setting. This is decoration only — rules 1-14 still bind: difficulty must still match ${level}, distractors must still be unambiguously wrong, and the explanation must still distinguish all four options.

Reply with ONLY this JSON object, nothing else before or after, no markdown fences:
{"question":"<japanese sentence with <u>...</u> and/or <ruby>...</ruby> as described>","reading":"<${langName} instruction>","correct":"<correct answer>","distractors":["<wrong1>","<wrong2>","<wrong3>"],"explanation":"<${langName} explanation, NEVER Japanese unless target lang is Japanese>","type":"${chosenType}"}${topicLine}`;
}

function extractJSON(text) {
  if (!text) return null;
  const s = String(text).replace(/```json\s*|```/g, "").trim();
  try { return JSON.parse(s); } catch {}
  const f = s.indexOf("{"), l = s.lastIndexOf("}");
  if (f !== -1 && l > f) {
    try { return JSON.parse(s.slice(f, l + 1)); } catch {}
  }
  return null;
}

export function normalize(parsed) {
  if (
    !parsed ||
    !parsed.question ||
    !parsed.correct ||
    !Array.isArray(parsed.distractors) ||
    parsed.distractors.length < 3
  ) {
    return null;
  }
  // Integrity gates (reject -> retry). Prevents three defect classes:
  const correct = String(parsed.correct);
  const ds = parsed.distractors.slice(0, 3).map((d) => String(d));
  // 1) the correct answer must NOT appear in the question stem (give-away / answer-in-stem).
  //    Strip furigana <rt> readings and HTML tags first so kanji_reading items are unaffected.
  const stem = String(parsed.question).replace(/<rt>.*?<\/rt>/g, "").replace(/<[^>]+>/g, "");
  if (correct.length >= 2 && stem.includes(correct)) return null;
  // 2) no distractor may equal the correct answer (would render two identical buttons).
  if (ds.includes(correct)) return null;
  // 3) distractors must be distinct from each other.
  if (new Set(ds).size !== ds.length) return null;
  // 3b) reject bare numeric placeholder answers (e.g. correct "1", distractors ["2","3","4"]).
  //     No active question type uses a positional number as the answer text, so this is a
  //     degenerate "usage"-style output — reject so the caller retries with a real item.
  if (/^\d+$/.test(correct.trim()) || ds.every((d) => /^\d+$/.test(d.trim()))) return null;
  // 4) okurigana / conjugation consistency around a blank (（　）).
  //    Reject items where (a) the stem supplies a suffix that any option duplicates
  //    (e.g. stem 「（　）ます」 + option 「食べます」 → 「食べますます」), or
  //    (b) the stem requires ONE specific conjugation (e.g. 「（　）なければならない」 needs i-form
  //    for all options) but the options mix dictionary / te / ta / -te iru / potential forms
  //    so no option attaches cleanly.
  const stemForConj = String(parsed.question).replace(/<rt>.*?<\/rt>/g, "").replace(/<[^>]+>/g, "");
  const blankMatch = stemForConj.match(/（[　\s　]*）([ぁ-んァ-ヶー一-鿿。、！？!?…\s]{0,16})/);
  if (blankMatch) {
    const tail = blankMatch[1] || "";
    const tailSuffixes = ["ました", "ません", "ます", "ない", "なかった", "ています", "ている", "たい", "て", "た"];
    const stemBoundSuffix = tailSuffixes.find((s) => tail.startsWith(s));
    if (stemBoundSuffix) {
      // (a) stem is "stem-form + suffix"; options must NOT end with any tailSuffix
      const offends = [correct, ...ds].some((opt) =>
        tailSuffixes.some((s) => opt.endsWith(s) && opt.length > s.length),
      );
      if (offends) return null;
    } else {
      // (b) compound-conjugation that requires the renʼyōkei (i-form) right before it:
      //     「（　）なければならない / なければいけない」「（　）ながら」.
      //     The renʼyōkei is hard to *positively* verify by regex (ichidan 食べ=べ, causative
      //     させ=せ, etc.), so instead we REJECT high-confidence WRONG forms: if any option
      //     ends in a dictionary (〜る), past (〜た/だ), te (〜て/で) or 〜ている form it cannot
      //     attach to なければ…/ながら, which is exactly the broken case the LLM produced
      //     (準備する / 準備した / 準備している / 準備できる before 「なければならない」).
      //     Subtler ambiguity (multiple grammatical answers) is left to the LLM validator.
      const needsIForm = /^(なければ(ならない|いけない|ダメ|だめ)|ながら)/.test(tail);
      if (needsIForm) {
        const cannotAttach = (o) => /(る|た|だ|て|で|ている|てる|ない|ます|ました|です)$/.test(o);
        if ([correct, ...ds].some(cannotAttach)) return null;
      }
    }
  }
  return {
    question: parsed.question,
    reading: parsed.reading || "",
    correct: parsed.correct,
    distractors: ds,
    explanation: parsed.explanation || "",
    type: parsed.type || "vocab_context",
  };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function callAnthropicOnce({ level, lang, topic = "any", apiKey }) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: buildPrompt(level, lang, topic) }],
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    const err = new Error(`Anthropic API ${response.status}`);
    err.code = "ANTHROPIC_ERROR";
    err.status = response.status;
    err.body = body.slice(0, 500);
    err.retriable = response.status >= 500 || response.status === 429;
    throw err;
  }

  const data = await response.json();
  const text = (data.content || [])
    .map((b) => (b.type === "text" ? b.text : ""))
    .filter(Boolean)
    .join("\n");

  const parsed = extractJSON(text);
  const normalized = normalize(parsed);
  if (!normalized) {
    const err = new Error("Malformed AI response");
    err.code = "MALFORMED_RESPONSE";
    err.preview = text.slice(0, 300);
    err.retriable = true;
    throw err;
  }
  return normalized;
}

// LLM single-answer validator. Catches the defect class that regex can't:
// items where more than one option is grammatical AND natural (no unique answer),
// or the marked answer isn't actually the single best one. A short, cheap Haiku
// judgement. Fail-OPEN on API/parse errors (never drop a good item over a transient
// fault); only an explicit {valid:false} verdict rejects.
function buildValidatorPrompt(quiz) {
  const stem = String(quiz.question || "").replace(/<rt>.*?<\/rt>/g, "").replace(/<[^>]+>/g, "");
  const ds = (quiz.distractors || []).slice(0, 3);
  return [
    "You are a strict JLPT item checker. A fill-in-the-blank Japanese sentence has four answer",
    "options; one is marked CORRECT. Decide if the item is well-formed.",
    "",
    "Sentence: " + stem,
    "Options:",
    "  A (marked CORRECT): " + quiz.correct,
    "  B: " + (ds[0] || ""),
    "  C: " + (ds[1] || ""),
    "  D: " + (ds[2] || ""),
    "",
    "Set valid=false if ANY of these holds:",
    "1. Two or more options make the sentence grammatical AND natural — a native speaker would",
    "   accept more than one (e.g. 「毎朝（　）起きます」 with はやく/おそく/ゆっくり: several fit). The answer must be UNIQUE.",
    "2. The option marked CORRECT is not actually correct, or is not the single best answer.",
    "3. No option makes a correct, natural sentence.",
    "4. The options mix conjugation forms so they cannot all slot into the blank.",
    "Otherwise valid=true.",
    "",
    'Reply with ONLY JSON, no prose: {"valid": true, "reason": "<=12 words"}',
  ].join("\n");
}

export async function validateSingleAnswer(quiz, { apiKey } = {}) {
  apiKey = apiKey || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { valid: true, skipped: true };
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 120,
        messages: [{ role: "user", content: buildValidatorPrompt(quiz) }],
      }),
    });
    if (!response.ok) return { valid: true, skipped: true }; // fail-open
    const data = await response.json();
    const text = (data.content || []).map((b) => (b.type === "text" ? b.text : "")).join("\n");
    const parsed = extractJSON(text);
    if (!parsed || typeof parsed.valid !== "boolean") return { valid: true, skipped: true };
    return { valid: parsed.valid, reason: String(parsed.reason || "").slice(0, 120) };
  } catch (e) {
    return { valid: true, skipped: true }; // fail-open
  }
}

export async function generateQuiz({ level, lang, topic = "any", maxRetries = 3, validate = false }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    const err = new Error("ANTHROPIC_API_KEY is not set");
    err.code = "NO_API_KEY";
    throw err;
  }

  let lastErr = null;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const quiz = await callAnthropicOnce({ level, lang, topic, apiKey });
      if (validate) {
        const verdict = await validateSingleAnswer(quiz, { apiKey });
        if (!verdict.valid) {
          const err = new Error("Ambiguous / no-single-answer item rejected by validator");
          err.code = "AMBIGUOUS_ITEM";
          err.reason = verdict.reason;
          err.retriable = true;
          throw err;
        }
      }
      return quiz;
    } catch (err) {
      lastErr = err;
      if (!err.retriable || attempt === maxRetries - 1) {
        throw err;
      }
      const backoffMs = 500 * Math.pow(2, attempt); // 500ms, 1s, 2s
      console.warn(
        `generateQuiz attempt ${attempt + 1}/${maxRetries} failed (${err.code}${err.reason ? ": " + err.reason : ""}), retrying in ${backoffMs}ms`,
      );
      await sleep(backoffMs);
    }
  }
  throw lastErr;
}
