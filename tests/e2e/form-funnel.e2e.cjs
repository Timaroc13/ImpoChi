// End-to-end check of the quote forms + funnel counters against a running site (local `wrangler pages dev`).
// Usage:
//   cp wrangler.example.toml wrangler.toml
//   npx wrangler d1 migrations apply DB --local
//   PUBLIC_WHATSAPP_NUMBER=85246632432 PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA npm run build
//   npx wrangler pages dev --port 8788 --binding TURNSTILE_SECRET=2x0000000000000000000000000000000AA   (other terminal)
//   BASE_URL=http://127.0.0.1:8788 ADMIN_PASSWORD=test-pass npm run test:e2e
// The test blocks challenges.cloudflare.com so the captcha errors like it did in production.
// Needs Playwright (preinstalled in Claude cloud sessions; otherwise `npx playwright install chromium`).
const { chromium } = require('playwright');
const assert = require('node:assert/strict');

const BASE = process.env.BASE_URL || 'http://127.0.0.1:8788';
const AUTH = 'Basic ' + Buffer.from('x:' + (process.env.ADMIN_PASSWORD || 'test-pass')).toString('base64');

async function csv(path) {
  const res = await fetch(`${BASE}${path}`, { headers: { Authorization: AUTH } });
  assert.equal(res.status, 200, path);
  const [cols, ...records] = parseCsv((await res.text()).replace(/^\uFEFF/, ''));
  return records.filter((r) => r.length > 1).map((r) => Object.fromEntries(r.map((v, i) => [cols[i], v])));
}
// RFC 4180: quoted fields may contain commas, quotes ("") and line breaks.
function parseCsv(text) {
  const rows = [[]];
  let cur = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"' && text[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') q = false;
      else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') { rows.at(-1).push(cur); cur = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      rows.at(-1).push(cur); cur = ''; rows.push([]);
    } else cur += ch;
  }
  rows.at(-1).push(cur);
  return rows;
}
const funnelRows = () => csv('/api/funnel.csv?view=rows');
const leads = () => csv('/api/leads.csv');
const count = (rows, event, detail) => rows.filter((r) => r.event === event && (detail === undefined || r.detail === detail)).length;
const expect = (cond, msg) => { assert.ok(cond, msg); console.log('ok -', msg); };

async function open(page, path) {
  await page.goto(`${BASE}${path}`);
  await page.evaluate(() => {
    const c = document.getElementById('cookie-banner'); if (c) c.hidden = true;
    const o = window.ddTrack;
    window.ddTrack = (n, p) => { sessionStorage.setItem('e2e_ev', (sessionStorage.getItem('e2e_ev') || '') + n + ','); o(n, p); };
  });
  return '#cotizar form';
}

