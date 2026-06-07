/* lib/sharecard.js — window.NH_SHARECARD
 * Renders a Monster-Hunter-style guild card (avatar + equipped gear + composed title + stage)
 * to a canvas, then lets the user share it as an image (Web Share with files) or download it.
 * Hashtags are editable before sharing. Depends on NH_EQUIPMENT_API + NH_TITLES_API (optional).
 */
(function () {
  var W = 1080, H = 1080;
  var DEFAULT_TAGS = '#NihongoHub #LearnJapanese #JLPT #studygram #日本語';

  function get(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } }
  function stageFromXp(xp) { return xp >= 1000 ? 'N1' : xp >= 600 ? 'N2' : xp >= 300 ? 'N3' : xp >= 100 ? 'N4' : 'N5'; }
  function loadImg(src) {
    return new Promise(function (res) { var im = new Image(); im.onload = function () { res(im); }; im.onerror = function () { res(null); }; im.src = src; });
  }
  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  async function draw(canvas) {
    var ctx = canvas.getContext('2d');
    canvas.width = W; canvas.height = H;
    try { if (document.fonts && document.fonts.ready) await document.fonts.ready; } catch (e) {}

    // background
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#241a0e'); g.addColorStop(1, '#160f08');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // gold frame
    ctx.strokeStyle = '#e8a020'; ctx.lineWidth = 10; rr(ctx, 22, 22, W - 44, H - 44, 28); ctx.stroke();
    ctx.strokeStyle = 'rgba(232,160,32,.25)'; ctx.lineWidth = 2; rr(ctx, 42, 42, W - 84, H - 84, 18); ctx.stroke();

    // brand
    ctx.fillStyle = '#e8a020'; ctx.textAlign = 'center';
    ctx.font = '700 34px "DM Sans", sans-serif';
    ctx.fillText('⛩  NIHONGOHUB  ·  GUILD CARD', W / 2, 92);

    // composed title
    var T = window.NH_TITLES_API, comp = T && T.getComposed && T.getComposed();
    var ja = (T && comp) ? T.composeDisplay(comp, 'ja') : '';
    var en = (T && comp) ? T.composeDisplay(comp, 'en') : '';
    ctx.fillStyle = '#fff'; ctx.font = '700 64px "Noto Sans JP", sans-serif';
    ctx.fillText(ja || '名もなき冒険者', W / 2, 185);
    if (en) { ctx.fillStyle = '#c9b58a'; ctx.font = '400 30px "DM Sans", sans-serif'; ctx.fillText(en, W / 2, 228); }

    // avatar stage panel
    var EQ = window.NH_EQUIPMENT_API;
    var avatar = EQ && EQ.avatarParts ? EQ.avatarParts() : null;
    var equipped = EQ && EQ.getEquipped ? EQ.getEquipped() : {};
    var cx = W / 2, cyTop = 300, panelH = 430;
    // panel
    ctx.fillStyle = 'rgba(0,0,0,.22)'; rr(ctx, 140, cyTop, W - 280, panelH, 20); ctx.fill();
    // avatar
    if (avatar && avatar.src) {
      var im = await loadImg(avatar.src);
      if (im) { var s = 300; ctx.drawImage(im, cx - s / 2, cyTop + 60, s, s); }
    }
    // equipment badges (corners of the panel)
    var slots = [['weapon', 200, cyTop + 40], ['head', W - 320, cyTop + 40], ['body', 200, cyTop + panelH - 160], ['feet', W - 320, cyTop + panelH - 160]];
    for (var i = 0; i < slots.length; i++) {
      var slot = slots[i][0], bx = slots[i][1], by = slots[i][2], bs = 120;
      var slug = equipped && equipped[slot];
      var meta = (slug && window.NH_EQUIPMENT && window.NH_EQUIPMENT[slug] && window.NH_EQUIPMENT[slug][slot]) || null;
      var badge = (EQ && EQ.rarityBadge) ? EQ.rarityBadge(meta) : 'N';
      var bcol = (EQ && EQ.rarityColor) ? EQ.rarityColor(badge) : '#8b7355';
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.strokeStyle = meta ? bcol : '#3d2f1f'; ctx.lineWidth = meta ? 4 : 3;
      rr(ctx, bx, by, bs, bs, 14); ctx.fill(); ctx.stroke();
      if (slug && EQ.itemAssetPath) {
        var gi = await loadImg(EQ.itemAssetPath(slot, slug));
        if (gi) ctx.drawImage(gi, bx + 14, by + 14, bs - 28, bs - 28);
      } else {
        ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.font = '40px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText({ weapon: '⚔', head: '🪖', body: '🥋', feet: '👣' }[slot], bx + bs / 2, by + bs / 2 + 14);
      }
      if (meta) {
        // rarity badge corner
        ctx.fillStyle = bcol;
        rr(ctx, bx + bs - 46, by - 10, 56, 26, 6); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = '900 18px "DM Sans", sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(badge, bx + bs - 18, by + 8);
      }
    }

    // stats row
    var xp = parseInt(get('nh_quiz_xp', '0'), 10) || 0;
    var best = parseInt(get('nh_best_streak', '0'), 10) || 0;
    var lv = 1 + Math.floor(xp / 10), stage = stageFromXp(xp);
    var words = (T && T.earnedWords) ? T.earnedWords().length : 0;
    var stats2 = (EQ && EQ.statsTotal) ? EQ.statsTotal() : { atk: 0, def: 0 };
    var power = xp + stats2.atk * 10 + stats2.def * 8;
    var stats = [['STAGE', stage], ['LV', String(lv)], ['XP', String(xp)], ['戦闘力', String(power)], ['BEST 🔥', String(best)]];
    var sy = cyTop + panelH + 80, sw = (W - 200) / stats.length;
    ctx.textAlign = 'center';
    for (var j = 0; j < stats.length; j++) {
      var sx = 100 + sw * j + sw / 2;
      ctx.fillStyle = '#e8a020'; ctx.font = '700 52px "DM Sans", sans-serif'; ctx.fillText(stats[j][1], sx, sy);
      ctx.fillStyle = '#8b7355'; ctx.font = '600 22px "DM Sans", sans-serif'; ctx.fillText(stats[j][0], sx, sy + 36);
    }

    // footer
    ctx.fillStyle = '#c9b58a'; ctx.font = '400 28px "DM Sans", sans-serif';
    ctx.fillText('nihongo-hub.com  ·  learn Japanese, conquer all 47 prefectures', W / 2, H - 70);
  }

  function shareText(tags) {
    var T = window.NH_TITLES_API, comp = T && T.getComposed && T.getComposed();
    var ja = (T && comp) ? T.composeDisplay(comp, 'ja') : '';
    var xp = parseInt(get('nh_quiz_xp', '0'), 10) || 0;
    var EQ = window.NH_EQUIPMENT_API;
    var stats = (EQ && EQ.statsTotal) ? EQ.statsTotal() : { atk: 0, def: 0 };
    var power = xp + stats.atk * 10 + stats.def * 8; // "戦闘力" = composite battle-power score
    var drop = (EQ && EQ.lastDrop) ? EQ.lastDrop() : null;
    var dropLine = '';
    if (drop && window.NH_EQUIPMENT && window.NH_EQUIPMENT[drop.prefecture] && window.NH_EQUIPMENT[drop.prefecture][drop.slot]) {
      var meta = window.NH_EQUIPMENT[drop.prefecture][drop.slot];
      var badge = EQ.rarityBadge(meta);
      var nm = meta.name && (meta.name.ja || meta.name.en) || 'reward';
      dropLine = 'Just dropped: 【' + nm + ' (' + badge + ')】 ⚔️\n';
    }
    var head = ja ? ('Title 「' + ja + '」') : 'My NihongoHub adventure';
    return dropLine + head + ' · ' + stageFromXp(xp) + ' · 戦闘力 ' + power + ' ⚔️\nConquering all 47 prefectures 🗾\n'
      + (tags || DEFAULT_TAGS) + '\nhttps://www.nihongo-hub.com/rpg.html';
  }

  function canvasToBlob(canvas) {
    return new Promise(function (res) { canvas.toBlob(function (b) { res(b); }, 'image/png'); });
  }

  function open() {
    if (document.getElementById('nh-sharecard-ov')) return;
    var ov = document.createElement('div');
    ov.id = 'nh-sharecard-ov';
    ov.style.cssText = 'position:fixed;inset:0;z-index:1200;background:rgba(8,6,4,.78);display:flex;align-items:center;justify-content:center;padding:18px';
    ov.innerHTML =
      '<div style="background:#1a1008;border:2px solid #e8a020;border-radius:14px;padding:18px;max-width:440px;width:100%;min-width:0;box-sizing:border-box;max-height:92vh;overflow:auto;text-align:center">' +
      '<canvas id="nh-sharecard-cv" style="width:100%;max-width:100%;height:auto;display:block;border-radius:10px;background:#160f08"></canvas>' +
      '<input id="nh-sharecard-tags" value="' + DEFAULT_TAGS + '" style="width:100%;margin:12px 0 6px;padding:10px;border-radius:8px;border:1px solid #3d2f1f;background:#2a1f14;color:#fdf6e3;font:14px sans-serif">' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:6px">' +
      '<button id="nh-sc-share" style="flex:1;min-width:120px;background:#c0392b;color:#fff;border:none;border-radius:8px;padding:12px;font:700 14px sans-serif;cursor:pointer">🔗 Share</button>' +
      '<button id="nh-sc-dl" style="flex:1;min-width:120px;background:transparent;color:#e8a020;border:2px solid #e8a020;border-radius:8px;padding:12px;font:700 14px sans-serif;cursor:pointer">⬇ Download</button>' +
      '<button id="nh-sc-close" style="flex:0 0 auto;background:transparent;color:#8b7355;border:1px solid #3d2f1f;border-radius:8px;padding:12px 14px;font:14px sans-serif;cursor:pointer">✕</button>' +
      '</div>' +
      '<p id="nh-sc-msg" style="color:#8b7355;font:13px sans-serif;margin-top:10px;min-height:1.2em"></p>' +
      '</div>';
    document.body.appendChild(ov);
    var cv = document.getElementById('nh-sharecard-cv');
    var msg = document.getElementById('nh-sharecard-tags');
    var note = document.getElementById('nh-sc-msg');
    var close = function () { ov.remove(); };
    document.getElementById('nh-sc-close').onclick = close;
    ov.onclick = function (e) { if (e.target === ov) close(); };

    draw(cv).catch(function () {});

    document.getElementById('nh-sc-dl').onclick = async function () {
      var blob = await canvasToBlob(cv); if (!blob) return;
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = 'nihongohub-guild-card.png'; a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
      note.textContent = 'Saved! Post it with your hashtags 🎉';
    };
    document.getElementById('nh-sc-share').onclick = async function () {
      var tags = document.getElementById('nh-sharecard-tags').value;
      var text = shareText(tags);
      var blob = await canvasToBlob(cv);
      var file = blob ? new File([blob], 'nihongohub-guild-card.png', { type: 'image/png' }) : null;
      try {
        if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], text: text, title: 'My NihongoHub Guild Card' });
          return;
        }
        if (navigator.share) { await navigator.share({ text: text, url: 'https://www.nihongo-hub.com/rpg.html' }); return; }
        await navigator.clipboard.writeText(text);
        note.textContent = 'Copied caption — download the image and post them together 📋';
      } catch (e) { if (e && e.name === 'AbortError') return; note.textContent = 'Could not share — try Download instead.'; }
    };
  }

  window.NH_SHARECARD = { open: open, draw: draw };
})();
