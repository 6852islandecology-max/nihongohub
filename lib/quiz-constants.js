// [server] クイズの語彙（レベル / 言語 / トピック）。
//
// 2026-07-24 新設。もともと lib/anthropic.js（398 行）に置かれていたが、
// 定数だけが欲しい api/rank-submit.js のような呼び出し元まで
// プロンプト生成・品質ゲート・リトライ一式を読み込むことになるので切り出した。
//
// lib/anthropic.js は互換のため同じ名前で再 export し続けるので、
// 既存の import 元（api/generate.js, api/generate-batch.js）は変更不要。
//
// LANG_NAMES は Anthropic に渡す言語名。ここが唯一の定義。
// 以前は lib/anthropic.js と api/daily-coach.js に別々の写しがあり、
// lib/life-quiz-categories.js には値の違う 3 つ目（"中文" 等）まであった。

export const LANG_NAMES = {
  en: "English",
  zh: "Traditional Chinese",
  es: "Spanish",
  th: "Thai",
  id: "Indonesian",
};

export const VALID_LEVELS = ["N1", "N2", "N3", "N4", "N5"];
export const VALID_LANGS = Object.keys(LANG_NAMES);
export const VALID_TOPICS = [
  "any", "greetings", "transport", "food", "shopping", "travel", "nature", "numbers",
];
