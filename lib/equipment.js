/* lib/equipment.js - NH_EQUIPMENT_API: avatar + inventory + equipped slots management.
   Backed by localStorage with backwards compatibility for the legacy nh_titles array.
   Depends on data/equipment-metadata.js (window.NH_EQUIPMENT for prefecture metadata).
   Exposes window.NH_EQUIPMENT_API.
*/
(function(){
  const SLOTS = ['weapon','head','body','feet'];
  const NON_WEAPON_SLOTS = ['head','body','feet'];
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

  function getInventory(){
    try {
      const raw = localStorage.getItem('nh_inventory');
      if (raw) {
        const inv = JSON.parse(raw);
        return {
          weapon: Array.isArray(inv.weapon) ? inv.weapon : [],
          head:   Array.isArray(inv.head)   ? inv.head   : [],
          body:   Array.isArray(inv.body)   ? inv.body   : [],
          feet:   Array.isArray(inv.feet)   ? inv.feet   : []
        };
      }
      // Legacy migration: nh_titles -> nh_inventory.weapon
      const legacy = localStorage.getItem('nh_titles');
      if (legacy) {
        const arr = JSON.parse(legacy);
        if (Array.isArray(arr)) {
          return { weapon: arr.slice(), head: [], body: [], feet: [] };
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
    return inv[slot] && inv[slot].includes(prefSlug);
  }

  // claimReward: called when user earns equipment via quiz / share.
  // Returns { added: bool, item: <meta>, slot, prefecture }
  function claimReward(prefSlug, slot){
    if (!SLOTS.includes(slot)) return { added: false, reason: 'invalid-slot' };
    if (!window.NH_EQUIPMENT || !window.NH_EQUIPMENT[prefSlug] || !window.NH_EQUIPMENT[prefSlug][slot]) {
      return { added: false, reason: 'unknown-item' };
    }
    if (isOwned(slot, prefSlug)) return { added: false, reason: 'already-owned' };
    const inv = getInventory();
    inv[slot].push(prefSlug);
    saveInventory(inv);
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

  function equipItem(slot, prefSlug){
    if (!SLOTS.includes(slot)) return false;
    if (prefSlug !== null && !isOwned(slot, prefSlug)) return false;
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
      en: (s, n) => `🎁 ${n} unlocked! Equip it on your avatar.`,
      ja: (s, n) => `🎁 ${n} を入手！ アバターに装備しよう。`,
      zh: (s, n) => `🎁 取得 ${n}！前往裝備你的角色。`,
      es: (s, n) => `🎁 ¡${n} desbloqueado! Equípalo en tu avatar.`,
      th: (s, n) => `🎁 ปลดล็อก ${n} แล้ว! สวมใส่ในอวตารของคุณ`,
      id: (s, n) => `🎁 ${n} terbuka! Pasang di avatarmu.`
    };
    const name = result.item && result.item.name ? (result.item.name[langKey] || result.item.name.en) : 'Reward';
    const msg = (messages[langKey] || messages.en)(result.slot, name);
    const el = document.createElement('div');
    el.className = 'nh-reward-toast';
    el.innerHTML = `<img src="${itemAssetPath(result.slot, result.prefecture)}" alt="" width="48" height="48">
      <div><div class="rt-msg">${msg}</div><a href="rpg.html#equip" class="rt-link">⚔️ Open inventory →</a></div>`;
    document.body.appendChild(el);
    setTimeout(() => el.classList.add('show'), 30);
    setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 400); }, 5200);
  }

  window.NH_EQUIPMENT_API = {
    SLOTS, NON_WEAPON_SLOTS, VALID_HAIR, VALID_SKIN,
    getAvatar, setAvatar, avatarParts,
    getInventory, getEquipped, isOwned,
    claimReward, claimRandomShareReward,
    equipItem, unequipSlot, statsTotal,
    itemAssetPath, progressCounts, showRewardToast
  };
})();
