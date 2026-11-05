// POST /api/lead — receives the RFQ form (multipart/form-data).
// 1) origin + honeypot + Turnstile + rate limit  2) validate  3) save to D1 (+ files to R2)
// 4) Telegram alert with attachments  5) optional forward to n8n.
import { isValidCuit, normalizePhone, isValidEmail, leadScore, ORDER_VALUES, TIMELINES } from '../../src/lib/lead.js';
import { type Ctx, type Env, json, sha256, newId, escapeHtml } from '../_lib/util';

const MAX_BYTES = 10 * 1024 * 1024;
const FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const RUBROS = ['maquinaria', 'packaging', 'mobiliario', 'otro'];
const RATE_LIMIT = { max: 5, minutes: 10 };

const TEXT_FIELDS = {
  rubro: 20, producto: 200, especificaciones: 3000, cantidad: 100, precio_objetivo: 100, valor_pedido: 20, plazo: 20,
  experiencia: 20, nombre: 120, empresa: 120, ri: 10, cuit: 20, cargo: 60, whatsapp: 30, email: 160, provincia: 60,
  consentimiento: 5, utm_source: 200, utm_medium: 200, utm_campaign: 200, utm_term: 200, utm_content: 200, gclid: 300,
  landing_page: 300, page: 300,
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
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
    const v = (await r.json()) as { success?: boolean };
    if (!v.success) return json({ ok: false, error: 'captcha' }, 403);
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

  // Validate (mirrors the client; never trust the browser).
  const errors: string[] = [];
  if (!RUBROS.includes(v.rubro)) errors.push('rubro');
  if (v.producto.length < 10) errors.push('producto');
  if (!v.cantidad) errors.push('cantidad');
  if (!ORDER_VALUES.some((o) => o.value === v.valor_pedido)) errors.push('valor_pedido');
  if (!TIMELINES.some((o) => o.value === v.plazo)) errors.push('plazo');
  if (v.nombre.length < 3) errors.push('nombre');
  if (v.empresa.length < 2) errors.push('empresa');
  if (!['si', 'no', 'nose'].includes(v.ri)) errors.push('ri');
  if (v.cuit && !isValidCuit(v.cuit)) errors.push('cuit');
  const phone = normalizePhone(v.whatsapp);
  if (!phone.ok) errors.push('whatsapp');
  if (!isValidEmail(v.email)) errors.push('email');
  if (v.consentimiento !== 'si') errors.push('consentimiento');

  const files = form.getAll('archivos').filter((f): f is File => typeof f !== 'string' && f.size > 0);
  const total = files.reduce((s, f) => s + f.size, 0);
  if (total > MAX_BYTES) errors.push('archivos');
  if (files.some((f) => !FILE_TYPES.includes(f.type))) errors.push('archivos');
  if (errors.length) return json({ ok: false, error: 'validation', fields: [...new Set(errors)] }, 400);

  v.whatsapp = phone.e164;
  v.cuit = v.cuit.replace(/\D/g, '');
  const score = leadScore({ ri: v.ri, orderValue: v.valor_pedido, timeline: v.plazo });
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

  const row = {
    id, created_at: createdAt, lead_score: score, ...v,
    files: stored.length ? JSON.stringify(stored) : null,
    ip_hash: ipHash,
    country: request.headers.get('CF-IPCountry') || null,
    user_agent: (request.headers.get('User-Agent') || '').slice(0, 300),
  };
  const cols = Object.keys(row);
  await env.DB.prepare(`INSERT INTO leads (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`)
    .bind(...cols.map((c) => (row as Record<string, unknown>)[c] ?? null))
    .run();

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

export const onRequest = () => json({ ok: false, error: 'method_not_allowed' }, 405, { Allow: 'POST' });

const LABEL = (list: { value: string; label: string }[], val: string) => list.find((o) => o.value === val)?.label ?? val;

async function notifyTelegram(env: Env, r: Record<string, any>, files: { name: string; type: string; data: ArrayBuffer }[], origin: string) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return;
  const api = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}`;
  const e = (s: string) => escapeHtml(String(s ?? ''));
  const wa = r.whatsapp.replace(/\D/g, '');
  const lines = [
    `<b>${r.lead_score === 'A' ? '🟢' : r.lead_score === 'B' ? '🟡' : '⚪️'} Lead ${e(r.lead_score)} · ${e(r.rubro)}</b>`,
    `<b>${e(r.empresa)}</b> — ${e(r.nombre)}${r.cargo ? ` (${e(r.cargo)})` : ''}`,
    `RI/sociedad: ${e(r.ri)}${r.cuit ? ` · CUIT ${e(r.cuit)}` : ''}${r.provincia ? ` · ${e(r.provincia)}` : ''}`,
    '',
    `<b>Producto:</b> ${e(r.producto)}`,
    `<b>Cantidad:</b> ${e(r.cantidad)}${r.precio_objetivo ? ` · objetivo ${e(r.precio_objetivo)}` : ''}`,
    `<b>Valor:</b> ${e(LABEL(ORDER_VALUES, r.valor_pedido))} · <b>Plazo:</b> ${e(LABEL(TIMELINES, r.plazo))}`,
    r.experiencia ? `Experiencia China: ${e(r.experiencia)}` : '',
    r.especificaciones ? `\n<i>${e(r.especificaciones.slice(0, 800))}</i>` : '',
    '',
    `WhatsApp: https://wa.me/${wa}`,
    `Email: ${e(r.email)}`,
    `Origen: ${e([r.utm_source, r.utm_medium, r.utm_campaign, r.utm_term].filter(Boolean).join(' / ') || 'directo')} · ${e(r.landing_page || r.page)}`,
    `Archivos: ${files.length} · ID ${e(r.id)} · ${origin}/api/leads.csv`,
  ].filter((l) => l !== '');
  await fetch(`${api}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: lines.join('\n'), parse_mode: 'HTML', disable_web_page_preview: true }),
  });
  for (const f of files) {
    const body = new FormData();
    body.append('chat_id', env.TELEGRAM_CHAT_ID);
    body.append('caption', `${r.empresa} · ${f.name}`.slice(0, 1000));
    body.append('document', new Blob([f.data], { type: f.type }), f.name);
    await fetch(`${api}/sendDocument`, { method: 'POST', body });
  }
}
