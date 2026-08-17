// blog-quiz.js — interactive phrase practice for .jpbox elements
(function(){
  var S = document.createElement('style');
  S.textContent = [
    '.jpb-btn{display:inline-block;margin-top:9px;font-family:"DotGothic16",sans-serif;font-size:13px;',
    'background:none;border:2px solid #ddcfb6;border-radius:6px;padding:7px 13px;cursor:pointer;',
    'color:#7a6a52;transition:all .15s;line-height:1}',
    '.jpb-btn:hover{border-color:#c8911f;color:#c8911f}',
    '.jpb-judge{display:none;gap:8px;margin-top:8px;align-items:center}',
    '.jpb-judge.show{display:flex}',
    '.jpb-yes{background:#2a7a4b;color:#fff;border:none;border-radius:6px;padding:7px 13px;',
    'font-family:"DotGothic16",sans-serif;font-size:13px;cursor:pointer}',
    '.jpb-no{background:#bf3325;color:#fff;border:none;border-radius:6px;padding:7px 13px;',
    'font-family:"DotGothic16",sans-serif;font-size:13px;cursor:pointer}',
    '.jpb-romaji-hidden{visibility:hidden;height:0;overflow:hidden;margin:0!important;padding:0!important}',
    '.jpb-score{font-family:"DotGothic16",sans-serif;font-size:12px;color:#7a6a52;margin-left:8px}',
    '.jpb-divider{border:none;border-top:1px solid #ddcfb6;margin:10px 0 6px}',
    '.jpb-more{display:inline-block;font-family:"DotGothic16",sans-serif;font-size:13px;',
    'color:#c8911f;text-decoration:none}',
    '.jpb-more:hover{text-decoration:underline}',
    '.jpb-flash-correct{animation:jpb-fc .4s ease}',
    '.jpb-flash-wrong{animation:jpb-fw .4s ease}',
    '@keyframes jpb-fc{0%{background:#d4edda}100%{background:transparent}}',
    '@keyframes jpb-fw{0%{background:#f8d7da}100%{background:transparent}}',
  ].join('');
  document.head.appendChild(S);

  var total = 0, correct = 0;

  // guess topic from page content for deep-link
  var topic = 'any';
  var text = (document.body.innerText || '').toLowerCase();
  if(/train|station|bus|taxi|airport|metro|platform/.test(text)) topic = 'transport';
  else if(/restaurant|menu|ramen|sushi|udon|cafe|takoyaki|okonomiyaki/.test(text)) topic = 'food';
  else if(/shop|store|souvenir|price|market|pottery/.test(text)) topic = 'shopping';
  else if(/temple|shrine|sightseeing|hotel|check.in|tourist|castle/.test(text)) topic = 'travel';
  else if(/season|nature|mountain|park|animal|flower|onsen|spring/.test(text)) topic = 'nature';

  var boxes = document.querySelectorAll('.jpbox');

  boxes.forEach(function(box, idx){
    var romaji = box.querySelector('.romaji');
    if(!romaji) return;
    var hidden = false;

    var btn = document.createElement('button');
    btn.className = 'jpb-btn';
    btn.textContent = '🙈 Test yourself';

    var judge = document.createElement('div');
    judge.className = 'jpb-judge';

    var yesBtn = document.createElement('button');
    yesBtn.className = 'jpb-yes';
    yesBtn.textContent = '✅ I knew it';

    var noBtn = document.createElement('button');
    noBtn.className = 'jpb-no';
    noBtn.textContent = '❌ I didn\'t';

    var scoreEl = document.createElement('span');
    scoreEl.className = 'jpb-score';

    judge.appendChild(yesBtn);
    judge.appendChild(noBtn);
    judge.appendChild(scoreEl);

    box.appendChild(btn);
    box.appendChild(judge);

    // only add the Practice link after the last jpbox
    if(idx === boxes.length - 1){
      var hr = document.createElement('hr');
      hr.className = 'jpb-divider';
      var more = document.createElement('a');
      more.className = 'jpb-more';
      more.href = '/quiz.html?topic=' + topic;
      more.textContent = '⚔️ Practice more Japanese →';
      box.appendChild(hr);
      box.appendChild(more);
    }

    btn.addEventListener('click', function(){
      if(!hidden){
        romaji.classList.add('jpb-romaji-hidden');
        btn.textContent = '👁 Reveal';
        judge.classList.remove('show');
        hidden = true;
      } else {
        romaji.classList.remove('jpb-romaji-hidden');
        btn.textContent = '🙈 Test yourself';
        judge.classList.add('show');
        hidden = false;
      }
    });

    function handleJudge(isCorrect){
      romaji.classList.remove('jpb-romaji-hidden');
      btn.textContent = '🙈 Test yourself';
      judge.classList.remove('show');
      hidden = false;
      total++;
      if(isCorrect) correct++;
      scoreEl.textContent = correct + '/' + total + ' correct';
      box.style.animation = 'none';
      void box.offsetWidth;
      box.style.animation = isCorrect ? 'jpb-fc .4s ease' : 'jpb-fw .4s ease';
    }

    yesBtn.addEventListener('click', function(){ handleJudge(true); });
    noBtn.addEventListener('click', function(){ handleJudge(false); });
  });
})();

