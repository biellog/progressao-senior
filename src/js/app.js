'use strict';
// =====================================================================
//  Progressões (Ramos Escoteiro, Sênior e Pioneiro) — lógica do app
//  Compartilhado pela versão web e pela versão app (Android).
//  As diferenças entre as duas ficam em config.js, gerado pelo build.
// =====================================================================

const CFG = window.APP_CONFIG || {};
const IS_NATIVE_APP = CFG.platform === 'app' ||
  !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
const PUBLIC_SITE_URL = CFG.publicSiteUrl || '';
const SUPABASE_CONFIGURED = !!(CFG.supabaseUrl && CFG.supabaseAnonKey);
const sb = (SUPABASE_CONFIGURED && window.supabase)
  ? window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: !IS_NATIVE_APP }
    })
  : null;

const $ = (id) => document.getElementById(id);

let currentUser = null;   // usuário do Supabase
let profile = null;       // { user_id, full_name, role, patrol_id, patrol_name }

// ---------- Armazenamento local (separado por conta) ----------
const STORAGE_KEY = 'progressao-senior-v1';
const SPEC_STORAGE_KEY = 'especialidades-senior-v1';
const NOTES_STORAGE_KEY = 'notas-senior-v1';
const DELETED_NOTES_KEY = 'notas-apagadas-senior-v1';
const PROFILE_KEY = 'perfil-senior-v1';
const SUBS_KEY = 'envios-senior-v1';
const NOTIF_KEY = 'avisos-senior-v1';
const LEGACY_KEYS = [STORAGE_KEY, SPEC_STORAGE_KEY, NOTES_STORAGE_KEY];

function storeKey(base){ return base + ':' + (currentUser ? currentUser.id : 'anon'); }
function readJSON(base, fallback){
  try{
    const raw = localStorage.getItem(storeKey(base));
    return raw ? JSON.parse(raw) : fallback;
  }catch(err){ return fallback; }
}
function writeJSON(base, value){
  try{ localStorage.setItem(storeKey(base), JSON.stringify(value)); }catch(err){ console.error('Erro ao salvar no aparelho', err); }
}
// Dados da versão antiga (sem conta) vão para a primeira conta que entrar neste aparelho
function adoptLegacyData(){
  LEGACY_KEYS.forEach(k=>{
    try{
      const legacy = localStorage.getItem(k);
      if(legacy && !localStorage.getItem(storeKey(k))) localStorage.setItem(storeKey(k), legacy);
      if(legacy) localStorage.removeItem(k);
    }catch(err){}
  });
}
function clearLocalForUser(){
  [STORAGE_KEY, SPEC_STORAGE_KEY, NOTES_STORAGE_KEY, DELETED_NOTES_KEY, PROFILE_KEY, SUBS_KEY, NOTIF_KEY].forEach(k=>{
    try{ localStorage.removeItem(storeKey(k)); }catch(err){}
  });
}

// ---------- Estado ----------
let progress = {};       // { itemId: { checked, date: "YYYY-MM-DD", u: timestamp } }
let specProgress = {};   // { itemId: { notes, u } } — anotação dos requisitos
let subs = { especialidade:{}, insignia:{} }; // envios com relatório, por tipo e item
let notes = [];          // [{ id, title, body, updated }]
let specNotesOpen = {};
let notesSaveTimers = {};
let openEixos = new Set();

// ---------- Ramo ----------
// O conteúdo (eixos, especialidades, insígnias, etapas) muda conforme o ramo da conta.
let RAMO = RAMOS.senior;
let DATA = [], SPECIALTIES = [], INSIGNIAS = [];
const RAMO_CHOICE_KEY = 'ramo-escolhido-v1';
let chosenRamo = null;   // escolhido na primeira tela (fica guardado no aparelho)
let chiefMode = false;   // entrou pelo botão "Login de chefes"
try{ const r = localStorage.getItem(RAMO_CHOICE_KEY); if(RAMOS[r]) chosenRamo = r; }catch(err){}

function cap(str){ return str ? str.charAt(0).toUpperCase() + str.slice(1) : ''; }
function isChief(){ return !!(profile && profile.role === 'chefe'); }
function isLeader(){ return !!(profile && (profile.role === 'monitor' || profile.role === 'chefe')); }

