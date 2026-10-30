const PRECO_BASE = 10, PRECO_EXTRA = 2;
const FRUTAS = [
  {id:'morango', nome:'Morango', cor:'#E2373F'},
  {id:'uva', nome:'Uva', cor:'#9BC25B'},
  {id:'sem', nome:'Sem fruta', cor:'#FFF4EC'}
];
const RECHEIOS = [
  {id:'chocolate', nome:'Brigadeiro de chocolate', cor:'#6B3A26'},
  {id:'ninho', nome:'Brigadeiro de Ninho', cor:'#F3E6CC'}
];
const st = {fruta:'morango', recheio:'chocolate', qty:1, semMousse:false, x:{brownie:0, fruta:0, recheio:0, mousse:0, chanty:0}};
const fruta = () => FRUTAS.find(f => f.id === st.fruta);
const recheio = () => RECHEIOS.find(r => r.id === st.recheio);
const TODOS = () => [
  {k:'brownie', nome:'Brownie', cor:'#4A2C21', det:'molhadinho'},
  {k:'fruta', nome:fruta().nome, cor:fruta().cor, det:'fruta escolhida'},
  {k:'recheio', nome:recheio().nome, cor:recheio().cor, det:'recheio escolhido'},
  {k:'mousse', nome:'Mousse de maracujá', cor:'#F2C14E', det:'cremoso'},
  {k:'chanty', nome:'Chantyninho', cor:'#FFFBF4', det:'por cima'}
];
const ITENS = () => TODOS().filter(i => !(i.k === 'mousse' && st.semMousse) && !(i.k === 'fruta' && st.fruta === 'sem'));
const fotoKey = () => st.fruta + '-' + (st.recheio === 'ninho' ? 'ninho' : 'chocolate');
const brl = v => 'R$ ' + v.toFixed(2).replace('.', ',');
const $ = id => document.getElementById(id);

function chips(el, list, key){
  el.setAttribute('role','radiogroup');
  el.innerHTML = list.map(o => `<label class="chip"><input type="radio" name="${key}" value="${o.id}" ${st[key]===o.id?'checked':''}><span><i class="dot" style="background:${o.cor}"></i>${o.nome}</span></label>`).join('');
  el.addEventListener('change', e => { st[key] = e.target.value; render(); });
}
chips($('frutas'), FRUTAS, 'fruta');
chips($('recheios'), RECHEIOS, 'recheio');

function extrasUI(){
  $('extras').innerHTML = TODOS().map(i => `<div class="extra"><div class="nm">${i.nome}<small>+ R$ 2 por camada</small></div><div class="step"><button type="button" data-k="${i.k}" data-d="-1" aria-label="Tirar camada extra de ${i.nome}">−</button><output id="o-${i.k}">0</output><button type="button" data-k="${i.k}" data-d="1" aria-label="Adicionar camada extra de ${i.nome}">+</button></div></div>`).join('');
}
$('extras').addEventListener('click', e => {
  const b = e.target.closest('button[data-k]'); if (!b) return;
  st.x[b.dataset.k] = Math.max(0, Math.min(3, st.x[b.dataset.k] + +b.dataset.d)); render();
});
$('semMousse').addEventListener('change', e => { st.semMousse = e.target.checked; render(); });
$('qMinus').onclick = () => { st.qty = Math.max(1, st.qty - 1); render(); };
$('qPlus').onclick = () => { st.qty = Math.min(20, st.qty + 1); render(); };
document.querySelectorAll('input[name=receber]').forEach(r => r.addEventListener('change', () => { $('endBox').hidden = document.querySelector('input[name=receber]:checked').value !== 'Entrega'; }));

function totalExtras(){ return Object.values(st.x).reduce((a,b)=>a+b,0); }
function precoCopo(){ return PRECO_BASE + PRECO_EXTRA * totalExtras(); }

