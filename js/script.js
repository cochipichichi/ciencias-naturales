
// Controls implementation
const qs = (s,ctx=document)=>ctx.querySelector(s);
const qsa = (s,ctx=document)=>[...ctx.querySelectorAll(s)];
let reading = false;
let voicesReady = false;

function speak(text){
  if(!('speechSynthesis' in window)) return alert('TTS no soportado en este navegador');
  const u = new SpeechSynthesisUtterance(text);
  const prefer = (lang)=>speechSynthesis.getVoices().find(v=>v.lang.startsWith(lang));
  const lang = document.documentElement.lang || 'es';
  const v = prefer(lang) || prefer('es') || prefer('en') || speechSynthesis.getVoices()[0];
  if(v) u.voice = v;
  u.rate = 1.0; u.pitch = 1.0;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

function stopSpeak(){ if('speechSynthesis' in window) speechSynthesis.cancel(); }

function scrollTopSmooth(){ window.scrollTo({top:0, behavior:'smooth'}); }

function toggleContrast(btn){
  const hc = document.body.classList.toggle('high-contrast');
  btn.setAttribute('aria-pressed', hc ? 'true' : 'false');
}

function fontDelta(delta){
  const root = document.documentElement;
  const cur = parseFloat(getComputedStyle(root).fontSize);
  const next = Math.min(22, Math.max(12, cur + delta));
  root.style.fontSize = next + 'px';
}

function toggleLang(btn){
  const current = document.documentElement.lang || 'es';
  const next = current === 'es' ? 'en' : 'es';
  document.documentElement.lang = next;
  btn.setAttribute('aria-label', next === 'es' ? 'Cambiar a inglés' : 'Switch to Spanish');

  // naive i18n swap using [data-i18n-en] attributes
  qsa('[data-i18n-en]').forEach(el=>{
    const es = el.getAttribute('data-i18n-es');
    const en = el.getAttribute('data-i18n-en');
    el.textContent = next === 'en' ? en || el.textContent : es || el.textContent;
  });
}

function toggleGuide(show=true){
  const m = qs('#guideModal');
  if(show===undefined) show = !m.classList.contains('show');
  m.classList.toggle('show', show);
}

function toggleRuler(btn){
  const r = qs('#ruler');
  const show = !r.classList.contains('show');
  r.classList.toggle('show', show);
  btn.setAttribute('aria-pressed', show ? 'true' : 'false');
}

function updateRuler(e){
  const r = qs('#ruler');
  if(!r.classList.contains('show')) return;
  const h = r.getBoundingClientRect().height;
  r.style.top = (e.clientY - h/2) + 'px';
}

window.addEventListener('mousemove', updateRuler);
window.addEventListener('touchmove', e=>{
  if(e.touches && e.touches[0]) updateRuler({clientY:e.touches[0].clientY});
});

// TTS button: read selected or main intro
function handleSpeak(){
  const sel = window.getSelection().toString().trim();
  speak(sel || qs('#intro').innerText.trim());
}

function handleStop(){ stopSpeak(); }

// Simple natural selection mini-sim
function startSim(){
  const canvas = qs('#sim');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = Math.min(720, canvas.clientWidth);
  const H = canvas.height = 280;
  const N = 120;
  let threshold = parseFloat(qs('#sel').value);
  const pop = Array.from({length:N},()=>({x:Math.random()*W, y:Math.random()*H, trait:Math.random()}));
  function draw(){
    ctx.clearRect(0,0,W,H);
    // Draw threshold
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(0, 0, W*threshold, H);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.strokeRect(0,0,W*threshold,H);
    // Points
    pop.forEach(p=>{
      const survive = p.x/W < threshold; // "environment favors left zone"
      ctx.fillStyle = survive ? '#34d399' : '#f87171';
      ctx.beginPath(); ctx.arc(p.x,p.y,3,0,Math.PI*2); ctx.fill();
    });
  }
  function step(){
    threshold = parseFloat(qs('#sel').value);
    // reproduce survivors with small mutation
    const survivors = pop.filter(p=>p.x/W < threshold);
    const next = [];
    for(let i=0;i<pop.length;i++){
      const parent = survivors[Math.floor(Math.random()*survivors.length)] || pop[Math.floor(Math.random()*pop.length)];
      // offspring near parent x with mutation
      const nx = Math.max(0, Math.min(W, parent.x + (Math.random()-0.5)*20));
      const ny = Math.max(0, Math.min(H, parent.y + (Math.random()-0.5)*20));
      next.push({x:nx, y:ny, trait:nx/W});
    }
    next.forEach((p,i)=>pop[i]=p);
    draw();
  }
  qs('#step').onclick = step;
  qs('#reset').onclick = ()=>startSim();
  qs('#sel').oninput = draw;
  draw();
}
document.addEventListener('DOMContentLoaded', startSim);

// PWA (optional basic)
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>navigator.serviceWorker.register('./pwa/sw.js'));
}
