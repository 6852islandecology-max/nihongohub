// [browser] HTML から <script src> で読み込まれる IIFE。api/ からは import されない。
/* lib/level-sharecard.js — window.NH_LEVEL_SHARECARD
 * Renders a level-diagnostic result card (level badge + accuracy bars + tagline)
 * to a canvas, then offers Web Share with image + entertaining default caption.
 * Default tags target studygram culture (Instagram #studygram + X).
 */
(function () {
  var W = 1080, H = 1080;

  var DEFAULTS = {
    en: { brand: 'NIHONGOHUB · LEVEL DIAGNOSTIC', headline: 'MY JAPANESE LEVEL', sub: 'Five-minute JLPT check',
          caption: function (lv, pct) { return 'My real Japanese level is ' + lv + ' ⚔️ Scored ' + pct + '% across JLPT N5–N1.\nThink you can beat me? Try the 5-minute diagnostic 👇'; },
          tags: '#NihongoHub #LearnJapanese #JLPT #studygram #日本語' },
    ja: { brand: 'NIHONGOHUB · レベル診断', headline: '私の日本語レベル', sub: '5分のJLPT診断',
          caption: function (lv, pct) { return '本気の診断で出た私の日本語レベル: ' + lv + ' ⚔️ N5〜N1 総合正答率 ' + pct + '%\n君のレベルは何だと思う？ 5分でチェック👇'; },
          tags: '#NihongoHub #日本語 #JLPT #studygram' },
    zh: { brand: 'NIHONGOHUB · 等級診斷', headline: '我的日語等級', sub: '5 分鐘 JLPT 測驗',
          caption: function (lv, pct) { return '我真實的日語等級是 ' + lv + ' ⚔️ JLPT N5–N1 總正確率 ' + pct + '%\n你猜你的等級？ 5 分鐘測一下 👇'; },
          tags: '#NihongoHub #學日文 #JLPT #studygram' },
    es: { brand: 'NIHONGOHUB · DIAGNÓSTICO', headline: 'MI NIVEL DE JAPONÉS', sub: 'Diagnóstico JLPT de 5 minutos',
          caption: function (lv, pct) { return 'Mi nivel real de japonés es ' + lv + ' ⚔️ Acerté ' + pct + '% en JLPT N5–N1.\n¿Te animas a superarme? 5 minutos 👇'; },
          tags: '#NihongoHub #AprenderJaponés #JLPT #studygram' },
    th: { brand: 'NIHONGOHUB · ทดสอบระดับ', headline: 'ระดับภาษาญี่ปุ่นของฉัน', sub: 'ทดสอบ JLPT 5 นาที',
          caption: function (lv, pct) { return 'ระดับภาษาญี่ปุ่นของฉันคือ ' + lv + ' ⚔️ ตอบถูก ' + pct + '% ใน JLPT N5–N1\nกล้าลองไหม? 5 นาที 👇'; },
          tags: '#NihongoHub #เรียนภาษาญี่ปุ่น #JLPT #studygram' },
    id: { brand: 'NIHONGOHUB · DIAGNOSIS LEVEL', headline: 'LEVEL BAHASA JEPANGKU', sub: 'Tes JLPT 5 menit',
          caption: function (lv, pct) { return 'Level bahasa Jepangku sebenarnya: ' + lv + ' ⚔️ Skor ' + pct + '% di JLPT N5–N1.\nBerani coba? 5 menit aja 👇'; },
          tags: '#NihongoHub #BelajarJepang #JLPT #studygram' }
  };

  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  async function draw(canvas, opts) {
    var ctx = canvas.getContext('2d');
    canvas.width = W; canvas.height = H;
    try { if (document.fonts && document.fonts.ready) await document.fonts.ready; } catch (e) {}

    var lang = opts.lang || 'en';
    var T = DEFAULTS[lang] || DEFAULTS.en;
    var level = opts.level || 'N5';
    var pct = (opts.pct != null) ? Math.round(opts.pct) : 0;
    var acc = opts.acc || {}; // { N5: 0.x, N4: 0.x, ... }

    // background gradient
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#241a0e'); g.addColorStop(1, '#160f08');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // gold frame
    ctx.strokeStyle = '#e8a020'; ctx.lineWidth = 10; rr(ctx, 22, 22, W - 44, H - 44, 28); ctx.stroke();
    ctx.strokeStyle = 'rgba(232,160,32,.25)'; ctx.lineWidth = 2; rr(ctx, 42, 42, W - 84, H - 84, 18); ctx.stroke();

    // brand strip
    ctx.fillStyle = '#e8a020'; ctx.textAlign = 'center';
    ctx.font = '700 30px "DM Sans", sans-serif';
    ctx.fillText('⛩  ' + T.brand, W / 2, 88);

    // headline
    ctx.fillStyle = '#fdf6e3'; ctx.font = '700 56px "Noto Sans JP", sans-serif';
    ctx.fillText(T.headline, W / 2, 170);

    // big level badge
    var bx = W / 2 - 220, by = 220, bw = 440, bh = 280;
    var levelColor = ({ N1: '#bf3325', N2: '#c8911f', N3: '#e0a634', N4: '#2a7a4b', N5: '#4e8fc8', PRE: '#8b7355' })[level] || '#e8a020';
    ctx.fillStyle = 'rgba(0,0,0,.35)'; rr(ctx, bx, by, bw, bh, 22); ctx.fill();
    ctx.strokeStyle = levelColor; ctx.lineWidth = 6; rr(ctx, bx, by, bw, bh, 22); ctx.stroke();
    ctx.fillStyle = levelColor; ctx.font = '900 200px "DM Sans", sans-serif';
    ctx.fillText(level, W / 2, by + 210);

    // accuracy bars per JLPT level
    var LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'];
    var rowY = by + bh + 70;
    var barW = 600, barH = 28, barX = W / 2 - barW / 2;
    ctx.textAlign = 'left';
    for (var i = 0; i < LEVELS.length; i++) {
      var L = LEVELS[i];
      var p = Math.max(0, Math.min(1, acc[L] || 0));
      var y = rowY + i * 50;
      ctx.fillStyle = '#c9b58a'; ctx.font = '700 24px "DM Sans", sans-serif';
      ctx.fillText(L, barX - 60, y + barH - 6);
      ctx.fillStyle = 'rgba(255,255,255,.08)'; rr(ctx, barX, y, barW, barH, 8); ctx.fill();
      ctx.fillStyle = levelColor; rr(ctx, barX, y, Math.max(2, barW * p), barH, 8); ctx.fill();
      ctx.fillStyle = '#fdf6e3'; ctx.font = '700 20px "DM Sans", sans-serif';
      ctx.fillText(Math.round(p * 100) + '%', barX + barW + 14, y + barH - 6);
    }

    // overall pct
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fdf6e3'; ctx.font = '700 36px "DM Sans", sans-serif';
    ctx.fillText(pct + '% overall', W / 2, rowY + 5 * 50 + 56);

    // footer
    ctx.fillStyle = '#c9b58a'; ctx.font = '400 26px "DM Sans", sans-serif';
    ctx.fillText('nihongo-hub.com  ·  free 5-minute level check', W / 2, H - 70);
  }

  function captionFor(lang, level, pct, tags) {
    var T = DEFAULTS[lang] || DEFAULTS.en;
    return T.caption(level, pct) + '\n' + (tags || T.tags) + '\nhttps://www.nihongo-hub.com/onboarding.html';
  }

  function canvasToBlob(canvas) {
    return new Promise(function (res) { canvas.toBlob(function (b) { res(b); }, 'image/png'); });
  }

  function open(opts) {
    if (document.getElementById('nh-lvshare-ov')) return;
    opts = opts || {};
    var lang = opts.lang || (function () { try { return localStorage.getItem('nh_lang') || 'en'; } catch (e) { return 'en'; } })();
    var T = DEFAULTS[lang] || DEFAULTS.en;

    var ov = document.createElement('div');
    ov.id = 'nh-lvshare-ov';
    ov.style.cssText = 'position:fixed;inset:0;z-index:1200;background:rgba(8,6,4,.78);display:flex;align-items:center;justify-content:center;padding:18px';
    ov.innerHTML =
      '<div style="background:#1a1008;border:2px solid #e8a020;border-radius:14px;padding:18px;max-width:440px;width:100%;min-width:0;box-sizing:border-box;max-height:92vh;overflow:auto;text-align:center">' +
      '<canvas id="nh-lvshare-cv" style="width:100%;max-width:100%;height:auto;display:block;border-radius:10px;background:#160f08"></canvas>' +
      '<input id="nh-lvshare-tags" value="' + T.tags + '" style="width:100%;margin:12px 0 6px;padding:10px;border-radius:8px;border:1px solid #3d2f1f;background:#2a1f14;color:#fdf6e3;font:14px sans-serif">' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:6px">' +
      '<button id="nh-lv-share" style="flex:1;min-width:120px;background:#c0392b;color:#fff;border:none;border-radius:8px;padding:12px;font:700 14px sans-serif;cursor:pointer">🔗 Share</button>' +
      '<button id="nh-lv-dl" style="flex:1;min-width:120px;background:transparent;color:#e8a020;border:2px solid #e8a020;border-radius:8px;padding:12px;font:700 14px sans-serif;cursor:pointer">⬇ Download</button>' +
      '<button id="nh-lv-close" style="flex:0 0 auto;background:transparent;color:#8b7355;border:1px solid #3d2f1f;border-radius:8px;padding:12px 14px;font:14px sans-serif;cursor:pointer">✕</button>' +
      '</div>' +
      '<p id="nh-lv-msg" style="color:#8b7355;font:13px sans-serif;margin-top:10px;min-height:1.2em"></p>' +
      '</div>';
    document.body.appendChild(ov);
    var cv = document.getElementById('nh-lvshare-cv');
    var note = document.getElementById('nh-lv-msg');
    var close = function () { ov.remove(); };
    document.getElementById('nh-lv-close').onclick = close;
    ov.onclick = function (e) { if (e.target === ov) close(); };

    draw(cv, { lang: lang, level: opts.level, pct: opts.pct, acc: opts.acc }).catch(function () {});

    document.getElementById('nh-lv-dl').onclick = async function () {
      var blob = await canvasToBlob(cv); if (!blob) return;
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = 'nihongohub-level-' + (opts.level || 'N5') + '.png'; a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
      note.textContent = 'Saved! Post it with your hashtags 🎉';
    };
    document.getElementById('nh-lv-share').onclick = async function () {
      var tags = document.getElementById('nh-lvshare-tags').value;
      var text = captionFor(lang, opts.level || 'N5', opts.pct || 0, tags);
      var blob = await canvasToBlob(cv);
      var file = blob ? new File([blob], 'nihongohub-level.png', { type: 'image/png' }) : null;
      try {
        if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], text: text, title: 'My Japanese Level' });
          return;
        }
        if (navigator.share) { await navigator.share({ text: text, url: 'https://www.nihongo-hub.com/onboarding.html' }); return; }
        await navigator.clipboard.writeText(text);
        note.textContent = 'Copied caption — download the image and post them together 📋';
      } catch (e) { if (e && e.name === 'AbortError') return; note.textContent = 'Could not share — try Download instead.'; }
    };
  }

  window.NH_LEVEL_SHARECARD = { open: open, draw: draw, captionFor: captionFor };
})();