function setRamo(id){
  RAMO = RAMOS[id] || RAMOS.senior;
  DATA = RAMO.data; SPECIALTIES = RAMO.specialties; INSIGNIAS = RAMO.insignias;
  _textMap = null; _pickItemsCache = null;
  openEixos = new Set(DATA.length ? [DATA[0].id] : []);
  applyTheme(RAMO.id);
  $('appTitle').textContent = RAMO.name;
  document.querySelectorAll('[data-ramo-fonte]').forEach(el=>{ el.textContent = RAMO.fonte; });
}
function applyTheme(id){
  if(id) document.documentElement.setAttribute('data-ramo', id);
  else document.documentElement.removeAttribute('data-ramo');
  const meta = document.querySelector('meta[name="theme-color"]');
  if(meta) meta.setAttribute('content', getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#150C0E');
}
function rememberRamo(id){
  chosenRamo = id;
  try{ if(id) localStorage.setItem(RAMO_CHOICE_KEY, id); else localStorage.removeItem(RAMO_CHOICE_KEY); }catch(err){}
}
let searchQueryProgressao = '';
let searchQueryEspecialidades = '';
let currentTab = 'progressao';

const SPEC_GUIDE_URL = 'https://loja.escoteiros.org.br/ebook/Mjg4MDU3/ODc3OQ==';
const MESES = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

// ---------- Utilidades ----------
function escapeHtml(s){
  return (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function normalizeText(s){
  return (s||'').toString().normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
}
function highlightText(text, q){
  if(!q) return text;
  const idx = normalizeText(text).indexOf(q);
  if(idx === -1) return text;
  return text.slice(0,idx) + '<mark class="search-mark">' + text.slice(idx, idx+q.length) + '</mark>' + text.slice(idx+q.length);
}
function today(){ return new Date().toISOString().slice(0,10); }
function fmtDate(d){ const [y,m,dd] = d.split('-'); return dd+'/'+m+'/'+y; }
function initials(name){
  const parts = (name||'').trim().split(/\s+/).filter(Boolean);
  if(!parts.length) return '?';
  return ((parts[0][0]||'') + (parts.length>1 ? parts[parts.length-1][0] : '')).toUpperCase();
}
function firstName(name){ return (name||'').trim().split(/\s+/)[0] || ''; }
function daysSince(dateStr){
  if(!dateStr) return null;
  const d = new Date(dateStr + 'T12:00:00');
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}
function isDone(prog, id){ return !!(prog[id] && prog[id].checked); }

// ---------- Regras da progressão ----------
function parseVarRequired(label){
  if(!label) return null;
  const l = label.toLowerCase();
  const map = [['duas',2],['dois',2],['três',3],['tres',3],['quatro',4],['cinco',5],['seis',6]];
  for(const [word,n] of map){ if(l.includes(word)) return n; }
  return null;
}

// Quantas ações variáveis o bloco exige (varMin tem prioridade; senão lê o número do rótulo)
function varRequired(b){ return b.varMin != null ? b.varMin : parseVarRequired(b.varLabel); }

function blocoFixasComplete(b, prog = progress){
  const fixasArr = b.fixas||[];
  const normalItems = fixasArr.filter(i=> !i.tag);
  const specialItems = fixasArr.filter(i=> i.tag==='mar' || i.tag==='ar');
  // Itens com selo MAR/AR são alternativas de modalidade: quando há só 1 ação
  // "normal" junto delas, basta marcar UMA do grupo (normal, do Mar ou do Ar).
  // Quando há mais de uma ação "normal", todas as normais são obrigatórias.
  if(normalItems.length > 1) return normalItems.every(i=> isDone(prog, i.id));
  if(specialItems.length > 0) return [...normalItems, ...specialItems].some(i=> isDone(prog, i.id));
  return normalItems.every(i=> isDone(prog, i.id));
}

function blocoComplete(b, prog = progress){
  if(!blocoFixasComplete(b, prog)) return false;
  if(b.ou && isDone(prog, b.ou.id)) return true;
  const req = varRequired(b);
  const varDone = (b.variaveis||[]).filter(i=> isDone(prog, i.id)).length;
  if(req != null) return varDone >= req;
  return (b.fixas||[]).length > 0; // bloco só com ações fixas
}

function blocoStarted(b, prog = progress){
  const all = [...(b.items||[]), ...(b.fixas||[]), ...(b.variaveis||[])];
  if(b.ou) all.push(b.ou);
  return all.some(i=> isDone(prog, i.id));
}

function countBlocksCompleted(prog = progress){
  let done = 0, total = 0;
  DATA.forEach(ex=>{
    if(ex.flat) return; // Período de Acolhida e Escoteiro da Pátria não contam como blocos
    ex.blocos.forEach(b=>{ total++; if(blocoComplete(b, prog)) done++; });
  });
  return { done, total };
}

function blocoMissingDetail(b, prog = progress){
  const parts = [];
  if(!blocoFixasComplete(b, prog)){
    const fixasArr = b.fixas||[];
    const normalItems = fixasArr.filter(i=> !i.tag);
    const specialItems = fixasArr.filter(i=> i.tag==='mar' || i.tag==='ar');
    if(normalItems.length > 1){
      const missing = normalItems.filter(i=> !isDone(prog, i.id)).length;
      if(missing > 0) parts.push(missing + (missing !== 1 ? ' ações fixas' : ' ação fixa'));
    } else if(specialItems.length > 0){
      parts.push('1 ação fixa (a normal, a do Mar ⛵ ou a do Ar ✈️)');
    } else {
      parts.push('1 ação fixa');
    }
  }
  if(!(b.ou && isDone(prog, b.ou.id))){
    const req = varRequired(b);
    const varDone = (b.variaveis||[]).filter(i=> isDone(prog, i.id)).length;
    if(req != null){
      const missing = Math.max(0, req - varDone);
      if(missing > 0) parts.push(missing + (missing !== 1 ? ' ações variáveis' : ' ação variável') + (b.ou ? ' (ou a opção "OU")' : ''));
    }
  }
  return parts.join(' + ');
}

// Em que etapa a pessoa está (índice em RAMO.stages)
function stageIndex(blocksDone, prog = progress){
  const st = RAMO.stages;
  let i = 0;
  st.forEach((s, k)=>{ if(blocksDone >= s.at) i = k; });
  // No Sênior a última etapa também exige os itens finais (Desafio do Azimute + Avaliação)
  if(i === st.length - 1 && i > 0 && RAMO.finalExtra && !RAMO.finalExtra.every(id=> isDone(prog, id))) i--;
  return i;
}
function currentStage(blocksDone, prog = progress){
  const s = RAMO.stages[stageIndex(blocksDone, prog)];
  return { icon: s.icon, label: s.label };
}

function allItemIds(){
  const ids = [];
  DATA.forEach(ex => ex.blocos.forEach(b => {
    (b.items||[]).forEach(i => ids.push(i.id));
    (b.fixas||[]).forEach(i => ids.push(i.id));
    (b.variaveis||[]).forEach(i => ids.push(i.id));
    if(b.ou) ids.push(b.ou.id);
  }));
  return ids;
}


let _textMap = null;
function itemTextMap(){
  if(_textMap) return _textMap;
  const m = {};
  DATA.forEach(ex=>ex.blocos.forEach(b=>{
    [...(b.items||[]), ...(b.fixas||[]), ...(b.variaveis||[])].forEach(i=>m[i.id]=i.text);
    if(b.ou) m[b.ou.id] = b.ou.text;
  }));
  SPECIALTIES.forEach(a=> a.especialidades.forEach(i=> m[i.id] = i.text));
  INSIGNIAS.forEach(a=> a.items.forEach(i=> m[i.id] = i.text));
  _textMap = m;
  return m;
}

// ---------- Progressão: tela ----------
const CHECK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="#150C0E" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';

function itemRow(item, isOu){
  const p = progress[item.id] || {};
  const checked = !!p.checked;
  let modTag = '';
  if(item.tag === 'mar') modTag = '<span class="mod-tag mod-mar" title="Modalidade do Mar">⛵ MAR</span>';
  if(item.tag === 'ar') modTag = '<span class="mod-tag mod-ar" title="Modalidade do Ar">✈️ AR</span>';
  if(item.tag === 'esp') modTag = '<span class="mod-tag mod-esp" title="Soma como uma ação variável">🎖 ESPECIALIDADE</span>';
  return `
    <div class="item ${checked?'checked':''} ${isOu?'ou-item':''}" data-id="${item.id}">
      <div class="chk" data-action="toggle" data-id="${item.id}" role="checkbox" aria-checked="${checked}" tabindex="0">${CHECK_SVG}</div>
      <div class="item-body">
        <div class="item-text" data-action="toggle" data-id="${item.id}">${isOu?'<span class="ou-tag">OU</span>':''}${modTag}${highlightText(item.text, searchQueryProgressao)}</div>
        <div class="item-date">
          <input type="date" value="${p.date || ''}" data-action="date" data-id="${item.id}" aria-label="Data">
          <button class="note-add-btn" data-action="item-to-note" data-id="${item.id}" title="Adicionar às notas">📝 Anotar</button>
        </div>
      </div>
    </div>`;
}

function blocoHtml(b){
  let html = '<div class="bloco">';
  if(b.name){
    const badge = blocoComplete(b)
      ? '<span class="bloco-status bloco-status-ok">✓ Bloco completo</span>'
      : `<span class="bloco-status bloco-status-pending">Falta: ${blocoMissingDetail(b) || 'concluir os itens'}</span>`;
    html += `<div class="bloco-name-row"><div class="bloco-name">${b.name}</div>${badge}</div>`;
    if(b.desc) html += `<div class="bloco-desc">${b.desc}</div>`;
  }
  if(b.items) html += b.items.map(i=>itemRow(i,false)).join('');
  if(b.fixas){
    html += '<div class="section-label">Ações fixas</div>';
    html += b.fixas.map(i=>itemRow(i,false)).join('');
  }
  if(b.variaveis){
    html += `<div class="section-label">${b.varLabel||'Ações variáveis'}</div>`;
    html += b.variaveis.map(i=>itemRow(i,false)).join('');
  }
  if(b.ou) html += itemRow(b.ou, true);
  return html + '</div>';
}

function blocoCounts(b, prog = progress){
  const all = [...(b.items||[]), ...(b.fixas||[]), ...(b.variaveis||[])];
  if(b.ou) all.push(b.ou);
  return { total: all.length, done: all.filter(i=> isDone(prog, i.id)).length };
}
function eixoCounts(ex, prog = progress){
  let total = 0, done = 0;
  ex.blocos.forEach(b=>{ const c = blocoCounts(b, prog); total += c.total; done += c.done; });
  return { total, done };
}

function render(){
  const content = $('content');
  content.classList.remove('loading');
  content.innerHTML = DATA.map(ex=>{
    const c = eixoCounts(ex);
    const pct = c.total ? Math.round(c.done/c.total*100) : 0;
    const bodyInner = ex.flat
      ? `<div class="plain-list">${ex.blocos.map(b=>b.items.map(i=>itemRow(i,false)).join('')).join('')}</div>`
      : ex.blocos.map(blocoHtml).join('');
    return `
      <div class="eixo ${openEixos.has(ex.id)?'open':''}" data-eixo="${ex.id}">
        <div class="eixo-head" data-action="collapse" data-id="${ex.id}" role="button" tabindex="0" aria-expanded="${openEixos.has(ex.id)}">
          <div class="eixo-title">
            ${ex.num?`<span class="eixo-num">${ex.num}</span>`:''}
            <span class="eixo-name">${ex.name}</span>
          </div>
          <div class="eixo-meta">
            <span class="eixo-frac">${c.done}/${c.total}</span>
            <span class="chevron"></span>
          </div>
        </div>
        <div class="eixo-bar-track"><div class="eixo-bar-fill" style="width:${pct}%"></div></div>
        <div class="eixo-body"><div class="eixo-body-inner">${bodyInner}</div></div>
      </div>`;
  }).join('');
  updateHeader();
  applyProgressSearch();
}

// Um único ouvinte para toda a lista (não precisa religar a cada render)
$('content').addEventListener('click', (e)=>{
  const el = e.target.closest('[data-action]');
  if(!el) return;
  const action = el.getAttribute('data-action');
  const id = el.getAttribute('data-id');
  if(action === 'toggle') toggleItem(id);
  else if(action === 'collapse'){
    const parent = el.closest('.eixo');
    if(openEixos.has(id)) openEixos.delete(id); else openEixos.add(id);
    parent.classList.toggle('open');
    el.setAttribute('aria-expanded', parent.classList.contains('open'));
  }
  else if(action === 'item-to-note'){
    const t = itemTextMap()[id];
    if(t) openPicker({ type:'toNote', text:t });
  }
});
$('content').addEventListener('change', (e)=>{
  const el = e.target;
  if(el.getAttribute('data-action') === 'date') setDate(el.getAttribute('data-id'), el.value);
});
$('content').addEventListener('keydown', (e)=>{
  if(e.key !== 'Enter' && e.key !== ' ') return;
  const el = e.target.closest('.chk, .eixo-head');
  if(!el) return;
  e.preventDefault();
  el.click();
});

function applyProgressSearch(){
  const content = $('content');
  const countEl = $('searchCountProgressao');
  const q = searchQueryProgressao;
  let shown = 0;
  content.querySelectorAll('.item').forEach(el=>{
    const textEl = el.querySelector('.item-text');
    const match = !q || normalizeText(textEl ? textEl.textContent : '').includes(q);
    el.classList.toggle('search-hide', !match);
    if(match) shown++;
  });
  content.querySelectorAll('.bloco').forEach(b=>{
    b.classList.toggle('search-hide', !!q && !b.querySelector('.item:not(.search-hide)'));
  });
  content.querySelectorAll('.eixo').forEach(ex=>{
    const anyVisible = !!ex.querySelector('.item:not(.search-hide)');
    if(q){
      ex.classList.toggle('search-hide', !anyVisible);
      if(anyVisible) ex.classList.add('open');
    } else {
      ex.classList.remove('search-hide');
      ex.classList.toggle('open', openEixos.has(ex.getAttribute('data-eixo')));
    }
  });
  if(countEl) countEl.textContent = q ? (shown + ' encontrado' + (shown!==1?'s':'')) : '';
}

function updateHeader(){
  if(currentTab === 'evolucao') renderEvolucao();
  const ids = allItemIds();
  const total = ids.length;
  const done = ids.filter(id => isDone(progress, id)).length;
  const pct = total ? Math.round(done/total*100) : 0;
  $('pctLabel').textContent = pct + '%';
  $('fracLabel').textContent = done + ' / ' + total;
  const circumference = 207.3;
  $('ringFill').style.strokeDashoffset = circumference - (pct/100)*circumference;

  const { done: blocksDone, total: blocksTotal } = countBlocksCompleted();
  const active = stageIndex(blocksDone);
  const stages = RAMO.stages;
  $('stageRow').innerHTML = stages.map((s,i)=>
    `<span class="stage-pill ${i===active?'active':''}">${s.icon} ${s.short || s.label}</span>${i<stages.length-1?'<span class="stage-sep">›</span>':''}`
  ).join('') + `<div class="stage-note">${blocksDone} de ${blocksTotal} blocos concluídos (fixas + variáveis/OU de cada bloco)</div>`;

  renderMissingCard(blocksDone, blocksTotal);
}

function renderMissingCard(blocksDone, blocksTotal){
  const el = $('missingCard');
  const stages = RAMO.stages;
  const idx = stageIndex(blocksDone);
  const next = stages[idx + 1];
  let pct, label, icon, note;
  if(next && blocksDone < next.at){
    const from = stages[idx].at;
    pct = Math.round(((blocksDone - from) / (next.at - from)) * 100);
    label = next.label; icon = next.icon;
    const need = next.at - blocksDone;
    note = need + ' bloco' + (need!==1?'s':'') + ' para chegar lá';
  } else if(next){
    // blocos suficientes, faltam os itens finais da última etapa
    const extras = RAMO.finalExtra || [];
    const got = extras.filter(id=> isDone(progress, id)).length;
    pct = Math.round(got / extras.length * 100);
    label = next.label; icon = next.icon;
    note = got + '/' + extras.length + (RAMO.finalExtraNote ? ' (' + RAMO.finalExtraNote + ')' : '');
  } else if(blocksDone < blocksTotal){
    const from = stages[idx].at;
    pct = Math.round(((blocksDone - from) / (blocksTotal - from)) * 100);
    label = 'concluir todos os blocos'; icon = '🏁';
    const need = blocksTotal - blocksDone;
    note = need + ' bloco' + (need!==1?'s':'') + ' para completar';
  } else {
    el.innerHTML = `<div class="missing-done">🏆 Você já cumpriu tudo — parabéns${RAMO.finalExtra ? ', ' + stages[idx].label : ''}!</div>`;
    return;
  }
  el.innerHTML = `
    <div class="missing-title">Rumo a ${icon} ${label}</div>
    <div class="missing-pct-row"><div class="missing-pct">${pct}%</div><div class="missing-note">${note}</div></div>
    <div class="missing-bar-track"><div class="missing-bar-fill" style="width:${pct}%"></div></div>`;
}

function toggleItem(id){
  const cur = progress[id] || {};
  cur.checked = !cur.checked;
  if(cur.checked && !cur.date) cur.date = today();
  cur.u = Date.now();
  progress[id] = cur;
  save();
  upsertCloud('progressao', id, cur);
  render();
}

function setDate(id, value){
  const cur = progress[id] || {};
  cur.date = value;
  cur.u = Date.now();
  progress[id] = cur;
  save();
  upsertCloud('progressao', id, cur);
}

function save(){ writeJSON(STORAGE_KEY, progress); }

$('resetBtn').addEventListener('click', async ()=>{
  if(!confirm('Isso vai apagar todo o seu progresso, inclusive da nuvem. Tem certeza?')) return;
  progress = {};
  save();
  render();
  await deleteCloudKind('progressao');
  showToast('Progresso apagado');
});

// ---------- Especialidades e Insígnias (envio com relatório) ----------
// Para marcar, a pessoa envia o relatório (PDF, fotos, outros arquivos).
// O envio fica "enviada" até o monitor aprovar ou devolver.
const KINDS = {
  especialidade: { label:'Especialidade', plural:'especialidades', content:'specContent', count:'specFracLabel', pending:'specPendingLabel', search:'searchCountEspecialidades' },
  insignia:      { label:'Insígnia', plural:'insígnias', content:'insigContent', count:'insigFracLabel', pending:'insigPendingLabel', search:'searchCountInsignias' }
};
const STATUS_INFO = {
  enviada:   { chip:'⏳ Aguardando o monitor', cls:'pending' },
  aprovada:  { chip:'✓ Aprovada', cls:'ok' },
  devolvida: { chip:'↩ Devolvida: ajustar', cls:'back' }
};
const MAX_FILES = 10;
const MAX_FILE_BYTES = 15 * 1024 * 1024;
const BUCKET = 'relatorios';
let searchQueryInsignias = '';

function catalogAreas(kind){
  return kind === 'insignia'
    ? INSIGNIAS
    : SPECIALTIES.map(a=> ({ id:a.id, name:a.name, items:a.especialidades }));
}
function allIdsOf(kind){ return catalogAreas(kind).flatMap(a=> a.items.map(i=> i.id)); }
function subOf(kind, id, s = subs){ return (s[kind] || {})[id] || null; }
function isApproved(kind, id, s = subs){ const x = subOf(kind, id, s); return !!(x && x.status === 'aprovada'); }
function approvedCount(kind, s = subs){ return allIdsOf(kind).filter(id=> isApproved(kind, id, s)).length; }
function pendingCountOf(kind, s = subs){ return allIdsOf(kind).filter(id=> { const x = subOf(kind, id, s); return x && x.status === 'enviada'; }).length; }
function searchQueryOf(kind){ return kind === 'insignia' ? searchQueryInsignias : searchQueryEspecialidades; }

const HOURGLASS_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12M6 21h12M7 3c0 5 10 5 10 9s-10 4-10 9M17 3c0 5-10 5-10 9"/></svg>';
const BACK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/></svg>';

function catalogItemRow(kind, item){
  const sub = subOf(kind, item.id);
  const st = sub ? STATUS_INFO[sub.status] : null;
  const p = specProgress[item.id] || {};
  const notesTxt = p.notes || '';
  const notesOpen = !!specNotesOpen[item.id];
  const icon = !sub ? '' : sub.status === 'aprovada' ? CHECK_SVG : sub.status === 'enviada' ? HOURGLASS_SVG : BACK_SVG;
  const nFiles = sub ? (sub.files || []).length : 0;
  let chip;
  if(!sub) chip = `<button class="sub-send-btn" data-action="sub-open" data-kind="${kind}" data-id="${item.id}">📎 Enviar relatório</button>`;
  else chip = `<button class="sub-chip sub-${st.cls}" data-action="sub-open" data-kind="${kind}" data-id="${item.id}" title="${nFiles} arquivo${nFiles!==1?'s':''}">${st.chip}${sub.status === 'aprovada' && sub.item_date ? ' · ' + fmtDate(sub.item_date) : ''}</button>`;
  return `
    <div class="item ${sub && sub.status==='aprovada' ? 'checked' : ''}" data-id="${item.id}">
      <div class="chk ${st ? 'chk-' + st.cls : ''}" data-action="sub-open" data-kind="${kind}" data-id="${item.id}" role="button" tabindex="0" aria-label="Enviar ou ver relatório">${icon}</div>
      <div class="item-body">
        <div class="item-text-row">
          <div class="item-text" data-action="sub-open" data-kind="${kind}" data-id="${item.id}">${highlightText(item.text, searchQueryOf(kind))}</div>
          <a class="spec-link" href="${SPEC_GUIDE_URL}" target="_blank" rel="noopener noreferrer">Ver requisitos ↗</a>
        </div>
        <div class="item-date">
          ${chip}
          <button class="notes-toggle-btn" data-action="notes-toggle" data-id="${item.id}">${notesOpen ? 'Fechar anotação' : (notesTxt ? '📝 Requisitos' : '📝 Anotar requisitos')}</button>
        </div>
        ${sub && sub.status === 'devolvida' && sub.review_note ? `<div class="review-note">💬 ${escapeHtml(sub.review_note)}</div>` : ''}
        ${notesOpen ? `
        <div class="notes-box">
          <textarea class="notes-textarea" data-action="notes-input" data-id="${item.id}" placeholder="Cole ou escreva aqui os requisitos, do jeito que você consultou no guia oficial.">${escapeHtml(notesTxt)}</textarea>
        </div>` : (notesTxt ? `<div class="notes-preview" data-action="notes-toggle" data-id="${item.id}">${escapeHtml(notesTxt.length>140 ? notesTxt.slice(0,140)+'…' : notesTxt)}</div>` : '')}
      </div>
    </div>`;
}

function renderCatalog(kind){
  const k = KINDS[kind];
  const content = $(k.content);
  content.classList.remove('loading');
  content.innerHTML = catalogAreas(kind).map(area=>
    `<div class="spec-area"><div class="spec-area-title">${area.name}</div>${area.items.map(i=> catalogItemRow(kind, i)).join('')}</div>`
  ).join('');
  const total = allIdsOf(kind).length;
  $(k.count).textContent = approvedCount(kind) + ' / ' + total;
  const pend = pendingCountOf(kind);
  $(k.pending).textContent = pend ? '· ' + pend + ' aguardando o monitor' : '';
  applyCatalogSearch(kind);
}
function renderSpecialidades(){ renderCatalog('especialidade'); renderCatalog('insignia'); }

function applyCatalogSearch(kind){
  const k = KINDS[kind];
  const content = $(k.content);
  const q = searchQueryOf(kind);
  let shown = 0;
  content.querySelectorAll('.item').forEach(el=>{
    const textEl = el.querySelector('.item-text');
    const match = !q || normalizeText(textEl ? textEl.textContent : '').includes(q);
    el.classList.toggle('search-hide', !match);
    if(match) shown++;
  });
  content.querySelectorAll('.spec-area').forEach(a=>{
    a.classList.toggle('search-hide', !!q && !a.querySelector('.item:not(.search-hide)'));
  });
  $(k.search).textContent = q ? (shown + ' encontrada' + (shown!==1?'s':'')) : '';
}

['especialidade','insignia'].forEach(kind=>{
  const content = $(KINDS[kind].content);
  content.addEventListener('click', (e)=>{
    const el = e.target.closest('[data-action]');
    if(!el) return;
    const action = el.getAttribute('data-action');
    const id = el.getAttribute('data-id');
    if(action === 'sub-open') openSubmission(kind, id);
    else if(action === 'notes-toggle'){
      specNotesOpen[id] = !specNotesOpen[id];
      renderCatalog(kind);
      if(specNotesOpen[id]){
        const ta = content.querySelector('.notes-textarea[data-id="'+id+'"]');
        if(ta) ta.focus();
      }
    }
  });
  content.addEventListener('input', (e)=>{
    const el = e.target;
    if(el.getAttribute('data-action') === 'notes-input') specSetNotes(el.getAttribute('data-id'), el.value);
  });
  content.addEventListener('keydown', (e)=>{
    if((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('chk')){ e.preventDefault(); e.target.click(); }
  });
});

// Anotação dos requisitos (só para quem anota; fica em senior_progress)
function specSetNotes(id, value){
  const cur = specProgress[id] || {};
  cur.notes = value;
  cur.u = Date.now();
  specProgress[id] = cur;
  clearTimeout(notesSaveTimers[id]);
  notesSaveTimers[id] = setTimeout(()=>{
    specSave();
    upsertCloud('especialidade', id, cur);
  }, 600);
}
function specSave(){ writeJSON(SPEC_STORAGE_KEY, specProgress); }
function subsSave(){ writeJSON(SUBS_KEY, subs); }

// ---------- Enviar relatório ----------
let subDraft = null; // { kind, id, keep:[arquivos já enviados], add:[File], editing }

function fmtBytes(n){
  if(!n && n !== 0) return '';
  if(n < 1024) return n + ' B';
  if(n < 1024*1024) return Math.round(n/1024) + ' KB';
  return (n/1024/1024).toFixed(1).replace('.', ',') + ' MB';
}
function fileIcon(type, name){
  const t = (type || '') + ' ' + (name || '').toLowerCase();
  if(/image|\.jpe?g|\.png|\.webp|\.heic/.test(t)) return '🖼️';
  if(/pdf/.test(t)) return '📄';
  if(/video|\.mp4|\.mov/.test(t)) return '🎬';
  if(/audio|\.mp3|\.m4a|\.ogg/.test(t)) return '🎧';
  return '📎';
}
function safeFileName(name){
  const dot = name.lastIndexOf('.');
  const base = (dot > 0 ? name.slice(0, dot) : name).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9_-]+/g, '_').slice(0, 60) || 'arquivo';
  const ext = (dot > 0 ? name.slice(dot + 1) : '').replace(/[^A-Za-z0-9]/g, '').slice(0, 8).toLowerCase();
  return ext ? base + '.' + ext : base;
}

// Fotos grandes são reduzidas antes de enviar (economiza internet e espaço no Supabase)
async function shrinkImage(file){
  if(!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size < 1.2 * 1024 * 1024) return file;
  try{
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 1920 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise(r=> canvas.toBlob(r, 'image/jpeg', 0.85));
    if(!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.(png|webp|jpe?g)$/i, '') + '.jpg', { type:'image/jpeg' });
  }catch(err){ return file; }
}

function itemName(kind, id){ return itemTextMap()[id] || id; }

function openSubmission(kind, id){
  const sub = subOf(kind, id);
  subDraft = { kind, id, keep: sub ? (sub.files || []).slice() : [], add: [], editing: !sub || sub.status === 'devolvida' };
  $('subKind').textContent = KINDS[kind].label;
  $('subTitle').textContent = itemName(kind, id);
  $('subDate').value = (sub && sub.item_date) || today();
  $('subReport').value = (sub && sub.report) || '';
  $('subFiles').value = '';
  setMsgEl('subMsg', '');
  $('subCancel').textContent = 'Cancelar envio';
  renderSubmission();
  openModal('subModal');
  $('subModal').querySelector('.modal-box').scrollTop = 0;
}

function renderSubmission(){
  const d = subDraft;
  if(!d) return;
  const sub = subOf(d.kind, d.id);
  let status = '';
  if(sub){
    const when = sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString('pt-BR') : '';
    if(sub.status === 'enviada') status = `<div class="auth-msg auth-msg-info">⏳ Enviado em ${when}. Aguardando o monitor analisar.</div>`;
    if(sub.status === 'aprovada') status = `<div class="auth-msg auth-msg-ok">✓ Aprovada pelo monitor${sub.reviewed_at ? ' em ' + new Date(sub.reviewed_at).toLocaleDateString('pt-BR') : ''}.${sub.review_note ? '<br>💬 ' + escapeHtml(sub.review_note) : ''}</div>`;
    if(sub.status === 'devolvida') status = `<div class="auth-msg auth-msg-error">↩ O monitor devolveu este envio.${sub.review_note ? '<br>💬 ' + escapeHtml(sub.review_note) : ''}<br>Ajuste e envie de novo.</div>`;
  }
  $('subStatusBox').innerHTML = status;
  $('subEditBox').hidden = !d.editing;
  $('subViewBox').hidden = d.editing;
  $('subEditBtn').hidden = !(sub && sub.status === 'enviada' && !d.editing);
  $('subCancel').hidden = !(sub && sub.status !== 'aprovada');

  if(d.editing){
    const rows = [
      ...d.keep.map((f, i)=> `<div class="file-row"><span class="file-ic">${fileIcon(f.type, f.name)}</span><span class="file-name">${escapeHtml(f.name)}<small>${fmtBytes(f.size)} · já enviado</small></span><button class="file-x" data-keep="${i}" aria-label="Remover">✕</button></div>`),
      ...d.add.map((f, i)=> `<div class="file-row new"><span class="file-ic">${fileIcon(f.type, f.name)}</span><span class="file-name">${escapeHtml(f.name)}<small>${fmtBytes(f.size)} · novo</small></span><button class="file-x" data-add="${i}" aria-label="Remover">✕</button></div>`)
    ];
    $('subFileList').innerHTML = rows.join('') || '<div class="pick-hint">Nenhum arquivo ainda. O relatório é obrigatório.</div>';
    $('subSend').textContent = sub && sub.status === 'devolvida' ? 'Reenviar para o monitor' : (sub ? 'Salvar e reenviar' : 'Enviar para o monitor');
  } else {
    $('subViewBox').innerHTML = (sub && sub.report ? `<div class="field"><label>Comentário</label><div class="report-text">${escapeHtml(sub.report)}</div></div>` : '') +
      '<div class="field"><label>Arquivos enviados</label>' + filesListHtml(sub ? sub.files : []) + '</div>';
  }
}

function filesListHtml(files){
  if(!files || !files.length) return '<div class="pick-hint">Nenhum arquivo.</div>';
  return files.map(f=> `<button class="file-row file-open" data-path="${escapeHtml(f.path)}"><span class="file-ic">${fileIcon(f.type, f.name)}</span><span class="file-name">${escapeHtml(f.name)}<small>${fmtBytes(f.size)}</small></span><span class="file-go">Abrir ↗</span></button>`).join('');
}

// Abre um arquivo do Storage com um link temporário (10 minutos)
async function openStoredFile(path){
  try{
    const { data, error } = await sb.storage.from(BUCKET).createSignedUrl(path, 600);
    if(error) throw error;
    const a = document.createElement('a');
    a.href = data.signedUrl; a.target = '_blank'; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove();
  }catch(err){ showToast('Não consegui abrir o arquivo. ' + authErrorPt(err)); }
}
document.addEventListener('click', (e)=>{
  const b = e.target.closest('.file-open');
  if(b) openStoredFile(b.getAttribute('data-path'));
});

$('subFiles').addEventListener('change', async (e)=>{
  const d = subDraft;
  if(!d) return;
  const picked = Array.from(e.target.files || []);
  e.target.value = '';
  let skipped = 0;
  for(const f of picked){
    if(d.keep.length + d.add.length >= MAX_FILES){ skipped++; continue; }
    const g = await shrinkImage(f);
    if(g.size > MAX_FILE_BYTES){ skipped++; continue; }
    d.add.push(g);
  }
  setMsgEl('subMsg', skipped ? skipped + ' arquivo(s) não entraram: máximo de ' + MAX_FILES + ' arquivos e 15 MB cada.' : '', 'error');
  renderSubmission();
});
$('subFileList').addEventListener('click', (e)=>{
  const b = e.target.closest('.file-x');
  if(!b || !subDraft) return;
  if(b.hasAttribute('data-keep')) subDraft.keep.splice(Number(b.getAttribute('data-keep')), 1);
  else subDraft.add.splice(Number(b.getAttribute('data-add')), 1);
  renderSubmission();
});
$('subEditBtn').addEventListener('click', ()=>{ if(subDraft){ subDraft.editing = true; renderSubmission(); } });

$('subSend').addEventListener('click', async ()=>{
  const d = subDraft;
  if(!d || !sb || !currentUser) return;
  if(!d.keep.length && !d.add.length){ setMsgEl('subMsg', 'Anexe o relatório: PDF, fotos ou outro arquivo.', 'error'); return; }
  const btn = $('subSend');
  btn.disabled = true;
  const uploaded = [];
  try{
    for(let i = 0; i < d.add.length; i++){
      const f = d.add[i];
      setMsgEl('subMsg', 'Enviando arquivo ' + (i+1) + ' de ' + d.add.length + '…', 'info');
      const path = `${currentUser.id}/${d.kind}/${d.id}/${Date.now()}-${i}-${safeFileName(f.name)}`;
      const { error } = await sb.storage.from(BUCKET).upload(path, f, { contentType: f.type || 'application/octet-stream', upsert:false });
      if(error) throw error;
      uploaded.push({ path, name: f.name, size: f.size, type: f.type || '' });
    }
    setMsgEl('subMsg', 'Enviando para o monitor…', 'info');
    const before = subOf(d.kind, d.id);
    const files = [...d.keep, ...uploaded];
    const { data, error } = await sb.rpc('submit_item', {
      p_kind: d.kind, p_item_id: d.id, p_item_date: $('subDate').value || null,
      p_report: $('subReport').value, p_files: files
    });
    if(error) throw error;
    subs[d.kind][d.id] = data;
    subsSave();
    // Arquivos que a pessoa tirou do envio saem do Storage
    if(before){
      const keepPaths = new Set(files.map(f=> f.path));
      const removed = (before.files || []).map(f=> f.path).filter(p=> !keepPaths.has(p));
      if(removed.length) sb.storage.from(BUCKET).remove(removed);
    }
    closeModal('subModal');
    renderCatalog(d.kind);
    updateHeader();
    showToast('Enviado! O monitor vai analisar ✓');
  }catch(err){
    if(uploaded.length) sb.storage.from(BUCKET).remove(uploaded.map(f=> f.path));
    setMsgEl('subMsg', authErrorPt(err), 'error');
  }finally{
    btn.disabled = false;
  }
});

$('subCancel').addEventListener('click', async (e)=>{
  const d = subDraft;
  if(!d) return;
  if(!armButton('cancel-sub', e.currentTarget, 'Toque de novo para cancelar o envio')) return;
  try{
    const { data, error } = await sb.rpc('cancel_submission', { p_kind: d.kind, p_item_id: d.id });
    if(error) throw error;
    const paths = (data || []).map(f=> f.path).filter(Boolean);
    if(paths.length) await sb.storage.from(BUCKET).remove(paths);
    delete subs[d.kind][d.id];
    subsSave();
    closeModal('subModal');
    renderCatalog(d.kind);
    showToast('Envio cancelado');
  }catch(err){ setMsgEl('subMsg', authErrorPt(err), 'error'); }
});

// Envios da própria conta (para mostrar o status de cada especialidade/insígnia)
async function fetchOwnSubs(announce){
  if(!sb || !currentUser) return;
  const uid = currentUser.id;
  try{
    const rows = await fetchAll(()=> sb.from('submissions')
      .select('id, kind, item_id, item_date, report, files, status, review_note, reviewed_at, submitted_at')
      .eq('user_id', uid).order('item_id'));
    if(!currentUser || currentUser.id !== uid) return;
    const next = { especialidade:{}, insignia:{} };
    rows.forEach(r=>{ if(next[r.kind]) next[r.kind][r.item_id] = r; });
    const before = subs;
    subs = next;
    subsSave();
    if(announce) announceReviewChanges(before, next);
    renderSpecialidades();
    updateHeader();
  }catch(err){ console.error('Erro ao carregar envios', err); }
}

// ---------- Abas ----------
const TABS = {
  progressao:     ['tabProgressaoBtn','viewProgressao'],
  especialidades: ['tabEspecialidadesBtn','viewEspecialidades'],
  insignias:      ['tabInsigniasBtn','viewInsignias'],
  evolucao:       ['tabEvolucaoBtn','viewEvolucao'],
  notas:          ['tabNotasBtn','viewNotas'],
  patrulha:       ['tabPatrulhaBtn','viewPatrulha']
};
function showTab(name){
  if(name === 'patrulha' && !isLeader()) name = 'progressao';
  if(isChief() && name !== 'patrulha' && name !== 'notas') name = 'patrulha';
  currentTab = name;
  $('appScreen').setAttribute('data-tab', name);
  Object.keys(TABS).forEach(k=>{
    const [btn, view] = TABS[k];
    $(btn).classList.toggle('active', k===name);
    $(btn).setAttribute('aria-current', k===name ? 'page' : 'false');
    $(view).hidden = k !== name;
  });
  if(name === 'evolucao') renderEvolucao();
  if(name === 'patrulha') loadPatrol();
  if(name === 'especialidades' || name === 'insignias') fetchOwnSubs();
  window.scrollTo({ top:0 });
}
Object.keys(TABS).forEach(k=> $(TABS[k][0]).addEventListener('click', ()=> showTab(k)));

$('searchProgressao').addEventListener('input', (e)=>{
  searchQueryProgressao = normalizeText(e.target.value.trim());
  render();
});
$('searchEspecialidades').addEventListener('input', (e)=>{
  searchQueryEspecialidades = normalizeText(e.target.value.trim());
  renderCatalog('especialidade');
});
$('searchInsignias').addEventListener('input', (e)=>{
  searchQueryInsignias = normalizeText(e.target.value.trim());
  renderCatalog('insignia');
});

// ---------- Evolução ----------
function collectDone(prog = progress, s = subs){
  const out = [];
  Object.entries(prog).forEach(([id,p])=>{ if(p && p.checked && p.date) out.push({ id, date:p.date, kind:'Progressão' }); });
  ['especialidade','insignia'].forEach(kind=>{
    Object.entries(s[kind] || {}).forEach(([id,x])=>{ if(x && x.status === 'aprovada' && x.item_date) out.push({ id, date:x.item_date, kind: KINDS[kind].label }); });
  });
  return out;
}

function renderEvolucao(){
  const el = $('evoContent');
  const done = collectDone();
  if(!done.length){
    el.innerHTML = '<div class="evo-empty">Marque itens com data para ver sua evolução aqui.</div>';
    return;
  }
  const byMonth = {};
  done.forEach(d=>{ const k = d.date.slice(0,7); byMonth[k] = (byMonth[k]||0)+1; });
  const keys = Object.keys(byMonth).sort();
  const curKey = today().slice(0,7);
  const endKey = keys[keys.length-1] > curKey ? keys[keys.length-1] : curKey;
  let [y,m] = keys[0].split('-').map(Number);
  const months = [];
  while(true){
    const k = y+'-'+String(m).padStart(2,'0');
    months.push(k);
    if(k===endKey || months.length>600) break;
    m++; if(m>12){ m=1; y++; }
  }
  let cum = 0;
  const series = months.map(k=>{ cum += byMonth[k]||0; return { k, n:byMonth[k]||0, cum }; });
  const win = series.slice(-12);
  const maxN = Math.max(1, ...win.map(s=>s.n));
  const maxCum = Math.max(1, win[win.length-1].cum);

  const W=340, H=200, padL=8, padR=8, padT=22, padB=30;
  const plotW = W-padL-padR, plotH = H-padT-padB;
  const step = plotW/win.length, barW = step*0.55;
  let bars='', labels='', vals='', pts=[];
  win.forEach((s,i)=>{
    const x = padL + i*step + (step-barW)/2;
    const h = (s.n/maxN)*plotH;
    const yb = padT + plotH - h;
    bars += `<rect x="${x.toFixed(1)}" y="${yb.toFixed(1)}" width="${barW.toFixed(1)}" height="${h.toFixed(1)}" rx="4" fill="var(--brand)" opacity="0.9"/>`;
    if(s.n>0) vals += `<text x="${(x+barW/2).toFixed(1)}" y="${(yb-4).toFixed(1)}" font-size="9" text-anchor="middle" fill="var(--text)">${s.n}</text>`;
    const [yy,mm] = s.k.split('-').map(Number);
    labels += `<text x="${(x+barW/2).toFixed(1)}" y="${H-14}" font-size="9" text-anchor="middle" fill="var(--muted)">${MESES[mm-1]}</text>`;
    if(i===0 || mm===1) labels += `<text x="${(x+barW/2).toFixed(1)}" y="${H-3}" font-size="8" text-anchor="middle" fill="var(--muted)">${String(yy).slice(2)}</text>`;
    pts.push((x+barW/2).toFixed(1)+','+(padT + plotH - (s.cum/maxCum)*plotH).toFixed(1));
  });
  const line = `<polyline points="${pts.join(' ')}" fill="none" stroke="var(--done)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>` +
    pts.map(p=>{ const [px,py]=p.split(','); return `<circle cx="${px}" cy="${py}" r="2.5" fill="var(--done)"/>`; }).join('');
  const base = `<line x1="${padL}" y1="${padT+plotH}" x2="${W-padR}" y2="${padT+plotH}" stroke="var(--line-strong)" stroke-width="1"/>`;

  const best = Object.entries(byMonth).sort((a,b)=>b[1]-a[1])[0];
  const [by,bm] = best[0].split('-').map(Number);
  const lastDate = done.map(d=>d.date).sort().pop();
  const texts = itemTextMap();
  const recent = done.slice().sort((a,b)=> b.date.localeCompare(a.date)).slice(0,8).map(d=>
    `<div class="evo-recent"><span class="d">${fmtDate(d.date)}</span><span class="t" title="${escapeHtml(texts[d.id]||'')}">${escapeHtml(texts[d.id]||d.id)}</span></div>`
  ).join('');

  el.innerHTML =
    '<div class="evo-stats">' +
      `<div class="evo-stat"><div class="n">${done.length}</div><div class="l">itens com data registrada</div></div>` +
      `<div class="evo-stat"><div class="n">${byMonth[curKey]||0}</div><div class="l">marcados neste mês</div></div>` +
      `<div class="evo-stat"><div class="n">${best[1]}</div><div class="l">melhor mês (${MESES[bm-1]}/${String(by).slice(2)})</div></div>` +
      `<div class="evo-stat"><div class="n" style="font-size:21px;padding-top:6px">${fmtDate(lastDate)}</div><div class="l">última atividade</div></div>` +
    '</div>' +
    '<div class="evo-card">' +
      '<div class="evo-card-title">Itens por mês</div>' +
      '<div class="evo-legend"><span><i style="background:var(--brand)"></i>no mês</span><span><i style="background:var(--done)"></i>acumulado</span></div>' +
      `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Gráfico de itens concluídos por mês">${base}${bars}${line}${vals}${labels}</svg>` +
    '</div>' +
    `<div class="evo-card"><div class="evo-card-title">Últimas conquistas</div>${recent}</div>`;
}

// ---------- Bloco de notas ----------
let notesTimers = {};
function newNoteId(){ return 'n' + Date.now().toString(36) + Math.random().toString(36).slice(2,6); }
function notesSaveLocal(){ writeJSON(NOTES_STORAGE_KEY, notes); }

function renderNotes(){
  const el = $('notesList');
  if(!notes.length){
    el.innerHTML = '<div class="evo-empty">Nenhuma nota ainda. Toque em "Nova nota" para começar.</div>';
    return;
  }
  el.innerHTML = notes.slice().sort((a,b)=> b.updated - a.updated).map(n=>
    `<div class="note-card" data-id="${n.id}">` +
      `<input class="note-title" data-action="note-title" data-id="${n.id}" value="${escapeHtml(n.title)}" placeholder="Título" maxlength="120">` +
      `<textarea class="note-body" data-action="note-body" data-id="${n.id}" placeholder="Escreva aqui...">${escapeHtml(n.body)}</textarea>` +
      `<div class="note-foot"><span class="note-date">Editada em ${new Date(n.updated).toLocaleDateString('pt-BR')}</span>` +
      '<span class="note-actions">' +
        `<button class="note-btn" data-action="note-add" data-id="${n.id}">＋ Da progressão</button>` +
        `<button class="note-btn" data-action="note-copy" data-id="${n.id}">Copiar</button>` +
        `<button class="note-del" data-action="note-del" data-id="${n.id}">Apagar</button>` +
      '</span></div>' +
    '</div>'
  ).join('');
}

$('notesList').addEventListener('input', (e)=>{
  const el = e.target;
  const action = el.getAttribute('data-action');
  if(action === 'note-title') noteEdited(el.getAttribute('data-id'), 'title', el.value);
  if(action === 'note-body') noteEdited(el.getAttribute('data-id'), 'body', el.value);
});
$('notesList').addEventListener('click', async (e)=>{
  const b = e.target.closest('button[data-action]');
  if(!b) return;
  const id = b.getAttribute('data-id');
  const action = b.getAttribute('data-action');
  if(action === 'note-del') noteDelete(id, b);
  else if(action === 'note-add') openPicker({ type:'fromProgress', noteId:id });
  else if(action === 'note-copy'){
    const n = notes.find(x=>x.id===id);
    if(!n) return;
    const ok = await copyText(noteAsText(n));
    if(ok){ const old = b.textContent; b.textContent = 'Copiado ✓'; setTimeout(()=>{ b.textContent = old; }, 1500); }
    else showToast('Não consegui copiar. Selecione o texto e copie manualmente.');
  }
});

function noteEdited(id, field, value){
  const n = notes.find(x=>x.id===id);
  if(!n) return;
  n[field] = value;
  n.updated = Date.now();
  clearTimeout(notesTimers[id]);
  notesTimers[id] = setTimeout(()=>{ notesSaveLocal(); upsertCloudNote(n); }, 500);
}

function getDeletedNotes(){ return readJSON(DELETED_NOTES_KEY, []); }
function rememberDeletedNote(id){
  const d = getDeletedNotes();
  if(!d.includes(id)){ d.push(id); writeJSON(DELETED_NOTES_KEY, d.slice(-200)); }
}

const armed = {};
// Botões perigosos pedem um segundo toque (confirm() é bloqueado em alguns ambientes)
function armButton(key, btn, confirmLabel){
  if(armed[key]){ clearTimeout(armed[key].t); delete armed[key]; return true; }
  const old = btn.textContent;
  btn.textContent = confirmLabel || 'Confirmar?';
  armed[key] = { t: setTimeout(()=>{ delete armed[key]; if(btn.isConnected) btn.textContent = old; }, 3500) };
  return false;
}

function noteDelete(id, btn){
  if(!notes.find(x=>x.id===id)) return;
  if(!armButton('note-'+id, btn)) return;
  clearTimeout(notesTimers[id]);
  notes = notes.filter(x=>x.id!==id);
  rememberDeletedNote(id);
  notesSaveLocal();
  deleteCloudNote(id);
  renderNotes();
  showToast('Nota apagada');
}

$('newNoteBtn').addEventListener('click', ()=>{
  const n = { id:newNoteId(), title:'', body:'', updated:Date.now() };
  notes.unshift(n);
  notesSaveLocal();
  upsertCloudNote(n);
  renderNotes();
  const t = document.querySelector('.note-title[data-id="'+n.id+'"]');
  if(t) t.focus();
});

function noteAsText(n){ return (n.title ? n.title + '\n\n' : '') + (n.body || ''); }

async function copyText(text){
  try{
    if(navigator.clipboard && window.isSecureContext){ await navigator.clipboard.writeText(text); return true; }
  }catch(err){ /* tenta o método alternativo */ }
  try{
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  }catch(err){ return false; }
}

let toastTimer = null;
function showToast(msg){
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=> t.classList.remove('show'), 2200);
}

