// GET /api/leads.csv — every lead as CSV (opens in Excel / Google Sheets). HTTP Basic auth, password = ADMIN_PASSWORD.
import { type Ctx, checkAdmin } from '../_lib/util';

export const onRequestGet = async ({ request, env }: Ctx) => {
  const denied = checkAdmin(request, env);
  if (denied) return denied;
  const { results } = await env.DB.prepare(
    'SELECT id, created_at, estado, lead_score, rubro, producto, cantidad, valor_pedido, plazo, empresa, nombre, cargo, ri, cuit, whatsapp, email, provincia, experiencia, precio_objetivo, especificaciones, utm_source, utm_medium, utm_campaign, utm_term, gclid, landing_page, country, files, notas FROM leads ORDER BY created_at DESC',
  ).all<Record<string, unknown>>();
  const cols = results.length ? Object.keys(results[0]) : ['id'];
  const cell = (x: unknown) => {
    const s = x == null ? '' : String(x);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = '﻿' + [cols.join(','), ...results.map((r) => cols.map((c) => cell(r[c])).join(','))].join('\r\n');
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="leads-${new Date().toISOString().slice(0, 10)}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
};
