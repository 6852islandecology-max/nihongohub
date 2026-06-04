/* lib/titles.js — window.NH_TITLES_API
 * Title-word + particle combination system (Monster-Hunter guild-card style).
 *  - Title WORDS unlock by no-miss (consecutive-correct) streak: each milestone unlocks the next
 *    prefecture's 5-word set (Hokkaido first). Source of streak = nh_best_streak.
 *  - WEAPONS unlock by total-correct count (nh_correct_total): each milestone grants the next
 *    prefecture weapon (reconciled on the RPG screen, which owns NH_EQUIPMENT_API).
 *  - PARTICLES (の default, は/を/に/へ/と/より) unlock by level-test completions (nh_leveltest_completions).
 *  - A composed title = word1 [+ particle + word2], saved as nh_title_equipped.
 * Depends on data/titles-metadata.js (window.NH_TITLE_WORDS, window.NH_PARTICLES).
 */
(function () {
  var PREFS = [
    'hokkaido','aomori','iwate','miyagi','akita','yamagata','fukushima','ibaraki','tochigi','gunma',
    'saitama','chiba','tokyo','kanagawa','niigata','toyama','ishikawa','fukui','yamanashi','nagano',
    'gifu','shizuoka','aichi','mie','shiga','kyoto','osaka','hyogo','nara','wakayama',
    'tottori','shimane','okayama','hiroshima','yamaguchi','tokushima','kagawa','ehime','kochi','fukuoka',
    'saga','nagasaki','kumamoto','oita','miyazaki','kagoshima','okinawa'
  ];
  var RARITY = ['common', 'common', 'rare', 'epic', 'legendary'];

  function num(k) { try { return parseInt(localStorage.getItem(k) || '0', 10) || 0; } catch (e) { return 0; } }

  // streak threshold to unlock the i-th prefecture's word set (0-indexed): cheap early, steeper later.
  function streakThreshold(i) { return i < 8 ? 5 * (i + 1) : 40 + 12 * (i - 7); }
  // total-correct threshold to unlock the i-th weapon.
  function correctThreshold(i) { return i < 5 ? 10 * (i + 1) : 50 + 20 * (i - 4); }

  function setsUnlocked(best) {
    var c = 0;
    for (var i = 0; i < PREFS.length; i++) { if (best >= streakThreshold(i)) c++; else break; }
    return c;
  }
  function weaponsUnlocked(total) {
    var c = 0;
    for (var i = 0; i < PREFS.length; i++) { if (total >= correctThreshold(i)) c++; else break; }
    return c;
  }

  // All earned title words (flattened), based on best streak.
  function earnedWords() {
    var best = num('nh_best_streak'), sets = setsUnlocked(best), out = [];
    var WORDS = window.NH_TITLE_WORDS || {};
    for (var p = 0; p < sets; p++) {
      var slug = PREFS[p], words = WORDS[slug] || [];
      for (var i = 0; i < words.length; i++) {
        out.push({ key: slug + ':' + i, ja: words[i][0], en: words[i][1], rarity: RARITY[i] || 'common', pref: slug });
      }
    }
    return out;
  }
  function findWord(key) { var w = earnedWords(); for (var i = 0; i < w.length; i++) if (w[i].key === key) return w[i]; return null; }

  // Next-unlock progress hints (for UI "next title word at streak N").
  function nextWordAt() { var best = num('nh_best_streak'), s = setsUnlocked(best); return s < PREFS.length ? streakThreshold(s) : null; }
  function nextWeaponAt() { var t = num('nh_correct_total'), w = weaponsUnlocked(t); return w < PREFS.length ? correctThreshold(w) : null; }

  function unlockedParticles() {
    var comp = num('nh_leveltest_completions');
    return (window.NH_PARTICLES || []).filter(function (p) { return comp >= p[2]; })
      .map(function (p) { return { ja: p[0], romaji: p[1] }; });
  }

  function getComposed() { try { return JSON.parse(localStorage.getItem('nh_title_equipped') || 'null'); } catch (e) { return null; } }
  function setComposed(o) { try { localStorage.setItem('nh_title_equipped', JSON.stringify(o || null)); } catch (e) {} }

  // Render a composed title to a display string. lang: 'ja' (default) or 'en'.
  function composeDisplay(o, lang) {
    if (!o || !o.w1) return '';
    var w1 = findWord(o.w1), w2 = o.w2 ? findWord(o.w2) : null, p = o.p || 'の';
    if (!w1) return '';
    if (lang === 'en') {
      if (!w2) return w1.en;
      return p === 'の' ? (w2.en + ' of the ' + w1.en) : (w1.en + ' ' + p + ' ' + w2.en);
    }
    return w1.ja + (w2 ? (p + w2.ja) : '');
  }

  // Grant weapons earned via total-correct milestones (needs NH_EQUIPMENT_API; call on rpg.html).
  function syncWeapons() {
    if (!window.NH_EQUIPMENT_API || !window.NH_EQUIPMENT_API.claimReward) return 0;
    var n = weaponsUnlocked(num('nh_correct_total')), granted = 0;
    for (var i = 0; i < n; i++) {
      var r = window.NH_EQUIPMENT_API.claimReward(PREFS[i], 'weapon');
      if (r && r.added) granted++;
    }
    return granted;
  }

  window.NH_TITLES_API = {
    PREFS: PREFS, earnedWords: earnedWords, unlockedParticles: unlockedParticles,
    getComposed: getComposed, setComposed: setComposed, composeDisplay: composeDisplay,
    setsUnlocked: setsUnlocked, weaponsUnlocked: weaponsUnlocked, syncWeapons: syncWeapons,
    nextWordAt: nextWordAt, nextWeaponAt: nextWeaponAt
  };
})();
