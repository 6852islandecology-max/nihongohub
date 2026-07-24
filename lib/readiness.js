// [browser] HTML から <script src> で読み込まれる IIFE。api/ からは import されない。
/* Readiness scoring + weeks-to-pass estimator. Pure functions, localStorage-only.
   Exposed as window.NH_READINESS. */
(function(){
  const LEVELS = ['N5','N4','N3','N2','N1'];
  const PASS_THRESHOLD = 0.75;          // score >= 0.75 → "Ready"
  const TARGET_DAILY_QUESTIONS = 20;    // recommended pace
  const DEFAULT_WEEKLY_GROWTH = 0.05;   // baseline used until we have ≥10 days of data
  const MIN_WEEKLY_GROWTH = 0.005;      // floor so ETA never shows "∞ weeks"
  const MAX_WEEKLY_GROWTH = 0.25;       // ceiling to avoid wildly optimistic ETAs

  function getDiagnostic(){
    try { return JSON.parse(localStorage.getItem('nh_diagnostic_scores') || '{}'); } catch(e){ return {}; }
  }
  function getEstimatedLevel(){
    try { return localStorage.getItem('nh_estimated_level') || 'N5'; } catch(e){ return 'N5'; }
  }
  function getRecentQuizLog(){
    try { return JSON.parse(localStorage.getItem('nh_quiz_log') || '[]'); } catch(e){ return []; }
  }
  function pushQuizLog(entry){
    try {
      const log = getRecentQuizLog();
      log.push({ t: Date.now(), level: entry.level, correct: !!entry.correct });
      const trimmed = log.slice(-200);
      localStorage.setItem('nh_quiz_log', JSON.stringify(trimmed));
    } catch(e){}
  }
  function getMistakes(){
    try { return JSON.parse(localStorage.getItem('nh_mistakes') || '[]'); } catch(e){ return []; }
  }

  // Recent accuracy per level over last 50 quizzes per level
  function recentAccuracyByLevel(){
    const log = getRecentQuizLog();
    const out = {};
    LEVELS.forEach(L=>{
      const arr = log.filter(e => e.level === L).slice(-50);
      out[L] = arr.length ? arr.reduce((s,e)=>s+(e.correct?1:0),0)/arr.length : null;
    });
    return out;
  }

  // SRS retention: mistakes whose srs.repetitions >= 2 considered "retained"
  function srsRetentionByLevel(){
    const mistakes = getMistakes();
    const out = {};
    LEVELS.forEach(L=>{
      const subset = mistakes.filter(m => m.level === L);
      if(!subset.length){ out[L] = null; return; }
      const retained = subset.filter(m => m.srs && (m.srs.repetitions||0) >= 2).length;
      out[L] = retained / subset.length;
    });
    return out;
  }

  // 0..1 score per level, weighted average of diagnostic + recent + retention
  function scoreByLevel(){
    const diag = getDiagnostic();
    const recent = recentAccuracyByLevel();
    const ret = srsRetentionByLevel();
    const out = {};
    LEVELS.forEach(L=>{
      const d = (typeof diag[L] === 'number') ? diag[L] : 0;
      const r = (typeof recent[L] === 'number') ? recent[L] : null;
      const s = (typeof ret[L] === 'number') ? ret[L] : null;
      let weight = 0.4, sum = d * 0.4;
      if(r != null){ sum += r * 0.4; weight += 0.4; }
      if(s != null){ sum += s * 0.2; weight += 0.2; }
      out[L] = weight > 0 ? sum / weight : 0;
    });
    return out;
  }

  // Compute personal weekly growth from quiz_log: improvement in accuracy per active week.
  // Returns the WEEKLY_GROWTH value (clamped). Falls back to DEFAULT_WEEKLY_GROWTH if not enough data.
  function personalWeeklyGrowth(){
    const log = getRecentQuizLog();
    if (log.length < 30) return DEFAULT_WEEKLY_GROWTH;
    // Bucket the last 60 days by 7-day windows; compute accuracy of each.
    const now = Date.now();
    const buckets = [];
    for (let w = 0; w < 8; w++) {
      const start = now - (w + 1) * 7 * 24 * 60 * 60 * 1000;
      const end = now - w * 7 * 24 * 60 * 60 * 1000;
      const arr = log.filter(e => e.t >= start && e.t < end);
      if (arr.length >= 5) {
        const acc = arr.reduce((s,e)=>s+(e.correct?1:0),0) / arr.length;
        buckets.push({ weekAgo: w, acc, n: arr.length });
      }
    }
    if (buckets.length < 2) return DEFAULT_WEEKLY_GROWTH;
    // Linear regression slope (acc vs -weekAgo so newer weeks are higher x).
    const xs = buckets.map(b => -b.weekAgo);
    const ys = buckets.map(b => b.acc);
    const xMean = xs.reduce((s,v)=>s+v,0) / xs.length;
    const yMean = ys.reduce((s,v)=>s+v,0) / ys.length;
    let num = 0, den = 0;
    for (let i = 0; i < xs.length; i++) {
      num += (xs[i] - xMean) * (ys[i] - yMean);
      den += (xs[i] - xMean) ** 2;
    }
    const slope = den > 0 ? num / den : DEFAULT_WEEKLY_GROWTH;
    return Math.max(MIN_WEEKLY_GROWTH, Math.min(MAX_WEEKLY_GROWTH, slope));
  }

  // weeks-to-pass for a given level: ceil((threshold - score) / weekly_growth)
  function weeksToPass(score, growthOverride){
    if(score >= PASS_THRESHOLD) return 0;
    const gap = PASS_THRESHOLD - score;
    const growth = typeof growthOverride === 'number' ? growthOverride : personalWeeklyGrowth();
    return Math.max(1, Math.ceil(gap / growth));
  }

  // 7-day daily counts for sparkline
  function last7DayCounts(){
    return lastNDayCounts(7);
  }
  function lastNDayCounts(n){
    const log = getRecentQuizLog();
    const now = new Date();
    const out = [];
    for(let i=n-1;i>=0;i--){
      const d = new Date(now);
      d.setHours(0,0,0,0); d.setDate(d.getDate()-i);
      const start = d.getTime();
      const end = start + 24*60*60*1000;
      out.push(log.filter(e => e.t >= start && e.t < end).length);
    }
    return out;
  }
  function monthlySummary(){
    const counts = lastNDayCounts(30);
    const total = counts.reduce((s,n)=>s+n,0);
    const activeDays = counts.filter(c => c > 0).length;
    const longestStreak = (() => {
      let max = 0, cur = 0;
      for (const c of counts){ if(c > 0){ cur++; if(cur>max) max=cur; } else cur=0; }
      return max;
    })();
    const log = getRecentQuizLog();
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recent30 = log.filter(e => e.t >= cutoff);
    const correctPct = recent30.length ? Math.round(recent30.filter(e=>e.correct).length / recent30.length * 100) : 0;
    return { total, activeDays, longestStreak, correctPct, counts };
  }

  function rankLabel(level){
    return ({N5:'Novice', N4:'Apprentice', N3:'Adept', N2:'Veteran', N1:'Master'})[level] || 'Novice';
  }

  function summary(){
    const scores = scoreByLevel();
    const estimated = getEstimatedLevel();
    const counts = last7DayCounts();
    const weeklyTotal = counts.reduce((s,n)=>s+n,0);
    const growth = personalWeeklyGrowth();
    const isPersonal = getRecentQuizLog().length >= 30;
    return {
      estimated, rank: rankLabel(estimated),
      scores,
      targetLevel: nextTarget(estimated),
      weeksToTarget: weeksToPass(scores[nextTarget(estimated)] || 0, growth),
      sparkline: counts,
      weeklyTotal,
      mistakeCount: getMistakes().length,
      dueToday: getMistakes().filter(m => !m.next_due || m.next_due <= Date.now()).length,
      weeklyGrowth: growth,
      isPersonalPace: isPersonal
    };
  }

  function nextTarget(currentLevel){
    const i = LEVELS.indexOf(currentLevel);
    if(i < 0) return 'N3';
    if(i >= LEVELS.length - 1) return 'N1';
    return LEVELS[i+1];
  }

  window.NH_READINESS = {
    LEVELS, PASS_THRESHOLD, TARGET_DAILY_QUESTIONS, DEFAULT_WEEKLY_GROWTH,
    pushQuizLog, scoreByLevel, weeksToPass, last7DayCounts, lastNDayCounts,
    summary, rankLabel, nextTarget, personalWeeklyGrowth, monthlySummary,
    getMistakes, getEstimatedLevel, getRecentQuizLog
  };
})();
