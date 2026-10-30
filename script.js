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
$('extras').addEventListener('click', e => { const b = e.target.closest('button[data-k]'); if (!b) return; st.x[b.dataset.k] = Math.max(0, Math.min(3, st.x[b.dataset.k] + +b.dataset.d)); render(); });$('semMousse').addEventListener('change', e => { st.semMousse = e.target.checked; render(); });
$('qMinus').onclick = () => { st.qty = Math.max(1, st.qty - 1); render(); };$('qPlus').onclick = () => { st.qty = Math.min(20, st.qty + 1); render(); };
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
  if ($('obs').value.trim()) linhas.push('Obs.: ' +$('obs').value.trim());
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
  $('total').textContent = brl(precoCopo() * st.qty); $('mTotal').textContent = brl(precoCopo() * st.qty);$('mNote').textContent = st.qty + (st.qty > 1 ? ' copos' : ' copo') + (n ? ' · ' + n + ' extra' + (n > 1 ? 's' : '') : '');
  $('totalNote').textContent = st.qty + (st.qty > 1 ? ' copos' : ' copo') + (n ? ', ' + n + (n > 1 ? ' camadas extras' : ' camada extra') + ' cada' : ', sem camadas extras') + (st.qty > 1 ? ' · ' + brl(precoCopo()) + ' cada' : '');
  drawCup();
}
function valida(){
  $('err').textContent = '';$('ok').textContent = '';
  if (!$('nome').value.trim()) { $('err').textContent = 'Escreva seu nome para enviar o pedido.';$('nome').focus(); return false; }
  const rec = document.querySelector('input[name=receber]:checked').value;
  if (rec === 'Entrega' && !$('end').value.trim()) {$('err').textContent = 'Escreva o endereço para a entrega.'; $('end').focus(); return false; }
  return true;
}
// ===== CONFIGURAÇÃO DO PIX =====
const PIX_CHAVE = 'f6eb027b-4f23-4192-a24e-8ad8b8a70117';          
const PIX_NOME = 'JHONATAN F G OLIVEIRA';  
const PIX_CIDADE = 'IPATINGA'; 
const WHATS = '';              
const API_URL = '';            
// ================================
const semAcento = t => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
const tlv = (id, v) => id + String(v.length).padStart(2, '0') + v;
function crc16(str){ let c = 0xFFFF; for (let i = 0; i < str.length; i++) { c ^= str.charCodeAt(i) << 8; for (let k = 0; k < 8; k++) c = (c & 0x8