$('copyAllBtn').addEventListener('click', async ()=>{
  if(!notes.length){ showToast('Nenhuma nota para copiar'); return; }
  const text = notes.slice().sort((a,b)=> b.updated - a.updated).map(noteAsText).join('\n\n— — —\n\n');
  showToast(await copyText(text) ? 'Todas as notas copiadas ✓' : 'Não consegui copiar');
});

function appendLineToNote(id, text){
  const n = notes.find(x=>x.id===id);
  if(!n) return null;
  n.body = (n.body ? n.body.replace(/\s+$/,'') + '\n' : '') + '• ' + text;
  n.updated = Date.now();
  notesSaveLocal();
  upsertCloudNote(n);
  return n;
}

let _pickItemsCache = null;
function progressPickItems(){
  if(_pickItemsCache) return _pickItemsCache;
  const out = [];
  DATA.forEach(ex=> ex.blocos.forEach(b=>{
    const blocoTag = (!ex.flat && b.name) ? ' · ' + b.name.replace(/^Bloco (\d+) — /, 'B$1 · ') : '';
    const ctx = (ex.num ? ex.num + ' · ' : '') + ex.name + blocoTag;
    [...(b.items||[]), ...(b.fixas||[]), ...(b.variaveis||[])].forEach(i=> out.push({ id:i.id, text:i.text, ctx }));
    if(b.ou) out.push({ id:b.ou.id, text:b.ou.text, ctx: ctx + ' · OU' });
  }));
  SPECIALTIES.forEach(a=> a.especialidades.forEach(i=> out.push({ id:i.id, text:i.text, ctx:'Especialidades · ' + a.name })));
  INSIGNIAS.forEach(a=> a.items.forEach(i=> out.push({ id:i.id, text:i.text, ctx:'Insígnias · ' + a.name })));
  _pickItemsCache = out;
  return out;
}

