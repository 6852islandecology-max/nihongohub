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
