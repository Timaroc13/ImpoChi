// POST /api/lead — receives the RFQ form (multipart/form-data).
// 1) origin + honeypot + rate limit (+ Turnstile, which flags but never rejects)  2) validate  3) save to D1 (+ files to R2)
// 4) Telegram alert with attachments  5) optional forward to n8n.
import { isValidCuit, contactCheck, leadScore, ORDER_VALUES, TIMELINES } from '../../src/lib/lead.js';
import { recordFunnelEvent } from '../_lib/funnel';
import { sendTelegram } from '../_lib/telegram';
import { type Ctx, type Env, json, sha256, newId, escapeHtml } from '../_lib/util';

const MAX_BYTES = 10 * 1024 * 1024;
const FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const RUBROS = ['maquinaria', 'packaging', 'mobiliario', 'otro'];
const RATE_LIMIT = { max: 5, minutes: 10 };
const NOT_NULL = new Set(['rubro', 'producto', 'cantidad', 'valor_pedido', 'plazo', 'nombre', 'empresa', 'ri', 'whatsapp', 'email', 'consentimiento']);

const TEXT_FIELDS = {
  rubro: 20, producto: 2000, especificaciones: 3000, cantidad: 100, precio_objetivo: 100, valor_pedido: 20, plazo: 20,
  experiencia: 20, nombre: 120, empresa: 120, ri: 10, cuit: 20, cargo: 60, whatsapp: 30, email: 160, provincia: 60,
  consentimiento: 5, utm_source: 200, utm_medium: 200, utm_campaign: 200, utm_term: 200, utm_content: 200, gclid: 300,
  landing_page: 300, page: 300, pv: 40, turnstile_state: 20, form_variant: 10,
} as const;
type Field = keyof typeof TEXT_FIELDS;

