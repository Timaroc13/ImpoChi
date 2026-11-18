// End-to-end check of the quote form + funnel counters against a running site (local `wrangler pages dev`).
// Usage:
//   cp wrangler.example.toml wrangler.toml
//   npx wrangler d1 migrations apply DB --local && npm run build
//   npx wrangler pages dev --port 8788      (in another terminal)
//   BASE_URL=http://127.0.0.1:8788 ADMIN_PASSWORD=test-pass npm run test:e2e
// Needs Playwright (preinstalled in Claude cloud sessions; otherwise `npx playwright install chromium`).
const { chromium } = require('playwright');
const assert = require('node:assert/strict');

const BASE = process.env.BASE_URL || 'http://127.0.0.1:8788';
const AUTH = 'Basic ' + Buffer.from('x:' + (process.env.ADMIN_PASSWORD || 'test-pass')).toString('base64');

async function funnelRows() {
  const res = await fetch(`${BASE}/api/funnel.csv?view=rows`, { headers: { Authorization: AUTH } });
  assert.equal(res.status, 200, 'funnel.csv');
  const [head, ...lines] = (await res.text()).replace(/^﻿/, '').trim().split(/\r?\n/);
  const cols = head.split(',');
  return lines.filter(Boolean).map((l) => Object.fromEntries(l.split(',').map((v, i) => [cols[i], v])));
}
async function leads() {
  const res = await fetch(`${BASE}/api/leads.csv`, { headers: { Authorization: AUTH } });
  const [head, ...lines] = (await res.text()).replace(/^﻿/, '').trim().split(/\r?\n/);
  const cols = head.split(',');
  return lines.filter(Boolean).map((l) => Object.fromEntries(l.split(',').map((v, i) => [cols[i], v])));
}
const count = (rows, event, detail) => rows.filter((r) => r.event === event && (detail === undefined || r.detail === detail)).length;

async function openForm(page, path) {
  await page.goto(`${BASE}${path}`);
  await page.evaluate(() => { const c = document.getElementById('cookie-banner'); if (c) c.hidden = true; });
  // wrap ddTrack so we can see which events fired across the redirect to /gracias
  await page.evaluate(() => {
    const o = window.ddTrack;
    window.ddTrack = (n, p) => { sessionStorage.setItem('e2e_ev', (sessionStorage.getItem('e2e_ev') || '') + n + ','); o(n, p); };
  });
  return '#cotizar form';
}

