/**
 * Felicitta – recebe os pedidos do site e alimenta o painel de administrador.
 * Planilha: aba "Pedidos" (criada automaticamente).
 * Senha do painel: Configurações do projeto > Propriedades do script > SENHA_ADMIN
 * Pix automático (opcional): propriedade MP_TOKEN = Access Token de produção do Mercado Pago
 *   (opcional) PAYER_EMAIL = e-mail genérico usado como pagador
 */
const PRECO_BASE = 10, PRECO_EXTRA = 2;
const CAB = ['ID', 'Data/hora', 'Nome', 'Copos', 'Fruta', 'Recheio', 'Extras', 'Receber', 'Endereço', 'Observação', 'Total', 'Status'];
const STATUS = ['Aguardando Pix', 'Cliente informou pagamento', 'Pago', 'Pronto', 'Entregue', 'Cancelado'];
const COL_STATUS = 12;

function aba_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName('Pedidos');
  if (!sh) { sh = ss.insertSheet('Pedidos'); sh.appendRow(CAB); sh.setFrozenRows(1); }
  return sh;
}
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function senhaOk_(s) { const real = PropertiesService.getScriptProperties().getProperty('SENHA_ADMIN'); return !!real && s === real; }
// texto seguro: limita tamanho e impede fórmulas na planilha
function txt_(v, max) { let s = String(v == null ? '' : v).slice(0, max || 80); if (/^[=+\-@]/.test(s)) s = "'" + s; return s; }
function num_(v) { const n = Number(v); return isFinite(n) && n >= 0 && n < 100000 ? n : 0; }
function linha_(sh, id) {
  if (sh.getLastRow() < 2) return 0;
  const ids = sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) if (String(ids[i][0]) === String(id)) return i + 2;
  return 0;
}

function linhaPedido_(id, d, status) {
  return [id, new Date(), txt_(d.nome, 60), num_(d.copos), txt_(d.fruta, 30), txt_(d.recheio, 40), txt_(d.extras, 200),
    txt_(d.receber, 30), txt_(d.endereco, 200), txt_(d.obs, 300), num_(d.total), status];
}
// o preço é recalculado aqui, para ninguém mudar o valor pelo navegador
function preco_(d) {
  const copos = Math.max(1, Math.min(20, Math.floor(num_(d.copos)))), nx = Math.max(0, Math.min(15, Math.floor(num_(d.nx))));
  return (PRECO_BASE + PRECO_EXTRA * nx) * copos;
}
function mp_(metodo, caminho, corpo) {
  const token = PropertiesService.getScriptProperties().getProperty('MP_TOKEN');
  const op = { method: metodo, headers: { Authorization: 'Bearer ' + token }, muteHttpExceptions: true };
  if (corpo) { op.contentType = 'application/json'; op.payload = JSON.stringify(corpo); op.headers['X-Idempotency-Key'] = Utilities.getUuid(); }
  const r = UrlFetchApp.fetch('https://api.mercadopago.com' + caminho, op);
  return { code: r.getResponseCode(), body: JSON.parse(r.getContentText() || '{}') };
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const d = JSON.parse((e.postData && e.postData.contents) || '{}');
    const sh = aba_();
    if (d.acao === 'novo') {
      const id = Utilities.getUuid().slice(0, 6).toUpperCase();
      sh.appendRow(linhaPedido_(id, d, 'Aguardando Pix'));
      return json_({ ok: true, id: id });
    }
    if (d.acao === 'criar_pix') { // Pix automático: só registra o pedido quando o pagamento for aprovado
      const props = PropertiesService.getScriptProperties();
      if (!props.getProperty('MP_TOKEN')) return json_({ ok: true, mp: false });
      const ped = d.pedido || {};
      ped.total = preco_(ped);
      if (Math.abs(ped.total - num_((d.pedido || {}).total)) > 0.001) return json_({ ok: false, erro: 'preco' });
      const exp = Utilities.formatDate(new Date(Date.now() + 30 * 60000), 'GMT-03:00', "yyyy-MM-dd'T'HH:mm:ss.SSS") + '-03:00';
      const r = mp_('post', '/v1/payments', { transaction_amount: ped.total, description: 'Brownie da Felicidade', payment_method_id: 'pix',
        payer: { email: props.getProperty('PAYER_EMAIL') || 'cliente@felicitta.com.br' }, date_of_expiration: exp });
      if (r.code >= 300 || !r.body.point_of_interaction) return json_({ ok: false, erro: 'mp' });
      CacheService.getScriptCache().put('p_' + r.body.id, JSON.stringify(ped), 21600);
      const t = r.body.point_of_interaction.transaction_data;
      return json_({ ok: true, mp: true, pid: String(r.body.id), qr_code: t.qr_code, qr_base64: t.qr_code_base64 });
    }
    if (d.acao === 'status_pix') {
      const pid = String(d.pid || '');
      if (!/^\d+$/.test(pid)) return json_({ ok: false, erro: 'pid' });
      const cache = CacheService.getScriptCache(), feito = cache.get('d_' + pid);
      if (feito) return json_({ ok: true, status: 'approved', id: feito });
      const r = mp_('get', '/v1/payments/' + pid);
      if (r.code >= 300) return json_({ ok: false, erro: 'mp' });
      let id = null;
      if (r.body.status === 'approved') {
        const ped = cache.get('p_' + pid);
        id = Utilities.getUuid().slice(0, 6).toUpperCase();
        sh.appendRow(linhaPedido_(id, ped ? JSON.parse(ped) : { nome: '(pedido sem dados)', total: r.body.transaction_amount }, 'Pago'));
        cache.put('d_' + pid, id, 21600); cache.remove('p_' + pid);
      }
      return json_({ ok: true, status: r.body.status, id: id });
    }
    if (d.acao === 'cliente_pagou') { // o cliente só consegue avisar que pagou
      const r = linha_(sh, d.id);
      if (r && sh.getRange(r, COL_STATUS).getValue() === 'Aguardando Pix') sh.getRange(r, COL_STATUS).setValue('Cliente informou pagamento');
      return json_({ ok: true });
    }
    if (d.acao === 'status') { // só o painel, com senha
      if (!senhaOk_(d.senha)) return json_({ ok: false, erro: 'senha' });
      if (STATUS.indexOf(d.status) < 0) return json_({ ok: false, erro: 'status' });
      const r = linha_(sh, d.id);
      if (!r) return json_({ ok: false, erro: 'id' });
      sh.getRange(r, COL_STATUS).setValue(d.status);
      return json_({ ok: true });
    }
    return json_({ ok: false, erro: 'acao' });
  } catch (err) {
    return json_({ ok: false, erro: 'falha' });
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (!senhaOk_(p.senha)) return json_({ ok: false, erro: 'senha' });
  const v = aba_().getDataRange().getValues();
  v.shift();
  const pedidos = v.filter(r => r[0]).map(r => ({
    id: String(r[0]), data: r[1] instanceof Date ? r[1].toISOString() : String(r[1]), nome: r[2], copos: r[3], fruta: r[4],
    recheio: r[5], extras: r[6], receber: r[7], endereco: r[8], obs: r[9], total: r[10], status: r[11]
  }));
  return json_({ ok: true, pedidos: pedidos });
}
