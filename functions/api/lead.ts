// POST /api/lead — receives the RFQ form (multipart/form-data).
// 1) origin + honeypot + Turnstile + rate limit  2) validate  3) save to D1 (+ files to R2)
// 4) Telegram alert with attachments  5) optional forward to n8n.
import { isValidCuit, contactCheck, leadScore, ORDER_VALUES, TIMELINES } from '../../src/lib/lead.js';
import { recordFunnelEvent } from '../_lib/funnel';
import { sendTelegram } from '../_lib/telegram';
import { type Ctx, type Env, json, sha256, newId, escapeHtml } from '../_lib/util';

const MAX_BYTES = 10 * 1024 * 1024;
const FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const RUBROS = ['maquinaria', 'packaging', 'mobiliario', 'otro'];
const RATE_LIMIT = { max: 5, minutes: 10 };

const TEXT_FIELDS = {
  rubro: 20, producto: 2000, especificaciones: 3000, cantidad: 100, precio_objetivo: 100, valor_pedido: 20, plazo: 20,
  experiencia: 20, nombre: 120, empresa: 120, ri: 10, cuit: 20, cargo: 60, whatsapp: 30, email: 160, provincia: 60,
  consentimiento: 5, utm_source: 200, utm_medium: 200, utm_campaign: 200, utm_term: 200, utm_content: 200, gclid: 300,
  landing_page: 300, page: 300, pv: 40,
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

  // Turnstile (skipped when no secret is configured, e.g. local dev).
  if (env.TURNSTILE_SECRET) {
    const token = String(form.get('cf-turnstile-response') || '');
    const body = new FormData();
    body.append('secret', env.TURNSTILE_SECRET);
    body.append('response', token);
    const ip = request.headers.get('CF-Connecting-IP');
    if (ip) body.append('remoteip', ip);
    let v: { success?: boolean } = {};
    try {
      const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
      v = (await r.json()) as { success?: boolean };
    } catch (e) {
      console.error('turnstile siteverify unreachable', e);
    }
    if (!v.success) {
      await recordFunnelEvent(env, funnelInput(form, 'turnstile_fail', 'siteverify'), request.headers.get('User-Agent'));
      return json({ ok: false, error: 'captcha' }, 403);
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

  // Validate (mirrors the form; never trust the browser). Required: rubro, producto, valor_pedido,
  // nombre, consentimiento, and WhatsApp OR email (at least one, each valid if filled). Everything else is optional.
  const errors: string[] = [];
  if (!RUBROS.includes(v.rubro)) errors.push('rubro');
  if (v.producto.length < 10) errors.push('producto');
  if (!ORDER_VALUES.some((o) => o.value === v.valor_pedido)) errors.push('valor_pedido');
  if (v.plazo && !TIMELINES.some((o) => o.value === v.plazo)) errors.push('plazo');
  if (v.nombre.length < 2) errors.push('nombre');
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
  const score = leadScore({ orderValue: v.valor_pedido });
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

  const { pv: _pv, ...fields } = v;
  const row = {
    id, created_at: createdAt, lead_score: score, ...fields,
    files: stored.length ? JSON.stringify(stored) : null,
    ip_hash: ipHash,
    country: request.headers.get('CF-IPCountry') || null,
    user_agent: (request.headers.get('User-Agent') || '').slice(0, 300),
  };
  const cols = Object.keys(row);
  await env.DB.prepare(`INSERT INTO leads (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`)
    .bind(...cols.map((c) => (row as Record<string, unknown>)[c] ?? null))
    .run();

  await recordFunnelEvent(env, funnelInput(form, 'submit_success'), request.headers.get('User-Agent'));

  // Notifications run after the response; a failure here never loses the lead (it is already in D1).
  waitUntil(notifyTelegram(env, row, buffers, new URL(request.url).origin).catch((e) => console.error('telegram', e)));
  if (env.FORWARD_URL) {
    waitUntil(
      fetch(env.FORWARD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(env.FORWARD_SECRET ? { 'X-DD-Secret': env.FORWARD_SECRET } : {}) },
        body: JSON.stringify({ ...row, ip_hash: undefined, files: stored }),
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
  const lines = [
    `<b>${r.lead_score === 'A' ? '🟢' : r.lead_score === 'B' ? '🟡' : '⚪️'} Lead ${e(r.lead_score)} · ${e(r.rubro)} · ${e(LABEL(ORDER_VALUES, r.valor_pedido))}</b>`,
    `<b>${e(r.empresa || '(sin empresa)')}</b> — ${e(r.nombre)}`,
    '',
    e(r.producto.slice(0, 1500)),
    '',
    wa ? `WhatsApp: https://wa.me/${wa}` : 'WhatsApp: (no dejó)',
    r.email ? `Email: ${e(r.email)}` : 'Email: (no dejó)',
    `Origen: ${e([r.utm_source, r.utm_medium, r.utm_campaign, r.utm_term].filter(Boolean).join(' / ') || 'directo')} · ${e(r.landing_page || r.page)}`,
    files.length ? `Archivos: ${files.length}` : null,
    `${origin}/api/leads.csv`,
  ].filter((l) => l !== null);
  const res = await sendTelegram(env, 'sendMessage', JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: lines.join('\n'), parse_mode: 'HTML', disable_web_page_preview: true }));
  if (!res.ok) console.error('telegram sendMessage failed:', res.status, res.description);
  for (const f of files) {
    const body = new FormData();
    body.append('chat_id', env.TELEGRAM_CHAT_ID);
    body.append('caption', `${r.empresa || r.nombre} · ${f.name}`.slice(0, 1000));
    body.append('document', new Blob([f.data], { type: f.type }), f.name);
    const rf = await sendTelegram(env, 'sendDocument', body);
    if (!rf.ok) console.error('telegram sendDocument failed:', rf.status, rf.description);
  }
}