let pickState = null;
function openPicker(state){
  pickState = state;
  const search = $('pickSearch');
  $('pickTitle').textContent = state.type === 'toNote' ? 'Adicionar a qual nota?' : 'Adicionar item da progressão';
  search.hidden = state.type !== 'fromProgress';
  search.value = '';
  openModal('pickModal');
  renderPickList();
  if(state.type === 'fromProgress') search.focus();
}
function closePicker(){ closeModal('pickModal'); pickState = null; }

function renderPickList(){
  const list = $('pickList');
  if(!pickState) return;
  let html = '';
  if(pickState.type === 'toNote'){
    html += '<div class="pick-item" data-pick="__new__"><span class="pick-ctx">NOVA</span>＋ Criar uma nota nova com este item</div>';
    notes.slice().sort((a,b)=> b.updated - a.updated).forEach(n=>{
      const preview = (n.body || '').replace(/\s+/g,' ').slice(0,60);
      html += `<div class="pick-item" data-pick="${n.id}"><span class="pick-ctx">${escapeHtml(n.title || 'Sem título')}</span>${escapeHtml(preview || '(nota vazia)')}</div>`;
    });
  } else {
    const q = normalizeText($('pickSearch').value.trim());
    const all = progressPickItems().filter(it=> !q || normalizeText(it.text + ' ' + it.ctx).includes(q));
    pickState.filtered = all.slice(0, 80);
    pickState.filtered.forEach((it, idx)=>{
      html += `<div class="pick-item" data-pick="${idx}"><span class="pick-ctx">${escapeHtml(it.ctx)}</span>${escapeHtml(it.text)}</div>`;
    });
    if(!all.length) html = '<div class="pick-hint">Nenhum item encontrado.</div>';
    else if(all.length > 80) html += `<div class="pick-hint">Mostrando 80 de ${all.length}. Refine a busca.</div>`;
  }
  list.innerHTML = html;
}
$('pickList').addEventListener('click', (e)=>{
  const el = e.target.closest('[data-pick]');
  if(el) onPick(el.getAttribute('data-pick'));
});

function onPick(key){
  if(!pickState) return;
  if(pickState.type === 'toNote'){
    if(key === '__new__'){
      const n = { id:newNoteId(), title:'Da progressão', body:'• ' + pickState.text, updated:Date.now() };
      notes.unshift(n);
      notesSaveLocal();
      upsertCloudNote(n);
    } else {
      appendLineToNote(key, pickState.text);
    }
    renderNotes();
    closePicker();
    showToast('Adicionado às notas ✓');
  } else {
    const it = pickState.filtered[Number(key)];
    if(!it) return;
    appendLineToNote(pickState.noteId, it.text);
    renderNotes();
    showToast('Item adicionado ✓');
  }
}
$('pickSearch').addEventListener('input', renderPickList);
$('pickClose').addEventListener('click', closePicker);

// ---------- Modais ----------
function openModal(id){ $(id).hidden = false; }
function closeModal(id){ $(id).hidden = true; }
document.querySelectorAll('.modal-overlay').forEach(m=>{
  m.addEventListener('click', (e)=>{
    if(e.target === m && m.id !== 'recoveryModal'){ m.id === 'pickModal' ? closePicker() : closeModal(m.id); }
  });
});
document.querySelectorAll('[data-close]').forEach(b=> b.addEventListener('click', ()=> closeModal(b.getAttribute('data-close'))));
document.addEventListener('keydown', (e)=>{
  if(e.key !== 'Escape') return;
  ['pickModal','reviewModal','subModal','memberModal','accountModal'].forEach(id=>{ if(!$(id).hidden) id === 'pickModal' ? closePicker() : closeModal(id); });
});

// ---------- Exportar PDF ----------
$('exportPdfBtn').addEventListener('click', exportPDF);

