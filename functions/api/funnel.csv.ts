// GET /api/funnel.csv — funnel counts per day, page, campaign, keyword, device, event and detail.
// ?view=rows returns one line per event instead. HTTP Basic auth, password = ADMIN_PASSWORD.
import { type Ctx, checkAdmin } from '../_lib/util';

export const onRequestGet = async ({ request, env }: Ctx) => {
  const denied = checkAdmin(request, env);
  if (denied) return denied;
  const url = new URL(request.url);
  const since = /^\d{4}-\d{2}-\d{2}$/.test(url.searchParams.get('since') || '') ? url.searchParams.get('since')! : '2000-01-01';
  const rows = url.searchParams.get('view') === 'rows';
  const sql = rows
    ? 'SELECT created_at, event, path, utm_campaign, utm_term, device, detail FROM funnel_events WHERE created_at >= ? ORDER BY created_at DESC'
    : `SELECT substr(created_at, 1, 10) AS day, path, utm_campaign, utm_term, device, event, detail, COUNT(*) AS count
       FROM funnel_events WHERE created_at >= ?
       GROUP BY day, path, utm_campaign, utm_term, device, event, detail
       ORDER BY day DESC, path, utm_campaign, utm_term, device,
         CASE event WHEN 'form_view' THEN 1 WHEN 'form_start' THEN 2 WHEN 'submit_pressed' THEN 3
           WHEN 'submit_blocked' THEN 4 WHEN 'turnstile_fail' THEN 5 WHEN 'submit_success' THEN 6 END, detail`;
  const { results } = await env.DB.prepare(sql).bind(since).all<Record<string, unknown>>();
  const cols = results.length ? Object.keys(results[0]) : rows ? ['created_at', 'event', 'path', 'utm_campaign', 'utm_term', 'device', 'detail'] : ['day', 'path', 'utm_campaign', 'utm_term', 'device', 'event', 'detail', 'count'];
  const cell = (x: unknown) => {
    const s = x == null ? '' : String(x);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = '﻿' + [cols.join(','), ...results.map((r) => cols.map((c) => cell(r[c])).join(','))].join('\r\n');
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="funnel-${new Date().toISOString().slice(0, 10)}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
};
