// blog-quiz.js — adds interactive phrase practice to .jpbox elements
(function(){
  var S = document.createElement('style');
  S.textContent = [
    '.jpb-btn{display:inline-block;margin-top:9px;font-family:"DotGothic16",sans-serif;font-size:13px;',
    'background:none;border:2px solid #ddcfb6;border-radius:6px;padding:7px 13px;cursor:pointer;',
    'color:#7a6a52;transition:all .15s;line-height:1}',
    '.jpb-btn:hover{border-color:#c8911f;color:#c8911f}',
    '.jpb-romaji-hidden{visibility:hidden;height:0;overflow:hidden;margin:0!important}',
    '.jpb-divider{border:none;border-top:1px solid #ddcfb6;margin:10px 0 6px}',
    '.jpb-more{display:inline-block;font-family:"DotGothic16",sans-serif;font-size:13px;',
    'color:#c8911f;text-decoration:none}',
    '.jpb-more:hover{text-decoration:underline}',
  ].join('');
  document.head.appendChild(S);

  document.querySelectorAll('.jpbox').forEach(function(box){
    var romaji = box.querySelector('.romaji');
    if(!romaji) return;
    var visible = true;

    var btn = document.createElement('button');
    btn.className = 'jpb-btn';
    btn.textContent = '🙈 Test yourself — hide translation';

    var hr = document.createElement('hr');
    hr.className = 'jpb-divider';

    // guess topic from page content for deep-link
    var topic = 'any';
    var text = document.body.innerText || '';
    if(/train|station|bus|taxi|airport|metro|platform/i.test(text)) topic='transport';
    else if(/restaurant|menu|eat|food|ramen|sushi|udon|cafe/i.test(text)) topic='food';
    else if(/shop|store|buy|souvenir|price|market/i.test(text)) topic='shopping';
    else if(/temple|shrine|sightseeing|hotel|check.in|tourist/i.test(text)) topic='travel';
    else if(/season|nature|mountain|park|animal|flower|weather/i.test(text)) topic='nature';

    var more = document.createElement('a');
    more.className = 'jpb-more';
    more.href = '../quiz.html?topic='+topic;
    more.textContent = '⚔️ Practice more Japanese →';

    box.appendChild(btn);
    box.appendChild(hr);
    box.appendChild(more);

    btn.addEventListener('click', function(){
      visible = !visible;
      if(visible){
        romaji.classList.remove('jpb-romaji-hidden');
        btn.textContent = '🙈 Test yourself — hide translation';
      } else {
        romaji.classList.add('jpb-romaji-hidden');
        btn.textContent = '👁 Reveal translation';
      }
    });
  });
})();
