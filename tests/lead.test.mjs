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
  assert.equal(leadScore({ orderValue: '25-50k' }), 'A');
  assert.equal(leadScore({ orderValue: 'gt150k' }), 'A');
  assert.equal(leadScore({ orderValue: 'unknown' }), 'B');
  assert.equal(leadScore({ orderValue: 'lt10k' }), 'C');
  assert.equal(leadScore({ orderValue: 'bogus' }), 'C');
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

import { contactCheck } from '../src/lib/lead.js';
test('contact rule: WhatsApp only', () => {
  const c = contactCheck({ whatsapp: '+54 9 11 2345 6789', email: '' });
  assert.equal(c.ok, true);
  assert.equal(c.whatsapp, '+5491123456789');
  assert.equal(c.email, '');
});
test('contact rule: email only (WhatsApp left at the "+54 9 " prefill)', () => {
  const c = contactCheck({ whatsapp: '+54 9 ', email: ' compras@empresa.com.ar ' });
  assert.equal(c.ok, true);
  assert.equal(c.whatsapp, '');
  assert.equal(c.email, 'compras@empresa.com.ar');
});
test('contact rule: both', () => {
  const c = contactCheck({ whatsapp: '+54 9 351 412 3456', email: 'a@b.com' });
  assert.equal(c.ok, true);
  assert.equal(c.whatsapp, '+5493514123456');
  assert.equal(c.email, 'a@b.com');
});
test('contact rule: neither → contact error only', () => {
  for (const input of [{ whatsapp: '', email: '' }, { whatsapp: '+54 9 ', email: '  ' }, {}]) {
    const c = contactCheck(input);
    assert.equal(c.ok, false);
    assert.deepEqual(c.errors, { contact: 'missing' });
  }
});
test('contact rule: a filled but invalid field blocks, even if the other is valid', () => {
  assert.deepEqual(contactCheck({ whatsapp: '+54 9 11 2345', email: 'a@b.com' }).errors, { whatsapp: 'invalid' });
  assert.deepEqual(contactCheck({ whatsapp: '+54 9 11 2345 6789', email: 'a@b' }).errors, { email: 'invalid' });
});
