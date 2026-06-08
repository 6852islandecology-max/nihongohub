/* lib/constellation.js — NH_CONSTELLATION
 *
 * Sprint 3 "Constellation" MVP (per design memo 2026-06-06).
 * Cross-surface discovery: when the same kanji appears across N different
 * surfaces (quiz / prefecture / wildlife / blog), faintly highlight it so
 * the learner notices the connection themselves. Tap the spark to log a
 * "discovered line" that decorates their RPG page. The app never explains
 * the connection — the aha moment is the reward.
 *
 * Public API:
 *   NH_CONSTELLATION.see(token, surface)       record a sighting; returns true if threshold just crossed
 *   NH_CONSTELLATION.decorate(rootEl, tokens?) faintly highlight + spark already-threshold-met tokens in rootEl
 *   NH_CONSTELLATION.log()                     read the user-confirmed discovery log
 *   NH_CONSTELLATION.notice(token)             record an explicit "noticed" tap (used by spark click handler)
 *   NH_CONSTELLATION.TOKENS                    MVP token set (just "東" for P-a)
 *
 * Storage:  localStorage["nh_constellation"] = { enc: { "東": ["quiz","pref"] }, noticed: [...] }
 * Privacy:  learning behavior only, no PII, anonymous.
 */
(function(){
  const KEY = 'nh_constellation';
  const THRESHOLD = 2;
  const SURFACES = ['quiz','pref','wildlife','blog'];
  // P-a MVP: a single high-leverage kanji. Expand in P-b after measuring noticed-rate.
  const TOKENS = ['東'];

  function load(){
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const o = JSON.parse(raw);
        return {
          enc: (o && typeof o.enc === 'object') ? o.enc : {},
          noticed: Array.isArray(o && o.noticed) ? o.noticed : []
        };
      }
    } catch(e){}
    return { enc: {}, noticed: [] };
  }
  function save(state){
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch(e){}
  }

  // Record that `token` was seen on `surface`. Returns true the moment the
  // token first meets THRESHOLD (used to optionally trigger a tiny first-time hint).
  function see(token, surface){
    if (!token || !SURFACES.includes(surface) || !TOKENS.includes(token)) return false;
    const state = load();
    const arr = state.enc[token] || [];
    const before = arr.length;
    if (!arr.includes(surface)) arr.push(surface);
    state.enc[token] = arr;
    save(state);
    return before < THRESHOLD && arr.length >= THRESHOLD;
  }

  // True when the token is "ready to twinkle" (seen on >= THRESHOLD distinct surfaces).
  function isLit(token){
    const arr = (load().enc[token] || []);
    return arr.length >= THRESHOLD;
  }

  // User tapped a spark — record the discovery once.
  function notice(token){
    if (!token) return false;
    const state = load();
    if (state.noticed.some(n => n.k === token)) return false; // idempotent
    const surfaces = (state.enc[token] || []).length;
    state.noticed.push({ k: token, at: new Date().toISOString(), surfaces });
    save(state);
    return true;
  }

  function log(){ return load().noticed.slice(); }

  // Inject a tiny stylesheet once, scoped to .nh-cn-* classes so it never
  // collides with surface-specific styles.
  let _styled = false;
  function ensureStyle(){
    if (_styled) return; _styled = true;
    const css = `
      .nh-cn-mark{
        border-bottom:1px dotted #c8911f;cursor:pointer;
        background:linear-gradient(transparent 70%, rgba(224,166,52,.18) 70%);
        position:relative;
      }
      .nh-cn-mark:hover{background:linear-gradient(transparent 70%, rgba(224,166,52,.35) 70%)}
      .nh-cn-spark{
        display:inline-block;font-size:.7em;margin-left:1px;opacity:.78;
        animation:nh-cn-twinkle 2.4s ease-in-out infinite;
      }
      .nh-cn-mark.noticed{border-bottom-style:solid;border-bottom-color:#2a7a4b}
      .nh-cn-mark.noticed .nh-cn-spark{display:none}
      @keyframes nh-cn-twinkle{0%,100%{transform:scale(1);opacity:.55}50%{transform:scale(1.18);opacity:1}}
    `;
    const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
  }

  // Decorate every occurrence of any lit token inside rootEl. Idempotent —
  // it skips text nodes whose parent is already a .nh-cn-mark or in a script/style.
  function decorate(rootEl, tokens){
    if (!rootEl) return 0;
    const targets = (tokens || TOKENS).filter(isLit);
    if (!targets.length) return 0;
    ensureStyle();
    const re = new RegExp('(' + targets.map(t => t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|') + ')', 'g');
    const noticedSet = new Set(log().map(n => n.k));
    let count = 0;

    const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT, {
      acceptNode(node){
        if (!node.nodeValue || !re.test(node.nodeValue)) return NodeFilter.FILTER_REJECT;
        // reset lastIndex (test() with global flag advances it)
        re.lastIndex = 0;
        const p = node.parentNode;
        if (!p) return NodeFilter.FILTER_REJECT;
        const tag = p.nodeName;
        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA') return NodeFilter.FILTER_REJECT;
        if (p.classList && p.classList.contains('nh-cn-mark')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const toReplace = [];
    while (walker.nextNode()) toReplace.push(walker.currentNode);

    for (const node of toReplace) {
      const frag = document.createDocumentFragment();
      const parts = node.nodeValue.split(re);
      for (const part of parts) {
        if (targets.includes(part)) {
          const span = document.createElement('span');
          span.className = 'nh-cn-mark' + (noticedSet.has(part) ? ' noticed' : '');
          span.dataset.cnToken = part;
          span.title = noticedSet.has(part) ? '✨ noticed' : '✨ connection?';
          span.textContent = part;
          if (!noticedSet.has(part)) {
            const spark = document.createElement('span');
            spark.className = 'nh-cn-spark';
            spark.textContent = '✨';
            span.appendChild(spark);
          }
          frag.appendChild(span);
          count++;
        } else if (part) {
          frag.appendChild(document.createTextNode(part));
        }
      }
      node.parentNode.replaceChild(frag, node);
    }
    return count;
  }

  // One-time global click listener: any tap on a .nh-cn-mark logs the discovery.
  // Other surfaces don't need their own handler.
  function wireClicks(){
    if (window.__nh_cn_clicks_wired) return; window.__nh_cn_clicks_wired = true;
    document.addEventListener('click', (e) => {
      const m = e.target && (e.target.closest ? e.target.closest('.nh-cn-mark') : null);
      if (!m) return;
      const tok = m.dataset.cnToken;
      if (!tok) return;
      const fresh = notice(tok);
      m.classList.add('noticed');
      m.title = '✨ noticed';
      const sp = m.querySelector('.nh-cn-spark'); if (sp) sp.remove();
      if (fresh) {
        // tiny ephemeral toast (no global toast() dependency)
        const t = document.createElement('div');
        t.textContent = '✨ Connection noticed — saved to your discovery log.';
        t.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:24px;z-index:9999;background:#0d0a14;color:#fdf6e3;border:2px solid #e0a634;border-radius:8px;padding:10px 14px;font:13px "DM Sans",sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.35);opacity:0;transition:opacity .25s';
        document.body.appendChild(t);
        requestAnimationFrame(()=>{ t.style.opacity = '1'; });
        setTimeout(()=>{ t.style.opacity = '0'; setTimeout(()=>t.remove(), 280); }, 2200);
      }
    }, true);
  }

  // Auto-wire on script load.
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wireClicks);
    else wireClicks();
  }

  window.NH_CONSTELLATION = { see, decorate, log, notice, isLit, TOKENS, SURFACES, THRESHOLD };
})();
