// [browser] HTML から <script src> で読み込まれる IIFE。api/ からは import されない。
/* lib/sync.js — Supabase Anonymous Auth + 5s-debounced upsert of progress JSON to user_progress table.
   Fails open: if Supabase unconfigured / offline, falls back to localStorage only.
   Exposes window.NH_SYNC with init(), pushLocal(), pullRemote(), getStatus(), transferUrl(), claimTransfer(). */
(function(){
  const KEYS = ['nh_quiz_xp','nh_streak','nh_best_streak','nh_quiz_log','nh_mistakes',
                'nh_diagnostic_scores','nh_estimated_level','nh_onboarding_done','nh_onboarding_at','nh_lang',
                'nh_correct_total','nh_leveltest_completions','nh_title_equipped','nh_inventory','nh_equipped','nh_avatar'];
  const DEBOUNCE_MS = 5000;
  let client = null;
  let userId = null;
  let pendingTimer = null;
  let status = 'idle';
  let lastError = null;

  function readLocal(){
    const out = {};
    for(const k of KEYS){
      try { const v = localStorage.getItem(k); if(v != null) out[k] = v; } catch(e){}
    }
    return { data: out, updated_at_ms: Date.now() };
  }

  function applyRemote(remoteData){
    if(!remoteData || typeof remoteData !== 'object') return false;
    for(const k of KEYS){
      if(typeof remoteData[k] === 'string'){
        try { localStorage.setItem(k, remoteData[k]); } catch(e){}
      }
    }
    return true;
  }

  async function fetchConfig(){
    try {
      const r = await fetch('/api/public-config');
      if(!r.ok) return null;
      return await r.json();
    } catch(e){ return null; }
  }

  async function loadSupabaseSDK(){
    if(window.supabase && window.supabase.createClient) return window.supabase;
    return new Promise(resolve=>{
      const s = document.createElement('script');
      // Pinned version + SRI for supply-chain safety. Bump both together when upgrading.
      s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.0/dist/umd/supabase.min.js';
      s.integrity = 'sha384-NNePyabYRaJyedI6EQAY7SV5Z8/0sQkuQ5WVfhKm0H+j0KSugkI2ZMNzw/QtzAWz';
      s.crossOrigin = 'anonymous';
      s.referrerPolicy = 'no-referrer';
      s.onload = ()=>resolve(window.supabase);
      s.onerror = ()=>resolve(null);
      document.head.appendChild(s);
    });
  }

  async function init(){
    if(status !== 'idle') return status;
    status = 'connecting';
    try {
      const cfg = await fetchConfig();
      if(!cfg || !cfg.authEnabled){ status = 'offline'; return status; }
      const sdk = await loadSupabaseSDK();
      if(!sdk){ status = 'sdk_fail'; return status; }
      client = sdk.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
        // Passthrough lock: avoid supabase-js v2 navigator.locks deadlock when
        // multiple clients share a storageKey (auth hangs forever with no error).
        auth: { persistSession: true, autoRefreshToken: true, storageKey: 'nh_supabase_auth', lock: (_n,_t,fn)=>fn() }
      });
      // Get or create anonymous session
      const { data: sess } = await client.auth.getSession();
      let session = sess && sess.session ? sess.session : null;
      if(!session){
        const signIn = await client.auth.signInAnonymously();
        if(signIn.error){ lastError = signIn.error.message; status = 'auth_fail'; return status; }
        session = signIn.data && signIn.data.session ? signIn.data.session : null;
      }
      userId = session && session.user ? session.user.id : null;
      try { localStorage.setItem('nh_anon_id', userId || ''); } catch(e){}
      status = 'connected';
      // initial pull (if remote is newer)
      await pullRemote();
      return status;
    } catch(err){
      lastError = String(err && err.message || err);
      status = 'error';
      return status;
    }
  }

  async function pullRemote(){
    if(!client || !userId) return false;
    const { data, error } = await client.from('user_progress').select('data, updated_at').eq('user_id', userId).maybeSingle();
    if(error){ lastError = error.message; return false; }
    if(!data) return false;
    const remoteMs = data.updated_at ? new Date(data.updated_at).getTime() : 0;
    let localMs = 0;
    try { localMs = parseInt(localStorage.getItem('nh_sync_updated_at') || '0', 10) || 0; } catch(e){}
    // Apply remote if newer than local
    if(remoteMs > localMs){
      applyRemote(data.data);
      try { localStorage.setItem('nh_sync_updated_at', String(remoteMs)); } catch(e){}
      return true;
    }
    return false;
  }

  async function pushImmediately(){
    if(!client || !userId) return false;
    const local = readLocal();
    const updated_at = new Date(local.updated_at_ms).toISOString();
    try { localStorage.setItem('nh_sync_updated_at', String(local.updated_at_ms)); } catch(e){}
    const { error } = await client.from('user_progress').upsert({
      user_id: userId, data: local.data, updated_at
    });
    if(error){ lastError = error.message; return false; }
    return true;
  }

  function pushLocal(){
    if(status !== 'connected') return;
    if(pendingTimer) clearTimeout(pendingTimer);
    pendingTimer = setTimeout(()=>{
      pendingTimer = null;
      pushImmediately().catch(()=>{});
    }, DEBOUNCE_MS);
  }

  // Hook localStorage.setItem to auto-push on any KEYS write
  function installHook(){
    const orig = Storage.prototype.setItem;
    Storage.prototype.setItem = function(k, v){
      const ret = orig.apply(this, arguments);
      if(this === localStorage && KEYS.indexOf(k) >= 0) pushLocal();
      return ret;
    };
  }

  function transferUrl(){
    // Build a URL the user can open on another device to claim this anon id.
    if(!userId) return null;
    return location.origin + '/dashboard.html?claim=' + encodeURIComponent(userId);
  }

  async function claimTransfer(claimUserId){
    // Only useful for moving progress between browsers when the user is signed-out anonymous elsewhere
    if(!client) return false;
    // Pull the remote row and apply locally
    const { data } = await client.from('user_progress').select('data, updated_at').eq('user_id', claimUserId).maybeSingle();
    if(!data) return false;
    applyRemote(data.data);
    try { localStorage.setItem('nh_anon_id', claimUserId); } catch(e){}
    try { localStorage.setItem('nh_sync_updated_at', data.updated_at ? String(new Date(data.updated_at).getTime()) : String(Date.now())); } catch(e){}
    return true;
  }

  function getStatus(){ return { status, userId, lastError }; }

  installHook();

  window.NH_SYNC = { init, pushLocal, pullRemote, getStatus, transferUrl, claimTransfer };

  // Auto-init when DOM ready
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', ()=>{ init().catch(()=>{}); });
  } else {
    init().catch(()=>{});
  }
})();