/* ═══════════════════════════════════════════════════════════════════════════
 * NH_BATTLE_SHARECARD — single-battle UGC card for the retro battle quiz.
 * "You Spared the Fukui Boss! ⛩️ / Level: N4 Explorer / ATK: 520 / Streak: 9 🔥"
 * Renders to a 1080×1350 (IG/Threads-friendly) canvas, Web Share API + download.
 * Front-end only — no Vercel Functions added.
 * ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  var W = 1080, H = 1350;

  // Prefecture meta: tiny built-in pool of "bosses". Display label, kanji, emoji.
  var BOSSES = {
    fukui:     { en: 'Fukui',     ja: '福井', emoji: '🌫️' },
    shimane:   { en: 'Shimane',   ja: '島根', emoji: '⛩️' },
    akita:     { en: 'Akita',     ja: '秋田', emoji: '🌾' },
    tokushima: { en: 'Tokushima', ja: '徳島', emoji: '🌀' },
    kochi:     { en: 'Kochi',     ja: '高知', emoji: '🌊' },
    kyoto:     { en: 'Kyoto',     ja: '京都', emoji: '⛩️' },
    tokyo:     { en: 'Tokyo',     ja: '東京', emoji: '🗼' },
    osaka:     { en: 'Osaka',     ja: '大阪', emoji: '🍡' },
    hokkaido:  { en: 'Hokkaido',  ja: '北海道', emoji: '❄️' },
    okinawa:   { en: 'Okinawa',   ja: '沖縄', emoji: '🐠' }
  };

  function pickBoss() {
    // last-visited prefecture is persisted by the Explore page; otherwise random.
    var slug = null;
    try { slug = localStorage.getItem('nh_last_pref'); } catch (e) {}
    if (BOSSES[slug]) return Object.assign({ slug: slug }, BOSSES[slug]);
    var keys = Object.keys(BOSSES);
    var pick = keys[Math.floor(Math.random() * keys.length)];
    return Object.assign({ slug: pick }, BOSSES[pick]);
  }

  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  function readStats() {
    var get = function (k, d) { try { var v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } };
    // Keys + thresholds mirror quiz.html exactly (getXP/heroStage/powerLevel).
    var xp = parseInt(get('nh_quiz_xp', '0'), 10) || 0;
    var streak = parseInt(get('nh_streak', '0'), 10) || 0;
    var best = parseInt(get('nh_best_streak', '0'), 10) || 0;
    var lvl = 1 + Math.floor(xp / 50);
    // simple ATK/DEF derivation so the number feels earned, not random.
    var atk = 100 + xp * 4 + streak * 12;
    var def = 80 + Math.floor(xp * 2.5) + best * 6;
    // current stage (N5..N1) — same thresholds as quiz.html heroStage()
    var stage = 'N5';
    if (xp >= 1000) stage = 'N1'; else if (xp >= 600) stage = 'N2'; else if (xp >= 300) stage = 'N3'; else if (xp >= 100) stage = 'N4';
    return { xp: xp, streak: streak, best: best, level: lvl, stage: stage, atk: atk, def: def };
  }

  async function drawCard(canvas, opts) {
    var ctx = canvas.getContext('2d');
    canvas.width = W; canvas.height = H;
    try { if (document.fonts && document.fonts.ready) await document.fonts.ready; } catch (e) {}
    var boss = opts.boss || pickBoss();
    var s = opts.stats || readStats();
    var gold = '#FFD700';

    // 1. pitch-black background (retro skin)
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);

    // 2. inner gold frame
    ctx.strokeStyle = gold; ctx.lineWidth = 6; rr(ctx, 30, 30, W - 60, H - 60, 0); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,215,0,.25)'; ctx.lineWidth = 2; rr(ctx, 54, 54, W - 108, H - 108, 0); ctx.stroke();

    // 3. brand tag (top)
    ctx.fillStyle = gold; ctx.textAlign = 'center';
    ctx.font = '700 22px "Press Start 2P", monospace';
    ctx.fillText('* NIHONGOHUB · BATTLE LOG', W / 2, 110);

    // 4. headline
    ctx.fillStyle = '#fff'; ctx.font = '700 56px "DotGothic16", sans-serif';
    ctx.fillText('You Spared the', W / 2, 230);
    ctx.fillStyle = gold; ctx.font = '700 86px "DotGothic16", sans-serif';
    ctx.fillText(boss.en + ' Boss ' + boss.emoji, W / 2, 330);
    ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.font = '500 38px "Noto Sans JP", sans-serif';
    ctx.fillText(boss.ja, W / 2, 380);

    // 5. monster slab (placeholder pixel-art block — keeps it generic, brand-safe)
    var bx = W / 2 - 200, by = 430, bw = 400, bh = 320;
    ctx.fillStyle = 'rgba(255,215,0,.08)'; rr(ctx, bx, by, bw, bh, 0); ctx.fill();
    ctx.strokeStyle = gold; ctx.lineWidth = 4; rr(ctx, bx, by, bw, bh, 0); ctx.stroke();
    ctx.fillStyle = gold; ctx.textAlign = 'center'; ctx.font = '700 220px "DM Sans", sans-serif';
    ctx.fillText(boss.emoji, W / 2, by + 245);

    // 6. stats row
    var rowY = by + bh + 80;
    var labelFont = '700 22px "Press Start 2P", monospace';
    var valueFont = '700 44px "DotGothic16", sans-serif';
    var cellW = (W - 200) / 3;
    var labels = ['LEVEL', 'ATK', 'STREAK'];
    var values = [s.stage + ' Explorer', String(s.atk), String(s.streak) + ' 🔥'];
    for (var i = 0; i < 3; i++) {
      var cx = 100 + cellW * i + cellW / 2;
      ctx.fillStyle = 'rgba(255,215,0,.7)'; ctx.font = labelFont;
      ctx.fillText(labels[i], cx, rowY);
      ctx.fillStyle = '#fff'; ctx.font = valueFont;
      ctx.fillText(values[i], cx, rowY + 60);
    }

    // 7. tagline
    ctx.fillStyle = '#fff'; ctx.font = '500 30px "Noto Sans JP", sans-serif';
    ctx.fillText('* The battle ended without anyone getting hurt.', W / 2, rowY + 170);
    ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.font = '400 24px "DM Sans", sans-serif';
    ctx.fillText('That LV stands for Love. Keep sparing bosses.', W / 2, rowY + 210);

    // 8. footer brand
    ctx.fillStyle = gold; ctx.font = '700 22px "Press Start 2P", monospace';
    ctx.fillText('nihongo-hub.com  ·  /quiz.html', W / 2, H - 60);
  }

  function buildCaption(boss, stats) {
    return [
      'I spared the ' + boss.en + ' Boss ⚔️',
      'Level: ' + stats.stage + ' Explorer · ATK: ' + stats.atk + ' · Streak: ' + stats.streak + ' 🔥',
      'JLPT battles where you talk your way out instead of fighting.',
      '#NihongoHub #JLPT #LearnJapanese #studygram #' + boss.en,
      'https://www.nihongo-hub.com/quiz.html'
    ].join('\n');
  }

  function canvasToBlob(canvas) {
    return new Promise(function (res) { canvas.toBlob(function (b) { res(b); }, 'image/png'); });
  }

  function offer(opts) {
    if (document.getElementById('nh-bshare-ov')) return;
    opts = opts || {};
    var boss = opts.boss || pickBoss();
    var stats = opts.stats || readStats();

    var ov = document.createElement('div');
    ov.id = 'nh-bshare-ov';
    ov.style.cssText = 'position:fixed;inset:0;z-index:1200;background:rgba(0,0,0,.85);display:flex;align-items:center;justify-content:center;padding:18px';
    ov.innerHTML =
      '<div style="background:#000;border:2px solid #FFD700;border-radius:0;padding:18px;max-width:440px;width:100%;min-width:0;box-sizing:border-box;max-height:92vh;overflow:auto;text-align:center">' +
      '<div style="font-family:\'Press Start 2P\',monospace;font-size:11px;color:#FFD700;margin-bottom:10px">* BATTLE CARD</div>' +
      '<canvas id="nh-bshare-cv" style="width:100%;max-width:100%;height:auto;display:block;background:#000"></canvas>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:14px">' +
      '<button id="nh-b-share" style="flex:1;min-width:120px;background:#FFD700;color:#000;border:none;border-radius:0;padding:14px;font-family:DotGothic16,sans-serif;font-size:15px;font-weight:700;cursor:pointer">📸 Share</button>' +
      '<button id="nh-b-dl"    style="flex:1;min-width:120px;background:transparent;color:#FFD700;border:2px solid #FFD700;border-radius:0;padding:14px;font-family:DotGothic16,sans-serif;font-size:15px;font-weight:700;cursor:pointer">⬇ Save</button>' +
      '<button id="nh-b-close" style="flex:0 0 auto;background:transparent;color:rgba(255,255,255,.55);border:1px solid rgba(255,255,255,.2);border-radius:0;padding:14px 16px;font-family:DotGothic16,sans-serif;font-size:14px;cursor:pointer">✕</button>' +
      '</div>' +
      '<p id="nh-b-msg" style="color:rgba(255,255,255,.55);font:13px sans-serif;margin-top:10px;min-height:1.2em"></p>' +
      '</div>';
    document.body.appendChild(ov);
    var cv = document.getElementById('nh-bshare-cv');
    var note = document.getElementById('nh-b-msg');
    var close = function () { ov.remove(); };
    document.getElementById('nh-b-close').onclick = close;
    ov.onclick = function (e) { if (e.target === ov) close(); };

    drawCard(cv, { boss: boss, stats: stats }).catch(function () {});

    document.getElementById('nh-b-dl').onclick = async function () {
      var blob = await canvasToBlob(cv); if (!blob) return;
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = 'nihongohub-battle-' + boss.slug + '.png'; a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
      note.textContent = 'Saved! Post it with your hashtags 🎉';
    };
    document.getElementById('nh-b-share').onclick = async function () {
      var caption = buildCaption(boss, stats);
      var blob = await canvasToBlob(cv);
      var file = blob ? new File([blob], 'nihongohub-battle.png', { type: 'image/png' }) : null;
      try {
        if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], text: caption, title: 'My JLPT Battle Log' });
          return;
        }
        if (navigator.share) { await navigator.share({ text: caption, url: 'https://www.nihongo-hub.com/quiz.html' }); return; }
        await navigator.clipboard.writeText(caption);
        note.textContent = 'Copied caption — Save the image and post them together 📋';
      } catch (e) { if (e && e.name === 'AbortError') return; note.textContent = 'Could not share — try Save instead.'; }
    };
  }

  window.NH_BATTLE_SHARECARD = { offer: offer, draw: drawCard, readStats: readStats, pickBoss: pickBoss };
})();
