// POST /api/funnel — cookieless funnel counters sent by the quote form (navigator.sendBeacon, JSON body).
// Always answers 204 so the browser never retries or shows anything; invalid events are dropped.
import { type Ctx, json } from '../_lib/util';
import { recordFunnelEvent } from '../_lib/funnel';

export const onRequestPost = async ({ request, env }: Ctx) => {
  const origin = request.headers.get('Origin');
  const self = new URL(request.url).origin;
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (origin && origin !== self && !allowed.includes(origin)) return new Response(null, { status: 204 });
  const text = (await request.text().catch(() => '')).slice(0, 2000);
  let body: Record<string, unknown> = {};
  try { body = JSON.parse(text); } catch { return new Response(null, { status: 204 }); }
  await recordFunnelEvent(env, body, request.headers.get('User-Agent'));
  return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
};

export const onRequest = () => json({ ok: false, error: 'method_not_allowed' }, 405, { Allow: 'POST' });
