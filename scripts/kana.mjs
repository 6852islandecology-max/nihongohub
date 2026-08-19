// Minimal Hepburn romanisation for the hiragana readings in the island data.
// Long vowels are written with a macron (ō/ū) the way the English Wikipedia titles do it.
const BASE = {
  あ: 'a', い: 'i', う: 'u', え: 'e', お: 'o',
  か: 'ka', き: 'ki', く: 'ku', け: 'ke', こ: 'ko', が: 'ga', ぎ: 'gi', ぐ: 'gu', げ: 'ge', ご: 'go',
  さ: 'sa', し: 'shi', す: 'su', せ: 'se', そ: 'so', ざ: 'za', じ: 'ji', ず: 'zu', ぜ: 'ze', ぞ: 'zo',
  た: 'ta', ち: 'chi', つ: 'tsu', て: 'te', と: 'to', だ: 'da', ぢ: 'ji', づ: 'zu', で: 'de', ど: 'do',
  な: 'na', に: 'ni', ぬ: 'nu', ね: 'ne', の: 'no',
  は: 'ha', ひ: 'hi', ふ: 'fu', へ: 'he', ほ: 'ho', ば: 'ba', び: 'bi', ぶ: 'bu', べ: 'be', ぼ: 'bo',
  ぱ: 'pa', ぴ: 'pi', ぷ: 'pu', ぺ: 'pe', ぽ: 'po',
  ま: 'ma', み: 'mi', む: 'mu', め: 'me', も: 'mo',
  や: 'ya', ゆ: 'yu', よ: 'yo', ら: 'ra', り: 'ri', る: 'ru', れ: 're', ろ: 'ro',
  わ: 'wa', ゐ: 'i', ゑ: 'e', を: 'o', ん: 'n', ー: '-',
};
const YOON = {
  きゃ: 'kya', きゅ: 'kyu', きょ: 'kyo', ぎゃ: 'gya', ぎゅ: 'gyu', ぎょ: 'gyo',
  しゃ: 'sha', しゅ: 'shu', しょ: 'sho', じゃ: 'ja', じゅ: 'ju', じょ: 'jo',
  ちゃ: 'cha', ちゅ: 'chu', ちょ: 'cho', にゃ: 'nya', にゅ: 'nyu', にょ: 'nyo',
  ひゃ: 'hya', ひゅ: 'hyu', ひょ: 'hyo', びゃ: 'bya', びゅ: 'byu', びょ: 'byo',
  ぴゃ: 'pya', ぴゅ: 'pyu', ぴょ: 'pyo', みゃ: 'mya', みゅ: 'myu', みょ: 'myo',
  りゃ: 'rya', りゅ: 'ryu', りょ: 'ryo',
};
const MACRON = { o: 'ō', u: 'ū', a: 'ā', e: 'ē', i: 'ī' };
export function hepburn(kana) {
  const s = String(kana || '').replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60)); // katakana -> hiragana
  if (!s || !/^[ぁ-んー]+$/.test(s)) return '';
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const two = s.slice(i, i + 2);
    if (YOON[two]) { out += YOON[two]; i++; continue; }
    const c = s[i];
    if (c === 'っ') { const nx = s[i + 1]; const r = YOON[s.slice(i + 1, i + 3)] || BASE[nx] || ''; if (r) out += r[0] === 'c' ? 't' : r[0]; continue; }
    if (c === 'ー') { const last = out.slice(-1); out = out.slice(0, -1) + (MACRON[last] || last); continue; }
    const r = BASE[c]; if (!r) return '';
    out += r;
  }
  // ou / oo -> ō, uu -> ū (Hepburn long vowels), and n before b/m/p -> m
  out = out.replace(/ou|oo/g, 'ō').replace(/uu/g, 'ū').replace(/n(?=[bmp])/g, 'm');
  return out.charAt(0).toUpperCase() + out.slice(1);
}
