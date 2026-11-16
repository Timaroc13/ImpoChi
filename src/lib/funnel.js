// Cookieless funnel counters: shared by the browser (QuoteForm) and the server (functions/api/funnel.ts).
// One row per event. No cookies, no IP, no form contents: only the event, the page path,
// utm_campaign / utm_term, device type and, for submit_blocked / turnstile_fail, a short reason.

export const FUNNEL_EVENTS = ['form_view', 'form_start', 'submit_pressed', 'submit_blocked', 'turnstile_fail', 'submit_success'];

/** Allowed `detail` values per event (anything else is dropped to ''). */
export const FUNNEL_DETAILS = {
  submit_blocked: ['rubro', 'valor_pedido', 'producto', 'nombre', 'whatsapp', 'email', 'contact', 'consentimiento'],
  turnstile_fail: ['widget', 'timeout', 'siteverify'],
};

/** Max events stored per page load (de-duplication also applies per event + detail). */
export const FUNNEL_MAX_PER_PAGELOAD = 20;

export function deviceFromUA(ua) {
  return /Mobi|Android|iPhone|iPod|Windows Phone/i.test(String(ua || '')) ? 'mobile' : 'desktop';
}

const clip = (s, n) => String(s ?? '').trim().slice(0, n);

/**
 * Validates an incoming event. Returns a clean row (without timestamp/device) or null.
 * `pv` is a random id generated per page load in the browser; it is used only to de-duplicate.
 */
export function sanitizeEvent(input) {
  if (!input || typeof input !== 'object') return null;
  const event = String(input.event || '');
  if (!FUNNEL_EVENTS.includes(event)) return null;
  const pv = String(input.pv || '');
  if (!/^[a-z0-9]{8,32}$/.test(pv)) return null;
  let path = clip(input.path, 200);
  if (!path.startsWith('/')) return null;
  path = path.split('?')[0].split('#')[0].replace(/\.html$/, '').replace(/\/index$/, '') || '/';
  const allowed = FUNNEL_DETAILS[event] || [];
  const detail = allowed.includes(input.detail) ? input.detail : '';
  return { event, pv, path, utm_campaign: clip(input.utm_campaign, 200), utm_term: clip(input.utm_term, 200), detail };
}

/** Random per-page-load id (not stored anywhere in the browser). */
export function newPageloadId() {
  const a = new Uint8Array(12);
  crypto.getRandomValues(a);
  return [...a].map((b) => (b % 36).toString(36)).join('');
}