(async () => {
  const before = await funnelRows();
  const leadsBefore = (await leads()).length;
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile/15E148' });

  // --- Page load 1 (/maquinaria): view, start, blocked ×3 (valor, contact, whatsapp), then success with email only
  const p = await ctx.newPage();
  const f = await openForm(p, '/maquinaria?utm_campaign=maquinaria&utm_term=e2e%20term');
  assert.equal(await p.inputValue(`${f} [name=rubro]`), 'maquinaria', 'rubro preselected');
  await p.click('main section [data-cta="hero-maquinaria"]');        // cta_click (hero)
  await p.evaluate(() => { const a = document.querySelector('main section [data-wa="hero-maquinaria"]'); a.removeAttribute('target'); a.addEventListener('click', (e) => e.preventDefault()); a.click(); }); // whatsapp_click (hero)
  await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight * 0.6)); // scroll_50
  await p.waitForTimeout(200);
  await p.locator(f).scrollIntoViewIfNeeded();
  await p.waitForTimeout(300);
  await p.click(`${f} [name=producto]`);
  await p.click(`${f} [data-submit]`);                               // blocked: valor_pedido
  await p.selectOption(`${f} [name=valor_pedido]`, '25-50k');
  await p.fill(`${f} [name=producto]`, 'E2E prueba: cajas impresas 5.000 unidades');
  await p.fill(`${f} [name=nombre]`, 'E2E Email');
  await p.check(`${f} [name=consentimiento]`);
  await p.click(`${f} [data-submit]`);                               // blocked: contact (neither)
  assert.match(await p.textContent(f), /Dejanos tu WhatsApp o tu email/, 'contact message shown');
  await p.fill(`${f} [name=whatsapp]`, '+54 9 11 2345');
  await p.click(`${f} [data-submit]`);                               // blocked: whatsapp (invalid)
  await p.fill(`${f} [name=whatsapp]`, '+54 9 ');
  await p.fill(`${f} [name=email]`, 'e2e-email@example.com');
  await p.evaluate(() => window.ddTurnstileError?.());                // turnstile_fail (widget) via the callback
  await Promise.all([p.waitForURL(/gracias/), p.click(`${f} [data-submit]`)]);
  const ev1 = await p.evaluate(() => sessionStorage.getItem('e2e_ev'));
  assert.match(ev1, /generate_lead/, 'generate_lead fired');

  // --- Page load 2 (/packaging): WhatsApp only, no empresa
  const p2 = await ctx.newPage();
  const f2 = await openForm(p2, '/packaging');
  assert.equal(await p2.inputValue(`${f2} [name=rubro]`), 'packaging');
  await p2.selectOption(`${f2} [name=valor_pedido]`, '10-25k');
  await p2.fill(`${f2} [name=producto]`, 'E2E prueba: bolsas kraft impresas');
  await p2.fill(`${f2} [name=nombre]`, 'E2E WhatsApp');
  await p2.fill(`${f2} [name=whatsapp]`, '+54 9 351 412 3456');
  await p2.check(`${f2} [name=consentimiento]`);
  await Promise.all([p2.waitForURL(/gracias/), p2.click(`${f2} [data-submit]`)]);

  // --- Page load 3 (/): no rubro preselected
  const p3 = await ctx.newPage();
  const f3 = await openForm(p3, '/');
  assert.equal(await p3.inputValue(`${f3} [name=rubro]`), '', 'no rubro on /');
  await b.close();

  await new Promise((r) => setTimeout(r, 500)); // beacons
  const rows = (await funnelRows()).slice(0, (await funnelRows()).length - before.length);
  const m = rows.filter((r) => r.path === '/maquinaria' && r.utm_campaign === 'maquinaria' && r.utm_term === 'e2e term');
  const expect = (cond, msg) => { assert.ok(cond, msg); console.log('ok -', msg); };
  expect(count(m, 'form_view') === 1, 'form_view once per page load');
  expect(count(m, 'form_start') === 1, 'form_start once per page load');
  expect(count(m, 'submit_pressed') === 1, 'submit_pressed de-duplicated per page load');
  expect(count(m, 'submit_blocked', 'valor_pedido') === 1, 'submit_blocked: valor_pedido');
  expect(count(m, 'submit_blocked', 'contact') === 1, 'submit_blocked: contact (neither WhatsApp nor email)');
  expect(count(m, 'submit_blocked', 'whatsapp') === 1, 'submit_blocked: whatsapp (invalid)');
  expect(count(m, 'turnstile_fail', 'widget') === 1, 'turnstile_fail: widget');
  expect(count(m, 'submit_success') === 1, 'submit_success (server-side, with campaign + term)');
  expect(m.every((r) => r.device === 'mobile'), 'device = mobile');
  expect(count(rows.filter((r) => r.path === '/packaging'), 'submit_success') === 1, 'submit_success on /packaging');
  expect(count(m, 'cta_click', 'hero-maquinaria') === 1, 'cta_click: hero-maquinaria (with campaign + term)');
  expect(count(m, 'whatsapp_click', 'hero-maquinaria') === 1, 'whatsapp_click: hero-maquinaria (with campaign + term)');
  expect(count(m, 'scroll_50') === 1, 'scroll_50 (with campaign + term)');

  const all = await leads();
  const newLeads = all.slice(0, all.length - leadsBefore);
  const em = newLeads.find((l) => l.nombre === 'E2E Email');
  const wa = newLeads.find((l) => l.nombre === 'E2E WhatsApp');
  expect(em && em.email === 'e2e-email@example.com' && em.whatsapp === '', 'lead with email only stored');
  expect(wa && wa.whatsapp === '+5493514123456' && wa.email === '' && wa.empresa === '', 'lead with WhatsApp only and no empresa stored');
  expect(em.utm_campaign === 'maquinaria' && em.utm_term === 'e2e term', 'lead keeps utm_campaign / utm_term');
  console.log('\nall e2e checks passed');
})().catch((e) => { console.error(e); process.exit(1); });
