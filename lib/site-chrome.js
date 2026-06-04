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

  // Canonical nav (single source of truth). key → data-i18n-chrome.
  // "Home" is intentionally omitted — every page's logo already links to index.html.
  var NAV = [
    { key: 'nav_leveltest', href: BASE + 'onboarding.html',                text: '🎯 Level test' },
    { key: 'nav_quiz',      href: BASE + 'quiz.html',                      text: '⚔️ Quiz' },
    { key: 'nav_explore',   href: BASE + 'prefectures.html',              text: '🗾 Explore' },
    { key: 'nav_journey',   href: BASE + 'rpg.html',                       text: '⚔ My Journey' },
    { key: 'nav_dashboard', href: BASE + 'dashboard.html',                text: '📊 Dashboard' },
    { key: 'nav_culture',   href: BASE + 'blog/index.html',               text: '📖 Culture' },
    { key: 'nav_reloc',     href: BASE + 'blog/moving-to-japan-guide.html', text: '🏡 Relocation' },
    { key: 'nav_pricing',   href: BASE + 'index.html#pricing',            text: '💴 Pricing' },
    { key: 'nav_shadowing', href: 'https://shadowing-app-theta.vercel.app?source=nihongohub', text: '🎙 Shadowing', ext: true }
  ];

  // ---------- (A) NAV ----------
  function makeAnchor(item, cls) {
    var a = el('a', cls || '');
    a.href = item.href;
    a.textContent = item.text;
    a.setAttribute('data-i18n-chrome', item.key);
    if (item.ext) { a.target = '_blank'; a.rel = 'noopener'; }
    return a;
  }

  function fillLinks(container, anchorClass) {
    if (!container || container.getAttribute('data-nh-nav') === '1') return;
    var keep = container.querySelector('.hud-counter');   // preserve prefectures counter
    Array.prototype.slice.call(container.children).forEach(function (c) {
      if (c === keep) return;
      if (c.classList && (c.classList.contains('nh-chip') || c.classList.contains('nh-langbar') || c.classList.contains('nh-ham'))) return;
      if (c.tagName === 'A' || c.tagName === 'LI') container.removeChild(c);
    });
    NAV.forEach(function (item) {
      var a = makeAnchor(item, anchorClass);
      if (container.tagName === 'UL') { var li = el('li'); li.appendChild(a); container.appendChild(li); }
      else container.appendChild(a);
    });
    container.setAttribute('data-nh-nav', '1');
  }

  function injectNav() {
    // Shape A — LP (index): keep its bespoke section nav (Roadmap/Learn/Travel…); chip-only there.
    // Shape C — RPG: nav > .nav-links (not LP)
    document.querySelectorAll('nav > .nav-links').forEach(function (div) {
      if (div.closest('nav.nav')) return;
      fillLinks(div, '');
    });
    // Shape B / B′ — HUD
    document.querySelectorAll('header.hud').forEach(function (hud) {
      var links = hud.querySelector('.navlinks') || hud.querySelector('.hud-right');
      if (!links) {
        links = el('div', 'navlinks');
        var logo = hud.querySelector('.logo') || hud.querySelector('.hud-logo') || hud.firstElementChild;
        hud.insertBefore(links, logo ? logo.nextSibling : null);
      }
      fillLinks(links, links.classList.contains('hud-right') ? 'hud-back' : 'back');
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
        // DEFAULT storageKey — matches index.html's email-auth client (the plan-bearing session).
        var client = sdk.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
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