export const onRequestPost = async ({ request, env, waitUntil }: Ctx) => {
  // Origin check: only our own site may post.
  const origin = request.headers.get('Origin');
  const self = new URL(request.url).origin;
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (origin && origin !== self && !allowed.includes(origin)) return json({ ok: false, error: 'origin' }, 403);

  let form: FormData;
  try { form = await request.formData(); } catch { return json({ ok: false, error: 'bad_request' }, 400); }

  // Honeypot: bots fill every field. Pretend success.
  if (String(form.get('empresa_web') || '').trim()) return json({ ok: true });

  // Turnstile: verify when a token is present, but never reject. A widget error, timeout, missing or rejected
  // token marks the lead 'unverified'; the honeypot above and the per-IP rate limit below still apply.
  let turnstile: 'verified' | 'unverified' | 'not_configured' = 'not_configured';
  let turnstileReason = '';
  if (env.TURNSTILE_SECRET) {
    const token = String(form.get('cf-turnstile-response') || '');
    if (!token) {
      turnstile = 'unverified';
      turnstileReason = String(form.get('turnstile_state') || 'missing').slice(0, 20) || 'missing';
    } else {
      const body = new FormData();
      body.append('secret', env.TURNSTILE_SECRET);
      body.append('response', token);
      const cip = request.headers.get('CF-Connecting-IP');
      if (cip) body.append('remoteip', cip);
      let v: { success?: boolean } = {};
      try {
        const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
        v = (await r.json()) as { success?: boolean };
      } catch (e) {
        console.error('turnstile siteverify unreachable', e);
      }
      if (v.success) turnstile = 'verified';
      else {
        turnstile = 'unverified';
        turnstileReason = 'siteverify';
        await recordFunnelEvent(env, funnelInput(form, 'turnstile_fail', 'siteverify'), request.headers.get('User-Agent'));
      }
    }
  }

  const ip = request.headers.get('CF-Connecting-IP') || '0.0.0.0';
  const ipHash = await sha256(`${env.IP_SALT || 'dd'}:${ip}`);
  const since = new Date(Date.now() - RATE_LIMIT.minutes * 60e3).toISOString();
  const recent = await env.DB.prepare('SELECT COUNT(*) AS n FROM leads WHERE ip_hash = ? AND created_at > ?').bind(ipHash, since).first<number>('n');
  if ((recent ?? 0) >= RATE_LIMIT.max) return json({ ok: false, error: 'rate_limited' }, 429);

  // Read and trim text fields.
  const v = {} as Record<Field, string>;
  for (const [k, max] of Object.entries(TEXT_FIELDS) as [Field, number][]) {
    v[k] = String(form.get(k) ?? '').trim().slice(0, max);
  }

  // Validate (mirrors the form; never trust the browser).
  // quick (home + sector pages): WhatsApp (valid), producto and consentimiento; rubro optional (hidden, from the page).
  // full (/cotizacion): rubro, producto, valor_pedido, nombre, consentimiento, and WhatsApp OR email.
  const quick = v.form_variant === 'quick';
  const errors: string[] = [];
  if (quick) {
    if (v.rubro && !RUBROS.includes(v.rubro)) v.rubro = '';
    if (v.producto.length < 3) errors.push('producto');
    if (!v.whatsapp || contactCheck({ whatsapp: v.whatsapp, email: '' }).errors.contact) errors.push('whatsapp');
    if (v.valor_pedido && !ORDER_VALUES.some((o) => o.value === v.valor_pedido)) v.valor_pedido = '';
  } else {
    if (!RUBROS.includes(v.rubro)) errors.push('rubro');
    if (v.producto.length < 10) errors.push('producto');
    if (!ORDER_VALUES.some((o) => o.value === v.valor_pedido)) errors.push('valor_pedido');
    if (v.nombre.length < 2) errors.push('nombre');
  }
  if (v.plazo && !TIMELINES.some((o) => o.value === v.plazo)) errors.push('plazo');
  if (v.ri && !['si', 'no', 'nose'].includes(v.ri)) errors.push('ri');
  if (v.cuit && !isValidCuit(v.cuit)) errors.push('cuit');
  const contact = contactCheck({ whatsapp: v.whatsapp, email: v.email });
  if (contact.errors.whatsapp) errors.push('whatsapp');
  if (contact.errors.email) errors.push('email');
  if (contact.errors.contact) errors.push('contact');
  if (v.consentimiento !== 'si') errors.push('consentimiento');

  const files = form.getAll('archivos').filter((f): f is File => typeof f !== 'string' && f.size > 0);
  const total = files.reduce((s, f) => s + f.size, 0);
  if (total > MAX_BYTES) errors.push('archivos');
  if (files.some((f) => !FILE_TYPES.includes(f.type))) errors.push('archivos');
  if (errors.length) return json({ ok: false, error: 'validation', fields: [...new Set(errors)] }, 400);

  v.whatsapp = contact.whatsapp;
  v.email = contact.email;
  v.cuit = v.cuit.replace(/\D/g, '');
  // Quick-form leads carry no order value: score B, the same as "No sé todavía".
  const score = quick && !v.valor_pedido ? 'B' : leadScore({ orderValue: v.valor_pedido });
  const id = newId();
  const createdAt = new Date().toISOString();

  // Files → R2 (if bound). Keep the bytes in memory to forward them to Telegram as well.
  const stored: { key: string; name: string; size: number; type: string }[] = [];
  const buffers: { name: string; type: string; data: ArrayBuffer }[] = [];
  for (const f of files) {
    const name = f.name.replace(/[^\w.\- ]+/g, '_').slice(0, 100) || 'archivo';
    const data = await f.arrayBuffer();
    buffers.push({ name, type: f.type, data });
    if (env.FILES) {
      const key = `leads/${id}/${name}`;
      await env.FILES.put(key, data, { httpMetadata: { contentType: f.type } });
      stored.push({ key, name, size: f.size, type: f.type });
    }
  }

  const { pv: _pv, turnstile_state: _ts, form_variant: _fv, ...fieldsRaw } = v;
  // Fields not sent are null. Columns declared NOT NULL in migrations/0001 keep '' instead.
  const fields: Record<string, string | null> = {};
  for (const [k, val] of Object.entries(fieldsRaw)) fields[k] = val === '' && !NOT_NULL.has(k) ? null : val;
  const row = {
    id, created_at: createdAt, lead_score: score, ...fields,
    files: stored.length ? JSON.stringify(stored) : null,
    ip_hash: ipHash,
    country: request.headers.get('CF-IPCountry') || null,
    user_agent: (request.headers.get('User-Agent') || '').slice(0, 300),
    turnstile,
  };
  const insert = (r: Record<string, unknown>) => {
    const cols = Object.keys(r);
    return env.DB.prepare(`INSERT INTO leads (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`)
      .bind(...cols.map((c) => r[c] ?? null))
      .run();
  };
  try {
    await insert(row);
  } catch (e) {
    // Before migrations/0003 is applied there is no `turnstile` column: never lose the lead over it.
    if (!/turnstile/i.test(String(e))) throw e;
    const { turnstile: _t, ...rest } = row;
    await insert({ ...rest, notas: turnstile === 'unverified' ? `turnstile_unverified (${turnstileReason})` : null });
  }

  await recordFunnelEvent(env, funnelInput(form, 'submit_success'), request.headers.get('User-Agent'));

  // Notifications run after the response; a failure here never loses the lead (it is already in D1).
  waitUntil(notifyTelegram(env, { ...row, turnstile_reason: turnstileReason, form_variant: quick ? 'quick' : 'full' }, buffers, new URL(request.url).origin).catch((e) => console.error('telegram', e)));
  if (env.FORWARD_URL) {
    waitUntil(
      fetch(env.FORWARD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(env.FORWARD_SECRET ? { 'X-DD-Secret': env.FORWARD_SECRET } : {}) },
        body: JSON.stringify({
          ...Object.fromEntries(Object.entries(row).map(([k, val]) => [k, val === '' ? null : val])),
          ip_hash: undefined, files: stored, form_variant: quick ? 'quick' : 'full',
        }),
      }).catch((e) => console.error('forward', e)),
    );
  }

  return json({ ok: true, id, lead_score: score });
};

