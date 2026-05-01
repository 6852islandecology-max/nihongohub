// lib/anthropic.js
// Anthropic API 呼び出し共通化 — Haiku 4.5 でクイズ生成

const LANG_NAMES = {
  en: "English",
  zh: "Traditional Chinese",
  es: "Spanish",
  th: "Thai",
  id: "Indonesian",
};

export const VALID_LEVELS = ["N1", "N2", "N3", "N4", "N5"];
export const VALID_LANGS = Object.keys(LANG_NAMES);

export function buildPrompt(level, lang) {
  const langName = LANG_NAMES[lang] || "English";
  return `Generate an ORIGINAL Japanese language practice question at ${level}-equivalent difficulty.

STRICT RULES:
1. Completely ORIGINAL — do NOT reproduce any JLPT past exam, textbook, or copyrighted material.
2. No references to specific anime, manga, films, songs, brand names, or real people.
3. Common everyday Japanese appropriate for ${level} level.
4. Format: short sentence with ___ blank, OR kanji reading question, OR word-meaning question.
5. ONE correct answer and THREE plausible but wrong distractors.
6. "reading" field: instruction for the learner in ${langName}, max 8 words.
7. "explanation": 1-2 sentences in ${langName}.

Reply with ONLY this JSON object, nothing else before or after:
{"question":"<japanese>","reading":"<${langName} instruction>","correct":"<correct>","distractors":["<w1>","<w2>","<w3>"],"explanation":"<${langName} explanation>"}`;
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

function normalize(parsed) {
  if (
    !parsed ||
    !parsed.question ||
    !parsed.correct ||
    !Array.isArray(parsed.distractors) ||
    parsed.distractors.length < 3
  ) {
    return null;
  }
  return {
    question: parsed.question,
    reading: parsed.reading || "",
    correct: parsed.correct,
    distractors: parsed.distractors.slice(0, 3),
    explanation: parsed.explanation || "",
  };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function callAnthropicOnce({ level, lang, apiKey }) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [{ role: "user", content: buildPrompt(level, lang) }],
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

export async function generateQuiz({ level, lang, maxRetries = 3 }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    const err = new Error("ANTHROPIC_API_KEY is not set");
    err.code = "NO_API_KEY";
    throw err;
  }

  let lastErr = null;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await callAnthropicOnce({ level, lang, apiKey });
    } catch (err) {
      lastErr = err;
      if (!err.retriable || attempt === maxRetries - 1) {
        throw err;
      }
      const backoffMs = 500 * Math.pow(2, attempt); // 500ms, 1s, 2s
      console.warn(
        `generateQuiz attempt ${attempt + 1}/${maxRetries} failed (${err.code}), retrying in ${backoffMs}ms`,
      );
      await sleep(backoffMs);
    }
  }
  throw lastErr;
}
