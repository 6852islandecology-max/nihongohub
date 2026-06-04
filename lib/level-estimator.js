/* Level estimator: maps diagnostic quiz answers to estimated JLPT level + per-level accuracy.
   Used by onboarding.html and dashboard.html. Pure functions, no side effects.
   Browser global: window.NH_LEVEL_ESTIMATOR */
(function(){
  const LEVELS = ['N5','N4','N3','N2','N1'];
  const ALL_LEVELS = ['PRE','N5','N4','N3','N2','N1'];

  // Given an answers array [{id, level, correct: bool}], return per-level accuracy
  function perLevelAccuracy(answers){
    const buckets = {PRE:[], N5:[], N4:[], N3:[], N2:[], N1:[]};
    answers.forEach(a => { if(buckets[a.level]) buckets[a.level].push(a.correct ? 1 : 0); });
    const acc = {};
    ALL_LEVELS.forEach(L => {
      const arr = buckets[L];
      acc[L] = arr.length ? arr.reduce((s,v)=>s+v,0) / arr.length : 0;
    });
    return acc;
  }

  // Estimate current level: highest level where accuracy >= threshold (default 0.5).
  // If user fails the PRE kana check, they're flagged as PRE (true beginner).
  function estimateLevel(answers, threshold){
    threshold = threshold == null ? 0.5 : threshold;
    const acc = perLevelAccuracy(answers);
    // If user can't pass the PRE kana check, stay at PRE level
    if (acc.PRE !== undefined && acc.PRE < 0.5) return 'PRE';
    let estimated = 'N5';
    for(const L of LEVELS){
      if(acc[L] >= threshold) estimated = L;
      else break;
    }
    return estimated;
  }

  function rankLabel(level){
    return ({
      PRE:'Beginner',
      N5:'Novice',
      N4:'Apprentice',
      N3:'Adept',
      N2:'Veteran',
      N1:'Master'
    })[level] || 'Beginner';
  }

  // Persist diagnostic result and mark onboarding done
  function saveResult(answers){
    const acc = perLevelAccuracy(answers);
    const level = estimateLevel(answers);
    try {
      localStorage.setItem('nh_diagnostic_scores', JSON.stringify(acc));
      localStorage.setItem('nh_estimated_level', level);
      localStorage.setItem('nh_onboarding_done', '1');
      localStorage.setItem('nh_onboarding_at', new Date().toISOString());
    } catch(e){}
    return { level, acc };
  }

  window.NH_LEVEL_ESTIMATOR = { LEVELS, ALL_LEVELS, perLevelAccuracy, estimateLevel, rankLabel, saveResult };
})();