// Affiliate link wiring — set IDs/URLs here ONCE (after approval); applies to every blog
// page and killer page automatically. Until set, links stay as honest non-affiliate fallbacks.
(function(){
  var AFF = {
    // (A) Deep-link networks — set your partner/affiliate ID; it is appended as a query param,
    //     preserving the destination page the link already points to.
    booking_aid:      '', // Booking.com Partner ID        → ?aid=XXX on booking.com links
    klook_aid:        '', // (unused: Involve Asia gives a redirect link, not an aid → see klook_url)
    agoda_cid:        '', // Agoda CID                     → ?cid=XXX on agoda.com links
    getyourguide_pid: 'O3QOXKH', // GetYourGuide partner_id (approved 2026-06-08) → ?partner_id=XXX on getyourguide.com links
    viator_pid:       'P00304316', // Viator pid (selector.viator.com, 2026-08-12) → ?pid=XXX (+mcid/medium rows below) on viator.com links
    amazon_tag:       'nihongohub-20', // Amazon Associates tracking tag → ?tag=XXX on amazon.com links (JLPT textbooks / whetstones / goshuincho pages). Approved 2026-07-22.
    // (B) Single-landing partners — set ONE full tracking URL; any link with the matching
    //     data-aff key is redirected to it (use for programs without deep-link params).
    gogonihon_url:    '', // Go! Go! Nihon (study-abroad lead) full affiliate URL
    italki_url:       'https://www.italki.com/affshare?ref=af32477782', // italki — approved 2026-06-08
    preply_url:       '', // Preply (Involve Asia) — 申請中/pending, no link yet
    klook_url:        '', // Klook (Involve Asia) — 申請中/pending; KKday below fills the slot until approved
    kkday_url:        'https://invl.me/clnitig', // KKday (Involve Asia) — Japan tours & tickets; substitutes in data-aff="klook" slots
    // (C) Legacy link-box injection on prefecture articles (adds a labelled link to .aff > div)
    jrpass_url:       '', // Full JR Pass affiliate URL
    airalo_url:       '', // Full Airalo eSIM affiliate URL (deprecated in favour of Yesim)
    yesim_url:        'https://yesim.tpx.lu/nIn4jqFi', // Yesim eSIM (Travelpayouts, 18% / 90-day) — approved 2026-06-08
    viator_url:       'https://www.viator.com/Japan/d16-ttd?pid=P00304316&mcid=42383&medium=link&campaign=nihongohub-blog', // Viator Japan top (generic "book experiences" link, 2026-08-12)
    ninjawifi_url:    'https://invl.app/clnitht', // NINJA WiFi (Involve Asia) — pocket WiFi rental
    byfood_url:       'https://invl.us/clnithx', // byFood (Involve Asia) — Japan food tours & experiences
    twelvego_url:     'https://www.awin1.com/cread.php?awinmid=114908&awinaffid=2928013&ued=https%3A%2F%2F12go.asia%2Fen%2Ftravel%2Fjapan', // 12Go Asia (Awin, advertiser 114908) — buses/trains/ferries across Asia, approved 2026-06-10
    buyee_url:        'https://buyee.jp/?fc=6a7c72e051a83', // Buyee friend-referral URL (2026-08-12) — reward = ¥1,000-off intl-shipping coupon per first order; reader gets signup coupon. Cash-affiliate channel (Indoleads?) unverified; swap in if approved.
    zenmarket_url:    '', // ZenMarket — application dead (no reply 30+ days, closed 2026-08-12); honest fallback = zenmarket.jp/en
    remambo_url:      'https://www.remambo.jp/?auc1269078', // Remambo affiliate (2026-08-13, office/partner) — up to 40% of service fee; referred user gets ¥1,000 off first intl parcel
    neokyo_url:       '', // Neokyo — no affiliate program found (2026-08-12); honest fallback = neokyo.com/en. Key exists so clicks are beacon-counted.
    whiterabbit_url:  '', // White Rabbit (Refersion, 8-20%) — set after owner registers; honest fallback = whiterabbitexpress.com
    wise_url:         '', // Wise (remittance, Partnerize) full tracking URL — set after approval; lifetime cookie
    safetywing_url:   'https://safetywing.com/?referenceID=26544346&utm_source=26544346&utm_medium=Ambassador', // SafetyWing Ambassador (referenceID 26544346) — approved 2026-06-12, 364-day cookie
  };

  function addParam(url, key, val) {
    return url + (url.indexOf('?') >= 0 ? '&' : '?') + key + '=' + encodeURIComponent(val);
  }
  function injectLink(container, href, label, key) {
    if (!container || container.querySelector('[href="' + href + '"]')) return;
    var a = document.createElement('a');
    a.href = href; a.target = '_blank'; a.rel = 'sponsored noopener'; a.textContent = label;
    if (key) a.setAttribute('data-aff', key);
    container.appendChild(a);
  }

  var DOMAIN_PARAM = [
    ['booking.com',      'aid',        AFF.booking_aid],
    ['klook.com',        'aid',        AFF.klook_aid],
    ['agoda.com',        'cid',        AFF.agoda_cid],
    ['getyourguide.com', 'partner_id', AFF.getyourguide_pid],
    ['viator.com',       'pid',        AFF.viator_pid],
    ['viator.com',       'mcid',       AFF.viator_pid ? '42383' : ''], // Viator channel constant for text links
    ['viator.com',       'medium',     AFF.viator_pid ? 'link' : ''],
    ['amazon.com',       'tag',        AFF.amazon_tag],
  ];
  var FULL = { gogonihon: AFF.gogonihon_url, italki: AFF.italki_url, yesim: AFF.yesim_url, ninjawifi: AFF.ninjawifi_url, preply: AFF.preply_url, klook: AFF.klook_url || AFF.kkday_url, byfood: AFF.byfood_url, buyee: AFF.buyee_url, zenmarket: AFF.zenmarket_url, remambo: AFF.remambo_url, neokyo: AFF.neokyo_url, whiterabbit: AFF.whiterabbit_url, twelvego: AFF.twelvego_url, wise: AFF.wise_url, safetywing: AFF.safetywing_url };

  function wireAffs() {
    // Rewrite every affiliate anchor on the page — including ones outside .aff boxes,
    // e.g. the comparison-table cells on the premium-experiences page. Empty IDs/URLs are
    // skipped, so unconfigured links keep their honest non-affiliate fallback.
    document.querySelectorAll('a[data-aff]').forEach(function(a) {
      var key = a.getAttribute('data-aff');
      if (key && FULL[key]) { a.setAttribute('href', FULL[key]); return; } // single-landing override
      var h = a.getAttribute('href') || '';
      for (var i = 0; i < DOMAIN_PARAM.length; i++) {
        var dom = DOMAIN_PARAM[i][0], param = DOMAIN_PARAM[i][1], val = DOMAIN_PARAM[i][2];
        if (val && h.indexOf(dom) >= 0 && h.indexOf(param + '=') < 0) {
          h = addParam(h, param, val); // no break: a domain may take several params (viator pid+mcid+medium)
          a.setAttribute('href', h);
        }
      }
    });
    document.querySelectorAll('.aff').forEach(function(div) {
      var linkBox = div.querySelector(':scope > div');
      // Only inject tourist extras (WiFi rental, food tours) into sightseeing-context boxes,
      // identified by a Klook "tours & tickets" link (the 47 prefecture travel articles).
      // This keeps them out of tutoring boxes AND the relocation guide's apartment box.
      var isTravelBox = !!div.querySelector('a[data-aff="klook"]');
      if (linkBox && isTravelBox) {
        if (AFF.jrpass_url) injectLink(linkBox, AFF.jrpass_url, 'JR Pass (save on rail travel) →', 'jrpass');
        if (AFF.yesim_url) injectLink(linkBox, AFF.yesim_url, 'Japan eSIM (Yesim) →', 'yesim');
        else if (AFF.airalo_url) injectLink(linkBox, AFF.airalo_url, 'Japan eSIM (Airalo) →', 'airalo');
        if (AFF.viator_url) injectLink(linkBox, AFF.viator_url, 'Book experiences (Viator) →', 'viator');
        if (AFF.ninjawifi_url) injectLink(linkBox, AFF.ninjawifi_url, 'Pocket WiFi rental (NINJA WiFi) →', 'ninjawifi');
        if (AFF.twelvego_url) injectLink(linkBox, AFF.twelvego_url, 'Buses, trains & ferries across Asia (12Go) →', 'twelvego');
      }
    });
  }

  // byFood belongs in the food context, not the hotel box: drop a byFood CTA right under
  // the "What to eat" section. Matched by the localized heading (en/zh/es/th/id) so it lands
  // correctly regardless of layout or language; prefecture pages only (they carry a Klook link).
  var EAT_HEADINGS = ['what to eat', '必吃美食', 'qué comer', 'ต้องกิน', 'yang wajib dicoba'];
  function injectFoodAff() {
    if (!AFF.byfood_url) return;
    if (!document.querySelector('a[data-aff="klook"]')) return; // prefecture travel pages only
    if (document.querySelector('a[data-aff="byfood"]')) return; // already placed
    var h2s = document.querySelectorAll('h2'), foodH2 = null;
    for (var i = 0; i < h2s.length; i++) {
      if (EAT_HEADINGS.indexOf(h2s[i].textContent.trim().toLowerCase()) >= 0) { foodH2 = h2s[i]; break; }
    }
    if (!foodH2) return;
    var p = foodH2.nextElementSibling;
    var anchor = (p && p.tagName === 'P') ? p : foodH2;
    var box = document.createElement('div');
    box.className = 'aff'; box.style.cssText = 'margin-top:8px';
    box.innerHTML = '<span class="pr">PR</span> ';
    var a = document.createElement('a');
    a.href = AFF.byfood_url; a.target = '_blank'; a.rel = 'sponsored noopener';
    a.setAttribute('data-aff', 'byfood');
    a.textContent = 'Join a local food tour or cooking class (byFood) →';
    box.appendChild(a);
    anchor.insertAdjacentElement('afterend', box);
  }

  // First-party affiliate-click beacon: attribute every affiliate click to its traffic
  // source (funnel A bottom KPI). Fires before navigation via window.NH_FUNNEL (defined
  // by the blog beacon below); links open in a new tab so the beacon always completes.
  // This also captures the not-yet-approved Go!Go!Nihon bridge (data-aff="gogonihon"
  // anchors fire aff_gogonihon even while the URL is still the honest fallback).
  // The ASP-side SubID layer (param name differs per network: aff_sub / clickref /
  // marker) is a separate, per-network-verified follow-up.
  if (!window.__NH_AFFCLICK__) {
    window.__NH_AFFCLICK__ = true;
    document.addEventListener('click', function (e) {
      var a = e.target && e.target.closest && e.target.closest('a[data-aff],a[rel~="sponsored"]');
      if (!a) return;
      // Same field shape as lib/site-chrome.js: aff_<partner>__<page-slug>, both parts
      // [a-z0-9_] with "_" runs collapsed so the first "__" is the delimiter.
      var key = (a.getAttribute('data-aff') || 'link').toLowerCase()
        .replace(/[^a-z0-9_]/g, '').replace(/__+/g, '_').slice(0, 24) || 'link';
      var page = (location.pathname.toLowerCase().split('/').pop() || 'index').replace(/\.html?$/, '')
        .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 48) || 'index';
      try { if (window.NH_FUNNEL && window.NH_FUNNEL.track) window.NH_FUNNEL.track('aff_' + key + '__' + page); } catch (e2) {}
    }, true);
  }

  function run() { wireAffs(); injectFoodAff(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();

// GetYourGuide partner analytics — attributes GYG bookings to partner O3QOXKH.
// Injected once on every blog/killer page (this script is shared site-wide).
(function(){
  if (document.querySelector('script[data-gyg-partner-id]')) return;
  var s = document.createElement('script');
  s.async = true; s.defer = true;
  s.src = 'https://widget.getyourguide.com/dist/pa.umd.production.min.js';
  s.setAttribute('data-gyg-partner-id', 'O3QOXKH');
  document.head.appendChild(s);
})();

// Travelpayouts Drive (marker 537499) — auto-monetises Booking.com (and other
// Travelpayouts-program) links on the page + click analytics. Injected once.
(function(){
  if (window.__nhTpLoaded || document.querySelector('script[src*="tp-em.com"]')) return;
  window.__nhTpLoaded = true;
  var s = document.createElement('script');
  s.async = 1;
  s.src = 'https://tp-em.com/NTM3NDk5.js?t=537499';
  document.head.appendChild(s);
})();

// Killer-page cross-links ("cushion pages") — append a planning block to each of the 47
// prefecture articles so readers flow from a free guide into a high-intent comparison page.
(function(){
  var EXCLUDE = {
    'index':1, 'japan-premium-experiences':1, 'luxury-ryokan-guide':1,
    'study-japanese-in-japan':1, 'moving-to-japan-guide':1, 'wildlife-watching-japan':1,
    'animal-colors-japan-science':1,
    'pokefuta-pokemon-manholes-japan':1, 'jlpt-textbooks-best-books':1,
    'buy-from-japan-proxy-services':1,
  };
  var m = (window.location.pathname.match(/\/([^\/]+)\.html/) || [])[1];
  // science explainer articles (slug contains "science") are not travel-planning pages,
  // so they skip the "plan your trip" cushion links automatically — no per-article edit needed.
  if (!m || EXCLUDE[m] || m.indexOf('science') >= 0) return;
  function run() {
    var article = document.querySelector('article.wrap') || document.querySelector('article');
    if (!article || document.getElementById('nh-killer-links')) return;
    var box = document.createElement('div');
    box.id = 'nh-killer-links';
    box.className = 'aff';
    box.style.cssText = 'background:#0d0a14;border-color:#e0a634';
    box.innerHTML =
      '<span class="pr">PLAN</span> <b style="font-family:inherit;color:#e0a634">Ready to plan the trip itself?</b>' +
      '<div style="margin-top:6px">' +
      '<a href="japan-premium-experiences.html" style="color:#fdf6e3">✨ Premium tours &amp; experiences →</a>' +
      '<a href="luxury-ryokan-guide.html" style="color:#fdf6e3">🏯 Luxury ryokan &amp; onsen stays →</a>' +
      '<a href="study-japanese-in-japan.html" style="color:#fdf6e3">🎓 Study Japanese in Japan →</a>' +
      '<a href="wildlife-watching-japan.html" style="color:#fdf6e3">🦉 Wildlife &amp; birding by region →</a>' +
      '<a href="pokefuta-pokemon-manholes-japan.html" style="color:#fdf6e3">🗾 Pokéfuta: Pokémon manhole hunt →</a>' +
      '</div>';
    article.appendChild(box);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();

// Pokéfuta block — on each of the 47 prefecture articles, add a small "Pokémon
// manhole hunt" discovery block. For prefectures with an official Pokémon Local
// Acts ambassador (data/pokefuta.js, verified), name it; otherwise point to the
// official map. Prefecture pages only — detected by their Explore-map link. This
// feeds the Pokéfuta hub (which monetises via travel + proxy-shopping affiliates).
(function(){
  var m = (window.location.pathname.match(/\/([^\/]+)\.html/) || [])[1];
  if (!m) return;
  // Prefecture articles carry an Explore-map link (?pref=slug); killer/hub pages don't.
  var exploreLink = document.querySelector('a[href*="prefectures.html?pref="]');
  if (!exploreLink) return;
  function build(data){
    if (!data || document.getElementById('nh-pokefuta')) return;
    var anchor = document.querySelector('.cta-box') ||
                 document.querySelector('article.wrap') || document.querySelector('article');
    if (!anchor) return;
    var amb = data.ambassadors[m];
    var box = document.createElement('div');
    box.id = 'nh-pokefuta';
    box.className = 'aff';
    box.style.cssText = 'background:#fef6ff;border-color:#d36ea8';
    var lead;
    if (amb) {
      lead = 'This prefecture’s official Pokémon Local Acts ambassador is <b>' + amb.pkmn +
             '</b> (' + amb.jp + ') — ' + amb.reason +
             '. Look for its one-of-a-kind Pokéfuta manhole art around town.';
    } else {
      lead = 'Many towns across Japan have one-of-a-kind <b>Pokéfuta</b> — official Pokémon manhole-cover art. Check the official map to see what’s installed here.';
    }
    box.innerHTML =
      '<span class="pr" style="background:#d36ea8">POKÉFUTA</span> ' +
      '<b style="font-family:inherit;color:#b3437f">Pokémon manhole hunt</b>' +
      '<p style="margin:6px 0 0">' + lead + '</p>' +
      '<div style="margin-top:6px">' +
      '<a href="pokefuta-pokemon-manholes-japan.html">🗾 The 47-prefecture Pokéfuta guide →</a> ' +
      '<a href="' + data.officialUrl + '" target="_blank" rel="noopener">📍 Official Pokéfuta map →</a>' +
      '</div>';
    anchor.insertAdjacentElement('afterend', box);
  }
  function run(){
    if (window.NH_POKEFUTA) { build(window.NH_POKEFUTA); return; }
    var s = document.createElement('script');
    s.src = '/data/pokefuta.js';
    s.onload = function(){ build(window.NH_POKEFUTA); };
    s.onerror = function(){};
    document.head.appendChild(s);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();

// Lead magnet — first-party email capture on every blog / killer page. The list is the
// one asset that stays ours (affiliate clicks and Substack subscribers aren't). Since
// 2026-08-17 the address is written straight into public.subscribers via PostgREST with
// the anon key (INSERT-only RLS; see supabase/migrations/2026-08-17-subscribers.sql) —
// no api/ function (Hobby cap 12/12) and no third-party list. Copy is aimed at the
// audience that actually arrives (prefecture / collectible / shopping readers), with a
// small side door for learners to the 7-day starter.
(function(){
  var CHECKLIST = '/sources/japan-starter-7-days.html';
  var CFG_URL = '/api/public-config';
  var SUBSTACK_FALLBACK = 'https://ikimonohakasefamily.substack.com/subscribe';
  function run(){
    var article = document.querySelector('article, main, .wrap') || document.body;
    if (!article || document.getElementById('nh-leadmagnet')) return;
    var st = document.createElement('style');
    st.textContent =
      '#nh-leadmagnet{background:#fff7e6;border:2px solid #e0a634;border-radius:10px;padding:18px 18px;margin:26px 0}' +
      '#nh-leadmagnet .lm-k{font-family:"Press Start 2P",monospace;font-size:9px;color:#c8911f;letter-spacing:.5px}' +
      '#nh-leadmagnet h3{font-family:"DotGothic16",sans-serif;font-size:19px;margin:8px 0 4px;color:#16100a}' +
      '#nh-leadmagnet p{font-size:14px;color:#7a6a52;margin:0 0 12px;line-height:1.55}' +
      '#nh-leadmagnet form{display:flex;gap:8px;flex-wrap:wrap}' +
      '#nh-leadmagnet input[type=email]{flex:1;min-width:180px;padding:11px 13px;border:2px solid #ddcfb6;border-radius:7px;font:16px "DM Sans",sans-serif;background:#fff}' + // ≥16px: iOS zooms on focus below that
      '#nh-leadmagnet .lm-hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}' +
      '#nh-leadmagnet button{font-family:"DotGothic16",sans-serif;font-size:15px;background:#bf3325;color:#fff;border:none;border-radius:7px;padding:11px 18px;cursor:pointer;white-space:nowrap}' +
      '#nh-leadmagnet button[disabled]{opacity:.6;cursor:default}' +
      '#nh-leadmagnet small{display:block;color:#7a6a52;font-size:12px;margin-top:8px}' +
      '#nh-leadmagnet .lm-msg{font-size:14px;margin:0;color:#16100a}' +
      '#nh-leadmagnet .lm-msg.err{color:#bf3325}';
    document.head.appendChild(st);
    var box = document.createElement('div');
    box.id = 'nh-leadmagnet';
    box.innerHTML =
      '<div class="lm-k">FREE · WEEKLY</div>' +
      '<h3>Japan, one prefecture a week</h3>' +
      '<p>Where to go, what to eat, what to bring home — plus new collectible hunts (manhole cards, goshuin, station stamps). One short email. Unsubscribe anytime.</p>' +
      '<form novalidate>' +
      '<input type="email" name="email" required autocomplete="email" placeholder="your@email.com" aria-label="Email address">' +
      '<input class="lm-hp" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '<button type="submit">Send me the prefecture letter →</button>' +
      '</form>' +
      '<small>By subscribing you agree to receive emails from NihongoHub. We never sell or share your address. Learning Japanese? <a href="' + CHECKLIST + '" rel="noopener">Start with the free 7-day starter →</a></small>';
    article.appendChild(box);

    var form = box.querySelector('form'), input = form.querySelector('input[type=email]'), btn = form.querySelector('button');
    function say(msg, isErr){
      var p = document.createElement('p'); p.className = 'lm-msg' + (isErr ? ' err' : ''); p.textContent = msg;
      form.parentNode.replaceChild(p, form);
    }
    form.addEventListener('submit', function(e){
      e.preventDefault();
      if (form.querySelector('.lm-hp').value) return; // bot filled the honeypot
      var email = (input.value || '').trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { input.focus(); input.setAttribute('aria-invalid', 'true'); return; }
      btn.disabled = true; btn.textContent = 'Sending…';
      var ref = null;
      try { ref = (window.NH_FUNNEL && window.NH_FUNNEL.src) || new URLSearchParams(location.search).get('utm_source') || null; } catch (e0) {}
      var row = {
        email: email,
        source: location.pathname.slice(0, 200),
        lang: (document.documentElement.getAttribute('lang') || 'en').slice(0, 16),
        ref: ref ? String(ref).slice(0, 64) : null
      };
      fetch(CFG_URL).then(function(r){ return r.json(); }).then(function(cfg){
        if (!cfg || !cfg.supabaseUrl || !cfg.supabaseAnonKey) throw new Error('nocfg');
        return fetch(cfg.supabaseUrl + '/rest/v1/subscribers', {
          method: 'POST',
          headers: { 'apikey': cfg.supabaseAnonKey, 'Authorization': 'Bearer ' + cfg.supabaseAnonKey, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
          body: JSON.stringify(row)
        });
      }).then(function(r){
        if (r.status === 201 || r.status === 409) say(r.status === 409 ? 'You’re already on the list — thank you.' : 'You’re in. The first prefecture letter arrives this week.');
        else throw new Error('http ' + r.status);
      }).catch(function(){
        // Until public.subscribers exists (owner runs the migration) or if PostgREST is down,
        // fall back to the legacy Substack sign-up so the reader is never stuck.
        btn.disabled = false; btn.textContent = 'Send me the prefecture letter →';
        var old = box.querySelector('.lm-msg.err'); if (old) old.remove();
        var p = document.createElement('p'); p.className = 'lm-msg err';
        p.innerHTML = 'Something went wrong. Please try again in a moment, or <a href="' + SUBSTACK_FALLBACK + '?email=' + encodeURIComponent(email) + '" target="_blank" rel="noopener">subscribe via Substack →</a>';
        form.parentNode.insertBefore(p, form.nextSibling);
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();

// Google Maps pin + Phrases buttons for spot list items
(function(){
  var m = window.location.pathname.match(/\/([^\/]+)\.html/);
  if(!m) return;
  var slug = m[1].toLowerCase();

  // A map pin is only honest on a page that is actually about one place. The 47
  // prefecture guides are; a topical article is only if it declares itself with
  // <meta name="nh-place" content="Minato, Tokyo">. Anywhere else the old code
  // sent readers to Maps searching "Read kana. Jlpt-n5-study-roadmap Japan".
  var PREFECTURES = {};
  ('Hokkaido Aomori Iwate Miyagi Akita Yamagata Fukushima Ibaraki Tochigi Gunma Saitama ' +
   'Chiba Tokyo Kanagawa Niigata Toyama Ishikawa Fukui Yamanashi Nagano Gifu Shizuoka ' +
   'Aichi Mie Shiga Kyoto Osaka Hyogo Nara Wakayama Tottori Shimane Okayama Hiroshima ' +
   'Yamaguchi Tokushima Kagawa Ehime Kochi Fukuoka Saga Nagasaki Kumamoto Oita Miyazaki ' +
   'Kagoshima Okinawa').split(' ').forEach(function(name){
     PREFECTURES[name.toLowerCase()] = name;
   });
  var metaPlace = document.querySelector('meta[name="nh-place"]');
  var city = PREFECTURES[slug] || (metaPlace && metaPlace.content.trim()) || '';
  if(!city) return;

  // Bold list leads do two different jobs across the site: on place pages they
  // name a spot ("Hikone Castle"), elsewhere they open an instruction ("Read
  // kana."). Only a name should get a pin or a phrase panel.
  function looksLikeSpot(s){
    if(s.length < 2 || s.length > 60) return false;
    if(/[.!?。！？]$/.test(s)) return false;
    return !/^(read|build|learn|train|use|review|check|confirm|keep|start|plan|bring|avoid|book|take|don't|do not|remember|note|be |get |go |ask |pay )/i.test(s);
  }

  var S = document.createElement('style');
  S.textContent =
    '.map-btn,.phrase-btn{display:inline-block;margin-left:6px;font-size:11px;' +
    'text-decoration:none;border:1.5px solid #c8911f;padding:0 6px;border-radius:3px;' +
    'vertical-align:middle;white-space:nowrap;line-height:1.65;cursor:pointer;background:none;' +
    'font-family:inherit;color:#c8911f}' +
    '.map-btn:hover,.phrase-btn:hover{background:#c8911f;color:#fdfaf3}' +
    /* phrase panel */
    '.phrase-panel{display:none;background:#fdfaf3;border:2px solid #c8911f;border-radius:7px;' +
    'padding:11px 13px;margin:8px 0 4px;font-size:14px;font-family:"DM Sans",sans-serif}' +
    '.phrase-panel.show{display:block}' +
    '.phrase-panel h4{font-family:"Press Start 2P",monospace;font-size:9px;color:#c8911f;' +
    'margin:0 0 8px 0;letter-spacing:.5px}' +
    '.phrase-panel ul{list-style:none;margin:0;padding:0}' +
    '.phrase-panel li{margin:6px 0;padding:6px 0;border-bottom:1px dashed #ddcfb6}' +
    '.phrase-panel li:last-child{border-bottom:none}' +
    '.phrase-panel .pp-jp{font-family:"Noto Sans JP",sans-serif;font-size:15px;color:#16100a;display:flex;align-items:center;gap:6px}' +
    '.phrase-panel .pp-ro{font-size:12px;color:#7a6a52;margin-top:2px}' +
    '.phrase-panel .pp-tr{font-size:13px;color:#16100a;margin-top:3px}' +
    '.pp-speak{background:none;border:1.5px solid #c8911f;color:#c8911f;border-radius:50%;' +
    'width:26px;height:26px;cursor:pointer;font-size:13px;display:inline-flex;align-items:center;' +
    'justify-content:center;padding:0;line-height:1;transition:all .15s}' +
    '.pp-speak:hover{background:#c8911f;color:#fdfaf3}' +
    '.pp-speak:active{transform:scale(0.92)}';
  document.head.appendChild(S);

  // detect blog UI language (en/zh/es/th/id/ja)
  var SUPPORTED = ['en','ja','zh','es','th','id'];
  var LANG = 'en';
  try {
    var stored = localStorage.getItem('nh_lang');
    if(SUPPORTED.indexOf(stored) >= 0) LANG = stored;
  } catch(e){}
  // A reader who arrived on /blog/es/… from search has no stored preference, and
  // used to be served English phrases on a Spanish page. The page's own language
  // is the stronger signal, so it wins wherever it is not the default.
  var pageLang = (document.documentElement.getAttribute('lang') || '').slice(0, 2).toLowerCase();
  if(pageLang && pageLang !== 'en' && SUPPORTED.indexOf(pageLang) >= 0) LANG = pageLang;

  function loadPhrasesData(cb){
    if(window.NH_SPOT_PHRASES){ cb(window.NH_SPOT_PHRASES); return; }
    var s = document.createElement('script');
    s.src = '/data/spot-phrases.js';
    s.onload = function(){ cb(window.NH_SPOT_PHRASES); };
    s.onerror = function(){ cb(null); };
    document.head.appendChild(s);
  }

  function findCategory(spotName, data){
    if(!data) return null;
    var nameLow = (spotName || '').toLowerCase();
    for(var i=0;i<data.categories.length;i++){
      var cat = data.categories[i];
      for(var j=0;j<cat.match.length;j++){
        if(nameLow.indexOf(cat.match[j].toLowerCase()) >= 0) return cat;
      }
    }
    return null;
  }

  function buildPanel(cat, data){
    if(!cat){
      // Fallback must work standing in front of a lake or a museum, so it is the
      // keyword-free 'sightseeing' pack — restaurant phrases used to show here.
      cat = data.categories.find(function(c){ return c.key==='sightseeing'; }) || data.categories[0];
    }
    var labelText = (cat.label && (cat.label[LANG] || cat.label.en)) || data.default_label[LANG] || data.default_label.en;
    var html = '<h4>' + (cat.icon || '💬') + ' ' + labelText + '</h4><ul>';
    cat.phrases.forEach(function(p, idx){
      // For Japanese UI users, hide the translation line (Japanese phrase doesn't need a Japanese gloss).
      // For other locales, fall back to English if the target translation is missing or matches the English copy.
      var showTr = (LANG !== 'ja');
      var tr = '';
      if(showTr){ tr = (p.trans && (p.trans[LANG] || p.trans.en)) || ''; }
      var encoded = encodeURIComponent(p.jp);
      var speakBtn = (window.speechSynthesis) ? ' <button type="button" class="pp-speak" data-jp="' + encoded + '" aria-label="Play audio">🔊</button>' : '';
      var trHtml = showTr ? '<div class="pp-tr">' + tr + '</div>' : '';
      html += '<li><div class="pp-jp">' + p.jp + speakBtn + '</div><div class="pp-ro">' + p.ro + '</div>' + trHtml + '</li>';
    });
    html += '</ul>';
    return html;
  }

  // Cache the chosen Japanese voice across calls; warm voices via onvoiceschanged (Chrome bug).
  var _jaVoice = null;
  function pickJaVoice(){
    if(_jaVoice) return _jaVoice;
    var voices = (window.speechSynthesis && window.speechSynthesis.getVoices()) || [];
    _jaVoice = voices.find(function(v){ return v.lang && v.lang.indexOf('ja') === 0; }) || null;
    return _jaVoice;
  }
  if(window.speechSynthesis && typeof window.speechSynthesis.addEventListener === 'function'){
    window.speechSynthesis.addEventListener('voiceschanged', function(){ _jaVoice = null; pickJaVoice(); });
    // Warm voices early
    setTimeout(pickJaVoice, 100);
  }

  function speakJa(text, btn){
    if(!('speechSynthesis' in window)){
      if(btn){ btn.textContent = '🔇'; btn.title = 'Audio not supported in this browser'; btn.disabled = true; }
      return;
    }
    try { window.speechSynthesis.cancel(); } catch(e){}
    var u = new SpeechSynthesisUtterance(text);
    u.lang = 'ja-JP';
    u.rate = 0.9;
    u.pitch = 1.0;
    var v = pickJaVoice();
    if(v) u.voice = v;
    // Detect silent failure on iOS Safari: no 'start' fires within 400ms after speak()
    var heard = false;
    u.onstart = function(){ heard = true; };
    u.onerror = function(){
      if(btn){ btn.textContent = '🔇'; btn.title = 'Audio failed (browser may not have Japanese TTS)'; }
    };
    window.speechSynthesis.speak(u);
    setTimeout(function(){
      if(!heard && btn){
        // iOS Safari often returns silently if user hasn't enabled speech yet
        var prev = btn.textContent;
        btn.textContent = '🔇';
        btn.title = 'Tap again — your browser may need a moment to load Japanese voices';
        setTimeout(function(){ btn.textContent = prev; btn.title = 'Play audio'; }, 1800);
      }
    }, 600);
  }
  // Event delegation for 🔊 buttons (panels are dynamically inserted)
  document.addEventListener('click', function(e){
    var b = e.target.closest && e.target.closest('.pp-speak');
    if(!b) return;
    e.preventDefault();
    speakJa(decodeURIComponent(b.dataset.jp || ''), b);
  });

  document.querySelectorAll('article ul li').forEach(function(li){
    var b = li.querySelector('b');
    if(!b) return;
    var name = b.textContent.trim();
    if(!looksLikeSpot(name)) return;
    var q = encodeURIComponent(name + ' ' + city + ' Japan');

    // Map button
    var a = document.createElement('a');
    a.href = 'https://maps.google.com/?q=' + q;
    a.target = '_blank';
    a.rel = 'noopener';
    a.className = 'map-btn';
    a.textContent = '📍 Map';
    a.title = 'Open in Google Maps';
    b.insertAdjacentElement('afterend', a);

    // Phrases button
    var pBtn = document.createElement('button');
    pBtn.className = 'phrase-btn';
    pBtn.type = 'button';
    pBtn.textContent = '💬 Phrases';
    pBtn.title = 'Show useful Japanese phrases here';
    a.insertAdjacentElement('afterend', pBtn);

    var panel = null;
    pBtn.addEventListener('click', function(e){
      e.preventDefault();
      if(panel && panel.classList.contains('show')){
        panel.classList.remove('show');
        return;
      }
      loadPhrasesData(function(data){
        if(!data){ return; }
        if(!panel){
          panel = document.createElement('div');
          panel.className = 'phrase-panel';
          li.appendChild(panel);
        }
        var cat = findCategory(name, data);
        panel.innerHTML = buildPanel(cat, data);
        panel.classList.add('show');
      });
    });
  });
})();

// Constellation MVP — auto-loaded once per blog page. Records token sightings
// from the article body + faintly highlights any tokens that have already met
// threshold in another surface, so cross-surface aha moments can fire here too.
(function(){
  function fire(){
    if (!window.NH_CONSTELLATION) return;
    var scope = document.querySelector('article, main, .wrap') || document.body;
    var plain = scope.textContent || '';
    window.NH_CONSTELLATION.TOKENS.forEach(function(t){ if (plain.indexOf(t) >= 0) window.NH_CONSTELLATION.see(t, 'blog'); });
    window.NH_CONSTELLATION.decorate(scope);
  }
  function loadLib(){
    if (window.NH_CONSTELLATION) { fire(); return; }
    var s = document.createElement('script');
    s.src = '/lib/constellation.js';
    s.onload = fire;
    document.head.appendChild(s);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadLib);
  else loadLib();
})();


// --- NihongoHub funnel beacon (counters only, no PII) ---
// Compact copy of lib/site-chrome.js section (E): blog pages don't load site-chrome.
// Guarded by window.__NH_FUNNEL__ so a page never double-counts.
(function () {
  if (window.__NH_FUNNEL__) return;
  window.__NH_FUNNEL__ = true;
  try {
    var aid = localStorage.getItem('nh_aid') || '';
    if (!aid) {
      for (var i = 0; i < 16; i++) aid += Math.floor(Math.random() * 16).toString(16);
      try { localStorage.setItem('nh_aid', aid); } catch (e) {}
    }
    var src = localStorage.getItem('nh_src') || '';
    if (!src) {
      var utm = '';
      try {
        var q = new URLSearchParams(location.search);
        utm = (q.get('utm_source') || q.get('ref') || '').toLowerCase();
      } catch (e) {}
      var refHost = '';
      try { refHost = document.referrer ? new URL(document.referrer).hostname : ''; } catch (e) {}
      var KNOWN = ['producthunt', 'reddit', 'google', 'bing', 'pinterest', 'instagram', 'threads', 'youtube', 'substack', 'medium'];
      var classify = function (s) {
        if (!s) return '';
        for (var j = 0; j < KNOWN.length; j++) if (s.indexOf(KNOWN[j]) >= 0) return KNOWN[j];
        if (s === 't.co' || s === 'x.com' || s.indexOf('twitter') >= 0) return 'x';
        if (s.indexOf('youtu.be') >= 0) return 'youtube';
        return '';
      };
      src = classify(utm) || classify(refHost) ||
        (refHost && refHost.indexOf('nihongo-hub') < 0 && refHost.indexOf('localhost') < 0 ? 'other' : 'direct');
      try { localStorage.setItem('nh_src', src); } catch (e) {}
    }
    var send = function (ev, from) {
      try { fetch('/api/count?ev=' + ev + '&src=' + src + '&aid=' + aid + (from ? '&from=' + from : ''), { keepalive: true }).catch(function () {}); } catch (e) {}
    };
    window.NH_FUNNEL = { track: send, src: src };
    // In-site journey: remember this tab's previous page class so the server
    // can count from>to transitions (nh:fnav). sessionStorage = per-tab, no PII.
    var prev = '';
    try {
      prev = sessionStorage.getItem('nh_pv_prev') || '';
      sessionStorage.setItem('nh_pv_prev', 'blog');
    } catch (e) {}
    send('pv_blog', prev);
  } catch (e) {}
})();
