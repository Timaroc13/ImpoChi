import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeEvent, deviceFromUA, FUNNEL_EVENTS, newPageloadId } from '../src/lib/funnel.js';

const base = { pv: 'abc123def456', path: '/maquinaria', utm_campaign: 'maquinaria', utm_term: 'importar maquinaria de china' };

test('every funnel event is accepted with its context', () => {
  assert.deepEqual(FUNNEL_EVENTS, ['form_view', 'form_start', 'submit_pressed', 'submit_blocked', 'turnstile_fail', 'submit_success']);
  for (const event of FUNNEL_EVENTS) {
    const r = sanitizeEvent({ ...base, event });
    assert.equal(r.event, event);
    assert.equal(r.path, '/maquinaria');
    assert.equal(r.utm_campaign, 'maquinaria');
    assert.equal(r.utm_term, 'importar maquinaria de china');
    assert.equal(r.detail, '');
  }
});

test('submit_blocked keeps the blocking field; turnstile_fail keeps the reason', () => {
  for (const f of ['rubro', 'valor_pedido', 'producto', 'nombre', 'whatsapp', 'email', 'contact', 'consentimiento']) {
    assert.equal(sanitizeEvent({ ...base, event: 'submit_blocked', detail: f }).detail, f);
  }
  for (const reason of ['widget', 'timeout', 'siteverify']) {
    assert.equal(sanitizeEvent({ ...base, event: 'turnstile_fail', detail: reason }).detail, reason);
  }
  assert.equal(sanitizeEvent({ ...base, event: 'submit_blocked', detail: 'juan@x.com' }).detail, '');
  assert.equal(sanitizeEvent({ ...base, event: 'form_view', detail: 'nombre' }).detail, '');
});

test('unknown events, bad page-load ids and bad paths are rejected', () => {
  assert.equal(sanitizeEvent({ ...base, event: 'page_view' }), null);
  assert.equal(sanitizeEvent({ ...base, event: 'form_view', pv: 'x' }), null);
  assert.equal(sanitizeEvent({ ...base, event: 'form_view', pv: 'ABC!123456' }), null);
  assert.equal(sanitizeEvent({ ...base, event: 'form_view', path: 'https://evil.example/' }), null);
  assert.equal(sanitizeEvent(null), null);
});

test('paths are normalised and query strings dropped', () => {
  assert.equal(sanitizeEvent({ ...base, event: 'form_view', path: '/maquinaria.html?gclid=x' }).path, '/maquinaria');
  assert.equal(sanitizeEvent({ ...base, event: 'form_view', path: '/index.html' }).path, '/');
});

test('device type from user agent', () => {
  assert.equal(deviceFromUA('Mozilla/5.0 (Linux; Android 14; SM-A546E) Mobile Safari/537.36'), 'mobile');
  assert.equal(deviceFromUA('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)'), 'mobile');
  assert.equal(deviceFromUA('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130'), 'desktop');
  assert.equal(deviceFromUA(null), 'desktop');
});

test('page-load ids match the accepted format', () => {
  for (let i = 0; i < 50; i++) assert.match(newPageloadId(), /^[a-z0-9]{8,32}$/);
});
