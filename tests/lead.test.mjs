import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isValidCuit, normalizePhone, isValidEmail, leadScore, thankYouPath, waLink } from '../src/lib/lead.js';
import { fmtUSD, fmtNum } from '../src/lib/format.js';

test('CUIT: valid numbers pass, with or without dashes', () => {
  assert.equal(isValidCuit('30-50001091-2'), true); // well-known valid CUIT
  assert.equal(isValidCuit('30500010912'), true);
  assert.equal(isValidCuit('20-12345678-6'), true);
});

test('CUIT: wrong check digit, length or prefix fail', () => {
  assert.equal(isValidCuit('30-50001091-3'), false);
  assert.equal(isValidCuit('3050001091'), false);
  assert.equal(isValidCuit('11-50001091-2'), false);
  assert.equal(isValidCuit(''), false);
});

test('phone: Argentine mobile normalised to +54 9 …', () => {
  assert.deepEqual(normalizePhone('+54 9 11 2345 6789'), { ok: true, e164: '+5491123456789' });
  assert.deepEqual(normalizePhone('54 11 2345 6789'), { ok: true, e164: '+5491123456789' });
  assert.equal(normalizePhone('+54 9 11 2345').ok, false);
  assert.equal(normalizePhone('+852 9123 4567').ok, true);
  assert.equal(normalizePhone('').ok, false);
});

test('email', () => {
  assert.equal(isValidEmail('compras@empresa.com.ar'), true);
  assert.equal(isValidEmail('compras@empresa'), false);
});

test('lead score A/B/C', () => {
  assert.equal(leadScore({ ri: 'si', orderValue: '25-50k', timeline: 'lt3m' }), 'A');
  assert.equal(leadScore({ ri: 'si', orderValue: '25-50k', timeline: 'exploring' }), 'B');
  assert.equal(leadScore({ ri: 'no', orderValue: 'unknown', timeline: '3-6m' }), 'C');
  assert.equal(leadScore({ ri: 'nose', orderValue: 'lt10k', timeline: 'gt6m' }), 'C');
});

test('routing below minimum', () => {
  assert.equal(thankYouPath('lt10k'), '/gracias-chico');
  assert.equal(thankYouPath('unknown'), '/gracias');
});

test('wa.me link', () => {
  assert.equal(waLink('+54 9 11 0000-0000', 'Hola Octa'), 'https://wa.me/5491100000000?text=Hola%20Octa');
});

test('Argentine number format', () => {
  assert.equal(fmtUSD(48250), 'USD 48.250');
  assert.equal(fmtNum(1.98, 2), '1,98');
});

import { landedCost } from '../src/lib/landed.js';
test('landed cost matches the brief worked example', () => {
  const r = landedCost({ fob: 20000, freight: 1260, die: 0.18 });
  assert.equal(Math.round(r.base), 25725);
  assert.equal(Math.round(r.cashOut), 39658);
  assert.equal(Math.round(r.trueCost), 26925);
  assert.equal(r.costMultiple.toFixed(2), '1.35');
});