function exportPDF(){
  const jsPDFLib = window.jspdf && window.jspdf.jsPDF;
  if(!jsPDFLib){ alert('Não consegui carregar o gerador de PDF.'); return; }
  const doc = new jsPDFLib({ unit:'pt', format:'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const marginX = 40;
  let y = 50;

  function ensureSpace(h){ if(y + h > 790){ doc.addPage(); y = 50; } }
  function heading(text, size){
    ensureSpace(size+14);
    doc.setFont('helvetica','bold'); doc.setFontSize(size); doc.setTextColor(120,30,45);
    doc.text(text, marginX, y);
    y += size + 8;
  }
  function subtext(text){
    ensureSpace(14);
    doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.setTextColor(90,90,90);
    doc.text(text, marginX, y);
    y += 16;
  }
  function bulletLine(text, date){
    const maxW = pageW - marginX*2 - 70;
    const lines = doc.splitTextToSize(text, maxW);
    ensureSpace(lines.length*13 + 4);
    doc.setFont('helvetica','normal'); doc.setFontSize(9.5); doc.setTextColor(30,30,30);
    doc.text('-', marginX+2, y);
    doc.text(lines, marginX+14, y);
    if(date){ doc.setTextColor(140,140,140); doc.setFontSize(8.5); doc.text(date, pageW-marginX-45, y); }
    y += lines.length*13 + 4;
  }
  function sectionRule(){
    ensureSpace(10);
    doc.setDrawColor(210,210,210); doc.line(marginX, y, pageW-marginX, y);
    y += 14;
  }

  doc.setFont('helvetica','bold'); doc.setFontSize(20); doc.setTextColor(120,30,45);
  doc.text('Progressão — ' + RAMO.name, marginX, y); y += 22;
  doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.setTextColor(110,110,110);
  const who = [profile && profile.full_name, profile && profile.patrol_name ? cap(RAMO.grupo) + ' ' + profile.patrol_name : ''].filter(Boolean).join('  ·  ');
  if(who){ doc.text(who, marginX, y); y += 14; }
  doc.text('Resumo gerado em ' + new Date().toLocaleDateString('pt-BR'), marginX, y); y += 10;
  sectionRule();

  const { done: blocksDone, total: blocksTotal } = countBlocksCompleted();
  const stage = currentStage(blocksDone);
  const ids = allItemIds();
  const itemsDone = ids.filter(id=> isDone(progress, id)).length;
  const specTotal = allIdsOf('especialidade').length + allIdsOf('insignia').length;
  const specDone = approvedCount('especialidade') + approvedCount('insignia');

  heading('Estágio atual: ' + stage.label, 13);
  subtext(blocksDone + ' de ' + blocksTotal + ' blocos concluídos  ·  ' + itemsDone + '/' + ids.length + ' itens de progressão  ·  ' + specDone + '/' + specTotal + ' especialidades/insígnias aprovadas');
  y += 6;

  heading('Progressão pessoal', 15);
  DATA.forEach(ex=>{
    const c = eixoCounts(ex);
    if(ex.flat){
      const done = (ex.blocos[0].items||[]).filter(i=> isDone(progress, i.id));
      if(!done.length) return;
      heading(ex.name + '  (' + done.length + '/' + ex.blocos[0].items.length + ')', 12);
      done.forEach(i=> bulletLine(i.text, progress[i.id].date ? fmtDate(progress[i.id].date) : ''));
      y += 4;
      return;
    }
    if(!c.done) return;
    heading((ex.num?ex.num+' — ':'') + ex.name + '  (' + c.done + '/' + c.total + ')', 12);
    ex.blocos.forEach(b=>{
      const all = [...(b.items||[]), ...(b.fixas||[]), ...(b.variaveis||[])];
      if(b.ou) all.push(b.ou);
      const done = all.filter(i=> isDone(progress, i.id));
      if(!done.length) return;
      ensureSpace(16);
      doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(60,60,60);
      doc.text((b.name || 'Bloco') + (blocoComplete(b) ? '  (completo)' : ''), marginX, y); y += 14;
      done.forEach(i=> bulletLine(i.text, progress[i.id].date ? fmtDate(progress[i.id].date) : ''));
    });
    y += 4;
  });

  sectionRule();
  ['especialidade','insignia'].forEach(kind=>{
    heading((kind === 'insignia' ? 'Insígnias' : 'Especialidades') + ' aprovadas', 15);
    let any = false;
    catalogAreas(kind).forEach(area=>{
      const done = area.items.filter(i=> isApproved(kind, i.id));
      if(!done.length) return;
      any = true;
      heading(area.name, 12);
      done.forEach(i=>{ const x = subOf(kind, i.id); bulletLine(i.text, x.item_date ? fmtDate(x.item_date) : ''); });
      y += 4;
    });
    if(!any) subtext('Nenhuma ' + (kind === 'insignia' ? 'insígnia' : 'especialidade') + ' aprovada ainda.');
  });

  const PDF_NAME = 'progressao-senior-resumo.pdf';
  if(IS_NATIVE_APP){ savePdfNative(doc, PDF_NAME); return; }
  doc.save(PDF_NAME);
}

// No app Android o WebView não baixa arquivos: grava o PDF e abre o menu de compartilhar
async function savePdfNative(doc, fileName){
  try{
    const { Filesystem, Share } = window.Capacitor.Plugins;
    const base64 = doc.output('datauristring').split(',')[1];
    const res = await Filesystem.writeFile({ path: fileName, data: base64, directory: 'CACHE' });
    await Share.share({ title: 'Resumo da Progressão — ' + RAMO.name, files: [res.uri], dialogTitle: 'Salvar ou enviar o PDF' });
  }catch(err){
    if(err && /cancel/i.test(String(err.message || err))) return;
    console.error('Erro ao salvar PDF', err);
    alert('Não consegui salvar o PDF neste aparelho.');
  }
}

// =====================================================================
//  Conta (login obrigatório) e patrulha
// =====================================================================
let authMode = 'in'; // 'in' = entrar | 'up' = criar conta
let authBusy = false;
let codeCheck = { code:'', valid:false, patrol:'', role:'' };

function setMsgEl(id, text, type){
  const el = $(id);
  el.textContent = text || '';
  el.classList.remove('auth-msg-error','auth-msg-ok','auth-msg-info');
  if(text) el.classList.add('auth-msg-' + (type || 'info'));
}
function setAuthMsg(text, type){ setMsgEl('authError', text, type); }
function validEmail(e){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }
function normCode(c){ return (c||'').toUpperCase().replace(/[^A-Z0-9]/g, ''); }

function pwScore(p){
  if(!p || p.length < 8) return 0;
  let s = 1;
  if(p.length >= 12) s++;
  if(/[a-z]/.test(p) && /[A-Z]/.test(p)) s++;
  if(/\d/.test(p)) s++;
  if(/[^A-Za-z0-9]/.test(p)) s++;
  return Math.min(s, 4);
}

function authErrorPt(err){
  const m = ((err && err.message) || '').toLowerCase();
  const code = (err && err.code) || '';
  if(m.includes('codigo_patrulha_invalido') || m.includes('database error saving new user')) return 'Código de patrulha inválido. Confira com o seu monitor ou chefe.';
  if(m.includes('apenas_monitor')) return 'Só o monitor da patrulha pode fazer isso.';
  if(m.includes('apenas_chefe')) return 'Só o chefe do ramo pode fazer isso.';
  if(m.includes('nome_obrigatorio')) return 'Digite o nome da patrulha.';
  if(m.includes('nao_pode_remover_a_si_mesmo')) return 'Você não pode remover a si mesmo.';
  if(m.includes('invalid login credentials')) return 'E-mail ou senha incorretos.';
  if(m.includes('user already registered') || code === 'user_already_exists') return 'Este e-mail já tem conta. Toque em "Entrar".';
  if(m.includes('email not confirmed')) return 'Confirme seu e-mail primeiro (veja a caixa de entrada e o spam).';
  if(m.includes('rate limit') || m.includes('too many') || code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit') return 'Muitas tentativas. Aguarde alguns minutos e tente de novo.';
  if(m.includes('should be different')) return 'A nova senha precisa ser diferente da anterior.';
  if(m.includes('password should be') || m.includes('weak')) return 'Senha fraca. Use pelo menos 8 caracteres, misturando letras e números.';
  if(m.includes('invalid format') || m.includes('unable to validate email')) return 'E-mail inválido. Confira o endereço.';
  if(m.includes('failed to fetch') || m.includes('network') || m.includes('load failed')) return 'Sem conexão com o servidor. Verifique a internet e tente de novo.';
  return 'Não foi possível concluir: ' + ((err && err.message) || 'tente de novo') + '.';
}

function showScreen(name){
  ['bootScreen','ramoScreen','authScreen','patrolScreen','appScreen'].forEach(id=>{ $(id).hidden = id !== name + 'Screen'; });
  window.scrollTo({ top:0 });
}

function setAuthMode(mode){
  authMode = mode;
  const up = mode === 'up';
  $('authTabIn').classList.toggle('active', !up);
  $('authTabUp').classList.toggle('active', up);
  $('authEyebrow').textContent = chiefMode ? 'Área de chefes' : 'Progressão pessoal';
  $('authTitle').textContent = chiefMode ? 'Login de chefes' : RAMO.name;
  $('authSub').textContent = chiefMode
    ? (up ? 'Crie sua conta de chefe com o código de chefe do seu ramo.' : 'Entre com a sua conta de chefe para acompanhar as patrulhas do ramo.')
    : (up ? 'Crie sua conta com o código da sua ' + RAMO.grupo + '.' : 'Entre com a sua conta para acompanhar sua progressão.');
  $('authCodeLabel').textContent = chiefMode ? 'Código de chefe' : 'Código da ' + RAMO.grupo;
  $('authCode').placeholder = chiefMode ? 'ABCD2345' : 'ABC123';
  $('authTabUp').textContent = chiefMode ? 'Criar conta de chefe' : 'Criar conta';
  $('authBack').textContent = chiefMode ? '← Voltar' : '← Trocar de ramo';
  if(normCode($('authCode').value).length < 4) resetCodeHint();
  $('signupFields').hidden = !up;
  $('pw2Field').hidden = !up;
  $('pwStrengthBox').hidden = !up;
  $('authForgot').hidden = up;
  $('authSubmit').textContent = up ? (chiefMode ? 'Criar conta de chefe' : 'Criar conta') : 'Entrar';
  $('authPassword').setAttribute('autocomplete', up ? 'new-password' : 'current-password');
  setAuthMsg('');
  updatePwStrength();
}

function updatePwStrength(){
  const bar = $('pwBar'), label = $('pwLabel');
  const p = $('authPassword').value;
  if(authMode !== 'up' || !p){ bar.style.width = '0'; bar.className = 'pw-strength-bar'; label.textContent = ''; return; }
  const s = pwScore(p);
  bar.style.width = (p.length < 8 ? 12 : s * 25) + '%';
  bar.className = 'pw-strength-bar strength-' + s;
  label.textContent = ['Muito curta (mín. 8)', 'Fraca', 'Razoável', 'Boa', 'Forte'][s];
}

function setAuthBusy(busy, label){
  authBusy = busy;
  $('authSubmit').disabled = busy;
  ['authTabIn','authTabUp','authForgot'].forEach(id=>{ $(id).disabled = busy; });
  $('authSubmit').textContent = (busy && label) ? label : (authMode === 'up' ? (chiefMode ? 'Criar conta de chefe' : 'Criar conta') : 'Entrar');
}

function codeHintDefault(){
  return chiefMode ? 'Peça o código de chefe a quem administra o app no seu grupo.' : 'Peça o código ao ' + RAMO.lider + ' ou ao chefe da sua ' + RAMO.secao + '.';
}
function resetCodeHint(){
  codeCheck = { code:'', valid:false };
  $('authCodeHint').className = 'field-hint';
  $('authCodeHint').textContent = codeHintDefault();
}

// Primeira tela: escolher o ramo (ou entrar como chefe)
function showRamoScreen(){
  chiefMode = false;
  applyTheme(null);
  showScreen('ramo');
}
function showAuth(){
  if(!sb){
    showScreen('auth');
    $('authConfigMissing').hidden = false;
    $('authForm').hidden = true;
    $('authBack').hidden = true;
    return;
  }
  if(!chiefMode && !chosenRamo){ showRamoScreen(); return; }
  if(chiefMode) applyTheme(null); else setRamo(chosenRamo);
  showScreen('auth');
  setAuthMode(authMode);
}
document.querySelectorAll('[data-ramo-pick]').forEach(b=> b.addEventListener('click', ()=>{
  chiefMode = false;
  rememberRamo(b.getAttribute('data-ramo-pick'));
  authMode = 'in';
  showAuth();
}));
$('chiefLoginBtn').addEventListener('click', ()=>{
  chiefMode = true;
  authMode = 'in';
  showAuth();
});
$('authBack').addEventListener('click', ()=>{
  if(authBusy) return;
  rememberRamo(null);
  $('authCode').value = '';
  setAuthMsg('');
  showRamoScreen();
});

// Confere o código da patrulha enquanto a pessoa digita
let codeTimer = null;
async function checkCode(raw){
  const code = normCode(raw);
  const hint = $('authCodeHint');
  hint.className = 'field-hint';
  if(code.length < 4){
    resetCodeHint();
    codeCheck.code = code;
    return codeCheck;
  }
  hint.textContent = 'Conferindo…';
  try{
    const { data, error } = await sb.rpc('check_patrol_code', { p_code: code });
    if(normCode($('authCode').value) !== code) return codeCheck; // a pessoa já digitou outra coisa
    if(error) throw error;
    const row = (data || [])[0];
    const bad = (msg)=>{ codeCheck = { code, valid:false, msg }; hint.className = 'field-hint error'; hint.textContent = msg; };
    if(!row){
      bad('Código não encontrado. Confira as letras e números.');
    } else if(chiefMode && row.role !== 'chefe'){
      bad('Este não é um código de chefe. Para entrar numa patrulha, volte e escolha o seu ramo.');
    } else if(!chiefMode && row.role === 'chefe'){
      bad('Este é um código de chefe. Volte e toque em "Login de chefes".');
    } else if(!chiefMode && row.ramo !== chosenRamo){
      bad('Este código é do ' + RAMOS[row.ramo].name + '. Volte e escolha esse ramo.');
    } else {
      codeCheck = { code, valid:true, patrol:row.patrol_name, role:row.role, ramo:row.ramo };
      hint.className = 'field-hint ' + (row.role === 'membro' ? 'ok' : 'monitor');
      hint.textContent = row.role === 'chefe' ? '✓ Chefe do ' + RAMOS[row.ramo].name
        : '✓ ' + cap(RAMOS[row.ramo].grupo) + ' ' + row.patrol_name + (row.role === 'monitor' ? ' — você entrará como ' + RAMOS[row.ramo].lider : '');
    }
  }catch(err){
    codeCheck = { code, valid:false, error:true };
    hint.className = 'field-hint error';
    hint.textContent = authErrorPt(err);
  }
  return codeCheck;
}
$('authCode').addEventListener('input', (e)=>{
  clearTimeout(codeTimer);
  setAuthMsg('');
  codeTimer = setTimeout(()=> checkCode(e.target.value), 400);
});

function redirectUrl(){
  return IS_NATIVE_APP ? PUBLIC_SITE_URL : (location.origin + location.pathname);
}

async function submitAuth(e){
  if(e) e.preventDefault();
  if(authBusy || !sb) return;
  const email = $('authEmail').value.trim();
  const password = $('authPassword').value;

  if(authMode === 'in'){
    if(!validEmail(email)){ setAuthMsg('Digite um e-mail válido.', 'error'); return; }
    if(!password){ setAuthMsg('Digite sua senha.', 'error'); return; }
    setAuthBusy(true, 'Entrando…'); setAuthMsg('');
    try{
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if(error){ setAuthMsg(authErrorPt(error), 'error'); return; }
      $('authPassword').value = '';
      await enterAs(data.user);
    }catch(err){ setAuthMsg(authErrorPt(err), 'error'); }
    finally{ setAuthBusy(false); }
    return;
  }

  // Criar conta
  const name = $('authName').value.trim();
  const password2 = $('authPassword2').value;
  if(name.length < 2){ setAuthMsg('Digite o seu nome.', 'error'); $('authName').focus(); return; }
  const code = normCode($('authCode').value);
  if(!code){ setAuthMsg(chiefMode ? 'Digite o código de chefe.' : 'Digite o código da ' + RAMO.grupo + '.', 'error'); $('authCode').focus(); return; }
  if(!validEmail(email)){ setAuthMsg('Digite um e-mail válido.', 'error'); return; }
  if(password.length < 8){ setAuthMsg('A senha precisa ter pelo menos 8 caracteres.', 'error'); return; }
  if(password !== password2){ setAuthMsg('As senhas não coincidem.', 'error'); return; }

  setAuthBusy(true, 'Conferindo código…'); setAuthMsg('');
  try{
    const check = (codeCheck.code === code && codeCheck.valid) ? codeCheck : await checkCode(code);
    if(!check.valid){ setAuthMsg(check.error ? 'Não consegui conferir o código. Verifique a internet.' : (check.msg || 'Código inválido. Confira com o seu monitor ou chefe.'), 'error'); return; }
    setAuthBusy(true, 'Criando conta…');
    const { data, error } = await sb.auth.signUp({
      email, password,
      options: { data: { full_name: name, patrol_code: code }, emailRedirectTo: redirectUrl() }
    });
    if(error){ setAuthMsg(authErrorPt(error), 'error'); return; }
    if(data.session){
      await enterAs(data.user);
      showToast(check.role === 'chefe' ? 'Conta de chefe criada ✓' : 'Conta criada ✓ Bem-vindo à ' + RAMOS[check.ramo].grupo + ' ' + check.patrol + '!');
    } else if(data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0){
      setAuthMode('in');
      setAuthMsg('Este e-mail já tem conta. Digite sua senha e toque em Entrar.', 'info');
    } else {
      setAuthMode('in');
      $('authPassword').value = '';
      $('authPassword2').value = '';
      setAuthMsg('Conta criada! Enviamos um e-mail de confirmação para ' + email + '. Confirme e depois toque em Entrar.', 'ok');
    }
  }catch(err){ setAuthMsg(authErrorPt(err), 'error'); }
  finally{ setAuthBusy(false); }
}

$('authForm').addEventListener('submit', submitAuth);
$('authTabIn').addEventListener('click', ()=>{ if(!authBusy) setAuthMode('in'); });
$('authTabUp').addEventListener('click', ()=>{ if(!authBusy) setAuthMode('up'); });
$('authPassword').addEventListener('input', updatePwStrength);

document.querySelectorAll('.pw-toggle').forEach(b=>{
  b.addEventListener('click', ()=>{
    const t = $(b.getAttribute('data-target'));
    const show = t.type === 'password';
    t.type = show ? 'text' : 'password';
    b.textContent = show ? '🙈' : '👁';
    b.setAttribute('aria-label', show ? 'Ocultar senha' : 'Mostrar senha');
  });
});

$('authForgot').addEventListener('click', async ()=>{
  if(authBusy || !sb) return;
  const email = $('authEmail').value.trim();
  if(!validEmail(email)){ setAuthMsg('Digite seu e-mail acima e toque de novo em "Esqueci minha senha".', 'error'); return; }
  setAuthBusy(true, 'Enviando…'); setAuthMsg('');
  try{
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: redirectUrl() });
    if(error) setAuthMsg(authErrorPt(error), 'error');
    else setAuthMsg('Pronto! Enviamos um link para ' + email + '. Abra o e-mail para criar uma nova senha.', 'ok');
  }catch(err){ setAuthMsg(authErrorPt(err), 'error'); }
  finally{ setAuthBusy(false); }
});

$('recoverySave').addEventListener('click', async ()=>{
  const pw = $('recoveryPassword').value;
  if(pw.length < 8){ setMsgEl('recoveryError', 'A senha precisa ter pelo menos 8 caracteres.', 'error'); return; }
  setMsgEl('recoveryError', 'Salvando…', 'info');
  try{
    const { data, error } = await sb.auth.updateUser({ password: pw });
    if(error){ setMsgEl('recoveryError', authErrorPt(error), 'error'); return; }
    closeModal('recoveryModal');
    $('recoveryPassword').value = '';
    setMsgEl('recoveryError', '');
    showToast('Senha alterada ✓');
    if(!currentUser) await enterAs(data.user);
  }catch(err){ setMsgEl('recoveryError', authErrorPt(err), 'error'); }
});

// ---------- Perfil ----------
// Devolve o perfil, null se a conta não tem perfil, ou undefined se não deu para consultar (sem internet)
async function fetchProfile(){
  try{
    const { data, error } = await sb.rpc('get_my_profile');
    if(error) throw error;
    return (data && data[0]) || null;
  }catch(err){
    console.error('Erro ao carregar perfil', err);
    return undefined;
  }
}

let entering = false;
async function enterAs(user){
  if(entering) return;
  entering = true;
  try{
    currentUser = user;
    adoptLegacyData();
    progress = readJSON(STORAGE_KEY, {});
    specProgress = readJSON(SPEC_STORAGE_KEY, {});
    subs = Object.assign({ especialidade:{}, insignia:{} }, readJSON(SUBS_KEY, {}));
    notes = readJSON(NOTES_STORAGE_KEY, []);

    let p = await fetchProfile();
    if(p === undefined) p = readJSON(PROFILE_KEY, null); // offline: usa o último perfil conhecido
    profile = p;
    if(profile){
      if(!RAMOS[profile.ramo]) profile.ramo = 'senior';
      setRamo(profile.ramo);
      rememberRamo(profile.ramo);
    }
    chiefMode = false;
    if(!profile || (!profile.patrol_id && profile.role !== 'chefe')){
      showScreen('patrol');
      $('patrolCode').value = '';
      setMsgEl('patrolError', profile ? 'Você não está em nenhuma patrulha no momento.' : '', 'info');
      return;
    }
    writeJSON(PROFILE_KEY, profile);
    showApp();
    syncFromCloudAfterLogin();
  } finally { entering = false; }
}

function showApp(){
  showScreen('app');
  updateAccountUI();
  const chief = isChief();
  $('appScreen').setAttribute('data-role', profile.role);
  ['tabProgressaoBtn','tabEspecialidadesBtn','tabInsigniasBtn','tabEvolucaoBtn'].forEach(id=>{ $(id).hidden = chief; });
  $('tabPatrulhaBtn').hidden = !isLeader();
  $('tabPatrulhaBtn').querySelector('.tab-label').textContent = cap(chief ? RAMO.secao : RAMO.grupo);
  if(chief && currentTab !== 'notas') currentTab = 'patrulha';
  render();
  renderSpecialidades();
  renderNotes();
  showTab(currentTab);
  updatePatrolBadge();
  refreshNotifButtons();
  startRealtime();
  refreshPending(true);
}

function updateAccountUI(){
  const name = (profile && profile.full_name) || (currentUser && currentUser.email) || '';
  const isMon = profile && profile.role === 'monitor';
  $('accountAvatar').textContent = initials(name);
  $('accountAvatar').classList.toggle('monitor', isLeader());
  $('accountName').textContent = firstName(name) || 'Conta';
  $('headerEyebrow').textContent = isChief() ? 'Chefe · ' + cap(RAMO.secao)
    : profile && profile.patrol_name ? cap(RAMO.grupo) + ' ' + profile.patrol_name + (isMon ? ' · ' + cap(RAMO.lider) : '')
    : 'Progressão pessoal';
}

function resetState(){
  currentUser = null; profile = null;
  progress = {}; specProgress = {}; notes = []; subs = { especialidade:{}, insignia:{} };
  stopRealtime(); pendingSubs = []; updatePatrolBadge();
  patrolData = null; currentTab = 'progressao'; monitorCodeVisible = false;
  authMode = 'in'; chiefMode = false; patrolFilter = '';
  $('appScreen').removeAttribute('data-role');
  ['authName','authCode','authEmail','authPassword','authPassword2','searchProgressao','searchEspecialidades'].forEach(id=>{ $(id).value = ''; });
  searchQueryProgressao = ''; searchQueryEspecialidades = ''; searchQueryInsignias = '';
  $('searchInsignias').value = '';
  resetCodeHint();
}

async function signOutUser(){
  try{ await sb.auth.signOut(); }catch(err){ console.error(err); }
  resetState();
  closeModal('accountModal');
  showAuth();
  showToast('Você saiu da conta');
}

$('patrolForm').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const code = normCode($('patrolCode').value);
  if(!code){ setMsgEl('patrolError', 'Digite o código da patrulha.', 'error'); return; }
  $('patrolSubmit').disabled = true;
  setMsgEl('patrolError', 'Conferindo…', 'info');
  try{
    const { error } = await sb.rpc('join_patrol', { p_code: code });
    if(error) throw error;
    setMsgEl('patrolError', '');
    await enterAs(currentUser);
  }catch(err){ setMsgEl('patrolError', authErrorPt(err), 'error'); }
  finally{ $('patrolSubmit').disabled = false; }
});
$('patrolSignOut').addEventListener('click', signOutUser);

