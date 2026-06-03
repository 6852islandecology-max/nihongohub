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
