import { sanitizeEvent, deviceFromUA, FUNNEL_MAX_PER_PAGELOAD } from '../../src/lib/funnel.js';
import type { Env } from './util';

/**
 * Stores one funnel event. Never throws: a missing table or a DB hiccup must not break the form or a lead.
 * Returns 'stored' | 'duplicate' | 'invalid' | 'capped' | 'error'.
 */
export async function recordFunnelEvent(env: Env, input: Record<string, unknown>, userAgent: string | null) {
  const ev = sanitizeEvent(input);
  if (!ev) return 'invalid';
  try {
    const n = await env.DB.prepare('SELECT COUNT(*) AS n FROM funnel_events WHERE pv = ?').bind(ev.pv).first<number>('n');
    if ((n ?? 0) >= FUNNEL_MAX_PER_PAGELOAD) return 'capped';
    const res = (await env.DB.prepare(
      'INSERT OR IGNORE INTO funnel_events (created_at, event, path, utm_campaign, utm_term, device, detail, pv) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    )
      .bind(new Date().toISOString(), ev.event, ev.path, ev.utm_campaign, ev.utm_term, deviceFromUA(userAgent), ev.detail, ev.pv)
      .run()) as { meta?: { changes?: number } };
    return res?.meta?.changes === 0 ? 'duplicate' : 'stored';
  } catch (e) {
    console.error('funnel insert failed', e);
    return 'error';
  }
}