let lastKey='';
function drawCup(){
  const its = ITENS().filter(i => st.x[i.k] > 0);
  $('badges').innerHTML = its.length ? its.map(i => '<span class="badge">+' + st.x[i.k] + ' ' + i.nome + '</span>').join('') : '<span class="none">Uma camada de cada ingrediente</span>';
  document.querySelectorAll('#cupImg img').forEach(im => im.classList.toggle('on', im.dataset.k === fotoKey()));
  $('cupImg').setAttribute('aria-label', 'Foto do copo: ' + (st.fruta === 'sem' ? 'sem fruta' : fruta().nome.toLowerCase()) + ' com ' + recheio().nome.toLowerCase());
  const key = JSON.stringify(st);
  if (lastKey && key !== lastKey) { const im = $('cupImg'); im.classList.remove('bump'); void im.offsetWidth; im.classList.add('bump'); setTimeout(() => im.classList.remove('bump'), 260); }
  lastKey = key;
}
function resumo(){
  const ex = ITENS().filter(i => st.x[i.k] > 0).map(i => i.nome + ' x' + st.x[i.k]);
  const rec = document.querySelector('input[name=receber]:checked').value;
  const linhas = [
    'Pedido – Brownie da Felicidade',
    'Nome: ' + ($('nome').value.trim() || '-'),
    'Copos: ' + st.qty + ' (300 ml)',
    'Fruta: ' + fruta().nome,
    'Recheio: ' + recheio().nome,
    'Mousse de maracujá: ' + (st.semMousse ? 'sem' : 'com'),
    'Camadas extras: ' + (ex.length ? ex.join(', ') + ' (+' + brl(PRECO_EXTRA * totalExtras()) + ' por copo)' : 'nenhuma'),
    'Receber: ' + rec + (rec === 'Entrega' ? ' – ' + ($('end').value.trim() || '-') : ''),
  ];
  if ($('obs').value.trim()) linhas.push('Obs.: ' + $('obs').value.trim());
  linhas.push('Total: ' + brl(precoCopo() * st.qty) + (rec === 'Entrega' ? ' + taxa de entrega (por conta do cliente)' : ''));
  return linhas.join('\n');
}