(async () => {
  const funnelBefore = (await funnelRows()).length;
  const leadsBefore = (await leads()).length;
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile/15E148' });
  await ctx.route('https://challenges.cloudflare.com/**', (r) => r.abort()); // captcha fails, as in production

  // ---- 1. /maquinaria quick form: first screen events, blocked submits, then success with WhatsApp only
  const p = await ctx.newPage();
  const f = await open(p, '/maquinaria?utm_campaign=maquinaria&utm_term=e2e%20term');
  const tsScripts = () => p.evaluate(() => document.querySelectorAll('script[src*="challenges.cloudflare.com"]').length);
  assert.equal(await tsScripts(), 0, 'no captcha script on page load');
  assert.equal(await p.getAttribute(`${f} [name=rubro]`, 'type'), 'hidden');
  assert.equal(await p.inputValue(`${f} [name=rubro]`), 'maquinaria', 'rubro from the page');
  for (const gone of ['valor_pedido', 'nombre', 'empresa', 'email']) assert.equal(await p.locator(`${f} [name=${gone}]`).count(), 0, `no ${gone}`);
  await p.click('main section [data-cta="hero-maquinaria"]');
  await p.evaluate(() => { const a = document.querySelector('main section [data-wa="hero-maquinaria"]'); a.removeAttribute('target'); a.addEventListener('click', (e) => e.preventDefault()); a.click(); });
  await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight * 0.6));
  await p.waitForTimeout(200);
  await p.locator(f).scrollIntoViewIfNeeded();
  await p.waitForTimeout(300);
  await p.click(`${f} [name=producto]`);                                    // form_start + form_field_focus(producto)
  await p.waitForTimeout(300);
  assert.equal(await tsScripts(), 1, 'captcha script requested on form_start');
  await p.fill(`${f} [name=producto]`, 'Envasadora vertical, 30 paquetes/min');
  await p.click(`${f} [data-submit]`);                                      // blocked: whatsapp (only the +54 9 prefill)
  assert.match(await p.textContent(f), /Dejanos tu WhatsApp/, 'WhatsApp message shown');
  await p.fill(`${f} [name=whatsapp]`, '+54 9 11 2345');
  await p.click(`${f} [data-submit]`);                                      // blocked again: whatsapp invalid (same detail, de-duplicated)
  await p.fill(`${f} [name=whatsapp]`, '+54 9 376 412 3456');
  await p.click(`${f} [data-submit]`);                                      // blocked: consentimiento
  await p.check(`${f} [name=consentimiento]`);
  assert.equal(await p.evaluate(() => document.querySelector('[data-turnstile-slot]').hidden), true, 'failed captcha hidden');
  await Promise.all([p.waitForURL(/\/gracias$/), p.click(`${f} [data-submit]`)]);
  expect(/generate_lead/.test(await p.evaluate(() => sessionStorage.getItem('e2e_ev'))), 'quick form: generate_lead fired, landed on /gracias');

  // ---- 2. / quick form: no rubro on the page
  const p2 = await ctx.newPage();
  const f2 = await open(p2, '/');
  assert.equal(await p2.inputValue(`${f2} [name=rubro]`), '', 'no rubro on /');
  await p2.fill(`${f2} [name=whatsapp]`, '+54 9 351 412 3456');
  await p2.fill(`${f2} [name=producto]`, 'Bolsas kraft impresas');
  await p2.check(`${f2} [name=consentimiento]`);
  await Promise.all([p2.waitForURL(/\/gracias$/), p2.click(`${f2} [data-submit]`)]);

  // ---- 3. /cotizacion full form still works (email only)
  const p3 = await ctx.newPage();
  const f3 = await open(p3, '/cotizacion');
  await p3.selectOption(`${f3} [name=rubro]`, 'packaging');
  await p3.selectOption(`${f3} [name=valor_pedido]`, '25-50k');
  await p3.fill(`${f3} [name=producto]`, 'Cajas microcorrugado impresas 5.000 u.');
  await p3.fill(`${f3} [name=nombre]`, 'E2E Full');
  await p3.fill(`${f3} [name=whatsapp]`, '+54 9 ');
  await p3.fill(`${f3} [name=email]`, 'e2e-full@example.com');
  await p3.check(`${f3} [name=consentimiento]`);
  await Promise.all([p3.waitForURL(/\/gracias$/), p3.click(`${f3} [data-submit]`)]);
  await b.close();
  await new Promise((r) => setTimeout(r, 500));

  const all = await funnelRows();
  const rows = all.slice(0, all.length - funnelBefore);
  const m = rows.filter((r) => r.path === '/maquinaria' && r.utm_campaign === 'maquinaria' && r.utm_term === 'e2e term');
  expect(count(m, 'cta_click', 'hero-maquinaria') === 1, 'cta_click hero-maquinaria (campaign + term)');
  expect(count(m, 'whatsapp_click', 'hero-maquinaria') === 1, 'whatsapp_click hero-maquinaria');
  expect(count(m, 'scroll_50') === 1, 'scroll_50');
  expect(count(m, 'form_view') === 1 && count(m, 'form_start') === 1, 'form_view and form_start once');
  expect(count(m, 'form_field_focus', 'producto') === 1, 'form_field_focus: producto (first field touched)');
  expect(count(m, 'form_field_focus', 'whatsapp') === 1, 'form_field_focus: whatsapp');
  expect(count(m, 'form_field_focus', 'consentimiento') === 1, 'form_field_focus: consentimiento');
  expect(count(m, 'submit_pressed') === 1, 'submit_pressed de-duplicated per page load');
  expect(count(m, 'submit_blocked', 'whatsapp') === 1, 'submit_blocked: whatsapp');
  expect(count(m, 'submit_blocked', 'consentimiento') === 1, 'submit_blocked: consentimiento');
  expect(count(m, 'turnstile_fail', 'widget') === 1, 'turnstile_fail: widget, after form_start');
  expect(count(m, 'submit_success') === 1, 'submit_success (server-side)');
  expect(m.every((r) => r.device === 'mobile'), 'device = mobile');
  const ff = m.filter((r) => r.event === 'form_field_focus').map((r) => r.detail).reverse();
  expect(ff[0] === 'producto', `first field focused recorded first (${ff.join(' → ')})`);

  const allLeads = await leads();
  const fresh = allLeads.slice(0, allLeads.length - leadsBefore);
  const q1 = fresh.find((l) => l.whatsapp === '+5493764123456');
  const q2 = fresh.find((l) => l.whatsapp === '+5493514123456');
  const full = fresh.find((l) => l.nombre === 'E2E Full');
  expect(q1 && q1.rubro === 'maquinaria' && q1.nombre === '' && q1.email === '' && q1.valor_pedido === '' && q1.lead_score === 'B', 'quick lead stored: rubro from page, missing fields empty, score B');
  expect(q1.utm_campaign === 'maquinaria' && q1.utm_term === 'e2e term', 'quick lead keeps utm_campaign / utm_term');
  expect(q1.turnstile === 'unverified', 'quick lead flagged turnstile=unverified (captcha blocked)');
  expect(q2 && q2.rubro === '' && q2.producto === 'Bolsas kraft impresas', 'quick lead from / stored with empty rubro');
  expect(full && full.email === 'e2e-full@example.com' && full.valor_pedido === '25-50k', '/cotizacion full form lead stored');
  console.log('\nall e2e checks passed');
})().catch((e) => { console.error(e); process.exit(1); });