// ---------- Minha conta ----------
$('accountBtn').addEventListener('click', ()=>{
  const name = (profile && profile.full_name) || '';
  $('accountAvatarLg').textContent = initials(name || (currentUser && currentUser.email));
  $('accountAvatarLg').classList.toggle('monitor', isLeader());
  $('accountTitle').textContent = name || 'Sua conta';
  $('accountEmail').textContent = currentUser ? currentUser.email : '';
  $('accountPatrol').innerHTML = isChief()
    ? escapeHtml(RAMO.name) + ' <span class="badge badge-monitor">Chefe</span>'
    : profile && profile.patrol_name
      ? escapeHtml(profile.patrol_name) + ' · ' + escapeHtml(RAMO.name) + ' <span class="badge ' + (profile.role === 'monitor' ? 'badge-monitor' : '') + '">' + (profile.role === 'monitor' ? cap(RAMO.lider) : 'Membro') + '</span>'
      : '—';
  $('accountNameInput').value = name;
  $('accountCodeInput').value = '';
  setMsgEl('accountMsg', '');
  $('deleteAccountBtn').textContent = 'Excluir minha conta';
  openModal('accountModal');
});

$('accountNameSave').addEventListener('click', async ()=>{
  const name = $('accountNameInput').value.trim();
  if(name.length < 2){ setMsgEl('accountMsg', 'Digite o seu nome.', 'error'); return; }
  try{
    const { error } = await sb.rpc('set_my_name', { p_name: name });
    if(error) throw error;
    profile.full_name = name;
    writeJSON(PROFILE_KEY, profile);
    updateAccountUI();
    $('accountTitle').textContent = name;
    $('accountAvatarLg').textContent = initials(name);
    setMsgEl('accountMsg', 'Nome salvo ✓', 'ok');
  }catch(err){ setMsgEl('accountMsg', authErrorPt(err), 'error'); }
});

$('accountCodeSave').addEventListener('click', async (e)=>{
  const btn = e.currentTarget;
  const code = normCode($('accountCodeInput').value);
  if(!code){ setMsgEl('accountMsg', 'Digite o código da nova patrulha.', 'error'); return; }
  if(!armButton('change-patrol', btn, 'Confirmar')) {
    setMsgEl('accountMsg', 'Toque em "Confirmar" para trocar de patrulha. Seu progresso continua com você.', 'info');
    return;
  }
  try{
    const { data, error } = await sb.rpc('join_patrol', { p_code: code });
    if(error) throw error;
    const row = (data || [])[0] || {};
    btn.textContent = 'Entrar';
    closeModal('accountModal');
    patrolData = null;
    await enterAs(currentUser);
    showToast(row.role === 'chefe' ? 'Agora você é chefe do ' + RAMOS[row.ramo].name + ' ✓' : 'Agora você está na ' + RAMOS[row.ramo].grupo + ' ' + (row.patrol_name || '') + ' ✓');
  }catch(err){ setMsgEl('accountMsg', authErrorPt(err), 'error'); }
});

$('signOutBtn').addEventListener('click', signOutUser);

$('deleteAccountBtn').addEventListener('click', async (e)=>{
  if(!armButton('delete-account', e.currentTarget, 'Toque de novo para excluir PARA SEMPRE')) return;
  try{
    // Apaga os arquivos de relatório antes (o banco não apaga o Storage sozinho)
    const paths = ['especialidade','insignia'].flatMap(k=> Object.values(subs[k] || {}).flatMap(x=> (x.files || []).map(f=> f.path)));
    if(paths.length) await sb.storage.from(BUCKET).remove(paths);
    const { error } = await sb.rpc('delete_my_account');
    if(error) throw error;
    clearLocalForUser();
    try{ await sb.auth.signOut({ scope:'local' }); }catch(err){}
    resetState();
    closeModal('accountModal');
    showAuth();
    showToast('Conta excluída');
  }catch(err){ setMsgEl('accountMsg', authErrorPt(err), 'error'); }
});

// ---------- Sincronização com a nuvem ----------
const PAGE = 1000; // o Supabase devolve no máximo 1000 linhas por consulta
async function fetchAll(makeQuery){
  const out = [];
  for(let from = 0; ; from += PAGE){
    const { data, error } = await makeQuery().range(from, from + PAGE - 1);
    if(error) throw error;
    out.push(...(data || []));
    if(!data || data.length < PAGE) break;
  }
  return out;
}

async function upsertCloud(kind, itemId, p){
  if(!sb || !currentUser) return;
  try{
    const { error } = await sb.from('senior_progress').upsert({
      user_id: currentUser.id,
      kind,
      item_id: itemId,
      checked: kind === 'progressao' ? !!p.checked : false,
      item_date: kind === 'progressao' ? (p.date || null) : null,
      notes: kind === 'especialidade' ? (p.notes || null) : null,
      // especialidades/insígnias agora são marcadas pelo envio com relatório (tabela submissions)
      updated_at: new Date(p.u || Date.now()).toISOString()
    });
    if(error) throw error;
  }catch(err){ console.error('Erro ao sincronizar com a nuvem', err); }
}

async function deleteCloudKind(kind){
  if(!sb || !currentUser) return;
  try{
    const { error } = await sb.from('senior_progress').delete().eq('user_id', currentUser.id).eq('kind', kind);
    if(error) throw error;
  }catch(err){ console.error('Erro ao apagar na nuvem', err); showToast('Apagado no aparelho, mas não na nuvem (sem internet?)'); }
}

async function upsertCloudNote(n){
  if(!sb || !currentUser) return;
  try{
    const { error } = await sb.from('senior_notes').upsert({
      user_id: currentUser.id, note_id: n.id, title: n.title, body: n.body,
      updated_at: new Date(n.updated).toISOString()
    });
    if(error) throw error;
  }catch(err){ console.error('Erro ao sincronizar nota', err); }
}

async function deleteCloudNote(id){
  if(!sb || !currentUser) return;
  try{
    const { error } = await sb.from('senior_notes').delete().eq('user_id', currentUser.id).eq('note_id', id);
    if(error) throw error;
  }catch(err){ console.error('Erro ao apagar nota na nuvem', err); }
}

// Junta o que está no aparelho com o que está na nuvem: vale a versão alterada por último
async function syncFromCloudAfterLogin(){
  if(!sb || !currentUser) return;
  const uid = currentUser.id;
  let rows;
  try{
    rows = await fetchAll(()=> sb.from('senior_progress').select('kind, item_id, checked, item_date, notes, updated_at').eq('user_id', uid).order('item_id'));
  }catch(err){ console.error('Sem conexão para sincronizar', err); return; }
  if(!currentUser || currentUser.id !== uid) return; // trocou de conta no meio

  const merged = { progressao: { ...progress }, especialidade: { ...specProgress } };
  const seen = { progressao: new Set(), especialidade: new Set() };
  const pushes = [];
  rows.forEach(r=>{
    const target = merged[r.kind];
    if(!target) return;
    seen[r.kind].add(r.item_id);
    const cloudU = new Date(r.updated_at).getTime();
    const local = target[r.item_id];
    if(local && local.u && local.u > cloudU){
      pushes.push([r.kind, r.item_id, local]);
    } else {
      target[r.item_id] = { checked: !!r.checked, date: r.item_date || '', notes: r.notes || '', u: cloudU };
    }
  });
  ['progressao','especialidade'].forEach(kind=>{
    Object.entries(merged[kind]).forEach(([id, p])=>{ if(!seen[kind].has(id)) pushes.push([kind, id, p]); });
  });

  progress = merged.progressao;
  specProgress = merged.especialidade;
  save();
  specSave();
  render();
  renderSpecialidades();
  fetchOwnSubs(true);
  for(const [kind, id, p] of pushes) await upsertCloud(kind, id, p);
  await syncNotesFromCloud(uid);
}

async function syncNotesFromCloud(uid){
  let data;
  try{
    data = await fetchAll(()=> sb.from('senior_notes').select('note_id, title, body, updated_at').eq('user_id', uid).order('note_id'));
  }catch(err){ console.error(err); return; }
  if(!currentUser || currentUser.id !== uid) return;
  const map = {};
  notes.forEach(n=> map[n.id] = n);
  const cloudIds = new Set();
  const deleted = getDeletedNotes();
  for(const r of data){
    if(deleted.includes(r.note_id)){ await deleteCloudNote(r.note_id); continue; }
    cloudIds.add(r.note_id);
    const t = new Date(r.updated_at).getTime();
    const l = map[r.note_id];
    if(!l || t > l.updated) map[r.note_id] = { id:r.note_id, title:r.title||'', body:r.body||'', updated:t };
    else if(l.updated > t) await upsertCloudNote(l);
  }
  for(const n of Object.values(map)){ if(!cloudIds.has(n.id)) await upsertCloudNote(n); }
  notes = Object.values(map);
  notesSaveLocal();
  renderNotes();
}

// =====================================================================
//  Painel do monitor
// =====================================================================
let patrolData = null;      // { codes, members: [...] , loadedAt }
let monitorCodeVisible = false;

function memberSummary(m){
  const { done: blocks, total: blocksTotal } = countBlocksCompleted(m.prog);
  const ids = allItemIds();
  const items = ids.filter(id=> isDone(m.prog, id)).length;
  const specs = approvedCount('especialidade', m.subs);
  const insigs = approvedCount('insignia', m.subs);
  const pending = pendingCountOf('especialidade', m.subs) + pendingCountOf('insignia', m.subs);
  const dates = collectDone(m.prog, m.subs).map(d=> d.date).sort();
  const last = dates.length ? dates[dates.length-1] : null;
  const recent30 = dates.filter(d=> daysSince(d) <= 30).length;
  return {
    blocks, blocksTotal, items, itemsTotal: ids.length,
    pct: Math.round(items / ids.length * 100),
    specs, insigs, pending, last, recent30, stage: currentStage(blocks, m.prog)
  };
}