function funnelInput(form: FormData, event: string, detail = '') {
  const g = (k: string) => String(form.get(k) ?? '');
  return { event, detail, pv: g('pv'), path: g('page') || '/', utm_campaign: g('utm_campaign'), utm_term: g('utm_term') };
}

export const onRequest = () => json({ ok: false, error: 'method_not_allowed' }, 405, { Allow: 'POST' });

const LABEL = (list: { value: string; label: string }[], val: string) => list.find((o) => o.value === val)?.label ?? val;

async function notifyTelegram(env: Env, r: Record<string, any>, files: { name: string; type: string; data: ArrayBuffer }[], origin: string) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    console.warn('telegram: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set');
    return;
  }
  const e = (s: string) => escapeHtml(String(s ?? ''));
  const wa = String(r.whatsapp || '').replace(/\D/g, '');
  const quick = r.form_variant === 'quick';
  const lines = [
    quick
      ? `<b>⚡️ QUICK FORM · ${e(r.rubro || 'sin rubro')} · ${e(r.page || r.landing_page || '')}</b>`
      : `<b>${r.lead_score === 'A' ? '🟢' : r.lead_score === 'B' ? '🟡' : '⚪️'} Lead ${e(r.lead_score)} · ${e(r.rubro)} · ${e(LABEL(ORDER_VALUES, r.valor_pedido))}</b>`,
    r.turnstile === 'unverified' ? `⚠️ Captcha no verificado (${e(r.turnstile_reason || 'sin token')}): revisá que sea una persona` : null,
    quick ? null : `<b>${e(r.empresa || '(sin empresa)')}</b> — ${e(r.nombre)}`,
    '',
    e(r.producto.slice(0, 1500)),
    '',
    wa ? `WhatsApp: https://wa.me/${wa}` : 'WhatsApp: (no dejó)',
    r.email ? `Email: ${e(r.email)}` : quick ? null : 'Email: (no dejó)',
    `Origen: ${e([r.utm_source, r.utm_medium, r.utm_campaign, r.utm_term].filter(Boolean).join(' / ') || 'directo')} · ${e(r.landing_page || r.page)}`,
    files.length ? `Archivos: ${files.length}` : null,
    `${origin}/api/leads.csv`,
  ].filter((l) => l !== null);
  const res = await sendTelegram(env, 'sendMessage', JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: lines.join('\n'), parse_mode: 'HTML', disable_web_page_preview: true }));
  if (!res.ok) console.error('telegram sendMessage failed:', res.status, res.description);
  for (const f of files) {
    const body = new FormData();
    body.append('chat_id', env.TELEGRAM_CHAT_ID);
    body.append('caption', `${r.empresa || r.nombre || r.whatsapp} · ${f.name}`.slice(0, 1000));
    body.append('document', new Blob([f.data], { type: f.type }), f.name);
    const rf = await sendTelegram(env, 'sendDocument', body);
    if (!rf.ok) console.error('telegram sendDocument failed:', rf.status, rf.description);
  }
}
