/* Browser-friendly SM-2 SRS (mirrors lib/srs.js). Exposes window.NH_SRS.
   Used by quiz.html for client-side mistake review. */
(function(){
  const Q_MAP = { 1: 0, 2: 3, 3: 4, 4: 5 };
  const EF_MIN = 1.3, EF_INITIAL = 2.5;
  const DAY_MS = 24*60*60*1000;

  function initialRecord(){
    return { ease_factor: EF_INITIAL, interval_days: 0, repetitions: 0, last_review_at: null, next_review_at: Date.now(), last_rating: null };
  }
  function updateRecord(record, rating){
    const q = Q_MAP[rating];
    if(q === undefined) throw new Error('Invalid rating');
    let EF = typeof record.ease_factor === 'number' ? record.ease_factor : EF_INITIAL;
    let I = typeof record.interval_days === 'number' ? record.interval_days : 0;
    let n = typeof record.repetitions === 'number' ? record.repetitions : 0;
    if(q < 3){ n = 0; I = 1; }
    else {
      n += 1;
      if(n === 1) I = 1;
      else if(n === 2) I = 6;
      else I = Math.round(I * EF);
      EF = EF + (0.1 - (5-q)*(0.08 + (5-q)*0.02));
      if(EF < EF_MIN) EF = EF_MIN;
    }
    const now = Date.now();
    return {
      ease_factor: EF, interval_days: I, repetitions: n,
      last_review_at: now, next_review_at: now + I*DAY_MS, last_rating: rating
    };
  }

  // Mistake store: localStorage 'nh_mistakes' = [{id, question, options, answer, level, topic, srs, last_seen, next_due}]
  function getMistakes(){
    try { return JSON.parse(localStorage.getItem('nh_mistakes') || '[]'); } catch(e){ return []; }
  }
  function saveMistakes(arr){
    try { localStorage.setItem('nh_mistakes', JSON.stringify(arr.slice(-1000))); } catch(e){}
  }
  function hashId(s){
    let h = 0; const str = String(s||'');
    for(let i=0; i<str.length; i++){ h = ((h<<5)-h) + str.charCodeAt(i); h |= 0; }
    return 'm'+(h>>>0).toString(36);
  }
  function recordMistake(qdata){
    // qdata: {question, options[], answer:string, level, topic}
    const list = getMistakes();
    const id = hashId(qdata.question + '|' + qdata.answer);
    const existing = list.find(m => m.id === id);
    if(existing){
      existing.last_seen = Date.now();
      // reset SRS progress on a fresh miss
      existing.srs = initialRecord();
      existing.next_due = existing.srs.next_review_at;
    } else {
      const srs = initialRecord();
      list.push({
        id, question: qdata.question, options: qdata.options, answer: qdata.answer,
        level: qdata.level, topic: qdata.topic, srs,
        last_seen: Date.now(), next_due: srs.next_review_at
      });
    }
    saveMistakes(list);
  }
  function rateMistake(id, rating){
    const list = getMistakes();
    const m = list.find(x => x.id === id);
    if(!m) return null;
    const updated = updateRecord(m.srs || initialRecord(), rating);
    m.srs = updated;
    m.last_seen = updated.last_review_at;
    m.next_due = updated.next_review_at;
    // remove if 3+ consecutive correct (graduated)
    if(updated.repetitions >= 3){
      const i = list.indexOf(m);
      if(i >= 0) list.splice(i, 1);
    }
    saveMistakes(list);
    return updated;
  }
  function removeMistake(id){
    const list = getMistakes();
    const i = list.findIndex(m => m.id === id);
    if(i >= 0){ list.splice(i,1); saveMistakes(list); }
  }
  function dueMistakes(){
    const now = Date.now();
    return getMistakes().filter(m => !m.next_due || m.next_due <= now);
  }
  function countDueToday(){
    return dueMistakes().length;
  }

  window.NH_SRS = {
    initialRecord, updateRecord,
    getMistakes, recordMistake, rateMistake, removeMistake,
    dueMistakes, countDueToday
  };
})();