async function loadPatrol(force){
  if(!sb || !isLeader()) return;
  if(patrolData && !force && Date.now() - patrolData.loadedAt < 60000){ renderPatrol(); return; }
  if(!patrolData) $('memberList').innerHTML = '<div class="loading">Carregando a patrulha…</div>';
  $('patrolRefresh').disabled = true;
  try{
    const chief = isChief();
    const cols = 'user_id, full_name, role, patrol_id, created_at';
    const [codesRes, profRes] = await Promise.all([
      chief ? sb.rpc('get_ramo_patrols') : sb.rpc('get_patrol_codes'),
      chief ? sb.from('profiles').select(cols).eq('ramo', profile.ramo).neq('role', 'chefe')
            : sb.from('profiles').select(cols).eq('patrol_id', profile.patrol_id)
    ]);
    if(codesRes.error) throw codesRes.error;
    if(profRes.error) throw profRes.error;
    const people = profRes.data || [];
    const ids = people.map(p=> p.user_id);
    const [rows, subRows] = ids.length ? await Promise.all([
      fetchAll(()=> sb.from('senior_progress')
        .select('user_id, kind, item_id, item_date')
        .in('user_id', ids).eq('kind', 'progressao').eq('checked', true).order('user_id').order('item_id')),
      fetchAll(()=> sb.from('submissions')
        .select('id, user_id, kind, item_id, item_date, report, files, status, review_note, reviewed_at, submitted_at')
        .in('user_id', ids).order('submitted_at'))
    ]) : [[], []];
    const byUser = {};
    const patrols = chief ? (codesRes.data || []) : null;
    const patrolNames = {};
    (patrols || []).forEach(p=>{ patrolNames[p.patrol_id] = p.patrol_name; });
    people.forEach(p=>{ byUser[p.user_id] = { id:p.user_id, name:p.full_name || 'Sem nome', role:p.role, isMe: p.user_id === currentUser.id, joined:p.created_at, patrolId:p.patrol_id, patrolName: patrolNames[p.patrol_id] || '', prog:{}, subs:{ especialidade:{}, insignia:{} } }; });
    rows.forEach(r=>{
      const m = byUser[r.user_id];
      if(m) m.prog[r.item_id] = { checked:true, date: r.item_date || '' };
    });
    subRows.forEach(r=>{
      const m = byUser[r.user_id];
      if(m && m.subs[r.kind]) m.subs[r.kind][r.item_id] = r;
    });
    pendingSubs = subRows.filter(r=> r.status === 'enviada' && byUser[r.user_id]);
    updatePatrolBadge();
    const members = Object.values(byUser);
    members.forEach(m=> m.sum = memberSummary(m));
    patrolData = { codes: chief ? null : ((codesRes.data || [])[0] || null), patrols, members, loadedAt: Date.now() };
    renderPatrol();
  }catch(err){
    console.error(err);
    if(!patrolData) $('memberList').innerHTML = '<div class="empty-state">Não consegui carregar a patrulha. ' + escapeHtml(authErrorPt(err)) + '</div>';
    else showToast('Sem conexão — mostrando os últimos dados');
  }finally{
    $('patrolRefresh').disabled = false;
  }
}

let patrolFilter = '';   // chefe: id da patrulha escolhida no filtro ('' = todas)

function renderPatrol(){
  if(!patrolData) return;
  const { codes, patrols } = patrolData;
  const chief = isChief();
  const G = RAMO.grupo;
  $('patrolEyebrow').textContent = chief ? 'Painel do chefe' : 'Painel do ' + RAMO.lider;
  $('inviteCard').hidden = chief;
  $('patrolsCard').hidden = !chief;
  $('patrolFilter').hidden = !chief;

  let members = patrolData.members;
  if(chief){
    if(patrolFilter && !patrols.some(p=> p.patrol_id === patrolFilter)) patrolFilter = '';
    $('patrolFilter').innerHTML = '<option value="">Todas</option>' +
      patrols.map(p=> `<option value="${p.patrol_id}" ${p.patrol_id===patrolFilter?'selected':''}>${escapeHtml(p.patrol_name)}</option>`).join('');
    if(patrolFilter) members = members.filter(m=> m.patrolId === patrolFilter);
    $('patrolTitle').textContent = RAMO.name;
    $('patrolsCard').querySelector('.card-title').textContent = cap(G) + 's do ramo';
    $('newPatrolName').placeholder = 'Nome da nova ' + G;
    $('patrolsList').innerHTML = patrols.length ? patrols.map(p=>{
      const count = patrolData.members.filter(m=> m.patrolId === p.patrol_id).length;
      return `<div class="patrol-line">
        <div class="patrol-line-name">${escapeHtml(p.patrol_name)}<small>${count} ${count===1?'pessoa':'pessoas'}</small></div>
        <div class="patrol-line-codes">
          <span class="mini-code">membros<b>${escapeHtml(p.member_code)}</b></span>
          <span class="mini-code ${monitorCodeVisible?'':'masked'}">${RAMO.lider}<b>${monitorCodeVisible ? escapeHtml(p.monitor_code) : '••••••'}</b></span>
        </div>
      </div>`;
    }).join('') : `<div class="pick-hint" style="text-align:left;padding:2px">Nenhuma ${G} ainda. Crie a primeira abaixo.</div>`;
    $('toggleMonitorCodes').textContent = monitorCodeVisible ? 'Ocultar códigos de ' + RAMO.lider : 'Mostrar códigos de ' + RAMO.lider;
  } else {
    const name = (codes && codes.patrol_name) || profile.patrol_name || '';
    $('patrolTitle').textContent = cap(G) + ' ' + name;
    $('memberCode').textContent = codes ? codes.member_code : '—';
    $('monitorCode').textContent = codes && monitorCodeVisible ? codes.monitor_code : '••••••';
    $('monitorCode').classList.toggle('masked', !monitorCodeVisible);
    $('toggleMonitorCode').textContent = monitorCodeVisible ? 'Ocultar' : 'Mostrar';
  }
  const n = members.length;
  $('patrolSubtitle').textContent = n + (n === 1 ? ' pessoa' : ' pessoas') +
    (chief ? (patrolFilter ? ' na ' + G : ' em ' + patrols.length + ' ' + G + (patrols.length===1?'':'s')) : ' na ' + G) + ' · atualizado às ' +
    new Date(patrolData.loadedAt).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' });

  // Resumo
  const blocksTotal = countBlocksCompleted({}).total;
  const avgBlocks = n ? members.reduce((s,m)=> s + m.sum.blocks, 0) / n : 0;
  const totalSpecs = members.reduce((s,m)=> s + m.sum.specs + m.sum.insigs, 0);
  const active = members.filter(m=> m.sum.last && daysSince(m.sum.last) <= 30).length;
  const stageCount = {};
  members.forEach(m=>{ stageCount[m.sum.stage.label] = (stageCount[m.sum.stage.label]||0) + 1; });
  const topStage = Object.entries(stageCount).sort((a,b)=> b[1]-a[1])[0];
  $('patrolStats').innerHTML =
    `<div class="stat"><div class="n">${avgBlocks.toFixed(1).replace('.', ',')}</div><div class="l">média de blocos (de ${blocksTotal})</div></div>` +
    `<div class="stat"><div class="n">${totalSpecs}</div><div class="l">especialidades e insígnias aprovadas</div></div>` +
    `<div class="stat"><div class="n">${active}/${n}</div><div class="l">ativos nos últimos 30 dias</div></div>` +
    `<div class="stat"><div class="n" style="font-size:22px;padding-top:4px">${topStage ? escapeHtml(topStage[0]) : '—'}</div><div class="l">etapa mais comum</div></div>`;

  renderPendingInbox();

  // Lista
  const sort = $('memberSort').value;
  const list = members.slice().sort((a,b)=>{
    if(sort === 'name') return a.name.localeCompare(b.name, 'pt-BR');
    if(sort === 'recent') return (b.sum.last||'').localeCompare(a.sum.last||'');
    if(sort === 'idle') return (a.sum.last||'').localeCompare(b.sum.last||'');
    return b.sum.blocks - a.sum.blocks || b.sum.items - a.sum.items;
  });
  let empty = '';
  if(chief && !n) empty = `<div class="empty-state">Ninguém por aqui ainda.<br>Crie as ${G}s acima e passe os códigos para os ${RAMO.lider === 'coordenador' ? 'coordenadores' : RAMO.lider + 'es'} e membros.</div>`;
  if(!chief && n <= 1) empty = `<div class="empty-state">Ninguém mais entrou na ${G} ainda.<br>Compartilhe o código de membros acima para convidar a galera.</div>`;
  $('memberList').innerHTML = list.map(memberCard).join('') + empty;
}

function lastLabel(last){
  if(!last) return 'sem atividade';
  const d = daysSince(last);
  if(d <= 0) return 'hoje';
  if(d === 1) return 'ontem';
  if(d < 30) return 'há ' + d + ' dias';
  return fmtDate(last);
}

function memberCard(m){
  const s = m.sum;
  const blocksPct = Math.round(s.blocks / s.blocksTotal * 100);
  return `
    <button class="member" data-member="${m.id}">
      <span class="avatar ${m.role==='monitor'?'monitor':''}">${escapeHtml(initials(m.name))}</span>
      <span class="member-main">
        <span class="member-top">
          <span class="member-name">${escapeHtml(m.name)}</span>
          ${m.role==='monitor' ? '<span class="badge badge-monitor">' + cap(RAMO.lider) + '</span>' : ''}
          ${m.isMe ? '<span class="badge badge-me">Você</span>' : ''}
          ${isChief() ? '<span class="badge badge-patrol">' + escapeHtml(m.patrolName || 'sem ' + RAMO.grupo) + '</span>' : ''}
        </span>
        <span class="member-meta">
          <span>${s.stage.icon} <b>${s.stage.label}</b></span>
          <span><b>${s.blocks}</b>/${s.blocksTotal} blocos</span>
          <span><b>${s.specs}</b> espec. · <b>${s.insigs}</b> insíg.</span>
          ${s.pending ? `<span class="pending-tag">⏳ ${s.pending} para analisar</span>` : ''}
          <span>${lastLabel(s.last)}</span>
        </span>
        <span class="bar-track" style="display:block"><span class="bar-fill" style="display:block;width:${blocksPct}%"></span></span>
      </span>
      <span class="member-chev"></span>
    </button>`;
}

$('memberList').addEventListener('click', (e)=>{
  const b = e.target.closest('[data-member]');
  if(b) openMemberDetail(b.getAttribute('data-member'));
});
$('memberSort').addEventListener('change', renderPatrol);
$('patrolFilter').addEventListener('change', (e)=>{ patrolFilter = e.target.value; renderPatrol(); });
$('toggleMonitorCodes').addEventListener('click', ()=>{ monitorCodeVisible = !monitorCodeVisible; renderPatrol(); });
$('newPatrolBtn').addEventListener('click', async ()=>{
  const name = $('newPatrolName').value.trim();
  if(!name){ showToast('Digite o nome da ' + RAMO.grupo); $('newPatrolName').focus(); return; }
  $('newPatrolBtn').disabled = true;
  try{
    const { error } = await sb.rpc('chief_create_patrol', { p_name: name });
    if(error) throw error;
    $('newPatrolName').value = '';
    showToast(cap(RAMO.grupo) + ' ' + name + ' criada ✓');
    await loadPatrol(true);
  }catch(err){ showToast(authErrorPt(err)); }
  finally{ $('newPatrolBtn').disabled = false; }
});
$('patrolRefresh').addEventListener('click', ()=> loadPatrol(true));

function openMemberDetail(id){
  const m = patrolData && patrolData.members.find(x=> x.id === id);
  if(!m) return;
  const s = m.sum;
  const texts = itemTextMap();

  let eixosHtml = '';
  DATA.forEach(ex=>{
    if(ex.flat){
      const items = ex.blocos[0].items || [];
      const c = items.filter(i=> isDone(m.prog, i.id)).length;
      eixosHtml += `<div class="detail-eixo"><div class="detail-eixo-title">${escapeHtml(ex.name)}<span>${c}/${items.length}</span></div></div>`;
      return;
    }
    const doneBlocks = ex.blocos.filter(b=> blocoComplete(b, m.prog)).length;
    eixosHtml += `<div class="detail-eixo"><div class="detail-eixo-title">${ex.num ? escapeHtml(ex.num) + ' · ' : ''}${escapeHtml(ex.name)}<span>${doneBlocks}/${ex.blocos.length} blocos</span></div>`;
    ex.blocos.forEach(b=>{
      const complete = blocoComplete(b, m.prog);
      const started = !complete && blocoStarted(b, m.prog);
      const short = (b.name || 'Bloco').replace(/^Bloco (\d+) — /, 'B$1 · ');
      const missing = complete ? '' : (started ? 'Falta: ' + blocoMissingDetail(b, m.prog) : 'Não iniciado');
      eixosHtml += `<div class="detail-bloco"><span class="dot ${complete?'ok':(started?'part':'')}"></span><div>${escapeHtml(short)}${missing ? '<small>' + escapeHtml(missing) + '</small>' : ''}</div></div>`;
    });
    eixosHtml += '</div>';
  });

  const recent = collectDone(m.prog, m.subs).sort((a,b)=> b.date.localeCompare(a.date)).slice(0, 8);
  const recentHtml = recent.length
    ? recent.map(d=> `<div class="evo-recent"><span class="d">${fmtDate(d.date)}</span><span class="t" title="${escapeHtml(texts[d.id]||'')}">${escapeHtml(texts[d.id]||d.id)}</span></div>`).join('')
    : '<div class="pick-hint">Nada marcado com data ainda.</div>';

  const subsHtml = (kind)=>{
    const list = Object.values(m.subs[kind]).sort((a,b)=> (b.submitted_at||'').localeCompare(a.submitted_at||''));
    if(!list.length) return '<div class="pick-hint">Nenhum envio ainda.</div>';
    return list.map(x=> `<button class="sub-line" data-review="${x.id}"><span class="sub-chip sub-${STATUS_INFO[x.status].cls}">${STATUS_INFO[x.status].chip}</span><span class="sub-line-name">${escapeHtml(itemName(kind, x.item_id))}</span></button>`).join('');
  };

  $('memberDetail').innerHTML = `
    <div class="account-head">
      <span class="avatar lg ${m.role==='monitor'?'monitor':''}">${escapeHtml(initials(m.name))}</span>
      <div class="who">
        <b>${escapeHtml(m.name)}</b>
        <span>${m.role==='monitor' ? cap(RAMO.lider) : 'Membro'}${isChief() && m.patrolName ? ' · ' + escapeHtml(m.patrolName) : ''} · ${s.stage.icon} ${s.stage.label} · última atividade: ${lastLabel(s.last)}</span>
      </div>
    </div>
    <div class="evo-stats">
      <div class="stat"><div class="n">${s.blocks}/${s.blocksTotal}</div><div class="l">blocos concluídos</div></div>
      <div class="stat"><div class="n">${s.pct}%</div><div class="l">${s.items} de ${s.itemsTotal} itens</div></div>
      <div class="stat"><div class="n">${s.specs} · ${s.insigs}</div><div class="l">especialidades · insígnias aprovadas</div></div>
      <div class="stat"><div class="n">${s.recent30}</div><div class="l">itens nos últimos 30 dias</div></div>
    </div>
    <div class="card"><div class="card-title">Blocos</div>${eixosHtml}</div>
    <div class="card"><div class="card-title">Últimas conquistas</div>${recentHtml}</div>
    <div class="card"><div class="card-title">Especialidades</div>${subsHtml('especialidade')}</div>
    <div class="card"><div class="card-title">Insígnias</div>${subsHtml('insignia')}</div>
    ${m.isMe ? '' : `<div class="danger-zone"><p>Remover tira a pessoa da patrulha. Ela mantém o próprio progresso e pode voltar com o código.</p><button class="btn btn-danger btn-block" id="removeMemberBtn" data-id="${m.id}">Remover da patrulha</button></div>`}
  `;
  const rm = $('removeMemberBtn');
  if(rm) rm.addEventListener('click', async ()=>{
    if(!armButton('remove-' + m.id, rm, 'Toque de novo para remover ' + firstName(m.name))) return;
    try{
      const { error } = await sb.rpc('remove_patrol_member', { p_user: m.id });
      if(error) throw error;
      closeModal('memberModal');
      showToast(firstName(m.name) + ' saiu da patrulha');
      loadPatrol(true);
    }catch(err){ showToast(authErrorPt(err)); }
  });
  openModal('memberModal');
  $('memberModal').querySelector('.modal-box').scrollTop = 0;
}

