/* lib/site-chrome.js — shared site chrome injected across pages (no build step).
 * Modeled on lib/hamburger.js (self-invoking, idempotent, DOM-inject after load).
 * Responsibilities:
 *   (A) Canonical nav link set (single source of truth) into each page's header shape.
 *   (B) Account/plan chip (FREE / TRIAL·Nd / PRO / LIFETIME / Log in) in every header.
 *   (C) A language bar ONLY on pages that have neither a #langbar nor their own setLang.
 *   (D) A slim shared footer on pages that lack a <footer>.
 * Include AFTER lib/hamburger.js and AFTER lib/i18n-core.js:
 *   <script src="lib/i18n-core.js" defer></script>
 *   <script src="lib/hamburger.js" defer></script>
 *   <script src="lib/site-chrome.js" defer></script>
 * Pages in sub-dirs adjust the src path (e.g. ../lib/...) and may set window.NH_BASE = '../'.
 */
(function () {
  if (window.__NH_CHROME__) return;
  window.__NH_CHROME__ = true;

  var BASE = window.NH_BASE || '';                 // '' at root, '../' for sub-dir pages
  var LANGS = ['en', 'ja', 'zh', 'es', 'th', 'id'];
  var I18N = window.NH_I18N || null;

  function curLang() {
    try { var l = localStorage.getItem('nh_lang'); return LANGS.indexOf(l) >= 0 ? l : 'en'; }
    catch (e) { return 'en'; }
  }
  function el(t, c) { var e = document.createElement(t); if (c) e.className = c; return e; }

  // Canonical nav, grouped by visitor intent (single source of truth).
  // Three dropdown groups + a standalone Pricing link. key → data-i18n-chrome.
  // "Home" is omitted — every page's logo already links to index.html.
  var ECHO = 'https://shadowing-app-theta.vercel.app?source=nihongohub';
  var NAV_GROUPS = [
    { key: 'navg_learn', label: '📚 Learn', items: [
      { key: 'nav_leveltest', href: BASE + 'onboarding.html', text: '🎯 Level test' },
      { key: 'nav_quiz',      href: BASE + 'quiz.html',       text: '⚔️ Quiz' },
      { key: 'nav_dashboard', href: BASE + 'dashboard.html',  text: '📊 Dashboard' },
      { key: 'nav_shadowing', href: ECHO,                     text: '🎙 Shadowing', ext: true }
    ]},
    { key: 'navg_explore', label: '🗾 Explore Japan', items: [
      { key: 'nav_explore',  href: BASE + 'prefectures.html',                 text: '🗾 Prefecture map' },
      { key: 'nav_culture',  href: BASE + 'blog/index.html',                  text: '📖 Culture blog' },
      { key: 'nav_wildlife', href: BASE + 'wildlife.html',                    text: '🦋 Wildlife' },
      { key: 'nav_trip',     href: BASE + 'blog/japan-premium-experiences.html', text: '✈️ Trip planning' },
      { key: 'nav_reloc',    href: BASE + 'blog/moving-to-japan-guide.html',  text: '🏡 Moving to Japan' }
    ]},
    { key: 'navg_play', label: '🎮 My Journey', items: [
      { key: 'nav_journey', href: BASE + 'rpg.html',         text: '⚔ Your character' },
      { key: 'nav_quests',  href: BASE + 'prefectures.html', text: '🗺 Prefecture quests' }
    ]}
  ];
  var PRICING_ITEM = { key: 'nav_pricing', href: BASE + 'index.html#pricing', text: '💴 Pricing' };

  // ---------- (A) NAV ----------
  function makeAnchor(item, cls) {
    var a = el('a', cls || '');
    a.href = item.href;
    a.textContent = item.text;
    a.setAttribute('data-i18n-chrome', item.key);
    if (item.ext) { a.target = '_blank'; a.rel = 'noopener'; }
    return a;
  }

  function ensureNavCss() {
    if (document.getElementById('nh-nav-css')) return;
    var s = document.createElement('style'); s.id = 'nh-nav-css';
    s.textContent =
      '.nh-nav{display:flex;align-items:center;gap:4px;flex-wrap:wrap}' +
      '.nh-navgroup{position:relative}' +
      '.nh-navbtn{font:inherit;background:none;border:none;color:inherit;cursor:pointer;padding:8px 10px;display:inline-flex;align-items:center;gap:5px;border-radius:6px;letter-spacing:.2px}' +
      ".nh-navbtn::after{content:'\\25BE';font-size:.68em;opacity:.65;margin-left:1px}" +
      '.nh-navbtn:hover,.nh-navgroup:focus-within>.nh-navbtn,.nh-navgroup.open>.nh-navbtn{color:var(--gold,#e0a634)}' +
      '.nh-navmenu{position:absolute;top:calc(100% + 4px);left:0;min-width:196px;background:#0d0a14;border:1px solid rgba(224,166,52,.55);border-radius:9px;padding:6px;display:none;flex-direction:column;gap:1px;z-index:300;box-shadow:0 10px 28px rgba(0,0,0,.4)}' +
      '.nh-navgroup:hover>.nh-navmenu,.nh-navgroup:focus-within>.nh-navmenu,.nh-navgroup.open>.nh-navmenu{display:flex}' +
      '.nh-navitem{display:block;padding:9px 11px;border-radius:6px;color:#f4ead2 !important;text-decoration:none;font-size:14px;white-space:nowrap;line-height:1.3}' +
      '.nh-navitem:hover{background:rgba(224,166,52,.16);color:#fff !important}' +
      '.nh-navtop{padding:8px 10px;text-decoration:none;color:inherit;border-radius:6px;white-space:nowrap}' +
      '.nh-navtop:hover{color:var(--gold,#e0a634)}' +
      /* mobile: when the hamburger opens .navlinks/.nav-links, render groups expanded inline */
      '@media(max-width:860px){' +
      '.nh-nav{flex-direction:column;align-items:stretch;gap:0;width:100%}' +
      '.nh-navmenu{position:static;display:flex;border:none;background:transparent;box-shadow:none;padding:0 0 8px 14px;min-width:0}' +
      ".nh-navbtn::after{display:none}" +
      '.nh-navbtn{font-weight:700;opacity:.6;cursor:default;font-size:12px;text-transform:uppercase;letter-spacing:1px;padding:10px 10px 4px}' +
      '.nh-navitem{font-size:15px;padding:8px 11px}' +
      '}';
    document.head.appendChild(s);
  }

  function buildGroupedNav() {
    ensureNavCss();
    var wrap = el('div', 'nh-nav');
    NAV_GROUPS.forEach(function (g) {
      var grp = el('div', 'nh-navgroup');
      var btn = el('button', 'nh-navbtn');
      btn.type = 'button';
      btn.textContent = g.label;
      btn.setAttribute('data-i18n-chrome', g.key);
      btn.setAttribute('aria-haspopup', 'true');
      btn.setAttribute('aria-expanded', 'false');
      var menu = el('div', 'nh-navmenu');
      g.items.forEach(function (it) { menu.appendChild(makeAnchor(it, 'nh-navitem')); });
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var openNow = !grp.classList.contains('open');
        // close siblings
        Array.prototype.forEach.call(wrap.querySelectorAll('.nh-navgroup.open'), function (o) {
          if (o !== grp) { o.classList.remove('open'); var ob = o.querySelector('.nh-navbtn'); if (ob) ob.setAttribute('aria-expanded', 'false'); }
        });
        grp.classList.toggle('open', openNow);
        btn.setAttribute('aria-expanded', openNow ? 'true' : 'false');
      });
      grp.appendChild(btn); grp.appendChild(menu);
      wrap.appendChild(grp);
    });
    wrap.appendChild(makeAnchor(PRICING_ITEM, 'nh-navtop'));
    return wrap;
  }

  function fillLinks(container) {
    if (!container || container.getAttribute('data-nh-nav') === '1') return;
    var keep = container.querySelector('.hud-counter');   // preserve prefectures counter
    Array.prototype.slice.call(container.children).forEach(function (c) {
      if (c === keep) return;
      if (c.classList && (c.classList.contains('nh-chip') || c.classList.contains('nh-langbar') || c.classList.contains('nh-ham'))) return;
      if (c.tagName === 'A' || c.tagName === 'LI' || c.classList.contains('nh-nav')) container.removeChild(c);
    });
    container.appendChild(buildGroupedNav());
    container.setAttribute('data-nh-nav', '1');
  }

  // Close any open dropdown when clicking outside it.
  document.addEventListener('click', function (e) {
    if (e.target && e.target.closest && e.target.closest('.nh-navgroup')) return;
    document.querySelectorAll('.nh-navgroup.open').forEach(function (o) {
      o.classList.remove('open'); var b = o.querySelector('.nh-navbtn'); if (b) b.setAttribute('aria-expanded', 'false');
    });
  });

  function injectNav() {
    // LP (nav.nav) + RPG (nav > .nav-links)
    document.querySelectorAll('nav > .nav-links').forEach(function (div) { fillLinks(div); });
    // HUD pages
    document.querySelectorAll('header.hud').forEach(function (hud) {
      var links = hud.querySelector('.navlinks') || hud.querySelector('.hud-right');
      if (!links) {
        links = el('div', 'navlinks');
        var logo = hud.querySelector('.logo') || hud.querySelector('.hud-logo') || hud.firstElementChild;
        hud.insertBefore(links, logo ? logo.nextSibling : null);
      }
      fillLinks(links);
    });
  }

  // ---------- (B) CHIP ----------
  function chipHost() {
    var hud = document.querySelector('header.hud');
    if (hud) return hud.querySelector('.hud-right') || hud;
    var lp = document.querySelector('nav.nav');
    if (lp) return lp;
    return document.querySelector('nav');
  }

  function injectChip() {
    var host = chipHost();
    if (!host || host.querySelector('.nh-chip')) return;
    var chip = el('a', 'nh-chip');
    chip.href = BASE + 'index.html#pricing';
    chip.dataset.state = 'pending';
    chip.setAttribute('aria-live', 'polite');
    // instant paint from cache (avoids FOUC), then refresh
    try {
      var cached = JSON.parse(localStorage.getItem('nh_plan_cache') || 'null');
      if (cached && cached.label) setChip(chip, cached.label, cached.state);
    } catch (e) {}
    var cta = host.querySelector('.btn-nav');
    if (cta) host.insertBefore(chip, cta); else host.appendChild(chip);
    resolvePlan(chip);
  }

  function planLabel(st) {
    if (st.plan === 'pro') return { label: 'PRO', state: 'paid' };
    if (st.plan === 'lifetime') return { label: 'LIFETIME', state: 'paid' };
    if (st.trial_status === 'active') return { label: 'TRIAL · ' + st.days_remaining + 'd', state: 'trial' };
    if (st.trial_status === 'expired') return { label: 'TRIAL ENDED', state: 'free' };
    return { label: 'FREE', state: 'free' };
  }

  function setChip(chip, label, state) {
    if (label === 'login') {
      var loginTxt = (I18N && I18N[curLang()] && I18N[curLang()].chip_login) || 'Log in';
      chip.textContent = loginTxt; chip.dataset.state = 'anon'; chip.href = BASE + 'index.html';
      return;
    }
    chip.textContent = label; chip.dataset.state = state || 'free'; chip.href = BASE + 'index.html#pricing';
  }

  function loadSDK() {
    if (window.supabase && window.supabase.createClient) return Promise.resolve(window.supabase);
    return new Promise(function (resolve) {
      var s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.0/dist/umd/supabase.min.js';
      s.integrity = 'sha384-NNePyabYRaJyedI6EQAY7SV5Z8/0sQkuQ5WVfhKm0H+j0KSugkI2ZMNzw/QtzAWz';
      s.crossOrigin = 'anonymous'; s.referrerPolicy = 'no-referrer';
      s.onload = function () { resolve(window.supabase); };
      s.onerror = function () { resolve(null); };
      document.head.appendChild(s);
    });
  }

  function cachePlan(label, state) {
    try { localStorage.setItem('nh_plan_cache', JSON.stringify({ label: label, state: state })); } catch (e) {}
    window.NH_PLAN.__state = state;
  }

  // Shared plan accessor for feature gating (SRS review cap, PDF export, etc.).
  // Reads the last-known plan synchronously from cache; site-chrome refreshes it on load.
  window.NH_PLAN = window.NH_PLAN || (function () {
    var s = 'unknown';
    try { var c = JSON.parse(localStorage.getItem('nh_plan_cache') || 'null'); if (c && c.state) s = c.state; } catch (e) {}
    return {
      __state: s,
      state: function () { return this.__state; },
      isFullAccess: function () { return this.__state === 'paid' || this.__state === 'trial'; }
    };
  })();

  function resolvePlan(chip) {
    fetch(BASE + 'api/public-config').then(function (r) { return r.ok ? r.json() : null; }).then(function (cfg) {
      if (!cfg || !cfg.authEnabled) { setChip(chip, 'login'); return; }
      loadSDK().then(function (sdk) {
        if (!sdk) { setChip(chip, 'login'); return; }
        // Reuse the page's existing auth client (index.html exposes it) so we never
        // run two GoTrueClients on the same storageKey — that duplicate is what
        // triggered the "multiple instances" warning and the competing token refresh
        // that corrupted the session and hung login. Fall back to our own client on
        // pages without one (blog, quiz, etc.), with a passthrough lock to avoid the
        // navigator.locks deadlock there too.
        var client = window.__NH_AUTH_CLIENT || sdk.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
          auth: { lock: function (_n, _t, fn) { return fn(); } }
        });
        client.auth.getSession().then(function (res) {
          var sess = res && res.data && res.data.session;
          if (!sess) { setChip(chip, 'login'); return; }
          fetch(BASE + 'api/trial-status', { headers: { Authorization: 'Bearer ' + sess.access_token } })
            .then(function (r) { return r.ok ? r.json() : null; })
            .then(function (st) {
              if (!st) { setChip(chip, 'login'); return; }
              var pl = planLabel(st); setChip(chip, pl.label, pl.state); cachePlan(pl.label, pl.state);
            }).catch(function () { setChip(chip, 'login'); });
        }).catch(function () { setChip(chip, 'login'); });
      });
    }).catch(function () { setChip(chip, 'login'); });
  }

  // ---------- (C) chrome langbar (only where the page owns no langbar / setLang) ----------
  function applyChromeLang() {
    if (!I18N) return;
    var d = I18N[curLang()] || I18N.en;
    document.querySelectorAll('[data-i18n-chrome]').forEach(function (e) {
      var k = e.getAttribute('data-i18n-chrome');
      if (d[k] != null) e.textContent = d[k];
    });
    document.querySelectorAll('.nh-langbar button').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-l') === curLang());
    });
  }
  window.setChromeLang = function (l) {
    if (LANGS.indexOf(l) < 0) return;
    try { localStorage.setItem('nh_lang', l); } catch (e) {}
    document.documentElement.lang = l === 'zh' ? 'zh-TW' : l;
    applyChromeLang();
  };

  function injectLangbar() {
    if (document.querySelector('[id*="langbar"]')) return;   // page owns a langbar (#langbar, #wlangbar, …)
    // page owns its own language switcher under any known name
    if (typeof window.setLang === 'function' || typeof window.setPxLang === 'function' || typeof window.setWlLang === 'function') return;
    if (document.querySelector('.nh-langbar')) return;
    if (!I18N) return;
    var header = document.querySelector('header.hud') || document.querySelector('nav.nav') || document.querySelector('nav');
    if (!header || !header.parentNode) return;
    var bar = el('div', 'nh-langbar'); bar.id = 'nh-langbar';
    LANGS.forEach(function (l) {
      var b = el('button'); b.setAttribute('data-l', l);
      b.textContent = ({ en: 'EN', ja: '日本語', zh: '繁中', es: 'ES', th: 'ไทย', id: 'ID' })[l];
      b.addEventListener('click', function () { window.setChromeLang(l); });
      bar.appendChild(b);
    });
    header.parentNode.insertBefore(bar, header.nextSibling);
  }

  // ---------- (D) footer ----------
  function injectFooter() {
    if (document.querySelector('footer')) return;            // don't duplicate existing footers
    if (document.querySelector('[data-nh-footer]')) return;
    var f = el('footer'); f.setAttribute('data-nh-footer', '1');
    f.innerHTML =
      '<div class="nh-foot-links">' +
      '<a href="' + BASE + 'index.html" data-i18n-chrome="foot_home">Home</a>' +
      '<a href="' + BASE + 'quiz.html" data-i18n-chrome="foot_quiz">Quiz</a>' +
      '<a href="' + BASE + 'prefectures.html" data-i18n-chrome="foot_explore">Explore</a>' +
      '<a href="' + BASE + 'index.html#pricing" data-i18n-chrome="foot_pricing">Pricing</a>' +
      '<a href="' + BASE + 'about.html" data-i18n-chrome="foot_about">About</a>' +
      '</div>' +
      '<div class="nh-foot-tag"><span data-i18n-chrome="foot_tag">Master Japanese · Explore Japan</span> · © 2026 NihongoHub</div>';
    document.body.appendChild(f);
  }

  function run() {
    injectNav();
    injectChip();
    injectLangbar();
    injectFooter();
    applyChromeLang();
  }

  // Keep injected chrome text in sync when the user switches language via a page's own langbar.
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (t && t.closest && t.closest('.langbar button, .lang-btn, .nh-langbar button')) {
      setTimeout(applyChromeLang, 0);
    }
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