function render(){
  if (!$('o-brownie')) extrasUI();
  if (st.semMousse) st.x.mousse = 0;
  if (st.fruta === 'sem') st.x.fruta = 0;
  TODOS().forEach(i => {
    $('o-' + i.k).value = st.x[i.k];
    const row = $('o-' + i.k).closest('.extra');
    row.hidden = (i.k === 'mousse' && st.semMousse) || (i.k === 'fruta' && st.fruta === 'sem');
    row.querySelector('.nm').firstChild.nodeValue = i.nome;
    row.querySelector('[data-d="-1"]').disabled = st.x[i.k] === 0;
    row.querySelector('[data-d="1"]').disabled = st.x[i.k] === 3;
  });
  $('baseList').innerHTML = ITENS().map(i => { const n = 1 + st.x[i.k]; return `<li><span>${i.nome}</span><em>${n} ${n > 1 ? 'camadas' : 'camada'}</em></li>`; }).join('') + (st.semMousse ? '<li><span>Mousse de maracujá</span><em>sem</em></li>' : '');
  $('qty').value = st.qty; $('qMinus').disabled = st.qty === 1;
  const n = totalExtras();
  $('total').textContent = brl(precoCopo() * st.qty); $('mTotal').textContent = brl(precoCopo() * st.qty); $('mNote').textContent = st.qty + (st.qty > 1 ? ' copos' : ' copo') + (n ? ' · ' + n + ' extra' + (n > 1 ? 's' : '') : '');
  $('totalNote').textContent = st.qty + (st.qty > 1 ? ' copos' : ' copo') + (n ? ', ' + n + (n > 1 ? ' camadas extras' : ' camada extra') + ' cada' : ', sem camadas extras') + (st.qty > 1 ? ' · ' + brl(precoCopo()) + ' cada' : '');
  drawCup();
}
function valida(){
  $('err').textContent = ''; $('ok').textContent = '';
  if (!$('nome').value.trim()) { $('err').textContent = 'Escreva seu nome para enviar o pedido.'; $('nome').focus(); return false; }
  const rec = document.querySelector('input[name=receber]:checked').value;
  if (rec === 'Entrega' && !$('end').value.trim()) { $('err').textContent = 'Escreva o endereço para a entrega.'; $('end').focus(); return false; }
  return true;
}
// ===== CONFIGURAÇÃO DO PIX =====
const PIX_CHAVE = 'f6eb027b-4f23-4192-a24e-8ad8b8a70117';          // chave Pix (e-mail, celular com +55, CPF/CNPJ ou chave aleatória)
const PIX_NOME = 'JHONATAN F G OLIVEIRA';  // nome de quem recebe (até 25 letras, sem acento)
const PIX_CIDADE = 'IPATINGA'; // cidade (até 15 letras, sem acento)
const WHATS = '';              // WhatsApp do grupo para endereço de entrega, ex.: '5531999999999'
const API_URL = '';            // URL do Apps Script (termina em /exec) — veja o passo a passo
// ================================
const semAcento = t => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
const tlv = (id, v) => id + String(v.length).padStart(2, '0') + v;
function crc16(str){ let c = 0xFFFF; for (let i = 0; i < str.length; i++) { c ^= str.charCodeAt(i) << 8; for (let k = 0; k < 8; k++) c = (c & 0x8000) ? ((c << 1) ^ 0x1021) & 0xFFFF : (c << 1) & 0xFFFF; } return c.toString(16).toUpperCase().padStart(4, '0'); }
function pixPayload(valor){
  const mai = tlv('00', 'br.gov.bcb.pix') + tlv('01', PIX_CHAVE.trim());
  let p = tlv('00', '01') + tlv('26', mai) + tlv('52', '0000') + tlv('53', '986') + tlv('54', valor.toFixed(2)) + tlv('58', 'BR') +
          tlv('59', semAcento(PIX_NOME).slice(0, 25)) + tlv('60', semAcento(PIX_CIDADE).slice(0, 15)) + tlv('62', tlv('05', '***')) + '6304';
  return p + crc16(p);
}
function resetar(){
  st.fruta = FRUTAS[0].id; st.recheio = RECHEIOS[0].id; st.qty = 1; st.semMousse = false; $('semMousse').checked = false; Object.keys(st.x).forEach(k => st.x[k] = 0);
  document.querySelectorAll('input[name=fruta]').forEach(r => r.checked = r.value === st.fruta);
  document.querySelectorAll('input[name=recheio]').forEach(r => r.checked = r.value === st.recheio);
  document.querySelector('input[name=receber][value="Retirar na feira"]').checked = true; $('endBox').hidden = true;
  $('nome').value = ''; $('end').value = ''; $('obs').value = ''; $('err').textContent = ''; $('ok').textContent = '';
  lastKey = ''; render();
}
let doneTimer, pixCode = '', pedidoId = null;
function dadosPedido(){
  const rec = document.querySelector('input[name=receber]:checked').value;
  const ex = ITENS().filter(i => st.x[i.k] > 0).map(i => i.nome + ' x' + st.x[i.k]).join(', ');
  return { acao:'novo', nome:$('nome').value.trim(), copos:st.qty, fruta:fruta().nome, recheio:recheio().nome, extras:(st.semMousse ? 'SEM MOUSSE. ' : '') + (ex || 'nenhuma'),
           receber:rec, endereco: rec === 'Entrega' ? $('end').value.trim() : '', obs:$('obs').value.trim(), nx: totalExtras(), total:precoCopo() * st.qty };
}
async function api(body){
  if (!API_URL) return null;
  try { const r = await fetch(API_URL, { method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'}, body: JSON.stringify(body) }); return await r.json(); }
  catch (e) { return null; }
}
function fechar(){ clearTimeout(doneTimer); pararPoll(); $('done').hidden = true; $('done').classList.remove('go'); $('okStep').hidden = true; $('payStep').hidden = false; resetar(); window.scrollTo({top:0, behavior: reduce ? 'auto' : 'smooth'}); }
let poll = null, pedidoUid = null;
// ---- banco do próprio Claude (quando o site roda no claude.ai e não há Apps Script) ----
let _cloud;
async function cloud(){
  if (API_URL || !(window.claude && window.claude.use)) return null;
  if (_cloud === undefined) { try { const db = await claude.use('db'), user = await claude.use('user'); _cloud = db && user ? { db, user } : null; } catch (e) { _cloud = null; } }
  return _cloud;
}
async function salvarNuvem(ped){
  const c = await cloud(); if (!c) return null;
  try {
    const uid = await c.user.id(); if (!uid) return null;
    const ref = c.db.doc('pedidos/' + uid), snap = await ref.get();
    const lista = snap.exists ? (snap.data().lista || []).slice() : [];
    const id = Math.random().toString(36).slice(2, 8).toUpperCase();
    lista.push({ id, data: new Date().toISOString(), nome: ped.nome, copos: ped.copos, fruta: ped.fruta, recheio: ped.recheio, extras: ped.extras,
                 receber: ped.receber, endereco: ped.endereco, obs: ped.obs, total: ped.total, status: 'Aguardando Pix' });
    await ref.set({ lista: lista.slice(-50) });
    return { id, uid };
  } catch (e) { return null; }
}
async function statusNuvem(uid, id, status, somenteSe){
  const c = await cloud(); if (!c) return false;
  try {
    const ref = c.db.doc('pedidos/' + uid), snap = await ref.get(); if (!snap.exists) return false;
    const lista = (snap.data().lista || []).map(p => p.id === id && (!somenteSe || p.status === somenteSe) ? Object.assign({}, p, { status }) : p);
    await ref.set({ lista }); return true;
  } catch (e) { return false; }
}
function pararPoll(){ if (poll) { clearInterval(poll); poll = null; } }
function confirmado(id){
  pararPoll();
  const on = document.querySelector('#cupImg img.on'); if (on) $('okImg').src = on.src;
  $('okTxt').textContent = id ? 'Pagamento aprovado! Pedido nº ' + id + ' enviado para a nossa equipe.' : 'Obrigado! Assim que o Pix for confirmado, seu copo fica pronto.';
  $('payStep').hidden = true; $('okStep').hidden = false; void $('done').offsetWidth; $('done').classList.add('go'); $('novo').focus();
  doneTimer = setTimeout(fechar, 5000);
}
function pixEstatico(total){
  const box = $('qr'); box.innerHTML = '';
  $('pago').hidden = false; $('wait').hidden = true;
  if (!PIX_CHAVE.trim()) { pixCode = ''; box.innerHTML = '<p class="warn">Chave Pix ainda não configurada.</p>'; $('copyPix').hidden = true; return; }
  pixCode = pixPayload(total); $('copyPix').hidden = false;
  try { new QRCode(box, { text: pixCode, width: 196, height: 196, colorDark: '#000000', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.M }); }
  catch (e) { box.innerHTML = '<p class="warn">Não foi possível gerar o QR Code. Use "Copiar código Pix".</p>'; }
}
$('zap').onclick = async () => {
  if (!valida()) return;
  const total = precoCopo() * st.qty, ent = document.querySelector('input[name=receber]:checked').value === 'Entrega';
  $('payTotal').textContent = brl(total); $('paySum').textContent = resumo();
  $('zapEnd').hidden = !ent; $('payMsg').textContent = ''; pedidoId = null; pararPoll();
  $('done').hidden = false;
  if (!API_URL) {
    pixEstatico(total); $('pago').focus(); pedidoUid = null;
    if (await cloud()) { $('payMsg').textContent = 'Registrando seu pedido…'; const r0 = await salvarNuvem(dadosPedido());
      if (r0) { pedidoId = r0.id; pedidoUid = r0.uid; $('payMsg').textContent = 'Pedido nº ' + r0.id + ' registrado.'; } else $('payMsg').textContent = ''; }
    return;
  }
  // tenta o Pix automático (Mercado Pago); se não estiver ligado, usa o Pix da chave
  $('qr').innerHTML = '<p class="warn">Gerando o Pix…</p>'; $('pago').hidden = true; $('copyPix').hidden = true; $('wait').hidden = true;
  const r = await api({ acao: 'criar_pix', pedido: dadosPedido() });
  if (r && r.ok && r.mp) {
    pixCode = r.qr_code; $('copyPix').hidden = false; $('wait').hidden = false;
    $('qr').innerHTML = '<img class="mp" alt="QR Code Pix" src="data:image/png;base64,' + r.qr_base64 + '">';
    poll = setInterval(async () => {
      const s2 = await api({ acao: 'status_pix', pid: r.pid });
      if (!s2 || !s2.ok) return;
      if (s2.status === 'approved') confirmado(s2.id);
      else if (['rejected', 'cancelled', 'expired'].includes(s2.status)) { pararPoll(); $('wait').hidden = true; $('payMsg').textContent = 'O Pix expirou ou foi cancelado. Toque em "Voltar" e tente de novo.'; }
    }, 4000);
  } else {
    pixEstatico(total);
    $('payMsg').textContent = 'Registrando seu pedido…';
    const r2 = await api(dadosPedido());
    if (r2 && r2.ok) { pedidoId = r2.id; $('payMsg').textContent = 'Pedido nº ' + r2.id + ' registrado.'; } else { $('payMsg').textContent = 'Não conseguimos registrar o pedido. Avise alguém do estande.'; }
  }
};
$('copyPix').onclick = async () => { try { await navigator.clipboard.writeText(pixCode); $('payMsg').textContent = 'Código Pix copiado. Cole no app do banco em Pix Copia e Cola.'; } catch (e) { $('payMsg').textContent = 'Não foi possível copiar. Leia o QR Code com a câmera do app do banco.'; } };
$('zapEnd').onclick = () => { window.open('https://wa.me/' + WHATS + '?text=' + encodeURIComponent(resumo()), '_blank', 'noopener'); $('payMsg').textContent = 'Endereço aberto no WhatsApp. Toque em enviar.'; };
$('voltar').onclick = () => { pararPoll(); $('done').hidden = true; };
$('pago').onclick = () => { if (pedidoId && pedidoUid) statusNuvem(pedidoUid, pedidoId, 'Cliente informou pagamento', 'Aguardando Pix'); else if (pedidoId) api({ acao:'cliente_pagou', id: pedidoId }); confirmado(null); };
$('novo').onclick = fechar;
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('done').hidden && !$('payStep').hidden) $('done').hidden = true; });
$('copy').onclick = async () => { if (!valida()) return; try { await navigator.clipboard.writeText(resumo()); $('ok').textContent = 'Pedido copiado. Cole na conversa e envie.'; } catch (e) { $('err').textContent = 'Não foi possível copiar. Use o botão do WhatsApp.'; } };
render();
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), {threshold:.15});
document.querySelectorAll('.reveal').forEach(el => reduce ? el.classList.add('in') : io.observe(el));
document.querySelectorAll('.builder > div > .panel').forEach((el, i) => { el.style.setProperty('--d', (i % 3) * 0.09 + 's'); el.style.setProperty('--rot', (i % 2 ? 1.5 : -1.5) + 'deg'); });
document.querySelectorAll('.info dl > div').forEach((el, i) => { el.classList.add('reveal'); el.style.setProperty('--d', i * 0.12 + 's'); reduce ? el.classList.add('in') : io.observe(el); });
if (!reduce) {
  const drip = document.querySelector('.drip'), h1 = document.querySelector('.hero h1'), scr = document.querySelector('.hero .script'), lead = document.querySelector('.hero .lead'),
        facts = [...document.querySelectorAll('.fact')], cupH = document.querySelector('.hero-pic img'), disc = document.querySelector('.hero-pic'), price = document.querySelector('.price'),
        heroEl = document.querySelector('.hero'), info = document.querySelector('.imgwrap img'), cupB = document.getElementById('cupImg');
  let sy = scrollY, ty = scrollY, t0 = performance.now();
  // quando o site roda dentro de outra página (app, iframe), o scroll não chega no window: usa a visibilidade do topo
  let heroVis = 1, infoVis = 0;
  const th = Array.from({length:51}, (_, i) => i / 50);
  new IntersectionObserver(es => es.forEach(e => heroVis = e.intersectionRatio), {threshold: th}).observe(heroEl);
  if (info) new IntersectionObserver(es => es.forEach(e => infoVis = e.isIntersecting ? e.boundingClientRect.top : infoVis), {threshold: th}).observe(info.parentElement);
  const clamp = v => Math.max(0, Math.min(1, v));
  const mbar = document.getElementById('mbar'); let nearPedido = false;
  new IntersectionObserver(es => es.forEach(e => nearPedido = e.isIntersecting), {rootMargin: '0px 0px -20% 0px'}).observe(document.getElementById('zap'));
  const frame = now => {
    ty = scrollY; sy += (ty - sy) * 0.11;
    const hh = heroEl.offsetHeight || 600, pIO = clamp((1 - heroVis) * 1.15), p = Math.max(clamp(sy / hh), pIO), e = p * p * (3 - 2 * p);
    mbar.classList.toggle('show', p > 0.55 && !nearPedido);
    drip.style.setProperty('--drip', 1 + e * 1.4);
    h1.style.transform = 'translateY(' + (-e * 70) + 'px)'; h1.style.opacity = 1 - e * 0.7;
    scr.style.transform = 'translateX(' + (e * 90) + 'px) rotate(' + (-e * 4) + 'deg)';
    lead.style.transform = 'translateY(' + (-e * 40) + 'px)'; lead.style.opacity = 1 - e;
    facts.forEach((f, i) => { f.style.transform = 'translateY(' + (-e * (24 + i * 6)) + 'px) rotate(' + (e * (i % 2 ? 3 : -3)) + 'deg)'; f.style.opacity = 1 - e * 0.8; });
    const float = Math.sin((now - t0) / 900) * 6;
    cupH.style.transform = 'translateY(' + (e * 140 + float) + 'px) scale(' + (1 - e * 0.12) + ') rotate(' + (-e * 10 + Math.sin((now - t0) / 1400) * 1.5) + 'deg)';
    price.style.transform = 'rotate(' + (-8 + e * 200) + 'deg) scale(' + (1 - e * 0.25) + ') translateY(' + (e * 60) + 'px)';
    disc.style.setProperty('--sc', 1 + e * 0.15);
    if (info) { const r = info.getBoundingClientRect(), k = clamp(1 - (r.top + r.height / 2) / innerHeight); info.style.transform = 'scale(' + (1.22 - k * 0.22) + ') translateY(' + ((0.5 - k) * 50) + 'px)'; }
    if (cupB) { const r = cupB.getBoundingClientRect(); if (r.bottom > 0 && r.top < innerHeight) cupB.style.translate = '0 ' + (Math.sin((now - t0) / 1100) * 4) + 'px'; }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

// ===== ÁREA DA EQUIPE (painel) =====
(() => {
  const g = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const CLS = { 'Aguardando Pix': 'aguardando', 'Cliente informou pagamento': 'informou', 'Pago': 'pago', 'Pronto': 'pronto', 'Entregue': 'entregue', 'Cancelado': 'cancelado' };
  const PAGOS = ['Pago', 'Pronto', 'Entregue'];
  let senha = '', pedidos = [], filtro = 'abertos', vistos = new Set(), primeira = true, timer = null;
  const ss = { get: () => { try { return sessionStorage.getItem('felicitta-senha') || ''; } catch (e) { return ''; } },
               set: v => { try { v ? sessionStorage.setItem('felicitta-senha', v) : sessionStorage.removeItem('felicitta-senha'); } catch (e) {} } };
  let modoNuvem = false, unsub = null;
  async function abrirNuvem() {
    const c = await cloud();
    if (!c) return false;
    const pode = await c.user.canEdit();
    if (!pode) { g('aLoginErr').textContent = 'Só a dona do site e quem foi convidado como Editor podem ver os pedidos.'; return true; }
    modoNuvem = true; g('aLogin').hidden = true; g('aPainel').hidden = false; g('aLive').hidden = false;
    if (!unsub) unsub = c.db.collection('pedidos').onSnapshot(snap => {
      const todos = [];
      snap.docs.forEach(d => ((d.data() || {}).lista || []).forEach(p => todos.push(Object.assign({ uid: d.id }, p))));
      pedidos = todos.sort((a, b) => String(b.data).localeCompare(String(a.data))); g('aLive').classList.remove('off'); g('aLiveTxt').textContent = 'ao vivo'; desenhar();
    }, () => { g('aLive').classList.add('off'); g('aLiveTxt').textContent = 'sem conexão'; });
    return true;
  }
  async function carregar() {
    if (!API_URL) return 'config';
    try {
      const r = await fetch(API_URL + '?senha=' + encodeURIComponent(senha) + '&t=' + Date.now()); const j = await r.json();
      if (!j.ok) return j.erro === 'senha' ? 'senha' : 'falha';
      pedidos = j.pedidos.reverse(); g('aErr').textContent = ''; g('aLive').classList.remove('off'); g('aLiveTxt').textContent = 'ao vivo'; desenhar(); return 'ok';
    } catch (e) { g('aLive').classList.add('off'); g('aLiveTxt').textContent = 'sem conexão'; return 'falha'; }
  }
  function botoes(p) {
    const b = (s, t, m) => `<button type="button" data-id="${esc(p.id)}" data-st="${s}" class="${m ? 'main' : ''}">${t}</button>`;
    const x = `<button type="button" class="x" data-id="${esc(p.id)}" data-st="Cancelado">Cancelar</button>`;
    if (p.status === 'Aguardando Pix' || p.status === 'Cliente informou pagamento') return b('Pago', 'Pix confirmado', 1) + x;
    if (p.status === 'Pago') return b('Pronto', 'Copo pronto', 1) + x;
    if (p.status === 'Pronto') return b('Entregue', p.receber === 'Entrega' ? 'Saiu / entregue' : 'Entregue ao cliente', 1);
    if (p.status === 'Cancelado') return b('Aguardando Pix', 'Reabrir');
    return '';
  }
  function desenhar() {
    const pagos = pedidos.filter(p => PAGOS.includes(p.status));
    g('aPed').textContent = pedidos.filter(p => p.status !== 'Cancelado').length;
    g('aCopos').textContent = pagos.reduce((a, p) => a + Number(p.copos || 0), 0);
    g('aTotal').textContent = brl(pagos.reduce((a, p) => a + Number(p.total || 0), 0));
    g('aPend').textContent = pedidos.filter(p => p.status === 'Aguardando Pix' || p.status === 'Cliente informou pagamento').length;
    const lista = pedidos.filter(p => filtro === 'todos' ? true : filtro === 'abertos' ? !['Entregue', 'Cancelado'].includes(p.status) : p.status === filtro);
    g('aVazio').hidden = lista.length > 0;
    g('aLista').innerHTML = lista.map(p => {
      const hora = p.data ? new Date(p.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';
      return `<article class="eq-card${!primeira && !vistos.has(p.id) ? ' novo' : ''}"><div class="eq-ct"><span class="eq-id">#${esc(p.id)}</span><span class="eq-pill ${CLS[p.status] || ''}">${esc(p.status)}</span></div>
        <div class="eq-nome">${esc(p.nome)} <span style="font-weight:400;font-size:13px;color:var(--soft)">${hora}</span></div>
        <ul class="eq-info"><li><span>Copos:</span> ${esc(p.copos)} · <span>Fruta:</span> ${esc(p.fruta)}</li><li><span>Recheio:</span> ${esc(p.recheio)}</li><li><span>Extras:</span> ${esc(p.extras)}</li>
        <li><span>Receber:</span> ${esc(p.receber)}${p.endereco ? ' – ' + esc(p.endereco) : ''}</li>${p.obs ? `<li><span>Obs.:</span> ${esc(p.obs)}</li>` : ''}</ul>
        <div class="eq-tot">${brl(Number(p.total || 0))}</div><div class="eq-acts">${botoes(p)}</div></article>`;
    }).join('');
    if (!primeira && pedidos.some(p => !vistos.has(p.id)) && navigator.vibrate) navigator.vibrate(200);
    if (!pedidos.length) g('aVazio').hidden = false;
    pedidos.forEach(p => vistos.add(p.id)); primeira = false;
  }
  g('aLista').addEventListener('click', async e => {
    const bt = e.target.closest('button[data-st]'); if (!bt) return;
    if (bt.dataset.st === 'Cancelado' && !confirm('Cancelar o pedido #' + bt.dataset.id + '?')) return;
    bt.closest('.eq-acts').querySelectorAll('button').forEach(x => x.disabled = true);
    if (modoNuvem) { const p = pedidos.find(x => x.id === bt.dataset.id); const ok = p && await statusNuvem(p.uid, p.id, bt.dataset.st); if (!ok) g('aErr').textContent = 'Não foi possível atualizar. Tente de novo.'; return; }
    const r = await api({ acao: 'status', senha, id: bt.dataset.id, status: bt.dataset.st });
    if (!r || !r.ok) g('aErr').textContent = 'Não foi possível atualizar. Tente de novo.';
    carregar();
  });
  document.querySelectorAll('.eq-f button').forEach(b => b.onclick = () => { document.querySelectorAll('.eq-f button').forEach(x => x.classList.toggle('on', x === b)); filtro = b.dataset.f; desenhar(); });
  async function entrar(v) {
    senha = v; g('aLoginErr').textContent = 'Entrando…';
    const r = await carregar();
    if (r === 'ok') { ss.set(v); g('aLogin').hidden = true; g('aPainel').hidden = false; g('aLive').hidden = false; clearInterval(timer); timer = setInterval(carregar, 8000); g('aLoginErr').textContent = ''; }
    else { ss.set(''); g('aLoginErr').textContent = r === 'senha' ? 'Senha incorreta.' : r === 'config' ? 'O painel ainda não está ligado à planilha. Coloque a URL do Apps Script em API_URL (js/script.js).' : 'Não foi possível conectar. Verifique a internet.'; }
  }
  const SENHA_HASH = 'bc66d970c2b9c00cb42e8473d46d43f276d846c4eafa5ce7cc4ddff657ad4a2d'; // senha da equipe (só o resumo, não a senha)
  async function hash(t) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }
  async function entrarNuvem(v) {
    g('aLoginErr').textContent = 'Entrando…';
    if (await hash(v) !== SENHA_HASH) { g('aLoginErr').textContent = 'Senha incorreta.'; return; }
    ss.set(v);
    const ok = await abrirNuvem();
    if (!ok) { g('aLoginErr').textContent = 'O painel ainda não está ligado à planilha. Coloque a URL do Apps Script em API_URL (js/script.js).'; return; }
    if (modoNuvem) g('aLoginErr').textContent = '';
  }
  g('aLogin').addEventListener('submit', e => { e.preventDefault(); API_URL ? entrar(g('aSenha').value) : entrarNuvem(g('aSenha').value); });
  g('aSair').onclick = () => { ss.set(''); modoNuvem = false; clearInterval(timer); g('aPainel').hidden = true; g('aLogin').hidden = false; g('aLive').hidden = true; g('aSenha').value = ''; };
  function rota() {
    const abrir = location.hash === '#equipe';
    g('equipe').hidden = !abrir; document.body.style.overflow = abrir ? 'hidden' : '';
    if (abrir) {
      if (!API_URL) { if (!g('aPainel').hidden) return; const sv = ss.get(); if (sv) entrarNuvem(sv); else setTimeout(() => g('aSenha').focus(), 50); return; }
      const sv = ss.get(); if (sv && g('aPainel').hidden) entrar(sv); else if (g('aPainel').hidden) setTimeout(() => g('aSenha').focus(), 50);
    }
    else clearInterval(timer);
  }
  addEventListener('hashchange', rota); rota();
})();
