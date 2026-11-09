'use strict';
// =====================================================================
//  Progressão Ramo Sênior — lógica do app
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
  [STORAGE_KEY, SPEC_STORAGE_KEY, NOTES_STORAGE_KEY, DELETED_NOTES_KEY, PROFILE_KEY].forEach(k=>{
    try{ localStorage.removeItem(storeKey(k)); }catch(err){}
  });
}

// ---------- Estado ----------
let progress = {};       // { itemId: { checked, date: "YYYY-MM-DD", u: timestamp } }
let specProgress = {};   // { itemId: { checked, date, notes, u } }
let notes = [];          // [{ id, title, body, updated }]
let specNotesOpen = {};
let notesSaveTimers = {};
let openEixos = new Set([DATA[0].id]);
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
  const req = parseVarRequired(b.varLabel);
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
    const req = parseVarRequired(b.varLabel);
    const varDone = (b.variaveis||[]).filter(i=> isDone(prog, i.id)).length;
    if(req != null){
      const missing = Math.max(0, req - varDone);
      if(missing > 0) parts.push(missing + (missing !== 1 ? ' ações variáveis' : ' ação variável') + ' (ou a especialidade "OU")');
    }
  }
  return parts.join(' + ');
}

function nextStageInfo(blocksDone){
  if(blocksDone < 6) return { need:6-blocksDone, label:'Conquista', icon:'🥉' };
  if(blocksDone < 12) return { need:12-blocksDone, label:'Azimute', icon:'🧭' };
  if(blocksDone < 18) return { need:18-blocksDone, label:'Escoteiro da Pátria', icon:'🏆' };
  return null;
}

