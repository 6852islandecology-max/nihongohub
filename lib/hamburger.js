// [browser] HTML から <script src> で読み込まれる IIFE。api/ からは import されない。
/* Auto-inject hamburger toggle for .hud and nav.nav layouts on small screens.
   Pure CSS handles visibility (styles/responsive.css); this script just adds the toggle button. */
(function(){
  function makeBtn(controlsId){
    const b = document.createElement('button');
    b.className = 'nh-ham';
    b.type = 'button';
    b.setAttribute('aria-label', 'Toggle menu');
    b.setAttribute('aria-expanded', 'false');
    if(controlsId) b.setAttribute('aria-controls', controlsId);
    b.innerHTML = '☰';
    return b;
  }
  function bind(btn, links){
    function toggle(open){
      const willOpen = (open === undefined) ? !links.classList.contains('nh-open') : !!open;
      links.classList.toggle('nh-open', willOpen);
      btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      btn.innerHTML = willOpen ? '✕' : '☰';
    }
    btn.addEventListener('click', () => toggle());
    document.addEventListener('keydown', (e) => {
      if(e.key === 'Escape' && links.classList.contains('nh-open')) toggle(false);
    });
  }
  function wire(){
    // HUD-style (quiz, dashboard, onboarding, rank, prefectures, rpg, wildlife)
    document.querySelectorAll('header.hud').forEach(hud => {
      if(hud.querySelector('.nh-ham')) return;
      const links = hud.querySelector('.navlinks');
      if(!links) return;
      if(!links.id) links.id = 'nh-hud-navlinks';
      const btn = makeBtn(links.id);
      hud.appendChild(btn);
      bind(btn, links);
    });
    // LP nav (index.html)
    document.querySelectorAll('nav.nav').forEach(nav => {
      if(nav.querySelector('.nh-ham')) return;
      const links = nav.querySelector('.nav-links');
      if(!links) return;
      if(!links.id) links.id = 'nh-lp-navlinks';
      const btn = makeBtn(links.id);
      btn.style.color = '#fdfaf3';
      const cta = nav.querySelector('.btn-nav');
      if(cta) nav.insertBefore(btn, cta); else nav.appendChild(btn);
      bind(btn, links);
    });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();
})();
