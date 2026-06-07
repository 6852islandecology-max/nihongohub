/* Daily Mission planner — picks today's quiz + article + review from local state.
   Pure, localStorage-only, zero network. Exposed as window.NH_MISSION.
   The dashboard renders these tasks and (separately) decorates them with an
   AI coach line from /api/daily-coach. If that call fails, this module's
   deterministic `coachFallback` is shown instead. */
(function(){
  // Valid quiz topics (must match quiz.html TOPICS / anthropic VALID_TOPICS)
  const TOPIC_ROTATION = ['greetings','food','transport','travel','shopping','numbers','nature'];

  // Curated, varied prefecture guides for the "read one article" task.
  // Rotated deterministically by day-of-year so it changes daily but is stable within a day.
  const PREF_ARTICLES = [
    { slug:'hokkaido', kanji:'北海道', name:'Hokkaidō',  hook:'powder snow, onsen and seafood' },
    { slug:'tokyo',    kanji:'東京',   name:'Tokyo',      hook:'neon, temples and the best trains in the world' },
    { slug:'kyoto',    kanji:'京都',   name:'Kyoto',      hook:'temples, tea and bamboo — the cultural heart' },
    { slug:'osaka',    kanji:'大阪',   name:'Osaka',      hook:'the friendly food capital — eat until you drop' },
    { slug:'okinawa',  kanji:'沖縄',   name:'Okinawa',    hook:'subtropical islands and Ryukyu culture' },
    { slug:'hiroshima',kanji:'広島',   name:'Hiroshima',  hook:'a moving peace memorial and the floating torii' },
    { slug:'nara',     kanji:'奈良',   name:'Nara',       hook:'Japan’s first capital and free-roaming deer' },
    { slug:'kanagawa', kanji:'神奈川', name:'Kanagawa',   hook:'the Great Buddha of Kamakura and Hakone hot springs' },
    { slug:'nagano',   kanji:'長野',   name:'Nagano',     hook:'alpine peaks and snow monkeys in hot springs' },
    { slug:'fukuoka',  kanji:'福岡',   name:'Fukuoka',    hook:'tonkotsu ramen and lively street-food stalls' },
    { slug:'aomori',   kanji:'青森',   name:'Aomori',     hook:'apple country and the explosive Nebuta festival' },
    { slug:'ishikawa', kanji:'石川',   name:'Ishikawa',   hook:'Kanazawa’s gardens, gold leaf and the Noto coast' },
    { slug:'kagoshima',kanji:'鹿児島', name:'Kagoshima',  hook:'an active volcano and ancient-forest islands' },
    { slug:'yamanashi',kanji:'山梨',   name:'Yamanashi',  hook:'Mount Fuji’s lakes and Japan’s wine country' },
  ];
  // A practical guide surfaced every ~7th day for variety.
  const GUIDE_ARTICLE = { slug:'moving-to-japan-guide', kanji:'日本移住', name:'Moving to Japan', hook:'visas, housing and the paperwork, explained' };

  function todayKey(){ const d = new Date(); return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(); }
  function dayOfYear(){
    const d = new Date();
    const start = new Date(d.getFullYear(), 0, 0);
    return Math.floor((d - start) / 86400000);
  }
  function questionsAnsweredToday(){
    let log = [];
    try { log = JSON.parse(localStorage.getItem('nh_quiz_log') || '[]') || []; } catch(e){}
    const d = new Date(); d.setHours(0,0,0,0);
    const start = d.getTime();
    return log.filter(e => e && e.t >= start).length;
  }
  function topWeakWord(){
    let list = [];
    try { list = JSON.parse(localStorage.getItem('nh_mistakes') || '[]') || []; } catch(e){}
    if(!list.length) return null;
    const top = list.slice().sort((a,b)=>{
      const ra=(a.srs&&a.srs.repetitions)||0, rb=(b.srs&&b.srs.repetitions)||0;
      if(ra!==rb) return ra-rb;
      return (b.last_seen||0)-(a.last_seen||0);
    })[0];
    const strip = (s)=>{ const el=document.createElement('div'); el.innerHTML=String(s||''); return (el.textContent||'').slice(0,40); };
    return { level: top.level||'N5', q: strip(top.question), a: strip(top.answer) };
  }

  // Daily completion state, reset each calendar day. { date, clicked:{quiz,review,read} }
  function loadState(){
    let st = null;
    try { st = JSON.parse(localStorage.getItem('nh_daily_mission') || 'null'); } catch(e){}
    if(!st || st.date !== todayKey()){ st = { date: todayKey(), clicked: {} }; }
    if(!st.clicked) st.clicked = {};
    return st;
  }
  function markDone(taskId){
    const st = loadState();
    st.clicked[taskId] = true;
    try { localStorage.setItem('nh_daily_mission', JSON.stringify(st)); } catch(e){}
  }

  // Build today's mission. `lang` only affects the deterministic coach fallback text.
  function build(){
    const R = window.NH_READINESS;
    const s = R && R.summary ? R.summary() : { estimated:'N5', scores:{}, targetLevel:'N3', dueToday:0, mistakeCount:0 };
    const st = loadState();

    const curLevel = s.estimated === 'PRE' ? 'N5' : (s.estimated || 'N5');
    const curScore = (s.scores && s.scores[curLevel]) || 0;
    // If the learner already passes their current level, point the quiz at the next target.
    const quizLevel = (curScore >= 0.75 && s.targetLevel) ? s.targetLevel : curLevel;
    const topic = TOPIC_ROTATION[dayOfYear() % TOPIC_ROTATION.length];

    // Article: practical guide on every 7th day, otherwise a rotating prefecture guide.
    const useGuide = (dayOfYear() % 7 === 3);
    const art = useGuide ? GUIDE_ARTICLE : PREF_ARTICLES[dayOfYear() % PREF_ARTICLES.length];

    const answeredToday = questionsAnsweredToday();
    const weak = topWeakWord();

    const tasks = [];
    // 1) Quiz — always present
    tasks.push({
      id: 'quiz',
      icon: '⚔️',
      kind: 'quiz',
      level: quizLevel,
      topic,
      href: 'quiz.html?level=' + quizLevel + '&topic=' + topic,
      done: !!st.clicked.quiz || answeredToday >= 10,
    });
    // 2) Review — only when something is actually due
    if((s.dueToday || 0) > 0){
      tasks.push({
        id: 'review',
        icon: '📚',
        kind: 'review',
        count: s.dueToday,
        href: 'quiz.html?mode=review',
        done: !!st.clicked.review,
      });
    }
    // 3) Read one article — always present
    tasks.push({
      id: 'read',
      icon: '📖',
      kind: 'read',
      article: art,
      href: 'blog/' + art.slug + '.html',
      done: !!st.clicked.read,
    });

    return {
      date: st.date,
      level: curLevel,
      quizLevel,
      topic,
      streak: (R && R.monthlySummary) ? R.monthlySummary().longestStreak : 0,
      dueToday: s.dueToday || 0,
      weak,
      answeredToday,
      tasks,
      allDone: tasks.every(t => t.done),
    };
  }

  // Signals sent to /api/daily-coach so the AI line is personalized but carries no PII.
  function coachSignals(m){
    return {
      level: m.level,
      quizLevel: m.quizLevel,
      topic: m.topic,
      streak: m.streak,
      due: m.dueToday,
      weak: m.weak ? (m.weak.q + ' → ' + m.weak.a) : '',
      answeredToday: m.answeredToday,
      article: m.tasks.find(t=>t.kind==='read')?.article?.name || '',
    };
  }

  window.NH_MISSION = { build, markDone, coachSignals, todayKey };
})();
