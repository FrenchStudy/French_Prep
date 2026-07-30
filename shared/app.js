/* ============================================================
   Plume shared helpers
   - Storage: wraps localStorage (persists per-browser, per-device)
   - callClaude: calls YOUR proxy (set in config.js), never the
     Anthropic API directly from the browser (keeps your key safe)
   - small utils: escapeHtml, parseJsonLoose, shuffle
   ============================================================ */

const PlumeStorage = {
  get(key, fallback){
    try{
      const raw = localStorage.getItem(key);
      if(raw === null) return fallback;
      return JSON.parse(raw);
    }catch(e){ return fallback; }
  },
  set(key, value){
    try{ localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch(e){ console.error('PlumeStorage.set failed', e); return false; }
  },
  remove(key){ try{ localStorage.removeItem(key); }catch(e){} }
};

async function callClaude(system, messages, maxTokens){
  if(!window.PLUME_API_ENDPOINT){
    throw new Error("L'assistant IA n'est pas encore configuré. Suis les instructions du README pour déployer le proxy (5 minutes), puis renseigne son URL dans shared/config.js.");
  }
  let res;
  try{
    res = await fetch(window.PLUME_API_ENDPOINT, {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({
        model:"claude-sonnet-4-6",
        max_tokens: maxTokens || 1000,
        system: system,
        messages: messages
      })
    });
  }catch(networkErr){
    throw new Error("Connexion au serveur impossible. Vérifie ton proxy et ta connexion internet.");
  }
  if(!res.ok){
    let detail = '';
    try{ const errBody = await res.json(); detail = (errBody && errBody.error && errBody.error.message) || ''; }catch(e){}
    throw new Error(`Erreur serveur (${res.status}). ${detail}`);
  }
  const data = await res.json();
  if(data.error){ throw new Error(data.error.message || "Erreur inconnue de l'API."); }
  const text = (data.content||[]).map(b=>b.text||"").join("\n").trim();
  if(!text){ throw new Error("Réponse vide reçue."); }
  return text;
}

function parseJsonLoose(text){
  let clean = text.replace(/```json/gi,'').replace(/```/g,'').trim();
  const start = clean.indexOf('{'); const end = clean.lastIndexOf('}');
  if(start>=0 && end>=0) clean = clean.slice(start, end+1);
  try{ return JSON.parse(clean); }catch(e){ return null; }
}
function escapeHtml(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function showError(containerId, msg){ const el = document.getElementById(containerId); if(el) el.innerHTML = `<div class="error-line">⚠️ ${escapeHtml(msg)}</div>`; }
function showWarn(containerId, msg){ const el = document.getElementById(containerId); if(el) el.innerHTML = `<div class="warn-line">${escapeHtml(msg)}</div>`; }
function shuffle(arr){ for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; } return arr; }

async function loadJSON(path){
  const res = await fetch(path);
  if(!res.ok) throw new Error(`Impossible de charger ${path} (${res.status})`);
  return res.json();
}

/* ---------- TTS + Speech Recognition (used by ai/speaking_coach.html) ---------- */
let frenchVoice = null;
function pickFrenchVoice(){
  if(!window.speechSynthesis) return;
  const voices = window.speechSynthesis.getVoices();
  frenchVoice = voices.find(v=>v.lang && v.lang.toLowerCase().startsWith('fr')) || null;
}
if(window.speechSynthesis){
  pickFrenchVoice();
  window.speechSynthesis.onvoiceschanged = pickFrenchVoice;
}
function speak(text){
  if(!window.speechSynthesis) return false;
  try{
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'fr-FR';
    if(frenchVoice) u.voice = frenchVoice;
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
    return true;
  }catch(e){ return false; }
}
function getRecognitionCtor(){ return window.SpeechRecognition || window.webkitSpeechRecognition || null; }

/* ---------- shared header/nav renderer ---------- */
function renderPlumeHeader(activePage, basePath){
  basePath = basePath || '';
  const header = document.getElementById('plumeHeader');
  if(!header) return;
  header.innerHTML = `
    <div class="avatar-wrap">
      <svg width="34" height="34" viewBox="0 0 52 52" fill="none">
        <circle cx="26" cy="26" r="23" fill="#EAF0FF" stroke="#25293A" stroke-width="2.5"/>
        <circle cx="19" cy="27" r="2.6" fill="#25293A"/>
        <circle cx="33" cy="27" r="2.6" fill="#25293A"/>
        <path d="M18 34c3 3 13 3 16 0" stroke="#25293A" stroke-width="2.5" stroke-linecap="round" fill="none"/>
        <path d="M35 15c3-2 8 1 6 5-1 2-4 2-5 0" stroke="#FF6B5E" stroke-width="2.5" stroke-linecap="round" fill="none"/>
      </svg>
    </div>
    <div>
      <a href="${basePath}index.html" class="brand-name">Plume</a>
      <div class="brand-tag">Ton assistant TCF / TEF</div>
    </div>
  `;
  const nav = document.getElementById('plumeNav');
  if(!nav) return;
  const links = [
    ['index.html', '🏠 Accueil', 'home'],
    ['vocabulary.html', '🔤 Vocabulaire', 'vocab'],
    ['themes/index.html', '🗂️ Thèmes', 'themes'],
    ['grammar.html', '📐 Grammaire', 'grammar'],
    ['ai/speaking_coach.html', '🎙️ Plume (IA)', 'ai']
  ];
  nav.innerHTML = links.map(([href,label,id])=>
    `<a class="nav-link ${activePage===id?'active':''}" href="${basePath}${href}">${label}</a>`
  ).join('');
}
