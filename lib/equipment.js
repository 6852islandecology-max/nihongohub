// [browser] HTML から <script src> で読み込まれる IIFE。api/ からは import されない。
/* lib/equipment.js - NH_EQUIPMENT_API: avatar + inventory + equipped slots management.
   Backed by localStorage with backwards compatibility for the legacy nh_titles array.
   Depends on data/equipment-metadata.js (window.NH_EQUIPMENT for prefecture metadata).
   Exposes window.NH_EQUIPMENT_API.
*/
(function(){
  const SLOTS = ['weapon','head','body','feet'];
  const NON_WEAPON_SLOTS = ['head','body','feet'];
  // Map narrative rarity (data/equipment-metadata.js) to gacha-style N/R/SR/SSR badges.
  // common→N, rare→R, epic→SR, legendary→SSR. Falls back to N.
  const RARITY_BADGE = { common: 'N', rare: 'R', epic: 'SR', legendary: 'SSR' };
  const RARITY_COLOR = { N: '#8b7355', R: '#4e8fc8', SR: '#c8911f', SSR: '#bf3325' };
  function rarityBadge(item) {
    if (!item || !item.rarity) return 'N';
    return RARITY_BADGE[item.rarity] || 'N';
  }
  function rarityColor(badge) { return RARITY_COLOR[badge] || RARITY_COLOR.N; }
  const VALID_HAIR = ['h1','h2','h3','h4','h5'];
  const VALID_SKIN = ['s1','s2','s3'];

  function getAvatar(){
    let v;
    try { v = localStorage.getItem('nh_avatar'); } catch(e){}
    if (!v || !v.match(/^h[1-5]-s[1-3]$/)) return null;
    return v;
  }
  function setAvatar(hairId, skinId){
    if (!VALID_HAIR.includes(hairId) || !VALID_SKIN.includes(skinId)) return false;
    try { localStorage.setItem('nh_avatar', hairId + '-' + skinId); } catch(e){}
    return true;
  }
  function avatarParts(){
    const v = getAvatar();
    if (!v) return null;
    const [h, s] = v.split('-');
    return { hair: h, skin: s, src: `assets/avatars/avatar-${h}-${s}.svg` };
  }

  // Canonical prefecture slug = lowercase (matches window.NH_EQUIPMENT keys + SVG class names).
  // Normalizing + de-duplicating on read self-heals legacy data that mixed casings
  // (e.g. ["Tokyo","tokyo"] from the old title/equipment double-write).
  function normSlugs(arr){
    if (!Array.isArray(arr)) return [];
    return [...new Set(arr.map(s => String(s).toLowerCase()))];
  }
  function getInventory(){
    try {
      const raw = localStorage.getItem('nh_inventory');
      if (raw) {
        const inv = JSON.parse(raw);
        return {
          weapon: normSlugs(inv.weapon),
          head:   normSlugs(inv.head),
          body:   normSlugs(inv.body),
          feet:   normSlugs(inv.feet)
        };
      }
      // Legacy migration: nh_titles -> nh_inventory.weapon
      const legacy = localStorage.getItem('nh_titles');
      if (legacy) {
        const arr = JSON.parse(legacy);
        if (Array.isArray(arr)) {
          return { weapon: normSlugs(arr), head: [], body: [], feet: [] };
        }
      }
    } catch(e){}
    return { weapon: [], head: [], body: [], feet: [] };
  }
  function saveInventory(inv){
    try { localStorage.setItem('nh_inventory', JSON.stringify(inv)); } catch(e){}
    // Keep legacy nh_titles in sync with weapon slot
    try { localStorage.setItem('nh_titles', JSON.stringify(inv.weapon)); } catch(e){}
  }

  function getEquipped(){
    try {
      const raw = localStorage.getItem('nh_equipped');
      if (raw) {
        const eq = JSON.parse(raw);
        return {
          weapon: eq.weapon || null,
          head:   eq.head   || null,
          body:   eq.body   || null,
          feet:   eq.feet   || null
        };
      }
    } catch(e){}
    return { weapon: null, head: null, body: null, feet: null };
  }
  function saveEquipped(eq){
    try { localStorage.setItem('nh_equipped', JSON.stringify(eq)); } catch(e){}
  }

  function isOwned(slot, prefSlug){
    const inv = getInventory();
    return inv[slot] && inv[slot].includes(String(prefSlug).toLowerCase());
  }

  // claimReward: called when user earns equipment via quiz / share.
  // Returns { added: bool, item: <meta>, slot, prefecture }
  function claimReward(prefSlug, slot){
    if (!SLOTS.includes(slot)) return { added: false, reason: 'invalid-slot' };
    prefSlug = String(prefSlug).toLowerCase(); // canonical key (metadata + inventory are lowercase)
    if (!window.NH_EQUIPMENT || !window.NH_EQUIPMENT[prefSlug] || !window.NH_EQUIPMENT[prefSlug][slot]) {
      return { added: false, reason: 'unknown-item' };
    }
    if (isOwned(slot, prefSlug)) return { added: false, reason: 'already-owned' };
    const inv = getInventory();
    inv[slot].push(prefSlug);
    saveInventory(inv);
    // Remember most-recent drop so the shareable guild card can headline it.
    try { localStorage.setItem('nh_last_drop', JSON.stringify({ slot, prefecture: prefSlug, ts: Date.now() })); } catch(e){}
    return { added: true, item: window.NH_EQUIPMENT[prefSlug][slot], slot, prefecture: prefSlug };
  }

  // Claim a random non-weapon slot (called on share). Returns same shape as claimReward.
  function claimRandomShareReward(prefSlug){
    if (!window.NH_EQUIPMENT || !window.NH_EQUIPMENT[prefSlug]) return { added: false, reason: 'unknown-prefecture' };
    // Try slots in random order; first unowned wins.
    const order = NON_WEAPON_SLOTS.slice().sort(() => Math.random() - 0.5);
    for (const slot of order) {
      if (!isOwned(slot, prefSlug)) return claimReward(prefSlug, slot);
    }
    return { added: false, reason: 'all-owned' };
  }

  // Rarity-weighted gacha drop across ALL prefectures + slots. Used by the JLPT quiz so
  // correct answers drop gear; common pieces are frequent and SSR (legendary) is rare, so
  // a full rare collection takes many correct answers (not a single lucky pull).
  const RARITY_WEIGHT = { common: 60, rare: 26, epic: 11, legendary: 3 };
  function claimRandomDrop(){
    if (!window.NH_EQUIPMENT) return { added: false, reason: 'no-metadata' };
    const inv = getInventory();
    const pool = [];
    let total = 0;
    for (const pref of Object.keys(window.NH_EQUIPMENT)) {
      for (const slot of SLOTS) {
        const item = window.NH_EQUIPMENT[pref][slot];
        if (!item) continue;
        if (inv[slot] && inv[slot].includes(pref)) continue; // already owned
        const w = RARITY_WEIGHT[item.rarity] || RARITY_WEIGHT.common;
        pool.push({ pref, slot, w });
        total += w;
      }
    }
    if (!pool.length) return { added: false, reason: 'all-owned' };
    let r = Math.random() * total;
    for (const p of pool) { r -= p.w; if (r <= 0) return claimReward(p.pref, p.slot); }
    return claimReward(pool[0].pref, pool[0].slot);
  }

  function equipItem(slot, prefSlug){
    if (!SLOTS.includes(slot)) return false;
    if (prefSlug !== null) {
      prefSlug = String(prefSlug).toLowerCase(); // canonical
      if (!isOwned(slot, prefSlug)) return false;
    }
    const eq = getEquipped();
    eq[slot] = prefSlug; // null = unequip
    saveEquipped(eq);
    return true;
  }

  function unequipSlot(slot){
    return equipItem(slot, null);
  }

  function statsTotal(){
    const eq = getEquipped();
    let atk = 0, def = 0;
    for (const slot of SLOTS) {
      const slug = eq[slot];
      if (!slug || !window.NH_EQUIPMENT[slug] || !window.NH_EQUIPMENT[slug][slot]) continue;
      const item = window.NH_EQUIPMENT[slug][slot];
      atk += (item.stats && item.stats.atk) || 0;
      def += (item.stats && item.stats.def) || 0;
    }
    return { atk, def };
  }

  function itemAssetPath(slot, prefSlug){
    return `assets/equipment/${slot}/${prefSlug}.svg`;
  }

  // Rarity plate: wraps an item icon in a gacha-style frame (N/R/SR/SSR colored border,
  // dark radial backplate, corner ticks, rarity chip). 2026-06-10 pixel-art standard 案B —
  // applied at render time so the 188 item SVGs need no regeneration.
  function plateIcon(slot, prefSlug, opts){
    const o = opts || {};
    const meta = window.NH_EQUIPMENT && window.NH_EQUIPMENT[prefSlug] && window.NH_EQUIPMENT[prefSlug][slot];
    const badge = rarityBadge(meta);
    const color = rarityColor(badge);
    const gid = 'nhpg-' + slot + '-' + prefSlug;
    const size = o.size || 56;
    const chip = o.chip === false ? '' :
      `<rect x="38" y="50" width="22" height="11" rx="3" fill="${color}"/>` +
      `<text x="49" y="58.5" font-family="monospace" font-size="8" font-weight="bold" text-anchor="middle" fill="#241608">${badge}</text>`;
    return `<svg width="${size}" height="${size}" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" class="nh-plate" role="img">` +
      `<defs><radialGradient id="${gid}" cx="50%" cy="38%">` +
      `<stop offset="0%" stop-color="#4a3318"/><stop offset="100%" stop-color="#241608"/></radialGradient></defs>` +
      `<rect x="1.5" y="1.5" width="61" height="61" rx="9" fill="url(#${gid})" stroke="${color}" stroke-width="2.5"/>` +
      `<path d="M6 12 L6 6 L12 6" stroke="${color}" stroke-width="2" fill="none"/>` +
      `<path d="M52 6 L58 6 L58 12" stroke="${color}" stroke-width="2" fill="none"/>` +
      `<image href="${itemAssetPath(slot, prefSlug)}" x="8" y="6" width="48" height="48"/>` +
      chip + `</svg>`;
  }

  function progressCounts(){
    const inv = getInventory();
    const all = Object.keys(window.NH_EQUIPMENT || {});
    const totalPossible = all.length * SLOTS.length;
    const obtained = SLOTS.reduce((s, slot) => s + (inv[slot] ? inv[slot].length : 0), 0);
    return { obtained, totalPossible, percent: totalPossible ? Math.round(obtained / totalPossible * 100) : 0 };
  }

  // toast helper used by claim flows from quiz.html / prefectures.html
  function showRewardToast(result, lang){
    if (!result || !result.added) return;
    const langKey = (typeof lang === 'string' ? lang : (localStorage.getItem('nh_lang') || 'en'));
    const messages = {
      en: (s, n, r) => `🎁 [${r}] ${n} dropped! Equip it on your avatar.`,
      ja: (s, n, r) => `🎁 [${r}] ${n} を入手！ アバターに装備しよう。`,
      zh: (s, n, r) => `🎁 [${r}] 取得 ${n}！前往裝備你的角色。`,
      es: (s, n, r) => `🎁 [${r}] ¡${n} desbloqueado! Equípalo en tu avatar.`,
      th: (s, n, r) => `🎁 [${r}] ปลดล็อก ${n} แล้ว! สวมใส่ในอวตารของคุณ`,
      id: (s, n, r) => `🎁 [${r}] ${n} terbuka! Pasang di avatarmu.`
    };
    const name = result.item && result.item.name ? (result.item.name[langKey] || result.item.name.en) : 'Reward';
    const badge = rarityBadge(result.item);
    const msg = (messages[langKey] || messages.en)(result.slot, name, badge);
    const el = document.createElement('div');
    el.className = 'nh-reward-toast';
    el.style.borderLeft = '4px solid ' + rarityColor(badge);
    el.innerHTML = plateIcon(result.slot, result.prefecture, { size: 48 }) +
      `<div><div class="rt-msg">${msg}</div><a href="rpg.html#equip" class="rt-link">⚔️ Open inventory →</a></div>`;
    document.body.appendChild(el);
    setTimeout(() => el.classList.add('show'), 30);
    setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 400); }, 5200);
  }

  window.NH_EQUIPMENT_API = {
    SLOTS, NON_WEAPON_SLOTS, VALID_HAIR, VALID_SKIN,
    getAvatar, setAvatar, avatarParts,
    getInventory, getEquipped, isOwned,
    claimReward, claimRandomShareReward, claimRandomDrop,
    equipItem, unequipSlot, statsTotal,
    itemAssetPath, plateIcon, progressCounts, showRewardToast,
    rarityBadge, rarityColor,
    lastDrop: function(){ try { return JSON.parse(localStorage.getItem('nh_last_drop') || 'null'); } catch(e){ return null; } }
  };
})();
