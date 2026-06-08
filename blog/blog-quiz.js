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
      more.href = '../quiz.html?topic=' + topic;
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
    getyourguide_pid: '', // GetYourGuide partner_id       → ?partner_id=XXX on getyourguide.com links
    viator_pid:       '', // Viator pid (Travelpayouts)    → ?pid=XXX on viator.com links
    // (B) Single-landing partners — set ONE full tracking URL; any link with the matching
    //     data-aff key is redirected to it (use for programs without deep-link params).
    gogonihon_url:    '', // Go! Go! Nihon (study-abroad lead) full affiliate URL
    italki_url:       '', // italki full affiliate URL
    preply_url:       'https://invl.app/clnitht', // Preply (Involve Asia, CPS 56%) — spare link: https://invl.us/clnithx
    klook_url:        'https://invl.me/clnitig', // Klook (Involve Asia deeplink) — overrides every data-aff="klook" link
    // (C) Legacy link-box injection on prefecture articles (adds a labelled link to .aff > div)
    jrpass_url:       '', // Full JR Pass affiliate URL
    airalo_url:       '', // Full Airalo eSIM affiliate URL
    viator_url:       '', // Full Viator affiliate URL (generic "book experiences" link)
  };

  function addParam(url, key, val) {
    return url + (url.indexOf('?') >= 0 ? '&' : '?') + key + '=' + encodeURIComponent(val);
  }
  function injectLink(container, href, label) {
    if (!container || container.querySelector('[href="' + href + '"]')) return;
    var a = document.createElement('a');
    a.href = href; a.target = '_blank'; a.rel = 'sponsored noopener'; a.textContent = label;
    container.appendChild(a);
  }

  var DOMAIN_PARAM = [
    ['booking.com',      'aid',        AFF.booking_aid],
    ['klook.com',        'aid',        AFF.klook_aid],
    ['agoda.com',        'cid',        AFF.agoda_cid],
    ['getyourguide.com', 'partner_id', AFF.getyourguide_pid],
    ['viator.com',       'pid',        AFF.viator_pid],
  ];
  var FULL = { gogonihon: AFF.gogonihon_url, italki: AFF.italki_url, preply: AFF.preply_url, klook: AFF.klook_url };

  function wireAffs() {
    document.querySelectorAll('.aff').forEach(function(div) {
      div.querySelectorAll('a[href]').forEach(function(a) {
        var key = a.getAttribute('data-aff');
        if (key && FULL[key]) { a.setAttribute('href', FULL[key]); return; } // single-landing override
        var h = a.getAttribute('href');
        for (var i = 0; i < DOMAIN_PARAM.length; i++) {
          var dom = DOMAIN_PARAM[i][0], param = DOMAIN_PARAM[i][1], val = DOMAIN_PARAM[i][2];
          if (val && h.indexOf(dom) >= 0 && h.indexOf(param + '=') < 0) {
            a.setAttribute('href', addParam(h, param, val)); break;
          }
        }
      });
      var linkBox = div.querySelector(':scope > div');
      if (linkBox) {
        if (AFF.jrpass_url) injectLink(linkBox, AFF.jrpass_url, 'JR Pass (save on rail travel) →');
        if (AFF.airalo_url) injectLink(linkBox, AFF.airalo_url, 'Japan eSIM (Airalo) →');
        if (AFF.viator_url) injectLink(linkBox, AFF.viator_url, 'Book experiences (Viator) →');
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wireAffs);
  else wireAffs();
})();

// Killer-page cross-links ("cushion pages") — append a planning block to each of the 47
// prefecture articles so readers flow from a free guide into a high-intent comparison page.
(function(){
  var EXCLUDE = {
    'index':1, 'japan-premium-experiences':1, 'luxury-ryokan-guide':1,
    'study-japanese-in-japan':1, 'moving-to-japan-guide':1,
  };
  var m = (window.location.pathname.match(/\/([^\/]+)\.html/) || [])[1];
  if (!m || EXCLUDE[m]) return;
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
      '</div>';
    article.appendChild(box);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();

// Lead magnet — email capture on every blog / killer page. Building an owned email
// list is the one asset we keep (affiliate clicks aren't ours); it also pre-qualifies
// the high-intent "move to / study in Japan" segment we monetise via study-abroad
// affiliates. Posts to the existing Substack so there's no new backend.
(function(){
  var SUBSTACK = 'https://ikimonohakasefamily.substack.com/subscribe';
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
      '#nh-leadmagnet input{flex:1;min-width:180px;padding:11px 13px;border:2px solid #ddcfb6;border-radius:7px;font:15px "DM Sans",sans-serif;background:#fff}' +
      '#nh-leadmagnet button{font-family:"DotGothic16",sans-serif;font-size:15px;background:#bf3325;color:#fff;border:none;border-radius:7px;padding:11px 18px;cursor:pointer;white-space:nowrap}' +
      '#nh-leadmagnet small{display:block;color:#7a6a52;font-size:12px;margin-top:8px}';
    document.head.appendChild(st);
    var box = document.createElement('div');
    box.id = 'nh-leadmagnet';
    box.innerHTML =
      '<div class="lm-k">FREE DOWNLOAD</div>' +
      '<h3>Living &amp; studying in Japan — the 1-page checklist</h3>' +
      '<p>Visas, schools, housing, bank, SIM and the first-week to-dos, on one page. Join the weekly note from a family walking all 47 prefectures and we\'ll send it.</p>' +
      '<form action="' + SUBSTACK + '" method="get" target="_blank" rel="noopener">' +
      '<input type="email" name="email" required placeholder="your@email.com" aria-label="Email address">' +
      '<button type="submit">Send me the checklist →</button>' +
      '</form>' +
      '<small>Free. One short email a week. Unsubscribe anytime.</small>';
    article.appendChild(box);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();

// Google Maps pin + Phrases buttons for spot list items
(function(){
  var m = window.location.pathname.match(/\/([^\/]+)\.html/);
  if(!m) return;
  var city = m[1].charAt(0).toUpperCase() + m[1].slice(1);

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
  var LANG = 'en';
  try {
    var stored = localStorage.getItem('nh_lang');
    if(['en','ja','zh','es','th','id'].indexOf(stored) >= 0) LANG = stored;
  } catch(e){}

  function loadPhrasesData(cb){
    if(window.NH_SPOT_PHRASES){ cb(window.NH_SPOT_PHRASES); return; }
    var s = document.createElement('script');
    s.src = '../data/spot-phrases.js';
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
      // fallback: show restaurant phrases (most generally useful)
      cat = data.categories.find(function(c){ return c.key==='restaurant'; }) || data.categories[0];
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
    s.src = '../lib/constellation.js';
    s.onload = fire;
    document.head.appendChild(s);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadLib);
  else loadLib();
})();