function currentStage(blocksDone, prog = progress){
  if(blocksDone >= 18 && isDone(prog, 'patria-azimute') && isDone(prog, 'patria-avaliacao')) return { icon:'🏆', label:'Escoteiro da Pátria' };
  if(blocksDone >= 12) return { icon:'🧭', label:'Azimute' };
  if(blocksDone >= 6) return { icon:'🥉', label:'Conquista' };
  return { icon:'🧗', label:'Escalada' };
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
function allSpecIds(){
  const ids = [];
  SPECIALTIES.forEach(area=>{
    area.especialidades.forEach(i=>ids.push(i.id));
    area.insignias.forEach(i=>ids.push(i.id));
  });
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
  SPECIALTIES.forEach(a=>[...a.especialidades, ...a.insignias].forEach(i=>m[i.id]=i.text));
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
  const stage = currentStage(blocksDone);
  const stages = [
    { icon:'🧗', label:'Escalada' },
    { icon:'🥉', label:'Conquista' },
    { icon:'🧭', label:'Azimute' },
    { icon:'🏆', label:'Pátria' }
  ];
  const activeLabel = stage.label === 'Escoteiro da Pátria' ? 'Pátria' : stage.label;
  $('stageRow').innerHTML = stages.map((s,i)=>
    `<span class="stage-pill ${s.label===activeLabel?'active':''}">${s.icon} ${s.label}</span>${i<stages.length-1?'<span class="stage-sep">›</span>':''}`
  ).join('') + `<div class="stage-note">${blocksDone} de ${blocksTotal} blocos concluídos (fixas + variáveis/OU de cada bloco)</div>`;

  renderMissingCard(blocksDone);
}

function renderMissingCard(blocksDone){
  const el = $('missingCard');
  const azimuteDone = isDone(progress, 'patria-azimute');
  const avaliacaoDone = isDone(progress, 'patria-avaliacao');
  if(blocksDone >= 18 && azimuteDone && avaliacaoDone){
    el.innerHTML = '<div class="missing-done">🏆 Você já cumpriu tudo — parabéns, Escoteiro da Pátria!</div>';
    return;
  }
  let pct, label, icon, note;
  if(blocksDone >= 18){
    const extra = (azimuteDone?1:0) + (avaliacaoDone?1:0);
    pct = Math.round(extra/2*100);
    label = 'Escoteiro da Pátria'; icon = '🏆';
    note = extra + '/2 (Desafio do Azimute + Avaliação)';
  } else {
    const next = nextStageInfo(blocksDone);
    const prevThreshold = next.label==='Conquista' ? 0 : (next.label==='Azimute' ? 6 : 12);
    const threshold = blocksDone + next.need;
    pct = Math.round(((blocksDone - prevThreshold) / (threshold - prevThreshold)) * 100);
    label = next.label; icon = next.icon;
    note = next.need + ' bloco' + (next.need!==1?'s':'') + ' para chegar lá';
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

// ---------- Especialidades ----------
function specItemRow(item){
  const p = specProgress[item.id] || {};
  const checked = !!p.checked;
  const notesTxt = p.notes || '';
  const notesOpen = !!specNotesOpen[item.id];
  return `
    <div class="item ${checked?'checked':''}" data-id="${item.id}">
      <div class="chk" data-action="spec-toggle" data-id="${item.id}" role="checkbox" aria-checked="${checked}" tabindex="0">${CHECK_SVG}</div>
      <div class="item-body">
        <div class="item-text-row">
          <div class="item-text" data-action="spec-toggle" data-id="${item.id}">${highlightText(item.text, searchQueryEspecialidades)}</div>
          <a class="spec-link" href="${SPEC_GUIDE_URL}" target="_blank" rel="noopener noreferrer">Ver requisitos ↗</a>
        </div>
        <div class="item-date">
          <input type="date" value="${p.date || ''}" data-action="spec-date" data-id="${item.id}" aria-label="Data">
          <button class="notes-toggle-btn" data-action="notes-toggle" data-id="${item.id}">${notesOpen ? 'Fechar anotação' : (notesTxt ? '📝 Ver/editar requisitos' : '📝 Adicionar requisitos')}</button>
        </div>
        ${notesOpen ? `
        <div class="notes-box">
          <textarea class="notes-textarea" data-action="notes-input" data-id="${item.id}" placeholder="Cole ou escreva aqui os requisitos desta especialidade, do jeito que você consultou no guia oficial.">${escapeHtml(notesTxt)}</textarea>
        </div>` : (notesTxt ? `<div class="notes-preview" data-action="notes-toggle" data-id="${item.id}">${escapeHtml(notesTxt.length>140 ? notesTxt.slice(0,140)+'…' : notesTxt)}</div>` : '')}
      </div>
    </div>`;
}

function renderSpecialidades(){
  const content = $('specContent');
  content.classList.remove('loading');
  content.innerHTML = SPECIALTIES.map(area=>{
    let html = `<div class="spec-area"><div class="spec-area-title">${area.name}</div>`;
    if(area.especialidades.length){
      html += '<div class="spec-sub-label">Especialidades</div>';
      html += area.especialidades.map(specItemRow).join('');
    }
    if(area.insignias.length){
      html += '<div class="spec-sub-label">Insígnias</div>';
      html += area.insignias.map(specItemRow).join('');
    }
    return html + '</div>';
  }).join('');
  const ids = allSpecIds();
  $('specFracLabel').textContent = ids.filter(id=> isDone(specProgress, id)).length + ' / ' + ids.length;
  applySpecSearch();
}

$('specContent').addEventListener('click', (e)=>{
  const el = e.target.closest('[data-action]');
  if(!el) return;
  const action = el.getAttribute('data-action');
  const id = el.getAttribute('data-id');
  if(action === 'spec-toggle') specToggle(id);
  else if(action === 'notes-toggle'){
    specNotesOpen[id] = !specNotesOpen[id];
    renderSpecialidades();
    if(specNotesOpen[id]){
      const ta = document.querySelector('.notes-textarea[data-id="'+id+'"]');
      if(ta) ta.focus();
    }
  }
});
$('specContent').addEventListener('change', (e)=>{
  const el = e.target;
  if(el.getAttribute('data-action') === 'spec-date') specSetDate(el.getAttribute('data-id'), el.value);
});
$('specContent').addEventListener('input', (e)=>{
  const el = e.target;
  if(el.getAttribute('data-action') === 'notes-input') specSetNotes(el.getAttribute('data-id'), el.value);
});
$('specContent').addEventListener('keydown', (e)=>{
  if((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('chk')){ e.preventDefault(); e.target.click(); }
});

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

function applySpecSearch(){
  const content = $('specContent');
  const countEl = $('searchCountEspecialidades');
  const q = searchQueryEspecialidades;
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
  if(countEl) countEl.textContent = q ? (shown + ' encontrada' + (shown!==1?'s':'')) : '';
}

function specToggle(id){
  const cur = specProgress[id] || {};
  cur.checked = !cur.checked;
  if(cur.checked && !cur.date) cur.date = today();
  cur.u = Date.now();
  specProgress[id] = cur;
  specSave();
  upsertCloud('especialidade', id, cur);
  renderSpecialidades();
  updateHeader();
}

function specSetDate(id, value){
  const cur = specProgress[id] || {};
  cur.date = value;
  cur.u = Date.now();
  specProgress[id] = cur;
  specSave();
  upsertCloud('especialidade', id, cur);
}

function specSave(){ writeJSON(SPEC_STORAGE_KEY, specProgress); }

$('specResetBtn').addEventListener('click', async ()=>{
  if(!confirm('Isso vai apagar todas as especialidades marcadas, inclusive da nuvem. Tem certeza?')) return;
  specProgress = {};
  specSave();
  renderSpecialidades();
  await deleteCloudKind('especialidade');
  showToast('Especialidades apagadas');
});

// ---------- Abas ----------
const TABS = {
  progressao:     ['tabProgressaoBtn','viewProgressao'],
  especialidades: ['tabEspecialidadesBtn','viewEspecialidades'],
  evolucao:       ['tabEvolucaoBtn','viewEvolucao'],
  notas:          ['tabNotasBtn','viewNotas'],
  patrulha:       ['tabPatrulhaBtn','viewPatrulha']
};
function showTab(name){
  if(name === 'patrulha' && !(profile && profile.role === 'monitor')) name = 'progressao';
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
  window.scrollTo({ top:0 });
}
Object.keys(TABS).forEach(k=> $(TABS[k][0]).addEventListener('click', ()=> showTab(k)));

$('searchProgressao').addEventListener('input', (e)=>{
  searchQueryProgressao = normalizeText(e.target.value.trim());
  render();
});
$('searchEspecialidades').addEventListener('input', (e)=>{
  searchQueryEspecialidades = normalizeText(e.target.value.trim());
  renderSpecialidades();
});

// ---------- Evolução ----------
function collectDone(prog = progress, spec = specProgress){
  const out = [];
  Object.entries(prog).forEach(([id,p])=>{ if(p && p.checked && p.date) out.push({ id, date:p.date, kind:'Progressão' }); });
  Object.entries(spec).forEach(([id,p])=>{ if(p && p.checked && p.date) out.push({ id, date:p.date, kind:'Especialidade' }); });
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
  SPECIALTIES.forEach(a=> [...a.especialidades, ...a.insignias].forEach(i=> out.push({ id:i.id, text:i.text, ctx:'Especialidades · ' + a.name })));
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
  ['pickModal','memberModal','accountModal'].forEach(id=>{ if(!$(id).hidden) id === 'pickModal' ? closePicker() : closeModal(id); });
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
  doc.text('Progressão — Ramo Sênior', marginX, y); y += 22;
  doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.setTextColor(110,110,110);
  const who = [profile && profile.full_name, profile && profile.patrol_name ? 'Patrulha ' + profile.patrol_name : ''].filter(Boolean).join('  ·  ');
  if(who){ doc.text(who, marginX, y); y += 14; }
  doc.text('Resumo gerado em ' + new Date().toLocaleDateString('pt-BR'), marginX, y); y += 10;
  sectionRule();

  const { done: blocksDone, total: blocksTotal } = countBlocksCompleted();
  const stage = currentStage(blocksDone);
  const ids = allItemIds();
  const itemsDone = ids.filter(id=> isDone(progress, id)).length;
  const specIds = allSpecIds();
  const specDone = specIds.filter(id=> isDone(specProgress, id)).length;

  heading('Estágio atual: ' + stage.label, 13);
  subtext(blocksDone + ' de ' + blocksTotal + ' blocos concluídos  ·  ' + itemsDone + '/' + ids.length + ' itens de progressão  ·  ' + specDone + '/' + specIds.length + ' especialidades/insígnias');
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
  heading('Especialidades e Insígnias conquistadas', 15);
  let anySpec = false;
  SPECIALTIES.forEach(area=>{
    const done = [...area.especialidades, ...area.insignias].filter(i=> isDone(specProgress, i.id));
    if(!done.length) return;
    anySpec = true;
    heading(area.name, 12);
    done.forEach(i=> bulletLine(i.text, specProgress[i.id].date ? fmtDate(specProgress[i.id].date) : ''));
    y += 4;
  });
  if(!anySpec) subtext('Nenhuma especialidade marcada ainda.');

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
    await Share.share({ title: 'Resumo da Progressão Sênior', files: [res.uri], dialogTitle: 'Salvar ou enviar o PDF' });
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
  ['bootScreen','authScreen','patrolScreen','appScreen'].forEach(id=>{ $(id).hidden = id !== name + 'Screen'; });
  window.scrollTo({ top:0 });
}

function setAuthMode(mode){
  authMode = mode;
  const up = mode === 'up';
  $('authTabIn').classList.toggle('active', !up);
  $('authTabUp').classList.toggle('active', up);
  $('authSub').textContent = up
    ? 'Crie sua conta com o código da sua patrulha.'
    : 'Entre com a sua conta para acompanhar sua progressão.';
  $('signupFields').hidden = !up;
  $('pw2Field').hidden = !up;
  $('pwStrengthBox').hidden = !up;
  $('authForgot').hidden = up;
  $('authSubmit').textContent = up ? 'Criar conta' : 'Entrar';
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
  $('authSubmit').textContent = (busy && label) ? label : (authMode === 'up' ? 'Criar conta' : 'Entrar');
}

function showAuth(){
  showScreen('auth');
  if(!sb){
    $('authConfigMissing').hidden = false;
    $('authForm').hidden = true;
    return;
  }
  setAuthMode(authMode);
}

// Confere o código da patrulha enquanto a pessoa digita
let codeTimer = null;
async function checkCode(raw){
  const code = normCode(raw);
  const hint = $('authCodeHint');
  hint.className = 'field-hint';
  if(code.length < 4){
    codeCheck = { code, valid:false };
    hint.textContent = 'Peça o código ao monitor ou ao chefe da sua tropa.';
    return codeCheck;
  }
  hint.textContent = 'Conferindo…';
  try{
    const { data, error } = await sb.rpc('check_patrol_code', { p_code: code });
    if(normCode($('authCode').value) !== code) return codeCheck; // a pessoa já digitou outra coisa
    if(error) throw error;
    const row = (data || [])[0];
    if(row){
      codeCheck = { code, valid:true, patrol:row.patrol_name, role:row.role };
      hint.className = 'field-hint ' + (row.role === 'monitor' ? 'monitor' : 'ok');
      hint.textContent = row.role === 'monitor'
        ? '✓ Patrulha ' + row.patrol_name + ' — você entrará como monitor'
        : '✓ Patrulha ' + row.patrol_name;
    } else {
      codeCheck = { code, valid:false };
      hint.className = 'field-hint error';
      hint.textContent = 'Código não encontrado. Confira as letras e números.';
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
  if(!code){ setAuthMsg('Digite o código da patrulha.', 'error'); $('authCode').focus(); return; }
  if(!validEmail(email)){ setAuthMsg('Digite um e-mail válido.', 'error'); return; }
  if(password.length < 8){ setAuthMsg('A senha precisa ter pelo menos 8 caracteres.', 'error'); return; }
  if(password !== password2){ setAuthMsg('As senhas não coincidem.', 'error'); return; }

  setAuthBusy(true, 'Conferindo código…'); setAuthMsg('');
  try{
    const check = (codeCheck.code === code && codeCheck.valid) ? codeCheck : await checkCode(code);
    if(!check.valid){ setAuthMsg(check.error ? 'Não consegui conferir o código. Verifique a internet.' : 'Código de patrulha inválido. Confira com o seu monitor ou chefe.', 'error'); return; }
    setAuthBusy(true, 'Criando conta…');
    const { data, error } = await sb.auth.signUp({
      email, password,
      options: { data: { full_name: name, patrol_code: code }, emailRedirectTo: redirectUrl() }
    });
    if(error){ setAuthMsg(authErrorPt(error), 'error'); return; }
    if(data.session){
      await enterAs(data.user);
      showToast('Conta criada ✓ Bem-vindo à patrulha ' + check.patrol + '!');
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
    notes = readJSON(NOTES_STORAGE_KEY, []);

    let p = await fetchProfile();
    if(p === undefined) p = readJSON(PROFILE_KEY, null); // offline: usa o último perfil conhecido
    profile = p;
    if(!profile || !profile.patrol_id){
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
  $('tabPatrulhaBtn').hidden = profile.role !== 'monitor';
  render();
  renderSpecialidades();
  renderNotes();
  showTab(currentTab);
}

function updateAccountUI(){
  const name = (profile && profile.full_name) || (currentUser && currentUser.email) || '';
  const isMon = profile && profile.role === 'monitor';
  $('accountAvatar').textContent = initials(name);
  $('accountAvatar').classList.toggle('monitor', !!isMon);
  $('accountName').textContent = firstName(name) || 'Conta';
  $('headerEyebrow').textContent = profile && profile.patrol_name
    ? 'Patrulha ' + profile.patrol_name + (isMon ? ' · Monitor' : '')
    : 'Progressão pessoal';
}

function resetState(){
  currentUser = null; profile = null;
  progress = {}; specProgress = {}; notes = [];
  patrolData = null; currentTab = 'progressao'; monitorCodeVisible = false;
  authMode = 'in';
  ['authName','authCode','authEmail','authPassword','authPassword2','searchProgressao','searchEspecialidades'].forEach(id=>{ $(id).value = ''; });
  searchQueryProgressao = ''; searchQueryEspecialidades = '';
  codeCheck = { code:'', valid:false };
  $('authCodeHint').className = 'field-hint';
  $('authCodeHint').textContent = 'Peça o código ao monitor ou ao chefe da sua tropa.';
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
  $('accountAvatarLg').classList.toggle('monitor', profile && profile.role === 'monitor');
  $('accountTitle').textContent = name || 'Sua conta';
  $('accountEmail').textContent = currentUser ? currentUser.email : '';
  $('accountPatrol').innerHTML = profile && profile.patrol_name
    ? escapeHtml(profile.patrol_name) + ' <span class="badge ' + (profile.role === 'monitor' ? 'badge-monitor' : '') + '">' + (profile.role === 'monitor' ? 'Monitor' : 'Membro') + '</span>'
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
    showToast('Agora você está na patrulha ' + (row.patrol_name || '') + ' ✓');
  }catch(err){ setMsgEl('accountMsg', authErrorPt(err), 'error'); }
});

$('signOutBtn').addEventListener('click', signOutUser);

$('deleteAccountBtn').addEventListener('click', async (e)=>{
  if(!armButton('delete-account', e.currentTarget, 'Toque de novo para excluir PARA SEMPRE')) return;
  try{
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
      checked: !!p.checked,
      item_date: p.date || null,
      notes: kind === 'especialidade' ? (p.notes || null) : null,
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
  const specs = allSpecIds().filter(id=> isDone(m.spec, id)).length;
  const dates = collectDone(m.prog, m.spec).map(d=> d.date).sort();
  const last = dates.length ? dates[dates.length-1] : null;
  const recent30 = dates.filter(d=> daysSince(d) <= 30).length;
  return {
    blocks, blocksTotal, items, itemsTotal: ids.length,
    pct: Math.round(items / ids.length * 100),
    specs, last, recent30, stage: currentStage(blocks, m.prog)
  };
}

async function loadPatrol(force){
  if(!sb || !profile || profile.role !== 'monitor') return;
  if(patrolData && !force && Date.now() - patrolData.loadedAt < 60000){ renderPatrol(); return; }
  if(!patrolData) $('memberList').innerHTML = '<div class="loading">Carregando a patrulha…</div>';
  $('patrolRefresh').disabled = true;
  try{
    const [codesRes, profRes] = await Promise.all([
      sb.rpc('get_patrol_codes'),
      sb.from('profiles').select('user_id, full_name, role, created_at').eq('patrol_id', profile.patrol_id)
    ]);
    if(codesRes.error) throw codesRes.error;
    if(profRes.error) throw profRes.error;
    const people = profRes.data || [];
    const ids = people.map(p=> p.user_id);
    const rows = ids.length ? await fetchAll(()=> sb.from('senior_progress')
      .select('user_id, kind, item_id, item_date')
      .in('user_id', ids).eq('checked', true).order('user_id').order('item_id')) : [];
    const byUser = {};
    people.forEach(p=>{ byUser[p.user_id] = { id:p.user_id, name:p.full_name || 'Sem nome', role:p.role, isMe: p.user_id === currentUser.id, joined:p.created_at, prog:{}, spec:{} }; });
    rows.forEach(r=>{
      const m = byUser[r.user_id];
      if(!m) return;
      (r.kind === 'progressao' ? m.prog : m.spec)[r.item_id] = { checked:true, date: r.item_date || '' };
    });
    const members = Object.values(byUser);
    members.forEach(m=> m.sum = memberSummary(m));
    patrolData = { codes: (codesRes.data || [])[0] || null, members, loadedAt: Date.now() };
    renderPatrol();
  }catch(err){
    console.error(err);
    if(!patrolData) $('memberList').innerHTML = '<div class="empty-state">Não consegui carregar a patrulha. ' + escapeHtml(authErrorPt(err)) + '</div>';
    else showToast('Sem conexão — mostrando os últimos dados');
  }finally{
    $('patrolRefresh').disabled = false;
  }
}

function renderPatrol(){
  if(!patrolData) return;
  const { codes, members } = patrolData;
  const name = (codes && codes.patrol_name) || profile.patrol_name || '';
  $('patrolTitle').textContent = 'Patrulha ' + name;
  const n = members.length;
  $('patrolSubtitle').textContent = n + (n === 1 ? ' pessoa' : ' pessoas') + ' na patrulha · atualizado às ' +
    new Date(patrolData.loadedAt).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' });

  // Códigos
  $('memberCode').textContent = codes ? codes.member_code : '—';
  $('monitorCode').textContent = codes && monitorCodeVisible ? codes.monitor_code : '••••••';
  $('monitorCode').classList.toggle('masked', !monitorCodeVisible);
  $('toggleMonitorCode').textContent = monitorCodeVisible ? 'Ocultar' : 'Mostrar';

  // Resumo
  const avgBlocks = n ? members.reduce((s,m)=> s + m.sum.blocks, 0) / n : 0;
  const totalSpecs = members.reduce((s,m)=> s + m.sum.specs, 0);
  const active = members.filter(m=> m.sum.last && daysSince(m.sum.last) <= 30).length;
  const stageCount = {};
  members.forEach(m=>{ stageCount[m.sum.stage.label] = (stageCount[m.sum.stage.label]||0) + 1; });
  const topStage = Object.entries(stageCount).sort((a,b)=> b[1]-a[1])[0];
  $('patrolStats').innerHTML =
    `<div class="stat"><div class="n">${avgBlocks.toFixed(1).replace('.', ',')}</div><div class="l">média de blocos (de 18)</div></div>` +
    `<div class="stat"><div class="n">${totalSpecs}</div><div class="l">especialidades conquistadas</div></div>` +
    `<div class="stat"><div class="n">${active}/${n}</div><div class="l">ativos nos últimos 30 dias</div></div>` +
    `<div class="stat"><div class="n" style="font-size:22px;padding-top:4px">${topStage ? escapeHtml(topStage[0]) : '—'}</div><div class="l">etapa mais comum</div></div>`;

  // Lista
  const sort = $('memberSort').value;
  const list = members.slice().sort((a,b)=>{
    if(sort === 'name') return a.name.localeCompare(b.name, 'pt-BR');
    if(sort === 'recent') return (b.sum.last||'').localeCompare(a.sum.last||'');
    if(sort === 'idle') return (a.sum.last||'').localeCompare(b.sum.last||'');
    return b.sum.blocks - a.sum.blocks || b.sum.items - a.sum.items;
  });
  if(n <= 1){
    $('memberList').innerHTML = list.map(memberCard).join('') +
      '<div class="empty-state">Ninguém mais entrou na patrulha ainda.<br>Compartilhe o código de membros acima para convidar a galera.</div>';
    return;
  }
  $('memberList').innerHTML = list.map(memberCard).join('');
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
          ${m.role==='monitor' ? '<span class="badge badge-monitor">Monitor</span>' : ''}
          ${m.isMe ? '<span class="badge badge-me">Você</span>' : ''}
        </span>
        <span class="member-meta">
          <span>${s.stage.icon} <b>${s.stage.label}</b></span>
          <span><b>${s.blocks}</b>/${s.blocksTotal} blocos</span>
          <span><b>${s.specs}</b> espec.</span>
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

  const recent = collectDone(m.prog, m.spec).sort((a,b)=> b.date.localeCompare(a.date)).slice(0, 8);
  const recentHtml = recent.length
    ? recent.map(d=> `<div class="evo-recent"><span class="d">${fmtDate(d.date)}</span><span class="t" title="${escapeHtml(texts[d.id]||'')}">${escapeHtml(texts[d.id]||d.id)}</span></div>`).join('')
    : '<div class="pick-hint">Nada marcado com data ainda.</div>';

  const specList = SPECIALTIES.flatMap(a=> [...a.especialidades, ...a.insignias]).filter(i=> isDone(m.spec, i.id));
  const specHtml = specList.length
    ? specList.map(i=> `<span class="badge" style="text-transform:none;font-family:var(--font-body);font-size:11.5px;display:inline-block;margin:0 6px 6px 0">${escapeHtml(i.text)}</span>`).join('')
    : '<div class="pick-hint">Nenhuma especialidade marcada.</div>';

  $('memberDetail').innerHTML = `
    <div class="account-head">
      <span class="avatar lg ${m.role==='monitor'?'monitor':''}">${escapeHtml(initials(m.name))}</span>
      <div class="who">
        <b>${escapeHtml(m.name)}</b>
        <span>${m.role==='monitor' ? 'Monitor' : 'Membro'} · ${s.stage.icon} ${s.stage.label} · última atividade: ${lastLabel(s.last)}</span>
      </div>
    </div>
    <div class="evo-stats">
      <div class="stat"><div class="n">${s.blocks}/${s.blocksTotal}</div><div class="l">blocos concluídos</div></div>
      <div class="stat"><div class="n">${s.pct}%</div><div class="l">${s.items} de ${s.itemsTotal} itens</div></div>
      <div class="stat"><div class="n">${s.specs}</div><div class="l">especialidades e insígnias</div></div>
      <div class="stat"><div class="n">${s.recent30}</div><div class="l">itens nos últimos 30 dias</div></div>
    </div>
    <div class="card"><div class="card-title">Blocos</div>${eixosHtml}</div>
    <div class="card"><div class="card-title">Últimas conquistas</div>${recentHtml}</div>
    <div class="card"><div class="card-title">Especialidades</div>${specHtml}</div>
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
  return 'Entre na Patrulha ' + c.patrol_name + ' no app Progressão Ramo Sênior!\n' +
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
//  Início
// =====================================================================
async function boot(){
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