function inviteText(){
  const c = patrolData && patrolData.codes;
  if(!c) return '';
  return 'Entre na ' + cap(RAMO.grupo) + ' ' + c.patrol_name + ' no app de Progressão do ' + RAMO.name + '!\n' +
    'Crie sua conta com o código: ' + c.member_code +
    (PUBLIC_SITE_URL ? '\n' + PUBLIC_SITE_URL : '');
}
$('copyMemberCode').addEventListener('click', async ()=>{
  const c = patrolData && patrolData.codes;
  if(!c) return;
  showToast(await copyText(c.member_code) ? 'Código copiado ✓' : 'Não consegui copiar');
});
$('shareMemberCode').addEventListener('click', async ()=>{
  const text = inviteText();
  if(!text) return;
  try{
    if(IS_NATIVE_APP && window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Share){
      await window.Capacitor.Plugins.Share.share({ title:'Convite da patrulha', text, dialogTitle:'Enviar convite' });
      return;
    }
    if(navigator.share){ await navigator.share({ title:'Convite da patrulha', text }); return; }
  }catch(err){
    if(err && /cancel|abort/i.test(String(err.name || err.message || err))) return;
  }
  showToast(await copyText(text) ? 'Convite copiado — cole no WhatsApp ✓' : 'Não consegui copiar');
});
$('toggleMonitorCode').addEventListener('click', ()=>{
  monitorCodeVisible = !monitorCodeVisible;
  renderPatrol();
});
$('regenCode').addEventListener('click', async (e)=>{
  const btn = e.currentTarget;
  if(!armButton('regen', btn, 'Toque de novo: o código atual deixa de valer')) return;
  try{
    const { data, error } = await sb.rpc('regenerate_member_code');
    if(error) throw error;
    if(patrolData && patrolData.codes) patrolData.codes.member_code = data;
    renderPatrol();
    btn.textContent = '🔄 Gerar novo código';
    showToast('Novo código: ' + data);
  }catch(err){ showToast(authErrorPt(err)); }
});

// =====================================================================
//  Envios para analisar (monitor) e avisos
// =====================================================================
let pendingSubs = [];   // envios "enviada" da patrulha (para o contador)
let rtChannel = null;
let reviewing = null;   // envio aberto na tela de análise

function updatePatrolBadge(){
  const n = pendingSubs.length;
  const b = $('patrolBadge');
  b.textContent = n > 99 ? '99+' : String(n);
  b.hidden = !n || !isLeader();
}

function findPatrolSub(id){
  if(!patrolData) return null;
  for(const m of patrolData.members){
    for(const kind of ['especialidade','insignia']){
      const x = Object.values(m.subs[kind]).find(s=> s.id === id);
      if(x) return { m, kind, x };
    }
  }
  return null;
}

function renderPendingInbox(){
  const box = $('pendingInbox');
  if(!patrolData){ box.innerHTML = ''; return; }
  const list = [];
  patrolData.members.forEach(m=> ['especialidade','insignia'].forEach(kind=>
    Object.values(m.subs[kind]).forEach(x=>{ if(x.status === 'enviada') list.push({ m, kind, x }); })
  ));
  list.sort((a,b)=> (a.x.submitted_at||'').localeCompare(b.x.submitted_at||''));
  if(!list.length){
    box.innerHTML = '<div class="card inbox-empty"><div class="card-title">Para analisar</div><div class="pick-hint" style="text-align:left;padding:2px">Nenhum envio esperando. Quando alguém mandar o relatório de uma especialidade ou insígnia, ele aparece aqui e você recebe um aviso.</div></div>';
    return;
  }
  box.innerHTML = `<div class="card inbox"><div class="card-title">Para analisar <span class="count-pill">${list.length}</span></div>` +
    list.map(({ m, kind, x })=> `
      <button class="inbox-row" data-review="${x.id}">
        <span class="avatar ${m.role==='monitor'?'monitor':''}">${escapeHtml(initials(m.name))}</span>
        <span class="inbox-main">
          <span class="inbox-title">${escapeHtml(itemName(kind, x.item_id))}</span>
          <span class="inbox-meta">${escapeHtml(firstName(m.name))} · ${KINDS[kind].label} · ${(x.files||[]).length} arquivo${(x.files||[]).length!==1?'s':''} · ${lastLabel((x.submitted_at||'').slice(0,10))}</span>
        </span>
        <span class="member-chev"></span>
      </button>`).join('') + '</div>';
}

document.addEventListener('click', (e)=>{
  const b = e.target.closest('[data-review]');
  if(b) openReview(b.getAttribute('data-review'));
});

async function openReview(id){
  const found = findPatrolSub(id);
  if(!found) return;
  const { m, kind, x } = found;
  reviewing = { id, m, kind };
  const files = x.files || [];
  const images = files.filter(f=> /^image\//.test(f.type || '') || /\.(jpe?g|png|webp|gif)$/i.test(f.name || ''));
  $('reviewBody').innerHTML = `
    <div class="account-head">
      <span class="avatar lg ${m.role==='monitor'?'monitor':''}">${escapeHtml(initials(m.name))}</span>
      <div class="who"><b>${escapeHtml(m.name)}</b><span>${KINDS[kind].label} · enviado ${x.submitted_at ? new Date(x.submitted_at).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' }) : ''}</span></div>
    </div>
    <div class="modal-title">${escapeHtml(itemName(kind, x.item_id))}</div>
    <div class="review-status"><span class="sub-chip sub-${STATUS_INFO[x.status].cls}">${STATUS_INFO[x.status].chip}</span>${x.item_date ? ' <span class="note-date">conquistada em ' + fmtDate(x.item_date) + '</span>' : ''}</div>
    ${x.report ? `<div class="field"><label>Comentário de ${escapeHtml(firstName(m.name))}</label><div class="report-text">${escapeHtml(x.report)}</div></div>` : ''}
    ${images.length ? '<div class="thumbs" id="reviewThumbs">' + images.map(f=> `<button class="thumb file-open" data-path="${escapeHtml(f.path)}"><span class="thumb-ph">🖼️</span></button>`).join('') + '</div>' : ''}
    <div class="field"><label>Relatório e arquivos</label>${filesListHtml(files)}</div>
    ${x.review_note && x.status !== 'enviada' ? `<div class="field"><label>Seu comentário anterior</label><div class="report-text">${escapeHtml(x.review_note)}</div></div>` : ''}
  `;
  $('reviewNote').value = '';
  setMsgEl('reviewMsg', '');
  $('reviewApprove').textContent = x.status === 'aprovada' ? '✓ Já aprovada' : '✓ Aprovar';
  $('reviewApprove').disabled = x.status === 'aprovada';
  openModal('reviewModal');
  $('reviewModal').querySelector('.modal-box').scrollTop = 0;

  // Miniaturas das fotos (links temporários)
  if(images.length){
    try{
      const { data } = await sb.storage.from(BUCKET).createSignedUrls(images.map(f=> f.path), 600);
      (data || []).forEach((d, i)=>{
        const el = document.querySelectorAll('#reviewThumbs .thumb')[i];
        if(el && d && d.signedUrl) el.innerHTML = `<img src="${escapeHtml(d.signedUrl)}" alt="" loading="lazy">`;
      });
    }catch(err){ /* fica o ícone */ }
  }
}

async function decideReview(approve){
  if(!reviewing) return;
  const note = $('reviewNote').value.trim();
  if(!approve && !note){ setMsgEl('reviewMsg', 'Escreva o que precisa ser ajustado para devolver.', 'error'); $('reviewNote').focus(); return; }
  $('reviewApprove').disabled = $('reviewReturn').disabled = true;
  try{
    const { data, error } = await sb.rpc('review_submission', { p_id: reviewing.id, p_approve: approve, p_note: note });
    if(error) throw error;
    const { m, kind } = reviewing;
    m.subs[kind][data.item_id] = data;
    m.sum = memberSummary(m);
    if(m.isMe){ subs[kind][data.item_id] = data; subsSave(); renderCatalog(kind); }
    pendingSubs = pendingSubs.filter(x=> x.id !== data.id);
    updatePatrolBadge();
    closeModal('reviewModal');
    renderPatrol();
    if(!$('memberModal').hidden) openMemberDetail(m.id);
    showToast(approve ? 'Aprovada ✓ ' + firstName(m.name) + ' vai receber o aviso' : 'Devolvida para ' + firstName(m.name) + ' ajustar');
  }catch(err){ setMsgEl('reviewMsg', authErrorPt(err), 'error'); }
  finally{ $('reviewApprove').disabled = $('reviewReturn').disabled = false; }
}
$('reviewApprove').addEventListener('click', ()=> decideReview(true));
$('reviewReturn').addEventListener('click', ()=> decideReview(false));

// ---------- Avisos ----------
const LocalNotif = ()=> (IS_NATIVE_APP && window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications) || null;

async function notifPermission(){
  const ln = LocalNotif();
  if(ln){ try{ return (await ln.checkPermissions()).display; }catch(err){ return 'denied'; } }
  if(!('Notification' in window)) return 'unsupported';
  return Notification.permission; // granted | denied | default
}
async function askNotifPermission(){
  const ln = LocalNotif();
  if(ln){ try{ return (await ln.requestPermissions()).display; }catch(err){ return 'denied'; } }
  if(!('Notification' in window)) return 'unsupported';
  try{ return await Notification.requestPermission(); }catch(err){ return 'denied'; }
}
async function refreshNotifButtons(){
  const st = await notifPermission();
  const label = st === 'granted' ? '🔔 Avisos ativados neste aparelho'
    : st === 'denied' ? '🔕 Avisos bloqueados (libere nas configurações do aparelho)'
    : st === 'unsupported' ? '🔕 Este navegador não mostra avisos'
    : '🔔 Ativar avisos neste aparelho';
  ['notifBtn','notifBtnPatrol'].forEach(id=>{
    const b = $(id);
    b.textContent = label;
    b.disabled = st !== 'default' && st !== 'prompt' && st !== 'prompt-with-rationale';
  });
  $('notifBanner').hidden = !(st === 'default' || st === 'prompt' || st === 'prompt-with-rationale');
}
['notifBtn','notifBtnPatrol'].forEach(id=> $(id).addEventListener('click', async ()=>{
  const st = await askNotifPermission();
  if(st === 'granted') showToast('Avisos ativados ✓');
  refreshNotifButtons();
}));

let notifSeq = 1;
async function notify(title, body, tab){
  showToast(title);
  if(!document.hidden) return; // com o app aberto na tela, o aviso na tela basta
  const ln = LocalNotif();
  try{
    if(ln){
      await ln.schedule({ notifications:[{ id: (Date.now() % 1000000) + (notifSeq++), title, body: body || '', extra:{ tab: tab || '' }, smallIcon:'ic_stat_notify', iconColor:'#C33E58' }] });
      return;
    }
    if(!('Notification' in window) || Notification.permission !== 'granted') return;
    const reg = navigator.serviceWorker && await navigator.serviceWorker.getRegistration();
    if(reg) await reg.showNotification(title, { body, icon:'icon-192.png', badge:'icon-192.png', tag:'envio-' + Date.now(), data:{ tab } });
    else new Notification(title, { body, icon:'icon-192.png' });
  }catch(err){ console.error('Erro ao mostrar aviso', err); }
}
(function(){
  const ln = LocalNotif();
  if(ln && ln.addListener) ln.addListener('localNotificationActionPerformed', (e)=>{
    const tab = e && e.notification && e.notification.extra && e.notification.extra.tab;
    if(tab && currentUser && profile) showTab(tab);
  });
  if(navigator.serviceWorker) navigator.serviceWorker.addEventListener('message', (e)=>{
    if(e.data && e.data.tab && currentUser && profile) showTab(e.data.tab);
  });
})();

// Monitor: novos envios desde a última vez
async function refreshPending(announce){
  if(!sb || !currentUser || !isLeader()) return;
  try{
    const { data, error } = await sb.from('submissions')
      .select('id, user_id, kind, item_id, submitted_at').eq('status', 'enviada').order('submitted_at');
    if(error) throw error;
    pendingSubs = data || [];
    updatePatrolBadge();
    const st = readJSON(NOTIF_KEY, { seen: [] });
    const seen = new Set(st.seen || []);
    const key = (x)=> x.id + '@' + x.submitted_at;
    const fresh = pendingSubs.filter(x=> x.user_id !== currentUser.id && !seen.has(key(x)));
    writeJSON(NOTIF_KEY, Object.assign(st, { seen: pendingSubs.map(key).slice(-500) }));
    if(announce && fresh.length){
      let who = '';
      try{
        const { data: ppl } = await sb.from('profiles').select('user_id, full_name').in('user_id', [...new Set(fresh.map(x=> x.user_id))]);
        const names = {}; (ppl || []).forEach(p=> names[p.user_id] = firstName(p.full_name));
        who = fresh.length === 1
          ? (names[fresh[0].user_id] || 'Alguém') + ' enviou ' + (fresh[0].kind === 'insignia' ? 'a insígnia ' : 'a especialidade ') + itemName(fresh[0].kind, fresh[0].item_id)
          : [...new Set(fresh.map(x=> names[x.user_id]).filter(Boolean))].join(', ') + ' enviaram relatórios';
      }catch(err){}
      notify(fresh.length === 1 ? '📬 Novo envio para analisar' : '📬 ' + fresh.length + ' novos envios para analisar', who, 'patrulha');
      if(currentTab === 'patrulha') loadPatrol(true);
    }
  }catch(err){ /* sem internet: tenta depois */ }
}

// Membro: resultado da análise do monitor
function announceReviewChanges(before, after){
  ['especialidade','insignia'].forEach(kind=>{
    Object.values(after[kind] || {}).forEach(x=>{
      const old = (before[kind] || {})[x.item_id];
      if(!old || old.status !== 'enviada' || x.status === 'enviada') return;
      if(x.status === 'aprovada') notify('🏅 ' + KINDS[kind].label + ' aprovada!', itemName(kind, x.item_id), kind === 'insignia' ? 'insignias' : 'especialidades');
      if(x.status === 'devolvida') notify('↩ ' + KINDS[kind].label + ' devolvida pelo monitor', itemName(kind, x.item_id) + (x.review_note ? ' — ' + x.review_note : ''), kind === 'insignia' ? 'insignias' : 'especialidades');
    });
  });
}

function startRealtime(){
  stopRealtime();
  if(!sb || !currentUser || typeof sb.channel !== 'function') return;
  const uid = currentUser.id;
  rtChannel = sb.channel('envios-' + uid)
    .on('postgres_changes', { event:'*', schema:'public', table:'submissions' }, (payload)=>{
      if(!currentUser || currentUser.id !== uid) return;
      const row = (payload && payload.new && payload.new.id) ? payload.new : null;
      if(row && row.user_id === uid) setTimeout(()=> fetchOwnSubs(true), 0);
      if(isLeader()) setTimeout(()=>{
        refreshPending(true);
        if(currentTab === 'patrulha') loadPatrol(true);
      }, 0);
    })
    .subscribe();
}
function stopRealtime(){
  if(rtChannel && sb){ try{ sb.removeChannel(rtChannel); }catch(err){} }
  rtChannel = null;
}

// Ao voltar para o app (ou a cada 2 minutos com ele aberto), confere se há novidades
function checkForUpdates(){
  if(!currentUser || !profile || !(profile.patrol_id || isChief()) || document.hidden) return;
  refreshPending(true);
  fetchOwnSubs(true);
}
document.addEventListener('visibilitychange', checkForUpdates);
document.addEventListener('resume', checkForUpdates);
setInterval(checkForUpdates, 120000);

// =====================================================================
//  Início
// =====================================================================
async function boot(){
  setRamo(chosenRamo || 'senior');
  if(!sb){ showAuth(); return; }
  sb.auth.onAuthStateChange((event)=>{
    // Não chamar o Supabase aqui dentro (pode travar); só reagir
    if(event === 'PASSWORD_RECOVERY') setTimeout(()=> openModal('recoveryModal'), 0);
    if(event === 'SIGNED_OUT' && currentUser) setTimeout(()=>{ resetState(); showAuth(); }, 0);
  });
  let session = null;
  try{
    const { data } = await sb.auth.getSession();
    session = data && data.session;
  }catch(err){ console.error('Erro ao verificar sessão', err); }
  if(session) await enterAs(session.user);
  else showAuth();
}

boot();

if(CFG.platform === 'web' && 'serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('sw.js').catch(()=>{ /* segue sem SW */ });
  });
}
