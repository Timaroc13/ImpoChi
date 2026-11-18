// Browser side of the cookieless funnel (see src/lib/funnel.js). One random id per page load, kept
// only in memory; each event + detail is sent at most once per page load.
import { newPageloadId } from './funnel.js';

const PREVIEW = import.meta.env.PUBLIC_PREVIEW === '1';
const pv = newPageloadId();
const sent = new Set();

export const pageloadId = () => pv;

function attribution() {
  let attr = {};
  try { attr = JSON.parse(localStorage.getItem('dd_attr') || '{}'); } catch {}
  const q = new URLSearchParams(location.search);
  return (k) => q.get(k) || attr[k] || '';
}

export function sendFunnel(event, detail = '') {
  const key = `${event}:${detail}`;
  if (PREVIEW || sent.has(key)) return;
  sent.add(key);
  const get = attribution();
  const body = JSON.stringify({ event, detail, pv, path: location.pathname, utm_campaign: get('utm_campaign'), utm_term: get('utm_term') });
  try {
    if (!navigator.sendBeacon?.('/api/funnel', new Blob([body], { type: 'text/plain' }))) {
      fetch('/api/funnel', { method: 'POST', body, keepalive: true }).catch(() => {});
    }
  } catch {}
}
